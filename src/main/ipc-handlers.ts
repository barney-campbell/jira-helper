import { ipcMain, shell } from 'electron';
import { JiraService } from './services/jira-service';
import { TimeTrackingService } from './services/time-tracking-service';
import { SettingsService } from './services/settings-service';
import { KanbanService } from './services/kanban-service';
import type { UserSettings, KanbanColumnType } from '../common/types';

let jiraService: JiraService | null = null;
const timeTrackingService = new TimeTrackingService();
const settingsService = new SettingsService();
const kanbanService = new KanbanService();

export function registerIpcHandlers() {
  // Initialize Jira service with settings
  const settings = settingsService.loadSettings();
  if (settings && settings.baseUrl && settings.email && settings.apiToken) {
    jiraService = new JiraService(settings);
  }

  // Native handlers
  ipcMain.handle('native:openExternal', async (_, url: string) => {
    await shell.openExternal(url);
  });

  // Settings handlers
  ipcMain.handle('settings:load', async () => {
    return settingsService.loadSettings();
  });

  ipcMain.handle('settings:save', async (_, settings: UserSettings) => {
    settingsService.saveSettings(settings);
    jiraService = new JiraService(settings);
    return { success: true };
  });

  // Jira API handlers
  ipcMain.handle('jira:getAssignedIssues', async (_, user: string) => {
    if (!jiraService) throw new Error('Jira service not initialized');
    return await jiraService.getAssignedIssues(user);
  });

  ipcMain.handle('jira:getIssue', async (_, key: string) => {
    if (!jiraService) throw new Error('Jira service not initialized');
    return await jiraService.getIssue(key);
  });

  ipcMain.handle('jira:searchIssues', async (_, jql: string) => {
    if (!jiraService) throw new Error('Jira service not initialized');
    return await jiraService.searchIssues(jql);
  });

  ipcMain.handle('jira:getWorklogs', async (_, issueKey: string) => {
    if (!jiraService) throw new Error('Jira service not initialized');
    return await jiraService.getWorklogs(issueKey);
  });

  ipcMain.handle('jira:uploadTimeTracking', async (_, issueKey: string, timeSpentSeconds: number, started?: Date) => {
    if (!jiraService) throw new Error('Jira service not initialized');
    return await jiraService.uploadTimeTracking(issueKey, timeSpentSeconds, started);
  });

  ipcMain.handle('jira:getBaseUrl', async () => {
    if (!jiraService) throw new Error('Jira service not initialized');
    return jiraService.getBaseUrl();
  });

  // Time Tracking handlers
  ipcMain.handle('timeTracking:start', async (_, issueKey: string) => {
    timeTrackingService.startTracking(issueKey);
    return { success: true };
  });

  ipcMain.handle('timeTracking:stop', async (_, issueKey: string) => {
    timeTrackingService.stopTracking(issueKey);
    return { success: true };
  });

  ipcMain.handle('timeTracking:getRecords', async (_, issueKey: string) => {
    return timeTrackingService.getRecords(issueKey);
  });

  ipcMain.handle('timeTracking:getUnsentRecords', async () => {
    return timeTrackingService.getUnsentCompletedRecords();
  });

  ipcMain.handle('timeTracking:updateRecord', async (_, record: any) => {
    timeTrackingService.updateRecord(record);
    return { success: true };
  });

  ipcMain.handle('timeTracking:deleteRecord', async (_, id: number) => {
    timeTrackingService.deleteRecord(id);
    return { success: true };
  });

  ipcMain.handle('timeTracking:markAsUploaded', async (_, id: number) => {
    timeTrackingService.markAsUploaded(id);
    return { success: true };
  });

  // Kanban handlers
  ipcMain.handle('kanban:getAllItems', async () => {
    return kanbanService.getAllItems();
  });

  ipcMain.handle('kanban:getItemsByColumn', async (_, column: KanbanColumnType) => {
    return kanbanService.getItemsByColumn(column);
  });

  ipcMain.handle('kanban:createItem', async (_, title: string, description: string, column: KanbanColumnType, linkedIssueKey?: string) => {
    return kanbanService.createItem(title, description, column, linkedIssueKey);
  });

  ipcMain.handle('kanban:updateItem', async (_, id: number, title: string, description: string, linkedIssueKey?: string) => {
    kanbanService.updateItem(id, title, description, linkedIssueKey);
    return { success: true };
  });

  ipcMain.handle('kanban:moveItem', async (_, id: number, newColumn: KanbanColumnType, newPosition: number) => {
    kanbanService.moveItem(id, newColumn, newPosition);
    return { success: true };
  });

  ipcMain.handle('kanban:deleteItem', async (_, id: number) => {
    kanbanService.deleteItem(id);
    return { success: true };
  });
}
