import { NavLink, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Alerts } from "./pages/Alerts";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header>
        <div className="header-top">
          <h1>SignalFlow</h1>
          <span className="live-indicator">
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
        </div>
        <p className="subtitle">Real-time market event classification &amp; alerts</p>
      </header>

      <nav className="main-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => (isActive ? "active" : "")}>
          Alerts
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </div>
  );
}

export default App;
