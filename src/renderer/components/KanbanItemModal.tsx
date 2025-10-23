import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import type { KanbanItem, JiraIssue } from '../../common/types';

interface KanbanItemModalProps {
  isOpen: boolean;
  item: KanbanItem | null;
  onClose: () => void;
  onSave: (title: string, description: string, linkedIssueKey?: string) => void;
}

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #0052cc;
    box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.1);
  }
`;

const IssueSearchContainer = styled.div`
  position: relative;
`;

const IssueSearchButton = styled(Button)`
  margin-top: 5px;
`;

const LinkedIssueDisplay = styled.div`
  margin-top: 10px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #ddd;

  .issue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .issue-key {
    font-weight: 600;
    color: #0052cc;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .unlink-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      color: #d32f2f;
    }
  }

  .issue-summary {
    font-size: 14px;
    color: #333;
    margin-bottom: 5px;
  }

  .issue-status {
    display: inline-block;
    padding: 2px 8px;
    background-color: #42a5f5;
    color: white;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
  }
`;

const SearchInput = styled(Input)`
  margin-bottom: 10px;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 13px;
  margin-top: 5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

export const KanbanItemModal: React.FC<KanbanItemModalProps> = ({ isOpen, item, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkedIssueKey, setLinkedIssueKey] = useState('');
  const [issueSearchKey, setIssueSearchKey] = useState('');
  const [linkedIssue, setLinkedIssue] = useState<JiraIssue | null>(null);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setLinkedIssueKey(item.linkedIssueKey || '');
      setIssueSearchKey(item.linkedIssueKey || '');
      
      // Load linked issue if exists
      if (item.linkedIssueKey) {
        loadLinkedIssue(item.linkedIssueKey);
      }
    } else {
      // Reset for new item
      setTitle('');
      setDescription('');
      setLinkedIssueKey('');
      setIssueSearchKey('');
      setLinkedIssue(null);
      setSearchError('');
    }
  }, [item, isOpen]);

  const loadLinkedIssue = async (issueKey: string) => {
    try {
      const issue = await window.electronAPI.getIssue(issueKey);
      setLinkedIssue(issue);
      setSearchError('');
    } catch (error) {
      console.error('Failed to load linked issue:', error);
      setLinkedIssue(null);
    }
  };

  const handleSearchIssue = async () => {
    if (!issueSearchKey.trim()) {
      setSearchError('Please enter an issue key');
      return;
    }

    setLoading(true);
    setSearchError('');

    try {
      const issue = await window.electronAPI.getIssue(issueSearchKey.trim());
      setLinkedIssue(issue);
      setLinkedIssueKey(issueSearchKey.trim());
      setSearchError('');
    } catch (error) {
      console.error('Failed to search issue:', error);
      setSearchError('Issue not found or failed to load');
      setLinkedIssue(null);
      setLinkedIssueKey('');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkIssue = () => {
    setLinkedIssue(null);
    setLinkedIssueKey('');
    setIssueSearchKey('');
    setSearchError('');
  };

  const handleViewIssue = async (issueKey: string) => {
    try {
      const settings = await window.electronAPI.loadSettings();
      if (settings?.baseUrl) {
        const url = `${settings.baseUrl}/browse/${issueKey}`;
        await window.electronAPI.openExternal(url);
      }
    } catch (error) {
      console.error('Failed to open issue:', error);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    onSave(title.trim(), description.trim(), linkedIssueKey || undefined);
  };

  const footer = (
    <ButtonGroup>
      <Button onClick={onClose} variant="secondary">Cancel</Button>
      <Button onClick={handleSave} variant="primary">Save</Button>
    </ButtonGroup>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Item' : 'Add New Item'}
      footer={footer}
    >
      <FormGroup>
        <label>Title *</label>
        <Input
          type="text"
          value={title}
          onChange={setTitle}
          placeholder="Enter item title"
        />
      </FormGroup>

      <FormGroup>
        <label>Description</label>
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter item description (optional)"
        />
      </FormGroup>

      <FormGroup>
        <label>Link to Jira Issue (Optional)</label>
        {linkedIssue ? (
          <LinkedIssueDisplay>
            <div className="issue-header">
              <span
                className="issue-key"
                onClick={() => handleViewIssue(linkedIssue.key)}
              >
                {linkedIssue.key}
              </span>
              <button className="unlink-btn" onClick={handleUnlinkIssue}>
                ✕ Unlink
              </button>
            </div>
            <div className="issue-summary">{linkedIssue.summary}</div>
            <div className="issue-status">{linkedIssue.status}</div>
          </LinkedIssueDisplay>
        ) : (
          <IssueSearchContainer>
            <SearchInput
              type="text"
              value={issueSearchKey}
              onChange={setIssueSearchKey}
              placeholder="Enter Jira issue key (e.g., PROJ-123)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchIssue();
                }
              }}
            />
            <IssueSearchButton
              onClick={handleSearchIssue}
              variant="secondary"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Link Issue'}
            </IssueSearchButton>
            {searchError && <ErrorMessage>{searchError}</ErrorMessage>}
          </IssueSearchContainer>
        )}
      </FormGroup>
    </Modal>
  );
};
