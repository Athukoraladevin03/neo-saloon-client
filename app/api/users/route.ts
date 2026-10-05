import prisma from "@/lib/prisma";
import { UserRegistrationRequestSchema } from "@/types/dto/UserRegistrationRequest";
import { UserSelfUpdateRequestSchema } from "@/types/dto/UserSelfUpdateRequest";
import { UserUpdatedByAdminRequestSchema } from "@/types/dto/UserUpdatedByAdminRequest";
import { getUser, isPrivilaged } from "@/utils/authentication";
import getPaginationInfo from "@/utils/pageInfoRetrieval";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

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

    const params = getPaginationInfo(request)

    const userCount = await prisma.user.count()

    const totalPages = Math.ceil(userCount / params.pageSize)

    if(params.pageNumber > totalPages){
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
        skip: (params.pageNumber - 1) * params.pageSize,
        take: params.pageSize,
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
            data : users,
            pagination : {
                pageNumber : params.pageNumber,
                pageSize : params.pageSize,
                totalPages : totalPages,
                totalCount : userCount
            }
        }
    );
}

export async function POST(request: NextRequest) {

    //email , firstname , lastname , password , phone(optional)

    const body = await request.json()

    //validate the body using zod

    try {

        const parsedBody = UserRegistrationRequestSchema.parse(body)

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
     })
    
     return NextResponse.json(
        {
            message: "User created successfully"
        },
        {
            status: 201
        }
     );

    }catch (error) {

        if(error instanceof z.ZodError) {

            //console .log (error.issues[0]?.message ?? "Inavalid input")

            return NextResponse.json(
                {
                    message: error.issues[0]?.message ?? "Invalid input"
                },
                {
                    status: 400
                }
            );
        }

        console.log(error)

        return NextResponse.json(
            {
                message: "Invalid request body"
            },
            {
                status: 400
            }
        )
    }

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

    try{

        const body = await request.json();

        if (requestedUser.id == id) {
        
        //never allow users to update their own role or privilages

        UserSelfUpdateRequestSchema.parse(body);


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

            UserUpdatedByAdminRequestSchema.parse(body);
            
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
    

    

    }catch(error){

        if(error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    message : error.issues[0]?.message ?? "Invalid input"
                },
                {
                    status : 400
                }
            )
        }

        return NextResponse.json(
            {
                message : "Server error "
            },
            {
                status : 500
            }
        )
    }



}    