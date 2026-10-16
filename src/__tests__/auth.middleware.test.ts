process.env.JWT_SECRET = "test-secret"
import { authMiddleware } from "../auth/middleware"
import { Request, Response, NextFunction } from "express"
import { ApiError } from "../errors/ApiError"
import jwt from "jsonwebtoken"


test("should reject requests without an authorization header", () => {
    const req = {
        header: jest.fn().mockReturnValue(undefined)
    } as unknown as Request

    const res = {} as Response
    const next = jest.fn() 

    // Call authMiddleware and check the thrown error here

    try {
        authMiddleware(req, res, next)
        fail("Expected middleware to throw")
    } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({
            message: "authentication required",
            statusCode: 401
        })
    }

    expect(next).not.toHaveBeenCalled()

})


test("should reject malformed authorization headers", () => {
    const req = {
        header: jest.fn().mockReturnValue("Basic abc123")
    } as unknown as Request

    const res = {} as Response
    const next = jest.fn()

    // Call authMiddleware and check the thrown error here

    try {
        authMiddleware(req, res, next)
        fail("Expected middleware to throw")
    } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({
            message: "invalid authorization header",
            statusCode: 401
        })
    }

    expect(next).not.toHaveBeenCalled()

})

test("should reject an invalid token", () => {
    const req = {
        header: jest.fn().mockReturnValue("Bearer invalid.token.here")
    } as unknown as Request

    const res = {} as Response
    const next = jest.fn()

    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
            message: "invalid token",
            statusCode: 401
        })
    )
})

test("should accept a valid token", () => {
    const token = jwt.sign(
        { userId: 7 },
        process.env.JWT_SECRET!
    )

    const req = {
        header: jest.fn().mockReturnValue(`Bearer ${token}`)
    } as unknown as Request & { userId?: number }

    const res = {} as Response
    const next = jest.fn()

    authMiddleware(req, res, next)

    console.log("next called:", next.mock.calls)

    expect(req.userId).toBe(7)
    expect(next).toHaveBeenCalledWith()
})