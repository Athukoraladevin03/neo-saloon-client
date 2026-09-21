import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { userInfo } from "os";

export async function GET(request : NextRequest) {

    const loginToken = request.cookies.get("Login-token")?.value
    
    const secretText = process.env.JOSE_SECRET

    const secret = new TextEncoder().encode(secretText);

    const user = await jose.jwtVerify(
        loginToken||"",
        secret
    )

    console.log(user)

    console.log ("GET request recieved at /api/products");

}