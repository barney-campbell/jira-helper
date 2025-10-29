import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DataGrid, Column } from './DataGrid';
import { WidgetContainer } from './Widget';
import { Button } from './Button';
import type { TimeTrackingRecord } from '../../common/types';

interface YesterdayTimeTrackingWidgetProps {
  onIssueDoubleClick?: (issueKey: string) => void;
}

const WidgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  h3 {
    margin: 0;
    font-size: 18px;
    color: ${props => props.theme.colors.text};
  }
`;

export const YesterdayTimeTrackingWidget: React.FC<YesterdayTimeTrackingWidgetProps> = ({ onIssueDoubleClick }) => {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);

  useEffect(() => {
    loadRecords();
    
    // Set up listener for time tracking changes
    const removeListener = window.electronAPI.onTimeTrackingChanged(() => {
      loadRecords();
    });

    return () => {
      removeListener();
    };
  }, []);

  const loadRecords = async () => {
    try {
      const data = await window.electronAPI.getYesterdayTimeTrackingRecords();
      setRecords(data);
      
      // Extract unique issue keys
      const uniqueIssueKeys = Array.from(new Set(data.map(record => record.issueKey)));
      
      // Fetch summaries for unique issues
      if (uniqueIssueKeys.length > 0) {
        const fetchedSummaries = await window.electronAPI.getIssueSummaries(uniqueIssueKeys);
        setSummaries(fetchedSummaries);
      }
    } catch (error) {
      console.error('Error loading yesterday records:', error);
    }
  };

  const formatElapsed = (start: Date, end?: Date): string => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatDateTime = (date: Date): string => {
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  const getYesterdayLabel = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Monday
    if (dayOfWeek === 1) {
      return 'Yesterday (Friday)';
    }
    // Sunday
    else if (dayOfWeek === 0) {
      return 'Yesterday (Friday)';
    }
    // Other days
    else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Yesterday (${days[yesterday.getDay()]})`;
    }
  };

  type DisplayRecord = {
    id: number;
    issueKey: string;
    summary: string;
    startTime: string;
    elapsed: string;
  };

  type CompactDisplayRecord = {
    issueKey: string;
    summary: string;
    totalDuration: string;
    logCount: number;
  };

  // Aggregate records by issue key for compact mode
  const aggregateRecords = (): CompactDisplayRecord[] => {
    const aggregated = new Map<string, { totalMs: number; count: number }>();

    records.forEach(record => {
      const startTime = new Date(record.startTime);
      const endTime = record.endTime ? new Date(record.endTime) : new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      if (aggregated.has(record.issueKey)) {
        const existing = aggregated.get(record.issueKey)!;
        existing.totalMs += durationMs;
        existing.count += 1;
      } else {
        aggregated.set(record.issueKey, { totalMs: durationMs, count: 1 });
      }
    });

    return Array.from(aggregated.entries()).map(([issueKey, data]) => {
      const hours = Math.floor(data.totalMs / 3600000);
      const minutes = Math.floor((data.totalMs % 3600000) / 60000);
      const seconds = Math.floor((data.totalMs % 60000) / 1000);
      
      return {
        issueKey,
        summary: summaries[issueKey] || 'Loading...',
        totalDuration: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        logCount: data.count
      };
    });
  };

  const detailedColumns: Column<DisplayRecord>[] = [
    { header: 'Issue Key', accessor: 'issueKey', width: '20%' },
    { header: 'Summary', accessor: 'summary', width: '35%' },
    { header: 'Started', accessor: 'startTime', width: '25%' },
    { header: 'Duration', accessor: 'elapsed', width: '20%' }
  ];

  const compactColumns: Column<CompactDisplayRecord>[] = [
    { header: 'Issue Key', accessor: 'issueKey', width: '20%' },
    { header: 'Summary', accessor: 'summary', width: '50%' },
    { header: 'Total Duration', accessor: 'totalDuration', width: '20%' },
    { header: 'Logs', accessor: (row) => row.logCount.toString(), width: '10%' }
  ];

  const detailedDisplayData: DisplayRecord[] = records.map(record => ({
    id: record.id,
    issueKey: record.issueKey,
    summary: summaries[record.issueKey] || 'Loading...',
    startTime: formatDateTime(record.startTime),
    elapsed: formatElapsed(record.startTime, record.endTime)
  }));

  const compactDisplayData = aggregateRecords();

  return (
    <WidgetContainer>
      <WidgetHeader>
        <h3>{getYesterdayLabel()} Time Tracking</h3>
        <Button 
          variant="secondary" 
          onClick={() => setIsCompactMode(!isCompactMode)}
        >
          {isCompactMode ? 'Show Details' : 'Compact View'}
        </Button>
      </WidgetHeader>
      {isCompactMode ? (
        <DataGrid 
          columns={compactColumns} 
          data={compactDisplayData}
          onRowDoubleClick={(row) => onIssueDoubleClick?.(row.issueKey)}
        />
      ) : (
        <DataGrid 
          columns={detailedColumns} 
          data={detailedDisplayData}
          onRowDoubleClick={(row) => onIssueDoubleClick?.(row.issueKey)}
        />
      )}
    </WidgetContainer>
  );
};
