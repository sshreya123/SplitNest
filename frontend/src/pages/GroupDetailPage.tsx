import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  LoaderCircle,
  Mail,
  ShieldCheck,
  UserRound,
  UserPlus,
  UsersRound
} from "lucide-react";
import ActivitySection
  from "../features/groups/components/ActivitySection";
import GroupBalanceSummary
  from "../features/expenses/components/GroupBalanceSummary";
import {
  Link,
  useParams
} from "react-router";

import {
  getGroupDetail
} from "../features/groups/api/getGroupDetail";

import { useState } from "react";
import {
  useGroupRealtime
} from "../features/groups/hooks/useGroupRealtime";
import AddGroupMemberModal
  from "../features/groups/components/AddGroupMemberModal";
  import SettlementSection
  from "../features/settlements/components/SettlementSection";
import GroupExpenseList from "../features/expenses/components/GroupExpenseList";
import DebtSuggestions
  from "../features/expenses/components/DebtSuggestions";
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


function GroupDetailPage() {
  const { groupId } = useParams<{
    groupId: string;
  }>();
    useGroupRealtime(groupId);
  const [
  isAddMemberModalOpen,
  setIsAddMemberModalOpen
] = useState(false);

  const groupQuery = useQuery({
    queryKey: [
      "groups",
      groupId
    ],

    queryFn: () =>
      getGroupDetail(groupId as string),

    enabled: Boolean(groupId)
  });


  if (groupQuery.isPending) {
    return (
<div className="m-4 flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm sm:m-6 lg:m-8">        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-emerald-600"
            size={36}
          />

          <p className="mt-4 text-sm text-slate-500">
            Loading group details...
          </p>
        </div>
      </div>
    );
  }


  if (groupQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
      >
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={22}
          />

          <div>
            <h1 className="font-semibold">
              Unable to load this group
            </h1>

            <p className="mt-1 text-sm">
              The group may not exist, or you may
              not have permission to view it.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                onClick={() =>
                  groupQuery.refetch()
                }
              >
                Try again
              </button>

              <Link
                to="/groups"
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold transition hover:bg-red-100"
              >
                Back to groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const group = groupQuery.data;

 return (
  <section className="min-h-full bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
    <div className="mx-auto max-w-7xl">
      <Link
        to="/groups"
className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm">        <ArrowLeft size={18} />
        Back to groups
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UsersRound size={28} />
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-950 md:text-3xl">
                  {group.name}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    group.current_user_role ===
                    "admin"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {group.current_user_role}
                </span>
              </div>

              <p className="mt-3 max-w-2xl leading-7 text-slate-500">
                {group.description ??
                  "No description provided for this group."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <UsersRound size={17} />
              Members
            </div>

            <p className="mt-2 text-xl font-bold text-slate-950">
              {group.member_count}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck size={17} />
              Currency
            </div>

            <p className="mt-2 text-xl font-bold text-slate-950">
              {group.default_currency}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays size={17} />
              Created
            </div>

            <p className="mt-2 font-bold text-slate-950">
              {formatDate(group.created_at)}
            </p>
          </div>
        </div>
      </div>
      <GroupBalanceSummary
  groupId={group.id}
/>
<DebtSuggestions
  groupId={group.id}
/>
<SettlementSection
  groupId={group.id}
  currency={group.default_currency}
  members={group.members}
  currentUserRole={
    group.current_user_role
  }
/>

<GroupExpenseList
  groupId={group.id}
  currency={group.default_currency}
  members={group.members}
  currentUserRole={
    group.current_user_role
  }
/>
<div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">       
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">       
       <div>
            <h2 className="text-xl font-bold text-slate-950">
              Group members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              People who can participate in this
              group’s expenses.
            </p>
          </div>

          {/* <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {group.members.length}{" "}
            {group.members.length === 1
              ? "member"
              : "members"}
          </span> */}
<div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
    {group.members.length}{" "}
    {group.members.length === 1
      ? "member"
      : "members"}
  </span>

  {group.current_user_role === "admin" && (
    <button
      type="button"
      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      onClick={() =>
        setIsAddMemberModalOpen(true)
      }
    >
      <UserPlus size={17} />
      Add member
    </button>
  )}
</div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40">
          {group.members.map(
            (member, index) => (
              <article
                key={member.user_id}
                className={`flex flex-col justify-between gap-4 bg-white p-4 transition hover:bg-emerald-50/40 sm:flex-row sm:items-center sm:p-5 ${
                  index !==
                  group.members.length - 1
                    ? "border-b border-slate-200"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserRound size={21} />
                  </span>

                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {member.name}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <Mail size={14} />
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        member.role === "admin"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {member.role}
                    </span>

                    <p className="mt-2 text-xs text-slate-400">
                      Joined{" "}
                      {formatDate(
                        member.joined_at
                      )}
                    </p>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </div>
      <div className="mt-8">
  <ActivitySection groupId={group.id} />
</div>  
      <AddGroupMemberModal
  groupId={group.id}
  isOpen={isAddMemberModalOpen}
  onClose={() =>
    setIsAddMemberModalOpen(false)
  }
/>
   
        </div>
  </section>
  );
}


export default GroupDetailPage;