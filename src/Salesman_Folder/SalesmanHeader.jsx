import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package,
  List,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

function SalesHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
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

  // Navigation items for sales
  const navItems = [
    {
      href: "/SalesmanInventoryTable",
      icon: List,
      label: "Price List",
    },
  ];

  // Function to check if a nav item is active
  const isActive = (href) => {
    return activeNavItem === href || location.pathname === href;
  };

  // Handle navigation click
  const handleNavClick = (e, href) => {
    e.preventDefault();
    setActiveNavItem(href);
    navigate(href);
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      navigate("/login");
    }
  }, [navigate]);

  // Determine if we should show compact navigation (more than 6 items)
  const shouldShowCompactNav = navItems.length > 6;

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
                <span className="logo-subtitle">Sales Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="header-nav">
          <div className={`nav-links nav-items-${navItems.length}`}>
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              const active = isActive(item.href);
              
              return (
                <a
                  key={index}
                  href={item.href}
                  className={`nav-link ${active ? "nav-link-active" : ""} ${
                    shouldShowCompactNav ? "nav-link-compact" : ""
                  }`}
                  onClick={(e) => handleNavClick(e, item.href)}
                  title={item.label}
                >
                  <IconComponent size={20} />
                  {!shouldShowCompactNav && (
                    <span className="nav-text">{item.label}</span>
                  )}
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
        </div>
      </div>
    </header>
  );
}

export default SalesHeader;