import { useEffect, useState } from "react";
import { Plus, Save, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import BidVerificationPanel from "../components/BidVerificationPanel.jsx";
import DataTable from "../components/DataTable.jsx";
import IntegrityBadge from "../components/IntegrityBadge.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TrustScoreBadge from "../components/TrustScoreBadge.jsx";
import { bidAPI, savedAPI, tenderAPI } from "../services/api.js";
import { useSubmitToChain } from "../hooks/useSubmitToChain.js";
import { formatCurrency, formatDate } from "../utils/format.js";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function BidderDashboard() {
    const [myBids, setMyBids] = useState([]);
    const [savedTenders, setSavedTenders] = useState([]);
    const [liveTenders, setLiveTenders] = useState([]);
    const [form, setForm] = useState({ tenderId: "", amount: "" });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [verifyingBid, setVerifyingBid] = useState(null);
    const { isConnected, address } = useAccount();
    const submitToChain = useSubmitToChain();
    useEffect(() => {
        async function loadDashboardData() {
            setLoading(true);
            try {
                const [bidsRes, savedRes, tendersRes] = await Promise.all([
                    bidAPI.getMyBids(),
                    savedAPI.getSaved(),
                    tenderAPI.getAll({ status: "Live" }),
                ]);
                setMyBids(bidsRes || []);
                setSavedTenders(savedRes?.data || []);
                setLiveTenders(tendersRes || []);
                if (tendersRes && tendersRes.length > 0) {
                    setForm((prev) => ({
                        ...prev,
                        tenderId: tendersRes[0].id,
                    }));
                }
            } catch (err) {
                console.error("Error loading bidder dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboardData();
    }, []);

    async function submitBid(event) {
        event.preventDefault();
        if (!form.tenderId || !form.amount) return;
        setSubmitting(true);
        setMessage("");
        try {
            // Everything below happens in the browser: the salt and commit
            // hash are generated client-side, then the hash is written
            // on-chain by a transaction signed with the bidder's own
            // connected wallet — the server is not involved in any of this.
            setMessage("Confirm the transaction in your wallet to commit your bid on-chain...");
            const { txHash, salt, commitHash } = await submitToChain({
                tenderId: form.tenderId,
                amount: form.amount,
            });

            setMessage("On-chain commit confirmed — recording bid...");
            await bidAPI.submit({
                tenderId: form.tenderId,
                amount: Number(form.amount),
                salt,
                commitHash,
                txHash,
                bidderWalletAddress: address,
            });

            const refreshedBids = await bidAPI.getMyBids();
            setMyBids(refreshedBids || []);
            setForm({ tenderId: liveTenders[0]?.id || "", amount: "" });
            setMessage(
                "Bid committed on-chain and recorded successfully!",
            );
        } catch (err) {
            console.error("Failed to submit bid:", err);
            setMessage(err.shortMessage || err.response?.data?.message || err.message || "Failed to submit bid.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gov-navy">
                    Bidder Dashboard
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Track bids, saved tenders, and submit bids with AI trust
                    score verification.
                </p>
            </div>

            {message && (
                <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
                    {message}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <section className="panel p-5">
                        <h2 className="text-lg font-semibold text-gov-navy">
                            My Bids
                        </h2>
                        <div className="mt-4">
                            {loading ? (
                                <div className="text-slate-500 py-4">
                                    Loading bids...
                                </div>
                            ) : (
                                <DataTable
                                    data={myBids}
                                    columns={[
                                        { key: "id", header: "Bid ID" },
                                        {
                                            key: "tenderId",
                                            header: "Tender",
                                            render: (bid) => (
                                                <Link
                                                    className="font-semibold text-gov-blue"
                                                    to={`/tenders/${bid.tenderId}`}
                                                >
                                                    {bid.tenderId}
                                                </Link>
                                            ),
                                        },
                                        {
                                            key: "amount",
                                            header: "Bid Amount",
                                            render: (bid) =>
                                                formatCurrency(bid.amount),
                                        },
                                        {
                                            key: "submittedAt",
                                            header: "Submitted",
                                            render: (bid) =>
                                                formatDate(bid.submittedAt),
                                        },
                                        {
                                            key: "trustScore",
                                            header: "Trust Score",
                                            render: (bid) => (
                                                <TrustScoreBadge
                                                    score={bid.trustScore}
                                                />
                                            ),
                                        },
                                        {
                                            key: "status",
                                            header: "Status",
                                            render: (bid) => (
                                                <StatusBadge
                                                    status={bid.status}
                                                />
                                            ),
                                        },
                                        {
                                            key: "integrity",
                                            header: "Verification",
                                            render: (bid) => (
                                                <IntegrityBadge
                                                    integrity={bid.integrity}
                                                />
                                            ),
                                        },
                                        {
                                            key: "verify",
                                            header: "",
                                            render: (bid) =>
                                                bid.commitHash ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setVerifyingBid(
                                                                verifyingBid?.id === bid.id ? null : bid,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <ShieldCheck className="h-3.5 w-3.5" /> Verify Document
                                                    </button>
                                                ) : null,
                                        },
                                    ]}
                                />
                            )}
                            {verifyingBid && (
                                <BidVerificationPanel bid={verifyingBid} onClose={() => setVerifyingBid(null)} />
                            )}
                        </div>
                    </section>
                    <section className="panel p-5">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gov-navy">
                            <Save className="h-5 w-5" /> Saved Tenders
                        </h2>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {savedTenders.length === 0 ? (
                                <p className="text-sm text-slate-500 col-span-2">
                                    No saved tenders yet.
                                </p>
                            ) : (
                                savedTenders.map((tender) => (
                                    <Link
                                        key={tender.id}
                                        to={`/tenders/${tender.id}`}
                                        className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                                    >
                                        <p className="text-xs font-semibold text-slate-500">
                                            {tender.id}
                                        </p>
                                        <p className="mt-1 font-semibold text-gov-blue">
                                            {tender.title}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-600">
                                            Closing{" "}
                                            {formatDate(tender.closingDate)}
                                        </p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>
                <div className="mx-auto w-full max-w-xl">
                    {/* Wallet Connection */}
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Bidder Account
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-gov-navy">
                                {isConnected
                                    ? "Wallet Connected"
                                    : "Wallet Not Connected"}
                            </p>
                        </div>

                        <ConnectButton
                            label="Connect"
                            showBalance={false}
                            accountStatus={"avatar"}
                        />
                    </div>

                    {/* Bid Form */}
                    <form
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
                        onSubmit={submitBid}
                    >
                        {/* Header */}
                        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-black">
                                    <Plus className="h-7 w-7" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gov-navy">
                                        Submit New Bid
                                    </h2>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Submit your quotation for an active
                                        tender
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="space-y-6 px-6 py-6">
                            {/* Tender */}
                            <label className="block">
                                <span className="text-sm font-semibold text-slate-700">
                                    Select Tender
                                </span>

                                <span className="mt-1 block text-xs text-slate-500">
                                    Choose the tender you want to participate in
                                </span>

                                <select
                                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-gov-navy focus:ring-2 focus:ring-gov-navy/10"
                                    value={form.tenderId}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            tenderId: event.target.value,
                                        })
                                    }
                                >
                                    {liveTenders.map((tender) => (
                                        <option
                                            key={tender.id}
                                            value={tender.id}
                                        >
                                            {tender.id} — {tender.title}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Bid Amount */}
                            <label className="block">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">
                                        Bid Amount
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        In INR
                                    </span>
                                </div>

                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                                        ₹
                                    </span>

                                    <input
                                        className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-lg font-semibold text-slate-900 outline-none transition placeholder:text-sm placeholder:text-slate-300 focus:border-gov-navy focus:ring-2 focus:ring-gov-navy/10"
                                        type="number"
                                        min="1"
                                        required
                                        placeholder="Enter your bid amount"
                                        value={form.amount}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                amount: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <p className="mt-2 text-xs text-slate-500">
                                    Your bid will be submitted through your
                                    connected wallet.
                                </p>
                            </label>

                            {/* Divider */}
                            <div className="border-t border-slate-100" />

                            {/* Submit */}
                            <button
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gov-navy px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gov-navy/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gov-navy/30 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                                type="submit"
                                disabled={
                                    submitting ||
                                    liveTenders.length === 0 ||
                                    !isConnected
                                }
                            >
                                {submitting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Submitting Bid...
                                    </>
                                ) : !isConnected ? (
                                    "Connect Wallet to Submit"
                                ) : (
                                    "Submit Bid"
                                )}
                            </button>

                            {/* Security note */}
                            <div className="flex gap-3 rounded-lg bg-slate-50 p-3">
                                <p className="text-xs leading-relaxed text-slate-500">
                                    <strong>Note: </strong>Your transaction is
                                    signed by your wallet and recorded on the
                                    blockchain. Never share your wallet's
                                    private key or recovery phrase.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
