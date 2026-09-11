import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  HandCoins,
  LoaderCircle,
  Plus
} from "lucide-react";
import { useState } from "react";

import type {
  GroupMember,
  GroupRole
} from "../../../types/group";
import type {
  MoneyValue
} from "../../../types/expense";
import {
  getGroupSettlements
} from "../api/getGroupSettlements";
import SettleUpModal from "./SettleUpModal";


interface SettlementSectionProps {
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


function SettlementSection({
  groupId,
  currency,
  members,
  currentUserRole
}: SettlementSectionProps) {
  const [
    isSettleUpModalOpen,
    setIsSettleUpModalOpen
  ] = useState(false);

  const settlementsQuery = useQuery({
    queryKey: [
      "groups",
      groupId,
      "settlements"
    ],

    queryFn: () =>
      getGroupSettlements(groupId)
  });


  if (settlementsQuery.isPending) {
    return (
      <div className="mt-8 flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <LoaderCircle
          className="animate-spin text-emerald-600"
          size={30}
        />
      </div>
    );
  }


  if (settlementsQuery.isError) {
    return (
      <div
        role="alert"
        className="mt-8 flex items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700"
      >
        <AlertCircle size={21} />

        <div>
          <p className="font-semibold">
            Unable to load settlements
          </p>

          <button
            type="button"
            className="mt-2 text-sm font-semibold underline"
            onClick={() =>
              settlementsQuery.refetch()
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }


  const settlements =
    settlementsQuery.data;

  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Settlements
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Payments recorded between group
            members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {settlements.length}{" "}
            {settlements.length === 1
              ? "payment"
              : "payments"}
          </span>

          <button
            type="button"
            disabled={members.length < 2}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() =>
              setIsSettleUpModalOpen(true)
            }
          >
            <Plus size={17} />
            Settle up
          </button>
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <HandCoins size={27} />
          </span>

          <h3 className="mt-4 font-semibold text-slate-950">
            No settlements yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Payments between members will appear
            here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {settlements.map(
            (settlement) => (
              <article
                key={settlement.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 sm:p-5"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <HandCoins size={21} />
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-950">
                          {
                            settlement.from_user_name
                          }
                        </span>

                        <ArrowRight
                          className="text-slate-400"
                          size={16}
                        />

                        <span className="font-semibold text-slate-950">
                          {
                            settlement.to_user_name
                          }
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} />

                          {formatDate(
                            settlement.settlement_date
                          )}
                        </span>

                        {settlement.note && (
                          <span>
                            {settlement.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-lg font-bold text-emerald-700">
                    {formatMoney(
                      settlement.amount,
                      settlement.currency
                    )}
                  </p>
                </div>
              </article>
            )
          )}
        </div>
      )}

      <SettleUpModal
        groupId={groupId}
        currency={currency}
        members={members}
        currentUserRole={currentUserRole}
        isOpen={isSettleUpModalOpen}
        onClose={() =>
          setIsSettleUpModalOpen(false)
        }
      />
    </section>
  );
}


export default SettlementSection;