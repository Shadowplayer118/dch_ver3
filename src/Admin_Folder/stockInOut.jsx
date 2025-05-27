import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./AdminHeader";

import StockIn_Modal from "./Modals_Folder/StockIn_Modal";
import StockOut_Modal from "./Modals_Folder/StockOut_Modal";





function StockInOutTable() {
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
  const limit = 50;
  const [totalItems, setTotalItems] = useState(0);

  const [isStockInOpen, setIsStockInOpen] = useState(false);
const [isStockOutOpen, setIsStockOutOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);


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
        limit,
        offset,
      }).toString();

      const response = await axios.get(
        `http://localhost/dch_ver3/src/Backend/inventory_load.php?${params}`
      );
      const result = response.data;

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid inventory data format");
      }

      const inventoryData = result.data;
      setInventory(inventoryData);
      setTotalItems(result.total || 0);

      const getUniques = (key) =>
        [...new Set(inventoryData.map((item) => item[key]).filter(Boolean))].sort();

      const areaSet = new Set();
      inventoryData.forEach((item) => {
        if (item.wh_area) areaSet.add(item.wh_area);
        if (item.store_area) areaSet.add(item.store_area);
      });

      const areas = Array.from(areaSet).sort();



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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, inventory]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleEditClick = (item) => {
  setSelectedItem(item);
  setIsEditModalOpen(true);
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

const handleDelete = async (inventory_id) => {
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
        inventory_id,
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



  

  return (
    <div style={{ overflowX: "auto", padding: "1rem" }}>
      <AdminHeader />

 

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

        <StockIn_Modal
            isOpen={isStockInOpen}
            onClose={handleCloseStockIn}
            itemData={selectedItem}
        />

        <StockOut_Modal
            isOpen={isStockOutOpen}
            onClose={handleCloseStockOut}
            itemData={selectedItem}
        />


      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead style={{ backgroundColor: "#f0f0f0" }}>
          <tr>
            <th>Image</th>
            <th>Item Code</th>
            <th>Description</th>
            <th>Brand</th>
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
                <td>
                  <div>
                    {item.desc_1} {item.desc_2}
                  </div>
                  <div>
                    {item.desc_3} {item.desc_4}
                  </div>
                </td>
                <td>{item.brand}</td>
                <td>{item.category}</td>
                <td>
                  <div>WH: {item.wh_units}</div>
                  <div>Store: {item.store_units}</div>
                </td>
                <td>{item.wh_area || item.store_area}</td>
                <td>
                  <div>Fixed: ${item.fixed_price}</div>
                  <div>Retail: ${item.retail_price}</div>
                  <div>TSV: {item.tsv}</div>
                </td>
                <td>
                  <button onClick={() => handleOpenStockIn(item)}>Stock In</button>
                  <br />
                  <button onClick={() => handleOpenStockOut(item)}>Stock Out</button>
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

export default StockInOutTable;
