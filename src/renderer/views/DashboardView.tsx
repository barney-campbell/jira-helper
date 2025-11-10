import React from "react";
import styled from "styled-components";
import { UnuploadedTimeTrackingWidget } from "../components/UnuploadedTimeTrackingWidget";
import { ActiveTimeTrackingWidget } from "../components/ActiveTimeTrackingWidget";
import { YesterdayTimeTrackingWidget } from "../components/YesterdayTimeTrackingWidget";

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: ${(props) => props.theme.colors.text};
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

const YesterdayWidgetContainer = styled.div`
  grid-column: span 2;

  @media (max-width: 1024px) {
    grid-column: span 1;
  }
`;

interface DashboardViewProps {
  onIssueDoubleClick?: (issueKey: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onIssueDoubleClick,
}) => {
  return (
    <DashboardContainer>
      <h1>Jira Dashboard</h1>
      <DashboardWidgets>
        <ActiveTimeTrackingWidget onIssueDoubleClick={onIssueDoubleClick} />
        <UnuploadedTimeTrackingWidget onIssueDoubleClick={onIssueDoubleClick} />
        <YesterdayWidgetContainer>
          <YesterdayTimeTrackingWidget
            onIssueDoubleClick={onIssueDoubleClick}
          />
        </YesterdayWidgetContainer>
      </DashboardWidgets>
    </DashboardContainer>
  );
};
