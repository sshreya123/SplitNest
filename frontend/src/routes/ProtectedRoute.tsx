import {
  LoaderCircle
} from "lucide-react";
import {
  Navigate,
  Outlet,
  useLocation
} from "react-router";

import {
  useAuth
} from "../features/auth/context/AuthContext";


function ProtectedRoute() {
  const {
    isAuthenticated,
    isInitializing
  } = useAuth();

  const location = useLocation();

  if (isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-emerald-400"
            size={38}
          />

          <p className="mt-4 text-slate-400">
            Restoring your session...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;