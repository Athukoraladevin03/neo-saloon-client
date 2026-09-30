import { NextRequest } from "next/server";
import * as jose from "jose";
import { RequestUserType } from "@/types/requestUser";

export async function getUser(request : NextRequest) : Promise < RequestUserType | null > {

        const loginToken = request.cookies.get("Login-token")?.value
    
        const secretText = process.env.JOSE_SECRET

        const secret = new TextEncoder().encode(secretText);

    try {
    
        const tokenData  = await jose.jwtVerify(
            loginToken||"",
            secret
        )

        const user = tokenData.payload as unknown as RequestUserType

        return user
    
    }catch{

        return null
    }

}

export async function isPrivilaged(request : NextRequest, privilage : string) : Promise < boolean > {

    const User = await getUser(request)

    if(User == null){
         return false
    }

    if(User.privilages.includes(privilage)) {
        return true
    }else{
        return false
    }   

}