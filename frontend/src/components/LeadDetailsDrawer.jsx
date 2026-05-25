import React, { useState, useEffect } from 'react';

export default function LeadDetailsDrawer({ leadId, onClose }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Note creation form state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('CRM Administrator');

  // Input editing state
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editableValue, setEditableValue] = useState('');

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error('Lead record could not be fetched');
      const data = await res.json();
      setLead(data);
      setEditableValue(data.value);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

  // Handle stage transition
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update stage');
      
      // Reload details to capture the new autolog note!
      fetchLeadDetails();
      
      // Dispatch global sync notification
      window.dispatchEvent(new CustomEvent('crm-lead-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle pipeline value change
  const handleValueSave = async () => {
    const parsedVal = parseFloat(editableValue);
    if (isNaN(parsedVal) || parsedVal < 0) {
      alert('Please enter a valid positive number for estimated value.');
      return;
    }

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: parsedVal })
      });

      if (!res.ok) throw new Error('Failed to update pipeline value');
      
      setIsEditingValue(false);
      
      // Reload details to capture the value change autolog note!
      fetchLeadDetails();
      
      // Dispatch global sync notification
      window.dispatchEvent(new CustomEvent('crm-lead-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle manual note addition
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteContent,
          author: noteAuthor
        })
      });

      if (!res.ok) throw new Error('Failed to add note');
      
      setNewNoteContent('');
      
      // Refresh lead details to see the new note at the top
      fetchLeadDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this timeline note permanently?')) return;

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      
      // Update local state instantly
      setLead(prev => ({
        ...prev,
        Notes: prev.Notes.filter(n => n.id !== noteId)
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!leadId) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="lead-drawer" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="empty-table-state" style={{ flexGrow: 1 }}>
            <div className="sidebar-logo" style={{ animation: 'spin 1.5s linear infinite', width: '32px', height: '32px' }}>C</div>
            <p className="empty-state-title" style={{ marginTop: '12px', fontSize: '1rem' }}>Ingesting Client Profile...</p>
          </div>
        ) : error ? (
          <div className="empty-table-state" style={{ flexGrow: 1, padding: '32px' }}>
            <h3 className="empty-state-title" style={{ color: 'hsl(var(--status-lost))' }}>Retrieval Error</h3>
            <p className="empty-state-desc">{error}</p>
            <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>Close Inspector</button>
          </div>
        ) : (
          <>
            {/* Header section with Name & Quick actions */}
            <div className="drawer-header">
              <div className="drawer-header-top">
                <div className="drawer-title-area">
                  <h2 className="drawer-title">{lead.name}</h2>
                  <span className="drawer-subtitle">{lead.company || 'Private Client Inquiry'}</span>
                </div>
                <button onClick={onClose} className="close-drawer-btn" title="Close Drawer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Status and Value Quick-Edits */}
              <div className="drawer-quick-edits">
                <div className="quick-edit-group">
                  <span className="quick-edit-label">Pipeline Stage</span>
                  <select 
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="quick-edit-group">
                  <span className="quick-edit-label">Pipeline Deal Value (₹)</span>
                  {isEditingValue ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ height: '40px', padding: '6px 10px' }}
                        value={editableValue}
                        onChange={(e) => setEditableValue(e.target.value)}
                        autoFocus
                      />
                      <button 
                        onClick={handleValueSave} 
                        className="btn btn-primary btn-sm"
                        style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✓
                      </button>
                      <button 
                        onClick={() => { setIsEditingValue(false); setEditableValue(lead.value); }} 
                        className="btn btn-secondary btn-sm"
                        style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsEditingValue(true)} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px 14px', 
                        background: 'hsl(var(--bg-secondary))', 
                        border: '1px dashed hsl(var(--border-color))',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontFamily: 'Outfit',
                        fontSize: '0.95rem'
                      }}
                      title="Click to edit value"
                    >
                      <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lead.value)}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14" style={{ color: 'hsl(var(--text-muted))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.84a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable details body */}
            <div className="drawer-body">
              {/* Profile Contact info section */}
              <div className="drawer-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="lead-meta-grid">
                  <div className="meta-row">
                    <div className="meta-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div className="meta-content">
                      <span className="meta-label">Email Address</span>
                      <a href={`mailto:${lead.email}`} className="meta-value" style={{ color: 'hsl(var(--accent-primary))', textDecoration: 'none' }}>
                        {lead.email}
                      </a>
                    </div>
                  </div>

                  {lead.phone && (
                    <div className="meta-row">
                      <div className="meta-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.84c0-1.84 1.351-3.268 2.919-3.268 1.072 0 2.015.607 2.453 1.54L8.79 7.15c.343.738.163 1.61-.457 2.122l-1.24 1.033c.658 1.224 1.65 2.217 2.873 2.873l1.033-1.24c.518-.62 1.385-.8 2.122-.457l2.207 1.026c.933.433 1.54 1.378 1.54 2.45v3.83c0 1.568-1.42 2.919-2.918 2.919-.849 0-1.7-.168-2.507-.508-3.342-1.402-6.059-4.12-7.461-7.461a8.5 8.5 0 0 1-.508-2.508V6.84Z" />
                        </svg>
                      </div>
                      <div className="meta-content">
                        <span className="meta-label">Phone Number</span>
                        <a href={`tel:${lead.phone}`} className="meta-value" style={{ color: 'hsl(var(--text-primary))', textDecoration: 'none' }}>
                          {lead.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="meta-row">
                    <div className="meta-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                      </svg>
                    </div>
                    <div className="meta-content">
                      <span className="meta-label">Ingestion Details</span>
                      <span className="meta-value" style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        Registered on {formatDate(lead.createdAt)} via {lead.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submitted message section */}
              {lead.message && (
                <div className="drawer-section">
                  <h3 className="section-title">Submitted Client Message</h3>
                  <div className="lead-message-bubble">
                    {lead.message}
                  </div>
                </div>
              )}

              {/* Notes Timeline section */}
              <div className="drawer-section">
                <h3 className="section-title">Chronological Log & Notes ({lead.Notes ? lead.Notes.length : 0})</h3>
                <div className="notes-timeline">
                  {(!lead.Notes || lead.Notes.length === 0) ? (
                    <p style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', padding: '12px 0' }}>
                      No timeline events logged for this client yet.
                    </p>
                  ) : (
                    lead.Notes.map((note) => {
                      const isSystem = note.author === 'System Autolog';
                      return (
                        <div 
                          key={note.id} 
                          className={`note-bubble ${isSystem ? 'system-note' : ''}`}
                        >
                          <div className="note-header">
                            <span className="note-author">{note.author}</span>
                            <span className="note-date">{formatDate(note.createdAt)}</span>
                          </div>
                          <p className="note-content">{note.content}</p>
                          
                          {!isSystem && (
                            <button 
                              className="delete-note-btn" 
                              onClick={() => handleDeleteNote(note.id)}
                              title="Delete note log"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Note submission footer form */}
            <div className="drawer-footer">
              <form onSubmit={handleAddNote} className="notes-input-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <span className="quick-edit-label" style={{ margin: '0' }}>Append Custom Comment</span>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ height: '32px', fontSize: '0.75rem', padding: '4px 8px' }}
                    placeholder="Author signature..."
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                  />
                </div>
                <div className="notes-input-area">
                  <textarea 
                    className="form-control" 
                    placeholder="Type note log details to append onto this client's timeline history..."
                    rows="2"
                    required
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    onKeyDown={(e) => {
                      // Submit on enter if not shift keying
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddNote(e);
                      }
                    }}
                  />
                  <button type="submit" className="notes-submit-btn" title="Add Note">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
