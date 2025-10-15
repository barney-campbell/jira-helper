import React, { useState } from 'react';
import { DashboardView } from './views/DashboardView';
import { AssignedIssuesView } from './views/AssignedIssuesView';
import { IssueSearchView } from './views/IssueSearchView';
import { IssueDetailsView } from './views/IssueDetailsView';
import { SettingsView } from './views/SettingsView';
import type { ViewType, JiraIssue } from './types';
import './styles/app.css';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);

  const handleIssueDoubleClick = (issue: JiraIssue) => {
    setSelectedIssueKey(issue.key);
    setCurrentView('issueDetails');
  };

  const handleSettingsSaved = () => {
    // Refresh the current view after settings are saved
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'assignedIssues':
        return <AssignedIssuesView onIssueDoubleClick={handleIssueDoubleClick} />;
      case 'search':
        return <IssueSearchView onIssueDoubleClick={handleIssueDoubleClick} />;
      case 'issueDetails':
        return selectedIssueKey ? <IssueDetailsView issueKey={selectedIssueKey} /> : <DashboardView />;
      case 'settings':
        return <SettingsView onSave={handleSettingsSaved} />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <button
          className={`sidebar-button ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
          title="Dashboard"
        >
          <span className="icon">📊</span>
        </button>
        <button
          className={`sidebar-button ${currentView === 'assignedIssues' ? 'active' : ''}`}
          onClick={() => setCurrentView('assignedIssues')}
          title="Assigned Issues"
        >
          <span className="icon">📋</span>
        </button>
        <button
          className={`sidebar-button ${currentView === 'search' ? 'active' : ''}`}
          onClick={() => setCurrentView('search')}
          title="Search"
        >
          <span className="icon">🔍</span>
        </button>
        <div className="sidebar-spacer"></div>
        <button
          className={`sidebar-button ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
          title="Settings"
        >
          <span className="icon">⚙️</span>
        </button>
      </div>
      <div className="main-content">
        {renderView()}
      </div>
    </div>
  );
};
