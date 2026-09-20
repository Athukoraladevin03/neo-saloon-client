import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.userCreateInput[] = [
    {
        email : "admin@saloonneo.lk",
        firstname : "Admin",
        lastname : "Neo",
        password : "$2a$12$crmh/6kc6mSkCaN4URwkruDofZqlz7/rPnULc6OAQxm2rDvW75mIi",
        role : "ADMIN",
        privilages : []
    }
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();