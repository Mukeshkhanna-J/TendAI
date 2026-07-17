import { ShieldCheck } from "lucide-react";

export default function BlockchainBadge({ txHash }) {
  return (
    <span className="group relative inline-flex">
      <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified on Blockchain
      </span>
      <span className="pointer-events-none absolute left-0 top-8 z-20 hidden w-72 rounded-md bg-slate-950 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block">
        Tx: {txHash || "Pending"}
      </span>
    </span>
  );
}
