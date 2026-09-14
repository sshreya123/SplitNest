import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  HandCoins,
  ReceiptText,
  UsersRound,
  WalletCards
} from "lucide-react";
import { Link } from "react-router";

import {
  useAuth
} from "../features/auth/context/AuthContext";
import {
  getDashboardSummary
} from "../features/dashboard/api/getDashboardSummary";

import type {
  DashboardActivity
} from "../types/dashboard";


function formatMoney(
  value: string,
  currency: string
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(Number(value));
}


function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}


function getActivityDetail(
  activity: DashboardActivity,
  key: string
): string {
  const value = activity.details[key];

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return "";
}


function getActivityMessage(
  activity: DashboardActivity
): string {
  const title = getActivityDetail(
    activity,
    "title"
  );

  const amount = getActivityDetail(
    activity,
    "amount"
  );

  const currency = getActivityDetail(
    activity,
    "currency"
  );

  const memberName = getActivityDetail(
    activity,
    "member_name"
  );

  switch (activity.action) {
    case "group.created":
      return `created the group ${activity.group_name}`;

    case "member.added":
      return `added ${memberName} to ${activity.group_name}`;

    case "expense.created":
      return (
        `created "${title}" for ` +
        `${currency} ${amount}`
      );

    case "expense.updated":
      return (
        `updated "${title}" to ` +
        `${currency} ${amount}`
      );

    case "expense.deleted":
      return (
        `deleted "${title}" of ` +
        `${currency} ${amount}`
      );

    case "settlement.created":
      return (
        `recorded a settlement of ` +
        `${currency} ${amount}`
      );

    default:
      return activity.action.replaceAll(".", " ");
  }
}


function DashboardPage() {
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary
  });

  if (dashboardQuery.isLoading) {
    return (
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Dashboard
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Loading your dashboard...
        </h1>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </section>
    );
  }

  if (
    dashboardQuery.isError ||
    !dashboardQuery.data
  ) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-950">
          Unable to load dashboard
        </h1>

        <p className="mt-2 text-sm text-red-600">
          We could not get your dashboard information.
        </p>

        <button
          type="button"
          onClick={() => dashboardQuery.refetch()}
          className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    );
  }

  const dashboard = dashboardQuery.data;

  const summaryCards = [
    {
      label: "Total balance",
      value: formatMoney(
        dashboard.total_balance,
        dashboard.currency
      ),
      description: "Your overall balance",
      icon: WalletCards,
      color: "bg-slate-950 text-white"
    },
    {
      label: "You are owed",
      value: formatMoney(
        dashboard.you_are_owed,
        dashboard.currency
      ),
      description: "Amount others owe you",
      icon: ArrowDownLeft,
      color: "bg-emerald-500 text-slate-950"
    },
    {
      label: "You owe",
      value: formatMoney(
        dashboard.you_owe,
        dashboard.currency
      ),
      description: "Amount you need to pay",
      icon: ArrowUpRight,
      color: "bg-orange-400 text-slate-950"
    },
    {
      label: "Active groups",
      value: String(dashboard.active_groups),
      description: "Groups you belong to",
      icon: UsersRound,
      color: "bg-white text-slate-950"
    }
  ];

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
        Dashboard
      </p>

      <h1 className="mt-3 text-3xl font-bold text-slate-950">
        Welcome back,{" "}
        {user?.name?.split(" ")[0] ?? "there"}
      </h1>

      <p className="mt-2 text-slate-600">
        Here is an overview of your shared expenses.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={
                `rounded-2xl border border-slate-200 ` +
                `p-6 shadow-sm ${card.color}`
              }
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold opacity-70">
                  {card.label}
                </p>

                <Icon size={21} />
              </div>

              <p className="mt-6 text-3xl font-bold">
                {card.value}
              </p>

              <p className="mt-2 text-sm opacity-65">
                {card.description}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Recent activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest group changes.
              </p>
            </div>

            <Activity className="text-emerald-600" />
          </div>

          {dashboard.recent_activities.length === 0 ? (
            <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
              <Activity className="mx-auto text-slate-400" />

              <p className="mt-3 text-sm text-slate-500">
                Your latest expenses and settlements
                will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {dashboard.recent_activities.map(
                (activity) => (
                  <Link
                    key={activity.id}
                    to={`/groups/${activity.group_id}`}
                    className="flex gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      {activity.entity_type ===
                      "settlement" ? (
                        <HandCoins size={19} />
                      ) : (
                        <ReceiptText size={19} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-slate-700">
                        <span className="font-semibold text-slate-950">
                          {activity.actor_name}
                        </span>{" "}
                        {getActivityMessage(activity)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Your groups
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your recently updated groups.
              </p>
            </div>

            <Link
              to="/groups"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {dashboard.recent_groups.length === 0 ? (
            <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
              <UsersRound className="mx-auto text-slate-400" />

              <p className="mt-3 text-sm text-slate-500">
                You have not joined any expense groups yet.
              </p>

              <Link
                to="/groups"
                className="mt-4 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Create a group
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {dashboard.recent_groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <UsersRound size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {group.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {group.member_count}{" "}
                        {group.member_count === 1
                          ? "member"
                          : "members"}
                        {" · "}
                        {group.current_user_role}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <CalendarDays
                      size={16}
                      className="ml-auto text-slate-400"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      {new Intl.DateTimeFormat(
                        "en-IN",
                        {
                          dateStyle: "medium"
                        }
                      ).format(
                        new Date(group.created_at)
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}


export default DashboardPage;