import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StockIn_Modal = ({ isOpen, onClose, itemData }) => {
  const [formData, setFormData] = useState({ ...itemData });
  const [location, setLocation] = useState('warehouse');
  const [quantity, setQuantity] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFormData({ ...itemData });
    setQuantity('');
    setLocation('warehouse');
    setTransactionDate(new Date().toISOString().split('T')[0]); // Default to today
  }, [isOpen, itemData]);

  if (!isOpen) return null;

const handleSubmit = async (e) => {
  e.preventDefault();

  const updatedUnits =
    location === 'warehouse'
      ? parseInt(formData.wh_units || 0) + parseInt(quantity)
      : parseInt(formData.store_units || 0) + parseInt(quantity);

  const formDataToSend = new FormData();
  formDataToSend.append('item_code', formData.item_code);
  formDataToSend.append('inventory_id', formData.inventory_id);
  formDataToSend.append('location', location);
  formDataToSend.append('quantity', quantity); // No need to parseInt here, PHP will read it as string anyway
  formDataToSend.append('updated_units', updatedUnits);
  formDataToSend.append('transaction_date', transactionDate);
  formDataToSend.append('username', localStorage.getItem('username'));
  formDataToSend.append('user_type', localStorage.getItem('user_type'));

  try {
    const response = await axios.post(
      'http://localhost/dch_ver3/src/Backend/stock_in.php',
      formDataToSend,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log('Stock-in success:', response.data);
    onClose();
  } catch (err) {
    console.error('Failed to stock in item:', err.response?.data || err);
  }
};


  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Stock In Item</h2>
        <div className="item-details">
          <p><strong>Item Code:</strong> {formData.item_code}</p>
          <p><strong>Name:</strong> {formData.desc_1}</p>
          <p><strong>Brand:</strong> {formData.brand}</p>
          <p><strong>Category:</strong> {formData.category}</p>
          <p><strong>Current Warehouse Units:</strong> {formData.wh_units}</p>
          <p><strong>Current Store Units:</strong> {formData.store_units}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="warehouse">Warehouse</option>
              <option value="store">Store</option>
            </select>
          </div>

          <div className="form-group">
            <label>Quantity to Stock In</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Transaction</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="submit">Confirm</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockIn_Modal;
