import { Request, Response, NextFunction } from "express"
import { transfer } from "../services/transfer.service"
import { generateRequestHash } from "../utils/idempotency"
import { pool } from "../db"
import { ApiError } from "../errors/ApiError"


export const createTransfer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // put them here

    const { senderWalletId, receiverWalletId, amount } = req.body
    const requestHash = generateRequestHash(senderWalletId, receiverWalletId, amount)
    const idempotencyKey = req.header('idempotency-key')

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
                const wallet = await pool.query(`
         
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
    

}