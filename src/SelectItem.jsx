import React, { useEffect, useState } from "react";
import axios from "axios";
// import AdminHeader from "./AdminHeader";

function SelectItem({ onItemSelect }) {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get(
          `https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/inventory_load.php?search=${search}`
        );
        setInventory(response.data.data || []);
      } catch (err) {
        console.error("Error loading inventory:", err);
        setError("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [search]);

  const handleSelect = (item) => {
    if (onItemSelect) onItemSelect(item);
    alert(`✅ Selected: ${item.item_code}`);
  };

  return (
    <div className="inventory-container">
      {/* <AdminHeader /> */}
      <div className="inventory-content">
        <div className="glass-card">
          <div className="card-header">
            <h2 className="card-title">📦 Select Item to Add</h2>
            <input
              type="text"
              placeholder="Search item code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input mt-2"
            />
          </div>

          {loading ? (
            <p className="loading-text">⏳ Loading items...</p>
          ) : error ? (
            <p className="error-message">❌ {error}</p>
          ) : (
            <div className="table-container mt-3">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th>Brand</th>
                    <th>Units</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.item_code}>
                      <td>{item.item_code}</td>
                      <td>{`${item.desc_1} ${item.desc_2} ${item.desc_3}`}</td>
                      <td>{item.brand}</td>
                      <td>{item.units}</td>
                      <td>
                        <button
                          className="glass-button glass-button-sm"
                          onClick={() => handleSelect(item)}
                        >
                          ➕ Select
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">
                        📭 No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SelectItem;
