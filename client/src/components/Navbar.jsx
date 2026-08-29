import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useAuth } from "../hooks/useAuth.js";

const navClass = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-white/15 text-white" : "text-blue-50 hover:bg-white/10"}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const dashboardPath = user?.role === "admin" ? "/admin" : "/bidder";

  return (
    <header className="bg-gov-navy text-white">
      <div className="border-b border-white/10 bg-slate-950/25">
        <div className="page-shell flex flex-col gap-1 py-2 text-xs text-blue-50 sm:flex-row sm:items-center sm:justify-between">
          <span>Government of India | Ministry of Digital Governance</span>
          <span>Helpdesk: 1800-000-4321 | support@tendai.gov.in</span>
        </div>
      </div>
      <nav className="page-shell">
        <div className="flex min-h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="TendAI" className="h-11 w-11" />
            <div>
              <div className="text-lg font-bold leading-tight">TendAI</div>
              <div className="text-xs text-blue-100">Transparent AI Tendering Portal</div>
            </div>
          </Link>
          <button className="rounded-md p-2 text-white md:hidden" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink className={navClass} to="/">Home</NavLink>
            <NavLink className={navClass} to="/tenders">Tenders</NavLink>
            <NavLink className={navClass} to="/transparency">Public Transparency</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink className={navClass} to={dashboardPath}>Dashboard</NavLink>
                <button className="ml-2 rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10" onClick={logout} type="button">Logout</button>
              </>
            ) : (
              <NavLink className={navClass} to="/login">Login</NavLink>
            )}
          </div>
        </div>
        {open && (
          <div className="space-y-1 pb-4 md:hidden">
            <NavLink onClick={() => setOpen(false)} className={navClass} to="/">Home</NavLink>
            <NavLink onClick={() => setOpen(false)} className={navClass} to="/tenders">Tenders</NavLink>
            <NavLink onClick={() => setOpen(false)} className={navClass} to="/transparency">Public Transparency</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink onClick={() => setOpen(false)} className={navClass} to={dashboardPath}>Dashboard</NavLink>
                <button className="block rounded-md px-3 py-2 text-sm font-semibold text-blue-50" onClick={() => { logout(); setOpen(false); }} type="button">Logout</button>
              </>
            ) : (
              <NavLink onClick={() => setOpen(false)} className={navClass} to="/login">Login</NavLink>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
