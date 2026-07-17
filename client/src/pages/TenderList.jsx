import { ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BlockchainBadge from "../components/BlockchainBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { tenders } from "../services/mockData.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function TenderList() {
  const [filters, setFilters] = useState({ category: "", status: "", valueRange: "", department: "", search: "", sortBy: "closingDate" });
  const categories = [...new Set(tenders.map((tender) => tender.category))];
  const departments = [...new Set(tenders.map((tender) => tender.department))];

  const filtered = useMemo(() => {
    return tenders
      .filter((tender) => !filters.category || tender.category === filters.category)
      .filter((tender) => !filters.status || tender.status === filters.status)
      .filter((tender) => !filters.department || tender.department === filters.department)
      .filter((tender) => {
        if (!filters.valueRange) return true;
        const [min, max] = filters.valueRange.split("-").map(Number);
        return tender.value >= min && tender.value <= max;
      })
      .filter((tender) => {
        const query = filters.search.toLowerCase();
        return !query || [tender.id, tender.title, tender.organisation, tender.category].some((field) => field.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        if (filters.sortBy === "value") return b.value - a.value;
        if (filters.sortBy === "publishedDate") return new Date(b.publishedDate) - new Date(a.publishedDate);
        return new Date(a.closingDate) - new Date(b.closingDate);
      });
  }, [filters]);

  return (
    <section className="page-shell py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gov-navy">Tender Search</h1>
        <p className="mt-2 text-sm text-slate-600">Browse transparent government tenders with mock blockchain verification and publication metadata.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FilterPanel filters={filters} setFilters={setFilters} categories={categories} departments={departments} />
        <div className="space-y-4">
          <div className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input className="w-full py-2 text-sm outline-none" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search tender ID, title, organisation" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <ArrowUpDown className="h-4 w-4" />
              Sort
              <select className="field w-44" value={filters.sortBy} onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}>
                <option value="closingDate">Closing Date</option>
                <option value="publishedDate">Published Date</option>
                <option value="value">Tender Value</option>
              </select>
            </label>
          </div>
          <DataTable
            data={filtered}
            columns={[
              { key: "id", header: "Tender ID", render: (tender) => <Link className="font-semibold text-gov-blue" to={`/tenders/${tender.id}`}>{tender.id}</Link> },
              { key: "title", header: "Tender Details", render: (tender) => <div className="min-w-80"><Link className="font-semibold text-slate-900 hover:text-gov-blue" to={`/tenders/${tender.id}`}>{tender.title}</Link><p className="mt-1 text-xs text-slate-500">{tender.organisation}</p><div className="mt-2"><BlockchainBadge txHash={tender.txHash} /></div></div> },
              { key: "category", header: "Category" },
              { key: "closingDate", header: "Closing", render: (tender) => formatDate(tender.closingDate) },
              { key: "value", header: "Value", render: (tender) => formatCurrency(tender.value) },
              { key: "status", header: "Status", render: (tender) => <StatusBadge status={tender.status} /> }
            ]}
          />
        </div>
      </div>
    </section>
  );
}
