import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import InputField from "../components/InputField.jsx";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      navigate("/admin/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl gap-8 overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[1fr_440px]">
        <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-200">
              Soccer School Admin
            </p>
            <h1 className="mt-4 max-w-sm text-4xl font-bold">
              Review players, confirm payment, and keep enrollment moving.
            </h1>
          </div>
          <div className="space-y-3 text-sm text-sky-50/90">
            <p>Use the dashboard to search registrations and update status in place.</p>
            <p>CSV export is available for reporting or handoff to office staff.</p>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <Link to="/" className="text-sm font-semibold text-sky-700">
              Back to registration
            </Link>
            <h2 className="mt-4 text-3xl font-bold text-slate-950">Admin login</h2>
            <p className="mt-2 text-slate-600">
              Sign in with the credentials stored in the backend environment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
            {error ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default AdminLoginPage;
