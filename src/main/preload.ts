import { contextBridge, ipcRenderer } from 'electron';
import type { UserSettings, TimeTrackingRecord } from '../common/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: UserSettings) => ipcRenderer.invoke('settings:save', settings),

  // Jira API
  getAssignedIssues: (user: string) => ipcRenderer.invoke('jira:getAssignedIssues', user),
  getIssue: (key: string) => ipcRenderer.invoke('jira:getIssue', key),
  searchIssues: (jql: string) => ipcRenderer.invoke('jira:searchIssues', jql),
  getWorklogs: (issueKey: string) => ipcRenderer.invoke('jira:getWorklogs', issueKey),
  uploadTimeTracking: (issueKey: string, timeSpentSeconds: number, started?: Date) =>
    ipcRenderer.invoke('jira:uploadTimeTracking', issueKey, timeSpentSeconds, started),
  getBaseUrl: () => ipcRenderer.invoke('jira:getBaseUrl'),

  // Time Tracking
  startTracking: (issueKey: string) => ipcRenderer.invoke('timeTracking:start', issueKey),
  stopTracking: (issueKey: string) => ipcRenderer.invoke('timeTracking:stop', issueKey),
  getTimeTrackingRecords: (issueKey: string) => ipcRenderer.invoke('timeTracking:getRecords', issueKey),
  getUnsentTimeTrackingRecords: () => ipcRenderer.invoke('timeTracking:getUnsentRecords'),
  updateTimeTrackingRecord: (record: TimeTrackingRecord) => ipcRenderer.invoke('timeTracking:updateRecord', record),
  deleteTimeTrackingRecord: (id: number) => ipcRenderer.invoke('timeTracking:deleteRecord', id),
  markAsUploaded: (id: number) => ipcRenderer.invoke('timeTracking:markAsUploaded', id),
});

declare global {
  interface Window {
    electronAPI: {
      loadSettings: () => Promise<UserSettings | null>;
      saveSettings: (settings: UserSettings) => Promise<{ success: boolean }>;
      getAssignedIssues: (user: string) => Promise<any[]>;
      getIssue: (key: string) => Promise<any>;
      searchIssues: (jql: string) => Promise<any[]>;
      getWorklogs: (issueKey: string) => Promise<any[]>;
      uploadTimeTracking: (issueKey: string, timeSpentSeconds: number, started?: Date) => Promise<void>;
      getBaseUrl: () => Promise<string>;
      startTracking: (issueKey: string) => Promise<{ success: boolean }>;
      stopTracking: (issueKey: string) => Promise<{ success: boolean }>;
      getTimeTrackingRecords: (issueKey: string) => Promise<TimeTrackingRecord[]>;
      getUnsentTimeTrackingRecords: () => Promise<TimeTrackingRecord[]>;
      updateTimeTrackingRecord: (record: TimeTrackingRecord) => Promise<{ success: boolean }>;
      deleteTimeTrackingRecord: (id: number) => Promise<{ success: boolean }>;
      markAsUploaded: (id: number) => Promise<{ success: boolean }>;
    };
  }
}
