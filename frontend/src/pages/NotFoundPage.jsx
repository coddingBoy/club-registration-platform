import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.12em] text-slate-500">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Page not found</h1>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 font-semibold text-white"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
