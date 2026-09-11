import { Link } from "react-router";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <section className="text-center">
        <p className="text-7xl font-bold text-emerald-400">
          404
        </p>

        <h1 className="mt-4 text-3xl font-bold text-white">
          Page not found
        </h1>

        <p className="mt-3 text-slate-400">
          The page you are looking for doesn&apos;t exist.
        </p>

        <Link
          to="/"
          className="mt-7 inline-block rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;