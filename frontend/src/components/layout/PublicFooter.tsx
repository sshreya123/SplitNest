import { WalletCards } from "lucide-react";
import { Link } from "react-router";


function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-6">
      <div className="mx-auto grid max-w-7xl gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <WalletCards size={23} />
            </span>

            <span className="text-xl font-bold text-white">
              Split<span className="text-emerald-400">Nest</span>
            </span>
          </Link>

          <p className="mt-5 max-w-md leading-7 text-slate-400">
            A simple and transparent way to share expenses, track balances and
            settle payments with the people who matter.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Product
          </h3>

          <nav className="mt-5 flex flex-col gap-3">
            <a
              href="/#features"
              className="text-slate-400 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="/#how-it-works"
              className="text-slate-400 transition hover:text-white"
            >
              How it works
            </a>

            <Link
              to="/register"
              className="text-slate-400 transition hover:text-white"
            >
              Create account
            </Link>
          </nav>
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Account
          </h3>

          <nav className="mt-5 flex flex-col gap-3">
            <Link
              to="/login"
              className="text-slate-400 transition hover:text-white"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="text-slate-400 transition hover:text-white"
            >
              Register
            </Link>

            <Link
              to="/dashboard"
              className="text-slate-400 transition hover:text-white"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-slate-800 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {currentYear} SplitNest. All rights reserved.
        </p>

        <p>
          Built for simpler shared finances.
        </p>
      </div>
    </footer>
  );
}

export default PublicFooter;