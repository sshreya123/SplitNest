import {
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router";

import {
  useAuth
} from "../../features/auth/context/AuthContext";


const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Groups",
    path: "/groups",
    icon: UsersRound
  }
];


function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const {
    user,
    logout
  } = useAuth();

  const navigate = useNavigate();

  const initials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "U";

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();

      navigate("/login", {
        replace: true
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2"
            onClick={closeSidebar}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <WalletCards size={23} />
            </span>

            <span className="text-xl font-bold">
              Split
              <span className="text-emerald-400">
                Nest
              </span>
            </span>
          </NavLink>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
            onClick={closeSidebar}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-400 text-slate-950"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-900 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-400 font-bold text-slate-950">
              {initials}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleLogout}
          >
            {isLoggingOut ? (
              <LoaderCircle
                className="animate-spin"
                size={18}
              />
            ) : (
              <LogOut size={18} />
            )}

            {isLoggingOut
              ? "Logging out..."
              : "Log out"}
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur sm:px-8">
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-950">
                {user?.name}
              </p>

              <p className="text-xs text-slate-500">
                Personal account
              </p>
            </div>

            <span className="flex size-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {initials}
            </span>
          </div>
        </header>

        <main className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;