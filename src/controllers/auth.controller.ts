import { Request, Response, NextFunction } from "express"
import { ApiError } from "../errors/ApiError"
import { createToken } from "../auth/token"
import { comparePassword } from "../auth/password"
import { signup as signupService, login as loginService } from "../services/auth.service"

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    // signup logic here

    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
        throw new ApiError("pls fill in the required fields", 400)
    }

    try {




        const userId = await signupService(
            firstName,
            lastName,
            email,
            password
        )

        res.status(201).json({
            message: 'user created successfully',
            userId
        })
    } catch (error) {
        next(error)
    }

}

export const login = async (req: Request, res: Response, next: NextFunction) => {

    const { email, password } = req.body



    try {

        const result = await loginService(email, password)

        res.status(200).json({
            message: "login successful",
            logId: result.userId,
            token: result.token
        })

    } catch (error) {
        next(error)
    } 

}