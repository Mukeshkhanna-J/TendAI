import { Link } from "react-router-dom";
import BlockchainBadge from "./BlockchainBadge.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function TenderCard({ tender }) {
  return (
    <article className="panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{tender.id}</p>
          <Link to={`/tenders/${tender.id}`} className="mt-1 block text-base font-semibold text-gov-blue hover:text-gov-navy">
            {tender.title}
          </Link>
          <p className="mt-1 text-sm text-slate-600">{tender.organisation}</p>
        </div>
        <StatusBadge status={tender.status} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <span><strong>Closing:</strong> {formatDate(tender.closingDate)}</span>
        <span><strong>Value:</strong> {formatCurrency(tender.value)}</span>
        <BlockchainBadge txHash={tender.txHash} />
      </div>
    </article>
  );
}
