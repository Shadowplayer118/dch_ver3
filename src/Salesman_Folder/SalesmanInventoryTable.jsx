import React, { useEffect, useState } from "react";
import axios from "axios";
import SalesHeader from "./SalesmanHeader";
import * as XLSX from 'xlsx';

import AddInventory_Modal from "../Modals_Folder/AddInventory_Modal";
import EditInventory_Modal from "../Modals_Folder/EditInventory_Modal";
import StockHistory_Modal from "../Modals_Folder/StockHistory_Modal";

function SalesmanInventoryTable() {
  const [inventory, setInventory] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    brand: "",
    category: "",
    desc_1: "",
    desc_4: "",
    area: "",
  });
  const [uniqueValues, setUniqueValues] = useState({
    brand: [],  
    category: [],
    desc_1: [],
    desc_4: [],
    area: [],
  });
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [totalItems, setTotalItems] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const [sortField, setSortField] = useState("item_code");
  const [sortOrder, setSortOrder] = useState("asc");

  const locationOptions = ["ALL", "STORE", "WAREHOUSE"];

  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem("selectedLocation") || "STORE";
  });

  const handleLocationChange = () => {
    const currentIndex = locationOptions.indexOf(selectedLocation);
    const nextIndex = (currentIndex + 1) % locationOptions.length;
    const newLocation = locationOptions[nextIndex];
    setSelectedLocation(newLocation);
    localStorage.setItem("selectedLocation", newLocation);
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
        `http://localhost/dch_ver3/src/Backend/inventory_load.php?${params}`
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

      const response = await axios.get(`http://localhost/dch_ver3/src/Backend/fetch_filter.php?${params.toString()}`);
      setUniqueValues(response.data);
    } catch (error) {
      console.error("Failed to load filters", error);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchUniqueFilters();
  }, [filters, currentPage, selectedLocation, sortField, sortOrder, inventory]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (item) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
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

  const handleDelete = async (item_code) => {
    const username = localStorage.getItem("username");
    const user_type = localStorage.getItem("user_type");

    if (!username || !user_type) {
      alert("User info missing. Please login again.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost/dch_ver3/src/Backend/delete_inventory.php',
        {
          item_code,
          username,
          user_type
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert("Item deleted successfully.");
      } else {
        alert("Failed to delete item: " + response.data.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the item.");
    }
  };

  const handleExportFilteredToExcel = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        location: selectedLocation,
        sortField,
        sortOrder,
        limit: 99999,
        offset: 0
      });

      const response = await axios.get(
        `http://localhost/dch_ver3/src/Backend/inventory_load.php?${params.toString()}`
      );

      const allFiltered = response.data.data;

      const exportData = allFiltered.map(item => ({
        'Units': '',
        'Item Code': item.item_code,
         Category: item.category,
        'Description 1': item.desc_1,
        'Description 2': item.desc_2,
        'Description 3': item.desc_3,
        'Description 4': item.desc_4,
        Brand: item.brand,
        Location: item.location
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'FilteredInventory');

      // Build filename based on filters
      const filenameParts = ['IP'];
      if (filters.category) filenameParts.push(`CAT-${filters.category.toUpperCase()}`);
      if (filters.brand) filenameParts.push(`BRAND-${filters.brand.toUpperCase()}`);
      if (filters.desc_1) filenameParts.push(`DESC1-${filters.desc_1.toUpperCase()}`);
      if (filters.area) filenameParts.push(`AREA-${filters.area.toUpperCase()}`);

      const filename = filenameParts.join('_') + '.xlsx';

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Failed to export full data:", error);
      alert("Failed to export. Try again.");
    }
  };

  return (
    <div className="inventory-container">
      <SalesHeader />

      <div className="inventory-content">
        {/* Main Controls Card */}
        <div className="glass-card">
          <div className="card-header">
            <h2 className="card-title">📦 Salesman Inventory Management</h2>
            <div className="action-buttons">
              <button
                onClick={handleExportFilteredToExcel}
                className="glass-button secondary-button"
              >
                <span className="button-icon">📊</span>
                Export to Excel
              </button>
              {/* Uncomment if salesmen should be able to add items */}
              {/* <button
                onClick={() => setIsAddOpen(true)}
                className="glass-button primary-button"
              >
                <span className="button-icon">➕</span>
                Add New Item
              </button> */}
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
                    <option value="desc_1">Description 1</option>
                    <option value="desc_2">Description 2</option>
                    <option value="desc_3">Description 3</option>
                    <option value="desc_4">Description 4</option>
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
                  <th>Description</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Area</th>
                  <th>Prices</th>
                  {/* Uncomment if salesmen should have action buttons */}
                  {/* <th>Actions</th> */}
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
                      <option value="">All Desc 1</option>
                      {uniqueValues.desc_1.map((val, i) => (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                    <br />
                    <select
                      name="desc_4"
                      value={filters.desc_4}
                      onChange={handleFilterChange}
                      className="glass-select filter-select"
                      style={{ marginTop: "0.5rem" }}
                    >
                      <option value="">All Desc 4</option>
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
                  {/* Uncomment if salesmen should have action buttons */}
                  {/* <th></th> */}
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      📭 No inventory data found.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.inventory_id} className="table-row">
                      <td>
                        <img
                          src={`http://localhost/dch_ver3/src/Backend/Images/${
                            item.img || "default_autoparts.png"
                          }`}
                          alt="item"
                          className="item-image"
                        />
                      </td>
                      <td className="item-code">{item.item_code}</td>
                      <td>{item.brand}</td>
                      <td className="description-cell">
                        <div className="desc-line">
                          {item.desc_1} {item.desc_2}
                        </div>
                        <div className="desc-line">
                          {item.desc_3} {item.desc_4}
                        </div>
                      </td>
                      <td>{item.category}</td>
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
                      </td>
                      {/* Uncomment if salesmen should have action buttons */}
                      {/* <td className="actions-cell">
                        <div className="action-buttons-vertical">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="action-btn edit-btn"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleViewHistory(item)}
                            className="action-btn history-btn"
                          >
                            📈 History
                          </button>
                          <button
                            onClick={() => handleDelete(item.item_code)}
                            className="action-btn delete-btn"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td> */}
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
      <AddInventory_Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {isEditModalOpen && selectedItem && (
        <EditInventory_Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={selectedItem}
        />
      )}

      <StockHistory_Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        itemData={selectedItem}
      />
    </div>
  );
}

export default SalesmanInventoryTable;