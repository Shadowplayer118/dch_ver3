import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminHeader from './AdminHeader';

// Days order fixed to Monday - Sunday
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper: convert YYYY-MM-DD to YYYYWW (ISO week number)
function dateToYearWeek(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  // Get ISO week number, https://weeknumber.net/how-to/javascript
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday=0,...Sunday=6
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

  // Fetch report when user or week changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const yearweek = dateToYearWeek(selectedWeek);
        const response = await axios.get('http://localhost/dch_ver3/src/Backend/load_activitytable.php', {
          params: {
            username: selectedUser || '',  // pass username string
            yearweek: yearweek || '',      // pass formatted yearweek
          },
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching weekly activity report:', error);
        setData([]); // reset on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedUser, selectedWeek]);

  // ... rest of your existing WeeklyActivityReport rendering code remains unchanged
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

  if (loading) return <p>Loading activity report...</p>;

  return (
    <div className="overflow-x-auto mt-6 max-w-7xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Weekly Activity Report</h2>
      <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
        <thead className="bg-gray-200">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left">Day</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Insert</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Update</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Delete</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Stock In</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Stock Out</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ day_name, day_date, insert_count, update_count, delete_count, stock_in_count, stock_out_count }) => (
            <tr key={day_name} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2">{day_name}</td>
              <td className="border border-gray-300 px-3 py-2">{day_date || '-'}</td>
              <td className="border border-gray-300 px-3 py-2 text-center">{insert_count}</td>
              <td className="border border-gray-300 px-3 py-2 text-center">{update_count}</td>
              <td className="border border-gray-300 px-3 py-2 text-center">{delete_count}</td>
              <td className="border border-gray-300 px-3 py-2 text-center">{stock_in_count}</td>
              <td className="border border-gray-300 px-3 py-2 text-center">{stock_out_count}</td>
            </tr>
          ))}
          <tr className="font-semibold bg-gray-100">
            <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">Total</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{totals.insert}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{totals.update}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{totals.delete}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{totals.stock_in}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{totals.stock_out}</td>
          </tr>
          <tr className="font-semibold bg-gray-50">
            <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">Average per day</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{average.insert}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{average.update}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{average.delete}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{average.stock_in}</td>
            <td className="border border-gray-300 px-3 py-2 text-center">{average.stock_out}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const AdminDashboard = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  // Example user list - use usernames as values now
  const users = [
    { username: '', name: 'All Users' },
    { username: 'dhaniel', name: 'Dhaniel' },
    { username: 'janedoe', name: 'Jane Doe' },
    // replace with your real usernames
  ];

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value); // ISO date string 'YYYY-MM-DD'
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

const handleExportDatabase = () => {
  window.open('http://localhost/dch_ver3/src/Backend/export_database.php', '_blank');
};


  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <button
            onClick={() => window.open('/ActivityReport', '_blank')}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Open Activity Report
          </button>

          <button
            onClick={handleExportDatabase}
            className="ml-4 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          >
            Export Database
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="font-semibold">
            Select User:
            <select
              className="ml-2 border border-gray-300 rounded px-2 py-1"
              value={selectedUser}
              onChange={handleUserChange}
            >
              {users.map(({ username, name }) => (
                <option key={username} value={username}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="font-semibold">
            Select Week:
            <input
              type="date"
              className="ml-2 border border-gray-300 rounded px-2 py-1"
              value={selectedWeek}
              onChange={handleWeekChange}
            />
            <small className="block text-gray-500 text-xs">Pick any date within the desired week</small>
          </label>
        </div>

        <WeeklyActivityReport selectedUser={selectedUser} selectedWeek={selectedWeek} />
      </div>
    </div>
  );
};

export default AdminDashboard;
