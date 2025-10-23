import React from 'react';
import styled from 'styled-components';
import { UnuploadedTimeTrackingWidget } from '../components/UnuploadedTimeTrackingWidget';
import { ActiveTimeTrackingWidget } from '../components/ActiveTimeTrackingWidget';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }
`;

const DashboardWidgets = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

interface DashboardViewProps {
  onIssueDoubleClick?: (issueKey: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onIssueDoubleClick }) => {
  return (
    <DashboardContainer>
      <h1>Jira Dashboard</h1>
      <DashboardWidgets>
        <ActiveTimeTrackingWidget onIssueDoubleClick={onIssueDoubleClick} />
        <UnuploadedTimeTrackingWidget />
      </DashboardWidgets>
    </DashboardContainer>
  );
};
