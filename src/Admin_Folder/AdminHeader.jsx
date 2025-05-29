import React from 'react';
import { useNavigate } from 'react-router-dom';

function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();  // Clear all localStorage
    navigate('/');         // Redirect to login page
  };

  return (
    <header>
      <h1>DCH Inventory</h1>

      {/* Use plain anchor tags to force full page refresh */}
      <nav>
        <a href="/AdminDashboard">Dashboard</a>
        <a href="/InventoryTable">Inventory</a>
        <a href="/StockInOutTable">Stock In/Out</a>
        <a href="/StockHistoryTable">Stock History</a>
      </nav>

      <button onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}

export default AdminHeader;
