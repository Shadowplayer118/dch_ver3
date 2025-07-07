import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditInventory_Modal = ({ isOpen, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    original_item_code: initialData.item_code,
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(
    initialData.img
      ? `https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/Images/${initialData.img}`
      : 'https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/Images/default_autoparts.png'
  );

  const [options, setOptions] = useState({
    brand: [],
    category: [],
    area: [],
  });

  const originalCategory = initialData.category;
  const originalBrand = initialData.brand;
  const originalItemCode = initialData.item_code;

  const generateItemCode = async (brand, category) => {
    if (!category) return;

    const catPart = category.substring(0, 3).toUpperCase();
    const brandPart = brand
      ? brand.substring(0, 3).toUpperCase().replace(/\s/g, '').replace(/[^A-Z0-9]/gi, '')
      : '';
    const prefix = `${catPart}${brandPart}`;

    try {
      const res = await axios.get(
        `https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/check_item_code.php?prefix=${prefix}`
      );
      const lastCode = res.data;

      let newIncrement = '0001';
      if (lastCode && lastCode.startsWith(prefix)) {
        const numericPart = lastCode.slice(prefix.length);
        const lastNumber = parseInt(numericPart, 10);
        if (!isNaN(lastNumber)) {
          newIncrement = (lastNumber + 1).toString().padStart(4, '0');
        }
      }

      const newItemCode = prefix + newIncrement;
      setFormData((prev) => ({ ...prev, item_code: newItemCode }));
    } catch (err) {
      console.error('Failed to generate item_code:', err);
    }
  };

  useEffect(() => {
    if (!formData.category) return;

    const hasCategoryChanged = formData.category !== originalCategory;
    const hasBrandChanged = formData.brand !== originalBrand;

    if (hasCategoryChanged || hasBrandChanged) {
      generateItemCode(formData.brand, formData.category);
    } else {
      setFormData((prev) => ({ ...prev, item_code: originalItemCode }));
    }
  }, [formData.category, formData.brand]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      try {
        const res = await axios.get('https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/fetch_options.php');
        setOptions(res.data);
      } catch (err) {
        console.error('Failed to fetch options:', err);
      }
    };

    fetchOptions();
  }, [isOpen]);

  useEffect(() => {
    setFormData({
      ...initialData,
      original_item_code: initialData.item_code,
    });

    setPreviewImage(
      initialData.img
        ? `https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/Images/${initialData.img}`
        : 'https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/Images/default_autoparts.png'
    );
  }, [initialData]);

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

      const username = localStorage.getItem('username');
      const user_type = localStorage.getItem('user_type');
      if (username) data.append('username', username);
      if (user_type) data.append('user_type', user_type);

      if (imageFile) {
        data.append('img', imageFile);
      }

      await axios.post('https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/edit_inventory.php', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  return (
    <div className="editinv-modal-backdrop">
      <div className="editinv-modal-content">
        <h2 className="editinv-title">Edit Item</h2>

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="editinv-form">
          {/* Left Side - Image Section */}
          <div className="editinv-image-section">
            <div className="editinv-group">
              <label>Item Image</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                autoComplete="off" 
                className="editinv-file-input" 
              />
            </div>
            <div className="editinv-image-preview">
              <img src={previewImage} alt="Preview" className="editinv-preview-img" />
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="editinv-fields-section">
            <div className="editinv-group">
              <label className="editinv-label">Item Code</label>
              <input type="text" name="item_code" value={formData.item_code} readOnly className="editinv-input" />
            </div>

            {/* Description 1 and 2 in same row */}
            <div className="editinv-row">
              <div className="editinv-group">
                <label>Description 1 (Name)</label>
                <input type="text" name="desc_1" value={formData.desc_1 || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
              </div>
              <div className="editinv-group">
                <label>Description 2 (Measurement)</label>
                <input type="text" name="desc_2" value={formData.desc_2 || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
              </div>
            </div>

            {/* Description 3 and 4 in same row */}
            <div className="editinv-row">
              <div className="editinv-group">
                <label>Description 3 (Item Code)</label>
                <input type="text" name="desc_3" value={formData.desc_3 || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
              </div>
              <div className="editinv-group">
                <label>Description 4 (Other Details)</label>
                <input type="text" name="desc_4" value={formData.desc_4 || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
              </div>
            </div>

            {/* Brand, Category, and Units in same row */}
            <div className="editinv-row editinv-row-triple">
              <div className="editinv-group">
                <label>Brand</label>
                <input type="text" name="brand" list="brand-list" value={formData.brand || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
                <datalist id="brand-list">
                  {options.brand.map((item, idx) => <option key={idx} value={item} />)}
                </datalist>
              </div>
              <div className="editinv-group">
                <label>Category</label>
                <input type="text" name="category" list="category-list" value={formData.category || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
                <datalist id="category-list">
                  {options.category.map((item, idx) => <option key={idx} value={item} />)}
                </datalist>
              </div>
              <div className="editinv-group">
                <label>Store Units</label>
                <input type="number" name="units" value={formData.units || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
              </div>
            </div>

            {/* Fixed Price and Retail Price in same row */}
            <div className="editinv-row">
              <div className="editinv-group">
                <label>Fixed Price</label>
                <input type="number" name="fixed_price" value={formData.fixed_price || ''} onChange={handleChange} step="0.01" autoComplete="off" className="editinv-input" />
              </div>
              <div className="editinv-group">
                <label>Retail Price</label>
                <input type="number" name="retail_price" value={formData.retail_price || ''} onChange={handleChange} step="0.01" autoComplete="off" className="editinv-input" />
              </div>
            </div>

            {/* Location, Store Area, and Threshold in same row */}
            <div className="editinv-row editinv-row-triple">
              <div className="editinv-group">
                <label>Location</label>
                <input type="text" name="location" value={formData.location} readOnly className="editinv-input" />
              </div>
              <div className="editinv-group">
                <label>Store Area</label>
                <input
                  type="text"
                  name="area"
                  list="store-area-list"
                  value={formData.area || ''}
                  onChange={handleChange}
                  disabled={!formData.location}
                  autoComplete="off"
                  className="editinv-input"
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
              <div className="editinv-group">
                <label>Thresh Hold</label>
                <input type="number" name="thresh_hold" value={formData.thresh_hold || ''} onChange={handleChange} autoComplete="off" className="editinv-input" />
              </div>
            </div>
          </div>
        </form>

        <div className="editinv-actions">
          <button type="button" onClick={onClose} className="editinv-cancel-btn">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="editinv-submit-btn">Update</button>
        </div>
      </div>
    </div>
  );
};

export default EditInventory_Modal;