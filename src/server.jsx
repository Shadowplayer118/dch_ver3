import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ServerDashboard = () => {
  const lastTriggeredTime = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    // Scheduled backups at 12:00, 17:00, 20:00
    const scheduledInterval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentKey = `${currentHour}:${currentMinute}`;

      const scheduledTimes = [
        { hour: 12, minute: 0 },
        { hour: 17, minute: 0 },
        { hour: 20, minute: 0 }
      ];

      const shouldTrigger = scheduledTimes.some(
        ({ hour, minute }) => hour === currentHour && minute === currentMinute
      );

      if (shouldTrigger && lastTriggeredTime.current !== currentKey) {
        axios.get('http://localhost/dch_ver3/src/Backend/server_backup.php')
          .then(res => {
            console.log("✅ Scheduled backup triggered:", res.data);
          })
          .catch(err => {
            console.error("❌ Scheduled backup failed:", err);
          });

        lastTriggeredTime.current = currentKey;
      }
    }, 60000); // check every minute

    // Regular 20-minute check (regardless of specific hour)
    const every20MinInterval = setInterval(() => {
      axios.get('http://localhost/dch_ver3/src/Backend/check_stock_history.php.php')
        .then(res => {
          console.log("🔄 20-min API check:", res.data);
        })
        .catch(err => {
          console.error("⚠️ 20-min check failed:", err.message);
        });
    }, 20 * 60 * 1000); // every 20 minutes

    return () => {
      clearInterval(scheduledInterval);
      clearInterval(every20MinInterval);
    };
  }, []);

  return (
    <div style={{
      backgroundColor: '#f0f8ff',
      padding: '20px',
      borderRadius: '10px',
      textAlign: 'center',
      maxWidth: '400px',
      margin: '20px auto',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📡 Saving Server Active</div>
      <p style={{ color: '#555' }}>
        Backups run at 12:00 PM, 5:00 PM, 8:00 PM<br />
        API checks every 20 minutes
      </p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#ff4d4d',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default ServerDashboard;
