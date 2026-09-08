import { NavLink, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Alerts } from "./pages/Alerts";
import { Stats } from "./pages/Stats";
import { TickerDetail } from "./pages/TickerDetail";
import { Watchlist } from "./pages/Watchlist";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { useAuth } from "./lib/AuthContext";
import "./App.css";

function App() {
  const { user, logout } = useAuth();

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
            <NavLink to="/watchlist" className={({ isActive }) => (isActive ? "active" : "")}>
              Watchlist
            </NavLink>
          </nav>

          <div className="topbar-right">
            {user ? (
              <span className="account-menu">
                <span className="account-email">{user.email}</span>
                <button type="button" className="link-button" onClick={logout}>Log out</button>
              </span>
            ) : (
              <span className="account-menu">
                <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>Log in</NavLink>
                <NavLink to="/signup" className={({ isActive }) => (isActive ? "active" : "")}>Sign up</NavLink>
              </span>
            )}
            <span className="live-indicator">
              <span className="live-dot" aria-hidden="true" />
              Live
            </span>
          </div>
        </div>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/ticker/:ticker" element={<TickerDetail />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
