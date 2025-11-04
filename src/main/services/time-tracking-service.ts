import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import type { TimeTrackingRecord } from '../../common/types';

export class TimeTrackingService {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'time_tracking.db');
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS TimeTrackingRecords (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        IssueKey TEXT NOT NULL,
        StartTime TEXT NOT NULL,
        EndTime TEXT,
        IsUploaded INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  startTracking(issueKey: string): void {
    // Start new tracking
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO TimeTrackingRecords (IssueKey, StartTime, IsUploaded) 
      VALUES (?, ?, 0)
    `).run(issueKey, now);
  }

  stopTracking(issueKey: string): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE TimeTrackingRecords 
      SET EndTime = ? 
      WHERE IssueKey = ? AND EndTime IS NULL
    `).run(now, issueKey);
  }

  getRecords(issueKey: string): TimeTrackingRecord[] {
    const rows = this.db.prepare(`
      SELECT * FROM TimeTrackingRecords 
      WHERE IssueKey = ? 
      ORDER BY StartTime DESC
    `).all(issueKey) as any[];

    return rows.map(row => this.mapRowToRecord(row));
  }

  getUnsentCompletedRecords(): TimeTrackingRecord[] {
    const rows = this.db.prepare(`
      SELECT * FROM TimeTrackingRecords 
      WHERE IsUploaded = 0 AND EndTime IS NOT NULL 
      ORDER BY StartTime DESC
    `).all() as any[];

    return rows.map(row => this.mapRowToRecord(row));
  }

  getActiveRecords(): TimeTrackingRecord[] {
    const rows = this.db.prepare(`
      SELECT * FROM TimeTrackingRecords 
      WHERE EndTime IS NULL 
      ORDER BY StartTime DESC
    `).all() as any[];

    return rows.map(row => this.mapRowToRecord(row));
  }

  getYesterdayRecords(): TimeTrackingRecord[] {
    // Calculate yesterday's date (previous weekday)
    const today = new Date();
    const yesterday = new Date(today);
    
    // If it's Monday (1), go back to Friday (3 days back)
    if (today.getDay() === 1) {
      yesterday.setDate(today.getDate() - 3);
    }
    // If it's Sunday (0), go back to Friday (2 days back)
    else if (today.getDay() === 0) {
      yesterday.setDate(today.getDate() - 2);
    }
    // Otherwise, just go back one day
    else {
      yesterday.setDate(today.getDate() - 1);
    }
    
    // Set time to start of day (00:00:00)
    yesterday.setHours(0, 0, 0, 0);
    const startOfYesterday = yesterday.toISOString();
    
    // Set time to end of day (23:59:59)
    yesterday.setHours(23, 59, 59, 999);
    const endOfYesterday = yesterday.toISOString();

    const rows = this.db.prepare(`
      SELECT * FROM TimeTrackingRecords 
      WHERE StartTime >= ? AND StartTime <= ?
      ORDER BY StartTime DESC
    `).all(startOfYesterday, endOfYesterday) as any[];

    return rows.map(row => this.mapRowToRecord(row));
  }

  getCurrentWeekRecords(): TimeTrackingRecord[] {
    return this.getWeekRecords(0);
  }

  getWeekRecords(weekOffset: number): TimeTrackingRecord[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Calculate Monday of current week (day 1)
    const monday = new Date(today);
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
    monday.setDate(today.getDate() + daysFromMonday);
    
    // Apply week offset (positive = future weeks, negative = past weeks)
    monday.setDate(monday.getDate() + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);
    const startOfWeek = monday.toISOString();
    
    // Calculate Friday of the target week (day 5)
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);
    const endOfWeek = friday.toISOString();

    const rows = this.db.prepare(`
      SELECT * FROM TimeTrackingRecords 
      WHERE StartTime >= ? AND StartTime <= ?
      ORDER BY StartTime ASC
    `).all(startOfWeek, endOfWeek) as any[];

    return rows.map(row => this.mapRowToRecord(row));
  }

  stopTrackingById(id: number): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE TimeTrackingRecords 
      SET EndTime = ? 
      WHERE Id = ? AND EndTime IS NULL
    `).run(now, id);
  }

  updateRecord(record: TimeTrackingRecord): void {
    this.db.prepare(`
      UPDATE TimeTrackingRecords 
      SET StartTime = ?, EndTime = ? 
      WHERE Id = ?
    `).run(
      record.startTime.toISOString(),
      record.endTime ? record.endTime.toISOString() : null,
      record.id
    );
  }

  deleteRecord(id: number): void {
    this.db.prepare('DELETE FROM TimeTrackingRecords WHERE Id = ?').run(id);
  }

  markAsUploaded(id: number): void {
    this.db.prepare('UPDATE TimeTrackingRecords SET IsUploaded = 1 WHERE Id = ?').run(id);
  }

  private mapRowToRecord(row: any): TimeTrackingRecord {
    return {
      id: row.Id,
      issueKey: row.IssueKey,
      startTime: new Date(row.StartTime),
      endTime: row.EndTime ? new Date(row.EndTime) : undefined,
      isUploaded: row.IsUploaded === 1
    };
  }

  close(): void {
    this.db.close();
  }
}
