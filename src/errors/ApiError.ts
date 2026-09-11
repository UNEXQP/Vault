// export class ApiError extends Error {

//     statusCode: number

//     constructor(message: string, statusCode: number) {
//         super(message)

//         this.name = 'ApiError' // what is ApiError
//         this.statusCode = statusCode
//     }
// }


export class ApiError extends Error {

    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)

        this.name = 'ApiError'
        this.statusCode = statusCode
    }

}