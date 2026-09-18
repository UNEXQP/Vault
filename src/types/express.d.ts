import { ApiError } from "../errors/ApiError"
import { Jwt } from "jsonwebtoken"

type JwtPayload={

    userId:number

}

const authHeader = req.header("Authorization")

if(!authHeader){
    throw new ApiError ("authentication required",401)
}

const token = authHeader.split(" ")[1]

const decoded = j

