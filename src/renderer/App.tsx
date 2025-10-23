import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { DashboardView } from './views/DashboardView';
import { AssignedIssuesView } from './views/AssignedIssuesView';
import { IssueSearchView } from './views/IssueSearchView';
import { IssueDetailsView } from './views/IssueDetailsView';
import { SettingsView } from './views/SettingsView';
import type { ViewType, JiraIssue } from './types';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 70px;
  background-color: #222;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`;

const SidebarButton = styled.button<{ $active: boolean }>`
  width: 50px;
  height: 50px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  ${props => props.$active && `
    background-color: rgba(255, 255, 255, 0.2);
  `}

  .icon {
    font-size: 24px;
  }
`;

const SidebarSpacer = styled.div`
  flex: 1;
`;

const MainContent = styled.div`
  flex: 1;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 20px;
`;

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);

  const handleIssueDoubleClick = (issue: JiraIssue) => {
    setSelectedIssueKey(issue.key);
    setCurrentView('issueDetails');
  };

  const handleIssueKeyDoubleClick = (issueKey: string) => {
    setSelectedIssueKey(issueKey);
    setCurrentView('issueDetails');
  };

  const handleSettingsSaved = () => {
    // Refresh the current view after settings are saved
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onIssueDoubleClick={handleIssueKeyDoubleClick} />;
      case 'assignedIssues':
        return <AssignedIssuesView onIssueDoubleClick={handleIssueDoubleClick} />;
      case 'search':
        return <IssueSearchView onIssueDoubleClick={handleIssueDoubleClick} />;
      case 'issueDetails':
        return selectedIssueKey ? <IssueDetailsView issueKey={selectedIssueKey} /> : <DashboardView onIssueDoubleClick={handleIssueKeyDoubleClick} />;
      case 'settings':
        return <SettingsView onSave={handleSettingsSaved} />;
      default:
        return <DashboardView onIssueDoubleClick={handleIssueKeyDoubleClick} />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Sidebar>
          <SidebarButton
            $active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
            title="Dashboard"
          >
            <span className="icon">📊</span>
          </SidebarButton>
          <SidebarButton
            $active={currentView === 'assignedIssues'}
            onClick={() => setCurrentView('assignedIssues')}
            title="Assigned Issues"
          >
            <span className="icon">📋</span>
          </SidebarButton>
          <SidebarButton
            $active={currentView === 'search'}
            onClick={() => setCurrentView('search')}
            title="Search"
          >
            <span className="icon">🔍</span>
          </SidebarButton>
          <SidebarSpacer />
          <SidebarButton
            $active={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
            title="Settings"
          >
            <span className="icon">⚙️</span>
          </SidebarButton>
        </Sidebar>
        <MainContent>
          {renderView()}
        </MainContent>
      </AppContainer>
    </>
  );
};
