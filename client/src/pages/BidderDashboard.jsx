import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Link } from "react-router-dom";
import BlockchainBadge from "../components/BlockchainBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TrustScoreBadge from "../components/TrustScoreBadge.jsx";
import { bidAPI, savedAPI, tenderAPI } from "../services/api.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function BidderDashboard() {
  const [myBids, setMyBids] = useState([]);
  const [savedTenders, setSavedTenders] = useState([]);
  const [liveTenders, setLiveTenders] = useState([]);
  const [form, setForm] = useState({ tenderId: "", amount: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [bidsRes, savedRes, tendersRes] = await Promise.all([
          bidAPI.getMyBids(),
          savedAPI.getSaved(),
          tenderAPI.getAll({ status: "Live" })
        ]);
        setMyBids(bidsRes || []);
        setSavedTenders(savedRes?.data || []);
        setLiveTenders(tendersRes || []);
        if (tendersRes && tendersRes.length > 0) {
          setForm((prev) => ({ ...prev, tenderId: tendersRes[0].id }));
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
      const newBid = await bidAPI.submit({
        tenderId: form.tenderId,
        amount: Number(form.amount)
      });
      setMyBids((current) => [newBid, ...current]);
      setForm({ tenderId: liveTenders[0]?.id || "", amount: "" });
      setMessage("Bid submitted successfully with AI trust score!");
    } catch (err) {
      console.error("Failed to submit bid:", err);
      setMessage(err.response?.data?.message || "Failed to submit bid.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">Bidder Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Track bids, saved tenders, and submit bids with AI trust score verification.</p>
      </div>

      {message && (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-lg font-semibold text-gov-navy">My Bids</h2>
            <div className="mt-4">
              {loading ? (
                <div className="text-slate-500 py-4">Loading bids...</div>
              ) : (
                <DataTable
                  data={myBids}
                  columns={[
                    { key: "id", header: "Bid ID" },
                    {
                      key: "tenderId",
                      header: "Tender",
                      render: (bid) => (
                        <Link className="font-semibold text-gov-blue" to={`/tenders/${bid.tenderId}`}>
                          {bid.tenderId}
                        </Link>
                      )
                    },
                    { key: "amount", header: "Bid Amount", render: (bid) => formatCurrency(bid.amount) },
                    { key: "submittedAt", header: "Submitted", render: (bid) => formatDate(bid.submittedAt) },
                    { key: "trustScore", header: "Trust Score", render: (bid) => <TrustScoreBadge score={bid.trustScore} /> },
                    { key: "status", header: "Status", render: (bid) => <StatusBadge status={bid.status} /> },
                    { key: "txHash", header: "Verification", render: (bid) => <BlockchainBadge txHash={bid.txHash} /> }
                  ]}
                />
              )}
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gov-navy">
              <Save className="h-5 w-5" /> Saved Tenders
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {savedTenders.length === 0 ? (
                <p className="text-sm text-slate-500 col-span-2">No saved tenders yet.</p>
              ) : (
                savedTenders.map((tender) => (
                  <Link key={tender.id} to={`/tenders/${tender.id}`} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
                    <p className="text-xs font-semibold text-slate-500">{tender.id}</p>
                    <p className="mt-1 font-semibold text-gov-blue">{tender.title}</p>
                    <p className="mt-2 text-sm text-slate-600">Closing {formatDate(tender.closingDate)}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
        <form className="panel h-fit p-5" onSubmit={submitBid}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gov-navy">
            <Plus className="h-5 w-5" /> Submit New Bid
          </h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Tender
              <select
                className="field mt-1"
                value={form.tenderId}
                onChange={(event) => setForm({ ...form, tenderId: event.target.value })}
              >
                {liveTenders.map((tender) => (
                  <option key={tender.id} value={tender.id}>
                    {tender.id} - {tender.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Bid Amount
              <input
                className="field mt-1"
                type="number"
                min="1"
                required
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </label>
            <button className="btn-primary w-full" type="submit" disabled={submitting || liveTenders.length === 0}>
              {submitting ? "Submitting Bid..." : "Submit Bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
