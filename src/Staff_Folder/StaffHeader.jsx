import React from 'react';
import { useNavigate } from 'react-router-dom';

function StaffHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();  // Clear all localStorage
    navigate('/');         // Redirect to login page
  };

  return (
    <header>
      <h1>DCH Inventory</h1>
      <button onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}

export default StaffHeader;
