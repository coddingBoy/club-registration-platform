import { Link } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm.jsx";

function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              2026 Soccer School Intake
            </span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                Register young players for a focused, modern football program.
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                Capture registrations, collect payment proof, and let staff manage
                approvals from a simple dashboard.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Skill-first coaching", "Small group sessions from U6 to U16."],
                ["Fast admin review", "Track statuses and export registrations to CSV."],
                ["Parent-friendly flow", "Works cleanly on mobile without extra steps."],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur"
                >
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sky-200">
                  Admin access
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Manage registrations from one dashboard
                </h2>
              </div>
              <Link
                to="/admin/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 font-semibold text-white transition hover:bg-slate-800"
              >
                Admin login
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:pt-10">
          <RegistrationForm />
        </div>
      </section>
    </main>
  );
}

export default HomePage;
