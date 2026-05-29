import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import InputField from "../components/InputField.jsx";
import RegistrationTable from "../components/RegistrationTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const defaultFilters = {
  search: "",
  status: "all",
  ageGroup: "all",
};

function DashboardPage() {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState("");
  const [error, setError] = useState("");

  const fetchRegistrations = async () => {
    setIsLoading(true);

    try {
      const { data } = await api.get("/registrations", {
        params: filters,
      });
      setRegistrations(data);
      setError("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
        navigate("/admin/login");
        return;
      }

      setError(
        requestError.response?.data?.message || "Unable to load registrations."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filters.search, filters.status, filters.ageGroup]);

  const handleStatusChange = async (id, status) => {
    setIsUpdatingId(id);

    try {
      const { data } = await api.patch(`/registrations/${id}/status`, { status });
      setRegistrations((current) =>
        current.map((item) => (item._id === id ? data : item))
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to update registration."
      );
    } finally {
      setIsUpdatingId("");
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/registrations/export/csv", {
        params: filters,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "registrations.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "CSV export failed.");
    }
  };

  const summary = registrations.reduce(
    (counts, registration) => {
      counts.total += 1;
      counts[registration.status] += 1;
      return counts;
    },
    { total: 0, pending: 0, approved: 0, waitlisted: 0, rejected: 0 }
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[32px] bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-sky-200">
                Admin dashboard
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                Manage soccer school registrations
              </h1>
              <p className="mt-2 text-sky-50/80">
                Signed in as {admin?.email || "admin"}.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-sky-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/admin/login");
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 px-5 font-semibold text-white transition hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Total", summary.total],
            ["Pending", summary.pending],
            ["Approved", summary.approved],
            ["Waitlisted", summary.waitlisted],
            ["Rejected", summary.rejected],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm uppercase tracking-[0.12em] text-slate-500">
                {label}
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <InputField
              label="Search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Search player, parent, email, or phone"
            />
            <InputField
              label="Status"
              as="select"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
            >
              {["all", "pending", "approved", "waitlisted", "rejected"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </InputField>
            <InputField
              label="Age group"
              as="select"
              value={filters.ageGroup}
              onChange={(event) =>
                setFilters((current) => ({ ...current, ageGroup: event.target.value }))
              }
            >
              {["all", "U6", "U8", "U10", "U12", "U14", "U16"].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </InputField>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section>
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading registrations...
            </div>
          ) : (
            <RegistrationTable
              registrations={registrations}
              onStatusChange={handleStatusChange}
              isUpdatingId={isUpdatingId}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
