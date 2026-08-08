import { useEffect, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import BlockchainBadge from "../components/BlockchainBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { tenderAPI } from "../services/api.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function TenderList() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [filters, setFilters] = useState({
    category: "",
    status: "",
    valueRange: "",
    department: "",
    search: initialSearch,
    sortBy: "closingDate"
  });

  const [tenders, setTenders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenders() {
      setLoading(true);
      try {
        const data = await tenderAPI.getAll(filters);
        setTenders(data);

        // Derive available categories and departments dynamically
        if (data && data.length > 0) {
          setCategories((prev) => prev.length ? prev : [...new Set(data.map((t) => t.category))]);
          setDepartments((prev) => prev.length ? prev : [...new Set(data.map((t) => t.department))]);
        }
      } catch (err) {
        console.error("Failed to load tenders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTenders();
  }, [filters]);

  return (
    <section className="page-shell py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gov-navy">Tender Search</h1>
        <p className="mt-2 text-sm text-slate-600">
          Browse transparent government tenders with verifiable blockchain publication metadata and real-time backend query filters.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FilterPanel filters={filters} setFilters={setFilters} categories={categories} departments={departments} />
        <div className="space-y-4">
          <div className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full py-2 text-sm outline-none"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search tender ID, title, organisation"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <ArrowUpDown className="h-4 w-4" />
              Sort
              <select
                className="field w-44"
                value={filters.sortBy}
                onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}
              >
                <option value="closingDate">Closing Date</option>
                <option value="publishedDate">Published Date</option>
                <option value="value">Tender Value</option>
              </select>
            </label>
          </div>
          {loading ? (
            <div className="panel p-6 text-center text-slate-500">Loading tenders...</div>
          ) : (
            <DataTable
              data={tenders}
              columns={[
                {
                  key: "id",
                  header: "Tender ID",
                  render: (tender) => (
                    <Link className="font-semibold text-gov-blue" to={`/tenders/${tender.id}`}>
                      {tender.id}
                    </Link>
                  )
                },
                {
                  key: "title",
                  header: "Tender Details",
                  render: (tender) => (
                    <div className="min-w-80">
                      <Link className="font-semibold text-slate-900 hover:text-gov-blue" to={`/tenders/${tender.id}`}>
                        {tender.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{tender.organisation}</p>
                      <div className="mt-2">
                        <BlockchainBadge txHash={tender.txHash} />
                      </div>
                    </div>
                  )
                },
                { key: "category", header: "Category" },
                { key: "closingDate", header: "Closing", render: (tender) => formatDate(tender.closingDate) },
                { key: "value", header: "Value", render: (tender) => formatCurrency(tender.value) },
                { key: "status", header: "Status", render: (tender) => <StatusBadge status={tender.status} /> }
              ]}
            />
          )}
        </div>
      </div>
    </section>
  );
}
