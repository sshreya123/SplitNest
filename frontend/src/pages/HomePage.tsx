import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import FeaturesSection from "../components/home/FeaturesSection";
import PublicNavbar from "../components/layout/PublicNavbar";
import HowItWorksSection from "../components/home/HowItWorksSection";
import CTASection from "../components/home/CTASection";
import PublicFooter from "../components/layout/PublicFooter";
function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicNavbar />

      <main>
        <section className="relative overflow-hidden px-6 py-24 sm:py-32">
          <div className="absolute left-1/2 top-0 -z-0 size-96 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-400">
                Smarter group expense management
              </p>

              <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
                Share expenses.
                <span className="block text-emerald-400">
                  Keep friendships simple.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                SplitNest helps friends, roommates and families divide expenses,
                track balances and settle payments without confusing calculations.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Start splitting
                  <ArrowRight size={19} />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3.5 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-9 flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:gap-6">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  Free to get started
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  No credit card required
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-emerald-950/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Total group spending
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      ₹24,850
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-400">
                    Goa Trip
                  </span>
                </div>

                <div className="my-6 h-px bg-slate-800" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-4">
                    <div>
                      <p className="font-medium">Hotel booking</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Paid by Shreya
                      </p>
                    </div>

                    <p className="font-semibold">₹12,000</p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-4">
                    <div>
                      <p className="font-medium">Dinner</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Paid by Ananya
                      </p>
                    </div>

                    <p className="font-semibold">₹3,250</p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-4">
                    <div>
                      <p className="font-medium">Cab expenses</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Paid by Rahul
                      </p>
                    </div>

                    <p className="font-semibold">₹1,800</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-sm text-slate-400">
                    Your overall balance
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-400">
                    You are owed ₹2,450
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <FeaturesSection />
         <HowItWorksSection />
          <CTASection />
      </main>
       <PublicFooter />
    </div>
  );
}

export default HomePage;