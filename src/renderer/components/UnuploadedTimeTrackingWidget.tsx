import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { DataGrid, Column } from './DataGrid';
import { LoadingSpinner } from './LoadingSpinner';
import { WidgetContainer, WidgetFooter } from './Widget';
import type { TimeTrackingRecord } from '../../common/types';

interface UnuploadedTimeTrackingWidgetProps {
  onIssueDoubleClick?: (issueKey: string) => void;
}

export const UnuploadedTimeTrackingWidget: React.FC<UnuploadedTimeTrackingWidgetProps> = ({ onIssueDoubleClick }) => {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecords();
    const interval = setInterval(loadRecords, 1000);
    
    // Set up listener for time tracking changes
    const removeListener = window.electronAPI.onTimeTrackingChanged(() => {
      loadRecords();
    });

    return () => {
      clearInterval(interval);
      removeListener();
    };
  }, []);

  const loadRecords = async () => {
    try {
      const data = await window.electronAPI.getUnsentTimeTrackingRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error loading unsent records:', error);
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

  const handleDelete = async (recordId: number) => {
    try {
      await window.electronAPI.deleteTimeTrackingRecord(recordId);
      await loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  const handleUploadAll = async () => {
    setLoading(true);
    let success = 0;
    let fail = 0;

    for (const record of records) {
      if (!record.endTime) continue;
      
      const duration = new Date(record.endTime).getTime() - new Date(record.startTime).getTime();
      const timeSpentSeconds = Math.floor(duration / 1000);

      try {
        await window.electronAPI.uploadTimeTracking(
          record.issueKey,
          timeSpentSeconds,
          new Date(record.startTime)
        );
        await window.electronAPI.markAsUploaded(record.id);
        success++;
      } catch (error) {
        console.error(`Failed to upload record ${record.id}:`, error);
        fail++;
      }
    }

    setLoading(false);
    alert(`Uploaded ${success} time tracking records. ${fail} failed.`);
    await loadRecords();
  };

  const columns: Column<any>[] = [
    { header: 'Issue Key', accessor: 'issueKey', width: '25%' },
    { header: 'Started', accessor: 'startTime', width: '35%' },
    { header: 'Elapsed', accessor: 'elapsed', width: '20%' },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <Button variant="danger" onClick={() => handleDelete(row.id)}>
          Delete
        </Button>
      ),
      width: '20%'
    }
  ];

  const displayData = records.map(record => ({
    id: record.id,
    issueKey: record.issueKey,
    startTime: formatDateTime(record.startTime),
    elapsed: formatElapsed(record.startTime, record.endTime)
  }));

  return (
    <WidgetContainer>
      <h3>Unuploaded Time Tracking Logs</h3>
      <DataGrid 
        columns={columns} 
        data={displayData}
        onRowDoubleClick={(row) => onIssueDoubleClick?.(row.issueKey)}
      />
      <WidgetFooter>
        <Button onClick={handleUploadAll} disabled={loading || records.length === 0}>
          {loading ? <LoadingSpinner size="small" /> : 'Upload All to Jira'}
        </Button>
      </WidgetFooter>
    </WidgetContainer>
  );
};
