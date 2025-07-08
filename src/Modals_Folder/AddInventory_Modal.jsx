import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddInventory_Modal = ({ isOpen, onClose }) => {
  const username = localStorage.getItem("username");
  const user_type = localStorage.getItem("user_type");
  const isLocationLocked = user_type === 'staff-wh' || user_type === 'staff-store';
  const lockedLocation = user_type === 'staff-wh' ? 'WAREHOUSE' :
    user_type === 'staff-store' ? 'STORE' : '';

  const [formData, setFormData] = useState({
    item_code: '',
    brand: '',
    category: '',
    desc_1: '',
    desc_2: '',
    desc_3: '',
    desc_4: '',
    retail_price: '',
    fixed_price: '',
    units: '',
    area: '',
    thresh_hold: '',
    location: lockedLocation,
    username: username,
    user_type: user_type,
  });

  const [imageFile, setImageFile] = useState(null);
  const [options, setOptions] = useState({
    brand: [],
    category: [],
    area: []
  });

  const [previewImage, setPreviewImage] = useState('http://localhost/dch_ver3/src/Backend/Images/default_autoparts.png');

  useEffect(() => {
    if (!isOpen) return;
    const fetchOptions = async () => {
      try {
        const res = await axios.get('http://localhost/dch_ver3/src/Backend/fetch_options.php');
        setOptions(res.data);
      } catch (err) {
        console.error('Failed to fetch options:', err);
      }
    };
    fetchOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const generateItemCode = async () => {
      const { brand, category } = formData;

      if (!category) {
        setFormData(prev => ({ ...prev, item_code: '' }));
        return;
      }

      const catPart = category.substring(0, 3).toUpperCase();
      const brandPart = brand
        ? brand.substring(0, 3).toUpperCase().replace(/\s/g, '').replace(/[^A-Z0-9]/gi, '')
        : '';
      const prefix = `${catPart}${brandPart}`;

      try {
        const res = await axios.get(`http://localhost/dch_ver3/src/Backend/check_item_code.php?prefix=${prefix}`);
        const lastCode = res.data;

        let newIncrement = "0001";
        if (lastCode && lastCode.startsWith(prefix)) {
          const numericPart = lastCode.slice(prefix.length);
          const lastNumber = parseInt(numericPart, 10);
          if (!isNaN(lastNumber)) {
            newIncrement = (lastNumber + 1).toString().padStart(4, '0');
          }
        }

        const newItemCode = prefix + newIncrement;
        setFormData(prev => ({ ...prev, item_code: newItemCode }));
      } catch (err) {
        console.error('Failed to generate item code:', err);
      }
    };

    generateItemCode();
  }, [formData.brand, formData.category, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (imageFile) {
        data.append('img', imageFile);
      }

      await axios.post('http://localhost/dch_ver3/src/Backend/add_inventory.php', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData({
        item_code: '',
        brand: '',
        category: '',
        desc_1: '',
        desc_2: '',
        desc_3: '',
        desc_4: '',
        retail_price: '',
        fixed_price: '',
        units: '',
        area: '',
        thresh_hold: '',
        location: lockedLocation,
        username: username,
        user_type: user_type,
      });

      setImageFile(null);
      setPreviewImage('http://localhost/dch_ver3/src/Backend/Images/default_autoparts.png');
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  return (
    <div className="addinv-modal-backdrop">
      <div className="addinv-modal-content">
        <h2 className="addinv-title">Add Item</h2>

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="addinv-form">
          {/* Left Side - Image Section */}
          <div className="addinv-image-section">
            <div className="addinv-group">
              <label>Item Image</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                autoComplete="off" 
                className="addinv-file-input" 
              />
            </div>
            <div className="addinv-image-preview">
              <img src={previewImage} alt="Preview" className="addinv-preview-img" />
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="addinv-fields-section">
            <div className="addinv-group">
              <label className="addinv-label">Item Code</label>
              <input type="text" name="item_code" value={formData.item_code} readOnly className="addinv-input" />
            </div>

            {/* Description 1 and 2 in same row */}
            <div className="addinv-row">
              <div className="addinv-group">
                <label>Description 1 (Name)</label>
                <input type="text" name="desc_1" value={formData.desc_1} onChange={handleChange} autoComplete="off" className="addinv-input" />
              </div>
              <div className="addinv-group">
                <label>Description 2 (Measurement)</label>
                <input type="text" name="desc_2" value={formData.desc_2} onChange={handleChange} autoComplete="off" className="addinv-input" />
              </div>
            </div>

            {/* Description 3 and 4 in same row */}
            <div className="addinv-row">
              <div className="addinv-group">
                <label>Description 3 (Item Code)</label>
                <input type="text" name="desc_3" value={formData.desc_3} onChange={handleChange} autoComplete="off" className="addinv-input" />
              </div>
              <div className="addinv-group">
                <label>Description 4 (Other Details)</label>
                <input type="text" name="desc_4" value={formData.desc_4} onChange={handleChange} autoComplete="off" className="addinv-input" />
              </div>
            </div>

            {/* Brand, Category, and Units in same row */}
            <div className="addinv-row addinv-row-triple">
              <div className="addinv-group">
                <label>Brand</label>
                <input type="text" name="brand" list="brand-list" value={formData.brand} onChange={handleChange} autoComplete="off" className="addinv-input" />
                <datalist id="brand-list">
                  {options.brand.map((item, idx) => <option key={idx} value={item} />)}
                </datalist>
              </div>
              <div className="addinv-group">
                <label>Category</label>
                <input type="text" name="category" list="category-list" value={formData.category} onChange={handleChange} autoComplete="off" required className="addinv-input" />
                <datalist id="category-list">
                  {options.category.map((item, idx) => <option key={idx} value={item} />)}
                </datalist>
              </div>
              <div className="addinv-group">
                <label>Store Units</label>
                <input type="number" name="units" value={formData.units} onChange={handleChange} autoComplete="off" className="addinv-input" />
              </div>
            </div>

            {/* Fixed Price and Retail Price in same row */}
            <div className="addinv-row">
              <div className="addinv-group">
                <label>Fixed Price</label>
                <input type="number" name="fixed_price" value={formData.fixed_price} onChange={handleChange} step="0.01" autoComplete="off" className="addinv-input" />
              </div>
              <div className="addinv-group">
                <label>Retail Price</label>
                <input type="number" name="retail_price" value={formData.retail_price} onChange={handleChange} step="0.01" autoComplete="off" className="addinv-input" />
              </div>
            </div>

            {/* Location, Store Area, and Threshold in same row */}
            <div className="addinv-row addinv-row-triple">
              <div className="addinv-group">
                <label>Location</label>
                <select name="location" value={formData.location} onChange={handleChange} required disabled={isLocationLocked} className="addinv-input">
                  {!isLocationLocked && <option value="">SELECT LOCATION</option>}
                  <option value="STORE">STORE</option>
                  <option value="WAREHOUSE">WAREHOUSE</option>
                </select>
              </div>
              <div className="addinv-group">
                <label>Store Area</label>
                <input
                  type="text"
                  name="area"
                  list="store-area-list"
                  value={formData.area}
                  onChange={handleChange}
                  disabled={!formData.location}
                  autoComplete="off"
                  className="addinv-input"
                />
                <datalist id="store-area-list">
                  {options.area
                    .filter(area =>
                      formData.location === "STORE"
                        ? area.toUpperCase().includes("STORE")
                        : formData.location === "WAREHOUSE"
                          ? !area.toUpperCase().includes("STORE")
                          : false
                    )
                    .map((item, idx) => <option key={idx} value={item} />)}
                </datalist>
              </div>
              <div className="addinv-group">
                <label>Thresh Hold</label>
                <input type="number" name="thresh_hold" value={formData.thresh_hold} onChange={handleChange} autoComplete="off" className="addinv-input" />
              </div>
            </div>
          </div>
        </form>

        <div className="addinv-actions">
          <button type="button" onClick={onClose} className="addinv-cancel-btn">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="addinv-submit-btn">Add</button>
        </div>
      </div>
    </div>
  );
};

export default AddInventory_Modal;