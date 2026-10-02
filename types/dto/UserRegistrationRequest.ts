import {z} from "zod";

const UserRegistrationRequestSchema = z.object(
    {
        email: z.email(),
        firstname: z.string().max(20),
        lastname: z.string().max(20),
        password: z.string(),
        privilages: z.never().optional(),
        phone: z.string().optional()
    }
)    

export type UserRegistrationRequest = z.infer<typeof UserRegistrationRequestSchema>;

export {UserRegistrationRequestSchema}