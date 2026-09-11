import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  LoaderCircle,
  ReceiptText,
  UserRound,
  UsersRound,
    Pencil,

} from "lucide-react";
import { Trash2 } from "lucide-react";

import type {
  GroupRole
} from "../../../types/group";
import type {
  Expense
} from "../../../types/expense";
import {
  useAuth
} from "../../auth/context/AuthContext";
import DeleteExpenseModal from "./DeleteExpenseModal";
import {
  getGroupExpenses
} from "../api/getGroupExpenses";
import type {
  MoneyValue
} from "../../../types/expense";
import { useState } from "react";
import { Plus } from "lucide-react";

import type {
  GroupMember
} from "../../../types/group";
import AddExpenseModal from "./AddExpenseModal";

interface GroupExpenseListProps {
  groupId: string;
  currency: string;
  members: GroupMember[];
  currentUserRole: GroupRole;
}

function formatMoney(
  amount: MoneyValue,
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
  ).format(Number(amount));
}


function formatDate(value: string): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(new Date(value));
}


function GroupExpenseList({
  groupId,
  currency,
  members,
  currentUserRole
}: GroupExpenseListProps) {
  const { user } = useAuth();
const [
  expenseToEdit,
  setExpenseToEdit
] = useState<Expense | null>(null);
const [
  expenseToDelete,
  setExpenseToDelete
] = useState<Expense | null>(null);
    const [
  isAddExpenseModalOpen,
  setIsAddExpenseModalOpen
] = useState(false);
  const expensesQuery = useQuery({
    queryKey: [
      "groups",
      groupId,
      "expenses"
    ],

    queryFn: () =>
      getGroupExpenses(groupId)
  });


  if (expensesQuery.isPending) {
    return (
      <div className="mt-8 flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-emerald-600"
            size={30}
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading expenses...
          </p>
        </div>
      </div>
    );
  }


  if (expensesQuery.isError) {
    return (
      <div
        role="alert"
        className="mt-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
      >
        <AlertCircle
          className="mt-0.5 shrink-0"
          size={21}
        />

        <div>
          <p className="font-semibold">
            Unable to load expenses
          </p>

          <button
            type="button"
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() =>
              expensesQuery.refetch()
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }


  const expenses = expensesQuery.data;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Expenses
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Expenses recorded for this group.
          </p>
        </div>

        {/* <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {expenses.length}{" "}
          {expenses.length === 1
            ? "expense"
            : "expenses"}
        </span> */}
        <div className="flex items-center gap-3">
  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
    {expenses.length}{" "}
    {expenses.length === 1
      ? "expense"
      : "expenses"}
  </span>

  <button
    type="button"
    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
   onClick={() => {
  setExpenseToEdit(null);
  setIsAddExpenseModalOpen(true);
}}
  >
    <Plus size={17} />
    Add expense
  </button>
</div>
      </div>

      {expenses.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ReceiptText size={27} />
          </span>

          <h3 className="mt-5 text-lg font-semibold text-slate-950">
            No expenses yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Add the first expense for this group.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {expenses.map((expense) => (
            <article
              key={expense.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ReceiptText size={21} />
                  </span>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      {expense.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {expense.description ??
                        "No description provided."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <UserRound size={14} />
                        Paid by{" "}
                        {expense.paid_by_name}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDate(
                          expense.expense_date
                        )}
                      </span>

                      <span className="flex items-center gap-1.5 capitalize">
                        <UsersRound size={14} />
                        {expense.split_type} split
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
  <p className="text-xl font-bold text-slate-950">
    {formatMoney(
      expense.total_amount,
      expense.currency
    )}
  </p>
{(
  currentUserRole === "admin" ||
  expense.created_by_id === user?.id
) && (
  <button
    type="button"
    aria-label={`Edit ${expense.title}`}
    title="Edit expense"
    className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
    onClick={() => {
      setExpenseToEdit(expense);
      setIsAddExpenseModalOpen(true);
    }}
  >
    <Pencil size={17} />
  </button>
)}
  {(
    currentUserRole === "admin" ||
    expense.created_by_id === user?.id
  ) && (
    <button
      type="button"
      aria-label={`Delete ${expense.title}`}
      title="Delete expense"
      className="flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 hover:text-red-700"
      onClick={() =>
        setExpenseToDelete(expense)
      }
    >
      <Trash2 size={17} />
    </button>
  )}
</div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Split details
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {expense.splits.map(
                    (split) => (
                      <div
                        key={split.user_id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                      >
                        <span className="truncate text-sm text-slate-600">
                          {split.name}
                        </span>

                        <span className="shrink-0 text-sm font-semibold text-slate-950">
                          {formatMoney(
                            split.amount,
                            expense.currency
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    <AddExpenseModal
  groupId={groupId}
  currency={currency}
  members={members}
  expenseToEdit={expenseToEdit}
  isOpen={isAddExpenseModalOpen}
  onClose={() => {
    setIsAddExpenseModalOpen(false);
    setExpenseToEdit(null);
  }}
/>
<DeleteExpenseModal
  groupId={groupId}
  expense={expenseToDelete}
  onClose={() =>
    setExpenseToDelete(null)
  }
/>
    </section>
  );
}


export default GroupExpenseList;