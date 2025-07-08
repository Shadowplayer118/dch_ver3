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

  const triggerBackup = () => {
    axios.get('http://localhost/dch_ver3/src/Backend/server_backup.php')
      .then(res => {
        console.log("✅ Manual backup triggered:", res.data);
        alert("✅ Backup triggered successfully.");
      })
      .catch(err => {
        console.error("❌ Manual backup failed:", err);
        alert("❌ Backup failed. Check console for details.");
      });
  };

  const triggerCheck = () => {
    axios.get('http://localhost/dch_ver3/src/Backend/check_stock_history.php')
      .then(res => {
        console.log("🔄 Manual stock check:", res.data);
        alert("🔄 Stock history check completed.");
      })
      .catch(err => {
        console.error("⚠️ Stock check failed:", err.message);
        alert("⚠️ Stock check failed. Check console.");
      });
  };

  const triggerThresholdCheck = () => {
    axios.get('http://localhost/dch_ver3/src/Backend/notify_threshold.php')
      .then(res => {
        console.log("📉 Threshold inventory check:", res.data);
        alert("📉 Threshold check completed.");
      })
      .catch(err => {
        console.error("⚠️ Threshold check failed:", err.message);
        alert("⚠️ Threshold check failed. Check console.");
      });
  };

  useEffect(() => {
    // Backup scheduler at fixed times
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
        triggerBackup();
        lastTriggeredTime.current = currentKey;
      }
    }, 60000); // Every minute

    // Stock history check every 20 minutes
    const every20MinInterval = setInterval(() => {
      triggerCheck();
    }, 20 * 60 * 1000);

    // Inventory threshold checker every 10 minutes
    const thresholdInterval = setInterval(() => {
      triggerThresholdCheck();
    }, 60 * 60 * 1000 );

    return () => {
      clearInterval(scheduledInterval);
      clearInterval(every20MinInterval);
      clearInterval(thresholdInterval);
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
        Stock history checks every 20 mins<br />
        Threshold alerts every 1 hour
      </p>

      {/* 🔁 Manual Trigger Buttons */}
      <button
        onClick={triggerBackup}
        style={{
          marginTop: '15px',
          marginBottom: '10px',
          padding: '10px 20px',
          backgroundColor: '#4caf50',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'block',
          width: '100%'
        }}
      >
        🔁 Manual Backup Now
      </button>

      <button
        onClick={triggerCheck}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2196f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          marginBottom: '10px'
        }}
      >
        🕑 Manual Stock Check
      </button>

      <button
        onClick={triggerThresholdCheck}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ff9800',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          marginBottom: '20px'
        }}
      >
        📉 Manual Threshold Check
      </button>

      <button
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ff4d4d',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
};

export default ServerDashboard;
