// src/renderer/ipc.ts
// Abstracted IPC API for renderer process

import type {
  UserSettings,
  UpdateStatusPayload,
  KanbanItem,
  KanbanColumnType,
  VersionInfo,
  LogEntry,
  DailyStats,
  HourlyStats,
  IssueStats,
  ProductivityInsights,
  TimeTrackingRecord
} from '../common/types';

export interface ElectronAPI {
  openExternal(url: string): Promise<void>;
  loadSettings(): Promise<UserSettings | null>;
  saveSettings(settings: UserSettings): Promise<{ success: boolean }>;
  getAssignedIssues(user: string): Promise<any[]>;
  getIssue(key: string): Promise<any>;
  getIssueSummaries(issueKeys: string[]): Promise<Record<string, string>>;
  searchIssues(jql: string): Promise<any[]>;
  getWorklogs(issueKey: string): Promise<any[]>;
  uploadTimeTracking(issueKey: string, timeSpentSeconds: number, started?: Date): Promise<void>;
  getBaseUrl(): Promise<string>;
  startTracking(issueKey: string): Promise<{ success: boolean }>;
  stopTracking(issueKey: string): Promise<{ success: boolean }>;
  stopTrackingById(id: number): Promise<{ success: boolean }>;
  getTimeTrackingRecords(issueKey: string): Promise<TimeTrackingRecord[]>;
  getUnsentTimeTrackingRecords(): Promise<TimeTrackingRecord[]>;
  getActiveTimeTrackingRecords(): Promise<TimeTrackingRecord[]>;
  getYesterdayTimeTrackingRecords(): Promise<TimeTrackingRecord[]>;
  // Kanban
  getAllKanbanItems(): Promise<KanbanItem[]>;
  getKanbanItemsByColumn?(column: KanbanColumnType): Promise<KanbanItem[]>;
  getKanbanItemsByIssue(issueKey: string): Promise<KanbanItem[]>;
  createKanbanItem(title: string, description: string, column: KanbanColumnType, linkedIssueKey?: string): Promise<KanbanItem>;
  updateKanbanItem(id: number, title: string, description: string, linkedIssueKey?: string): Promise<{ success: boolean }>;
  moveKanbanItem(id: number, newColumn: KanbanColumnType, newPosition: number): Promise<{ success: boolean }>;
  deleteKanbanItem(id: number): Promise<{ success: boolean }>;
  // Version
  getVersionInfo(): Promise<VersionInfo>;
  checkForUpdates(): Promise<VersionInfo>;
  // Logging
  getLogs(date?: string): Promise<LogEntry[]>;
  getAllLogFiles(): Promise<string[]>;
  getLogsPath(): Promise<string>;
  // Analytics
  getDailyStats(days: number): Promise<DailyStats[]>;
  getHourlyStats(): Promise<HourlyStats[]>;
  getIssueStats(limit: number): Promise<IssueStats[]>;
  getProductivityInsights(): Promise<ProductivityInsights>;
  // Time tracking events
  onTimeTrackingChanged(callback: () => void): () => void;
  updateNavigationState(canGoBack: boolean, canGoForward: boolean): void;
  onNavigateBack(callback: () => void): () => void;
  onNavigateForward(callback: () => void): () => void;
  onSetTheme(callback: (theme: string) => void): () => void;
  onUpdateStatus(callback: (payload: UpdateStatusPayload) => void): () => void;
}


export const ipc: ElectronAPI = window.electronAPI as ElectronAPI;