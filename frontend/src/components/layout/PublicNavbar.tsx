import { useState } from "react";
import { Link } from "react-router";
import { Menu, WalletCards, X } from "lucide-react";


function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={closeMenu}
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
            <WalletCards size={23} />
          </span>

          <span className="text-xl font-bold text-white">
            Split<span className="text-emerald-400">Nest</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            How it works
          </a>

          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Log in
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white md:hidden"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((previousValue) => !previousValue)}
        >
          {isMenuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-5 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <a
              href="#features"
              className="rounded-lg px-3 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
              onClick={closeMenu}
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="rounded-lg px-3 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
              onClick={closeMenu}
            >
              How it works
            </a>

            <Link
              to="/login"
              className="rounded-lg px-3 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
              onClick={closeMenu}
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="mt-2 rounded-xl bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950"
              onClick={closeMenu}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicNavbar;