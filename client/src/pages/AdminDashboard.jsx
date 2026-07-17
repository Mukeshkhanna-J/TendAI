import { BarChart3, FilePlus2, IndianRupee, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { tenders } from "../services/mockData.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function AdminDashboard() {
  const adminTenders = tenders.filter((tender) => tender.createdBy === "admin");
  const stats = [
    { label: "Published Tenders", value: adminTenders.length, icon: BarChart3 },
    { label: "Live Tenders", value: adminTenders.filter((tender) => tender.status === "Live").length, icon: ShieldCheck },
    { label: "Estimated Value", value: formatCurrency(adminTenders.reduce((total, tender) => total + tender.value, 0)), icon: IndianRupee }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Manage published tenders and review procurement analytics.</p>
        </div>
        <Link className="btn-primary" to="/admin/create-tender"><FilePlus2 className="h-4 w-4" /> Create New Tender</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="panel p-5" key={label}>
            <Icon className="h-6 w-6 text-gov-saffron" />
            <div className="mt-3 text-2xl font-bold text-gov-navy">{value}</div>
            <div className="text-sm text-slate-600">{label}</div>
          </div>
        ))}
      </div>
      <section className="panel p-5">
        <h2 className="text-lg font-semibold text-gov-navy">Tenders Created by This Officer</h2>
        <div className="mt-4">
          <DataTable
            data={adminTenders}
            columns={[
              { key: "id", header: "Tender ID", render: (tender) => <Link className="font-semibold text-gov-blue" to={`/tenders/${tender.id}`}>{tender.id}</Link> },
              { key: "title", header: "Title", render: (tender) => <span className="font-medium text-slate-900">{tender.title}</span> },
              { key: "publishedDate", header: "Published", render: (tender) => formatDate(tender.publishedDate) },
              { key: "closingDate", header: "Closing", render: (tender) => formatDate(tender.closingDate) },
              { key: "value", header: "Value", render: (tender) => formatCurrency(tender.value) },
              { key: "status", header: "Status", render: (tender) => <StatusBadge status={tender.status} /> }
            ]}
          />
        </div>
      </section>
    </div>
  );
}
