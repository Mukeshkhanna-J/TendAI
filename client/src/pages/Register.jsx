import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", organisation: "", role: "bidder" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        organisation: form.organisation,
        role: form.role
      });
      const userRole = res.user?.role || form.role;
      navigate(userRole === "admin" ? "/admin" : "/bidder");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-shell flex justify-center py-10">
      <form className="panel w-full max-w-lg p-6" onSubmit={submit}>
        <h1 className="text-2xl font-bold text-gov-navy">Register</h1>
        <p className="mt-2 text-sm text-slate-600">Create a TendAI account for bidder or government officer flows.</p>

        {error && (
          <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Full Name
            <input
              className="field mt-1"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="field mt-1"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Password
            <input
              className="field mt-1"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Minimum 6 characters"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Organisation
            <input
              className="field mt-1"
              required
              value={form.organisation}
              onChange={(event) => setForm({ ...form, organisation: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Role
            <select
              className="field mt-1"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="bidder">Bidder</option>
              <option value="admin">Government Officer</option>
            </select>
          </label>
        </div>
        <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already registered? <Link className="font-semibold text-gov-blue" to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
