import Database from "better-sqlite3"
import { app } from "electron"
import * as path from "path"
import type { KanbanItem, KanbanColumnType } from "../../common/types"

export class KanbanService {
    private db: Database.Database

    constructor() {
        const userDataPath = app.getPath("userData")
        const dbPath = path.join(userDataPath, "kanban.db")
        this.db = new Database(dbPath)
        this.initializeDatabase()
    }

    private initializeDatabase(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS KanbanItems (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Title TEXT NOT NULL,
        Description TEXT NOT NULL DEFAULT '',
        Column TEXT NOT NULL,
        Position INTEGER NOT NULL,
        LinkedIssueKey TEXT,
        CreatedAt TEXT NOT NULL,
        UpdatedAt TEXT NOT NULL
      )
    `)
    }

    getAllItems(): KanbanItem[] {
        const rows = this.db
            .prepare(
                `
      SELECT * FROM KanbanItems 
      ORDER BY Column, Position
    `
            )
            .all() as any[]

        return rows.map((row) => this.mapRowToItem(row))
    }

    getItemsByColumn(column: KanbanColumnType): KanbanItem[] {
        const rows = this.db
            .prepare(
                `
      SELECT * FROM KanbanItems 
      WHERE Column = ?
      ORDER BY Position
    `
            )
            .all(column) as any[]

        return rows.map((row) => this.mapRowToItem(row))
    }

    getItemsByLinkedIssue(issueKey: string): KanbanItem[] {
        const rows = this.db
            .prepare(
                `
      SELECT * FROM KanbanItems 
      WHERE LinkedIssueKey = ?
      ORDER BY Column, Position
    `
            )
            .all(issueKey) as any[]

        return rows.map((row) => this.mapRowToItem(row))
    }

    createItem(
        title: string,
        description: string,
        column: KanbanColumnType,
        linkedIssueKey?: string
    ): KanbanItem {
        const now = new Date().toISOString()

        // Get the maximum position in the column
        const maxPositionRow = this.db
            .prepare(
                `
      SELECT MAX(Position) as maxPos FROM KanbanItems WHERE Column = ?
    `
            )
            .get(column) as any

        const position = (maxPositionRow?.maxPos ?? -1) + 1

        const result = this.db
            .prepare(
                `
      INSERT INTO KanbanItems (Title, Description, Column, Position, LinkedIssueKey, CreatedAt, UpdatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
            )
            .run(
                title,
                description,
                column,
                position,
                linkedIssueKey || null,
                now,
                now
            )

        const item = this.db
            .prepare("SELECT * FROM KanbanItems WHERE Id = ?")
            .get(result.lastInsertRowid) as any
        return this.mapRowToItem(item)
    }

    updateItem(
        id: number,
        title: string,
        description: string,
        linkedIssueKey?: string
    ): void {
        const now = new Date().toISOString()
        this.db
            .prepare(
                `
      UPDATE KanbanItems 
      SET Title = ?, Description = ?, LinkedIssueKey = ?, UpdatedAt = ? 
      WHERE Id = ?
    `
            )
            .run(title, description, linkedIssueKey || null, now, id)
    }

    moveItem(
        id: number,
        newColumn: KanbanColumnType,
        newPosition: number
    ): void {
        const now = new Date().toISOString()

        // Get current item
        const item = this.db
            .prepare("SELECT * FROM KanbanItems WHERE Id = ?")
            .get(id) as any
        if (!item) return

        const oldColumn = item.Column
        const oldPosition = item.Position

        // Begin transaction
        this.db.prepare("BEGIN").run()

        try {
            if (oldColumn === newColumn) {
                // Moving within the same column
                if (oldPosition < newPosition) {
                    // Moving down: shift items up
                    this.db
                        .prepare(
                            `
            UPDATE KanbanItems 
            SET Position = Position - 1 
            WHERE Column = ? AND Position > ? AND Position <= ?
          `
                        )
                        .run(newColumn, oldPosition, newPosition)
                } else if (oldPosition > newPosition) {
                    // Moving up: shift items down
                    this.db
                        .prepare(
                            `
            UPDATE KanbanItems 
            SET Position = Position + 1 
            WHERE Column = ? AND Position >= ? AND Position < ?
          `
                        )
                        .run(newColumn, newPosition, oldPosition)
                }
            } else {
                // Moving to a different column
                // Shift items in old column up
                this.db
                    .prepare(
                        `
          UPDATE KanbanItems 
          SET Position = Position - 1 
          WHERE Column = ? AND Position > ?
        `
                    )
                    .run(oldColumn, oldPosition)

                // Shift items in new column down
                this.db
                    .prepare(
                        `
          UPDATE KanbanItems 
          SET Position = Position + 1 
          WHERE Column = ? AND Position >= ?
        `
                    )
                    .run(newColumn, newPosition)
            }

            // Update the item itself
            this.db
                .prepare(
                    `
        UPDATE KanbanItems 
        SET Column = ?, Position = ?, UpdatedAt = ? 
        WHERE Id = ?
      `
                )
                .run(newColumn, newPosition, now, id)

            this.db.prepare("COMMIT").run()
        } catch (error) {
            this.db.prepare("ROLLBACK").run()
            throw error
        }
    }

    deleteItem(id: number): void {
        // Get the item to know its column and position
        const item = this.db
            .prepare("SELECT * FROM KanbanItems WHERE Id = ?")
            .get(id) as any
        if (!item) return

        // Delete the item
        this.db.prepare("DELETE FROM KanbanItems WHERE Id = ?").run(id)

        // Shift items in the same column up
        this.db
            .prepare(
                `
      UPDATE KanbanItems 
      SET Position = Position - 1 
      WHERE Column = ? AND Position > ?
    `
            )
            .run(item.Column, item.Position)
    }

    private mapRowToItem(row: any): KanbanItem {
        return {
            id: row.Id,
            title: row.Title,
            description: row.Description,
            column: row.Column as KanbanColumnType,
            position: row.Position,
            linkedIssueKey: row.LinkedIssueKey || undefined,
            createdAt: new Date(row.CreatedAt),
            updatedAt: new Date(row.UpdatedAt),
        }
    }

    close(): void {
        this.db.close()
    }
}
