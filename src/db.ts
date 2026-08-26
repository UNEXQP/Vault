import { Pool } from "pg";
import { configDotenv } from "dotenv";

configDotenv()


export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE === "production" ? { rejectUnauthorized: false } : false
})

pool.connect((err, client, release) => {

    if (err) {
        console.log('database conection failed')
        process.exit(1)
    } else {
        console.log('database conected')
        release()
    }

})

