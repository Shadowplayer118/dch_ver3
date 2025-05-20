import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Default route: always show Login */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
