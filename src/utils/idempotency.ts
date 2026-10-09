import crypto from 'crypto'





//create a function that receives the sender and receuver wallet id and hashes it

export const generateRequestHash = (senderWalletId: number, receiverWalletId: number, amount: number) => { 

    const requestData=JSON.stringify({
        senderWalletId,receiverWalletId,amount
    })

    return crypto.createHash('sha256').update(requestData).digest('hex')

}