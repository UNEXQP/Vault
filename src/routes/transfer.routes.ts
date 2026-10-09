import { Router } from "express"
import { transfer } from "../services/transfer.service"
import { generateRequestHash } from "../utils/idempotency"
import { pool } from "../db"
import { ApiError } from "../errors/ApiError"
import { authMiddleware } from "../auth/middleware" 
import { createTransfer } from "../controllers/transfer.controller"

export const transferRouter = Router()

transferRouter.post("/", authMiddleware, createTransfer)