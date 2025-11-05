import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { IssueTable } from '../components/IssueTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { JiraIssue } from '../../common/types';

const ViewContainer = styled.div`
  background-color: ${props => props.theme.colors.surface};
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin-bottom: 20px;
    color: ${props => props.theme.colors.text};
  }
`;

const ViewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const UpdatedInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
`;

const SectionHeading = styled.h3`
  margin-top: 40px;
  margin-bottom: 20px;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 18px;
  font-weight: 500;
`;

interface AssignedIssuesViewProps {
  onIssueDoubleClick: (issue: JiraIssue) => void;
}

export const AssignedIssuesView: React.FC<AssignedIssuesViewProps> = ({ onIssueDoubleClick }) => {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getAssignedIssues('currentuser()');
      setIssues(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading assigned issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const { activeIssues, doneIssues } = useMemo(() => {
    const active: JiraIssue[] = [];
    const done: JiraIssue[] = [];
    
    issues.forEach(issue => {
      if (issue.status === 'Done') {
        done.push(issue);
      } else {
        active.push(issue);
      }
    });
    
    return { activeIssues: active, doneIssues: done };
  }, [issues]);

  return (
    <ViewContainer>
      <h2>Assigned Jira Issues</h2>
      <ViewHeader>
        <UpdatedInfo>
          {lastUpdated && (
            <>
              <span>Updated: </span>
              <strong>{lastUpdated.toLocaleString()}</strong>
            </>
          )}
          {loading && <LoadingSpinner size="small" />}
        </UpdatedInfo>
        <Button onClick={loadIssues} disabled={loading}>
          Refresh
        </Button>
      </ViewHeader>
      <IssueTable issues={activeIssues} onIssueDoubleClick={onIssueDoubleClick} />
      
      {doneIssues.length > 0 && (
        <>
          <SectionHeading>Done</SectionHeading>
          <IssueTable issues={doneIssues} onIssueDoubleClick={onIssueDoubleClick} />
        </>
      )}
    </ViewContainer>
  );
};
