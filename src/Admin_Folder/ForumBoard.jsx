import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminHeader from './AdminHeader';

const ForumBoard = () => {
  const [forums, setForums] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', request_date: '' });
  const [sortField, setSortField] = useState('date_created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const [requestDates, setRequestDates] = useState([]);
  const [dateSearch, setDateSearch] = useState('');
  const [datePage, setDatePage] = useState(1);
  const datesPerPage = 5;
  const filteredDates = requestDates.filter((date) => 
    date && date.toString().includes(dateSearch)
  );
  const totalDatePages = Math.max(Math.ceil(filteredDates.length / datesPerPage), 1);
  const paginatedDates = filteredDates.slice(
    (datePage - 1) * datesPerPage, 
    datePage * datesPerPage
  );

  // Default filter values
  const defaultFilters = {
    search: '',
    type: '',
    status: '',
    request_date: ''
  };

  const fetchForums = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        ...filters,
        sortField,
        sortOrder,
        limit,
        offset
      };
      
      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('Fetching forums with params:', params);
      
      const res = await axios.get('http://localhost/dch_ver3/src/Backend/load_forum.php', {
        params,
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Forums response:', res.data);
      
      if (res.data && typeof res.data === 'object') {
        setForums(Array.isArray(res.data.data) ? res.data.data : []);
        setTotal(Number(res.data.total) || 0);
      } else {
        setForums([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('❌ Failed to fetch forums:', err);
      setError('Failed to load forum data. Please check your connection and try again.');
      setForums([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sortField, sortOrder, limit, offset]);

  const fetchRequestDates = useCallback(async () => {
    try {
      console.log('Fetching request dates...');
      const res = await axios.get('http://localhost/dch_ver3/src/Backend/fetch_form_dates.php', {
        timeout: 10000
      });
      
      console.log('Dates response:', res.data);
      
      if (Array.isArray(res.data)) {
        setRequestDates(res.data);
      } else {
        setRequestDates([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch request dates:', err);
      setRequestDates([]);
    }
  }, []);

  useEffect(() => {
    fetchForums();
  }, [fetchForums]);

  useEffect(() => {
    fetchRequestDates();
  }, [fetchRequestDates]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleDateFilter = (date) => {
    setFilters(prev => ({ ...prev, request_date: date }));
    setPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Reset all filters and pagination to default
      setFilters(defaultFilters);
      setPage(1);
      setSortField('date_created');
      setSortOrder('desc');
      setDateSearch('');
      setDatePage(1);
      
      // Fetch fresh data
      await Promise.all([
        fetchRequestDates(),
        // fetchForums will be called automatically due to useEffect dependencies
      ]);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const resetFilters = () => {
    handleRefresh();
  };

  const handleUpdate = (forum) => {
    if (forum && forum.forum_id) {
      alert(`🛠 Update forum #${forum.forum_id} clicked`);
    }
  };

  const handleCancel = (forum) => {
    if (forum && forum.item_code) {
      if (window.confirm(`Cancel request for item ${forum.item_code}?`)) {
        alert(`🗑 Cancel forum #${forum.forum_id}`);
        // Add actual cancel logic here
      }
    }
  };

  const handlePageSelect = (e) => {
    const newPage = Number(e.target.value);
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleDateSearchChange = (e) => {
    const value = e.target.value;
    setDateSearch(value);
    setDatePage(1);
    if (value) {
      handleDateFilter(value);
    }
  };

  const handleSortFieldChange = (e) => {
    setSortField(e.target.value);
    setPage(1);
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
    setPage(1);
  };

  return (
    <div className="forumboard-container">
      <AdminHeader />
      
      <div className="forumboard-content">
        {/* Sidebar */}
        <div className="forumboard-sidebar">
          <div className="forumboard-glass-card">
            <div className="card-header">
              <h3 className="card-title">📅 Request Dates</h3>
              <input
                type="date"
                value={dateSearch}
                onChange={handleDateSearchChange}
                className="forumboard-glass-input date-search-input"
              />
            </div>
            <div className="forumboard-date-list">
              {paginatedDates.length > 0 ? (
                paginatedDates.map((date, idx) => (
                  <button
                    key={`${date}-${idx}`}
                    onClick={() => handleDateFilter(date)}
                    className={`forumboard-glass-button forumboard-glass-button-sm date-filter-btn ${
                      filters.request_date === date ? 'selected' : ''
                    }`}
                  >
                    {date}
                  </button>
                ))
              ) : (
                <p className="no-dates">No dates available</p>
              )}
            </div>

            {filteredDates.length > datesPerPage && (
              <div className="forumboard-pagination date-pagination">
                <button
                  className="forumboard-glass-button forumboard-glass-button-sm"
                  disabled={datePage === 1}
                  onClick={() => setDatePage(p => Math.max(p - 1, 1))}
                >
                  ◀
                </button>
                <span className="forumboard-page-info">
                  {datePage} / {totalDatePages}
                </span>
                <button
                  className="forumboard-glass-button forumboard-glass-button-sm"
                  disabled={datePage === totalDatePages}
                  onClick={() => setDatePage(p => Math.min(p + 1, totalDatePages))}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="forumboard-main">
          <div className="forumboard-glass-card">
            <div className="card-header">
              <h2 className="card-title">📝 Admin Forum Requests</h2>
              <div className="action-buttons">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="forumboard-glass-button refresh-button"
                  title="Refresh forum data and reset all filters"
                >
                  <span className="button-icon">
                    {isRefreshing ? "⏳" : "🔄"}
                  </span>
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="forumboard-glass-button add-forum-btn"
                >
                  <span className="button-icon">➕</span>
                  New Forum
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message" style={{ color: 'red', padding: '10px', margin: '10px 0' }}>
                {error}
              </div>
            )}

            {/* Controls Section */}
            <div className="forumboard-controls">
              {/* Sort Controls */}
              <div className="filter-group">
                <label className="filter-label">
                  <span className="label-text">📊 Sort By</span>
                  <div className="sort-controls">
                    <select
                      value={sortField}
                      onChange={handleSortFieldChange}
                      className="forumboard-glass-select"
                    >
                      <option value="date_created">Date Created</option>
                      <option value="request_date">Request Date</option>
                      <option value="item_code">Item Code</option>
                      <option value="status">Status</option>
                      <option value="type">Type</option>
                    </select>

                    <select
                      value={sortOrder}
                      onChange={handleSortOrderChange}
                      className="forumboard-glass-select"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </label>
              </div>

              {/* Search */}
              <div className="filter-group search-group">
                <label className="filter-label">
                  <span className="label-text">🔍 Search</span>
                  <input
                    type="text"
                    name="search"
                    placeholder="Search item code or text..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="forumboard-glass-input"
                    autoComplete="off"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="forumboard-glass-card table-card">
            <div className="forumboard-table-container">
              {loading && (
                <div className="loading-message" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading forums...
                </div>
              )}
              
              <table className="forumboard-glass-table">
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
                  <tr className="filter-row">
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>
                      <select
                        name="type"
                        value={filters.type}
                        onChange={handleFilterChange}
                        className="forumboard-glass-select filter-select"
                      >
                        <option value="">All Types</option>
                        <option value="ORDER">Order</option>
                        <option value="REQUISITION">Requisition</option>
                      </select>
                    </th>
                    <th></th>
                    <th>
                      <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="forumboard-glass-select filter-select"
                      >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                      </select>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && Array.isArray(forums) && forums.length > 0 ? (
                    forums.map((forum, index) => (
                      <tr key={forum.forum_id || `forum-${index}`} className="table-row">
                        <td className="col-item-code">
                          <div className="item-code-category">{forum.category || 'N/A'}</div>
                          <div className="item-code-value">{forum.item_code || 'N/A'}</div>
                        </td>
                        <td className="col-text">
                          <div className="text-description">
                            {`${forum.desc_1 || ''} ${forum.desc_2 || ''} ${forum.desc_3 || ''}`.trim() || 'N/A'}
                          </div>
                          <div className="text-main">{forum.text || 'N/A'}</div>
                        </td>
                        <td className="col-location">
                          <div className="location-text">{forum.location || 'N/A'}</div>
                        </td>
                        <td className="col-type">
                          <div className="type-brand">{forum.brand || 'N/A'}</div>
                          <div className="type-main">{forum.type || 'N/A'}</div>
                        </td>
                        <td className="col-request-date">
                          <div className="request-units">{forum.units || 0} units</div>
                          <div className="request-date-value">{forum.request_date || 'N/A'}</div>
                        </td>
                        <td className="col-status">
                          <div className="status-badge">{forum.status || 'N/A'}</div>
                        </td>
                        <td className="col-actions">
                          <div className="action-buttons-vertical">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleUpdate(forum)}
                              disabled={!forum.forum_id}
                            >
                              ✏️ Update
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleCancel(forum)}
                              disabled={!forum.item_code}
                            >
                              🗑️ Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="forumboard-no-data">
                        {loading ? "Loading..." : "📭 No forum requests found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="forumboard-pagination main-pagination">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="forumboard-glass-button forumboard-glass-button-sm"
                >
                  ⬅️ Previous
                </button>

                <div className="forumboard-page-info">
                  <span className="page-text">Page</span>
                  <select
                    value={page}
                    onChange={handlePageSelect}
                    className="forumboard-glass-select page-select"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <option key={pageNum} value={pageNum}>
                          {pageNum}
                        </option>
                      )
                    )}
                  </select>
                  <span className="page-text">of {totalPages}</span>
                </div>

                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="forumboard-glass-button forumboard-glass-button-sm"
                >
                  Next ➡️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uncomment when AddForumModal is ready */}
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