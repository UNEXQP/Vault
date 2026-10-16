import jwt from "jsonwebtoken"

const jwtSecret = process.env.JWT_SECRET

export const createToken = (userId: number) => {
    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined")
    }
    
    return jwt.sign(
        { userId }, jwtSecret, { expiresIn: "1h" }
    )
}