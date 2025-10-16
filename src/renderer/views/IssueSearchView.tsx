import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DataGrid, Column } from '../components/DataGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { JiraIssue } from '../../common/types';
import '../styles/views.css';

interface IssueSearchViewProps {
  onIssueDoubleClick: (issue: JiraIssue) => void;
}

export const IssueSearchView: React.FC<IssueSearchViewProps> = ({ onIssueDoubleClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResultText('');
    try {
      const isJiraKey = /^[A-Z]+-\d+$/i.test(searchQuery);
      let data: JiraIssue[] = [];

      if (isJiraKey) {
        // Try to get the specific issue by key
        const issue = await window.electronAPI.getIssue(searchQuery);
        if (issue) {
          data = [issue];
        } else {
          data = [];
        }
      } else {
        // Perform keyword search using JQL, order by updated date descending
        const jql = `summary ~ "${searchQuery}" OR description ~ "${searchQuery}" ORDER BY updated DESC`;
        data = await window.electronAPI.searchIssues(jql);
      }

      const jql = `summary ~ "${searchQuery}" OR description ~ "${searchQuery}" ORDER BY updated DESC`;
      setResults(data);
      setResultText(`Found ${data.length} issue(s)`);
    } catch (error) {
      console.error('Error searching issues:', error);
      setResultText('Error searching issues');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const columns: Column<JiraIssue>[] = [
    { header: 'Key', accessor: 'key', width: '100px' },
    { header: 'Summary', accessor: 'summary', width: '700px' },
    { header: 'Status', accessor: 'status', width: '200px' },
    { header: 'Assignee', accessor: 'assignee', width: '120px' }
  ];

  return (
    <div className="search-view">
      <h2>Search Jira Issues</h2>
      <div className="search-bar">
        <Input
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Enter key (JRA-1234) or search term"
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        <Button onClick={handleSearch} disabled={loading}>
          Search
        </Button>
        {loading && <LoadingSpinner size="small" />}
      </div>
      {resultText && <div className="result-text">{resultText}</div>}
      <DataGrid columns={columns} data={results} onRowDoubleClick={onIssueDoubleClick} />
    </div>
  );
};
