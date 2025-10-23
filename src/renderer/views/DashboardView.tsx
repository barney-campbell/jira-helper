import React from 'react';
import styled from 'styled-components';
import { UnuploadedTimeTrackingWidget } from '../components/UnuploadedTimeTrackingWidget';

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

export const DashboardView: React.FC = () => {
  return (
    <DashboardContainer>
      <h1>Jira Dashboard</h1>
      <DashboardWidgets>
        <UnuploadedTimeTrackingWidget />
      </DashboardWidgets>
    </DashboardContainer>
  );
};
