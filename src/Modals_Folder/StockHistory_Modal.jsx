import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const StockHistory_Modal = ({ isOpen, onClose, itemData }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;

  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');

  useEffect(() => {
    if (!isOpen || !itemData?.inventory_id) return;

    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          'https://slategrey-stingray-471759.hostingersite.com/api/backend_2/Backend/fetch_stockHistory.php',
          {
            params: { item_code: itemData.item_code, location: itemData.location },
          }
        );
        setHistory(response.data);
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to fetch stock history:', error);
        setHistory([]);
      }
    };

    fetchHistory();
  }, [isOpen, itemData]);

  useEffect(() => {
    // Apply filters
    let filtered = [...history];

    if (dateFrom) {
      filtered = filtered.filter(h => new Date(h.trans_date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(h => new Date(h.trans_date) <= new Date(dateTo));
    }

    if (filterType) {
      filtered = filtered.filter(h => h.trans_type === filterType);
    }

    if (filterFrom) {
      filtered = filtered.filter(h => h.location === filterFrom);
    }

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [history, dateFrom, dateTo, filterType, filterFrom]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(filteredHistory.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentHistory = filteredHistory.slice(startIndex, startIndex + entriesPerPage);

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const sortedHistory = [...filteredHistory].sort((a, b) => new Date(a.trans_date) - new Date(b.trans_date));

  const calculatedUnits = history.reduce((total, record) => {
    const units = parseInt(record.trans_units) || 0;

    if (record.trans_type === "STOCK IN") return total + units;
    if (record.trans_type === "STOCK OUT") return total - units;
    return total;
  }, 0);

  const actualUnits = parseInt(itemData.units) || 0;
  const discrepancy = calculatedUnits - actualUnits;

  const exportToExcel = () => {
    if (filteredHistory.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(filteredHistory);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock History');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const itemName = (itemData.desc_1 + itemData.desc_2 + itemData.desc_3).replace(/\s+/g, '_');
    saveAs(data, `${itemData.item_code}_${itemName}_stock_history.xlsx`);
  };

  const printStockHistory = () => {
    const printWindow = window.open('', '_blank');

    const itemName = itemData.desc_1 + ' ' + itemData.desc_2 + ' ' + itemData.desc_3;

    const tableRows = filteredHistory.map(
      record => `
        <tr>
          <td>${record.trans_type}</td>
          <td>${record.trans_units}</td>
          <td>${record.location}</td>
          <td>${record.trans_date}</td>
        </tr>`
    ).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Stock History - ${itemData.item_code}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h2, h4 {
              text-align: center;
              margin: 0 0 10px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #333;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f2f2f2;
            }
            .details {
              margin-top: 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h2>Stock History Report</h2>
          <h4>${itemData.item_code} - ${itemName}</h4>

          <div class="details">
            <p><strong>Brand:</strong> ${itemData.brand}</p>
            <p><strong>Category:</strong> ${itemData.category}</p>
            ${dateFrom || dateTo ? `<p><strong>Date Range:</strong> ${dateFrom || '...'} to ${dateTo || '...'}</p>` : ''}
            ${filterType ? `<p><strong>Transaction Type:</strong> ${filterType}</p>` : ''}
            ${filterFrom ? `<p><strong>From:</strong> ${filterFrom}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Transaction Type</th>
                <th>Units</th>
                <th>From</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="4">No data found</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="stockhist-modal-backdrop">
      <div className="stockhist-modal-content">
        <h2 className="stockhist-title">Stock History</h2>

        <div className="stockhist-form">
          {/* Left Side - Item Details Section */}
          <div className="stockhist-details-section">
            <div className="stockhist-group">
              <label className="stockhist-label">Item Details</label>
              <div className="stockhist-item-details">
                <p><strong>Item Code:</strong> {itemData.item_code}</p>
                <p><strong>Name:</strong> {itemData.desc_1 + itemData.desc_2 + itemData.desc_3 + itemData.desc_4}</p>
                <p><strong>Brand:</strong> {itemData.brand}</p>
                <p><strong>Category:</strong> {itemData.category}</p>
                <p><strong>Current Units:</strong> {itemData.units}</p>
                <div className="stockhist-discrepancy">
                  <p><strong>Calculated Units from History:</strong> {calculatedUnits}</p>
                  <p><strong>Discrepancy:</strong> {discrepancy > 0 ? `+${discrepancy} extra units` : `${Math.abs(discrepancy)} units missing`}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Filter Controls */}
          <div className="stockhist-fields-section">
            <div className="stockhist-group">
              <label className="stockhist-label">Filter Options</label>
            </div>

            {/* Date Range Filters */}
            <div className="stockhist-row">
              <div className="stockhist-group">
                <label>Date From</label>
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={e => setDateFrom(e.target.value)} 
                  className="stockhist-input" 
                />
              </div>
              <div className="stockhist-group">
                <label>Date To</label>
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={e => setDateTo(e.target.value)} 
                  className="stockhist-input" 
                />
              </div>
            </div>

            {/* Transaction Type and Location Filters */}
            <div className="stockhist-row">
              <div className="stockhist-group">
                <label>Transaction Type</label>
                <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value)}
                  className="stockhist-input"
                >
                  <option value="">All</option>
                  <option value="STOCK IN">Stock In</option>
                  <option value="STOCK OUT">Stock Out</option>
                </select>
              </div>
              <div className="stockhist-group">
                <label>Location</label>
                <select 
                  value={filterFrom} 
                  onChange={e => setFilterFrom(e.target.value)}
                  className="stockhist-input"
                >
                  <option value="">All</option>
                  <option value="WAREHOUSE">WAREHOUSE</option>
                  <option value="STORE">STORE</option>
                  {[...new Set(history.map(h => h.trans_from))].map((source, idx) => (
                    <option key={idx} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stock History Table */}
        <div className="stockhist-table-section">
          <table className="stockhist-table">
            <thead>
              <tr>
                <th>Transaction Type</th>
                <th>Units</th>
                <th>From</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No transaction history found.</td>
                </tr>
              ) : (
                currentHistory.map((record, index) => (
                  <tr key={index}>
                    <td>{record.trans_type}</td>
                    <td>{record.trans_units}</td>
                    <td>{record.location}</td>
                    <td>{record.trans_date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredHistory.length > entriesPerPage && (
            <div className="stockhist-pagination">
              <button 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1}
                className="stockhist-pagination-btn"
              >
                Previous
              </button>
              <span className="stockhist-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="stockhist-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="stockhist-actions">
          <button onClick={exportToExcel} className="stockhist-export-btn">
            Export to Excel
          </button>
          <button onClick={printStockHistory} className="stockhist-export-btn">
            Print PDF
          </button>
          <button onClick={onClose} className="stockhist-cancel-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistory_Modal;