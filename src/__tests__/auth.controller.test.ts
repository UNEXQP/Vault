import { login, signup } from "../controllers/auth.controller"
import { login as loginService, signup as signupService } from "../services/auth.service"
import { Request, Response, NextFunction } from "express"
import { ApiError } from "../errors/ApiError"

jest.mock("../services/auth.service", () => ({
    login: jest.fn(),
    signup: jest.fn()
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
            new ApiError("login failed", 400)
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
                message: "login failed",
                statusCode: 400
            })
        )

        expect(res.status).not.toHaveBeenCalled()
        expect(res.json).not.toHaveBeenCalled()

    })

})


describe("this is for our signup tests", () => {

    test("should succesfully signup a user", async () => {

        (signupService as jest.Mock).mockResolvedValueOnce(7)

        const req = {
            body: {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "correct-password"
            }
        } as unknown as Request

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response

        const next = jest.fn();

        await signup(req, res, next)
        expect(res.status).toHaveBeenCalledWith(201)

        expect(res.json).toHaveBeenCalledWith({
            message: "user created successfully",
            userId: 7
        })

        expect(signupService).toHaveBeenCalledWith(
            "Test",
            "User",
            "test@example.com",
            "correct-password"
        )

    })

    test("waana test signup failure", async () => {

        // 

        (signupService as jest.Mock).mockClear()

        const next = jest.fn()

        const req = {
            body: {
                firstName: "Test",
                lastName: "User",
                password: "correct-password"
            }
        } as unknown as Request

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response



        await expect(signup(req, res, next)).rejects.toMatchObject({
            message: "pls fill in the required fields",
            statusCode: 400
        })

        expect(signupService).not.toHaveBeenCalled()

    })

    test("should pass signup service errors to next", async () => {

        (signupService as jest.Mock).mockClear()

       console.log("signupService:", signupService);

            (signupService as jest.Mock).mockRejectedValueOnce(
                new ApiError("database error", 500)
            )

        const req = {
            body: {
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "correct-password"
            }
        } as unknown as Request

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response

        const next = jest.fn()

        await signup(req, res, next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "database error",
                statusCode: 500
            })
        )
        expect(res.status).not.toHaveBeenCalled()
        expect(res.json).not.toHaveBeenCalled()
        expect(signupService).toHaveBeenCalledWith(
            "Test",
            "User",
            "test@example.com",
            "correct-password"
        )
    })

})