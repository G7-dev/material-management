import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { RootLayout } from "./components/RootLayout";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { DailyCollection } from "./pages/DailyCollection";
import { ItemPurchase } from "./pages/ItemPurchase";
import { ApplicationRecords } from "./pages/ApplicationRecords";
import { ManagementPlatform } from "./pages/ManagementPlatform";
import { ItemUpload } from "./pages/ItemUpload";
import { ItemPermission } from "./pages/ItemPermission";
import { ApprovalManagement } from "./pages/ApprovalManagement";
import { LowStockAlert } from "./pages/LowStockAlert";

// Auth wrapper component
function AuthWrapper() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Package className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    element: <AuthWrapper />,
    children: [
      {
        Component: RootLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "daily-collection", Component: DailyCollection },
          { path: "item-purchase", Component: ItemPurchase },
          { path: "application-records", Component: ApplicationRecords },
          { path: "management", Component: ManagementPlatform },
          { path: "item-upload", Component: ItemUpload },
          { path: "item-permission", Component: ItemPermission },
          { path: "low-stock-alert", Component: LowStockAlert },
          { path: "approval-management", Component: ApprovalManagement },
        ],
      },
    ],
  },
]);