import { useEffect, useState } from "react";
import { BarChart3, FilePlus2, IndianRupee, ShieldCheck, CheckCircle2, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import AdminBidOverridePanel from "../components/AdminBidOverridePanel.jsx";
import DataTable from "../components/DataTable.jsx";
import IntegrityBadge from "../components/IntegrityBadge.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TrustScoreBadge from "../components/TrustScoreBadge.jsx";
import { bidAPI, tenderAPI } from "../services/api.js";
import { formatCurrency, formatDate, formatDateTime } from "../utils/format.js";

export default function AdminDashboard() {
  const [adminTenders, setAdminTenders] = useState([]);
  const [allBids, setAllBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overridingBid, setOverridingBid] = useState(null);

  async function refreshBids() {
    try {
      const bidsData = await bidAPI.getAllAdminBids();
      setAllBids(bidsData || []);
    } catch (err) {
      console.error("Failed to load bids for oversight:", err);
    }
  }

  useEffect(() => {
    async function fetchAdminData() {
      setLoading(true);
      try {
        const [tendersData] = await Promise.all([tenderAPI.getAdminTenders(), refreshBids()]);
        setAdminTenders(tendersData || []);
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  const compromisedCount = allBids.filter((bid) => bid.integrity?.checked && !bid.integrity.intact).length;

  const stats = [
    { label: "Published Tenders", value: adminTenders.length, icon: BarChart3 },
    { label: "Live Tenders", value: adminTenders.filter((tender) => tender.status === "Live").length, icon: ShieldCheck },
    { label: "Closed Tenders", value: adminTenders.filter((tender) => tender.status === "Closed" || tender.status === "Under Evaluation").length, icon: CheckCircle2 },
    { label: "Estimated Value", value: formatCurrency(adminTenders.reduce((total, tender) => total + (tender.value || 0), 0)), icon: IndianRupee }
  ];

  if (compromisedCount > 0) {
    stats.push({ label: "Compromised Bids", value: compromisedCount, icon: TriangleAlert });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Manage published tenders and oversight of government procurement.</p>
        </div>
        <Link className="btn-primary" to="/admin/create-tender">
          <FilePlus2 className="h-4 w-4" /> Create New Tender
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => {
          const isAlert = label === "Compromised Bids";
          return (
            <div className={`panel p-5 ${isAlert ? "ring-2 ring-rose-300" : ""}`} key={label}>
              <Icon className={`h-6 w-6 ${isAlert ? "text-rose-600" : "text-gov-saffron"}`} />
              <div className={`mt-3 text-2xl font-bold ${isAlert ? "text-rose-700" : "text-gov-navy"}`}>{value}</div>
              <div className="text-sm text-slate-600">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Published Tenders Section */}
      <section className="panel p-5">
        <h2 className="text-lg font-semibold text-gov-navy">Published Government Tenders</h2>
        <div className="mt-4">
          {loading ? (
            <div className="text-slate-500 py-4">Loading officer tenders...</div>
          ) : (
            <DataTable
              data={adminTenders}
              columns={[
                {
                  key: "id",
                  header: "Tender ID",
                  render: (tender) => (
                    <Link className="font-semibold text-gov-blue hover:underline" to={`/tenders/${tender.id}`}>
                      {tender.id}
                    </Link>
                  )
                },
                {
                  key: "title",
                  header: "Title",
                  render: (tender) => <span className="font-medium text-slate-900">{tender.title}</span>
                },
                { key: "publishedDate", header: "Published", render: (tender) => formatDate(tender.publishedDate) },
                { key: "closingDate", header: "Closing", render: (tender) => formatDate(tender.closingDate) },
                { key: "value", header: "Value", render: (tender) => formatCurrency(tender.value) },
                { key: "status", header: "Status", render: (tender) => <StatusBadge status={tender.status} /> }
              ]}
            />
          )}
        </div>
      </section>

      {/* Bid Integrity Oversight Section */}
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gov-navy">
          <TriangleAlert className="h-5 w-5 text-rose-600" /> Bid Integrity Oversight
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Every bid's blockchain integrity is checked live below. The <strong>Admin Override</strong> action lets you
          demo what happens if a bid amount is edited directly in the database (e.g. by a rogue admin or a
          compromised account) — it will immediately start reporting as Compromised everywhere it's shown.
        </p>
        <div className="mt-4">
          {loading ? (
            <div className="text-slate-500 py-4">Loading bids...</div>
          ) : (
            <DataTable
              data={allBids}
              columns={[
                { key: "id", header: "Bid ID" },
                { key: "tenderId", header: "Tender" },
                { key: "bidder", header: "Bidder" },
                { key: "amount", header: "Amount", render: (bid) => formatCurrency(bid.amount) },
                { key: "trustScore", header: "AI Score", render: (bid) => <TrustScoreBadge score={bid.trustScore} /> },
                { key: "integrity", header: "Blockchain Integrity", render: (bid) => <IntegrityBadge integrity={bid.integrity} /> },
                {
                  key: "adminModified",
                  header: "Last Admin Edit",
                  render: (bid) =>
                    bid.adminModified?.at ? (
                      <span className="text-xs text-rose-700">
                        {formatDateTime(bid.adminModified.at)}
                        <br />
                        by {bid.adminModified.byAdminName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )
                },
                {
                  key: "action",
                  header: "",
                  render: (bid) =>
                    bid.commitHash ? (
                      <button
                        type="button"
                        onClick={() => setOverridingBid(overridingBid?.id === bid.id ? null : bid)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Admin Override
                      </button>
                    ) : null
                }
              ]}
            />
          )}
          {overridingBid && (
            <AdminBidOverridePanel
              bid={overridingBid}
              onClose={() => setOverridingBid(null)}
              onOverridden={refreshBids}
            />
          )}
        </div>
      </section>
    </div>
  );
}
