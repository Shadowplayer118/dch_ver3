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
    <div className="stockin-modal-backdrop">
      <div className="stockin-modal-content">
        <h2 className="stockin-title">Stock In Item</h2>

        <form onSubmit={handleSubmit} className="stockin-form">
          {/* Left Side - Item Image Section */}
          <div className="stockin-image-section">
            <div className="stockin-group">
              <label>Item Image</label>
            </div>
            <div className="stockin-image-preview">
              <img 
                src={formData.image_path || 'http://localhost/dch_ver3/src/Backend/Images/default_autoparts.png'} 
                alt="Item Preview" 
                className="stockin-preview-img" 
              />
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="stockin-fields-section">
            {/* Item Code */}
            <div className="stockin-group">
              <label className="stockin-label">Item Code</label>
              <input 
                type="text" 
                value={formData.item_code || ''} 
                readOnly 
                className="stockin-input" 
              />
            </div>

            {/* Item Name and Brand in same row */}
            <div className="stockin-row">
              <div className="stockin-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  value={formData.desc_1 || ''} 
                  readOnly 
                  className="stockin-input" 
                />
              </div>
              <div className="stockin-group">
                <label>Brand</label>
                <input 
                  type="text" 
                  value={formData.brand || ''} 
                  readOnly 
                  className="stockin-input" 
                />
              </div>
            </div>

            {/* Category and Current Units in same row */}
            <div className="stockin-row">
              <div className="stockin-group">
                <label>Category</label>
                <input 
                  type="text" 
                  value={formData.category || ''} 
                  readOnly 
                  className="stockin-input" 
                />
              </div>
              <div className="stockin-group">
                <label>Current Units</label>
                <input 
                  type="text" 
                  value={formData.units || '0'} 
                  readOnly 
                  className="stockin-input" 
                />
              </div>
            </div>

            {/* Location */}
            <div className="stockin-group">
              <label>Location</label>
              <input 
                type="text" 
                value={formData.location || ''} 
                readOnly 
                className="stockin-input" 
              />
            </div>

            {/* Quantity to Stock In and Date in same row */}
            <div className="stockin-row">
              <div className="stockin-group">
                <label>Quantity to Stock In</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  autoComplete="off"
                  className="stockin-input"
                />
              </div>
              <div className="stockin-group">
                <label>Date of Transaction</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="stockin-input"
                />
              </div>
            </div>

            {/* Requisition Number */}
            <div className="stockin-group">
              <label>Requisition Number</label>
              <input
                type="text"
                value={reqnumber}
                onChange={(e) => setReqnumber(e.target.value)}
                autoComplete="off"
                className="stockin-input"
              />
            </div>

            {/* New Units After Stock In (calculated display) */}
            <div className="stockin-group">
              <label>New Units After Stock In</label>
              <input
                type="text"
                value={quantity ? (parseInt(formData.units || 0) + parseInt(quantity)).toString() : formData.units || '0'}
                readOnly
                className="stockin-input"
              />
            </div>
          </div>
        </form>

        <div className="stockin-actions">
          <button type="button" onClick={onClose} className="stockin-cancel-btn">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="stockin-submit-btn">Confirm Stock In</button>
        </div>
      </div>
    </div>
  );
};

export default StockIn_Modal;