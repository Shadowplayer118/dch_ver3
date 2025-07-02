import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Package, Lock, User, ArrowRight, AlertCircle, X } from "lucide-react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  const showErrorMessage = (message) => {
    setError(message);
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
    }, 5000); // Auto hide after 5s
  };

  const hideError = () => {
    setShowError(false);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showErrorMessage("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost/dch_ver3/src/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("username", data.username);
        localStorage.setItem("user_type", data.user_type);

        // Delay for success
        setTimeout(() => {
          if (data.user_type === "admin") {
            navigate("/AdminDashboard");
          } else if (data.user_type === "staff-wh" || data.user_type === "staff-store") {
            navigate("/StaffInventory");
          } else if (data.user_type === "salesman") {
            navigate("/SalesmanInventoryTable");
          } else if (data.user_type === "server") {
            navigate("/server");
          } else {
            showErrorMessage("Unknown user type.");
            setIsLoading(false);
          }
        }, 1000);
      } else {
        // Show loading for 800ms before error
        setTimeout(() => {
          setIsLoading(false);
          showErrorMessage(data.message || "Login failed");
        }, 700);
      }
    } catch (err) {
      setTimeout(() => {
        setIsLoading(false);
        showErrorMessage("Server error. Please try again.");
      }, 800);
      console.error(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="background-overlay"></div>

      <div className="floating-shapes">
        <div className="shape-1"></div>
        <div className="shape-2"></div>
        <div className="shape-3"></div>
        <div className="shape-4"></div>
      </div>

      {/* Error Toast */}
      <div className={`error-toast ${showError ? 'show' : ''}`}>
        <div className="error-content">
          <AlertCircle size={20} className="error-icon" />
          <span className="error-message">{error}</span>
          <button onClick={hideError} className="error-close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner-large"></div>
            <p className="loading-text">Signing you in...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div className="card-container">
        <div className={`login-card ${isLoading ? 'loading' : ''}`}>
          <div className="card-glow"></div>

          <div className="login-header">
            <div className="icon-container">
              <Package size={40} color="white" />
              <div className="icon-ping"></div>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to continue to DCH Inventory System</p>
          </div>

          <div className="login-form">
            <div className="field-group">
              <label className="field-label">Username</label>
              <div className="input-container">
                <User
                  size={20}
                  className={`input-icon ${focusedField === 'username' ? 'focused' : ''}`}
                />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField('')}
                  className="login-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="input-container">
                <Lock
                  size={20}
                  className={`input-icon ${focusedField === 'password' ? 'focused' : ''}`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className="login-input password-input"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-button"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="button-container">
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="login-button"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '8px' }}>Sign In</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="login-footer">
            <div className="footer-divider"></div>
            <p className="footer-text">
              <Lock size={16} />
              Secure inventory management system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
