import React, { useState, useEffect } from 'react';

export default function DashboardOverview({ onOpenLeadDrawer }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="empty-table-state">
        <div className="sidebar-logo" style={{ animation: 'spin 1.5s linear infinite', width: '40px', height: '40px', fontSize: '1.5rem' }}>C</div>
        <p className="empty-state-title" style={{ marginTop: '12px' }}>Analyzing Sales Pipeline...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-table-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="empty-state-icon" style={{ color: 'hsl(var(--status-lost))' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z" />
        </svg>
        <h3 className="empty-state-title">Failed to Load Metrics</h3>
        <p className="empty-state-desc">{error}</p>
        <button onClick={fetchStats} className="btn btn-secondary btn-sm">Try Again</button>
      </div>
    );
  }

  const { summary, stageDistribution, sourceDistribution, recentLeads } = stats;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Radial calculation (radius=70, circumference=439.82)
  const radius = 70;
  const strokeCircumference = 2 * Math.PI * radius;
  const strokeDashoffset = strokeCircumference - (summary.conversionRate / 100) * strokeCircumference;

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Top metrics grid */}
      <div className="dashboard-grid">
        {/* KPI 1: Total Leads */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Total Leads</span>
            <div className="kpi-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0 1 12.75 21.5h-1.5a2.25 2.25 0 0 1-2.25-2.263V19.13m4.75-.003a2.25 2.25 0 0 0 2.25-2.265V15.5m0-1.5a1.5 1.5 0 0 0-3 0m3 0a1.5 1.5 0 0 0-3 0M9 19.128a9.38 9.38 0 0 1-2.625.372 9.337 9.337 0 0 1-4.121-.952 4.125 4.125 0 0 1 7.533-2.493M9 19.128v-.003c0-1.113.285-2.16.786-3.07M9 19.128v.109A2.25 2.25 0 0 0 11.25 21.5h1.5a2.25 2.25 0 0 0 2.25-2.263V19.13M8.25 15.5H6.75a2.25 2.25 0 0 0-2.25 2.265v.26M10.5 8.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12.75 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-6.75 3.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{summary.totalLeads}</div>
          <div className="kpi-footer">
            <span className="kpi-trend-positive">
              +{summary.activeLeads} active
            </span>
            <span>in current pipeline</span>
          </div>
        </div>

        {/* KPI 2: Active Pipeline Value */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Active Pipeline</span>
            <div className="kpi-icon-wrapper" style={{ color: 'hsl(var(--status-qualified))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(summary.activePipeline)}</div>
          <div className="kpi-footer">
            <span>Total pipeline: </span>
            <span style={{ color: 'hsl(var(--text-primary))', fontWeight: '600' }}>
              {formatCurrency(summary.totalPipeline)}
            </span>
          </div>
        </div>

        {/* KPI 3: Won Deals */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Deals Closed Won</span>
            <div className="kpi-icon-wrapper" style={{ color: 'hsl(var(--status-won))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{summary.wonLeads}</div>
          <div className="kpi-footer">
            <span>Archived lost: </span>
            <span style={{ color: 'hsl(var(--status-lost))', fontWeight: '600' }}>{summary.lostLeads}</span>
          </div>
        </div>

        {/* KPI 4: Conversion Rate */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Conversion Rate</span>
            <div className="kpi-icon-wrapper" style={{ color: 'hsl(var(--status-contacted))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{summary.conversionRate}%</div>
          <div className="kpi-footer">
            <span>Closed ratio (Won / Total Closed)</span>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="dashboard-details-grid">
        {/* Left Side: Pipeline distribution */}
        <div className="dashboard-panel glass-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Pipeline Stage Distribution</h3>
              <p className="panel-subtitle">Volume and total estimated value per pipeline stage</p>
            </div>
          </div>

          <div className="pipeline-progress-list">
            {stageDistribution.map((item) => {
              const totalActiveValue = summary.totalPipeline || 1;
              const percentage = Math.round((item.value / totalActiveValue) * 100) || 0;
              
              // Get stage theme keys
              let stageKey = 'new';
              if (item.stage === 'Contacted') stageKey = 'contacted';
              else if (item.stage === 'Qualified') stageKey = 'qualified';
              else if (item.stage === 'Proposal Sent') stageKey = 'proposal-sent';
              else if (item.stage === 'Won') stageKey = 'won';
              else if (item.stage === 'Lost') stageKey = 'lost';

              return (
                <div key={item.stage} className="progress-item">
                  <div className="progress-item-header">
                    <span className="progress-item-label">
                      <span className={`progress-item-dot ${stageKey}`} />
                      {item.stage}
                    </span>
                    <span className="progress-item-stats">
                      <strong>{item.count} leads</strong> · {formatCurrency(item.value)} ({percentage}%)
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className={`progress-bar-fill ${stageKey}`} 
                      style={{ 
                        width: `${Math.max(percentage, item.count > 0 ? 3 : 0)}%`,
                        backgroundColor: `hsl(var(--status-${stageKey === 'proposal-sent' ? 'proposal' : stageKey}))` 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Conversion Ring & Recent Leads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Conversion Ring Widget */}
          <div className="dashboard-panel glass-panel conversion-widget">
            <h3 className="panel-title" style={{ alignSelf: 'flex-start' }}>Win Performance</h3>
            <div className="radial-container">
              <svg className="radial-svg" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--accent-primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent-secondary))" />
                  </linearGradient>
                </defs>
                <circle className="radial-track" cx="80" cy="80" r="70" />
                <circle 
                  className="radial-indicator" 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  strokeDasharray={strokeCircumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="radial-overlay">
                <span className="radial-percentage">{summary.conversionRate}%</span>
                <span className="radial-label">Won Ratio</span>
              </div>
            </div>
            <p className="panel-subtitle" style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
              Shows percentage of closed client engagements converted successfully.
            </p>
          </div>

          {/* Recent Leads Widget */}
          <div className="dashboard-panel glass-panel">
            <h3 className="panel-title">Recent Submissions</h3>
            <div className="recent-leads-list">
              {recentLeads.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '16px 0', fontSize: '0.85rem' }}>
                  No lead form submissions received yet.
                </p>
              ) : (
                recentLeads.map((lead) => {
                  let initial = lead.name.charAt(0).toUpperCase();
                  let stageKey = lead.status.toLowerCase().replace(' ', '-');
                  return (
                    <div 
                      key={lead.id} 
                      className="recent-lead-row" 
                      onClick={() => onOpenLeadDrawer(lead.id)}
                    >
                      <div className="recent-lead-info">
                        <div className="avatar-initial">{initial}</div>
                        <div className="recent-lead-meta">
                          <span className="recent-lead-name">{lead.name}</span>
                          <span className="recent-lead-company">{lead.company || 'Personal Lead'}</span>
                        </div>
                      </div>
                      <div className="recent-lead-val-status">
                        <span className="recent-lead-value">{formatCurrency(parseFloat(lead.value))}</span>
                        <span className={`status-badge ${stageKey}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
