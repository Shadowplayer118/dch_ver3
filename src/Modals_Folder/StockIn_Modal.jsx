import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StockIn_Modal = ({ isOpen, onClose, itemData }) => {
  const [formData, setFormData] = useState({ ...itemData });
  const [quantity, setQuantity] = useState('');
  const [reqnumber, setReqnumber] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFormData({ ...itemData });
    setQuantity('');
    setReqnumber('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, itemData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedUnits = parseInt(formData.units || 0) + parseInt(quantity || 0);

    const formDataToSend = new FormData();
    formDataToSend.append('item_code', formData.item_code);
    formDataToSend.append('inventory_id', formData.inventory_id);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('requisition_number', reqnumber);
    formDataToSend.append('quantity', quantity);
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
          <p><strong>Current Units:</strong> {formData.units}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={formData.location || ''} readOnly />
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
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Requisition Number</label>
            <input
              type="text"
              value={reqnumber}
              onChange={(e) => setReqnumber(e.target.value)}
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
