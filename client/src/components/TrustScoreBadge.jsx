export default function TrustScoreBadge({ score }) {
  const tone = score >= 80
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : score >= 60
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-rose-50 text-rose-700 ring-rose-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}>
      AI Trust Score {score}
    </span>
  );
}
