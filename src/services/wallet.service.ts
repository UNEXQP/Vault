import { pool } from "../db"

export const createWallet = async (
    userId: number,
    currencyId: number



) => {

    const client = await pool.connect()

    try {
        const wallet = await client.query(
            `
            INSERT INTO wallets (user_id, currency_id, balance)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, currency_id, balance, created_at
            `,
            [userId, currencyId, 0]
        )

        return wallet.rows[0]

    } finally {
        client.release()
    }
}