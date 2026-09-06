import { VERIFY_STATUS } from "../hooks/useVerifyBid.js";

const STYLES = {
    [VERIFY_STATUS.VERIFIED]: {
        label: "Verified",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    [VERIFY_STATUS.TAMPERED]: {
        label: "Failed - Value Changed",
        className: "bg-rose-50 text-rose-700 ring-rose-300",
    },
    [VERIFY_STATUS.NOT_ON_CHAIN]: {
        label: "Not On Chain",
        className: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    [VERIFY_STATUS.NO_WALLET]: {
        label: "Not Anchored",
        className: "bg-slate-100 text-slate-600 ring-slate-300",
    },
    [VERIFY_STATUS.NO_CONTRACT]: {
        label: "No Contract",
        className: "bg-orange-50 text-orange-700 ring-orange-200",
    },
    [VERIFY_STATUS.ERROR]: {
        label: "Check Failed",
        className: "bg-orange-50 text-orange-700 ring-orange-200",
    },
};

/**
 * Compact verdict pill for a bid integrity check.
 */
export default function IntegrityBadge({ status }) {
    const style = STYLES[status];
    if (!style) return null;

    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style.className}`}
        >
            {style.label}
        </span>
    );
}
