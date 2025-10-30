import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JiraService } from '../../src/main/services/jira-service';
import { mockJiraSearchResponse, mockFetch, mockFetchError } from '../mocks/jira-api.mock';
import type { UserSettings } from '../../src/common/types';

describe('JiraService', () => {
  let service: JiraService;
  let mockSettings: UserSettings;

  beforeEach(() => {
    mockSettings = {
      id: 1,
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      theme: 'system',
    };
    service = new JiraService(mockSettings);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with settings', () => {
      expect(service.getBaseUrl()).toBe('https://test.atlassian.net');
    });
  });

  describe('getAssignedIssues', () => {
    it('should fetch and return assigned issues', async () => {
      mockFetch(mockJiraSearchResponse);

      const issues = await service.getAssignedIssues('testuser');

      expect(issues).toHaveLength(1);
      expect(issues[0].key).toBe('TEST-123');
      expect(issues[0].summary).toBe('Test Issue');
      expect(issues[0].status).toBe('In Progress');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/3/search/jql'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should return empty array on error', async () => {
      mockFetchError('Network error');

      const issues = await service.getAssignedIssues('testuser');

      expect(issues).toEqual([]);
    });

    it('should handle response with no assignee', async () => {
      const responseWithoutAssignee = {
        issues: [
          {
            id: '10001',
            key: 'TEST-123',
            fields: {
              summary: 'Test Issue',
              status: { name: 'In Progress' },
              assignee: null,
              project: { name: 'Test Project' },
            },
          },
        ],
      };
      mockFetch(responseWithoutAssignee);

      const issues = await service.getAssignedIssues('testuser');

      expect(issues).toHaveLength(1);
      expect(issues[0].assignee).toBe('');
    });
  });

  describe('searchIssues', () => {
    it('should search issues with JQL query', async () => {
      mockFetch(mockJiraSearchResponse);

      const issues = await service.searchIssues('project = TEST');

      expect(issues).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('jql='),
        expect.any(Object)
      );
    });

    it('should return empty array when search fails', async () => {
      mockFetch({ error: 'Bad request' }, false);

      const issues = await service.searchIssues('invalid query');

      expect(issues).toEqual([]);
    });
  });

  describe('getIssue', () => {
    it('should fetch issue details', async () => {
      const mockIssueDetails = {
        id: '10001',
        key: 'TEST-123',
        fields: {
          summary: 'Test Issue',
          status: { name: 'In Progress' },
          assignee: { displayName: 'John Doe' },
          project: { name: 'Test Project' },
          description: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Test description' }],
              },
            ],
          },
        },
      };
      mockFetch(mockIssueDetails);

      const issue = await service.getIssue('TEST-123');

      expect(issue).not.toBeNull();
      expect(issue?.key).toBe('TEST-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/3/issue/TEST-123'),
        expect.any(Object)
      );
    });

    it('should throw error on failure', async () => {
      mockFetch({ error: 'Not found' }, false);

      await expect(service.getIssue('TEST-123')).rejects.toThrow();
    });
  });

  describe('getWorklogs', () => {
    it('should fetch worklogs for an issue', async () => {
      const mockWorklogsResponse = {
        worklogs: [
          {
            author: { displayName: 'John Doe' },
            started: new Date().toISOString(),
            timeSpentSeconds: 7200,
          },
        ],
      };
      mockFetch(mockWorklogsResponse);

      const worklogs = await service.getWorklogs('TEST-123');

      expect(worklogs).toHaveLength(1);
      expect(worklogs[0].timeSpentSeconds).toBe(7200);
      expect(worklogs[0].author).toBe('John Doe');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/3/issue/TEST-123/worklog'),
        expect.any(Object)
      );
    });

    it('should return empty array on error', async () => {
      mockFetch({ error: 'Not found' }, false);

      const worklogs = await service.getWorklogs('TEST-123');

      expect(worklogs).toEqual([]);
    });
  });

  describe('uploadTimeTracking', () => {
    it('should upload time tracking to an issue', async () => {
      mockFetch({ id: '100' });

      await service.uploadTimeTracking('TEST-123', 7200, new Date());

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/3/issue/TEST-123/worklog'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle errors when uploading time tracking', async () => {
      mockFetch({ error: 'Bad request' }, false);

      await expect(service.uploadTimeTracking('TEST-123', 7200, new Date())).rejects.toThrow();
    });
  });
});
