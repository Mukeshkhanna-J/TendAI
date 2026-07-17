import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "bidder" });
  const { login } = useAuth();
  const navigate = useNavigate();

  function submit(event) {
    event.preventDefault();
    login({ name: form.email.split("@")[0], role: form.role });
    navigate(form.role === "admin" ? "/admin" : "/bidder");
  }

  return (
    <section className="page-shell flex justify-center py-10">
      <form className="panel w-full max-w-md p-6" onSubmit={submit}>
        <h1 className="text-2xl font-bold text-gov-navy">Login to TendAI</h1>
        <p className="mt-2 text-sm text-slate-600">Use any email and password for this mock UI.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Email<input className="field mt-1" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input className="field mt-1" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700">Role<select className="field mt-1" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="bidder">Bidder</option><option value="admin">Government Officer</option></select></label>
          <button className="btn-primary w-full" type="submit">Login</button>
        </div>
        <p className="mt-4 text-center text-sm text-slate-600">New user? <Link className="font-semibold text-gov-blue" to="/register">Register</Link></p>
      </form>
    </section>
  );
}
