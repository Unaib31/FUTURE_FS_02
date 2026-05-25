import React, { useState, useEffect } from 'react';

export default function LeadTable({ onOpenLeadDrawer }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Toolbar controls
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [source, setSource] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Manual Add Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: '',
    status: 'New',
    source: 'CRM Manual Entry',
    message: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        status,
        source,
        sortBy,
        order
      }).toString();

      const res = await fetch(`/api/leads?${query}`);
      if (!res.ok) throw new Error('Failed to load leads list');
      const data = await res.json();
      setLeads(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    // Add global listener to refresh table if lead updates occur elsewhere
    window.addEventListener('crm-lead-updated', fetchLeads);
    return () => window.removeEventListener('crm-lead-updated', fetchLeads);
  }, [search, status, source, sortBy, order]);

  // Handle lead deletion
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Stop row click
    if (!window.confirm('Are you absolutely sure you want to delete this lead? All note logs will be permanently deleted.')) return;

    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      
      // Update local state immediately
      setLeads(prev => prev.filter(l => l.id !== id));
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('crm-lead-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle submitting the manual Lead Form
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.email) {
      alert('Name and Email are required to create a lead.');
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLeadForm,
          value: parseFloat(newLeadForm.value) || 0.00
        })
      });

      if (!res.ok) throw new Error('Failed to create manual lead');
      
      // Clear form and modal
      setNewLeadForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        value: '',
        status: 'New',
        source: 'CRM Manual Entry',
        message: ''
      });
      setShowAddModal(false);
      
      // Reload leads and notify other tabs
      fetchLeads();
      window.dispatchEvent(new CustomEvent('crm-lead-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewLeadForm(prev => ({ ...prev, [name]: value }));
  };

  // Helper formats
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Toggle order direction
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setOrder('desc');
    }
  };

  // Extract unique sources for the filter select
  const uniqueSources = ['All', 'Website Contact Form', 'Landing Page Form', 'CRM Manual Entry', 'Referral Webhook'];

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Search & Filter Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-filters">
          {/* Search bar */}
          <div className="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search leads by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status selector */}
          <select 
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Source selector */}
          <select 
            className="filter-select"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="All">All Sources</option>
            <option value="Website Contact Form">Website Forms</option>
            <option value="Landing Page Form">Landing Pages</option>
            <option value="CRM Manual Entry">Manual Entry</option>
            <option value="Referral Webhook">Referral Webhooks</option>
          </select>
        </div>

        <div className="toolbar-actions">
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Grid listing Table */}
      {loading && leads.length === 0 ? (
        <div className="empty-table-state glass-panel">
          <div className="sidebar-logo" style={{ animation: 'spin 1.5s linear infinite', width: '40px', height: '40px' }}>C</div>
          <p className="empty-state-title" style={{ marginTop: '12px' }}>Loading client directory...</p>
        </div>
      ) : error ? (
        <div className="empty-table-state glass-panel">
          <h3 className="empty-state-title">Loading Failed</h3>
          <p className="empty-state-desc">{error}</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="empty-table-state glass-panel">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="empty-state-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          <h3 className="empty-state-title">No client leads found</h3>
          <p className="empty-state-desc">Try clearing your filters, searching another keyword, or creating a manual lead.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th onClick={() => handleSortChange('name')} style={{ cursor: 'pointer' }}>
                  Client Name {sortBy === 'name' ? (order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSortChange('company')} style={{ cursor: 'pointer' }}>
                  Company {sortBy === 'company' ? (order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSortChange('status')} style={{ cursor: 'pointer' }}>
                  Pipeline Stage {sortBy === 'status' ? (order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSortChange('value')} style={{ cursor: 'pointer' }}>
                  Value {sortBy === 'value' ? (order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSortChange('createdAt')} style={{ cursor: 'pointer' }}>
                  Created Date {sortBy === 'createdAt' ? (order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => {
                let initial = lead.name.charAt(0).toUpperCase();
                let stageKey = lead.status.toLowerCase().replace(' ', '-');
                return (
                  <tr key={lead.id} onClick={() => onOpenLeadDrawer(lead.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="contact-cell">
                        <div className="avatar-initial">{initial}</div>
                        <div className="contact-details">
                          <span className="contact-name">{lead.name}</span>
                          <span className="contact-email">{lead.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="company-badge">{lead.company || '—'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${stageKey}`}>{lead.status}</span>
                    </td>
                    <td className="lead-value-cell">
                      {formatCurrency(parseFloat(lead.value))}
                    </td>
                    <td className="lead-source-cell">
                      <div>{formatDate(lead.createdAt)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>via {lead.source}</div>
                    </td>
                    <td className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button 
                        className="action-icon-btn" 
                        onClick={() => onOpenLeadDrawer(lead.id)}
                        title="View profile & notes"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                      <button 
                        className="action-icon-btn delete-btn" 
                        onClick={(e) => handleDelete(e, lead.id)}
                        title="Archive/Delete client"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Add Lead Modal (Glass Panel styling) */}
      {showAddModal && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{
            width: '500px',
            maxWidth: '95%',
            background: 'hsl(var(--bg-secondary))',
            padding: '32px',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="drawer-title" style={{ fontSize: '1.25rem' }}>Create Client Record</h3>
              <button onClick={() => setShowAddModal(false)} className="close-drawer-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="form-group">
                <label>Contact Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  required
                  placeholder="e.g. Robert Downey"
                  value={newLeadForm.name}
                  onChange={handleFormChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    className="form-control" 
                    required
                    placeholder="rdj@stark.com"
                    value={newLeadForm.email}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    name="phone" 
                    className="form-control" 
                    placeholder="+1 (555) 300-3000"
                    value={newLeadForm.phone}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    name="company" 
                    className="form-control" 
                    placeholder="Stark Industries"
                    value={newLeadForm.company}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Pipeline Value (₹)</label>
                  <input 
                    type="number" 
                    name="value" 
                    className="form-control" 
                    placeholder="5000"
                    min="0"
                    value={newLeadForm.value}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Pipeline Stage</label>
                  <select 
                    name="status"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={newLeadForm.status}
                    onChange={handleFormChange}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Lead Source</label>
                  <select 
                    name="source"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={newLeadForm.source}
                    onChange={handleFormChange}
                  >
                    <option value="CRM Manual Entry">CRM Manual Entry</option>
                    <option value="Website Contact Form">Website Form</option>
                    <option value="Landing Page Form">Landing Page</option>
                    <option value="Referral Webhook">Referral Webhook</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Inquiry Message / Notes</label>
                <textarea 
                  name="message" 
                  className="form-control" 
                  rows="3"
                  placeholder="Summarize the client requirements or contact message..."
                  value={newLeadForm.message}
                  onChange={handleFormChange}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
