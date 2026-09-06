import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RotateCcw, Save, ShieldAlert } from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { bidAPI } from "../services/api.js";
import { formatCurrency, formatDate } from "../utils/format.js";
import { shortHash } from "../utils/bidHash.js";

/**
 * Bid Value Control - insider tamper simulation.
 *
 * Lets an officer overwrite the amount recorded against a submitted bid. Only
 * the database row changes; the commitment written to the smart contract when
 * the bid was submitted stays exactly as it was. The bidder can then run
 * verification on their dashboard and the hash mismatch exposes the change.
 */
export default function AdminBidControl() {
    const [bids, setBids] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [coverTracks, setCoverTracks] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        async function loadBids() {
            setLoading(true);
            try {
                const data = await bidAPI.getAllAdminBids();
                const list = data || [];
                setBids(list);
                setDrafts(
                    list.reduce((acc, bid) => {
                        acc[bid.id] = String(bid.amount ?? "");
                        return acc;
                    }, {}),
                );
            } catch (err) {
                console.error("Failed to load bids:", err);
                setFeedback({
                    type: "error",
                    text: "Could not load submitted bids.",
                });
            } finally {
                setLoading(false);
            }
        }
        loadBids();
    }, []);

    function applyUpdatedBid(updated) {
        setBids((current) =>
            current.map((bid) => (bid.id === updated.id ? updated : bid)),
        );
        setDrafts((current) => ({
            ...current,
            [updated.id]: String(updated.amount ?? ""),
        }));
    }

    async function changeAmount(bid) {
        const nextAmount = Number(drafts[bid.id]);
        if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
            setFeedback({
                type: "error",
                text: "Enter a positive numeric amount before applying the change.",
            });
            return;
        }
        if (nextAmount === Number(bid.amount)) {
            setFeedback({
                type: "error",
                text: `Bid ${bid.id} already holds that amount.`,
            });
            return;
        }

        setBusyId(bid.id);
        setFeedback(null);
        try {
            const res = await bidAPI.adminUpdateAmount(
                bid.id,
                nextAmount,
                coverTracks,
            );
            applyUpdatedBid(res.data);
            setFeedback({
                type: "warning",
                text: `${bid.id}: database amount changed from ${formatCurrency(bid.amount)} to ${formatCurrency(nextAmount)}. The on-chain commitment was NOT modified, so verification from the bidder side will now fail.`,
            });
        } catch (err) {
            console.error("Failed to change bid amount:", err);
            setFeedback({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to change the bid amount.",
            });
        } finally {
            setBusyId(null);
        }
    }

    async function restore(bid) {
        setBusyId(bid.id);
        setFeedback(null);
        try {
            const res = await bidAPI.adminRestoreAmount(bid.id);
            applyUpdatedBid(res.data);
            setFeedback({
                type: "success",
                text: `${bid.id} restored to its original amount of ${formatCurrency(res.data.amount)}.`,
            });
        } catch (err) {
            console.error("Failed to restore bid amount:", err);
            setFeedback({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to restore the bid amount.",
            });
        } finally {
            setBusyId(null);
        }
    }

    const tamperedCount = useMemo(
        () => bids.filter((bid) => bid.tampered).length,
        [bids],
    );

    const feedbackTone =
        feedback?.type === "error"
            ? "bg-rose-50 text-rose-800 ring-rose-200"
            : feedback?.type === "warning"
              ? "bg-amber-50 text-amber-900 ring-amber-200"
              : "bg-emerald-50 text-emerald-800 ring-emerald-200";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gov-navy">
                    <ShieldAlert className="h-6 w-6 text-rose-600" />
                    Bid Value Control
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                    Override the amount recorded against a submitted bid. This
                    screen exists to demonstrate an insider-tampering attack
                    against the tender database.
                </p>
            </div>

            <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div className="text-sm text-rose-900">
                    <p className="font-semibold">
                        Attack simulation - off-chain record only
                    </p>
                    <p className="mt-1">
                        Applying a change rewrites the bid amount in MongoDB. The
                        commitment hash the bidder wrote to the smart contract
                        cannot be edited from here, or from anywhere. Once a value
                        is altered, the bidder dashboard recomputes the hash of the
                        stored amount, compares it against the chain, and reports{" "}
                        <strong>FAILED - Bid Value Changed</strong>.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={coverTracks}
                        onChange={(event) =>
                            setCoverTracks(event.target.checked)
                        }
                    />
                    <span>
                        Also rewrite the hash cached in the database{" "}
                        <span className="text-slate-500">
                            (covers the insider tracks off-chain - verification
                            still fails, because it reads the chain)
                        </span>
                    </span>
                </label>
                <span className="text-sm font-semibold text-slate-600">
                    Tampered bids: {tamperedCount} / {bids.length}
                </span>
            </div>

            {feedback && (
                <div
                    className={`rounded-md px-4 py-3 text-sm font-medium ring-1 ${feedbackTone}`}
                >
                    {feedback.text}
                </div>
            )}

            <section className="panel p-5">
                <h2 className="text-lg font-semibold text-gov-navy">
                    Submitted Bids
                </h2>
                <div className="mt-4">
                    {loading ? (
                        <div className="py-4 text-slate-500">
                            Loading bids...
                        </div>
                    ) : (
                        <DataTable
                            data={bids}
                            emptyText="No bids have been submitted yet."
                            columns={[
                                { key: "id", header: "Bid ID" },
                                { key: "tenderId", header: "Tender" },
                                {
                                    key: "bidder",
                                    header: "Bidder",
                                    render: (bid) => (
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {bid.bidder}
                                            </p>
                                            <p className="font-mono text-xs text-slate-400">
                                                {bid.walletAddress
                                                    ? shortHash(
                                                          bid.walletAddress,
                                                          8,
                                                          6,
                                                      )
                                                    : "no wallet on record"}
                                            </p>
                                        </div>
                                    ),
                                },
                                {
                                    key: "submittedAt",
                                    header: "Submitted",
                                    render: (bid) =>
                                        formatDate(bid.submittedAt),
                                },
                                {
                                    key: "originalAmount",
                                    header: "Original",
                                    render: (bid) =>
                                        bid.originalAmount != null ? (
                                            <span className="whitespace-nowrap text-slate-600">
                                                {formatCurrency(
                                                    bid.originalAmount,
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                &mdash;
                                            </span>
                                        ),
                                },
                                {
                                    key: "amount",
                                    header: "Stored Amount",
                                    render: (bid) => (
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-gov-navy focus:ring-2 focus:ring-gov-navy/10"
                                            value={drafts[bid.id] ?? ""}
                                            onChange={(event) =>
                                                setDrafts((current) => ({
                                                    ...current,
                                                    [bid.id]:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    ),
                                },
                                {
                                    key: "status",
                                    header: "Status",
                                    render: (bid) => (
                                        <div className="space-y-1">
                                            <StatusBadge status={bid.status} />
                                            {bid.tampered && (
                                                <span className="block w-fit rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                                                    Tampered
                                                </span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    key: "actions",
                                    header: "Actions",
                                    render: (bid) => (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                disabled={busyId === bid.id}
                                                onClick={() =>
                                                    changeAmount(bid)
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                <Save className="h-3.5 w-3.5" />
                                                {busyId === bid.id
                                                    ? "Applying..."
                                                    : "Apply Change"}
                                            </button>
                                            {bid.originalAmount != null &&
                                                bid.tampered && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            busyId === bid.id
                                                        }
                                                        onClick={() =>
                                                            restore(bid)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Restore
                                                    </button>
                                                )}
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
