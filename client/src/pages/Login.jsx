import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "bidder" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login({
        email: form.email,
        password: form.password || "123456",
        role: form.role
      });
      const userRole = res.user?.role || form.role;
      navigate(userRole === "admin" ? "/admin" : "/bidder");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-shell flex justify-center py-10">
      <form className="panel w-full max-w-md p-6" onSubmit={submit}>
        <h1 className="text-2xl font-bold text-gov-navy">Login to TendAI</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your email and password to access your account.</p>

        {error && (
          <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="field mt-1"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="e.g. bidder@tendai.gov.in"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="field mt-1"
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
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
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-slate-600">
          New user? <Link className="font-semibold text-gov-blue" to="/register">Register</Link>
        </p>
      </form>
    </section>
  );
}
