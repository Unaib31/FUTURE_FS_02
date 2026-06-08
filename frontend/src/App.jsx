import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import KanbanBoard from './components/KanbanBoard';
import LeadTable from './components/LeadTable';
import LeadFormSimulator from './components/LeadFormSimulator';
import LeadDetailsDrawer from './components/LeadDetailsDrawer';
import Login from './components/Login';

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
  
  // Auth state management
  const [token, setToken] = useState(() => {
    return localStorage.getItem('crm-token') || null;
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Listen for global unauthenticated errors to redirect to login
  useEffect(() => {
    const handleAuthError = () => {
      handleLogout();
    };
    window.addEventListener('crm-unauthorized', handleAuthError);
    return () => window.removeEventListener('crm-unauthorized', handleAuthError);
  }, []);

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

  const handleLoginSuccess = (newToken, loggedUser) => {
    setToken(newToken);
    setUser(loggedUser);
    localStorage.setItem('crm-token', newToken);
    localStorage.setItem('crm-user', JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('crm-token');
    localStorage.removeItem('crm-user');
  };

  // If not authenticated, serve the Login panel
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render the appropriate panel based on currentTab
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview onOpenLeadDrawer={setSelectedLeadId} token={token} />;
      case 'kanban':
        return <KanbanBoard onOpenLeadDrawer={setSelectedLeadId} token={token} />;
      case 'leads':
        return <LeadTable onOpenLeadDrawer={setSelectedLeadId} token={token} />;
      case 'simulator':
        return <LeadFormSimulator />;
      default:
        return <DashboardOverview onOpenLeadDrawer={setSelectedLeadId} token={token} />;
    }
  };

  // Dynamic header titles
  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'CRM Metrics Center',
          subtitle: `Active pipeline summary for ${user ? user.username : 'Administrator'}`
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
        onLogout={handleLogout}
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
              SECURE SESSION
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
            token={token}
          />
        )}
      </main>
    </div>
  );
}

