import express from 'express'
import { transfer } from './transaction'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        message: 'VAULT API is running'
    })
})

app.post('/transfers', async (req, res, next) => {
    const { senderWalletId, receiverWalletId, amount } = req.body

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

        

        const result = await transfer(
            senderWalletId, receiverWalletId, amount
        )


        res.status(200).json({ message: "transfer processed succesfully", result })
    } catch (error) {
        next(error)
    }

})

app.use(errorHandler) // registering the middleware

app.listen(3000, () => {
    console.log('VAULT API running on port 3000')
})