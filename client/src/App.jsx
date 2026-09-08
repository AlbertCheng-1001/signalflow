import { NavLink, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Alerts } from "./pages/Alerts";
import { Stats } from "./pages/Stats";
import { TickerDetail } from "./pages/TickerDetail";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img className="brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />
            <span className="brand-name">SignalFlow</span>
          </div>

          <nav className="main-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
            <NavLink to="/alerts" className={({ isActive }) => (isActive ? "active" : "")}>
              Alerts
            </NavLink>
            <NavLink to="/stats" className={({ isActive }) => (isActive ? "active" : "")}>
              Stats
            </NavLink>
          </nav>

          <span className="live-indicator">
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
        </div>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/ticker/:ticker" element={<TickerDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
