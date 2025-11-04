import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { DataGrid, Column, SortConfig, SortDirection } from './DataGrid';
import type { JiraIssue } from '../../common/types';

interface IssueTableProps {
  issues: JiraIssue[];
  onIssueDoubleClick?: (issue: JiraIssue) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const FilterSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}33;
  }
`;

const ClearButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultCount = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin-left: auto;
`;

export const IssueTable: React.FC<IssueTableProps> = ({ issues, onIssueDoubleClick }) => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ columnIndex: -1, direction: null });

  // Extract unique values for filters
  const { statuses, assignees, projects } = useMemo(() => {
    const statusSet = new Set<string>();
    const assigneeSet = new Set<string>();
    const projectSet = new Set<string>();

    issues.forEach(issue => {
      if (issue.status) statusSet.add(issue.status);
      if (issue.assignee) assigneeSet.add(issue.assignee);
      if (issue.project) projectSet.add(issue.project);
    });

    return {
      statuses: Array.from(statusSet).sort(),
      assignees: Array.from(assigneeSet).sort(),
      projects: Array.from(projectSet).sort()
    };
  }, [issues]);

  // Filter and sort issues
  const filteredAndSortedIssues = useMemo(() => {
    // First, filter the issues
    let result = issues.filter(issue => {
      if (statusFilter && issue.status !== statusFilter) return false;
      if (assigneeFilter && issue.assignee !== assigneeFilter) return false;
      if (projectFilter && (issue.project || '') !== projectFilter) return false;
      return true;
    });

    // Then, sort if a column is selected
    if (sortConfig.columnIndex !== -1 && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // Get values based on column index
        switch (sortConfig.columnIndex) {
          case 0: // Key
            aValue = a.key;
            bValue = b.key;
            break;
          case 1: // Summary
            aValue = a.summary;
            bValue = b.summary;
            break;
          case 2: // Status
            aValue = a.status;
            bValue = b.status;
            break;
          case 3: // Assignee
            aValue = a.assignee;
            bValue = b.assignee;
            break;
          case 4: // Project
            aValue = a.project || '';
            bValue = b.project || '';
            break;
          default:
            return 0;
        }

        // Compare values
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [issues, statusFilter, assigneeFilter, projectFilter, sortConfig]);

  const hasActiveFilters = statusFilter || assigneeFilter || projectFilter;

  const handleClearFilters = () => {
    setStatusFilter('');
    setAssigneeFilter('');
    setProjectFilter('');
  };

  const handleSort = (columnIndex: number) => {
    setSortConfig(prevConfig => {
      // If clicking the same column, cycle through: asc -> desc -> null
      if (prevConfig.columnIndex === columnIndex) {
        if (prevConfig.direction === 'asc') {
          return { columnIndex, direction: 'desc' };
        } else if (prevConfig.direction === 'desc') {
          return { columnIndex: -1, direction: null };
        }
      }
      // If clicking a new column, start with asc
      return { columnIndex, direction: 'asc' };
    });
  };

  const columns: Column<JiraIssue>[] = [
    { header: 'Key', accessor: 'key', width: '100px' },
    { header: 'Summary', accessor: 'summary', width: '500px' },
    { header: 'Status', accessor: 'status', width: '150px' },
    { header: 'Assignee', accessor: 'assignee', width: '150px' },
    { header: 'Project', accessor: (row) => row.project || '', width: '150px' }
  ];

  return (
    <Container>
      <FilterBar>
        <FilterGroup>
          <FilterLabel>Status:</FilterLabel>
          <FilterSelect 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Assignee:</FilterLabel>
          <FilterSelect 
            value={assigneeFilter} 
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="">All</option>
            {assignees.map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Project:</FilterLabel>
          <FilterSelect 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <ClearButton 
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </ClearButton>

        <ResultCount>
          Showing {filteredAndSortedIssues.length} of {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </ResultCount>
      </FilterBar>

      <DataGrid 
        columns={columns} 
        data={filteredAndSortedIssues} 
        onRowDoubleClick={onIssueDoubleClick}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </Container>
  );
};
