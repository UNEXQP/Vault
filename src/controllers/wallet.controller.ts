import { Request, Response, NextFunction } from "express";
import { createWallet as createWalletService } from "../services/wallet.service"

export const createWallet = async (req: Request, res: Response, next: NextFunction) => {

    const { currencyId } = req.body

    try {
        const wallet = await createWalletService(req.userId, currencyId)

        res.status(201).json({
            message: "wallet created successfully",
            wallet
        })

    } catch (error) {
        next(error)
    }
}