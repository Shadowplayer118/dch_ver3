import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const ActivityReportTable = () => {
  const [activityReports, setActivityReports] = useState([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState({ username: '', userType: '', activityType: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchActivityReports();
  }, []);

  const fetchActivityReports = async () => {
    try {
      const response = await axios.get('http://localhost/dch_ver3/src/Backend/load_activity.php');
      setActivityReports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching activity reports:', error);
    }
  };

  // Extract distinct values for filter dropdowns
  const usernames = [...new Set(activityReports.map(e => e.username))];
  const userTypes = [...new Set(activityReports.map(e => e.user_type))];
  const activityTypes = [...new Set(activityReports.map(e => e.activity_type))];

  const filteredData = activityReports
    .filter(entry => {
      const query = search.toLowerCase();
      return (
        entry.activity_type?.toLowerCase().includes(query) ||
        entry.act_performed?.toLowerCase().includes(query) ||
        entry.username?.toLowerCase().includes(query) ||
        entry.user_type?.toLowerCase().includes(query)
      );
    })
    .filter(entry => {
      const entryDate = new Date(entry.date_performed);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      return (
        (!startDate || entryDate >= startDate) &&
        (!endDate || entryDate <= endDate)
      );
    })
    .filter(entry => {
      const entryTime = entry.time_performed;
      return (
        (!timeRange.start || entryTime >= timeRange.start) &&
        (!timeRange.end || entryTime <= timeRange.end)
      );
    })
    .filter(entry => {
      return (
        (!filters.username || entry.username === filters.username) &&
        (!filters.userType || entry.user_type === filters.userType) &&
        (!filters.activityType || entry.activity_type === filters.activityType)
      );
    });

  const pageCount = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount || 1);
  }, [pageCount, currentPage]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ActivityReport');
    XLSX.writeFile(wb, 'activity_report.xlsx');
  };

  const printActivityReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Popup blocked. Please allow popups for this site.');

    const tableRows = filteredData.map(entry => `
      <tr>
        <td>${entry.activity_type}</td>
        <td>${entry.act_performed}</td>
        <td>${entry.username}</td>
        <td>${entry.user_type}</td>
        <td>${entry.date_performed}</td>
        <td>${entry.time_performed}</td>
      </tr>`).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Activity Report</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Activity Report</h2>
          <table>
            <thead>
              <tr>
                <th>Activity Type</th>
                <th>Performed Action</th>
                <th>Username</th>
                <th>User Type</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6">No data available.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); window.onafterprint = () => window.close(); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Activity Report</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="border p-2 rounded w-48"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={dateRange.start}
          onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={dateRange.end}
          onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
        />
        <input
          type="time"
          className="border p-2 rounded"
          value={timeRange.start}
          onChange={e => setTimeRange({ ...timeRange, start: e.target.value })}
        />
        <input
          type="time"
          className="border p-2 rounded"
          value={timeRange.end}
          onChange={e => setTimeRange({ ...timeRange, end: e.target.value })}
        />
        <select
          className="border p-2 rounded"
          value={filters.username}
          onChange={e => setFilters({ ...filters, username: e.target.value })}
        >
          <option value="">All Usernames</option>
          {usernames.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select
          className="border p-2 rounded"
          value={filters.userType}
          onChange={e => setFilters({ ...filters, userType: e.target.value })}
        >
          <option value="">All User Types</option>
          {userTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="border p-2 rounded"
          value={filters.activityType}
          onChange={e => setFilters({ ...filters, activityType: e.target.value })}
        >
          <option value="">All Activity Types</option>
          {activityTypes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button
          onClick={handleExportExcel}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
        <button
          onClick={printActivityReport}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      <table className="w-full table-auto border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th>Activity Type</th>
            <th>Performed Action</th>
            <th>Username</th>
            <th>User Type</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-4">No activity report available.</td>
            </tr>
          ) : (
            paginatedData.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td>{entry.activity_type}</td>
                <td>{entry.act_performed}</td>
                <td>{entry.username}</td>
                <td>{entry.user_type}</td>
                <td>{entry.date_performed}</td>
                <td>{entry.time_performed}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 flex justify-center items-center space-x-4">
        <button
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <label htmlFor="page-select" className="mr-2">Page:</label>
        <select
          id="page-select"
          className="border p-2 rounded"
          value={currentPage}
          onChange={e => setCurrentPage(Number(e.target.value))}
        >
          {Array.from({ length: pageCount }, (_, i) => (
            <option key={i} value={i + 1}>{i + 1}</option>
          ))}
        </select>
        <button
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
          disabled={currentPage === pageCount}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ActivityReportTable;
