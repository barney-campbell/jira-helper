import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import type { TimeTrackingRecord } from '../../renderer/types';

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
    // Stop any active tracking
    const active = this.db.prepare('SELECT * FROM TimeTrackingRecords WHERE EndTime IS NULL').get() as any;
    if (active) {
      const now = new Date().toISOString();
      this.db.prepare('UPDATE TimeTrackingRecords SET EndTime = ? WHERE Id = ?').run(now, active.Id);
    }

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
