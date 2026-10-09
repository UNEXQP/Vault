import express from 'express'
import { errorHandler } from './middleware/errorHandler'


import { authRouter } from './routes/auth.routes'
import { transferRouter } from './routes/transfer.routes'
import { walletRouter } from "./routes/wallet.routes"

const app = express()


  
app.use(express.json())
app.use("/auth", authRouter)
app.use("/transfers",transferRouter)
app.use("/wallets", walletRouter)

app.get('/', (req, res) => {
    res.json({
        message: 'VAULT API is running'
    })
})














app.use(errorHandler) // registering the middleware

app.listen(3000, () => {
    console.log('VAULT API running on port 3000')
})