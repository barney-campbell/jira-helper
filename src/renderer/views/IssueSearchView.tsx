import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DataGrid, Column } from '../components/DataGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { JiraIssue } from '../types';
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
      const data = await window.electronAPI.searchIssues(searchQuery);
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
          placeholder="Enter JQL query (e.g., project = MYPROJECT AND status = Open)"
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
