import { pool } from "./db";
import { ApiError } from "./errors/ApiError";


export const transfer = async (
    senderWalletId: number,
    receiverWalletId: number,
    amount: number,
    idempotencyKey: string,
    requestHash: string
) => {

    if (amount <= 0) {
        throw new ApiError('Amount must be greater than zero', 400)
    }

    if (senderWalletId === receiverWalletId) {
        throw new ApiError('Cannot transfer money to the same wallet', 400)
    }

    if (!Number.isFinite(amount)) {
        throw new ApiError('Amount must be finite', 400)
    }

    if (
        !Number.isInteger(senderWalletId) ||
        !Number.isInteger(receiverWalletId) ||
        senderWalletId <= 0 ||
        receiverWalletId <= 0
    ) {
        throw new ApiError('Invalid wallet ID', 400)
    }



const client = await pool.connect()


    try {
        await client.query('BEGIN')



        const idempotencyRecord = await client.query(

            `
                   INSERT INTO idempotency_keys (key,request_hash)
                   VALUES ($1,$2)
                   ON CONFLICT(key) DO NOTHING
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

            if (existingRecord.rows[0].transfer_id) {
                // this is to ask if the original operation actually completed successfully. If it did, we can return the cached result. If it didn't, we throw an error to indicate that the request is still being processed.
                // already completed — return the cached result, this IS the idempotent replay
                // if the request happened give me the details of the transfer that happened
                const originalTransfer = await client.query(`
        SELECT id, sender_wallet_id, receiver_wallet_id, ammount
        FROM transfers
        WHERE id = $1
    `, [existingRecord.rows[0].transfer_id]

                )


                await client.query('COMMIT') // nothing to roll back, just release the lock

                // return the same result so the client gets the same result it got from the first request
                return {
                    transferId: originalTransfer.rows[0].id,
                    senderWalletId: originalTransfer.rows[0].sender_wallet_id,
                    receiverWalletId: originalTransfer.rows[0].receiver_wallet_id,
                    amount: originalTransfer.rows[0].ammount
                }
            } else {
                // key claimed but never finished — genuinely still in flight, or a prior attempt died mid-transaction
                throw new ApiError('Idempotent request is still being processed', 409)
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

        await client.query(`
    UPDATE idempotency_keys
    SET transfer_id = $1
    WHERE key = $2
`, [transfer.rows[0].id, idempotencyKey])

        await client.query(`

            INSERT INTO ledgers (wallet_id,transfer_id,transaction_type,amount)
            VALUES ($1,$2,$3,$4)
            `,
            [senderWalletId, transfer.rows[0].id, 'debit', amount]
        )

        await client.query(`

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
