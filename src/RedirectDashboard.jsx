import { Navigate } from "react-router-dom";

function RedirectDashboard() {
  const userType = localStorage.getItem("user_type");

  if (userType === "admin") {
    return <Navigate to="/AdminDashboard" replace />;
  } else if (userType === "staff-wh" || userType === "staff-store") {
    return <Navigate to="/StaffDashboard" replace />;
  } else {
    // No user_type found, redirect to login
    return <Navigate to="/login" replace />;
  }
}

export default RedirectDashboard;
