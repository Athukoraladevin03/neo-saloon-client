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

    const pageNumberInstring = request.nextUrl.searchParams.get("pageNumber") || "1";
    
    const pageSizeInstring = request.nextUrl.searchParams.get("pageSize") || "10";

    const pageNumber = parseInt(pageNumberInstring);
    const pageSize = parseInt(pageSizeInstring);

    const userCount = await prisma.user.count()

    const totalPages = Math.ceil(userCount / pageSize)

    if(pageNumber > totalPages){
        return NextResponse.json(
            {
                message: "Page number exceeds total pages",
                totalPages : totalPages
            },
            {
                status: 404
            }
        );
    }

    const users = await prisma.user.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
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
            users: users,
            pagination : {
                pageNumber : pageNumber,
                pageSize : pageSize,
                totalPages : totalPages,
                totalCount : userCount
            }
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

    const body = await request.json();

    if (requestedUser.id !== id) {
      
     //never allow users to update their own role or privilages

    const user = await prisma.user.findUnique({
        where: {
            id: id || ""
        }
    })

    if(user == null){
        return NextResponse.json(
            {
                message: "User not found"
            },
            {
                status: 404
            }
        );
    }

        await prisma.user.update({
            where: {
                id: id || ""
            },
            data: {
                email: body.email || user.email,
                firstname: body.firstname || user.firstname,
                lastname: body.lastname || user.lastname,
                phone: body.phone || user.phone,
                profileImage : body.profileImage || user.profileImage // should be included in the token
            }    
        })

        return NextResponse.json(
         {
              message : "User Updated Successfullly"
         }

        )
    
    }else{
        
        const havePrivilage = await isPrivilaged(request, "users:edit")

        if (!havePrivilage){
            return  NextResponse.json(
              {

                message : "you do not have the privilage to edit this users"

              },
              {
                status : 403
              }

            )

        }
        
        const user = await prisma.user.findUnique({
            where : {
                id : id||"0000"
            }

        })

        if (user == null){
            return NextResponse.json(
                {
                    message : "User not found"
                },
                {
                    status : 404
                }
            )
        }

        await prisma.user.update({
            where : {
                id : id||"000"
            },
            data : {
                email : body.email || user.email,
                firstname : body.firstname || user.firstname,
                lastname : body.lastname  || user.lastname,
                phone : body.phone || user.phone,
                profileImage : body.profileImage || user.profileImage,
                role : body.role || user.role,
                status : body.status || user.status,
                privilages : body.privilages || user.privilages
        
            }
        })

        return NextResponse.json(
            {
                message : "User updated succesfully"
            }
        )








    }
}
