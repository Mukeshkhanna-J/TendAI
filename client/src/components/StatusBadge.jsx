const styles = {
  Live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-slate-100 text-slate-700 ring-slate-300",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  Awarded: "bg-blue-50 text-blue-700 ring-blue-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  "Under Evaluation": "bg-amber-50 text-amber-700 ring-amber-200"
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] || styles.Closed}`}>
      {status}
    </span>
  );
}
