import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import AIScoreBreakdown from "../components/AIScoreBreakdown.jsx";
import FeedbackWall from "../components/FeedbackWall.jsx";
import IntegrityBadge from "../components/IntegrityBadge.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { bidAPI, tenderAPI } from "../services/api.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function PublicTransparency() {
  const [tenders, setTenders] = useState([]);
  const [bidsByTender, setBidsByTender] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const tendersData = await tenderAPI.getAll();
        setTenders(tendersData || []);

        const entries = await Promise.all(
          (tendersData || []).map(async (tender) => {
            try {
              const res = await bidAPI.getByTender(tender.id);
              return [tender.id, res];
            } catch {
              return [tender.id, { bidsVisible: false, data: [] }];
            }
          })
        );
        setBidsByTender(Object.fromEntries(entries));
      } catch (err) {
        console.error("Failed to load public transparency data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredTenders = tenders.filter((tender) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      tender.id.toLowerCase().includes(term) ||
      tender.title.toLowerCase().includes(term) ||
      tender.organisation.toLowerCase().includes(term) ||
      tender.category.toLowerCase().includes(term)
    );
  });

  return (
    <section className="page-shell py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gov-navy">
          <ShieldCheck className="h-7 w-7 text-gov-blue" /> Public Transparency & AI Integrity Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Every tender published on TendAI, the AI trust score behind each bid with a full breakdown of how it was
          computed, and a live blockchain integrity check that would catch any bid amount altered after submission.
          No login required — this page is public by design.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="field pl-9"
          type="text"
          placeholder="Search by tender ID, title, organisation, category..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="panel p-6 text-slate-500">Loading tenders...</div>
      ) : (
        <div className="space-y-5">
          {filteredTenders.map((tender) => {
            const bidsRes = bidsByTender[tender.id] || { bidsVisible: false, data: [] };
            const bids = bidsRes.data || [];
            return (
              <div className="panel p-5" key={tender.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">{tender.id}</p>
                    <Link to={`/tenders/${tender.id}`} className="mt-0.5 block text-lg font-semibold text-gov-navy hover:underline">
                      {tender.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {tender.organisation} · {tender.department} · {tender.category}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={tender.status} />
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(tender.value)}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Closing {formatDate(tender.closingDate)}</p>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  {bidsRes.bidsVisible === false ? (
                    <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
                      Bidder identities, amounts, and AI trust scores are sealed until this tender's closing date —
                      this prevents bidders from adjusting their price after seeing competitors.
                    </p>
                  ) : bids.length === 0 ? (
                    <p className="text-sm text-slate-500">No bids submitted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {bids.map((bid) => {
                        const compromised = bid.integrity?.checked && !bid.integrity.intact;
                        return (
                          <div
                            key={bid.id}
                            className={`rounded-lg border p-3 ${compromised ? "border-rose-300 bg-rose-50/40" : "border-slate-200"}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold text-slate-800">{bid.bidder}</span>
                                <span className="ml-2 text-xs text-slate-500">{bid.id}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700">{formatCurrency(bid.amount)}</span>
                                <IntegrityBadge integrity={bid.integrity} />
                              </div>
                            </div>
                            {compromised && bid.adminModified?.at && (
                              <p className="mt-2 text-xs font-medium text-rose-700">
                                ⚠ This record was edited directly on {new Date(bid.adminModified.at).toLocaleString()}
                                {bid.adminModified.byAdminName ? ` by ${bid.adminModified.byAdminName}` : ""} — the
                                current amount no longer matches the blockchain commitment made at submission.
                              </p>
                            )}
                            <div className="mt-2">
                              <AIScoreBreakdown score={bid.trustScore} factors={bid.trustFactors} compromised={compromised} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filteredTenders.length === 0 && (
            <div className="panel p-6 text-center text-slate-500">No tenders match your search.</div>
          )}
        </div>
      )}

      <div className="mt-8">
        <FeedbackWall />
      </div>
    </section>
  );
}
