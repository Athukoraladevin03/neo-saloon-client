import { getUser } from "@/utils/authentication";
import { NextRequest } from "next/server";

export function POST(request : NextRequest) {
    
    const user = getUser(request)

    console.log ("user :", user)

}