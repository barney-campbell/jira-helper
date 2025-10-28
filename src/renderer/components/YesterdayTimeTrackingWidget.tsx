import React, { useState, useEffect } from 'react';
import { DataGrid, Column } from './DataGrid';
import { WidgetContainer } from './Widget';
import type { TimeTrackingRecord } from '../../common/types';

interface YesterdayTimeTrackingWidgetProps {
  onIssueDoubleClick?: (issueKey: string) => void;
}

export const YesterdayTimeTrackingWidget: React.FC<YesterdayTimeTrackingWidgetProps> = ({ onIssueDoubleClick }) => {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

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

  const columns: Column<DisplayRecord>[] = [
    { header: 'Issue Key', accessor: 'issueKey', width: '20%' },
    { header: 'Summary', accessor: 'summary', width: '35%' },
    { header: 'Started', accessor: 'startTime', width: '25%' },
    { header: 'Duration', accessor: 'elapsed', width: '20%' }
  ];

  const displayData: DisplayRecord[] = records.map(record => ({
    id: record.id,
    issueKey: record.issueKey,
    summary: summaries[record.issueKey] || 'Loading...',
    startTime: formatDateTime(record.startTime),
    elapsed: formatElapsed(record.startTime, record.endTime)
  }));

  return (
    <WidgetContainer>
      <h3>{getYesterdayLabel()} Time Tracking</h3>
      <DataGrid 
        columns={columns} 
        data={displayData}
        onRowDoubleClick={(row) => onIssueDoubleClick?.(row.issueKey)}
      />
    </WidgetContainer>
  );
};
