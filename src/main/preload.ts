import { contextBridge, ipcRenderer } from 'electron';
import type { UserSettings, TimeTrackingRecord, KanbanItem, KanbanColumnType } from '../common/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Native
  openExternal: (url: string) => ipcRenderer.invoke('native:openExternal', url),

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
  stopTrackingById: (id: number) => ipcRenderer.invoke('timeTracking:stopById', id),
  getTimeTrackingRecords: (issueKey: string) => ipcRenderer.invoke('timeTracking:getRecords', issueKey),
  getUnsentTimeTrackingRecords: () => ipcRenderer.invoke('timeTracking:getUnsentRecords'),
  getActiveTimeTrackingRecords: () => ipcRenderer.invoke('timeTracking:getActiveRecords'),
  updateTimeTrackingRecord: (record: TimeTrackingRecord) => ipcRenderer.invoke('timeTracking:updateRecord', record),
  deleteTimeTrackingRecord: (id: number) => ipcRenderer.invoke('timeTracking:deleteRecord', id),
  markAsUploaded: (id: number) => ipcRenderer.invoke('timeTracking:markAsUploaded', id),

  // Kanban
  getAllKanbanItems: () => ipcRenderer.invoke('kanban:getAllItems'),
  getKanbanItemsByColumn: (column: KanbanColumnType) => ipcRenderer.invoke('kanban:getItemsByColumn', column),
  getKanbanItemsByIssue: (issueKey: string) => ipcRenderer.invoke('kanban:getItemsByIssue', issueKey),
  createKanbanItem: (title: string, description: string, column: KanbanColumnType, linkedIssueKey?: string) =>
    ipcRenderer.invoke('kanban:createItem', title, description, column, linkedIssueKey),
  updateKanbanItem: (id: number, title: string, description: string, linkedIssueKey?: string) =>
    ipcRenderer.invoke('kanban:updateItem', id, title, description, linkedIssueKey),
  moveKanbanItem: (id: number, newColumn: KanbanColumnType, newPosition: number) =>
    ipcRenderer.invoke('kanban:moveItem', id, newColumn, newPosition),
  deleteKanbanItem: (id: number) => ipcRenderer.invoke('kanban:deleteItem', id),

    
  // Event listeners
  onTimeTrackingChanged: (callback: () => void) => {
    ipcRenderer.on('timeTracking:changed', callback);
    return () => {
      ipcRenderer.removeListener('timeTracking:changed', callback);
    };
  },
});

declare global {
  interface Window {
    electronAPI: {
      openExternal: (url: string) => Promise<void>;
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
      stopTrackingById: (id: number) => Promise<{ success: boolean }>;
      getTimeTrackingRecords: (issueKey: string) => Promise<TimeTrackingRecord[]>;
      getUnsentTimeTrackingRecords: () => Promise<TimeTrackingRecord[]>;
      getActiveTimeTrackingRecords: () => Promise<TimeTrackingRecord[]>;
      updateTimeTrackingRecord: (record: TimeTrackingRecord) => Promise<{ success: boolean }>;
      deleteTimeTrackingRecord: (id: number) => Promise<{ success: boolean }>;
      markAsUploaded: (id: number) => Promise<{ success: boolean }>;
      getAllKanbanItems: () => Promise<KanbanItem[]>;
      getKanbanItemsByColumn: (column: KanbanColumnType) => Promise<KanbanItem[]>;
      getKanbanItemsByIssue: (issueKey: string) => Promise<KanbanItem[]>;
      createKanbanItem: (title: string, description: string, column: KanbanColumnType, linkedIssueKey?: string) => Promise<KanbanItem>;
      updateKanbanItem: (id: number, title: string, description: string, linkedIssueKey?: string) => Promise<{ success: boolean }>;
      moveKanbanItem: (id: number, newColumn: KanbanColumnType, newPosition: number) => Promise<{ success: boolean }>;
      deleteKanbanItem: (id: number) => Promise<{ success: boolean }>;
      onTimeTrackingChanged: (callback: () => void) => () => void;
    };
  }
}
