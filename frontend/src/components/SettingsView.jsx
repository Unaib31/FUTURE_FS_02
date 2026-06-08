import React, { useState, useEffect } from 'react';
import '../styles/settings.css';

export default function SettingsView({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User registration form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load team users directory');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;

    try {
      setSubmitLoading(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user account');
      }

      setSubmitSuccess(`User account "${data.user.username}" created successfully!`);
      setNewUsername('');
      setNewPassword('');
      
      // Reload users list
      fetchUsers();
    } catch (err) {
      console.error(err);
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="settings-layout">
        {/* Left Side: Users list */}
        <div className="dashboard-panel glass-panel settings-panel">
          <div>
            <h3 className="panel-title">Active Team Members</h3>
            <p className="panel-subtitle">Registered administrators who can access this CRM</p>
          </div>

          {loading && users.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', padding: '16px 0' }}>
              Loading users list...
            </p>
          ) : error ? (
            <p style={{ textAlign: 'center', color: 'hsl(var(--status-lost))', fontSize: '0.85rem', padding: '16px 0' }}>
              {error}
            </p>
          ) : (
            <div className="settings-users-list">
              {users.map(u => {
                let initial = u.username.charAt(0).toUpperCase();
                return (
                  <div key={u.id} className="user-row">
                    <div className="user-info">
                      <div className="user-avatar-initial">{initial}</div>
                      <div className="user-meta">
                        <span className="user-name">{u.username}</span>
                        <span className="user-role-badge">Administrator</span>
                      </div>
                    </div>
                    <div className="user-date-added">
                      <div style={{ color: 'hsl(var(--text-secondary))' }}>Added</div>
                      <div>{formatDate(u.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: User creation form */}
        <div className="dashboard-panel glass-panel settings-panel">
          <div>
            <h3 className="panel-title">Create User Account</h3>
            <p className="panel-subtitle">Add a new administrator to access the system</p>
          </div>

          {submitSuccess && (
            <div className="submission-success-banner" style={{ marginTop: '0', backgroundColor: 'hsla(var(--status-won) / 0.08)', border: '1px solid hsla(var(--status-won) / 0.2)', color: 'hsl(var(--status-won))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ color: 'hsl(var(--status-won))' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              <span>{submitSuccess}</span>
            </div>
          )}

          {submitError && (
            <div className="auth-alert-banner error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z" />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ margin: '0' }}>
              <label>Username *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. sales_manager"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={submitLoading}
              />
            </div>

            <div className="form-group" style={{ margin: '0' }}>
              <label>Password (At least 6 characters) *</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px', marginTop: '8px' }}
              disabled={submitLoading}
            >
              {submitLoading ? 'Registering user...' : 'Register User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
