import express from 'express'
import { transfer } from './transaction'
import { errorHandler } from './middleware/errorHandler'
import { generateRequestHash } from './utils/idempotency'
import { hashPassword } from './auth/password'
import { pool } from './db'
import { ApiError } from './errors/ApiError'
import { comparePassword } from './auth/password'
import { createToken } from './auth/token'
import { authMiddleware } from './auth/middleware'

const app = express()



app.use(express.json())
app.use(errorHandler)

app.get('/', (req, res) => {
    res.json({
        message: 'VAULT API is running'
    })
})

app.get("/protected", authMiddleware, (req, res) => {
    res.json({ userId: req.userId })
})



app.post('/signup', async (req, res, next) => {

    const client = await pool.connect()

    try {


        const { firstName, lastName, email, password } = req.body
        const passwordHash = await hashPassword(password)

        const saveUser = await client.query(`
     
        INSERT INTO users (first_name,last_name,email,password_hash)
        VALUES($1,$2,$3,$4)
        RETURNING id
        
        `,
            [firstName, lastName, email, passwordHash]

        )

        res.status(201).json({
            message: 'user created successfully',
            userId: saveUser.rows[0].id
        })
    } catch (error) {
        next(error)
    } finally {
        client.release()

    }



})

app.post("/login", async (req, res, next) => {

    const { email, password } = req.body

    const client = await pool.connect()

    try {
        const logUser = await client.query(`
      
        SELECT id,first_name,last_name,email,password_hash
        FROM users
        WHERE email=$1
        
        `,
            [email]
        )

        if (logUser.rows.length === 0) {
            throw new ApiError("login failed", 400)
        }

        const userPasswordHash = logUser.rows[0].password_hash

        const passwordVerification = await comparePassword(password, userPasswordHash)

        if (!passwordVerification) {
            throw new ApiError("login failed", 400)
        }

        const token = createToken(logUser.rows[0].id)





        res.status(200).json({ message: "login sucesful", logId: logUser.rows[0].id, token: token })
    } catch (error) {
        next(error)
    } finally {
        client.release()
    }

})


app.post('/transfers', authMiddleware, async (req, res, next) => {
    const { senderWalletId, receiverWalletId, amount } = req.body
    const requestHash = generateRequestHash(senderWalletId, receiverWalletId, amount)
    const idempotencyKey = req.header('idempotency-key')

    const client = await pool.connect()

    if (!idempotencyKey) {
        return res.status(400).json({ message: "idempotency key header is required" })
    }

    if ((!Number.isInteger(senderWalletId) || !Number.isInteger(receiverWalletId)) || (senderWalletId <= 0 || receiverWalletId <= 0)) {

        return res.status(400).json({ message: 'number must be an integer and greater than zero' })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: ' amount must be finite or greater than zero ' })
    }

    if (senderWalletId === receiverWalletId) {
        return res.status(400).json({ message: ' sender and receiver cannot be the same ' })
    }



    try {

        const wallet = await client.query(`
         
            SELECT id,user_id
            FROM wallets
            WHERE id = $1
            AND user_id=$2
            `, [senderWalletId, req.userId])

        if (wallet.rows.length === 0) {
            throw new ApiError("this wallet does not belong to you", 403)
        }

        const result = await transfer(
            senderWalletId, receiverWalletId, amount, idempotencyKey, requestHash
        )


        res.status(200).json({ message: "transfer processed succesfully", result })
    } catch (error) {
        next(error)
    }

})

app.post("/wallets", authMiddleware, async (req, res, next) => {

    const { currencyId } = req.body


    const client = await pool.connect()

    try {

        const createWallet = await client.query(
            `
    INSERT INTO wallets (user_id, currency_id, balance)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, currency_id, balance, created_at
    `,
            [req.userId, currencyId, 0]
        )

        res.status(201).json({
            message: "wallet created successfully",
            wallet: createWallet.rows[0]
        })

    } catch (error) {
        next(error)
    } finally {
        client.release()
    }

})

app.use(errorHandler) // registering the middleware

app.listen(3000, () => {
    console.log('VAULT API running on port 3000')
})