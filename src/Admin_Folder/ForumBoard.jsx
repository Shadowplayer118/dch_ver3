import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminHeader from './AdminHeader';

const ForumBoard = () => {
  const [forums, setForums] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', request_date: '' });
  const [sortField, setSortField] = useState('date_created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination for forums
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  // Date filter
  const [requestDates, setRequestDates] = useState([]);
  const [dateSearch, setDateSearch] = useState('');
  const [datePage, setDatePage] = useState(1);
  const datesPerPage = 5;
  const filteredDates = requestDates.filter((date) => date.includes(dateSearch));
  const totalDatePages = Math.ceil(filteredDates.length / datesPerPage);
  const paginatedDates = filteredDates.slice((datePage - 1) * datesPerPage, datePage * datesPerPage);

  const fetchForums = async () => {
    try {
      const res = await axios.get('http://localhost/dch_ver3/src/Backend/load_forum.php', {
        params: { ...filters, sortField, sortOrder, limit, offset },
      });
      setForums(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('❌ Failed to fetch forums:', err);
    }
  };

  const fetchRequestDates = async () => {
    try {
      const res = await axios.get('http://localhost/dch_ver3/src/Backend/fetch_form_dates.php');
      setRequestDates(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch request dates:', err);
    }
  };

  useEffect(() => {
    fetchForums();
  }, [filters, sortField, sortOrder, page]);

  useEffect(() => {
    fetchRequestDates();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleDateFilter = (date) => {
    setFilters((prev) => ({ ...prev, request_date: date }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: '', type: '', status: '', request_date: '' });
    setSortField('date_created');
    setSortOrder('desc');
    setPage(1);
    setDateSearch('');
    setDatePage(1);
  };

  const handleUpdate = (forum) => {
    alert(`🛠 Update forum #${forum.forum_id} clicked`);
  };

  const handleCancel = (forum) => {
    if (window.confirm(`Cancel request for item ${forum.item_code}?`)) {
      alert(`🗑 Cancel forum #${forum.forum_id}`);
    }
  };

  return (
    <div className="inventory-container">
      <AdminHeader />
      <div className="inventory-content flex">
        {/* Left-side Date Filter */}
        <div className="glass-card" style={{ minWidth: '200px', marginRight: '1rem' }}>
          <div className="card-header">
            <h3 className="card-title">📅 Request Dates</h3>
            <input
              type="date"
              value={dateSearch}
              onChange={(e) => {
                setDateSearch(e.target.value);
                setDatePage(1);
              }}
              className="glass-input mt-2"
            />
            <button className="glass-button glass-button-sm mt-2" onClick={resetFilters}>
              🔁 Reset Filters
            </button>
          </div>
          <div className="date-list mt-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {paginatedDates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => handleDateFilter(date)}
                className={`glass-button glass-button-sm w-full my-1 ${
                  filters.request_date === date ? 'selected' : ''
                }`}
              >
                {date}
              </button>
            ))}
          </div>

          {/* Date Pagination */}
          <div className="pagination-controls mt-2 text-center">
            <button
              className="glass-button glass-button-sm"
              disabled={datePage === 1}
              onClick={() => setDatePage((p) => p - 1)}
            >
              ◀
            </button>
            <span className="page-info mx-2">
              {datePage} / {totalDatePages}
            </span>
            <button
              className="glass-button glass-button-sm"
              disabled={datePage === totalDatePages}
              onClick={() => setDatePage((p) => p + 1)}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Right-side Table */}
        <div className="flex-1">
          {/* Filters */}
          <div className="glass-card">
            <div className="card-header">
              <h2 className="card-title">📝 Admin Forum Requests</h2>
            </div>
            <div className="controls-section">
              <div className="filter-group">
                <label className="filter-label">
                  <span className="label-text">Sort By</span>
                  <div className="sort-controls">
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value)}
                      className="glass-select"
                    >
                      <option value="date_created">Date Created</option>
                      <option value="request_date">Request Date</option>
                      <option value="item_code">Item Code</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="glass-select"
                    >
                      <option value="asc">Asc</option>
                      <option value="desc">Desc</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <span className="label-text">Status</span>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="glass-select"
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </label>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <span className="label-text">Type</span>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="glass-select"
                  >
                    <option value="">All</option>
                    <option value="ORDER">Order</option>
                    <option value="REQUISITION">Requisition</option>
                  </select>
                </label>
              </div>

              <div className="filter-group search-group">
                <label className="filter-label">
                  <span className="label-text">Search</span>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search item code or text..."
                    className="glass-input"
                  />
                </label>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="glass-button"
              >
                ➕ New Forum
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card">
            <div className="table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Text</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(forums) && forums.length > 0 ? (
                    forums.map((forum) => (
                      <tr key={forum.forum_id}>
                        <td>
                          <div className="text-sm font-semibold">{forum.category}</div>
                          <div className="text-xs text-gray-500">{forum.item_code}</div>
                        </td>
                        <td>
                          <div className="text-xs text-gray-600">
                            {`${forum.desc_1 || ''} ${forum.desc_2 || ''} ${forum.desc_3 || ''}`.trim()}
                          </div>
                          <div className="text-sm">{forum.text}</div>
                        </td>
                        <td>
                          <div className="text-xs text-gray-600">{forum.location}</div>
                        </td>
                        <td>
                          <div className="text-xs text-gray-600">{forum.brand}</div>
                          <div className="text-sm">{forum.type}</div>
                        </td>
                        <td>
                          <div className="text-xs text-gray-600">{forum.units} units</div>
                          <div className="text-sm">{forum.request_date}</div>
                        </td>
                        <td>{forum.status}</td>
                        <td>
                          <button
                            className="glass-button glass-button-sm"
                            onClick={() => handleUpdate(forum)}
                          >
                            ✏️ Update
                          </button>
                          <button
                            className="glass-button glass-button-sm danger"
                            onClick={() => handleCancel(forum)}
                          >
                            🗑 Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        📭 No forum requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Forum Pagination */}
            <div className="pagination-controls">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="glass-button glass-button-sm"
              >
                ⬅ Prev
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="glass-button glass-button-sm"
              >
                Next ➡
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* {showAddModal && (
        <AddForumModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchForums}
        />
      )} */}
    </div>
  );
};

export default ForumBoard;
