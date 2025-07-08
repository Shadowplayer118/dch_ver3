import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const ActivityReportTable = () => {
  const [activityReports, setActivityReports] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    username: "",
    userType: "",
    activityType: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });
  const [uniqueValues, setUniqueValues] = useState({
    usernames: [],
    userTypes: [],
    activityTypes: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState("date_performed");
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchActivityReports();
    updateUniqueValues();
  }, []);

  useEffect(() => {
    updateUniqueValues();
  }, [activityReports]);

  const fetchActivityReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost/dch_ver3/src/Backend/load_activity.php"
      );
      setActivityReports(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching activity reports:", error);
      setError("Failed to load activity reports");
    } finally {
      setLoading(false);
    }
  };

  const updateUniqueValues = () => {
    const usernames = [...new Set(activityReports.map((e) => e.username))];
    const userTypes = [...new Set(activityReports.map((e) => e.user_type))];
    const activityTypes = [
      ...new Set(activityReports.map((e) => e.activity_type)),
    ];

    setUniqueValues({
      usernames: usernames.filter(Boolean),
      userTypes: userTypes.filter(Boolean),
      activityTypes: activityTypes.filter(Boolean),
    });
  };

  const filteredData = activityReports
    .filter((entry) => {
      const query = filters.search.toLowerCase();
      return (
        entry.activity_type?.toLowerCase().includes(query) ||
        entry.act_performed?.toLowerCase().includes(query) ||
        entry.username?.toLowerCase().includes(query) ||
        entry.user_type?.toLowerCase().includes(query)
      );
    })
    .filter((entry) => {
      const entryDate = new Date(entry.date_performed);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      return (
        (!startDate || entryDate >= startDate) &&
        (!endDate || entryDate <= endDate)
      );
    })
    .filter((entry) => {
      const entryTime = entry.time_performed;
      return (
        (!filters.startTime || entryTime >= filters.startTime) &&
        (!filters.endTime || entryTime <= filters.endTime)
      );
    })
    .filter((entry) => {
      return (
        (!filters.username || entry.username === filters.username) &&
        (!filters.userType || entry.user_type === filters.userType) &&
        (!filters.activityType || entry.activity_type === filters.activityType)
      );
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "date_performed") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((entry) => ({
      "Activity Type": entry.activity_type,
      "Performed Action": entry.act_performed,
      Username: entry.username,
      "User Type": entry.user_type,
      Date: entry.date_performed,
      Time: entry.time_performed,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ActivityReport");

    // Build filename based on filters
    const filenameParts = ["ACTIVITY_REPORT"];
    if (filters.activityType)
      filenameParts.push(`TYPE-${filters.activityType.toUpperCase()}`);
    if (filters.username)
      filenameParts.push(`USER-${filters.username.toUpperCase()}`);
    if (filters.startDate) filenameParts.push(`FROM-${filters.startDate}`);
    if (filters.endDate) filenameParts.push(`TO-${filters.endDate}`);

    const filename = filenameParts.join("_") + ".xlsx";
    XLSX.writeFile(wb, filename);
  };

  const printActivityReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow)
      return alert("Popup blocked. Please allow popups for this site.");

    const tableRows = filteredData
      .map(
        (entry) => `
      <tr>
        <td>${entry.activity_type}</td>
        <td>${entry.act_performed}</td>
        <td>${entry.username}</td>
        <td>${entry.user_type}</td>
        <td>${entry.date_performed}</td>
        <td>${entry.time_performed}</td>
      </tr>`
      )
      .join("");

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

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageSelect = (e) => {
    setCurrentPage(Number(e.target.value));
  };

  // Enhanced back button function - Close page and return to previous page
  const handleGoBack = () => {
    // Close the current page/window
    window.close();

    // If window.close() doesn't work (modern browsers restrict it), try history.back()
    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback: redirect to a default page
        window.location.href = "/dashboard"; // or your desired route
      }
    }, 100);
  };

  // New refresh function
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    // Reset filters
    setFilters({
      search: "",
      username: "",
      userType: "",
      activityType: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    });

    // Reset pagination
    setCurrentPage(1);

    // Reset sorting
    setSortField("date_performed");
    setSortOrder("desc");

    // Optional delay before refreshing (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fetch fresh data
    await fetchActivityReports();

    console.log("Activity report data refreshed");
    setLoading(false);
  };

  return (
    <div className="activity-report-container">
      {/* Back Button Section */}
      <div className="activity-report-back-section">
        <button onClick={handleGoBack} className="activity-report-back-button">
          <span className="activity-report-back-icon">←</span>
          Back
        </button>
      </div>

      <div className="activity-report-content">
        {/* Main Controls Card */}
        <div className="activity-report-glass-card">
          <div className="activity-report-card-header">
            <h2 className="activity-report-card-title">
              📊 Activity Report Management
            </h2>
            <div className="activity-report-action-buttons">
              <button
                onClick={handleRefresh}
                className="activity-report-glass-button activity-report-refresh-button"
                disabled={loading}
              >
                <span className="activity-report-button-icon">🔄</span>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={handleExportExcel}
                className="activity-report-glass-button activity-report-secondary-button"
                disabled={loading}
              >
                <span className="activity-report-button-icon">📊</span>
                Export to Excel
              </button>
              <button
                onClick={printActivityReport}
                className="activity-report-glass-button activity-report-primary-button"
                disabled={loading}
              >
                <span className="activity-report-button-icon">🖨️</span>
                Print Report
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="activity-report-controls-section">
            {/* Sort Controls */}
            <div className="activity-report-filter-group">
              <label className="activity-report-filter-label">
                <span className="activity-report-label-text">📊 Sort By</span>
                <div className="activity-report-sort-controls">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="activity-report-glass-select"
                    disabled={loading}
                  >
                    <option value="date_performed">Date Performed</option>
                    <option value="time_performed">Time Performed</option>
                    <option value="activity_type">Activity Type</option>
                    <option value="username">Username</option>
                    <option value="user_type">User Type</option>
                    <option value="act_performed">Action Performed</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="activity-report-glass-select"
                    disabled={loading}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </label>
            </div>

            {/* Date Range */}
            <div className="activity-report-filter-group">
              <label className="activity-report-filter-label">
                <span className="activity-report-label-text">
                  📅 Date Range
                </span>
                <div className="activity-report-sort-controls">
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="activity-report-glass-input"
                    disabled={loading}
                  />
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="activity-report-glass-input"
                    disabled={loading}
                  />
                </div>
              </label>
            </div>

            {/* Time Range */}
            <div className="activity-report-filter-group">
              <label className="activity-report-filter-label">
                <span className="activity-report-label-text">
                  🕐 Time Range
                </span>
                <div className="activity-report-sort-controls">
                  <input
                    type="time"
                    name="startTime"
                    value={filters.startTime}
                    onChange={handleFilterChange}
                    className="activity-report-glass-input"
                    disabled={loading}
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={filters.endTime}
                    onChange={handleFilterChange}
                    className="activity-report-glass-input"
                    disabled={loading}
                  />
                </div>
              </label>
            </div>

            {/* Search */}
            <div className="activity-report-filter-group activity-report-search-group">
              <label className="activity-report-filter-label">
                <span className="activity-report-label-text">🔍 Search</span>
                <input
                  type="text"
                  name="search"
                  placeholder="Search activities, users, or actions..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="activity-report-glass-input"
                  autoComplete="off"
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="activity-report-error-message">⚠️ {error}</div>
          )}
        </div>

        {/* Table Card */}
        <div className="activity-report-glass-card">
          <div className="activity-report-table-container">
            <table className="activity-report-glass-table">
              <thead>
                <tr>
                  <th>Activity Type</th>
                  <th>Performed Action</th>
                  <th>Username</th>
                  <th>User Type</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
                <tr className="activity-report-filter-row">
                  <th>
                    <select
                      name="activityType"
                      value={filters.activityType}
                      onChange={handleFilterChange}
                      className="activity-report-glass-select activity-report-filter-select"
                      disabled={loading}
                    >
                      <option value="">All Activity Types</option>
                      {uniqueValues.activityTypes.map((type, i) => (
                        <option key={i} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th></th>
                  <th>
                    <select
                      name="username"
                      value={filters.username}
                      onChange={handleFilterChange}
                      className="activity-report-glass-select activity-report-filter-select"
                      disabled={loading}
                    >
                      <option value="">All Usernames</option>
                      {uniqueValues.usernames.map((username, i) => (
                        <option key={i} value={username}>
                          {username}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      name="userType"
                      value={filters.userType}
                      onChange={handleFilterChange}
                      className="activity-report-glass-select activity-report-filter-select"
                      disabled={loading}
                    >
                      <option value="">All User Types</option>
                      {uniqueValues.userTypes.map((type, i) => (
                        <option key={i} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="activity-report-no-data">
                      {loading ? "🔄 Loading..." : "📭 No activity data found."}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((entry, index) => (
                    <tr key={index} className="activity-report-table-row">
                      <td className="activity-report-activity-type-cell">
                        <span className="activity-report-activity-badge">
                          {entry.activity_type}
                        </span>
                      </td>
                      <td className="activity-report-action-cell">
                        <div className="activity-report-action-text">
                          {entry.act_performed}
                        </div>
                      </td>
                      <td className="activity-report-username-cell">
                        <div className="activity-report-user-info">
                          <span className="activity-report-username">
                            {entry.username}
                          </span>
                        </div>
                      </td>
                      <td className="activity-report-user-type-cell">
                        <span className="activity-report-user-type-badge">
                          {entry.user_type}
                        </span>
                      </td>
                      <td className="activity-report-date-cell">
                        <div className="activity-report-date-info">
                          {new Date(entry.date_performed).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </td>
                      <td className="activity-report-time-cell">
                        <div className="activity-report-time-info">
                          {new Date(
                            `1970-01-01T${entry.time_performed}`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="activity-report-pagination-container">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1 || loading}
              className="activity-report-glass-button activity-report-pagination-btn"
            >
              ⬅️ Previous
            </button>

            <div className="activity-report-page-info">
              <span className="activity-report-page-text">Page</span>
              <select
                value={currentPage}
                onChange={handlePageSelect}
                className="activity-report-glass-select activity-report-page-select"
                disabled={loading}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <option key={pageNum} value={pageNum}>
                      {pageNum}
                    </option>
                  )
                )}
              </select>
              <span className="activity-report-page-text">of {totalPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages || loading}
              className="activity-report-glass-button activity-report-pagination-btn"
            >
              Next ➡️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityReportTable;
