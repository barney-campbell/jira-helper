import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { LogEntry } from '../../common/types';

export class LoggingService {
  private logsDir: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.logsDir = path.join(userDataPath, 'logs');
    this.ensureLogsDirExists();
  }

  private ensureLogsDirExists(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private getLogFilePath(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logsDir, `${dateStr}.log`);
  }

  private writeLog(entry: LogEntry): void {
    const logFilePath = this.getLogFilePath();
    const logLine = JSON.stringify(entry) + '\n';
    
    try {
      fs.appendFileSync(logFilePath, logLine, 'utf8');
    } catch (err) {
      console.error('Failed to write log:', err);
    }
  }

  logError(message: string, error?: Error | unknown, location?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      location
    };

    if (error instanceof Error) {
      entry.error = error.message;
      entry.stack = error.stack;
    } else if (error) {
      entry.error = String(error);
    }

    this.writeLog(entry);
  }

  logWarning(message: string, location?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      message,
      location
    };

    this.writeLog(entry);
  }

  logInfo(message: string, location?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      location
    };

    this.writeLog(entry);
  }

  getLogs(date?: Date): LogEntry[] {
    const logFilePath = this.getLogFilePath(date);
    
    if (!fs.existsSync(logFilePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(logFilePath, 'utf8');
      const lines = content.trim().split('\n');
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line) as LogEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is LogEntry => entry !== null);
    } catch (err) {
      console.error('Failed to read logs:', err);
      return [];
    }
  }

  getAllLogFiles(): string[] {
    try {
      const files = fs.readdirSync(this.logsDir);
      return files
        .filter(file => file.endsWith('.log'))
        .map(file => file.replace('.log', ''))
        .sort()
        .reverse(); // Most recent first
    } catch (err) {
      console.error('Failed to list log files:', err);
      return [];
    }
  }

  getLogsPath(): string {
    return this.logsDir;
  }
}
