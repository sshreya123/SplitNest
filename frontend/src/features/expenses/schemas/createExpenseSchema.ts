import { z } from "zod";


const expenseSplitSchema = z.object({
  user_id: z
    .string()
    .uuid("Invalid group member"),

  amount: z
    .number()
    .nullable(),

  percentage: z
    .number()
    .nullable()
});


export const createExpenseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(
        2,
        "Expense title must contain at least 2 characters"
      )
      .max(
        150,
        "Expense title cannot exceed 150 characters"
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description cannot exceed 500 characters"
      ),

    total_amount: z
      .number({
        error: "Enter a valid amount"
      })
      .positive(
        "Amount must be greater than zero"
      ),

    paid_by_id: z
      .string()
      .uuid(
        "Select the person who paid"
      ),

    split_type: z.enum([
      "equal",
      "exact",
      "percentage"
    ]),

    participant_ids: z.array(
      z.string().uuid()
    ),

    splits: z.array(
      expenseSplitSchema
    ),

    expense_date: z
      .string()
      .min(
        1,
        "Expense date is required"
      )
  })

  .superRefine((data, context) => {
    // -----------------------------------------
    // Equal split validation
    // -----------------------------------------

    if (data.split_type === "equal") {
      if (data.participant_ids.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["participant_ids"],
          message:
            "Select at least one participant"
        });
      }

      const uniqueParticipantIds = new Set(
        data.participant_ids
      );

      if (
        uniqueParticipantIds.size !==
        data.participant_ids.length
      ) {
        context.addIssue({
          code: "custom",
          path: ["participant_ids"],
          message:
            "A participant cannot be selected twice"
        });
      }

      return;
    }

    // -----------------------------------------
    // Exact and percentage split validation
    // -----------------------------------------

    if (data.splits.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["splits"],
        message:
          "Add at least one participant"
      });

      return;
    }

    const splitUserIds = data.splits.map(
      (split) => split.user_id
    );

    const uniqueSplitUserIds = new Set(
      splitUserIds
    );

    if (
      uniqueSplitUserIds.size !==
      splitUserIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["splits"],
        message:
          "A participant cannot be added twice"
      });
    }

    // -----------------------------------------
    // Exact split validation
    // -----------------------------------------

    if (data.split_type === "exact") {
      let exactTotal = 0;

      data.splits.forEach(
        (split, index) => {
          if (
            split.amount === null ||
            Number.isNaN(split.amount) ||
            split.amount <= 0
          ) {
            context.addIssue({
              code: "custom",
              path: [
                "splits",
                index,
                "amount"
              ],
              message:
                "Enter an amount greater than zero"
            });

            return;
          }

          exactTotal += split.amount;
        }
      );

      if (
        Math.abs(
          exactTotal - data.total_amount
        ) > 0.01
      ) {
        context.addIssue({
          code: "custom",
          path: ["splits"],
          message:
            "The split amounts must equal the total expense amount"
        });
      }

      return;
    }

    // -----------------------------------------
    // Percentage split validation
    // -----------------------------------------

    if (
      data.split_type === "percentage"
    ) {
      let percentageTotal = 0;

      data.splits.forEach(
        (split, index) => {
          if (
            split.percentage === null ||
            Number.isNaN(
              split.percentage
            ) ||
            split.percentage <= 0 ||
            split.percentage > 100
          ) {
            context.addIssue({
              code: "custom",
              path: [
                "splits",
                index,
                "percentage"
              ],
              message:
                "Enter a percentage between 0 and 100"
            });

            return;
          }

          percentageTotal +=
            split.percentage;
        }
      );

      if (
        Math.abs(
          percentageTotal - 100
        ) > 0.01
      ) {
        context.addIssue({
          code: "custom",
          path: ["splits"],
          message:
            "The percentages must add up to 100%"
        });
      }
    }
  });


export type CreateExpenseFormValues =
  z.infer<typeof createExpenseSchema>;