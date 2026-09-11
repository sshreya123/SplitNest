import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  Scale,
  WalletCards
} from "lucide-react";

import {
  getGroupBalances
} from "../api/getGroupBalances";
import type {
  MoneyValue
} from "../../../types/expense";


interface GroupBalanceSummaryProps {
  groupId: string;
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
  ).format(Math.abs(Number(amount)));
}


function GroupBalanceSummary({
  groupId
}: GroupBalanceSummaryProps) {
  const balanceQuery = useQuery({
    queryKey: [
      "groups",
      groupId,
      "balances"
    ],

    queryFn: () =>
      getGroupBalances(groupId)
  });


  if (balanceQuery.isPending) {
    return (
      <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <LoaderCircle
          className="animate-spin text-emerald-600"
          size={30}
        />
      </div>
    );
  }


  if (balanceQuery.isError) {
    return (
      <div
        role="alert"
        className="mt-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
      >
        <AlertCircle size={21} />

        <div>
          <p className="font-semibold">
            Unable to calculate balances
          </p>

          <button
            type="button"
            className="mt-2 text-sm font-semibold underline"
            onClick={() =>
              balanceQuery.refetch()
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }


  const balance = balanceQuery.data;

  return (
    <section className="mt-8">
      <div>
        <h2 className="text-xl font-bold text-slate-950">
          Group balances
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          A summary of what each member paid
          and owes.
        </p>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
            <WalletCards size={22} />
          </span>

          <div>
            <p className="text-sm text-slate-400">
              Total group spending
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatMoney(
                balance.total_expenses,
                balance.currency
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {balance.members.map((member:any) => {
          const netBalance = Number(
            member.net_balance
          );

          const isPositive =
            netBalance > 0;

          const isNegative =
            netBalance < 0;

          return (
            <article
              key={member.user_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">
                    {member.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Member balance
                  </p>
                </div>

                <span
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    isPositive
                      ? "bg-emerald-100 text-emerald-700"
                      : isNegative
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isPositive ? (
                    <ArrowDownLeft size={20} />
                  ) : isNegative ? (
                    <ArrowUpRight size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Paid
                  </p>

                  <p className="mt-1 font-semibold text-slate-950">
                    {formatMoney(
                      member.total_paid,
                      balance.currency
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Share
                  </p>

                  <p className="mt-1 font-semibold text-slate-950">
                    {formatMoney(
                      member.total_share,
                      balance.currency
                    )}
                  </p>
                </div>
              </div>

              <div
                className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  isPositive
                    ? "bg-emerald-50 text-emerald-700"
                    : isNegative
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-50 text-slate-600"
                }`}
              >
                <Scale size={16} />

                {isPositive
                  ? `Gets back ${formatMoney(
                      netBalance,
                      balance.currency
                    )}`
                  : isNegative
                    ? `Owes ${formatMoney(
                        netBalance,
                        balance.currency
                      )}`
                    : "Settled up"}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}


export default GroupBalanceSummary;