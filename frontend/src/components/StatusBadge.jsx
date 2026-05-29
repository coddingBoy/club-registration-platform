const classes = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  waitlisted: "bg-sky-100 text-sky-800",
  rejected: "bg-rose-100 text-rose-800",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes[status] || "bg-slate-100 text-slate-800"}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
