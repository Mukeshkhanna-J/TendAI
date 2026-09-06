import { AlertTriangle, HelpCircle, Link2Off, ShieldAlert, ShieldCheck } from "lucide-react";
import { VERIFY_STATUS } from "../hooks/useVerifyBid.js";
import { formatCurrency, formatDateTime } from "../utils/format.js";

const PRESET = {
    [VERIFY_STATUS.VERIFIED]: {
        title: "PASSED — Bid Integrity Verified",
        icon: ShieldCheck,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
        chip: "bg-emerald-600 text-white",
    },
    [VERIFY_STATUS.TAMPERED]: {
        title: "FAILED — Bid Value Changed",
        icon: ShieldAlert,
        tone: "border-rose-300 bg-rose-50 text-rose-900",
        chip: "bg-rose-600 text-white",
    },
    [VERIFY_STATUS.NOT_ON_CHAIN]: {
        title: "No On-Chain Commitment Found",
        icon: Link2Off,
        tone: "border-amber-200 bg-amber-50 text-amber-900",
        chip: "bg-amber-500 text-white",
    },
    [VERIFY_STATUS.NO_WALLET]: {
        title: "Not Anchored On-Chain",
        icon: HelpCircle,
        tone: "border-slate-200 bg-slate-50 text-slate-800",
        chip: "bg-slate-500 text-white",
    },
    [VERIFY_STATUS.NO_CONTRACT]: {
        title: "No Contract At The Configured Address",
        icon: Link2Off,
        tone: "border-orange-200 bg-orange-50 text-orange-900",
        chip: "bg-orange-500 text-white",
    },
    [VERIFY_STATUS.ERROR]: {
        title: "Verification Could Not Complete",
        icon: AlertTriangle,
        tone: "border-orange-200 bg-orange-50 text-orange-900",
        chip: "bg-orange-500 text-white",
    },
};

function HashRow({ label, value, hint, highlight }) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </span>
                {hint && <span className="text-xs text-slate-400">{hint}</span>}
            </div>
            <p
                className={`mt-1 break-all rounded-md px-3 py-2 font-mono text-xs ring-1 ${
                    highlight
                        ? "bg-white text-rose-700 ring-rose-200"
                        : "bg-white text-slate-700 ring-slate-200"
                }`}
            >
                {value || "—"}
            </p>
        </div>
    );
}

/**
 * Full-detail verification report for a single bid.
 *
 * Shows the two hashes side by side so the mismatch is visible, not just
 * asserted: the hash of the amount currently in the database vs. the bytes32
 * commitment the smart contract has held since submission.
 */
export default function VerificationReport({ result, onClose }) {
    if (!result) return null;

    const preset = PRESET[result.status] || PRESET[VERIFY_STATUS.ERROR];
    const Icon = preset.icon;
    const mismatch = result.status === VERIFY_STATUS.TAMPERED;

    return (
        <div className={`rounded-xl border p-5 ${preset.tone}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-6 w-6 shrink-0" />
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold">{preset.title}</h3>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${preset.chip}`}
                            >
                                {result.status.replace(/_/g, " ")}
                            </span>
                        </div>
                        <p className="mt-1 max-w-2xl text-sm">{result.message}</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-current/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/40"
                    >
                        Close
                    </button>
                )}
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Bid
                    </dt>
                    <dd className="mt-0.5 font-semibold">{result.bidId}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Tender
                    </dt>
                    <dd className="mt-0.5 font-semibold">{result.tenderId}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount in database
                    </dt>
                    <dd className="mt-0.5 font-semibold">
                        {formatCurrency(result.amount)}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Committed on-chain
                    </dt>
                    <dd className="mt-0.5 font-semibold">
                        {result.committedAt
                            ? formatDateTime(result.committedAt)
                            : "—"}
                    </dd>
                </div>
            </dl>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <HashRow
                    label="Hash of the stored amount"
                    hint="computed now, off-chain"
                    value={result.localHash}
                    highlight={mismatch}
                />
                <HashRow
                    label="Commitment on the blockchain"
                    hint="immutable, written at submission"
                    value={result.chainHash}
                />
            </div>

            {result.walletAddress && (
                <p className="mt-3 break-all text-xs text-slate-500">
                    Bidder wallet: <span className="font-mono">{result.walletAddress}</span>
                    {result.submitter && (
                        <>
                            {" · "}on-chain submitter:{" "}
                            <span className="font-mono">{result.submitter}</span>
                        </>
                    )}
                </p>
            )}

            {(result.status === VERIFY_STATUS.NO_CONTRACT ||
                result.status === VERIFY_STATUS.NOT_ON_CHAIN) && (
                <p className="mt-3 break-all text-xs text-slate-600">
                    Contract:{" "}
                    <span className="font-mono">{result.contractAddress}</span>
                    {" · "}chain id: {result.chainId}
                </p>
            )}

            {mismatch && (
                <p className="mt-3 rounded-md bg-white/70 px-3 py-2 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
                    The blockchain record cannot be edited, so the two hashes can
                    only differ if the off-chain bid amount was modified after it
                    was committed. This bid must be treated as compromised.
                </p>
            )}
        </div>
    );
}
