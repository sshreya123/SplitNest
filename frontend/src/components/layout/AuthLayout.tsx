import { CheckCircle2, WalletCards } from "lucide-react";
import { Link, Outlet } from "react-router";


const benefits = [
  "Create unlimited expense groups",
  "Split expenses using multiple methods",
  "Track who owes whom",
  "Record and manage settlements"
];
function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
      <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col">
        <Link to="/" className="inline-flex items-center gap-2 self-start">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
            <WalletCards size={25} />
          </span>

          <span className="text-2xl font-bold">
            Split<span className="text-emerald-400">Nest</span>
          </span>
        </Link>

        <div className="my-auto max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Shared expenses made simple
          </p>
                    <h1 className="mt-5 text-5xl font-bold leading-tight">
            Spend together.
            <span className="block text-emerald-400">
              Settle effortlessly.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            SplitNest keeps every shared expense organized, transparent and
            easy to settle.
          </p>

          <ul className="mt-10 space-y-4">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3 text-slate-300"
              >
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-emerald-400"
                />
                  <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} SplitNest
        </p>
      </section>

      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-2 lg:hidden"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <WalletCards size={23} />
            </span>
             <span className="text-xl font-bold text-slate-950">
              Split<span className="text-emerald-600">Nest</span>
            </span>
          </Link>

          <Link
            to="/"
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </section>
      </main>
  );
}

export default AuthLayout;