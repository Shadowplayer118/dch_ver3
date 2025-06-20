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
          'http://localhost/dch_ver3/src/Backend/fetch_stockHistory.php',
          {
            params: { item_code: itemData.item_code },
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
    <div className="modal-backdrop">
      <div className="modal-content large">
        <h2>Stock History</h2>

        {/* Item Details */}
        <div className="item-details">
          <p><strong>Item Code:</strong> {itemData.item_code}</p>
          <p><strong>Name:</strong> {itemData.desc_1 + itemData.desc_2 + itemData.desc_3}</p>
          <p><strong>Brand:</strong> {itemData.brand}</p>
          <p><strong>Category:</strong> {itemData.category}</p>
        </div>

        {/* Filter Controls */}
        <div className="filters" style={{ marginBottom: '10px' }}>
          <label>
            From: <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </label>
          <label style={{ marginLeft: '10px' }}>
            To: <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </label>
          <label style={{ marginLeft: '10px' }}>
            Type:
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All</option>
              <option value="STOCK IN">Stock In</option>
              <option value="STOCK OUT">Stock Out</option>
            </select>
          </label>
          <label style={{ marginLeft: '10px' }}>
            From:
            <select value={filterFrom} onChange={e => setFilterFrom(e.target.value)}>
              <option value="">All</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
              <option value="STORE">STORE</option>
              {[...new Set(history.map(h => h.trans_from))].map((source, idx) => (
                <option key={idx} value={source}>{source}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Stock History Table */}
        <table className="history-table">
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
          <div className="pagination-controls" style={{ marginTop: '10px', textAlign: 'center' }}>
            <button onClick={goToPreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span style={{ margin: '0 10px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={goToNextPage} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}

        {/* Close Button */}
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">Close</button>
        </div>

        <button onClick={exportToExcel} className="export-btn" style={{ marginRight: '10px' }}>
            Export to Excel
        </button>

        <button onClick={printStockHistory} className="export-btn" style={{ marginRight: '10px' }}>
            Print PDF
        </button>

      </div>
    </div>
  );
};

export default StockHistory_Modal;
