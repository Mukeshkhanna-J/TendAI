import { useEffect, useState } from "react";
import { BarChart3, FilePlus2, IndianRupee, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { tenderAPI } from "../services/api.js";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function AdminDashboard() {
  const [adminTenders, setAdminTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      setLoading(true);
      try {
        const tendersData = await tenderAPI.getAdminTenders();
        setAdminTenders(tendersData || []);
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  const stats = [
    { label: "Published Tenders", value: adminTenders.length, icon: BarChart3 },
    { label: "Live Tenders", value: adminTenders.filter((tender) => tender.status === "Live").length, icon: ShieldCheck },
    { label: "Closed Tenders", value: adminTenders.filter((tender) => tender.status === "Closed" || tender.status === "Under Evaluation").length, icon: CheckCircle2 },
    { label: "Estimated Value", value: formatCurrency(adminTenders.reduce((total, tender) => total + (tender.value || 0), 0)), icon: IndianRupee }
  ];

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
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="panel p-5" key={label}>
            <Icon className="h-6 w-6 text-gov-saffron" />
            <div className="mt-3 text-2xl font-bold text-gov-navy">{value}</div>
            <div className="text-sm text-slate-600">{label}</div>
          </div>
        ))}
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
    </div>
  );
}

