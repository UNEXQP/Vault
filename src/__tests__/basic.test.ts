import { comparePassword, hashPassword } from "../auth/password"
import { ApiError } from "../errors/ApiError"
import { pool } from "../db"
import { signup } from "../services/auth.service"
import { transfer } from "../services/transfer.service"

//tobe




jest.mock("../db", () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn()
    }
}))

describe("password test", () => {

    test("hash password test", async () => {

        const hash = await hashPassword("hello")
        const result = await comparePassword("hello", hash)
        expect(result).toBe(true)
    })

    test("should make sure the hash is correct", async () => {

        const hash = await hashPassword("hello")
        const result = await comparePassword(hash, "hello")
        expect(hash).not.toBe("hello")

    })


})

//tothrow

test("apiError test", async () => {

    expect(() => {
        throw new ApiError("something went wrong", 400)

    }).toThrow("something went wrong")

    const error = new ApiError("something went wrong", 400)
    expect(error.statusCode).toBe(400)



})



const fakeFunction = jest.fn()

fakeFunction()
fakeFunction()

expect(fakeFunction).toHaveBeenCalledTimes(2)

//using mock return value we can say whenever this fake function is called give back this value

//signup and login

describe("were going to test the signup", () => {

    it("should be used to test the sign up", () => {

        const fakeGetUser = jest.fn().mockReturnValue("Rotimi")

        const result = fakeGetUser()

        expect(result).toBe("Rotimi")







    })

    test("signup returns created userId", async () => {

        const fakeClient = {

            query: jest.fn().mockResolvedValue({
                rows: [
                    { id: 7 }
                ]
            }),
            release: jest.fn()

        }

        pool.connect = jest.fn().mockResolvedValue(fakeClient)

        const result = await signup(
            "Rotimi",
            "Anfela",
            "rotimi@test.com",
            "hello"
        )

        expect(result).toBe(7)
        expect(fakeClient.query).toHaveBeenCalledTimes(1)
        expect(fakeClient.release).toHaveBeenCalledTimes(1)

    })

})

describe("were going to test the login", () => { 

    

})

// how do we use jest to protect vaults actual buisness rules


describe("were going to test the transfer function", () => {


    test("fake transfer test", async () => {

        const fakeTransferClient = {
            query: jest.fn()
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [], rowCount: 1 })
                .mockResolvedValueOnce({
                    rows: [
                        { id: 1, amount: 50000 },
                        { id: 2, amount: 20000 }
                    ],
                    rowCount: 2
                })
                .mockResolvedValueOnce({
                    rows: [
                        { id: 1, amount: 40000 }
                    ],
                    rowCount: 1
                })
                .mockResolvedValueOnce({
                    rows: [
                        { id: 2, amount: 30000 }
                    ],
                    rowCount: 1
                })
                .mockResolvedValueOnce({
                    rows: [{
                        id: 100
                    }],

                })
                .mockResolvedValueOnce({
                    rows: []
                })
                .mockResolvedValueOnce({
                    rows: []
                })
                .mockResolvedValueOnce({
                    rows: []
                })
                .mockResolvedValueOnce({
                    rows: []
                }),

            release: jest.fn()


        }

        pool.connect = jest.fn().mockResolvedValue(fakeTransferClient)

        const result = await transfer(1, 2, 3000, "test-key", "test-hash")

        expect(result).toEqual({

            transferId: 100, senderWalletId: 1, receiverWalletId: 2, amount: 3000

        })



    })


})


describe("were going to test the insufficient balance function", () => {


    test("fake insufficient balance test", async () => {



        const fakeInsufficientClient = {
            query: jest.fn()
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [], rowCount: 1 })
                .mockResolvedValueOnce({
                    rows: [
                        { id: 1, balance: 10000 },
                        { id: 2, balance: 20000 }
                    ],
                    rowCount: 2
                })
                .mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0
                })
                .mockResolvedValueOnce({
                    rows: []
                })
            ,

            release: jest.fn()

        }

        pool.connect = jest.fn().mockResolvedValue(fakeInsufficientClient)

        const result = transfer(1, 2, 40000, "test-key", "test-hash")

        await expect(result).rejects.toThrow("Insufficient balance")
        expect(fakeInsufficientClient.query).toHaveBeenCalledWith("ROLLBACK")
        expect(fakeInsufficientClient.release).toHaveBeenCalledTimes(1)


    })







})



describe("this is is a test for nonexistentwallets", () => {

    test("no wallet test", async () => {
        const fakeWwalletClient = {
            query: jest.fn()
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [], rowCount: 1 })
                .mockResolvedValueOnce({

                    rows: [

                        { id: 2, amount: 40000 },

                    ],

                    rowCount: 1

                })
                .mockResolvedValueOnce({
                    rows: []
                }),

            release: jest.fn()

        }

        pool.connect = jest.fn().mockResolvedValueOnce(fakeWwalletClient)

        const result = transfer(100, 2, 10000, "test-key", "test-hash")

        await expect(result).rejects.toThrow('One or both wallets do not exist')
        expect(fakeWwalletClient.query).toHaveBeenCalledWith("ROLLBACK")
        expect(fakeWwalletClient.release).toHaveBeenCalledTimes(1)

    })
})



describe("this is the idempotency test", () => {

    test("idempotency test", async () => {

        const idemTest = {

            query: jest.fn()
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({
                    rows: [],
                    rowCount: 0
                })
                .mockResolvedValueOnce({
                    rows: [

                        { id: 1, key: "test-key", request_hash: "test-hash", transfer_id: 100 }

                    ]
                })
                .mockResolvedValueOnce({
                    rows: [{
                        id: 100,
                        sender_wallet_id: 1,
                        receiver_wallet_id: 2,
                        ammount: 40000
                    }]
                })
                .mockResolvedValue({
                    rows: []
                }),

            release: jest.fn()

        }

        pool.connect = jest.fn().mockResolvedValue(idemTest)

        const result = await transfer(1, 2, 40000, "test-key", "test-hash")
        expect(result).toEqual({
            transferId: 100,
            senderWalletId: 1,
            receiverWalletId: 2,
            amount: 40000
        })
        expect(idemTest.release).toHaveBeenCalledTimes(1)

    })

})


describe("this is to test the idempotency failure", () => {

    test("for the idempotency failure", async () => {

        const idempfailureTest = {

            query: jest.fn()
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [], rowCount: 0 })
                .mockResolvedValueOnce({
                    rows: [
                        {
                            id: 1, key: "test-key", request_hash: "original-hash", transfer_id: 2
                        }
                    ]
                })
                .mockResolvedValueOnce({ rows: [] }),

            release: jest.fn()

        }

        pool.connect = jest.fn().mockResolvedValue(idempfailureTest)

        const result = transfer(1, 2, 4000, "test-key", "test-hash")

        await expect(result).rejects.toThrow('Idempotency key has already been used for a different request')
        expect(idempfailureTest.query).toHaveBeenCalledWith("ROLLBACK")
        expect(idempfailureTest.release).toHaveBeenCalledTimes(1)
    })

})

