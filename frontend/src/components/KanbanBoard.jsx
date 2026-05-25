import React, { useState, useEffect } from 'react';

export default function KanbanBoard({ onOpenLeadDrawer }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads?sortBy=updatedAt&order=desc`);
      if (!res.ok) throw new Error('Failed to fetch leads');
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
    
    // Add global listener to refresh board if lead updates occur elsewhere (e.g., details drawer)
    window.addEventListener('crm-lead-updated', fetchLeads);
    return () => window.removeEventListener('crm-lead-updated', fetchLeads);
  }, []);

  // Quick move lead stage (left or right)
  const moveLead = async (e, leadId, currentStatus, direction) => {
    e.stopPropagation(); // Avoid opening drawer
    const currentIndex = stages.indexOf(currentStatus);
    let targetIndex = currentIndex + direction;
    
    if (targetIndex < 0 || targetIndex >= stages.length) return; // Out of bounds
    
    const targetStage = stages[targetIndex];

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStage })
      });

      if (!res.ok) throw new Error('Failed to transition lead');
      
      // Update local state for instant rendering before reload
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: targetStage, updatedAt: new Date().toISOString() } : lead
      ));
      
      // Dispatch global notification to sync other tabs
      window.dispatchEvent(new CustomEvent('crm-lead-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Format date
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter leads based on search
  const filteredLeads = leads.filter(lead => {
    const term = search.toLowerCase();
    return (
      lead.name.toLowerCase().includes(term) ||
      (lead.company && lead.company.toLowerCase().includes(term)) ||
      (lead.message && lead.message.toLowerCase().includes(term))
    );
  });

  // Categorize leads by stage
  const columnsData = stages.map(stage => {
    const stageLeads = filteredLeads.filter(lead => lead.status === stage);
    const totalValue = stageLeads.reduce((sum, lead) => sum + parseFloat(lead.value || 0), 0);
    return {
      stage,
      leads: stageLeads,
      value: totalValue
    };
  });

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease-out', height: '100%', overflow: 'hidden' }}>
      {/* Search Toolbar */}
      <div className="table-toolbar" style={{ flexShrink: 0 }}>
        <div className="toolbar-filters">
          <div className="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search boards by contact name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-actions">
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
            Showing <strong>{filteredLeads.length}</strong> total active pipeline deals
          </span>
        </div>
      </div>

      {loading && leads.length === 0 ? (
        <div className="empty-table-state" style={{ flexGrow: 1 }}>
          <div className="sidebar-logo" style={{ animation: 'spin 1.5s linear infinite', width: '40px', height: '40px' }}>C</div>
          <p className="empty-state-title" style={{ marginTop: '12px' }}>Loading Kanban Boards...</p>
        </div>
      ) : error ? (
        <div className="empty-table-state" style={{ flexGrow: 1 }}>
          <h3 className="empty-state-title">Connection Error</h3>
          <p className="empty-state-desc">{error}</p>
        </div>
      ) : (
        /* Kanban columns board wrapper */
        <div className="kanban-container">
          {columnsData.map(col => {
            let stageKey = col.stage.toLowerCase().replace(' ', '-');
            return (
              <div key={col.stage} className="kanban-column">
                {/* Column Header */}
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className={`kanban-dot ${stageKey}`} />
                    <span>{col.stage}</span>
                  </div>
                  <div className="kanban-column-meta">
                    <span className="kanban-column-count">{col.leads.length}</span>
                    <span className="kanban-column-value">{formatCurrency(col.value)}</span>
                  </div>
                </div>

                {/* Column Cards list */}
                <div className="kanban-card-list">
                  {col.leads.length === 0 ? (
                    <div style={{
                      height: '100px',
                      border: '2px dashed hsl(var(--border-color))',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      padding: '16px'
                    }}>
                      Drop leads here
                    </div>
                  ) : (
                    col.leads.map(lead => {
                      return (
                        <div 
                          key={lead.id} 
                          className="kanban-card"
                          onClick={() => onOpenLeadDrawer(lead.id)}
                        >
                          <div className="kanban-card-header">
                            <div>
                              <h4 className="kanban-card-title">{lead.name}</h4>
                              <p className="kanban-card-company">{lead.company || 'Personal Client'}</p>
                            </div>
                          </div>

                          {lead.message && (
                            <p className="kanban-card-body">{lead.message}</p>
                          )}

                          <div className="kanban-card-value">
                            {formatCurrency(parseFloat(lead.value))}
                          </div>

                          <div className="kanban-card-footer">
                            <span className="kanban-card-date">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                              </svg>
                              {formatDate(lead.createdAt)}
                            </span>

                            {/* Column Arrow movements */}
                            <div className="card-actions">
                              {lead.status !== 'New' && (
                                <button 
                                  className="card-action-btn"
                                  onClick={(e) => moveLead(e, lead.id, lead.status, -1)}
                                  title="Shift stage back"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                  </svg>
                                </button>
                              )}
                              {lead.status !== 'Lost' && (
                                <button 
                                  className="card-action-btn"
                                  onClick={(e) => moveLead(e, lead.id, lead.status, 1)}
                                  title="Advance stage"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
