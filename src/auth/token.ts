import jwt from "jsonwebtoken"

const jwtSecret = process.env.JWT_SECRET

export const createToken =  (userId: number) => { 
    return jwt.sign(
        {userId},jwtSecret,{expiresIn:"1h"}
    )
}