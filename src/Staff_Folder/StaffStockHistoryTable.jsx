import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StaffHeader from './StaffHeader';
import * as XLSX from 'xlsx';

const StaffStockHistoryTable = () => {
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
  const [error, setError] = useState(null);

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
      setError(null);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      setError('Failed to load stock history data');
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
              <th>Encoder</th>
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
                <td>${entry.username}</td>
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

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
  }, [totalPages, currentPage]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageSelect = (e) => {
    setCurrentPage(Number(e.target.value));
  };

  return (
    <div className="inventory-container">
      <StaffHeader />
      
      <div className="inventory-content">
        {/* Main Controls Card */}
        <div className="glass-card">
          <div className="card-header">
            <h2 className="card-title">📈 Stock History Management</h2>
            <div className="action-buttons">
              <button
                onClick={handleExportPDF}
                className="glass-button secondary-button"
              >
                <span className="button-icon">📄</span>
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="glass-button primary-button"
              >
                <span className="button-icon">📊</span>
                Export Excel
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="controls-section">
            {/* Sort Controls */}
            <div className="filter-group">
              <label className="filter-label">
                <span className="label-text">📊 Sort By</span>
                <div className="sort-controls">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="glass-select"
                  >
                    <option value="trans_date">Transaction Date</option>
                    <option value="stock_id">Added Sequence</option>
                    <option value="date_created">Date Created</option>
                  </select>

                  <select
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value)}
                    className="glass-select"
                  >
                    <option value="DESC">Descending</option>
                    <option value="ASC">Ascending</option>
                  </select>
                </div>
              </label>
            </div>

            {/* Location Toggle */}
            <div className="filter-group">
              <label className="filter-label">
                <span className="label-text">📍 Location Filter</span>
                <button 
                  onClick={handleLocationChange} 
                  className="glass-button location-toggle"
                >
                  <span className="button-label">Location:</span>
                  <span className="button-value">{filters.location}</span>
                  <span className="button-icon">🔄</span>
                </button>
              </label>
            </div>

            {/* Search */}
            <div className="filter-group search-group">
              <label className="filter-label">
                <span className="label-text">🔍 Search</span>
                <input
                  type="text"
                  placeholder="Search item code, description, brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="glass-input"
                  autoComplete="off"
                />
              </label>
            </div>

            {/* Date Range */}
            <div className="filter-group">
              <label className="filter-label">
                <span className="label-text">📅 Date Range</span>
                <div className="date-range-controls">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="glass-input"
                  />
                  <span className="date-separator" style={{ color: "white", margin: "0.3rem 0", display: "inline-block" }}>to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="glass-input"
                  />
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="glass-card">
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Transaction Type</th>
                  <th>Units</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Encoder</th>
                </tr>
                <tr className="filter-row">
                  <th></th>
                  <th></th>
                  <th>
                    <select
                      value={filters.brand}
                      onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                      className="glass-select filter-select"
                    >
                      <option value="">All Brands</option>
                      {[...new Set(stockHistory.map(e => e.brand))].map((b, i) => (
                        <option key={i} value={b}>{b}</option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="glass-select filter-select"
                    >
                      <option value="">All Categories</option>
                      {[...new Set(stockHistory.map(e => e.category))].map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filters.trans_type}
                      onChange={(e) => setFilters({ ...filters, trans_type: e.target.value })}
                      className="glass-select filter-select"
                    >
                      <option value="">All Types</option>
                      {[...new Set(stockHistory.map(e => e.trans_type))].map((t, i) => (
                        <option key={i} value={t}>{t}</option>
                      ))}
                    </select>
                  </th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-data">
                      📭 No stock history data found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((entry, index) => (
                    <tr key={index} className="table-row">
                      <td className="item-code">{entry.item_code}</td>
                      <td className="description-cell">
                        <div className="desc-line">{entry.desc_1}</div>
                      </td>
                      <td>{entry.brand}</td>
                      <td>{entry.category}</td>
                      <td className="trans-type-cell">
                        <span className={`trans-type-badge ${entry.trans_type?.toLowerCase()}`}>
                          {entry.trans_type}
                        </span>
                      </td>
                      <td className="units-cell">
                        <div className="units-value">{entry.trans_units}</div>
                      </td>
                      <td className="location-cell">
                        <div className="location-info">
                          <div className="location-main">{entry.location}</div>
                        </div>
                      </td>
                      <td className="date-cell">
                        <div className="date-info">{entry.trans_date}</div>
                      </td>
                      <td className="encoder-cell">
                        <div className="encoder-info">{entry.username}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <button 
              onClick={goToPreviousPage} 
              disabled={currentPage === 1}
              className="glass-button pagination-btn"
            >
              ⬅️ Previous
            </button>

            <div className="page-info">
              <span className="page-text">Page</span>
              <select
                value={currentPage}
                onChange={handlePageSelect}
                className="glass-select page-select"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <option key={pageNum} value={pageNum}>
                      {pageNum}
                    </option>
                  )
                )}
              </select>
              <span className="page-text">{totalPages}</span>
            </div>

            <button 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className="glass-button pagination-btn"
            >
              Next ➡️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffStockHistoryTable;