import { hashPassword, comparePassword } from "../auth/password"
import { pool } from "../db"
import { ApiError } from "../errors/ApiError"
import { createToken } from "../auth/token"



export const signup = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
) => {

    const client = await pool.connect()

    const passwordHash = await hashPassword(password)

    try {
        const saveUser = await client.query(`
    INSERT INTO users (first_name,last_name,email,password_hash)
    VALUES($1,$2,$3,$4)
    RETURNING id
`, [firstName, lastName, email, passwordHash])

        return saveUser.rows[0].id
    } finally {
        client.release()
    }

}


export const login = async (
    email: string,
    password: string
) => {


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


        const passwordVerification = await comparePassword(
            password,
            userPasswordHash
        )

        if (!passwordVerification) {
            throw new ApiError("login failed", 400)
        }

        const token = createToken(logUser.rows[0].id)

        return {
            userId: logUser.rows[0].id,
            token
        }


    } finally {
        client.release()
    }

}

