import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BlockchainBadge from "../components/BlockchainBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TrustScoreBadge from "../components/TrustScoreBadge.jsx";
import { bids, savedTenderIds, tenders } from "../services/mockData.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function BidderDashboard() {
  const [myBids, setMyBids] = useState(bids.slice(0, 3));
  const [form, setForm] = useState({ tenderId: tenders[0].id, amount: "" });
  const saved = useMemo(() => tenders.filter((tender) => savedTenderIds.includes(tender.id)), []);

  function submitBid(event) {
    event.preventDefault();
    const tender = tenders.find((item) => item.id === form.tenderId);
    setMyBids((current) => [{
      id: `BID-${940 + current.length}`,
      tenderId: form.tenderId,
      bidder: "Your Organisation",
      amount: Number(form.amount),
      submittedAt: new Date().toISOString().slice(0, 10),
      status: "Under Evaluation",
      trustScore: 72,
      txHash: `0xmock${Date.now().toString(16)}`
    }, ...current]);
    setForm({ tenderId: tender?.id || tenders[0].id, amount: "" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">Bidder Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Track bids, saved tenders, and mock bid submission activity.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-lg font-semibold text-gov-navy">My Bids</h2>
            <div className="mt-4">
              <DataTable
                data={myBids}
                columns={[
                  { key: "id", header: "Bid ID" },
                  { key: "tenderId", header: "Tender", render: (bid) => <Link className="font-semibold text-gov-blue" to={`/tenders/${bid.tenderId}`}>{bid.tenderId}</Link> },
                  { key: "amount", header: "Bid Amount", render: (bid) => formatCurrency(bid.amount) },
                  { key: "submittedAt", header: "Submitted", render: (bid) => formatDate(bid.submittedAt) },
                  { key: "trustScore", header: "Trust Score", render: (bid) => <TrustScoreBadge score={bid.trustScore} /> },
                  { key: "status", header: "Status", render: (bid) => <StatusBadge status={bid.status} /> },
                  { key: "txHash", header: "Verification", render: (bid) => <BlockchainBadge txHash={bid.txHash} /> }
                ]}
              />
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gov-navy"><Save className="h-5 w-5" /> Saved Tenders</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {saved.map((tender) => (
                <Link key={tender.id} to={`/tenders/${tender.id}`} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500">{tender.id}</p>
                  <p className="mt-1 font-semibold text-gov-blue">{tender.title}</p>
                  <p className="mt-2 text-sm text-slate-600">Closing {formatDate(tender.closingDate)}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <form className="panel h-fit p-5" onSubmit={submitBid}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gov-navy"><Plus className="h-5 w-5" /> Submit New Bid</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Tender<select className="field mt-1" value={form.tenderId} onChange={(event) => setForm({ ...form, tenderId: event.target.value })}>{tenders.filter((tender) => tender.status === "Live").map((tender) => <option key={tender.id} value={tender.id}>{tender.id} - {tender.title}</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700">Bid Amount<input className="field mt-1" type="number" min="1" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
            <button className="btn-primary w-full" type="submit">Submit Mock Bid</button>
          </div>
        </form>
      </div>
    </div>
  );
}
