import { ipcMain } from 'electron';
import { JiraService } from './services/jira-service';
import { TimeTrackingService } from './services/time-tracking-service';
import { SettingsService } from './services/settings-service';
import type { UserSettings } from '../common/types';

let jiraService: JiraService | null = null;
const timeTrackingService = new TimeTrackingService();
const settingsService = new SettingsService();

export function registerIpcHandlers() {
  // Initialize Jira service with settings
  const settings = settingsService.loadSettings();
  if (settings && settings.baseUrl && settings.email && settings.apiToken) {
    jiraService = new JiraService(settings);
  }

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
}
