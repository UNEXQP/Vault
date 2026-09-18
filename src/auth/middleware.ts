import { Request, Response, NextFunction } from "express"
import { ApiError } from "../errors/ApiError"
import jwt from "jsonwebtoken"



type JwtPayload = {
    userId: number
}

const jwtSecret = process.env.JWT_SECRET


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.header("Authorization")

    if (!authHeader) {
        throw new ApiError("authentication required", 401)
    }

    if (
        authHeader.split(" ")[0] !== "Bearer" ||
        authHeader.split(" ")[1] === undefined
    ) {
        throw new ApiError("invalid authorization header", 401)
    }

    try {
        const token = authHeader.split(" ")[1]



        const decoded = jwt.verify(token, jwtSecret) as JwtPayload

        req.userId = decoded.userId
        next()
    } catch (error) {
        next( new ApiError("invalid token",401))
    }



} 


