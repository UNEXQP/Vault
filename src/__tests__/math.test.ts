


const add = (a: number, b: number) => {
    return a + b
}

//jest dont throw errors they report failed tests


describe("an addition funtion test", () => {

    it("should return the correct sum of the no.", () => { 

        expect(add(2,4)).toBe(6)

    })

    it("should return the correct sum of the no.", () => { 

        expect(add(10,5)).toBe(15)

    })

})