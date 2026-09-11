import {
  BadgeIndianRupee,
  CircleUserRound,
  ReceiptIndianRupee
} from "lucide-react";


const steps = [
  {
    number: "01",
    title: "Create your group",
    description:
      "Create a group for a trip, apartment, event or any shared activity and add its members.",
    icon: CircleUserRound
  },
  {
    number: "02",
    title: "Add shared expenses",
    description:
      "Record who paid and divide the expense equally, by exact amounts or by percentages.",
    icon: ReceiptIndianRupee
  },
  {
    number: "03",
    title: "Settle the balance",
    description:
      "View simplified balances and record payments when members settle what they owe.",
    icon: BadgeIndianRupee
  }
];


function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-slate-950 px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            How it works
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            From expense to settlement in three steps
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-400">
            SplitNest handles the calculations while your group focuses on
            enjoying the experience.
          </p>
        </div>

        <div className="relative mt-16 grid gap-8 lg:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-16 hidden h-px bg-linear-to-r from-emerald-400/20 via-emerald-400/60 to-emerald-400/20 lg:block"
          />

          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="relative rounded-3xl border border-slate-800 bg-slate-900 p-8"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40">
                    <Icon size={29} />
                  </span>

                  <span className="text-5xl font-bold text-slate-800">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-8 text-2xl font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-400">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;