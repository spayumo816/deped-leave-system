import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import LeaveCreditsPage from "./pages/LeaveCreditsPage";
import AppLayout from "./layouts/AppLayout";
import PendingApprovalsPage from "./pages/PendingApprovalsPage";
import FileLeavePage from "./pages/FileLeavePage";
import MyLeavesPage from "./pages/MyLeavePage";
import LeaveApplicationsPage from "./pages/LeaveApplicationsPage";
import LeaveLedgerPage from "./pages/LeaveLedgerPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AddManagedSchoolPage from "./pages/AddManagedSchoolPage";

import { useAuth } from "./app/AuthContext";

function AppLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-xl font-bold text-white shadow-sm">
          DL
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Loading DepEd Leave...
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Please wait while we prepare your dashboard.
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Legacy / optional route. Hidden from sidebar but kept accessible. */}
          <Route path="/credits" element={<LeaveCreditsPage />} />

          <Route path="/pending-approvals" element={<PendingApprovalsPage />} />
          <Route path="/file-leave" element={<FileLeavePage />} />
          <Route path="/my-leaves" element={<MyLeavesPage />} />
          <Route path="/leaves" element={<LeaveApplicationsPage />} />
          <Route path="/leave-ledger" element={<LeaveLedgerPage />} />
          <Route path="/add-managed-school" element={<AddManagedSchoolPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}