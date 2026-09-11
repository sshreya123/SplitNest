import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  LoaderCircle,
  ShieldCheck,
  UsersRound,
  Plus
} from "lucide-react";
import { Link } from "react-router";
import { getGroups } from "../features/groups/api/getGroups";
import { useState } from "react";
import CreateGroupModal from "../features/groups/components/CreateGroupModal";

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


function GroupsPage() {
    const [
  isCreateModalOpen,
  setIsCreateModalOpen
] = useState(false);
  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups
  });

  const groups = groupsQuery.data ?? [];

  return (
    <section>
    <div className="flex items-center gap-3">
  {!groupsQuery.isPending && (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <span className="font-bold text-slate-950">
        {groups.length}
      </span>{" "}
      {groups.length === 1
        ? "group"
        : "groups"}
    </div>
  )}

  <button
    type="button"
    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
    onClick={() =>
      setIsCreateModalOpen(true)
    }
  >
    <Plus size={18} />
    Create group
  </button>
</div>

      {groupsQuery.isPending && (
        <div className="mt-10 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <LoaderCircle
              className="mx-auto animate-spin text-emerald-600"
              size={34}
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading your groups...
            </p>
          </div>
        </div>
      )}

      {groupsQuery.isError && (
        <div
          role="alert"
          className="mt-10 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={21}
          />

          <div>
            <p className="font-semibold">
              Unable to load groups
            </p>

            <p className="mt-1 text-sm">
              Check your connection and try again.
            </p>

            <button
              type="button"
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              onClick={() => groupsQuery.refetch()}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {groupsQuery.isSuccess &&
        groups.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UsersRound size={30} />
            </span>

            <h2 className="mt-6 text-xl font-semibold text-slate-950">
              No groups yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Create your first group to start
              recording and sharing expenses.
            </p>
          </div>
        )}

      {groupsQuery.isSuccess &&
        groups.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <Link
  key={group.id}
  to={`/groups/${group.id}`}
  className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
>
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <UsersRound size={23} />
                  </span>

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

                <h2 className="mt-6 text-xl font-semibold text-slate-950">
                  {group.name}
                </h2>

                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {group.description ??
                    "No description provided."}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <UsersRound size={15} />

                      <span className="text-xs font-medium">
                        Members
                      </span>
                    </div>

                    <p className="mt-2 font-bold text-slate-950">
                      {group.member_count}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <ShieldCheck size={15} />

                      <span className="text-xs font-medium">
                        Currency
                      </span>
                    </div>

                    <p className="mt-2 font-bold text-slate-950">
                      {group.default_currency}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
                  <CalendarDays size={15} />

                  Created {formatDate(group.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
        <CreateGroupModal
  isOpen={isCreateModalOpen}
  onClose={() =>
    setIsCreateModalOpen(false)
  }
/>
    </section>
  );
}

export default GroupsPage;