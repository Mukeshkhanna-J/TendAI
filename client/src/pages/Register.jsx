import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", organisation: "", role: "bidder" });
  const { register } = useAuth();
  const navigate = useNavigate();

  function submit(event) {
    event.preventDefault();
    register({ name: form.name, role: form.role });
    navigate(form.role === "admin" ? "/admin" : "/bidder");
  }

  return (
    <section className="page-shell flex justify-center py-10">
      <form className="panel w-full max-w-lg p-6" onSubmit={submit}>
        <h1 className="text-2xl font-bold text-gov-navy">Register</h1>
        <p className="mt-2 text-sm text-slate-600">Create a mock TendAI account for bidder or government officer flows.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Full Name<input className="field mt-1" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700">Email<input className="field mt-1" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Organisation<input className="field mt-1" required value={form.organisation} onChange={(event) => setForm({ ...form, organisation: event.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Role<select className="field mt-1" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="bidder">Bidder</option><option value="admin">Government Officer</option></select></label>
        </div>
        <button className="btn-primary mt-6 w-full" type="submit">Create Account</button>
        <p className="mt-4 text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-gov-blue" to="/login">Login</Link></p>
      </form>
    </section>
  );
}
