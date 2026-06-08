import React, { useState } from 'react';
import '../styles/auth.css';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please verify credentials.');
      }

      // Pass token and user details to parent component
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background visual neon glow circles */}
      <div className="login-glow-accent" />
      <div className="login-glow-accent-secondary" />

      {/* Login panel */}
      <div className="login-panel glass-panel">
        <div className="login-header">
          <div className="login-logo">C</div>
          <h2 className="login-title">ClientFlow CRM</h2>
          <p className="login-subtitle">Sign in to manage client pipeline leads</p>
        </div>

        {error && (
          <div className="auth-alert-banner error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: '0' }}>
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter admin username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ margin: '0' }}>
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter admin password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '44px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Verifying account...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
