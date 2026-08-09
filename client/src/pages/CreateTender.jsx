import { useState } from "react";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tenderAPI } from "../services/api.js";

export default function CreateTender() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Infrastructure",
    department: "Urban Development",
    organisation: "Department of Urban Development",
    closingDate: "",
    emdAmount: "",
    value: "",
    eligibility: "",
    documents: ["Notice Inviting Tender.pdf", "Technical Specification.pdf"]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await tenderAPI.create(form);
      setSubmitted(true);
      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (err) {
      console.error("Error creating tender:", err);
      setError(err.response?.data?.message || "Failed to publish tender.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">Create Tender</h1>
        <p className="mt-2 text-sm text-slate-600">Draft and publish a new government tender notice to the live platform.</p>
      </div>

      {submitted && (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          Tender published successfully! Redirecting to Admin Dashboard...
        </div>
      )}

      {error && (
        <div className="rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <form className="panel p-6" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Title
            <input
              className="field mt-1"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Description
            <textarea
              className="field mt-1 min-h-28"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              className="field mt-1"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="Infrastructure">Infrastructure</option>
              <option value="IT Services">IT Services</option>
              <option value="Energy">Energy</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Digitisation">Digitisation</option>
              <option value="IoT">IoT</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Department
            <input
              className="field mt-1"
              required
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Organisation
            <input
              className="field mt-1"
              required
              value={form.organisation}
              onChange={(e) => setForm({ ...form, organisation: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Closing Date
            <input
              className="field mt-1"
              type="date"
              required
              value={form.closingDate}
              onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            EMD Amount (INR)
            <input
              className="field mt-1"
              type="number"
              min="0"
              required
              value={form.emdAmount}
              onChange={(e) => setForm({ ...form, emdAmount: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Estimated Value (INR)
            <input
              className="field mt-1"
              type="number"
              min="0"
              required
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Eligibility Criteria
            <textarea
              className="field mt-1 min-h-24"
              required
              value={form.eligibility}
              onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Document Upload
            <div className="mt-1 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <Upload className="h-8 w-8 text-slate-400" />
              <span className="mt-2 text-sm font-medium text-slate-700">Tender documents attached</span>
              <span className="text-xs text-slate-500">Default documents will be attached automatically</span>
            </div>
          </label>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button className="btn-secondary" type="button" onClick={() => navigate("/admin")}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Publishing Tender..." : "Publish Tender"}
          </button>
        </div>
      </form>
    </div>
  );
}
