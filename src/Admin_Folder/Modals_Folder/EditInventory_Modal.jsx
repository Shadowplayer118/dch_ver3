import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditInventory_Modal = ({ isOpen, onClose, initialData }) => {
  const [formData, setFormData] = useState({ ...initialData });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(
    initialData.img
      ? `http://localhost/dch_ver3/src/Backend/Images/${initialData.img}`
      : 'http://localhost/dch_ver3/src/Backend/Images/default_autoparts.png'
  );

  const [options, setOptions] = useState({
    brand: [],
    category: [],
    wh_area: [],
    store_area: []
  });

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
    setFormData({ ...initialData });
    setPreviewImage(
      initialData.img
        ? `http://localhost/dch_ver3/src/Backend/Images/${initialData.img}`
        : 'http://localhost/dch_ver3/src/Backend/Images/default_autoparts.png'
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

      // Add username and user_type from localStorage
      const username = localStorage.getItem("username");
      const user_type = localStorage.getItem("user_type");
      if (username) data.append("username", username);
      if (user_type) data.append("user_type", user_type);

      if (imageFile) {
        data.append('img', imageFile);
      }

      await axios.post('http://localhost/dch_ver3/src/Backend/edit_inventory.php', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Item</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {[
            ['Item Code', 'item_code'],
            ['Description 1 (Name)', 'desc_1'],
            ['Description 2 (Item Code)', 'desc_2'],
            ['Description 3 (Measurement)', 'desc_3'],
            ['Description 4 (Car Type)', 'desc_4'],
            ['Warehouse Units', 'wh_units', 'number'],
            ['Store Units', 'store_units', 'number'],
            ['Fixed Price', 'fixed_price', 'number'],
            ['Retail Price', 'retail_price', 'number'],
            ['Warehouse Threshold', 'wh_thresh', 'number'],
            ['Store Threshold', 'store_thresh', 'number']
          ].map(([label, name, type = 'text']) => (
            <div className="form-group" key={name}>
              <label>{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                autoComplete="off"
                step={type === 'number' ? '0.01' : undefined}
              />
            </div>
          ))}

          {[
            ['Brand', 'brand', 'brand-list', options.brand],
            ['Category', 'category', 'category-list', options.category],
            ['Warehouse Area', 'wh_area', 'wh-area-list', options.wh_area],
            ['Store Area', 'store_area', 'store-area-list', options.store_area],
          ].map(([label, name, listId, list]) => (
            <div className="form-group" key={name}>
              <label>{label}</label>
              <input
                type="text"
                name={name}
                list={listId}
                value={formData[name] || ''}
                onChange={handleChange}
                autoComplete="off"
              />
              <datalist id={listId}>
                {list.map((item, idx) => (
                  <option key={idx} value={item} />
                ))}
              </datalist>
            </div>
          ))}

          <div className="form-group">
            <label>Item Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} autoComplete="off" />
            <div style={{ marginTop: '10px' }}>
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit">Update</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInventory_Modal;
