import {
  useInfiniteQuery
} from "@tanstack/react-query";

import {
  Activity,
  HandCoins,
  LoaderCircle,
  Pencil,
  ReceiptText,
  Trash2,
  UserPlus,
  UsersRound
} from "lucide-react";

import {
  getGroupActivities
} from "../api/getGroupActivities";

import type {
  GroupActivity
} from "../../../types/activity";


type ActivitySectionProps = {
  groupId: string;
};


const PAGE_SIZE = 10;


function getDetail(
  activity: GroupActivity,
  key: string
): string {
  const value = activity.details?.[key];

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return "";
}


function getActivityMessage(
  activity: GroupActivity
): string {
  const title = getDetail(
    activity,
    "title"
  );

  const amount = getDetail(
    activity,
    "amount"
  );

  const currency = getDetail(
    activity,
    "currency"
  );

  const memberName = getDetail(
    activity,
    "member_name"
  );

  const fromUserName = getDetail(
    activity,
    "from_user_name"
  );

  const toUserName = getDetail(
    activity,
    "to_user_name"
  );

  const groupName = getDetail(
    activity,
    "group_name"
  );

  switch (activity.action) {
    case "group.created":
      return `created the group "${groupName}"`;

    case "member.added":
      return `added ${memberName} to the group`;

    case "expense.created":
      return (
        `created the expense "${title}" ` +
        `for ${currency} ${amount}`
      );

    case "expense.updated":
      return (
        `updated the expense "${title}" ` +
        `to ${currency} ${amount}`
      );

    case "expense.deleted":
      return (
        `deleted the expense "${title}" ` +
        `of ${currency} ${amount}`
      );

    case "settlement.created":
      return (
        `recorded a payment of ` +
        `${currency} ${amount} from ` +
        `${fromUserName} to ${toUserName}`
      );

    default:
      return activity.action.replaceAll(
        ".",
        " "
      );
  }
}


function getActivityIcon(action: string) {
  const iconClasses = "h-5 w-5";

  switch (action) {
    case "group.created":
      return (
        <UsersRound
          className={iconClasses}
        />
      );

    case "member.added":
      return (
        <UserPlus
          className={iconClasses}
        />
      );

    case "expense.created":
      return (
        <ReceiptText
          className={iconClasses}
        />
      );

    case "expense.updated":
      return (
        <Pencil
          className={iconClasses}
        />
      );

    case "expense.deleted":
      return (
        <Trash2
          className={iconClasses}
        />
      );

    case "settlement.created":
      return (
        <HandCoins
          className={iconClasses}
        />
      );

    default:
      return (
        <Activity
          className={iconClasses}
        />
      );
  }
}


function formatActivityDate(
  date: string
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(new Date(date));
}


export default function ActivitySection({
  groupId
}: ActivitySectionProps) {
  const activitiesQuery = useInfiniteQuery({
    queryKey: [
      "group-activities",
      groupId
    ],

    initialPageParam: 0,

    queryFn: ({ pageParam }) =>
      getGroupActivities(
        groupId,
        PAGE_SIZE,
        pageParam
      ),

    getNextPageParam: (lastPage) => {
      const nextOffset =
        lastPage.offset +
        lastPage.items.length;

      if (nextOffset < lastPage.total) {
        return nextOffset;
      }

      undefined;
    }
  });

  if (activitiesQuery.isPending) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center gap-3 py-8">
          <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />

          <p className="text-sm text-slate-500">
            Loading activity history...
          </p>
        </div>
      </section>
    );
  }

  if (activitiesQuery.isError) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">
          Unable to load activity history.
        </p>
      </section>
    );
  }

  const activities =
    activitiesQuery.data.pages.flatMap(
      (page) => page.items
    );

  const totalActivities =
    activitiesQuery.data.pages[0]?.total ?? 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Activity history
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent changes made inside this group.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
          {totalActivities}{" "}
          {totalActivities === 1
            ? "activity"
            : "activities"}
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-slate-400" />

                   <p className="mt-3 font-medium text-slate-700">
            No activity yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Group changes will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {activities.map((activity) => (
              <article
                key={activity.id}
                className="flex gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  {getActivityIcon(
                    activity.action
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">
                      {activity.actor_name}
                    </span>{" "}

                    {getActivityMessage(
                      activity
                    )}
                  </p>

                  <time
                    className="mt-1 block text-xs text-slate-500"
                    dateTime={
                      activity.created_at
                    }
                  >
                    {formatActivityDate(
                      activity.created_at
                    )}
                  </time>
                </div>
              </article>
            ))}
          </div>

          {activitiesQuery.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={
                  activitiesQuery.isFetchingNextPage
                }
                onClick={() => {
                  void activitiesQuery.fetchNextPage();
                }}
                className="flex items-center gap-2 rounded-xl border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activitiesQuery.isFetchingNextPage && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}

                {activitiesQuery.isFetchingNextPage
                  ? "Loading..."
                  : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}