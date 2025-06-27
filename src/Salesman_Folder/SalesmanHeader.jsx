import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function SalesHeader() {
  const navigate = useNavigate(); // ✅ FIXED

  const handleLogout = () => {
    localStorage.clear();
    navigate('/'); // ✅ FIXED
  };

  return (
    <header>
      <h1>DCH Inventory</h1>
      <nav>
        <Link to="/SalesmanInventoryTable">Price List</Link>


      </nav>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}

export default SalesHeader;
