import { login } from "../controllers/auth.controller"
import { login as loginService } from "../services/auth.service"
import { Request, Response, NextFunction } from "express"


jest.mock("../services/auth.service", () => ({
    login: jest.fn()
}))


describe("this is meant to test the login function", () => {

    test("official test for the login function", async () => {

        (loginService as jest.Mock).mockResolvedValueOnce({
            userId: 7,
            token: "fake-jwt-token"
        })

        const next = jest.fn();

        const req = {
            body: {
                email: "test@example.com",
                password: "correct-password"
            },
        } as unknown as Request

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response

        await login(req, res, next)
        expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith({
            message: "login successful",
            logId: 7,
            token: "fake-jwt-token"
        })

        expect(loginService).toHaveBeenCalledWith(
            "test@example.com",
            "correct-password"
        )

    })

    test("should pass login errors to next", async () => {

        (loginService as jest.Mock).mockRejectedValueOnce(
            new Error("login failed")
        )

        const next = jest.fn();

        const req = {
            body: {
                email: "test@example.com",
                password: "wrong-password"
            }
        } as unknown as Request

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response

        await login(req, res, next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "login failed"
            })
        )


    })

})