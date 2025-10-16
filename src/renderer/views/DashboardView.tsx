import React from 'react';
import { UnuploadedTimeTrackingWidget } from '../components/UnuploadedTimeTrackingWidget';
import '../styles/views.css';

export const DashboardView: React.FC = () => {
  return (
    <div className="dashboard-view">
      <h1>Jira Dashboard</h1>
      <div className="dashboard-widgets">
        <UnuploadedTimeTrackingWidget />
      </div>
    </div>
  );
};
