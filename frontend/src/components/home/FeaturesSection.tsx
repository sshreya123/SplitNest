
import {
  ChartNoAxesCombined,
  HandCoins,
  ReceiptText,
  Scale,
  ShieldCheck,
  Users
} from "lucide-react";


const features = [
  {
    title: "Create expense groups",
    description:
      "Organize expenses for trips, roommates, events or family in separate groups.",
    icon: Users
  },
  {
    title: "Flexible expense splits",
    description:
      "Split expenses equally, by exact amounts or by custom percentages.",
    icon: Scale
  },
  {
    title: "Track every expense",
    description:
      "Maintain a clear history of who paid, who participated and how much each person owes.",
    icon: ReceiptText
  },
  {
    title: "Simplified balances",
    description:
      "See exactly how much you owe and how much others owe you without manual calculations.",
    icon: ChartNoAxesCombined
  },
  {
    title: "Record settlements",
    description:
      "Record payments between members and keep group balances updated automatically.",
    icon: HandCoins
  },
  {
    title: "Secure and private",
    description:
      "Your account and financial information are protected using secure authentication.",
    icon: ShieldCheck
  }
];


function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-slate-900 px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Everything you need
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Make shared expenses effortless
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-400">
            From recording an expense to settling the final balance, SplitNest
            keeps every step simple and transparent.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-950/20"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 transition group-hover:bg-emerald-400 group-hover:text-slate-950">
                  <Icon size={24} />
                </div>

                <h3 className="mt-6 text-xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;