import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import KanbanBoard from './components/KanbanBoard';
import LeadTable from './components/LeadTable';
import LeadFormSimulator from './components/LeadFormSimulator';
import LeadDetailsDrawer from './components/LeadDetailsDrawer';

// Import CSS Files
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/kanban.css';
import './styles/lead-table.css';
import './styles/lead-drawer.css';
import './styles/simulator.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Theme management (Dark Mode default)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('crm-theme') || 'dark';
  });

  useEffect(() => {
    // Apply the theme attribute onto HTML root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('crm-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Render the appropriate panel based on currentTab
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview onOpenLeadDrawer={setSelectedLeadId} />;
      case 'kanban':
        return <KanbanBoard onOpenLeadDrawer={setSelectedLeadId} />;
      case 'leads':
        return <LeadTable onOpenLeadDrawer={setSelectedLeadId} />;
      case 'simulator':
        return <LeadFormSimulator />;
      default:
        return <DashboardOverview onOpenLeadDrawer={setSelectedLeadId} />;
    }
  };

  // Dynamic header titles
  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'CRM Metrics Center',
          subtitle: 'Real-time sales conversion ratios and active pipeline valuations'
        };
      case 'kanban':
        return {
          title: 'Sales Pipeline Board',
          subtitle: 'Transition client deals across negotiation stages'
        };
      case 'leads':
        return {
          title: 'Lead Registry Directory',
          subtitle: 'Search, sort, filter, and delete active client files'
        };
      case 'simulator':
        return {
          title: 'Contact Form Ingestion Console',
          subtitle: 'Simulate submissions and copy embed form snippets'
        };
      default:
        return {
          title: 'Clientflow CRM',
          subtitle: 'Manage client leads seamlessly'
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main workspace */}
      <main className="main-content">
        {/* Dynamic header bar */}
        <header className="content-header">
          <div className="header-title-area">
            <h1 className="header-title">{headerMeta.title}</h1>
            <span className="header-subtitle">{headerMeta.subtitle}</span>
          </div>
          
          <div className="header-actions">
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'hsl(var(--text-muted))', 
              fontWeight: '600', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border-color))',
              background: 'hsl(var(--bg-tertiary))'
            }}>
              SYSTEM ONLINE
            </span>
          </div>
        </header>

        {/* Dynamic tab page */}
        {renderContent()}

        {/* Global Details drawer overlay (renders when a lead ID is chosen) */}
        {selectedLeadId && (
          <LeadDetailsDrawer 
            leadId={selectedLeadId} 
            onClose={() => setSelectedLeadId(null)}
          />
        )}
      </main>
    </div>
  );
}
