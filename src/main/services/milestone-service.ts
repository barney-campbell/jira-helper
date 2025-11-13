import Database from "better-sqlite3"
import { app } from "electron"
import * as path from "path"

export interface MilestoneRow {
    Id: number
    Description: string
    IssueKey?: string | null
    LoggedAt: string
}

export interface Milestone {
    id: number
    description: string
    issueKey?: string | null
    loggedAt: Date
}

export class MilestoneService {
    private db: Database.Database

    constructor() {
        const userDataPath = app.getPath("userData")
        const dbPath = path.join(userDataPath, "milestones.db")
        this.db = new Database(dbPath)
        this.initializeDatabase()
    }

    private initializeDatabase(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS Milestones (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Description TEXT NOT NULL,
        IssueKey TEXT,
        LoggedAt TEXT NOT NULL
      )
    `)
    }

    addMilestone(description: string, issueKey?: string | null): Milestone {
        const now = new Date().toISOString()
        const info = this.db
            .prepare(
                `INSERT INTO Milestones (Description, IssueKey, LoggedAt) VALUES (?, ?, ?)`
            )
            .run(description, issueKey || null, now)

        const id = info.lastInsertRowid as number
        return {
            id,
            description,
            issueKey: issueKey || null,
            loggedAt: new Date(now),
        }
    }

    getAll(): Milestone[] {
        const rows = this.db
            .prepare(`SELECT * FROM Milestones ORDER BY LoggedAt DESC`)
            .all() as MilestoneRow[]

        return rows.map((r) => ({
            id: r.Id,
            description: r.Description,
            issueKey: r.IssueKey || null,
            loggedAt: new Date(r.LoggedAt),
        }))
    }

    getLast12Months(): Milestone[] {
        const since = new Date()
        since.setFullYear(since.getFullYear() - 1)
        const sinceIso = since.toISOString()

        const rows = this.db
            .prepare(
                `SELECT * FROM Milestones WHERE LoggedAt >= ? ORDER BY LoggedAt DESC`
            )
            .all(sinceIso) as MilestoneRow[]

        return rows.map((r) => ({
            id: r.Id,
            description: r.Description,
            issueKey: r.IssueKey || null,
            loggedAt: new Date(r.LoggedAt),
        }))
    }

    updateMilestone(
        id: number,
        description: string,
        issueKey: string | null,
        loggedAt: Date
    ): Milestone {
        const loggedAtIso = loggedAt.toISOString()
        this.db
            .prepare(
                `UPDATE Milestones SET Description = ?, IssueKey = ?, LoggedAt = ? WHERE Id = ?`
            )
            .run(description, issueKey || null, loggedAtIso, id)

        return {
            id,
            description,
            issueKey: issueKey || null,
            loggedAt: new Date(loggedAtIso),
        }
    }

    deleteMilestone(id: number): boolean {
        const info = this.db
            .prepare(`DELETE FROM Milestones WHERE Id = ?`)
            .run(id)
        return info.changes > 0
    }

    close(): void {
        try {
            this.db.close()
        } catch (e) {
            // ignore
        }
    }
}
