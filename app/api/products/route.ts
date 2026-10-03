import { isPrivilaged } from "@/utils/authentication";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request : NextRequest) {

    

}

export async function POST(request : NextRequest){

    const hasPrivilage = await isPrivilaged(request,"products:add")

    if(hasPrivilage){

        const body = await request.json()
        
    }else{
        return NextResponse.json({message : "You do not have the required privilage to add a product"}, {status : 403})
    }
}