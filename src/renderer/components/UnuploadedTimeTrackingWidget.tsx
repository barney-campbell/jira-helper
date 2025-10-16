import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from './Button';
import { DataGrid, Column } from './DataGrid';
import { LoadingSpinner } from './LoadingSpinner';
import type { TimeTrackingRecord } from '../../common/types';

const WidgetContainer = styled.div`
  max-width: 600px;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    margin-bottom: 15px;
    font-size: 18px;
  }
`;

const WidgetFooter = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
`;

export const UnuploadedTimeTrackingWidget: React.FC = () => {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecords();
    const interval = setInterval(loadRecords, 1000);
    return () => clearInterval(interval);
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
    { header: 'Issue Key', accessor: 'issueKey', width: '30%' },
    { header: 'Started', accessor: 'startTime', width: '40%' },
    { header: 'Elapsed', accessor: 'elapsed', width: '30%' }
  ];

  const displayData = records.map(record => ({
    issueKey: record.issueKey,
    startTime: formatDateTime(record.startTime),
    elapsed: formatElapsed(record.startTime, record.endTime)
  }));

  return (
    <WidgetContainer>
      <h3>Unuploaded Time Tracking Logs</h3>
      <DataGrid columns={columns} data={displayData} />
      <WidgetFooter>
        <Button onClick={handleUploadAll} disabled={loading || records.length === 0}>
          {loading ? <LoadingSpinner size="small" /> : 'Upload All to Jira'}
        </Button>
      </WidgetFooter>
    </WidgetContainer>
  );
};
