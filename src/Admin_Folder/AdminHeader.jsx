import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();  // Clear all localStorage
    navigate('/');         // Redirect to login page
  };

  return (
    <header>
      <h1>DCH Inventory</h1>

      {/* Example link to the dashboard */}
      <nav>
        <Link to="/AdminDashboard">Dashboard</Link>
        <Link to="/InventoryTable">Inventory</Link>
        <Link to="/StockInOutTable">Stock In/Out</Link>
      </nav>

      <button onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}

export default AdminHeader;
