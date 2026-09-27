import prisma from "@/lib/prisma";
import { getUser, isPrivilaged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

    const havePrivilage = await isPrivilaged(request, "users:read");

    if (!havePrivilage) {
        return NextResponse.json(
            {
                message: "You do not have privilage to view users"
            },
            {
                status: 403
            }
        );
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            phone: true,
            firstname: true,
            lastname: true,
            password: false,
            role: true,
            status: true,
            createdAt: true,
            lastLogin: true,
            privilages: true
        }
    });

    return NextResponse.json(
        {
            message: "Users fetched successfully",
            users: users
        }
    );
}

export async function POST(request: NextRequest) {

    //email , firstname , lastname , password , phone(optional)

    const body = await request.json();

    if (body.email == null) {
        return NextResponse.json(
            {
                message: "Email is required"
            },
            {
                status: 422
            }
        );
    }

    if (body.firstname == null) {

        return NextResponse.json(
            {
                message: "Firstname is required"
            },
            {
                status: 422
            }
        );
    }

    if (body.lastname == null) {

        return NextResponse.json(
            {
                message: "Lastname is required"
            },
            {
                status: 422
            }
        );
    }

    if (body.password == null) {

        return NextResponse.json(
            {
                message: "Password is required"
            },
            {
                status: 422
            }
        );
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            email: body.email
        }
    });

    if (existingUser != null) {

        return NextResponse.json(
            {
                message: "User with this email already exists"
            },
            {
                status: 409
            }
        );
    }

    const passwordHash = await bcrypt.hash(body.password, 12)

    await prisma.user.create({
        data: {
            email: body.email,
            firstname: body.firstname,
            lastname: body.lastname,
            password: passwordHash,
            phone: body.phone,
        }
    });
    
    return NextResponse.json(
        {
            message: "User created successfully"
        },
        {
            status: 201
        }
    );

}

export async function PUT(request: NextRequest){

    const id = request.nextUrl.searchParams.get("id");

    const requestedUser = await getUser(request);

    if(requestedUser == null){
        return NextResponse.json(
            {
                message: "You are not logged in"
            },
            {
                status: 401
            }
        );
    }

    if (requestedUser.id !== id) {
        //user is trying to update their own account, allow it
    }else{
        //user is trying to update someone else's account, check privilages
    }
}
