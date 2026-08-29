import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import BidderDashboard from "./pages/BidderDashboard.jsx";
import CreateTender from "./pages/CreateTender.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TenderDetail from "./pages/TenderDetail.jsx";
import TenderList from "./pages/TenderList.jsx";
import { useAuth } from "./hooks/useAuth.js";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { defineChain } from "viem";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

function ProtectedRoute({ children, role }) {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (role && user?.role !== role)
        return (
            <Navigate
                to={user?.role === "admin" ? "/admin" : "/bidder"}
                replace
            />
        );
    return children;
}

const ganache = defineChain({
    id: 1337,
    name: "Ganache",
    nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["http://127.0.0.1:7545"],
        },
    },
});

const config = getDefaultConfig({
    appName: "TendAI",
    projectId: "8bcdfb07102627685b33a0a8e9094019",
    chains: [ganache],
    ssr: true, // for server side rendering
});

const queryClient = new QueryClient();

function Web3Scope({ children }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default function App() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="tenders" element={<TenderList />} />
                <Route path="tenders/:tenderId" element={<TenderDetail />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
            </Route>
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route
                    path="bidder"
                    element={
                        <ProtectedRoute role="bidder">
                            <Web3Scope>
                                <BidderDashboard />
                            </Web3Scope>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="admin"
                    element={
                        <ProtectedRoute role="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="admin/create-tender"
                    element={
                        <ProtectedRoute role="admin">
                            <CreateTender />
                        </ProtectedRoute>
                    }
                />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
