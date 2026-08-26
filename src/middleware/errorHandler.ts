import { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/ApiError";



export const errorHandler = (
    error: unknown, req: Request, res: Response, next: NextFunction
) => {

    if (error instanceof ApiError) {
      return  res.status(error.statusCode).json({ message: error.message })
    }

    return res.status(500).json({ message: "internal server error" })

}