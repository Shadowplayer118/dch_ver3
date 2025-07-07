import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./AdminHeader";
import * as XLSX from "xlsx";

import StockIn_Modal from "../Modals_Folder/StockIn_Modal";
import StockOut_Modal from "../Modals_Folder/StockOut_Modal";

function StockInOutTable() {
  const [inventory, setInventory] = useState([]);
  
  // Default filter values
  const defaultFilters = {
    search: "",
    brand: "",
    category: "",
    desc_1: "",
    desc_4: "",
    area: "",
  };
  
  const [filters, setFilters] = useState(defaultFilters);
  const [uniqueValues, setUniqueValues] = useState({
    brand: [],
    category: [],
    desc_1: [],
    desc_4: [],
    area: [],
  });
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [totalItems, setTotalItems] = useState(0);

  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [sortField, setSortField] = useState("item_code");
  const [sortOrder, setSortOrder] = useState("asc");

  const locationOptions = ["ALL", "STORE", "WAREHOUSE"];

  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem("selectedLocation") || "ALL";
  });

  const handleLocationChange = () => {
    const currentIndex = locationOptions.indexOf(selectedLocation);
    const nextIndex = (currentIndex + 1) % locationOptions.length;
    const newLocation = locationOptions[nextIndex];
    setSelectedLocation(newLocation);
    localStorage.setItem("selectedLocation", newLocation);
  };

  const handleOpenStockIn = (item) => {
    setSelectedItem(item);
    setIsStockInOpen(true);
  };

  const handleCloseStockIn = () => {
    setIsStockInOpen(false);
    setSelectedItem(null);
  };

  const handleOpenStockOut = (item) => {
    setSelectedItem(item);
    setIsStockOutOpen(true);
  };

  const handleCloseStockOut = () => {
    setIsStockOutOpen(false);
    setSelectedItem(null);
  };

  const fetchInventory = async () => {
    try {
      const offset = (currentPage - 1) * limit;

      const params = new URLSearchParams({
        ...filters,
        location: selectedLocation,
        limit,
        offset,
        sortField,
        sortOrder,
      }).toString();

      const response = await axios.get(
        `https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/inventory_load.php?${params}`
      );
      const result = response.data;

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid inventory data format");
      }

      setInventory(result.data);
      setTotalItems(result.total || 0);

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load inventory data");
    }
  };

  const fetchUniqueFilters = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.brand) params.append("brand", filters.brand);
      if (filters.category) params.append("category", filters.category);
      if (filters.desc_1) params.append("desc_1", filters.desc_1);
      if (filters.desc_4) params.append("desc_4", filters.desc_4);
      if (filters.area) params.append("area", filters.area);

      const response = await axios.get(
        `https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/fetch_filter.php?${params.toString()}`
      );
      setUniqueValues(response.data);
    } catch (error) {
      console.error("Failed to load filters", error);
    }
  };

  // Improved refresh function that resets everything to default
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Reset all filters and pagination to default
      setFilters(defaultFilters);
      setCurrentPage(1);
      setSortField("item_code");
      setSortOrder("asc");
      setSelectedLocation("ALL");
      localStorage.setItem("selectedLocation", "ALL");
      
      // Clear any selected items
      setSelectedItem(null);
      
      // Fetch fresh data with default parameters
      const params = new URLSearchParams({
        ...defaultFilters,
        location: "ALL",
        limit,
        offset: 0,
        sortField: "item_code",
        sortOrder: "asc",
      }).toString();

      const [inventoryResponse, filtersResponse] = await Promise.all([
        axios.get(`https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/inventory_load.php?${params}`),
        axios.get(`https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/fetch_filter.php`)
      ]);

      const inventoryResult = inventoryResponse.data;
      if (!Array.isArray(inventoryResult.data)) {
        throw new Error("Invalid inventory data format");
      }

      setInventory(inventoryResult.data);
      setTotalItems(inventoryResult.total || 0);
      setUniqueValues(filtersResponse.data);
      
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      // Always set refreshing to false, whether success or error
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // UseEffect for initial load and when dependencies change
  useEffect(() => {
    fetchInventory();
    fetchUniqueFilters();
  }, [filters, currentPage, selectedLocation, sortField, sortOrder, inventory]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const totalPages = Math.ceil(totalItems / limit);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // New handler for page select dropdown
  const handlePageSelect = (e) => {
    setCurrentPage(Number(e.target.value));
  };

  return (
    <div className="inventory-container">
      <AdminHeader />

      <div className="inventory-content">
        {/* Main Controls Card */}
        <div className="glass-card">
          <div className="card-header">
            <h2 className="card-title">📦 Admin Stock In/Out Management</h2>
            <div className="action-buttons">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="glass-button refresh-button"
                title="Refresh inventory data and reset all filters"
              >
                <span className="button-icon">
                  {isRefreshing ? "⏳" : "🔄"}
                </span>
                {isRefreshing ? "Refreshing..." : "Refresh"}
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
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="glass-select"
                  >
                    <option value="item_code">Item Code</option>
                    <option value="brand">Brand</option>
                    <option value="category">Category</option>
                    <option value="desc_1">Item Name</option>
                    <option value="desc_2">Measurement</option>
                    <option value="desc_3">Item Code 1</option>
                    <option value="desc_4">Item Code 2</option>
                    <option value="units">Units</option>
                    <option value="last_updated">Last Updated</option>
                    <option value="inventory_id">Sequence Added</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="glass-select"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
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
                  <span className="button-value">{selectedLocation}</span>
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
                  name="search"
                  placeholder="Search item code or description..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="glass-input"
                  autoComplete="off"
                />
              </label>
            </div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
        </div>

        {/* Table Card */}
        <div className="glass-card">
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Item Code</th>
                  <th>Brand</th>
                  <th>Item Name</th>
                  <th>Measurement</th>
                  <th>Product Codes</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Area</th>
                  <th>Prices</th>
                  <th>Actions</th>
                </tr>
                <tr className="filter-row">
                  <th></th>
                  <th></th>
                  <th>
                    <select
                      name="brand"
                      value={filters.brand}
                      onChange={handleFilterChange}
                      className="glass-select filter-select"
                    >
                      <option value="">All Brands</option>
                      {uniqueValues.brand.map((val, i) => (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      name="desc_1"
                      value={filters.desc_1}
                      onChange={handleFilterChange}
                      className="glass-select filter-select"
                    >
                      <option value="">All Item Names</option>
                      {uniqueValues.desc_1.map((val, i) => (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th></th>
                  <th>
                    <select
                      name="desc_4"
                      value={filters.desc_4}
                      onChange={handleFilterChange}
                      className="glass-select filter-select"
                    >
                      <option value="">All Item Codes</option>
                      {uniqueValues.desc_4.map((val, i) => (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="glass-select filter-select"
                    >
                      <option value="">All Categories</option>
                      {uniqueValues.category.map((val, i) => (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th></th>
                  <th>
                    <select
                      name="area"
                      value={filters.area}
                      onChange={handleFilterChange}
                      className="glass-select filter-select"
                    >
                      <option value="">All Areas</option>
                      {uniqueValues.area.map((val, i) => (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="no-data">
                      📭 No inventory data found.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.inventory_id} className="table-row">
                      <td>
                        <img
                          src={`https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/Images/${
                            item.img || "default_autoparts.png"
                          }`}
                          alt="item"
                          className="item-image"
                        />
                      </td>
                      <td className="item-code">{item.item_code}</td>
                      <td className="brand-cell">
                        <div className="brand-info">{item.brand}</div>
                      </td>
                      <td className="description-cell">
                        <div className="desc-line">{item.desc_1}</div>
                      </td>
                      <td className="description-cell">
                        <div className="desc-line">{item.desc_2}</div>
                      </td>
                      <td className="description-cell">
                        <div className="desc-combined">
                          <div className="desc-line">{item.desc_3}</div>
                          <div className="desc-line">{item.desc_4}</div>
                        </div>
                      </td>
                      <td className="category-cell">
                        <div className="category-info">{item.category}</div>
                      </td>
                      <td className="units-cell">
                        <div className="units-value">{item.units}</div>
                      </td>
                      <td className="location-cell">
                        <div className="location-info">
                          <div className="location-main">{item.location}</div>
                          <div className="area-info">{item.area}</div>
                        </div>
                      </td>
                      <td className="prices-cell">
                        <div className="price-container">
                          <div className="price-row">
                            <span className="price-label">Fixed:</span>
                            <span className="price-value">
                              ₱ {Number(item.fixed_price).toLocaleString()}
                            </span>
                          </div>
                          <div className="price-row">
                            <span className="price-label">Retail:</span>
                            <span className="price-value">
                              ₱ {Number(item.retail_price).toLocaleString()}
                            </span>
                          </div>
                          <div className="price-row">
                            <span className="price-label">TSV:</span>
                            <span className="price-value">
                              ₱ {Number(item.tsv).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons-vertical">
                          <button
                            onClick={() => handleOpenStockIn(item)}
                            className="action-btn edit-btn"
                          >
                            📥 Stock In
                          </button>
                          <button
                            onClick={() => handleOpenStockOut(item)}
                            className="action-btn history-btn"
                          >
                            📤 Stock Out
                          </button>
                        </div>
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

      {/* Modals */}
      <StockIn_Modal
        isOpen={isStockInOpen}
        onClose={handleCloseStockIn}
        itemData={selectedItem}
        onSuccess={handleRefresh}
      />
      <StockOut_Modal
        isOpen={isStockOutOpen}
        onClose={handleCloseStockOut}
        itemData={selectedItem}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

export default StockInOutTable;