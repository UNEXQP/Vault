import { Router } from "express"
import { pool } from "../db"
import { ApiError } from "../errors/ApiError"
import { authMiddleware } from "../auth/middleware"
import { createWallet } from "../controllers/wallet.controller"

export const walletRouter = Router()

walletRouter.post("/", authMiddleware, createWallet)