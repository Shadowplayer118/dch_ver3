import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
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

        if (data.user_type === "admin") {
          navigate("/AdminDashboard");
        } else if (data.user_type === "staff-wh" || data.user_type === "staff-store") {
          navigate("/StaffInventory");
        } else if (data.user_type === "salesman") {
          navigate("/SalesmanInventoryTable");
        } else if (data.user_type === "server") {
        navigate("/server");
        } else {
          alert("Unknown user type.");
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Server error");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl mb-4">Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="mb-2 p-2 border"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="mb-2 p-2 border"
      />
      <button onClick={handleLogin} className="px-4 py-2 bg-blue-500 text-white">
        Login
      </button>
    </div>
  );
}

export default Login;
