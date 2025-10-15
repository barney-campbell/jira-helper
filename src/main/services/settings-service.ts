import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import type { UserSettings } from '../../renderer/types';

export class SettingsService {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'settings.db');
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS Settings (
        Id INTEGER PRIMARY KEY,
        BaseUrl TEXT NOT NULL,
        Email TEXT NOT NULL,
        ApiToken TEXT NOT NULL
      )
    `);
  }

  loadSettings(): UserSettings | null {
    const row = this.db.prepare('SELECT * FROM Settings WHERE Id = 1').get() as any;
    if (!row) {
      return {
        id: 1,
        baseUrl: '',
        email: '',
        apiToken: ''
      };
    }
    return {
      id: row.Id,
      baseUrl: row.BaseUrl,
      email: row.Email,
      apiToken: row.ApiToken
    };
  }

  saveSettings(settings: UserSettings): void {
    const existing = this.db.prepare('SELECT * FROM Settings WHERE Id = 1').get();
    if (existing) {
      this.db.prepare(`
        UPDATE Settings 
        SET BaseUrl = ?, Email = ?, ApiToken = ? 
        WHERE Id = 1
      `).run(settings.baseUrl, settings.email, settings.apiToken);
    } else {
      this.db.prepare(`
        INSERT INTO Settings (Id, BaseUrl, Email, ApiToken) 
        VALUES (1, ?, ?, ?)
      `).run(settings.baseUrl, settings.email, settings.apiToken);
    }
  }

  close(): void {
    this.db.close();
  }
}
