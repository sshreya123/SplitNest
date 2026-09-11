import { z } from "zod";


export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(255, "Email cannot exceed 255 characters"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),

    confirmPassword: z.string()
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }
  );


export type RegisterFormValues = z.infer<typeof registerSchema>;