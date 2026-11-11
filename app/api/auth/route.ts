
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function POST(request: NextRequest) {

    try {

        const body = await request.json();

        if (body.email == null) {

            return NextResponse.json(
                {
                    message: "Email is required"
                },
                {
                    status: 422
                }
            )
        }

        if (body.password == null) {

            return NextResponse.json(
                {
                    message: "Password is required"
                },
                {
                    status: 422
                }
            )
        }

        const user = await prisma.user.findFirst(
            {
                where: {
                    email: body.email.trim().toLowerCase()
                }
            }
        )

        if (user == null) {

            return NextResponse.json(
                {
                    message: "User not found"
                },
                {
                    status: 404
                }
            )
        }

        if (user.status != "ACTIVE") {

            return NextResponse.json(
                {
                    message: "Your account is disabled, please contact the administrator"
                },
                {
                    status: 403
                }
            )
        }

        const isPasswordValid = await compare(body.password, user.password);

        if (isPasswordValid) {

            // Check whether the user is an ADMIN

            if (user.role !== "ADMIN") {

                return NextResponse.json(
                    {
                        message: "You are not authorized to access this page"
                    },
                    {
                        status: 403
                    }
                )

            }

            await prisma.user.update(
                {
                    where: {
                        id: user.id
                    },
                    data: {
                        lastLogin: new Date()
                    }
                }
            )

            const secretText = process.env.JOSE_SECRET

            if (!secretText || secretText.length < 32) {
                throw new Error("Invalid JOSE_SECRET configuration");
            }

            const secret = new TextEncoder().encode(secretText);

            const token = await new jose.SignJWT({
                id: user.id,
                email: user.email,
                firstName: user.firstname,
                lastName: user.lastname,
                role: user.role,
                privilages: user.privilages
            })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("7d")
                .sign(secret);

            const response = NextResponse.json(
                {
                    message: "Login successful",
                    role: user.role,
                }
            )

            response.cookies.set(
                {
                    name: "Login-token",
                    value: token,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 60 * 60 * 24 * 7,
                    path: "/"
                }
            )

            return response;

        } else {

            return NextResponse.json(
                {
                    message: "Invalid password"
                },
                {
                    status: 401
                }
            )

        }

    } catch (error) {

        console.error("Login error:", error);

        return NextResponse.json(
            {
                message: "Internal server error"
            },
            {
                status: 500
            }
        )

    }

}

// Logout: clear the httpOnly login cookie (it can't be removed from the browser with JS).
export async function DELETE() {

    const response = NextResponse.json(
        {
            message: "Logged out"
        }
    )

    response.cookies.set(
        {
            name: "Login-token",
            value: "",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/"
        }
    )

    return response;

}
