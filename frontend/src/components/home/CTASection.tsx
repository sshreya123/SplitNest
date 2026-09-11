import { ArrowRight } from "lucide-react";
import { Link } from "react-router";


function CTASection() {
  return (
    <section className="bg-slate-900 px-6 py-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-emerald-400/20 bg-emerald-400 px-6 py-16 text-center shadow-2xl shadow-emerald-950/30 sm:px-12">
        <div
          aria-hidden="true"
          className="absolute -left-20 -top-20 size-64 rounded-full bg-white/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-20 size-72 rounded-full bg-slate-950/20 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-800">
            Start sharing smarter
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Ready to simplify your shared expenses?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-800">
            Create your first group, add an expense and let SplitNest handle
            the calculations.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 py-3.5 font-semibold text-white transition hover:bg-slate-800"
          >
            Create free account
            <ArrowRight size={19} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CTASection;