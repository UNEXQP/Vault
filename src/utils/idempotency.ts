import crypto from 'crypto'
import { json } from 'express'

export const generateRequestHash = (senderWalletId: number, receiverWalletId: number, amount: number) => {
    
    const requestData = JSON.stringify({
        senderWalletId, receiverWalletId, amount
    })

    return crypto.createHash('sha256').update(requestData).digest('hex')

}