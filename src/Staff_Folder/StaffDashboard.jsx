import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StaffHeader from './StaffHeader';

// Days order fixed to Monday - Sunday
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const InventorySummary = () => {
  const [location, setLocation] = useState('ALL');
  const [summary, setSummary] = useState({ item_count: 0, total_value: 0, stock_in_today: 0, stock_out_today: 0 });
  const [loading, setLoading] = useState(true);

  const locationCycle = ['ALL', 'WAREHOUSE', 'STORE'];

  const toggleLocation = () => {
    const currentIndex = locationCycle.indexOf(location);
    const next = locationCycle[(currentIndex + 1) % locationCycle.length];
    setLocation(next);
  };

  // Format number with commas and no decimals
  const formatNumber = (value) => {
    const num = parseInt(value) || 0;
    return num.toLocaleString();
  };

  // Format currency with peso symbol and commas, no decimals
  const formatCurrency = (value) => {
    const num = parseInt(value) || 0;
    return `₱${num.toLocaleString()}`;
  };

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost/dch_ver3/src/Backend/inventory_summary.php', {
          params: { location },
        });
        
        // Add minimum loading time of 1.5 seconds
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSummary(res.data);
      } catch (err) {
        console.error('Error loading inventory summary:', err);
        setSummary({ item_count: 0, total_value: 0, stock_in_today: 0, stock_out_today: 0 });
        
        // Still apply minimum loading time even on error
        await new Promise(resolve => setTimeout(resolve, 1500));
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [location]);

  return (
    <div className="glass-card inventory-summary">
      <div className="card-header">
        <h2 className="card-title">📦 Inventory Summary</h2>
        <button className="glass-button location-toggle" onClick={toggleLocation}>
          <span className="button-label">Location:</span>
          <span className="button-value">{location}</span>
        </button>
      </div>
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading summary...</p>
        </div>
      ) : (
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-icon">📦</div>
            <div className="summary-content">
              <p className="summary-label">Total Items</p>
              <p className="summary-value" title={formatNumber(summary.item_count)}>
                {formatNumber(summary.item_count)}
              </p>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <p className="summary-label">Total Stock Value</p>
              <p className="summary-value currency-value" title={formatCurrency(summary.total_value)}>
                <span className="peso-symbol">₱</span>
                <span className="amount">{formatNumber(summary.total_value)}</span>
              </p>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">📥</div>
            <div className="summary-content">
              <p className="summary-label">Stock-Ins Today</p>
              <p className="summary-value" title={formatNumber(summary.stock_in_today)}>
                {formatNumber(summary.stock_in_today)}
              </p>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">📤</div>
            <div className="summary-content">
              <p className="summary-label">Stock-Outs Today</p>
              <p className="summary-value" title={formatNumber(summary.stock_out_today)}>
                {formatNumber(summary.stock_out_today)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function dateToYearWeek(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  const year = date.getFullYear();
  return year + String(weekNumber).padStart(2, '0');
}

const WeeklyActivityReport = ({ selectedUser, selectedWeek }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const yearweek = dateToYearWeek(selectedWeek);
        const response = await axios.get('http://localhost/dch_ver3/src/Backend/load_activitytable.php', {
          params: {
            username: selectedUser || '',
            yearweek: yearweek || '',
          },
        });
        
        // Add minimum loading time of 1.2 seconds
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setData(response.data);
      } catch (error) {
        console.error('Error fetching weekly activity report:', error);
        setData([]);
        
        // Still apply minimum loading time even on error
        await new Promise(resolve => setTimeout(resolve, 1200));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedUser, selectedWeek]);

  const dataMap = {};
  data.forEach((row) => {
    dataMap[row.day_name] = row;
  });

  const rows = daysOfWeek.map((day) => {
    const dayData = dataMap[day];
    return {
      day_name: day,
      day_date: dayData ? dayData.day_date : '',
      insert_count: dayData ? dayData.insert_count : 0,
      update_count: dayData ? dayData.update_count : 0,
      delete_count: dayData ? dayData.delete_count : 0,
      stock_in_count: dayData ? dayData.stock_in_count : 0,
      stock_out_count: dayData ? dayData.stock_out_count : 0,
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.insert += row.insert_count;
      acc.update += row.update_count;
      acc.delete += row.delete_count;
      acc.stock_in += row.stock_in_count;
      acc.stock_out += row.stock_out_count;
      return acc;
    },
    { insert: 0, update: 0, delete: 0, stock_in: 0, stock_out: 0 }
  );

  const average = {
    insert: (totals.insert / 7).toFixed(2),
    update: (totals.update / 7).toFixed(2),
    delete: (totals.delete / 7).toFixed(2),
    stock_in: (totals.stock_in / 7).toFixed(2),
    stock_out: (totals.stock_out / 7).toFixed(2),
  };

  if (loading) {
    return (
      <div className="glass-card">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading activity report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card weekly-report">
      <h2 className="card-title">Weekly Activity Report</h2>
      <div className="table-container">
        <div className="table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Insert</th>
                <th>Update</th>
                <th>Delete</th>
                <th>Stock In</th>
                <th>Stock Out</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ day_name, day_date, insert_count, update_count, delete_count, stock_in_count, stock_out_count }) => (
                <tr key={day_name} className="table-row">
                  <td className="day-cell">{day_name}</td>
                  <td>{day_date || '-'}</td>
                  <td className="number-cell">{insert_count}</td>
                  <td className="number-cell">{update_count}</td>
                  <td className="number-cell">{delete_count}</td>
                  <td className="number-cell">{stock_in_count}</td>
                  <td className="number-cell">{stock_out_count}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={2} className="total-label">Total</td>
                <td className="number-cell total-value">{totals.insert}</td>
                <td className="number-cell total-value">{totals.update}</td>
                <td className="number-cell total-value">{totals.delete}</td>
                <td className="number-cell total-value">{totals.stock_in}</td>
                <td className="number-cell total-value">{totals.stock_out}</td>
              </tr>
              <tr className="average-row">
                <td colSpan={2} className="average-label">Average per day</td>
                <td className="number-cell average-value">{average.insert}</td>
                <td className="number-cell average-value">{average.update}</td>
                <td className="number-cell average-value">{average.delete}</td>
                <td className="number-cell average-value">{average.stock_in}</td>
                <td className="number-cell average-value">{average.stock_out}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost/dch_ver3/src/Backend/fetch_user.php');
        setUsers(res.data);
      } catch (error) {
        console.error('Failed to load users:', error);
        setUsers([{ username: '', name: 'All Users' }]); // fallback
      }
    };

    fetchUsers();
  }, []);

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value);
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  const handleExportDatabase = () => {
    window.open('http://localhost/dch_ver3/src/Backend/export_database.php', '_blank');
  };

  return (
    <div className="dashboard-container">
      <StaffHeader />
      <div className="dashboard-content">
        <InventorySummary />
        
        <div className="action-buttons">
          <button
            onClick={() => window.open('/ActivityReport', '_blank')}
            className="glass-button primary-button"
          >
            <span className="button-icon">📊</span>
            Open Activity Report
          </button>
          <button
            onClick={handleExportDatabase}
            className="glass-button secondary-button"
          >
            <span className="button-icon">💾</span>
            Export Database
          </button>
        </div>
        
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Select User:</span>
              <select
                className="glass-select"
                value={selectedUser}
                onChange={handleUserChange}
              >
                {users.map(({ username, name }) => (
                  <option key={username} value={username}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Select Week:</span>
              <input
                type="date"
                className="glass-input"
                value={selectedWeek}
                onChange={handleWeekChange}
              />
              <small className="input-hint">Pick any date within the desired week</small>
            </label>
          </div>
        </div>
        
        <WeeklyActivityReport selectedUser={selectedUser} selectedWeek={selectedWeek} />
      </div>
    </div>
  );
};

export default StaffDashboard;