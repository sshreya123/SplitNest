import { z } from "zod";


export const addGroupMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Enter a valid email address")
});


export type AddGroupMemberFormValues =
  z.infer<typeof addGroupMemberSchema>;