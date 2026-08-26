import { pool } from "./db";
import { ApiError } from "./errors/ApiError";

export const transfer = async (
    senderWalletId: number,
    receiverWalletId: number,
    amount: number
) => {

    if (amount <= 0) {
        return 'Amount must be greater than zero'
    }

    if (senderWalletId === receiverWalletId) {
        return 'Cannot transfer money to the same wallet'
    }

    if (!Number.isFinite(amount)) {
        return 'Amount must be finite'
    }

    if (
        !Number.isInteger(senderWalletId) ||
        !Number.isInteger(receiverWalletId) ||
        senderWalletId <= 0 ||
        receiverWalletId <= 0
    ) {
        return 'Invalid wallet ID'
    }



    const client = await pool.connect()


    try {
        await client.query('BEGIN')

        const lockedWallets = await client.query(`
            
            SELECT id,balance
            FROM wallets
            WHERE id IN ($1,$2)
            ORDER BY id 
            FOR UPDATE
            
            `,
            [senderWalletId, receiverWalletId]
        )

        if (lockedWallets.rowCount !== 2) {
            throw new ApiError('One or both wallets do not exist', 404)
        }

        console.log(lockedWallets.rows)

        const debitTransfer = await client.query(`
           
            UPDATE wallets 
            SET balance = balance - $1 
            WHERE id = $2
            AND 
            balance>=$1
            RETURNING id,balance
            `,
            [amount, senderWalletId]
        )


        if (debitTransfer.rowCount === 0) {
            throw new ApiError('Insufficient balance', 400)
        }

        console.log(debitTransfer.rows)




        const creditTransfer = await client.query(`
            
            UPDATE wallets 
            SET balance = balance + $1 
            WHERE id = $2
            RETURNING id,balance

            `,
            [amount, receiverWalletId]
        )

        console.log(creditTransfer.rows)

        if (creditTransfer.rowCount === 0) {
            throw new ApiError('Transaction could not be completed', 500)
        }
        const createTransfer = await client.query(`
         
            INSERT INTO transfers (sender_wallet_id,receiver_wallet_id,ammount)
            VALUES($1,$2,$3)
            RETURNING id
            `,
            [senderWalletId, receiverWalletId, amount]
        )

        const debitLedger = await client.query(`
          
            INSERT INTO ledgers (wallet_id,transfer_id,transaction_type,amount)
            VALUES ($1,$2,$3,$4)
            `,
            [senderWalletId, createTransfer.rows[0].id, 'debit', amount]
        )

        const creditLedger = await client.query(`
          
            INSERT INTO ledgers (wallet_id,transfer_id,transaction_type,amount)
            VALUES ($1,$2,$3,$4)
            `,
            [receiverWalletId, createTransfer.rows[0].id, 'credit', amount]
        )



        await client.query('COMMIT')

        return {
            transferId: createTransfer.rows[0].id,
            senderWalletId,
            receiverWalletId,
            amount
        }

    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Transfer failed:', error)

        throw error

    }
    finally {
        client.release()
    }

}

