import { Search, ShieldCheck, Users, Award, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import BlockchainBadge from "../components/BlockchainBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { tenders } from "../services/mockData.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function Home() {
  const latest = tenders.filter((tender) => tender.status === "Live").slice(0, 5);
  const stats = [
    { label: "Total Tenders", value: tenders.length, icon: FileText },
    { label: "Active Bidders", value: "1,284", icon: Users },
    { label: "Tenders Awarded", value: tenders.filter((tender) => tender.status === "Closed").length, icon: Award }
  ];

  return (
    <>
      <section className="bg-white">
        <div className="page-shell grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              AI scoring and blockchain audit trail
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-gov-navy sm:text-4xl">
              Transparent public procurement for every tender, bid, and award decision.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              TendAI combines verifiable on-chain events with AI-assisted bid risk indicators, helping departments and bidders inspect procurement activity with a clear public record.
            </p>
            <div className="mt-6 flex max-w-2xl flex-col gap-3 rounded-lg border border-gov-line bg-slate-50 p-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-md bg-white px-3 ring-1 ring-slate-200">
                <Search className="h-5 w-5 text-slate-400" />
                <input className="w-full py-3 text-sm outline-none" placeholder="Search by tender ID, organisation, or keyword" />
              </div>
              <Link to="/tenders" className="btn-primary">Search Tenders</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="panel p-5">
                <Icon className="h-6 w-6 text-gov-saffron" />
                <div className="mt-3 text-2xl font-bold text-gov-navy">{value}</div>
                <div className="text-sm text-slate-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="page-shell py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gov-navy">Latest Active Tenders</h2>
          <Link className="text-sm font-semibold text-gov-blue hover:text-gov-navy" to="/tenders">View all</Link>
        </div>
        <DataTable
          data={latest}
          columns={[
            { key: "id", header: "Tender ID", render: (tender) => <Link className="font-semibold text-gov-blue" to={`/tenders/${tender.id}`}>{tender.id}</Link> },
            { key: "title", header: "Title", render: (tender) => <div className="min-w-72"><div className="font-medium text-slate-900">{tender.title}</div><div className="mt-1"><BlockchainBadge txHash={tender.txHash} /></div></div> },
            { key: "organisation", header: "Organisation" },
            { key: "publishedDate", header: "Published Date", render: (tender) => formatDate(tender.publishedDate) },
            { key: "closingDate", header: "Closing Date", render: (tender) => formatDate(tender.closingDate) },
            { key: "value", header: "Value", render: (tender) => formatCurrency(tender.value) },
            { key: "status", header: "Status", render: (tender) => <StatusBadge status={tender.status} /> }
          ]}
        />
      </section>
    </>
  );
}
