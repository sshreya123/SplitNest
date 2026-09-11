import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import {
  registerSchema,
  type RegisterFormValues
} from "../features/auth/schemas/registerSchema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { registerUser } from "../features/auth/api/registerUser";
interface ApiErrorResponse {
  detail?: string;
}
function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });
const navigate = useNavigate();

const registrationMutation = useMutation({
  mutationFn: registerUser,

  onSuccess: () => {
    navigate("/login", {
      replace: true,
      state: {
        successMessage:
          "Your account was created successfully. You can now log in."
      }
    });
  }
});
 async function onSubmit(data: RegisterFormValues) {
  const {
    confirmPassword: _confirmPassword,
    ...registrationData
  } = data;

  try {
    await registrationMutation.mutateAsync(registrationData);
  } catch {
    // The mutation stores the error in registrationMutation.error.
  }
}
const isRegistering =
  isSubmitting || registrationMutation.isPending;
  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
        Get started
      </p>

      <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
        Create your account
      </h1>

      <p className="mt-3 text-slate-600">
        Join SplitNest and start managing group expenses.
      </p>
{registrationMutation.isError && (
  <div
    role="alert"
    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  >
    {axios.isAxiosError<ApiErrorResponse>(
      registrationMutation.error
    )
      ? registrationMutation.error.response?.data.detail ??
        "Unable to create your account. Please try again."
      : "Unable to create your account. Please try again."}
  </div>
)}
      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Full name
          </label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 ${
              errors.name
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            }`}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />

          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

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
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition placeholder:text-slate-400 ${
                errors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              }`}
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {errors.password ? (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          ) : (
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Use at least 8 characters with uppercase, lowercase and a number.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Confirm password
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter the password again"
              className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition placeholder:text-slate-400 ${
                errors.confirmPassword
                  ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              }`}
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label={
                showConfirmPassword
                  ? "Hide confirmed password"
                  : "Show confirmed password"
              }
              onClick={() =>
                setShowConfirmPassword((current) => !current)
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

       <button
  type="submit"
  disabled={isRegistering}
  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isRegistering && (
    <LoaderCircle
      className="animate-spin"
      size={19}
    />
  )}

  {isRegistering
    ? "Creating account..."
    : "Create account"}
</button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Log in
        </Link>
      </p>
    </section>
  );
}

export default RegisterPage;