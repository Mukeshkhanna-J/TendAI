import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

export default function IntegrityBadge({ integrity }) {
  if (!integrity || !integrity.checked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
        <ShieldQuestion className="h-3.5 w-3.5" /> No On-Chain Record
      </span>
    );
  }

  if (integrity.intact) {
    return (
      <span className="group relative inline-flex">
        <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Blockchain Verified
        </span>
        <span className="pointer-events-none absolute left-0 top-8 z-20 hidden w-72 rounded-md bg-slate-950 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block">
          Current amount hashes to exactly the commitment stored on-chain. No tampering detected.
        </span>
      </span>
    );
  }

  return (
    <span className="group relative inline-flex">
      <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-300">
        <ShieldAlert className="h-3.5 w-3.5" /> Compromised
      </span>
      <span className="pointer-events-none absolute left-0 top-8 z-20 hidden w-80 rounded-md bg-slate-950 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block">
        The stored bid amount no longer matches its immutable blockchain commitment ({integrity.source}). This
        indicates the record was altered after submission.
      </span>
    </span>
  );
}
