import { useState } from "react";
import { ShieldAlert, TriangleAlert, X } from "lucide-react";
import { bidAPI } from "../services/api.js";
import { formatCurrency } from "../utils/format.js";

function HashRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="break-all font-mono text-slate-700">{value ?? "—"}</span>
    </div>
  );
}

export default function AdminBidOverridePanel({ bid, onClose, onOverridden }) {
  const [newAmount, setNewAmount] = useState(String(bid.amount));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function applyOverride(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await bidAPI.adminOverride(bid.id, {
        amount: Number(newAmount),
        note: "Insider tampering demo: amount edited directly via Admin Dashboard override."
      });
      setResult(res);
      onOverridden?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Override request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel mt-4 border-2 border-rose-300/60 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-rose-700">
            <TriangleAlert className="h-5 w-5" /> Admin Override (Demo: Insider Tampering) — {bid.id}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            This directly edits the bid's stored amount in the database, exactly like a rogue administrator or a
            compromised admin account might. It does <strong>not</strong> touch the blockchain commitment made at
            submission time — that commitment is immutable and cannot be rewritten. As soon as you save, every
            screen showing this bid will independently recompute its hash and flag the mismatch.
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-3 ring-1 ring-slate-200">
        <HashRow label="Currently stored amount" value={formatCurrency(bid.amount)} />
        <HashRow label="Original commit hash" value={bid.commitHash} />
      </div>

      <form onSubmit={applyOverride} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="block text-sm font-medium text-slate-700">
          New amount to write directly to the database
          <input
            className="field mt-1"
            type="number"
            value={newAmount}
            onChange={(event) => setNewAmount(event.target.value)}
            required
          />
        </label>
        <div className="flex items-end">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            type="submit"
            disabled={loading}
          >
            {loading ? "Overriding..." : "Apply Override"}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {result && (
        <div
          className={`mt-4 rounded-md p-4 ring-1 ${
            result.integrity.intact ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200"
          }`}
        >
          <div className={`flex items-center gap-2 text-sm font-semibold ${result.integrity.intact ? "text-emerald-800" : "text-rose-800"}`}>
            <ShieldAlert className="h-5 w-5" />
            {result.integrity.intact ? "Amount updated — integrity check still passes" : "Bid now reports as COMPROMISED"}
          </div>
          <p className={`mt-1 text-sm ${result.integrity.intact ? "text-emerald-700" : "text-rose-700"}`}>{result.message}</p>
          <div className="mt-3 rounded bg-white/70 p-3 ring-1 ring-black/5">
            <HashRow label="New stored amount" value={formatCurrency(result.data.amount)} />
            <HashRow label="Recomputed hash (live)" value={result.integrity.liveHash} />
            <HashRow label={`On-chain hash (${result.integrity.source})`} value={result.integrity.onChainHash} />
            <HashRow
              label="Modified by / when"
              value={`${result.data.adminModified?.byAdminName || "—"} at ${
                result.data.adminModified?.at ? new Date(result.data.adminModified.at).toLocaleString() : "—"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
