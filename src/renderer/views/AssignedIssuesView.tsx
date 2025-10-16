import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { DataGrid, Column } from '../components/DataGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { JiraIssue } from '../../common/types';
import '../styles/views.css';

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

  const columns: Column<JiraIssue>[] = [
    { header: 'Key', accessor: 'key', width: '100px' },
    { header: 'Summary', accessor: 'summary', width: '700px' },
    { header: 'Status', accessor: 'status', width: '200px' },
    { header: 'Assignee', accessor: 'assignee', width: '120px' }
  ];

  return (
    <div className="assigned-issues-view">
      <h2>Assigned Jira Issues</h2>
      <div className="view-header">
        <div className="updated-info">
          {lastUpdated && (
            <>
              <span>Updated: </span>
              <strong>{lastUpdated.toLocaleString()}</strong>
            </>
          )}
          {loading && <LoadingSpinner size="small" />}
        </div>
        <Button onClick={loadIssues} disabled={loading}>
          Refresh
        </Button>
      </div>
      <DataGrid columns={columns} data={issues} onRowDoubleClick={onIssueDoubleClick} />
    </div>
  );
};
