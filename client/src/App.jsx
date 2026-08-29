import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import BidderDashboard from "./pages/BidderDashboard.jsx";
import CreateTender from "./pages/CreateTender.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import PublicTransparency from "./pages/PublicTransparency.jsx";
import Register from "./pages/Register.jsx";
import TenderDetail from "./pages/TenderDetail.jsx";
import TenderList from "./pages/TenderList.jsx";
import { useAuth } from "./hooks/useAuth.js";

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={user?.role === "admin" ? "/admin" : "/bidder"} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="tenders" element={<TenderList />} />
        <Route path="tenders/:tenderId" element={<TenderDetail />} />
        <Route path="transparency" element={<PublicTransparency />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="bidder" element={<ProtectedRoute role="bidder"><BidderDashboard /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/create-tender" element={<ProtectedRoute role="admin"><CreateTender /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
