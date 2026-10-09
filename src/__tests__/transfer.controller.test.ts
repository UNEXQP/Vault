import { pool } from "../db"
import { createTransfer } from "../controllers/transfer.controller"
import { Request, Response } from "express"
import { ApiError } from "../errors/ApiError"
import { transfer } from "../services/transfer.service"


jest.mock("../db", () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn()
    }
}))

jest.mock("../services/transfer.service", () => ({
    transfer: jest.fn()
}))

// unauthorized transfer test



describe("this is meant to test unauthorized transfers", () => {

    test("official test for unauthorized transfers", async () => {
        jest.clearAllMocks()
        const next = jest.fn();


        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: [],
            rowCount: 0
        })

        const req = {
            body: {
                senderWalletId: 10,
                receiverWalletId: 20,
                amount: 4000
            },
            header: jest.fn().mockReturnValue("test-key"),
            userId: 7
        } as unknown as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response

        await createTransfer(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);

        const error = (next as jest.Mock).mock.calls[0][0]
        expect(error).toBeInstanceOf(ApiError)
        expect(error.statusCode).toBe(403)
        expect(error.message).toBe("this wallet does not belong to you")
        expect(transfer).not.toHaveBeenCalled()

    })

})