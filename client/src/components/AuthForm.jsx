import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function AuthForm({ title, submitLabel, onSubmit, footer }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(email, password);
      navigate("/watchlist");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h2 className="page-title">{title}</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
          />
        </label>
        {error && <div className="error-banner">{error}</div>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Please wait…" : submitLabel}
        </button>
      </form>
      {footer}
    </div>
  );
}
