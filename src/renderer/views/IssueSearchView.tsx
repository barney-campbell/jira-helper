import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
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

const SearchBar = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
`;

const SearchInput = styled(Input)`
  flex: 1;
`;

const ResultText = styled.div`
  margin-bottom: 15px;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
`;

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

  return (
    <ViewContainer>
      <h2>Search Jira Issues</h2>
      <SearchBar>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Enter key (JRA-1234) or search term"
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} disabled={loading}>
          Search
        </Button>
        {loading && <LoadingSpinner size="small" />}
      </SearchBar>
      {resultText && <ResultText>{resultText}</ResultText>}
      <IssueTable issues={results} onIssueDoubleClick={onIssueDoubleClick} />
    </ViewContainer>
  );
};
