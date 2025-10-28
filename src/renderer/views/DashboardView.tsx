import React from 'react';
import styled from 'styled-components';
import { UnuploadedTimeTrackingWidget } from '../components/UnuploadedTimeTrackingWidget';
import { ActiveTimeTrackingWidget } from '../components/ActiveTimeTrackingWidget';
import { YesterdayTimeTrackingWidget } from '../components/YesterdayTimeTrackingWidget';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: ${props => props.theme.colors.text};
  }
`;

const DashboardWidgets = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
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
        <YesterdayTimeTrackingWidget onIssueDoubleClick={onIssueDoubleClick} />
      </DashboardWidgets>
    </DashboardContainer>
  );
};
