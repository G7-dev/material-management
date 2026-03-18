import { createBrowserRouter } from "react-router";
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

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
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
]);