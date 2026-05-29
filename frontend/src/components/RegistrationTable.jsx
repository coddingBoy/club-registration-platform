import StatusBadge from "./StatusBadge.jsx";

const uploadBaseUrl = import.meta.env.VITE_UPLOADS_URL || "";

function RegistrationTable({ registrations, onStatusChange, isUpdatingId }) {
  if (!registrations.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No registrations match the current filters.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white lg:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {["Player", "Parent", "Contact", "Group", "Status", "Payment", "Actions"].map(
                (heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((registration) => (
              <tr key={registration._id} className="align-top">
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-900">
                    {registration.playerName}
                  </div>
                  <div className="text-sm text-slate-500">
                    DOB {new Date(registration.dateOfBirth).toISOString().slice(0, 10)}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {registration.parentName}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  <div>{registration.email}</div>
                  <div>{registration.phone}</div>
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-700">
                  {registration.ageGroup}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={registration.status} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  <div>{registration.paymentReference || "No reference"}</div>
                  {registration.paymentProofUrl ? (
                    <a
                      className="mt-2 inline-flex font-semibold text-sky-700"
                      href={`${uploadBaseUrl}${registration.paymentProofUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View proof
                    </a>
                  ) : (
                    <div className="mt-2 text-slate-400">No file</div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <select
                    value={registration.status}
                    onChange={(event) =>
                      onStatusChange(registration._id, event.target.value)
                    }
                    disabled={isUpdatingId === registration._id}
                    className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-sky-500"
                  >
                    {["pending", "approved", "waitlisted", "rejected"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {registrations.map((registration) => (
          <article
            key={registration._id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {registration.playerName}
                </h3>
                <p className="text-sm text-slate-500">
                  {registration.parentName} • {registration.ageGroup}
                </p>
              </div>
              <StatusBadge status={registration.status} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>{registration.email}</p>
              <p>{registration.phone}</p>
              <p>DOB {new Date(registration.dateOfBirth).toISOString().slice(0, 10)}</p>
              <p>{registration.paymentReference || "No payment reference"}</p>
              {registration.paymentProofUrl ? (
                <a
                  className="inline-flex font-semibold text-sky-700"
                  href={`${uploadBaseUrl}${registration.paymentProofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View proof of payment
                </a>
              ) : null}
            </div>
            <select
              value={registration.status}
              onChange={(event) => onStatusChange(registration._id, event.target.value)}
              disabled={isUpdatingId === registration._id}
              className="mt-4 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-sky-500"
            >
              {["pending", "approved", "waitlisted", "rejected"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </article>
        ))}
      </div>
    </>
  );
}

export default RegistrationTable;
