import { z } from "zod";


export const createSettlementSchema = z
  .object({
    from_user_id: z
      .string()
      .uuid(
        "Select the member making the payment"
      ),

    to_user_id: z
      .string()
      .uuid(
        "Select the member receiving the payment"
      ),

    amount: z
      .number()
      .positive(
        "Amount must be greater than zero"
      ),

    note: z
      .string()
      .trim()
      .max(
        300,
        "Note cannot exceed 300 characters"
      ),

    settlement_date: z
      .string()
      .min(
        1,
        "Settlement date is required"
      )
  })
  .refine(
    (data) =>
      data.from_user_id !==
      data.to_user_id,

    {
      message: (
        "Sender and receiver must be different"
      ),
      path: ["to_user_id"]
    }
  );


export type CreateSettlementFormValues =
  z.infer<typeof createSettlementSchema>;