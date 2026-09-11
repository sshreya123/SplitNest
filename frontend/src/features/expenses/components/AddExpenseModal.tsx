import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import axios from "axios";
import {
  Calculator,
  Check,
  LoaderCircle,
  ReceiptText,
  X
} from "lucide-react";
import {
  useEffect
} from "react";
import {
  useForm
} from "react-hook-form";

import type {
  GroupMember
} from "../../../types/group";
import type {
  CreateExpensePayload,
  Expense,
  SplitType
} from "../../../types/expense";
import {
  createExpense
} from "../api/createExpense";
import {
  updateExpense
} from "../api/updateExpense";
import {
  createExpenseSchema,
  type CreateExpenseFormValues
} from "../schemas/createExpenseSchema";


interface AddExpenseModalProps {
  groupId: string;
  currency: string;
  members: GroupMember[];
  expenseToEdit: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}


interface ApiErrorResponse {
  detail?: string;
}


function getCurrentDate(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatMoney(
  amount: number,
  currency: string
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(amount);
}


function createEmptySplits(
  members: GroupMember[]
) {
  return members.map((member) => ({
    user_id: member.user_id,
    amount: null,
    percentage: null
  }));
}


function getFormValues(
  expense: Expense | null,
  members: GroupMember[]
): CreateExpenseFormValues {
  if (expense) {
    const splitType = expense.split_type;

    return {
      title: expense.title,

      description:
        expense.description ?? "",

      total_amount: Number(
        expense.total_amount
      ),

      paid_by_id:
        expense.paid_by_id,

      split_type: splitType,

      participant_ids:
        splitType === "equal"
          ? expense.splits.map(
              (split) => split.user_id
            )
          : [],

      splits:
        splitType === "equal"
          ? []
          : expense.splits.map(
              (split) => ({
                user_id: split.user_id,

                amount:
                  splitType === "exact"
                    ? Number(split.amount)
                    : null,

                percentage:
                  splitType === "percentage" &&
                  split.percentage !== null
                    ? Number(
                        split.percentage
                      )
                    : null
              })
            ),

      expense_date:
        expense.expense_date
    };
  }

  return {
    title: "",
    description: "",
    total_amount: 0,

    paid_by_id:
      members[0]?.user_id ?? "",

    split_type: "equal",

    participant_ids: members.map(
      (member) => member.user_id
    ),

    splits: [],

    expense_date: getCurrentDate()
  };
}


function AddExpenseModal({
  groupId,
  currency,
  members,
  expenseToEdit,
  isOpen,
  onClose
}: AddExpenseModalProps) {
  const queryClient = useQueryClient();

  const isEditing =
    expenseToEdit !== null;


  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateExpenseFormValues>({
    resolver: zodResolver(
      createExpenseSchema
    ),

    defaultValues: getFormValues(
      expenseToEdit,
      members
    )
  });


  const splitType =
    watch("split_type");

  const totalAmount =
    watch("total_amount") || 0;

  const selectedParticipantIds =
    watch("participant_ids") ?? [];

  const customSplits =
    watch("splits") ?? [];


  const equalShare =
    selectedParticipantIds.length > 0
      ? totalAmount /
        selectedParticipantIds.length
      : 0;


  const exactAmountTotal =
    customSplits.reduce(
      (total, split) =>
        total + (
          split.amount ?? 0
        ),
      0
    );


  const percentageTotal =
    customSplits.reduce(
      (total, split) =>
        total + (
          split.percentage ?? 0
        ),
      0
    );


  const saveExpenseMutation = useMutation({
    mutationFn: (
      payload: CreateExpensePayload
    ) => {
      if (expenseToEdit) {
        return updateExpense({
          groupId,
          expenseId: expenseToEdit.id,
          payload
        });
      }

      return createExpense({
        groupId,
        payload
      });
    },

    onSuccess: async () => {
      await Promise.all([
  queryClient.invalidateQueries({
    queryKey: [
      "groups",
      groupId,
      "expenses"
    ]
  }),

  queryClient.invalidateQueries({
    queryKey: [
      "groups",
      groupId,
      "balances"
    ]
  }),

  queryClient.invalidateQueries({
    queryKey: [
      "groups",
      groupId
    ]
  })
]);

      reset();
      onClose();
    }
  });


  const isSaving =
    isSubmitting ||
    saveExpenseMutation.isPending;


  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      getFormValues(
        expenseToEdit,
        members
      )
    );
  }, [
    isOpen,
    expenseToEdit,
    members,
    reset
  ]);


  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !saveExpenseMutation.isPending
      ) {
        onClose();
      }
    }

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow = "";

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isOpen,
    onClose,
    saveExpenseMutation.isPending
  ]);


  function handleSplitTypeChange(
    newSplitType: SplitType
  ) {
    setValue(
      "split_type",
      newSplitType,
      {
        shouldDirty: true,
        shouldValidate: false
      }
    );

    clearErrors([
      "participant_ids",
      "splits"
    ]);

    if (newSplitType === "equal") {
      setValue(
        "participant_ids",
        members.map(
          (member) => member.user_id
        ),
        {
          shouldDirty: true
        }
      );

      setValue(
        "splits",
        [],
        {
          shouldDirty: true
        }
      );

      return;
    }

    setValue(
      "participant_ids",
      [],
      {
        shouldDirty: true
      }
    );

    setValue(
      "splits",
      createEmptySplits(members),
      {
        shouldDirty: true
      }
    );
  }


  function toggleCustomSplitMember(
    member: GroupMember
  ) {
    const existingIndex =
      customSplits.findIndex(
        (split) =>
          split.user_id ===
          member.user_id
      );

    if (existingIndex >= 0) {
      const updatedSplits =
        customSplits.filter(
          (split) =>
            split.user_id !==
            member.user_id
        );

      setValue(
        "splits",
        updatedSplits,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );

      return;
    }

    setValue(
      "splits",
      [
        ...customSplits,
        {
          user_id: member.user_id,
          amount: null,
          percentage: null
        }
      ],
      {
        shouldDirty: true,
        shouldValidate: true
      }
    );
  }


  function updateExactAmount(
    splitIndex: number,
    value: string
  ) {
    const amount =
      value === ""
        ? null
        : Number(value);

    setValue(
      `splits.${splitIndex}.amount`,
      amount,
      {
        shouldDirty: true,
        shouldValidate: true
      }
    );
  }


  function updatePercentage(
    splitIndex: number,
    value: string
  ) {
    const percentage =
      value === ""
        ? null
        : Number(value);

    setValue(
      `splits.${splitIndex}.percentage`,
      percentage,
      {
        shouldDirty: true,
        shouldValidate: true
      }
    );
  }


  async function onSubmit(
    data: CreateExpenseFormValues
  ) {
    let payload: CreateExpensePayload;

    if (data.split_type === "equal") {
      payload = {
        title: data.title.trim(),

        description:
          data.description.trim(),

        total_amount:
          Number(data.total_amount),

        paid_by_id:
          data.paid_by_id,

        split_type: "equal",

        participant_ids:
          data.participant_ids,

        splits: [],

        expense_date:
          data.expense_date
      };
    } else {
      payload = {
        title: data.title.trim(),

        description:
          data.description.trim(),

        total_amount:
          Number(data.total_amount),

        paid_by_id:
          data.paid_by_id,

        split_type:
          data.split_type,

        participant_ids: [],

        splits: data.splits.map(
          (split) => ({
            user_id: split.user_id,

            amount:
              data.split_type === "exact"
                ? split.amount
                : null,

            percentage:
              data.split_type ===
              "percentage"
                ? split.percentage
                : null
          })
        ),

        expense_date:
          data.expense_date
      };
    }

    try {
      await saveExpenseMutation.mutateAsync(
        payload
      );
    } catch {
      // React Query stores and displays
      // the API error.
    }
  }


  function handleClose() {
    if (isSaving) {
      return;
    }

    saveExpenseMutation.reset();
    onClose();
  }


  if (!isOpen) {
    return null;
  }


  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ReceiptText size={22} />
            </span>

            <div>
              <h2
                id="expense-modal-title"
                className="text-xl font-bold text-slate-950"
              >
                {isEditing
                  ? "Edit expense"
                  : "Add an expense"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose how the expense should
                be divided between group members.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close expense modal"
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            onClick={handleClose}
          >
            <X size={21} />
          </button>
        </div>


        <form
          className="space-y-6 p-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {saveExpenseMutation.isError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {axios.isAxiosError<ApiErrorResponse>(
                saveExpenseMutation.error
              )
                ? saveExpenseMutation.error
                    .response?.data.detail ??
                  `Unable to ${
                    isEditing
                      ? "update"
                      : "create"
                  } the expense.`
                : `Unable to ${
                    isEditing
                      ? "update"
                      : "create"
                  } the expense.`}
            </div>
          )}


          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="expense-title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Expense title
              </label>

              <input
                id="expense-title"
                type="text"
                autoFocus
                placeholder="For example, Dinner"
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                  errors.title
                    ? "border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                }`}
                {...register("title")}
              />

              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>


            <div>
              <label
                htmlFor="expense-amount"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Total amount ({currency})
              </label>

              <input
                id="expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                  errors.total_amount
                    ? "border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                }`}
                {...register(
                  "total_amount",
                  {
                    valueAsNumber: true
                  }
                )}
              />

              {errors.total_amount && (
                <p className="mt-1.5 text-sm text-red-600">
                  {
                    errors.total_amount
                      .message
                  }
                </p>
              )}
            </div>
          </div>


          <div>
            <label
              htmlFor="expense-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description

              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <textarea
              id="expense-description"
              rows={3}
              placeholder="Add more information..."
              className={`w-full resize-none rounded-xl border px-4 py-3 outline-none transition ${
                errors.description
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              }`}
              {...register("description")}
            />

            {errors.description && (
              <p className="mt-1.5 text-sm text-red-600">
                {
                  errors.description
                    .message
                }
              </p>
            )}
          </div>


          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="expense-payer"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Paid by
              </label>

              <select
                id="expense-payer"
                className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition ${
                  errors.paid_by_id
                    ? "border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                }`}
                {...register("paid_by_id")}
              >
                {members.map((member) => (
                  <option
                    key={member.user_id}
                    value={member.user_id}
                  >
                    {member.name}
                  </option>
                ))}
              </select>

              {errors.paid_by_id && (
                <p className="mt-1.5 text-sm text-red-600">
                  {
                    errors.paid_by_id
                      .message
                  }
                </p>
              )}
            </div>


            <div>
              <label
                htmlFor="expense-date"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Expense date
              </label>

              <input
                id="expense-date"
                type="date"
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                  errors.expense_date
                    ? "border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                }`}
                {...register("expense_date")}
              />

              {errors.expense_date && (
                <p className="mt-1.5 text-sm text-red-600">
                  {
                    errors.expense_date
                      .message
                  }
                </p>
              )}
            </div>
          </div>


          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              How should this expense be split?
            </legend>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(
                [
                  {
                    value: "equal",
                    label: "Equally",
                    description:
                      "Same amount each"
                  },
                  {
                    value: "exact",
                    label: "Exact amounts",
                    description:
                      "Enter each amount"
                  },
                  {
                    value: "percentage",
                    label: "Percentage",
                    description:
                      "Enter each percent"
                  }
                ] as const
              ).map((option) => {
                const isSelected =
                  splitType === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                    onClick={() =>
                      handleSplitTypeChange(
                        option.value
                      )
                    }
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">
                        {option.label}
                      </span>

                      {isSelected && (
                        <Check
                          size={17}
                          className="text-emerald-600"
                        />
                      )}
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <input
              type="hidden"
              {...register("split_type")}
            />
          </fieldset>


          {splitType === "equal" && (
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">
                Split equally between
              </legend>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {members.map((member) => (
                  <label
                    key={member.user_id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <input
                      type="checkbox"
                      value={member.user_id}
                      className="size-4 accent-emerald-500"
                      {...register(
                        "participant_ids"
                      )}
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        {member.name}
                      </span>

                      <span className="block text-xs text-slate-400">
                        {member.email}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {errors.participant_ids && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    errors.participant_ids
                      .message
                  }
                </p>
              )}
            </fieldset>
          )}


          {(splitType === "exact" ||
            splitType === "percentage") && (
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">
                {splitType === "exact"
                  ? "Enter each member's amount"
                  : "Enter each member's percentage"}
              </legend>

              <p className="mt-1 text-xs text-slate-500">
                Untick a member if they are not
                participating in this expense.
              </p>

              <div className="mt-3 space-y-3">
                {members.map((member) => {
                  const splitIndex =
                    customSplits.findIndex(
                      (split) =>
                        split.user_id ===
                        member.user_id
                    );

                  const isSelected =
                    splitIndex >= 0;

                  return (
                    <div
                      key={member.user_id}
                      className={`rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            className="size-4 accent-emerald-500"
                            onChange={() =>
                              toggleCustomSplitMember(
                                member
                              )
                            }
                          />

                          <span>
                            <span className="block text-sm font-semibold text-slate-800">
                              {member.name}
                            </span>

                            <span className="block text-xs text-slate-500">
                              {member.email}
                            </span>
                          </span>
                        </label>

                        {isSelected &&
                          splitType ===
                            "exact" && (
                            <div className="w-full sm:w-44">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                  {currency}
                                </span>

                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={
                                    customSplits[
                                      splitIndex
                                    ]?.amount ?? ""
                                  }
                                  className={`w-full rounded-lg border py-2.5 pl-12 pr-3 outline-none ${
                                    errors.splits?.[
                                      splitIndex
                                    ]?.amount
                                      ? "border-red-400 focus:ring-4 focus:ring-red-100"
                                      : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                  }`}
                                  onChange={(event) =>
                                    updateExactAmount(
                                      splitIndex,
                                      event.target
                                        .value
                                    )
                                  }
                                />
                              </div>

                              {errors.splits?.[
                                splitIndex
                              ]?.amount && (
                                <p className="mt-1 text-xs text-red-600">
                                  {
                                    errors.splits[
                                      splitIndex
                                    ]?.amount
                                      ?.message
                                  }
                                </p>
                              )}
                            </div>
                          )}

                        {isSelected &&
                          splitType ===
                            "percentage" && (
                            <div className="w-full sm:w-44">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0.01"
                                  max="100"
                                  step="0.01"
                                  placeholder="0"
                                  value={
                                    customSplits[
                                      splitIndex
                                    ]?.percentage ??
                                    ""
                                  }
                                  className={`w-full rounded-lg border py-2.5 pl-3 pr-10 outline-none ${
                                    errors.splits?.[
                                      splitIndex
                                    ]?.percentage
                                      ? "border-red-400 focus:ring-4 focus:ring-red-100"
                                      : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                  }`}
                                  onChange={(event) =>
                                    updatePercentage(
                                      splitIndex,
                                      event.target
                                        .value
                                    )
                                  }
                                />

                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                  %
                                </span>
                              </div>

                              {errors.splits?.[
                                splitIndex
                              ]?.percentage && (
                                <p className="mt-1 text-xs text-red-600">
                                  {
                                    errors.splits[
                                      splitIndex
                                    ]?.percentage
                                      ?.message
                                  }
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {typeof errors.splits?.message ===
                "string" && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.splits.message}
                </p>
              )}
            </fieldset>
          )}


          {splitType === "equal" &&
            selectedParticipantIds.length >
              0 &&
            totalAmount > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                <Calculator
                  className="shrink-0"
                  size={22}
                />

                <p className="text-sm">
                  <span className="font-semibold">
                    Equal split:
                  </span>{" "}
                  approximately{" "}

                  <span className="font-bold">
                    {formatMoney(
                      equalShare,
                      currency
                    )}
                  </span>{" "}
                  per selected member.
                </p>
              </div>
            )}


          {splitType === "exact" && (
            <div
              className={`rounded-2xl p-4 ${
                Math.abs(
                  exactAmountTotal -
                  totalAmount
                ) <= 0.01
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              <p className="text-sm font-semibold">
                Amount entered:{" "}
                {formatMoney(
                  exactAmountTotal,
                  currency
                )}
              </p>

              <p className="mt-1 text-xs">
                Total expense:{" "}
                {formatMoney(
                  totalAmount,
                  currency
                )}
              </p>

              {Math.abs(
                exactAmountTotal -
                totalAmount
              ) > 0.01 && (
                <p className="mt-1 text-xs font-semibold">
                  The entered amounts must equal
                  the total expense.
                </p>
              )}
            </div>
          )}


          {splitType === "percentage" && (
            <div
              className={`rounded-2xl p-4 ${
                Math.abs(
                  percentageTotal - 100
                ) <= 0.01
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              <p className="text-sm font-semibold">
                Percentage entered:{" "}
                {percentageTotal.toFixed(2)}%
              </p>

              <p className="mt-1 text-xs">
                The percentages must add up to
                exactly 100%.
              </p>
            </div>
          )}


          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                  />

                  {isEditing
                    ? "Saving..."
                    : "Adding..."}
                </>
              ) : (
                <>
                  <ReceiptText size={18} />

                  {isEditing
                    ? "Save changes"
                    : "Add expense"}
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


export default AddExpenseModal;