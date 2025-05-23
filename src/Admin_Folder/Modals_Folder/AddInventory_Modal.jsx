import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddInventory_Modal = ({ isOpen, onClose}) => {
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
    wh_units: '',
    store_units: '',
    wh_area: '',
    store_area: '',
    wh_thresh: '',
    store_thresh: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [options, setOptions] = useState({
    brand: [],
    category: [],
    wh_area: [],
    store_area: []
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
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
      wh_units: '',
      store_units: '',
      wh_area: '',
      store_area: '',
      wh_thresh: '',
      store_thresh: '',
    });

    setImageFile(null);
    setPreviewImage('http://localhost/dch_ver3/src/Backend/Images/default_autoparts.png');

    // ✅ Close modal
    onClose();

  } catch (error) {
    console.error('Error adding item:', error);
  }
};

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Add Item</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label>Item Code</label>
            <input type="text" name="item_code" value={formData.item_code} onChange={handleChange}   autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Description 1 (Name)</label>
            <input type="text" name="desc_1" value={formData.desc_1} onChange={handleChange}   autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Description 2 (Item Code)</label>
            <input type="text" name="desc_2" value={formData.desc_2} onChange={handleChange}   autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Description 3 (Measurement)</label>
            <input type="text" name="desc_3" value={formData.desc_3} onChange={handleChange}   autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Description 4 (Car Type)</label>
            <input type="text" name="desc_4" value={formData.desc_4} onChange={handleChange}   autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Brand</label>
            <input
              type="text"
              name="brand"
              list="brand-list"
              value={formData.brand}
              onChange={handleChange}
              autoComplete="off"
            />
            <datalist id="brand-list">
              {options.brand.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              list="category-list"
              value={formData.category}
              onChange={handleChange}
              autoComplete="off"
            />
            <datalist id="category-list">
              {options.category.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Warehouse Units</label>
            <input type="number" name="wh_units" value={formData.wh_units} onChange={handleChange} autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Store Units</label>
            <input type="number" name="store_units" value={formData.store_units} onChange={handleChange} autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Fixed Price</label>
            <input type="number" name="fixed_price" value={formData.fixed_price} onChange={handleChange} step="0.01" autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Retail Price</label>
            <input type="number" name="retail_price" value={formData.retail_price} onChange={handleChange} step="0.01" autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Warehouse Area</label>
            <input
              type="text"
              name="wh_area"
              list="wh-area-list"
              value={formData.wh_area}
              onChange={handleChange}
              autoComplete="off"
            />
            <datalist id="wh-area-list">
              {options.wh_area.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Store Area</label>
            <input
              type="text"
              name="store_area"
              list="store-area-list"
              value={formData.store_area}
              onChange={handleChange}
              autoComplete="off"
            />
            <datalist id="store-area-list">
              {options.store_area.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Warehouse Threshold</label>
            <input type="number" name="wh_thresh" value={formData.wh_thresh} onChange={handleChange} autoComplete="off"/>
          </div>
          <div className="form-group">
            <label>Store Threshold</label>
            <input type="number" name="store_thresh" value={formData.store_thresh} onChange={handleChange} autoComplete="off"/>
          </div>

        <div className="form-group">
            <label>Item Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} autoComplete="off"/>
            <div style={{ marginTop: '10px' }}>
            <img
            src={previewImage}
            alt="Preview"
            style={{ width: '120px', height: '120px', objectFit: 'cover', border: '1px solid #ccc' }}
            />
            </div>
        </div>

          <div className="form-group">
            <label>Item Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} autoComplete="off"/>
          </div>

          <div className="modal-actions">
            <button type="submit">Add</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventory_Modal;
