import Database from "better-sqlite3"
import { app } from "electron"
import * as path from "path"
import type { UserSettings } from "../../common/types"
import { encrypt, decrypt } from "./crypto-util"

export class SettingsService {
    private db: Database.Database

    constructor() {
        const userDataPath = app.getPath("userData")
        const dbPath = path.join(userDataPath, "user_settings.db")
        this.db = new Database(dbPath)
        this.initializeDatabase()
    }

    private initializeDatabase(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS Settings (
        Id INTEGER PRIMARY KEY,
        BaseUrl TEXT NOT NULL,
        Email TEXT NOT NULL,
        ApiToken TEXT NOT NULL
      )
    `)

        // Safe migration: Add Theme column if it doesn't exist
        const columns = this.db.pragma("table_info(Settings)") as Array<{
            name: string
        }>
        const hasThemeColumn = columns.some((col) => col.name === "Theme")
        if (!hasThemeColumn) {
            this.db.exec(
                `ALTER TABLE Settings ADD COLUMN Theme TEXT DEFAULT 'light'`
            )
        }
    }

    loadSettings(): UserSettings | null {
        const row = this.db
            .prepare("SELECT * FROM Settings WHERE Id = 1")
            .get() as any
        if (!row) {
            return {
                id: 1,
                baseUrl: "",
                email: "",
                apiToken: "",
                theme: "light",
            }
        }
        let apiToken = row.ApiToken
        try {
            apiToken = decrypt(apiToken)
        } catch (e) {
            // fallback: return as is if not decryptable (e.g. legacy plain text)
        }
        return {
            id: row.Id,
            baseUrl: row.BaseUrl,
            email: row.Email,
            apiToken,
            theme: row.Theme || "light",
        }
    }

    saveSettings(settings: UserSettings): void {
        const encryptedToken = encrypt(settings.apiToken)
        const theme = settings.theme || "light"
        const existing = this.db
            .prepare("SELECT * FROM Settings WHERE Id = 1")
            .get()
        if (existing) {
            this.db
                .prepare(
                    `
        UPDATE Settings 
        SET BaseUrl = ?, Email = ?, ApiToken = ?, Theme = ? 
        WHERE Id = 1
      `
                )
                .run(settings.baseUrl, settings.email, encryptedToken, theme)
        } else {
            this.db
                .prepare(
                    `
        INSERT INTO Settings (Id, BaseUrl, Email, ApiToken, Theme) 
        VALUES (1, ?, ?, ?, ?)
      `
                )
                .run(settings.baseUrl, settings.email, encryptedToken, theme)
        }
    }

    close(): void {
        this.db.close()
    }
}
