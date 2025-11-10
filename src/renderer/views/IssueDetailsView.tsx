import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { DataGrid, Column } from '../components/DataGrid';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import type { JiraIssue, TimeTrackingRecord, JiraWorklog, TimeTrackingDisplay, KanbanItem } from '../../common/types';

const ViewContainer = styled.div`
  background-color: ${props => props.theme.colors.surface};
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const IssueContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const IssueInfo = styled.div`
  min-width: 0;
`;

const InfoRow = styled.div`
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  strong {
    display: inline-block;
    width: 120px;
    font-weight: 600;
  }
`;

const ClickableIssueLink = styled.span`
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DescriptionSection = styled.div`
  margin-top: 30px;

  > strong {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
  }
`;

const DescriptionContent = styled.div`
  overflow-y: auto;
  padding: 10px;
  background-color: ${props => props.theme.colors.surfaceHover};
  border-radius: 4px;
`;

const TextBlock = styled.div`
  margin: 5px 0;
  line-height: 1.5;
`;

const CodeBlock = styled.div`
  background-color: ${props => props.theme.colors.surfaceHover};
  color: ${props => props.theme.colors.text};
  padding: 10px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  margin: 10px 0;
  overflow-x: auto;
  white-space: pre-wrap;
  border: 1px solid ${props => props.theme.colors.border};
`;

const CommentsSection = styled.div`
  margin-top: 30px;

  > strong {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
  }
`;

const CommentsList = styled.div`
  overflow-y: auto;
  padding: 10px;
  background-color: ${props => props.theme.colors.surfaceHover};
  border-radius: 4px;
`;

const Comment = styled.div`
  padding: 15px;
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  margin-bottom: 15px;
`;

const CommentHeader = styled.div`
  margin-bottom: 10px;
  color: ${props => props.theme.colors.text};
  font-size: 14px;
`;

const CommentUpdated = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
`;

const CommentBody = styled.div`
  color: ${props => props.theme.colors.text};
  line-height: 1.5;
`;

const TimeTrackingPanel = styled.div`
  background-color: ${props => props.theme.colors.surfaceHover};
  border-radius: 8px;
  padding: 20px;
`;

const TrackingButtons = styled.div`
  margin-bottom: 20px;
`;

const TotalTime = styled.div`
  margin-bottom: 20px;
  font-size: 16px;

  strong {
    display: block;
    margin-bottom: 5px;
  }
`;

const TrackingRecords = styled.div`
  > strong {
    display: block;
    margin-bottom: 10px;
  }
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 18px;
  color: ${props => props.theme.colors.textSecondary};
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }
`;

const LinkedKanbanSection = styled.div`
  margin-top: 30px;
  padding: 20px;
  background-color: ${props => props.theme.colors.primary}22;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.primary}44;

  > strong {
    display: block;
    margin-bottom: 15px;
    font-weight: 600;
    font-size: 16px;
    color: ${props => props.theme.colors.text};
  }
`;

const KanbanItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const KanbanItemCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  padding: 15px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const KanbanItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const KanbanItemTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const KanbanItemColumn = styled.span<{ column: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => 
    props.column === 'todo' ? '#fef3c7' :
    props.column === 'inProgress' ? '#dbeafe' :
    '#d1fae5'};
  color: ${props => 
    props.column === 'todo' ? '#92400e' :
    props.column === 'inProgress' ? '#1e40af' :
    '#065f46'};
`;

const KanbanItemDescription = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.5;
`;

const NoKanbanItems = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  font-style: italic;
`;

interface IssueDetailsViewProps {
  issueKey: string;
  onIssueKeyClick?: (issueKey: string) => void;
}

export const IssueDetailsView: React.FC<IssueDetailsViewProps> = ({ issueKey, onIssueKeyClick }) => {
  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [timeRecords, setTimeRecords] = useState<TimeTrackingRecord[]>([]);
  const [jiraWorklogs, setJiraWorklogs] = useState<JiraWorklog[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimeTrackingRecord | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [kanbanItems, setKanbanItems] = useState<KanbanItem[]>([]);

  useEffect(() => {
    loadIssue();
    loadTimeTracking();
    loadBaseUrl();
    loadKanbanItems();

    const interval = setInterval(loadTimeTracking, 1000);
    return () => clearInterval(interval);
  }, [issueKey]);

  const loadIssue = async () => {
    try {
  const data = await ipc.getIssue(issueKey);
      setIssue(data);
    } catch (error) {
      console.error('Error loading issue:', error);
    }
  };

  const loadKanbanItems = async () => {
    try {
  const items = await ipc.getKanbanItemsByIssue(issueKey);
      setKanbanItems(items);
    } catch (error) {
      console.error('Error loading kanban items:', error);
    }
  };

  const loadTimeTracking = async () => {
    try {
  const records = await ipc.getTimeTrackingRecords(issueKey);
      setTimeRecords(records);
      
      const hasActive = records.some(r => !r.endTime);
      setIsTracking(hasActive);

  const worklogs = await ipc.getWorklogs(issueKey);
      setJiraWorklogs(worklogs);
    } catch (error) {
      console.error('Error loading time tracking:', error);
    }
  };

  const loadBaseUrl = async () => {
    try {
  const url = await ipc.getBaseUrl();
      setBaseUrl(url);
    } catch (error) {
      console.error('Error loading base URL:', error);
    }
  };

  const handleStartTracking = async () => {
    try {
  await ipc.startTracking(issueKey);
      await loadTimeTracking();
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  const handleStopTracking = async () => {
    try {
  await ipc.stopTracking(issueKey);
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
    // Format for datetime-local input: convert to local timezone and format as YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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

  const getColumnDisplayName = (column: string): string => {
    switch (column) {
      case 'todo':
        return 'To Do';
      case 'inProgress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return column;
    }
  };

  const getDisplayRecords = (): TimeTrackingDisplay[] => {
    const displays: TimeTrackingDisplay[] = [];
    let totalSeconds = 0;

    // Local records
    for (const record of timeRecords.filter(r => !r.isUploaded)) {
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

  const openInJira = (url: string, issueKey: string) => {
    const fullUrl = `${url}/browse/${issueKey}`;
  ipc.openExternal(fullUrl);
  }

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
    return <Loading>Loading issue...</Loading>;
  }

  return (
    <ViewContainer>
      <IssueContent>
        <IssueInfo>
          <InfoRow>
            <strong>Key:</strong> <span>{issue.key}</span>
          </InfoRow>
          <InfoRow>
            <strong>Summary:</strong> <span>{issue.summary}</span>
          </InfoRow>
          <InfoRow>
            <strong>Status:</strong> <span>{issue.status}</span>
          </InfoRow>
          <InfoRow>
            <strong>Assignee:</strong> <span>{issue.assignee}</span>
          </InfoRow>
          {issue.parent && (
            <InfoRow>
              <strong>Parent Issue:</strong>{' '}
              <ClickableIssueLink onClick={() => onIssueKeyClick?.(issue.parent!.key)}>
                {issue.parent.key}
              </ClickableIssueLink>
              {' '}- {issue.parent.summary}
            </InfoRow>
          )}
          <InfoRow>
            <strong>Web Link:</strong>{' '}
            <Button onClick={() => {
              if (baseUrl) {
                openInJira(baseUrl, issue.key);
              }
            }}>
              View in Jira
            </Button>
          </InfoRow>

          <DescriptionSection>
            <strong>Description:</strong>
            <DescriptionContent>
              {issue.descriptionBlocks?.map((block, index) => (
                block.isCode ? (
                  <CodeBlock key={index}>{block.text}</CodeBlock>
                ) : (
                  <TextBlock key={index}>{block.text}</TextBlock>
                )
              ))}
            </DescriptionContent>
          </DescriptionSection>

          <CommentsSection>
            <strong>Comments:</strong>
            <CommentsList>
              {issue.comments?.map((comment, index) => (
                <Comment key={index}>
                  <CommentHeader>
                    <strong>{comment.author}</strong>
                    <span> - {new Date(comment.created).toLocaleString()}</span>
                    {comment.updated && (
                      <CommentUpdated>
                        {' '}(Updated: {new Date(comment.updated).toLocaleString()})
                      </CommentUpdated>
                    )}
                  </CommentHeader>
                  <CommentBody>
                    {comment.bodyBlocks.map((block, blockIndex) => (
                      block.isCode ? (
                        <CodeBlock key={blockIndex}>{block.text}</CodeBlock>
                      ) : (
                        <TextBlock key={blockIndex}>{block.text}</TextBlock>
                      )
                    ))}
                  </CommentBody>
                </Comment>
              ))}
            </CommentsList>
          </CommentsSection>
        </IssueInfo>

        <div>
          <TimeTrackingPanel>
            <TrackingButtons>
              {!isTracking ? (
                <Button onClick={handleStartTracking}>Start Time Tracking</Button>
              ) : (
                <Button onClick={handleStopTracking} variant="secondary">Stop Time Tracking</Button>
              )}
            </TrackingButtons>
            
            <TotalTime>
              <strong>Total Time:</strong> {getTotalTime()}
            </TotalTime>

            <TrackingRecords>
              <strong>Time Tracking Records:</strong>
              <DataGrid columns={timeTrackingColumns} data={getDisplayRecords()} />
            </TrackingRecords>
          </TimeTrackingPanel>

          <LinkedKanbanSection>
            <strong>🗂️ Linked Kanban Items ({kanbanItems.length})</strong>
            {kanbanItems.length > 0 ? (
              <KanbanItemsList>
                {kanbanItems.map((item) => (
                  <KanbanItemCard key={item.id}>
                    <KanbanItemHeader>
                      <KanbanItemTitle>{item.title}</KanbanItemTitle>
                      <KanbanItemColumn column={item.column}>
                        {getColumnDisplayName(item.column)}
                      </KanbanItemColumn>
                    </KanbanItemHeader>
                    {item.description && (
                      <KanbanItemDescription>{item.description}</KanbanItemDescription>
                    )}
                  </KanbanItemCard>
                ))}
              </KanbanItemsList>
            ) : (
              <NoKanbanItems>No Kanban items linked to this issue</NoKanbanItems>
            )}
          </LinkedKanbanSection>
        </div>
      </IssueContent>

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
        <FormGroup>
          <label>Start Time:</label>
          <Input
            type="datetime-local"
            value={editStartTime}
            onChange={setEditStartTime}
            step={1}
          />
        </FormGroup>
        <FormGroup>
          <label>End Time:</label>
          <Input
            type="datetime-local"
            value={editEndTime}
            onChange={setEditEndTime}
            step={1}
          />
        </FormGroup>
      </Modal>
    </ViewContainer>
  );
};
