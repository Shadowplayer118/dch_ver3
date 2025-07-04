import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";

function StaffHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Update active nav item when location changes
  useEffect(() => {
    setActiveNavItem(location.pathname);
  }, [location.pathname]);

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
      if (!event.target.closest('.staff-user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation items for staff
  const navItems = [
    {
      href: "/StaffDashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/StaffInventory",
      icon: Package,
      label: "Inventory",
    },
    {
      href: "/StaffStockInOut",
      icon: ArrowLeftRight,
      label: "Stock In/Out",
    },
    {
      href: "/StaffStockHistoryTable",
      icon: TrendingUp,
      label: "History",
    },
  ];

  // Function to check if a nav item is active
  const isActive = (href) => {
    return activeNavItem === href || location.pathname === href;
  };

  // Handle navigation click
  const handleNavClick = (e, href) => {
    e.preventDefault();
    setActiveNavItem(href); // Set active state immediately
    navigate(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="main-header">
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
              const active = isActive(item.href);
              
              return (
                <a
                  key={index}
                  href={item.href}
                  className={`nav-link ${active ? "nav-link-active" : ""}`}
                  onClick={(e) => handleNavClick(e, item.href)}
                  title={item.label}
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

export default StaffHeader;