import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './AppRoutes'
import './index.css';
import './assets/css/Login.css';
import './assets/css/AdminHeader.css';
import './assets/css/AdminDashboard.css';
import './assets/css/InventoryTable.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>,
)
