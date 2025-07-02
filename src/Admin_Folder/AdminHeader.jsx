import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  TrendingUp,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Settings,
  Users,
  BarChart3,
  FileText,
  Bell,
} from "lucide-react";

function AdminHeader() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extended navItems array to demonstrate the automatic icon-only behavior
  const navItems = [
    {
      href: "/AdminDashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/InventoryTable",
      icon: Package,
      label: "Inventory",
    },
    {
      href: "/StockInOutTable",
      icon: ArrowLeftRight,
      label: "Stock In/Out",
    },
    {
      href: "/StockHistoryTable",
      icon: TrendingUp,
      label: "History",
    },
  ];

  return (
    <header className="admin-header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-wrapper">
              <div className="logo-icon">
                <Package size={28} />
              </div>
              <div className="logo-text">
                <h1 className="logo-title">DCH Inventory</h1>
                <span className="logo-subtitle">Management System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="header-nav">
          <div className={`nav-links ${isMobileMenuOpen ? "nav-links-open" : ""} nav-items-${navItems.length}`}>
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={index}
                  href={item.href}
                  className="nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={item.label} // Added for accessibility
                >
                  <IconComponent size={20} />
                  <span className="nav-text">{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* User Actions Section */}
        <div className="header-actions">
          {username && (
            <div className="user-dropdown-container">
              <button 
                className="user-dropdown-trigger"
                onClick={toggleUserDropdown}
              >
                <div className="user-avatar">
                  <User size={20} />
                </div>
                <div className="user-details">
                  <span className="user-label">Welcome back</span>
                  <span className="username">{username}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`dropdown-arrow ${isUserDropdownOpen ? 'dropdown-arrow-open' : ''}`}
                />
              </button>

              {isUserDropdownOpen && (
                <div className="user-dropdown-menu">
                  <button 
                    className="logout-btn-dropdown"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={toggleMobileMenu}></div>
      )}
    </header>
  );
}

export default AdminHeader;