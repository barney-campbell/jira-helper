import type { JiraIssue, JiraWorklog } from '../../src/common/types';

export const mockJiraIssue: JiraIssue = {
  id: '10001',
  key: 'TEST-123',
  summary: 'Test Issue',
  status: 'In Progress',
  assignee: 'John Doe',
  project: 'Test Project',
};

export const mockJiraWorklog: JiraWorklog = {
  id: '100',
  timeSpent: '2h',
  started: new Date().toISOString(),
};

export const mockJiraSearchResponse = {
  issues: [
    {
      id: '10001',
      key: 'TEST-123',
      fields: {
        summary: 'Test Issue',
        status: { name: 'In Progress' },
        assignee: { displayName: 'John Doe' },
        project: { name: 'Test Project' },
      },
    },
  ],
};

export function mockFetch(response: any, ok: boolean = true) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      status: ok ? 200 : 400,
    } as Response)
  );
}

export function mockFetchError(message: string) {
  global.fetch = jest.fn(() => Promise.reject(new Error(message)));
}
