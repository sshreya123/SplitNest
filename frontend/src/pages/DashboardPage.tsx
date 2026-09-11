import {
  ArrowDownLeft,
  ArrowUpRight,
  UsersRound,
  WalletCards
} from "lucide-react";

import {
  useAuth
} from "../features/auth/context/AuthContext";


const summaryCards = [
  {
    label: "Total balance",
    value: "₹0.00",
    description: "Your overall balance",
    icon: WalletCards,
    color: "bg-slate-950 text-white"
  },
  {
    label: "You are owed",
    value: "₹0.00",
    description: "Amount others owe you",
    icon: ArrowDownLeft,
    color: "bg-emerald-500 text-slate-950"
  },
  {
    label: "You owe",
    value: "₹0.00",
    description: "Amount you need to pay",
    icon: ArrowUpRight,
    color: "bg-orange-400 text-slate-950"
  },
  {
    label: "Active groups",
    value: "0",
    description: "Groups you belong to",
    icon: UsersRound,
    color: "bg-white text-slate-950"
  }
];


function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
        Dashboard
      </p>

      <h1 className="mt-3 text-3xl font-bold text-slate-950">
        Welcome back, {user?.name.split(" ")[0]}
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
              className={`rounded-2xl border border-slate-200 p-6 shadow-sm ${card.color}`}
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
          <h2 className="text-lg font-semibold text-slate-950">
            Recent activity
          </h2>

          <p className="mt-8 text-center text-sm text-slate-500">
            Your latest expenses and settlements will
            appear here.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Your groups
          </h2>

          <p className="mt-8 text-center text-sm text-slate-500">
            You have not joined any expense groups yet.
          </p>
        </section>
      </div>
    </section>
  );
}

export default DashboardPage;