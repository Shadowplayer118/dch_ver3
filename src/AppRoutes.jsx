import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import StaffDashboard from "./Staff_Folder/StaffDashboard";
import AdminDashboard from "./Admin_Folder/AdminDashboard";
import RedirectDashboard from "./RedirectDashboard";
import StockInOutTable from "./Admin_Folder/StockInOut";
import StockHistoryTable from "./Admin_Folder/StockHistoryTable";
import ActivityReportTable from "./Admin_Folder/ActivityReport";
import StaffStockInOutTable from "./Staff_Folder/StaffStockInOut";
import StaffStockHistoryTable from "./Staff_Folder/StaffStockHistoryTable";
import InventoryTable from "./Admin_Folder/InventoryTable";


import StaffInventoryTable from "./Staff_Folder/StaffInventory";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Root path redirects if logged in */}
        <Route path="/" element={<RedirectDashboard />} />

        {/* Login route - if you want separate login page, you can use e.g. /login */}
        <Route path="/login" element={<Login />} />

        {/* Dashboards for different user types */}
        <Route path="/AdminDashboard" element={<AdminDashboard />} />

        <Route path="/InventoryTable" element={<InventoryTable />} />
        <Route path="/StockInOutTable" element={<StockInOutTable />} />
        <Route path="/StockHistoryTable" element={<StockHistoryTable />} />
        <Route path="/ActivityReport" element={<ActivityReportTable />} />

        <Route path="/StaffDashboard" element={<StaffDashboard />} />
        <Route path="/StaffInventory" element={<StaffInventoryTable />} />
        <Route path="/StaffStockInOut" element={<StaffStockInOutTable />} />
        <Route path="/StaffStockHistoryTable" element={<StaffStockHistoryTable />} />

      </Routes>
    </Router>
  );
}

export default AppRoutes;
