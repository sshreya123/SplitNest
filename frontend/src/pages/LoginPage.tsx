import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  Eye,
  EyeOff,
  LoaderCircle
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router";

import {
  useAuth
} from "../features/auth/context/AuthContext";
import {
  loginSchema,
  type LoginFormValues
} from "../features/auth/schemas/loginSchema";


interface ApiErrorResponse {
  detail?: string;
}


interface LoginLocationState {
  successMessage?: string;
}


function LoginPage() {
  const [showPassword, setShowPassword] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const locationState =
    location.state as LoginLocationState | null;

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: ""
    }
  });
const { login } = useAuth();
 const loginMutation = useMutation({
  mutationFn: login,

    onSuccess: () => {
      navigate("/dashboard", {
        replace: true
      });
    }
  });

  async function onSubmit(
    data: LoginFormValues
  ) {
    try {
      await loginMutation.mutateAsync(data);
    } catch {
      // TanStack Query stores the error.
    }
  }

  const isLoggingIn =
    isSubmitting || loginMutation.isPending;

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
        Welcome back
      </p>

      <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
        Log in to your account
      </h1>

      <p className="mt-3 text-slate-600">
        Enter your details to continue managing
        your shared expenses.
      </p>

      {locationState?.successMessage && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {locationState.successMessage}
        </div>
      )}

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {loginMutation.isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {axios.isAxiosError<ApiErrorResponse>(
              loginMutation.error
            )
              ? loginMutation.error.response?.data
                  .detail ??
                "Unable to log in. Please try again."
              : "Unable to log in. Please try again."}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 ${
              errors.email
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            }`}
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />

          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <button
              type="button"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition placeholder:text-slate-400 ${
                errors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              }`}
              aria-invalid={Boolean(
                errors.password
              )}
              {...register("password")}
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              onClick={() =>
                setShowPassword(
                  (current) => !current
                )
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingIn && (
            <LoaderCircle
              className="animate-spin"
              size={19}
            />
          )}

          {isLoggingIn
            ? "Logging in..."
            : "Log in"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Create one
        </Link>
      </p>
    </section>
  );
}

export default LoginPage;