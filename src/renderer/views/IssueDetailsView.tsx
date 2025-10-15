import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { DataGrid, Column } from '../components/DataGrid';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import type { JiraIssue, TimeTrackingRecord, JiraWorklog, TimeTrackingDisplay } from '../types';
import '../styles/views.css';

interface IssueDetailsViewProps {
  issueKey: string;
}

export const IssueDetailsView: React.FC<IssueDetailsViewProps> = ({ issueKey }) => {
  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [timeRecords, setTimeRecords] = useState<TimeTrackingRecord[]>([]);
  const [jiraWorklogs, setJiraWorklogs] = useState<JiraWorklog[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimeTrackingRecord | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  useEffect(() => {
    loadIssue();
    loadTimeTracking();
    loadBaseUrl();

    const interval = setInterval(loadTimeTracking, 1000);
    return () => clearInterval(interval);
  }, [issueKey]);

  const loadIssue = async () => {
    try {
      const data = await window.electronAPI.getIssue(issueKey);
      setIssue(data);
    } catch (error) {
      console.error('Error loading issue:', error);
    }
  };

  const loadTimeTracking = async () => {
    try {
      const records = await window.electronAPI.getTimeTrackingRecords(issueKey);
      setTimeRecords(records);
      
      const hasActive = records.some(r => !r.endTime);
      setIsTracking(hasActive);

      const worklogs = await window.electronAPI.getWorklogs(issueKey);
      setJiraWorklogs(worklogs);
    } catch (error) {
      console.error('Error loading time tracking:', error);
    }
  };

  const loadBaseUrl = async () => {
    try {
      const url = await window.electronAPI.getBaseUrl();
      setBaseUrl(url);
    } catch (error) {
      console.error('Error loading base URL:', error);
    }
  };

  const handleStartTracking = async () => {
    try {
      await window.electronAPI.startTracking(issueKey);
      await loadTimeTracking();
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  const handleStopTracking = async () => {
    try {
      await window.electronAPI.stopTracking(issueKey);
      await loadTimeTracking();
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const handleEditRecord = (record: TimeTrackingRecord) => {
    setEditingRecord(record);
    setEditStartTime(formatDateTimeForInput(record.startTime));
    setEditEndTime(record.endTime ? formatDateTimeForInput(record.endTime) : '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const updated: TimeTrackingRecord = {
        ...editingRecord,
        startTime: new Date(editStartTime),
        endTime: editEndTime ? new Date(editEndTime) : undefined
      };
      await window.electronAPI.updateTimeTrackingRecord(updated);
      setEditModalOpen(false);
      await loadTimeTracking();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await window.electronAPI.deleteTimeTrackingRecord(recordId);
      await loadTimeTracking();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const formatDateTimeForInput = (date: Date): string => {
    const d = new Date(date);
    return d.toISOString().substring(0, 19);
  };

  const formatDuration = (seconds: number, isActive: boolean = false): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return isActive ? `${formatted} (Active)` : formatted;
  };

  const formatDateTime = (date: Date): string => {
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  const getDisplayRecords = (): TimeTrackingDisplay[] => {
    const displays: TimeTrackingDisplay[] = [];
    let totalSeconds = 0;

    // Local records
    for (const record of timeRecords) {
      const startTime = new Date(record.startTime);
      const endTime = record.endTime ? new Date(record.endTime) : new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      totalSeconds += duration;

      displays.push({
        started: formatDateTime(startTime),
        duration: formatDuration(duration, !record.endTime),
        source: 'Local',
        canEdit: true,
        recordId: record.id
      });
    }

    // Jira worklogs
    for (const worklog of jiraWorklogs) {
      const startTime = new Date(worklog.started);
      totalSeconds += worklog.timeSpentSeconds;

      displays.push({
        started: formatDateTime(startTime),
        duration: formatDuration(worklog.timeSpentSeconds),
        source: 'Jira',
        canEdit: false,
        recordId: 0
      });
    }

    return displays;
  };

  const getTotalTime = (): string => {
    let totalSeconds = 0;
    
    for (const record of timeRecords) {
      const startTime = new Date(record.startTime);
      const endTime = record.endTime ? new Date(record.endTime) : new Date();
      totalSeconds += (endTime.getTime() - startTime.getTime()) / 1000;
    }

    for (const worklog of jiraWorklogs) {
      totalSeconds += worklog.timeSpentSeconds;
    }

    return formatDuration(totalSeconds);
  };

  const timeTrackingColumns: Column<TimeTrackingDisplay>[] = [
    { header: 'Started', accessor: 'started', width: '200px' },
    { header: 'Duration', accessor: 'duration', width: '200px' },
    { header: 'Source', accessor: 'source', width: '80px' },
    {
      header: 'Edit',
      accessor: (row) => row.canEdit ? (
        <Button onClick={() => {
          const record = timeRecords.find(r => r.id === row.recordId);
          if (record) handleEditRecord(record);
        }}>
          Edit
        </Button>
      ) : null,
      width: '60px'
    },
    {
      header: 'Delete',
      accessor: (row) => row.canEdit ? (
        <Button variant="danger" onClick={() => handleDeleteRecord(row.recordId)}>
          Delete
        </Button>
      ) : null,
      width: '60px'
    }
  ];

  if (!issue) {
    return <div className="loading">Loading issue...</div>;
  }

  return (
    <div className="issue-details-view">
      <div className="issue-content">
        <div className="issue-info">
          <div className="info-row">
            <strong>Key:</strong> <span>{issue.key}</span>
          </div>
          <div className="info-row">
            <strong>Summary:</strong> <span>{issue.summary}</span>
          </div>
          <div className="info-row">
            <strong>Status:</strong> <span>{issue.status}</span>
          </div>
          <div className="info-row">
            <strong>Assignee:</strong> <span>{issue.assignee}</span>
          </div>
          <div className="info-row">
            <strong>Web Link:</strong>{' '}
            <Button onClick={() => {
              if (baseUrl) {
                window.open(`${baseUrl}/browse/${issue.key}`, '_blank');
              }
            }}>
              View in Jira
            </Button>
          </div>

          <div className="description-section">
            <strong>Description:</strong>
            <div className="description-content">
              {issue.descriptionBlocks?.map((block, index) => (
                <div key={index} className={block.isCode ? 'code-block' : 'text-block'}>
                  {block.text}
                </div>
              ))}
            </div>
          </div>

          <div className="comments-section">
            <strong>Comments:</strong>
            <div className="comments-list">
              {issue.comments?.map((comment, index) => (
                <div key={index} className="comment">
                  <div className="comment-header">
                    <strong>{comment.author}</strong>
                    <span> - {new Date(comment.created).toLocaleString()}</span>
                    {comment.updated && (
                      <span className="comment-updated">
                        {' '}(Updated: {new Date(comment.updated).toLocaleString()})
                      </span>
                    )}
                  </div>
                  <div className="comment-body">
                    {comment.bodyBlocks.map((block, blockIndex) => (
                      <div key={blockIndex} className={block.isCode ? 'code-block' : 'text-block'}>
                        {block.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="time-tracking-panel">
          <div className="tracking-buttons">
            {!isTracking ? (
              <Button onClick={handleStartTracking}>Start Time Tracking</Button>
            ) : (
              <Button onClick={handleStopTracking} variant="secondary">Stop Time Tracking</Button>
            )}
          </div>
          
          <div className="total-time">
            <strong>Total Time:</strong> {getTotalTime()}
          </div>

          <div className="tracking-records">
            <strong>Time Tracking Records:</strong>
            <DataGrid columns={timeTrackingColumns} data={getDisplayRecords()} />
          </div>
        </div>
      </div>

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Time Tracking Record"
        footer={
          <>
            <Button onClick={() => setEditModalOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </>
        }
      >
        <div className="form-group">
          <label>Start Time:</label>
          <Input
            type="text"
            value={editStartTime}
            onChange={setEditStartTime}
            placeholder="YYYY-MM-DDTHH:mm:ss"
          />
        </div>
        <div className="form-group">
          <label>End Time:</label>
          <Input
            type="text"
            value={editEndTime}
            onChange={setEditEndTime}
            placeholder="YYYY-MM-DDTHH:mm:ss"
          />
        </div>
      </Modal>
    </div>
  );
};
