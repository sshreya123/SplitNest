import { z } from "zod";


export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Group name must contain at least 2 characters"
    )
    .max(
      120,
      "Group name cannot exceed 120 characters"
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Description cannot exceed 500 characters"
    ),

  default_currency: z.enum([
    "INR",
    "USD",
    "EUR",
    "GBP"
  ])
});


export type CreateGroupFormValues = z.infer<
  typeof createGroupSchema
>;