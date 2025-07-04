import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './AppRoutes'
import './assets/css/index.css';
import './assets/css/Login.css';
import './assets/css/AdminHeader.css';
import './assets/css/AdminHeader2.css';
import './assets/css/AdminDashboard.css';
import './assets/css/Inventory.css';
import './assets/css/Table1.css';
import './assets/css/AddModal.css';
import './assets/css/EditModal.css';
import './assets/css/HistoryModal.css';
import './assets/css/StockInModal.css';
import './assets/css/StockOutModal.css';
import './assets/css/ActivityReport.css';
import './assets/css/Table2.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>,
)
