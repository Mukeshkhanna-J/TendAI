import { useState } from "react";
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";

const verdictStyles = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  caution: "border-amber-200 bg-amber-50 text-amber-800",
  bad: "border-rose-200 bg-rose-50 text-rose-800"
};

function scoreTone(score) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-rose-700";
}

export default function AIScoreBreakdown({ score, factors, compromised }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <span className={`text-lg font-bold ${compromised ? "text-rose-600 line-through" : scoreTone(score)}`}>
            {score}
          </span>
          <span className="text-xs text-slate-500">AI Trust Score {compromised ? "(suppressed — see below)" : "/ 100"}</span>
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-gov-blue">
          Why this score? {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          {compromised && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
              This bid failed its blockchain integrity check, so the score above is suppressed regardless of the
              factors below — an amount that doesn't match its original commitment can't be trusted, no matter how
              favorably it scores on paper.
            </p>
          )}
          {(factors || []).map((factor, index) => (
            <div key={index} className={`rounded-md border px-3 py-2 text-xs ${verdictStyles[factor.verdict] || verdictStyles.caution}`}>
              <div className="flex items-center justify-between font-semibold">
                <span>{factor.label}</span>
                <span className="flex items-center gap-1">
                  {factor.impact === 0 ? (
                    <Minus className="h-3 w-3" />
                  ) : factor.impact > 0 ? (
                    <Plus className="h-3 w-3" />
                  ) : null}
                  {factor.impact > 0 ? `+${factor.impact}` : factor.impact}
                </span>
              </div>
              <p className="mt-1 font-normal leading-5">{factor.detail}</p>
            </div>
          ))}
          {(!factors || factors.length === 0) && (
            <p className="text-xs text-slate-500">No scoring breakdown available for this bid.</p>
          )}
        </div>
      )}
    </div>
  );
}
