import z from "zod";

const UserSelfUpdateRequestSchema = z.object(
    {
        id: z.never().optional(),
        email: z.email().optional(),
        firstname: z.string().max(20).optional(),
        lastname: z.string().max(20).optional(),
        password: z.never().optional(),
        phone: z.string().optional(),
        profileImage: z.string().optional(),
        role: z.never().optional(),
        status: z.never().optional(),
        privilages: z.never().optional()
    }
)

export type UserSelfUpdateRequest = z.infer<typeof UserSelfUpdateRequestSchema>;

export {UserSelfUpdateRequestSchema}