import { contextBridge, ipcRenderer } from 'electron';
import type { UserSettings, TimeTrackingRecord, KanbanItem, KanbanColumnType, VersionInfo, LogEntry, DailyStats, HourlyStats, IssueStats, ProductivityInsights } from '../common/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Native
  openExternal: (url: string) => ipcRenderer.invoke('native:openExternal', url),

  // Settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: UserSettings) => ipcRenderer.invoke('settings:save', settings),

  // Jira API
  getAssignedIssues: (user: string) => ipcRenderer.invoke('jira:getAssignedIssues', user),
  getIssue: (key: string) => ipcRenderer.invoke('jira:getIssue', key),
  getIssueSummaries: (issueKeys: string[]) => ipcRenderer.invoke('jira:getIssueSummaries', issueKeys),
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
  getYesterdayTimeTrackingRecords: () => ipcRenderer.invoke('timeTracking:getYesterdayRecords'),
  getCurrentWeekTimeTrackingRecords: () => ipcRenderer.invoke('timeTracking:getCurrentWeekRecords'),
  getWeekTimeTrackingRecords: (weekOffset: number) => ipcRenderer.invoke('timeTracking:getWeekRecords', weekOffset),
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

  // Version
  getVersionInfo: () => ipcRenderer.invoke('version:getInfo'),
  checkForUpdates: () => ipcRenderer.invoke('version:checkForUpdates'),

  // Logging
  getLogs: (date?: string) => ipcRenderer.invoke('logging:getLogs', date),
  getAllLogFiles: () => ipcRenderer.invoke('logging:getAllLogFiles'),
  getLogsPath: () => ipcRenderer.invoke('logging:getLogsPath'),

  // Analytics
  getDailyStats: (days: number) => ipcRenderer.invoke('analytics:getDailyStats', days),
  getHourlyStats: () => ipcRenderer.invoke('analytics:getHourlyStats'),
  getIssueStats: (limit: number) => ipcRenderer.invoke('analytics:getIssueStats', limit),
  getProductivityInsights: () => ipcRenderer.invoke('analytics:getProductivityInsights'),
    
  // Event listeners
  onTimeTrackingChanged: (callback: () => void) => {
    ipcRenderer.on('timeTracking:changed', callback);
    return () => {
      ipcRenderer.removeListener('timeTracking:changed', callback);
    };
  },
    
  onSetTheme: (callback: (theme: string) => void) => {
    ipcRenderer.on('menu:setTheme', (_event, theme) => callback(theme));
    return () => {
      ipcRenderer.removeListener('menu:setTheme', callback as any);
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
      getIssueSummaries: (issueKeys: string[]) => Promise<Record<string, string>>;
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
      getYesterdayTimeTrackingRecords: () => Promise<TimeTrackingRecord[]>;
      getCurrentWeekTimeTrackingRecords: () => Promise<TimeTrackingRecord[]>;
      getWeekTimeTrackingRecords: (weekOffset: number) => Promise<TimeTrackingRecord[]>;
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
      getVersionInfo: () => Promise<VersionInfo>;
      checkForUpdates: () => Promise<VersionInfo>;
      getLogs: (date?: string) => Promise<LogEntry[]>;
      getAllLogFiles: () => Promise<string[]>;
      getLogsPath: () => Promise<string>;
      getDailyStats: (days: number) => Promise<DailyStats[]>;
      getHourlyStats: () => Promise<HourlyStats[]>;
      getIssueStats: (limit: number) => Promise<IssueStats[]>;
      getProductivityInsights: () => Promise<ProductivityInsights>;
      onTimeTrackingChanged: (callback: () => void) => () => void;
      onSetTheme: (callback: (theme: string) => void) => () => void;
    };
  }
}
