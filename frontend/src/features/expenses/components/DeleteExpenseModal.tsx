import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import axios from "axios";
import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
  X
} from "lucide-react";

import type {
  Expense
} from "../../../types/expense";
import {
  deleteExpense
} from "../api/deleteExpense";


interface DeleteExpenseModalProps {
  groupId: string;
  expense: Expense | null;
  onClose: () => void;
}


interface ApiErrorResponse {
  detail?: string;
}


function DeleteExpenseModal({
  groupId,
  expense,
  onClose
}: DeleteExpenseModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,

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
        groupId,
        "debt-suggestions"
      ]
    })
  ]);

  onClose();
}
  });


  if (!expense) {
    return null;
  }


function handleDelete() {
  if (!expense) {
    return;
  }

  deleteMutation.mutate({
    groupId,
    expenseId: expense.id
  });
}


  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !deleteMutation.isPending
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-expense-title"
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <AlertTriangle size={22} />
            </span>

            <div>
              <h2
                id="delete-expense-title"
                className="text-xl font-bold text-slate-950"
              >
                Delete expense?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close delete expense modal"
            disabled={deleteMutation.isPending}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm leading-6 text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-950">
              {expense.title}
            </span>
            ? Its participant shares will also be
            removed and group balances will be
            recalculated.
          </p>

          {deleteMutation.isError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {axios.isAxiosError<ApiErrorResponse>(
                deleteMutation.error
              )
                ? deleteMutation.error.response
                    ?.data.detail ??
                  "Unable to delete the expense."
                : "Unable to delete the expense."}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={deleteMutation.isPending}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={deleteMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                  />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete expense
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


export default DeleteExpenseModal;