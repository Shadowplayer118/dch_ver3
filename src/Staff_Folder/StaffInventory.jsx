import React, { useEffect, useState } from "react";
import axios from "axios";
import StaffHeader from "./StaffHeader";
import * as XLSX from 'xlsx';

import AddInventory_Modal from "../Modals_Folder/AddInventory_Modal";
import EditInventory_Modal from "../Modals_Folder/EditInventory_Modal";
import StockHistory_Modal from "../Modals_Folder/StockHistory_Modal";


function StaffInventoryTable() {
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

  const userType = localStorage.getItem('user_type');

  const canEditOrDelete = (location) => {
  if (userType === 'admin') return true;
  if (userType === 'staff-wh' && location === 'WAREHOUSE') return true;
  if (userType === 'staff-store' && location === 'STORE') return true;
  return false;
};

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


const fetchInventory = async () => {
  try {
    const offset = (currentPage - 1) * limit;

const params = new URLSearchParams({
  ...filters,
  location: selectedLocation, // ✅ Pass it here!
  limit,
  offset,
  sortField,   // ✅ Add sorting field
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
    <div style={{ overflowX: "auto", padding: "1rem" }}>
      <StaffHeader />

      <button
        onClick={handleExportFilteredToExcel}
        className="btn btn-success"
        style={{ marginTop: "1rem", marginBottom: "1rem" }}
        >
        Export Filtered to Excel
      </button>

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
  <label>Sort by:</label>
  <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
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

  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
    <option value="asc">Asc</option>
    <option value="desc">Desc</option>
  </select>
</div>

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <button onClick={handleLocationChange} className="btn btn-secondary">
          Location: {selectedLocation} (Click to cycle)
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="text"
        name="search"
        placeholder="Search item code or description..."
        value={filters.search}
        onChange={handleFilterChange}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
        autoComplete="off"
      />

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


      <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
      + Add New
      </button>

      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead style={{ backgroundColor: "#f0f0f0" }}>
          <tr>
            <th>Image</th>
            <th>Item Code</th>
            <th>Brand</th>
            <th>Description</th>
            <th>Category</th>
            <th>Units</th>
            <th>Area</th>
            <th>Prices</th>
            <th>Actions</th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th>
              <select
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
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
              <td colSpan="9" style={{ textAlign: "center" }}>
                No inventory data found.
              </td>
            </tr>
          ) : (
            inventory.map((item) => (
              <tr key={item.inventory_id}>
                <td>
                  <img
                    src={`http://localhost/dch_ver3/src/Backend/Images/${item.img || "default_autoparts.png"}`}
                    alt="item"
                    style={{ width: "50px", height: "50px", objectFit: "cover" }}
                  />
                </td>
                <td>{item.item_code}</td>
                <td>{item.brand}</td>
                <td>
                  <div>
                    {item.desc_1} {item.desc_2}
                  </div>
                  <div>
                    {item.desc_3} {item.desc_4}
                  </div>
                </td>

                <td>{item.category}</td>
                <td>
                  <div>{item.units}</div>
 
                </td>
                <td>
                  <div>{item.location}</div>
                  <div>{item.area}</div>
                </td>
                <td>
                  <div>Fixed: ${item.fixed_price}</div>
                  <div>Retail: ${item.retail_price}</div>
                  <div>TSV: {item.tsv}</div>
                </td>
                <td>

                  
                                {canEditOrDelete(item.location) ? (
                <>
                  <button onClick={() => handleEditClick(item)} className="edit-btn">Edit</button>
                  <br />
                  <button onClick={() => handleViewHistory(item)}>History</button>
                  <br />
                  <button onClick={() => handleDelete(item.item_code)}>Delete</button>
                </>
              ) : (
                <>
                  <button disabled className="edit-btn" style={{ opacity: 0.5 }}>Edit</button>
                  <br />
                  <button onClick={() => handleViewHistory(item)}>History</button>
                  <br />
                  <button disabled style={{ opacity: 0.5 }}>Delete</button>
                </>
              )}


                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div
        style={{
          marginTop: "1rem",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button onClick={goToPreviousPage} disabled={currentPage === 1}>
          &laquo; Previous
        </button>

        <span>
          Page{" "}
          <select
            value={currentPage}
            onChange={handlePageSelect}
            style={{ fontSize: "1rem" }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <option key={pageNum} value={pageNum}>
                {pageNum}
              </option>
            ))}
          </select>{" "}
          of {totalPages}
        </span>

        <button onClick={goToNextPage} disabled={currentPage === totalPages}>
          Next &raquo;
        </button>
      </div>
    </div>
  );
}

export default StaffInventoryTable;
