import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function StaffHeader() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header style={{
      backgroundColor: '#f4f4f4',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #ccc'
    }}>
      <div>
        <h1 style={{ margin: 0 }}>DCH Inventory</h1>
        {username && (
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Logged in as: <strong>{username}</strong>
          </p>
        )}
      </div>

      <nav style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to="/StaffDashboard">Dashboard</Link>
        <Link to="/StaffInventory">Inventory</Link>
        <Link to="/StaffStockInOut">Stock In/Out</Link>
        <Link to="/StaffStockHistoryTable">Stock History</Link>
        <button onClick={handleLogout} style={{
          marginLeft: '10px',
          backgroundColor: '#d9534f',
          color: '#fff',
          border: 'none',
          padding: '6px 12px',
          cursor: 'pointer',
          borderRadius: '4px'
        }}>
          Logout
        </button>
      </nav>
    </header>
  );
}

export default StaffHeader;
