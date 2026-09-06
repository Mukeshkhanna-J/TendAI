import { FilePlus2, LayoutDashboard, LogOut, SearchCheck, ShieldAlert } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useAuth } from "../hooks/useAuth.js";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const items = isAdmin
    ? [
      { to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
      { to: "/admin/create-tender", label: "Create Tender", icon: FilePlus2 },
      { to: "/admin/bid-control", label: "Bid Value Control", icon: ShieldAlert },
      { to: "/tenders", label: "Public Tenders", icon: SearchCheck }
    ]
    : [
      { to: "/bidder", label: "Bidder Dashboard", icon: LayoutDashboard },
      { to: "/tenders", label: "Browse Tenders", icon: SearchCheck }
    ];

  return (
    <div className="min-h-screen bg-gov-paper lg:flex">
      <aside className="border-b border-gov-line bg-gov-navy text-white lg:fixed lg:inset-y-0 lg:w-72 lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <img src={logo} alt="TendAI" className="h-10 w-10" />
          <div>
            <div className="font-bold">TendAI</div>
            <div className="text-xs text-blue-100">{isAdmin ? "Officer Workspace" : "Bidder Workspace"}</div>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:overflow-visible">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-white text-gov-navy" : "text-blue-50 hover:bg-white/10"}`}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <button className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-blue-50 hover:bg-white/10" type="button" onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </aside>
      <main className="w-full lg:pl-72">
        <div className="page-shell py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
