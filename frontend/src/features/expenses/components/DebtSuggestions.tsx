import {
  useQuery
} from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  LoaderCircle
} from "lucide-react";

import {
  getDebtSuggestions
} from "../api/getDebtSuggestions";


interface DebtSuggestionsProps {
  groupId: string;
}


function formatMoney(
  amount: string | number,
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


function DebtSuggestions({
  groupId
}: DebtSuggestionsProps) {
  const debtQuery = useQuery({
    queryKey: [
      "groups",
      groupId,
      "debt-suggestions"
    ],

    queryFn: () =>
      getDebtSuggestions(groupId),

    enabled: Boolean(groupId)
  });


  if (debtQuery.isPending) {
    return (
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex min-h-32 items-center justify-center">
          <LoaderCircle
            className="animate-spin text-emerald-600"
            size={30}
          />

          <span className="ml-3 text-sm text-slate-500">
            Calculating suggested payments...
          </span>
        </div>
      </section>
    );
  }


  if (debtQuery.isError) {
    return (
      <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3 text-red-700">
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={22}
          />

          <div>
            <h2 className="font-semibold">
              Unable to calculate payments
            </h2>

            <p className="mt-1 text-sm">
              We could not load the suggested
              payments for this group.
            </p>

            <button
              type="button"
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              onClick={() =>
                debtQuery.refetch()
              }
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }


  const debtSummary = debtQuery.data;
  const suggestions =
    debtSummary.suggestions;


  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BadgeIndianRupee size={21} />
            </span>

            <h2 className="text-xl font-bold text-slate-950">
              Suggested payments
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            The simplest way for everyone to
            settle their current balances.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
          {suggestions.length}{" "}
          {suggestions.length === 1
            ? "payment"
            : "payments"}
        </span>
      </div>


      {suggestions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
            <CheckCircle2 size={26} />
          </span>

          <h3 className="mt-3 font-bold text-emerald-900">
            Everyone is settled
          </h3>

          <p className="mt-1 text-sm text-emerald-700">
            No payments are currently required
            in this group.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {suggestions.map(
            (suggestion, index) => (
              <article
                key={`${suggestion.from_user_id}-${suggestion.to_user_id}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                      {suggestion.from_user_name
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-bold text-slate-900">
                          {
                            suggestion.from_user_name
                          }
                        </span>

                        <ArrowRight
                          className="text-slate-400"
                          size={17}
                        />

                        <span className="font-bold text-slate-900">
                          {
                            suggestion.to_user_name
                          }
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Suggested settlement
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-lg font-bold text-emerald-700">
                      {formatMoney(
                        suggestion.amount,
                        debtSummary.currency
                      )}
                    </p>

                    <p className="text-xs text-slate-500">
                      should be paid
                    </p>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}


export default DebtSuggestions;