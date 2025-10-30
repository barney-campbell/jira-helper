import { vi } from 'vitest';
import type Database from 'better-sqlite3';

export class MockDatabase {
  private data: Map<string, any[]> = new Map();
  
  constructor() {
    this.data = new Map();
  }

  prepare(sql: string) {
    return {
      run: vi.fn((...params: any[]) => {
        // Mock INSERT
        if (sql.toLowerCase().includes('insert')) {
          const tableName = this.extractTableName(sql);
          if (!this.data.has(tableName)) {
            this.data.set(tableName, []);
          }
          const table = this.data.get(tableName)!;
          table.push({ id: table.length + 1, ...params });
        }
        // Mock UPDATE
        if (sql.toLowerCase().includes('update')) {
          // Implementation can be extended as needed
        }
        return { changes: 1, lastInsertRowid: 1 };
      }),
      get: vi.fn((...params: any[]) => {
        const tableName = this.extractTableName(sql);
        const table = this.data.get(tableName) || [];
        return table[0] || null;
      }),
      all: vi.fn((...params: any[]) => {
        const tableName = this.extractTableName(sql);
        return this.data.get(tableName) || [];
      }),
    };
  }

  exec(sql: string) {
    // Mock table creation
    if (sql.toLowerCase().includes('create table')) {
      const tableName = this.extractTableName(sql);
      if (!this.data.has(tableName)) {
        this.data.set(tableName, []);
      }
    }
  }

  close() {
    this.data.clear();
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/(?:from|into|update|table(?:\s+if\s+not\s+exists)?)\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  // Helper method for tests to set data
  setTableData(tableName: string, data: any[]) {
    this.data.set(tableName, data);
  }

  // Helper method for tests to get data
  getTableData(tableName: string): any[] {
    return this.data.get(tableName) || [];
  }
}

export function createMockDatabase(): Database.Database {
  return new MockDatabase() as any;
}
