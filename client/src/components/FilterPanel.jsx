export default function FilterPanel({ filters, setFilters, categories, departments }) {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <aside className="panel p-4">
      <h2 className="text-base font-semibold text-gov-navy">Refine Search</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select className="field mt-1" value={filters.category} onChange={(event) => update("category", event.target.value)}>
            <option value="">All Categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select className="field mt-1" value={filters.status} onChange={(event) => update("status", event.target.value)}>
            <option value="">All Statuses</option>
            <option value="Live">Live</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Value Range
          <select className="field mt-1" value={filters.valueRange} onChange={(event) => update("valueRange", event.target.value)}>
            <option value="">Any Value</option>
            <option value="0-50000000">Up to INR 5 Cr</option>
            <option value="50000000-100000000">INR 5 Cr to 10 Cr</option>
            <option value="100000000-9999999999">Above INR 10 Cr</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Department
          <select className="field mt-1" value={filters.department} onChange={(event) => update("department", event.target.value)}>
            <option value="">All Departments</option>
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </label>
        <button className="btn-secondary w-full" type="button" onClick={() => setFilters({ category: "", status: "", valueRange: "", department: "", search: "", sortBy: "closingDate" })}>
          Reset Filters
        </button>
      </div>
    </aside>
  );
}
