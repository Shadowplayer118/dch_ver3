import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StockOut_Modal = ({ isOpen, onClose, itemData }) => {
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

    const qty = parseInt(quantity || 0);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const currentUnits = formData.location === 'warehouse'
      ? parseInt(formData.units || 0)
      : parseInt(formData.units || 0);

    const updatedUnits = currentUnits - qty;

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
        'http://localhost/dch_ver3/src/Backend/stock_out.php',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('Stock-out success:', response.data);
      alert("Stock-out successful.");
      onClose();
    } catch (err) {
      console.error('Failed to stock out item:', err.response?.data || err);
      alert("Failed to stock out. Please try again.");
    }
  };

  return (
    <div className="stockout-modal-backdrop">
      <div className="stockout-modal-content">
        <h2 className="stockout-title">Stock Out Item</h2>

        <form onSubmit={handleSubmit} className="stockout-form">
          {/* Left Side - Item Image Section */}
          <div className="stockout-image-section">
            <div className="stockout-group">
              <label>Item Image</label>
            </div>
            <div className="stockout-image-preview">
              <img 
                src={formData.image_path || 'http://localhost/dch_ver3/src/Backend/Images/default_autoparts.png'} 
                alt="Item Preview" 
                className="stockout-preview-img" 
              />
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="stockout-fields-section">
            {/* Item Code */}
            <div className="stockout-group">
              <label className="stockout-label">Item Code</label>
              <input 
                type="text" 
                value={formData.item_code || ''} 
                readOnly 
                className="stockout-input" 
              />
            </div>

            {/* Item Name and Brand in same row */}
            <div className="stockout-row">
              <div className="stockout-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  value={formData.desc_1 || ''} 
                  readOnly 
                  className="stockout-input" 
                />
              </div>
              <div className="stockout-group">
                <label>Brand</label>
                <input 
                  type="text" 
                  value={formData.brand || ''} 
                  readOnly 
                  className="stockout-input" 
                />
              </div>
            </div>

            {/* Category and Current Units in same row */}
            <div className="stockout-row">
              <div className="stockout-group">
                <label>Category</label>
                <input 
                  type="text" 
                  value={formData.category || ''} 
                  readOnly 
                  className="stockout-input" 
                />
              </div>
              <div className="stockout-group">
                <label>Current Units</label>
                <input 
                  type="text" 
                  value={formData.location === 'warehouse' ? formData.units || '0' : formData.units || '0'} 
                  readOnly 
                  className="stockout-input" 
                />
              </div>
            </div>

            {/* Location */}
            <div className="stockout-group">
              <label>Location</label>
              <input 
                type="text" 
                value={formData.location || ''} 
                readOnly 
                className="stockout-input" 
              />
            </div>

            {/* Quantity to Stock Out and Date in same row */}
            <div className="stockout-row">
              <div className="stockout-group">
                <label>Quantity to Stock Out</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  autoComplete="off"
                  className="stockout-input"
                />
              </div>
              <div className="stockout-group">
                <label>Date of Transaction</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="stockout-input"
                />
              </div>
            </div>

            {/* Requisition Number */}
            <div className="stockout-group">
              <label>Requisition Number</label>
              <input
                type="text"
                value={reqnumber}
                onChange={(e) => setReqnumber(e.target.value)}
                autoComplete="off"
                className="stockout-input"
              />
            </div>

            {/* New Units After Stock Out (calculated display) */}
            <div className="stockout-group">
              <label>New Units After Stock Out</label>
              <input
                type="text"
                value={quantity ? 
                  (parseInt(formData.location === 'warehouse' ? formData.units || 0 : formData.units || 0) - parseInt(quantity)).toString() 
                  : (formData.location === 'warehouse' ? formData.units || '0' : formData.units || '0')
                }
                readOnly
                className="stockout-input"
              />
            </div>
          </div>
        </form>

        <div className="stockout-actions">
          <button type="button" onClick={onClose} className="stockout-cancel-btn">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="stockout-submit-btn">Confirm Stock Out</button>
        </div>
      </div>
    </div>
  );
};

export default StockOut_Modal;