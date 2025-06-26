import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function StaffHeader() {
  const navigate = useNavigate(); // ✅ FIXED

  const handleLogout = () => {
    localStorage.clear();
    navigate('/'); // ✅ FIXED
  };

  return (
    <header>
      <h1>DCH Inventory</h1>
      <nav>
        <Link to="/StaffInventory">Inventory</Link>
        <Link to="/StaffStockInOut">Stock In/Out</Link>
        <Link to="/StaffStockHistoryTable">Stock History</Link>
      </nav>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}

export default StaffHeader;
