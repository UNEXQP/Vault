import { pool } from "./db";
import { ApiError } from "./errors/ApiError";

export const transfer = async (
    senderWalletId: number,
    receiverWalletId: number,
    amount: number,
    idempotencyKey: number,
    requestHash: number
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

        const idempotencyRecord = await client.query(

            `
                   INSERT INTO idempotency_keys (keys,request_hash)
                   VALUES ($1,$2)
                   ON CONFLICT(keys) DO NOTHING
                   RETURNING id

                   `,
            [idempotencyKey, requestHash]

        )

        //use on conflict to avoid db errors when the same idempotency key is used multiple times. If the key already exists, it will not insert a new record and will return an empty result set. This allows us to handle idempotent requests gracefully without causing duplicate transactions or errors in the database.

        // key already exists
        if (idempotencyRecord.rowCount === 0) {

            const existingRecord = await client.query(`
        SELECT key, request_hash, transfer_id
        FROM idempotency_keys
        WHERE key = $1
        FOR UPDATE
    `, [idempotencyKey])

            if (existingRecord.rows[0].request_hash !== requestHash) {
                throw new ApiError(
                    'Idempotency key has already been used for a different request',
                    409
                )
            }
        }


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
        const transfer = await client.query(`

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
            [senderWalletId, transfer.rows[0].id, 'debit', amount]
        )

        const creditLedger = await client.query(`

            INSERT INTO ledgers (wallet_id,transfer_id,transaction_type,amount)
            VALUES ($1,$2,$3,$4)
            `,
            [receiverWalletId, transfer.rows[0].id, 'credit', amount]
        )



        await client.query('COMMIT')

        return {
            transferId: transfer.rows[0].id,
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






