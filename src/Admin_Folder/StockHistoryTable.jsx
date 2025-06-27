import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminHeader from './AdminHeader';
import * as XLSX from 'xlsx';

const StockHistoryTable = () => {
  const [stockHistory, setStockHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(() => ({
    brand: '',
    category: '',
    trans_type: '',
    location: localStorage.getItem('selectedLocation') || 'ALL',
  }));
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const locationOptions = ['ALL', 'STORE', 'WAREHOUSE'];

  const handleLocationChange = () => {
    const currentIndex = locationOptions.indexOf(filters.location);
    const nextIndex = (currentIndex + 1) % locationOptions.length;
    const newLocation = locationOptions[nextIndex];
    setFilters(prev => ({ ...prev, location: newLocation }));
    localStorage.setItem('selectedLocation', newLocation);
  };

  const [sortBy, setSortBy] = useState('trans_date');
  const [sortDir, setSortDir] = useState('DESC');


  useEffect(() => {
    fetchStockHistory();
  }, [
  search,
  filters.brand,
  filters.category,
  filters.trans_type,
  filters.location,
  dateRange.start,
  dateRange.end,
  currentPage,
  sortBy,
  sortDir
  ]);

  const fetchStockHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.category) params.append('category', filters.category);
      if (filters.trans_type) params.append('trans_type', filters.trans_type);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortDir) params.append('sort_dir', sortDir);
      if (filters.location && filters.location !== 'ALL') {
        params.append('location', filters.location);
      }

      const response = await axios.get(
        `http://localhost/dch_ver3/src/Backend/load_stockHistory.php?${params.toString()}`
      );
      setStockHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching stock history:', error);
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StockHistory');
    XLSX.writeFile(wb, 'stock_history.xlsx');
  };

  const handleExportPDF = () => {
    const htmlContent = `
      <html>
      <head><title>Stock History</title></head>
      <body>
        <h2>Stock History Report</h2>
        <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Description</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Transaction Type</th>
              <th>Units</th>
              <th>From</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(entry => `
              <tr>
                <td>${entry.item_code}</td>
                <td>${entry.desc_1}</td>
                <td>${entry.brand}</td>
                <td>${entry.category}</td>
                <td>${entry.trans_type}</td>
                <td>${entry.trans_units}</td>
                <td>${entry.location}</td>
                <td>${entry.trans_date}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const filteredData = stockHistory
    .filter(entry => {
      const query = search.toLowerCase();
      return (
        entry.item_code?.toLowerCase().includes(query) ||
        entry.desc_1?.toLowerCase().includes(query) ||
        entry.brand?.toLowerCase().includes(query) ||
        entry.category?.toLowerCase().includes(query)
      );
    })
    .filter(entry => {
      const matchesBrand = !filters.brand || entry.brand === filters.brand;
      const matchesCategory = !filters.category || entry.category === filters.category;
      const matchesType = !filters.trans_type || entry.trans_type === filters.trans_type;
      const matchesFrom = !filters.location || filters.location === 'ALL' || entry.location === filters.location;
      const matchesDate =
        (!dateRange.start || new Date(entry.trans_date) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(entry.trans_date) <= new Date(dateRange.end));
      return matchesBrand && matchesCategory && matchesType && matchesFrom && matchesDate;
    });

  const pageCount = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount || 1);
  }, [pageCount, currentPage]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-4 bg-white shadow-md rounded-lg overflow-x-auto">
      <AdminHeader />
      <h2 className="text-xl font-bold mb-4">Stock History</h2>

      <select
        className="border p-2 rounded"
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        >
        <option value="trans_date">Sort by Trans Date</option>
        <option value="stock_id">Sort by added sequenc</option>
        <option value="date_created">Sort by Date Created</option>
        </select>

        <select
        className="border p-2 rounded"
        value={sortDir}
        onChange={e => setSortDir(e.target.value)}
        >
        <option value="DESC">Descending</option>
        <option value="ASC">Ascending</option>
      </select>


      {/* Filters */}
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
        <select
          className="border p-2 rounded"
          value={filters.brand}
          onChange={e => setFilters({ ...filters, brand: e.target.value })}
        >
          <option value="">All Brands</option>
          {[...new Set(stockHistory.map(e => e.brand))].map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>
        <select
          className="border p-2 rounded"
          value={filters.category}
          onChange={e => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          {[...new Set(stockHistory.map(e => e.category))].map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="border p-2 rounded"
          value={filters.trans_type}
          onChange={e => setFilters({ ...filters, trans_type: e.target.value })}
        >
          <option value="">All Types</option>
          {[...new Set(stockHistory.map(e => e.trans_type))].map((t, i) => (
            <option key={i} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="border p-2 rounded"
          value={filters.location}
          onChange={e => {
            const val = e.target.value;
            setFilters(prev => ({ ...prev, location: val }));
            localStorage.setItem('selectedLocation', val);
          }}
        >
          <option value="ALL">All</option>
          <option value="STORE">STORE</option>
          <option value="WAREHOUSE">WAREHOUSE</option>
        </select>
        <button
          onClick={handleExportExcel}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {/* Table */}
      <table className="w-full table-auto border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Transaction Type</th>
            <th>Units</th>
            <th>From</th>
            <th>Date</th>
            <th>Encoder</th>
            <th>Requesition Number</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan="9" className="text-center py-4">No stock history available.</td>
            </tr>
          ) : (
            paginatedData.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td>{entry.item_code}</td>
                <td>{entry.desc_1}</td>
                <td>{entry.brand}</td>
                <td>{entry.category}</td>
                <td>{entry.trans_type}</td>
                <td>{entry.trans_units}</td>
                <td>{entry.location}</td>
                <td>{entry.trans_date}</td>
                <td>{entry.username}</td>
                <td>{entry.requisition_number}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination controls */}
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

export default StockHistoryTable;
