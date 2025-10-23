import { ipcMain, shell, BrowserWindow } from 'electron';
import { JiraService } from './services/jira-service';
import { TimeTrackingService } from './services/time-tracking-service';
import { SettingsService } from './services/settings-service';
import type { UserSettings } from '../common/types';

let jiraService: JiraService | null = null;
const timeTrackingService = new TimeTrackingService();
const settingsService = new SettingsService();

export function notifyTimeTrackingChanged() {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send('timeTracking:changed');
  });
}

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
    notifyTimeTrackingChanged();
    return { success: true };
  });

  ipcMain.handle('timeTracking:stop', async (_, issueKey: string) => {
    timeTrackingService.stopTracking(issueKey);
    notifyTimeTrackingChanged();
    return { success: true };
  });

  ipcMain.handle('timeTracking:stopById', async (_, id: number) => {
    timeTrackingService.stopTrackingById(id);
    notifyTimeTrackingChanged();
    return { success: true };
  });

  ipcMain.handle('timeTracking:getRecords', async (_, issueKey: string) => {
    return timeTrackingService.getRecords(issueKey);
  });

  ipcMain.handle('timeTracking:getUnsentRecords', async () => {
    return timeTrackingService.getUnsentCompletedRecords();
  });

  ipcMain.handle('timeTracking:getActiveRecords', async () => {
    return timeTrackingService.getActiveRecords();
  });

  ipcMain.handle('timeTracking:updateRecord', async (_, record: any) => {
    timeTrackingService.updateRecord(record);
    notifyTimeTrackingChanged();
    return { success: true };
  });

  ipcMain.handle('timeTracking:deleteRecord', async (_, id: number) => {
    timeTrackingService.deleteRecord(id);
    notifyTimeTrackingChanged();
    return { success: true };
  });

  ipcMain.handle('timeTracking:markAsUploaded', async (_, id: number) => {
    timeTrackingService.markAsUploaded(id);
    notifyTimeTrackingChanged();
    return { success: true };
  });
}
