import { Download, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import BlockchainBadge from "../components/BlockchainBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TrustScoreBadge from "../components/TrustScoreBadge.jsx";
import { bids, tenders } from "../services/mockData.js";
import { formatCurrency, formatDate, formatDateTime } from "../utils/format.js";

export default function TenderDetail() {
  const { tenderId } = useParams();
  const tender = tenders.find((item) => item.id === tenderId);
  if (!tender) {
    return <section className="page-shell py-8"><div className="panel p-6">Tender not found. <Link className="text-gov-blue" to="/tenders">Back to tenders</Link></div></section>;
  }
  const tenderBids = bids.filter((bid) => bid.tenderId === tender.id);

  return (
    <section className="page-shell py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">{tender.id}</p>
          <h1 className="mt-1 max-w-4xl text-2xl font-bold text-gov-navy">{tender.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{tender.organisation}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={tender.status} />
          <BlockchainBadge txHash={tender.txHash} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-gov-navy">Tender Information</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{tender.description}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-500">Category</dt><dd>{tender.category}</dd></div>
              <div><dt className="font-semibold text-slate-500">Department</dt><dd>{tender.department}</dd></div>
              <div><dt className="font-semibold text-slate-500">Published Date</dt><dd>{formatDate(tender.publishedDate)}</dd></div>
              <div><dt className="font-semibold text-slate-500">Closing Date</dt><dd>{formatDate(tender.closingDate)}</dd></div>
              <div><dt className="font-semibold text-slate-500">Estimated Value</dt><dd>{formatCurrency(tender.value)}</dd></div>
              <div><dt className="font-semibold text-slate-500">EMD Amount</dt><dd>{formatCurrency(tender.emdAmount)}</dd></div>
            </dl>
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-gov-navy">Eligibility Criteria</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{tender.eligibility}</p>
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-gov-navy">Submitted Bids</h2>
            {tender.bidsVisible ? (
              <div className="mt-4">
                <DataTable
                  data={tenderBids}
                  columns={[
                    { key: "id", header: "Bid ID" },
                    { key: "bidder", header: "Bidder" },
                    { key: "amount", header: "Amount", render: (bid) => formatCurrency(bid.amount) },
                    { key: "trustScore", header: "AI Trust Score", render: (bid) => <TrustScoreBadge score={bid.trustScore} /> },
                    { key: "status", header: "Status", render: (bid) => <StatusBadge status={bid.status} /> },
                    { key: "txHash", header: "Verification", render: (bid) => <BlockchainBadge txHash={bid.txHash} /> }
                  ]}
                />
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
                Bidder identities and AI Trust Scores will be visible after bid closing.
              </p>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-gov-navy">Documents</h2>
            <div className="mt-3 space-y-2">
              {tender.documents.map((document) => (
                <a key={document} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" href="#">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-gov-blue" />{document}</span>
                  <Download className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-gov-navy">On-chain Timeline</h2>
            <ol className="mt-4 space-y-4">
              {tender.timeline.map((event, index) => (
                <li key={`${event.label}-${index}`} className="relative border-l-2 border-slate-200 pl-4">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-gov-blue ring-4 ring-blue-50" />
                  <p className="font-semibold text-slate-900">{event.label}</p>
                  <p className="text-xs text-slate-500">{event.timestamp ? formatDateTime(event.timestamp) : "Awaiting event"}</p>
                  <p className="mt-1 break-all text-xs text-slate-600">Tx: {event.txHash}</p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </section>
  );
}
