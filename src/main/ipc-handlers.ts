import { ipcMain, shell, BrowserWindow } from "electron"
import { JiraService } from "./services/jira-service"
import { TimeTrackingService } from "./services/time-tracking-service"
import { SettingsService } from "./services/settings-service"
import { KanbanService } from "./services/kanban-service"
import { VersionService } from "./services/version-service"
import { LoggingService } from "./services/logging-service"
import { AnalyticsService } from "./services/analytics-service"
import { MilestoneService } from "./services/milestone-service"
import { app } from "electron"
import path from "path"
import fs from "fs"
import type { UserSettings, KanbanColumnType } from "../common/types"

let jiraService: JiraService | null = null
const timeTrackingService = new TimeTrackingService()
const settingsService = new SettingsService()
const kanbanService = new KanbanService()
const versionService = new VersionService()
const loggingService = new LoggingService()
const analyticsService = new AnalyticsService()
const milestoneService = new MilestoneService()

export function notifyTimeTrackingChanged() {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((window) => {
        window.webContents.send("timeTracking:changed")
    })
}

export function registerIpcHandlers() {
    // Initialize Jira service with settings
    const settings = settingsService.loadSettings()
    if (settings && settings.baseUrl && settings.email && settings.apiToken) {
        jiraService = new JiraService(settings)
    }

    // Native handlers
    ipcMain.handle("native:openExternal", async (_, url: string) => {
        await shell.openExternal(url)
    })

    // Settings handlers
    ipcMain.handle("settings:load", async () => {
        return settingsService.loadSettings()
    })

    ipcMain.handle("settings:save", async (_, settings: UserSettings) => {
        loggingService.logInfo("Saving user settings", "ipc/settings:save")
        try {
            settingsService.saveSettings(settings)
            jiraService = new JiraService(settings)
            return { success: true }
        } catch (error) {
            loggingService.logError(
                "Failed to save settings",
                error,
                "settings:save"
            )
            throw error
        }
    })

    // Jira API handlers
    ipcMain.handle("jira:getAssignedIssues", async (_, user: string) => {
        try {
            if (!jiraService) throw new Error("Jira service not initialized")
            return await jiraService.getAssignedIssues(user)
        } catch (error) {
            loggingService.logError(
                "Failed to get assigned issues",
                error,
                "jira:getAssignedIssues"
            )
            throw error
        }
    })

    ipcMain.handle("jira:getIssue", async (_, key: string) => {
        try {
            if (!jiraService) throw new Error("Jira service not initialized")
            return await jiraService.getIssue(key)
        } catch (error) {
            loggingService.logError(
                "Failed to get issue",
                error,
                "jira:getIssue"
            )
            throw error
        }
    })

    ipcMain.handle("jira:getIssueSummaries", async (_, issueKeys: string[]) => {
        try {
            if (!jiraService) throw new Error("Jira service not initialized")
            return await jiraService.getIssueSummaries(issueKeys)
        } catch (error) {
            loggingService.logError(
                "Failed to get issue summaries",
                error,
                "jira:getIssueSummaries"
            )
            throw error
        }
    })

    ipcMain.handle("jira:searchIssues", async (_, jql: string) => {
        try {
            if (!jiraService) throw new Error("Jira service not initialized")
            return await jiraService.searchIssues(jql)
        } catch (error) {
            loggingService.logError(
                "Failed to search issues",
                error,
                "jira:searchIssues"
            )
            throw error
        }
    })

    ipcMain.handle("jira:getWorklogs", async (_, issueKey: string) => {
        try {
            if (!jiraService) throw new Error("Jira service not initialized")
            return await jiraService.getWorklogs(issueKey)
        } catch (error) {
            loggingService.logError(
                "Failed to get worklogs",
                error,
                "jira:getWorklogs"
            )
            throw error
        }
    })

    ipcMain.handle(
        "jira:uploadTimeTracking",
        async (
            _,
            issueKey: string,
            timeSpentSeconds: number,
            started?: Date
        ) => {
            try {
                if (!jiraService)
                    throw new Error("Jira service not initialized")
                return await jiraService.uploadTimeTracking(
                    issueKey,
                    timeSpentSeconds,
                    started
                )
            } catch (error) {
                loggingService.logError(
                    "Failed to upload time tracking",
                    error,
                    "jira:uploadTimeTracking"
                )
                throw error
            }
        }
    )

    ipcMain.handle("jira:getBaseUrl", async () => {
        try {
            if (!jiraService) throw new Error("Jira service not initialized")
            return jiraService.getBaseUrl()
        } catch (error) {
            loggingService.logError(
                "Failed to get base URL",
                error,
                "jira:getBaseUrl"
            )
            throw error
        }
    })

    // Time Tracking handlers
    ipcMain.handle("timeTracking:start", async (_, issueKey: string) => {
        timeTrackingService.startTracking(issueKey)
        notifyTimeTrackingChanged()
        return { success: true }
    })

    ipcMain.handle("timeTracking:stop", async (_, issueKey: string) => {
        timeTrackingService.stopTracking(issueKey)
        notifyTimeTrackingChanged()
        return { success: true }
    })

    ipcMain.handle("timeTracking:stopById", async (_, id: number) => {
        timeTrackingService.stopTrackingById(id)
        notifyTimeTrackingChanged()
        return { success: true }
    })

    ipcMain.handle("timeTracking:getRecords", async (_, issueKey: string) => {
        return timeTrackingService.getRecords(issueKey)
    })

    ipcMain.handle("timeTracking:getUnsentRecords", async () => {
        return timeTrackingService.getUnsentCompletedRecords()
    })

    ipcMain.handle("timeTracking:getActiveRecords", async () => {
        return timeTrackingService.getActiveRecords()
    })

    ipcMain.handle("timeTracking:getYesterdayRecords", async () => {
        return timeTrackingService.getYesterdayRecords()
    })

    ipcMain.handle("timeTracking:getCurrentWeekRecords", async () => {
        return timeTrackingService.getCurrentWeekRecords()
    })

    ipcMain.handle(
        "timeTracking:getWeekRecords",
        async (_, weekOffset: number) => {
            return timeTrackingService.getWeekRecords(weekOffset)
        }
    )

    ipcMain.handle("timeTracking:updateRecord", async (_, record: any) => {
        timeTrackingService.updateRecord(record)
        notifyTimeTrackingChanged()
        return { success: true }
    })

    ipcMain.handle("timeTracking:deleteRecord", async (_, id: number) => {
        timeTrackingService.deleteRecord(id)
        notifyTimeTrackingChanged()
        return { success: true }
    })

    ipcMain.handle("timeTracking:markAsUploaded", async (_, id: number) => {
        timeTrackingService.markAsUploaded(id)
        notifyTimeTrackingChanged()
        return { success: true }
    })

    // Kanban handlers
    ipcMain.handle("kanban:getAllItems", async () => {
        return kanbanService.getAllItems()
    })

    ipcMain.handle(
        "kanban:getItemsByColumn",
        async (_, column: KanbanColumnType) => {
            return kanbanService.getItemsByColumn(column)
        }
    )

    ipcMain.handle("kanban:getItemsByIssue", async (_, issueKey: string) => {
        return kanbanService.getItemsByLinkedIssue(issueKey)
    })

    ipcMain.handle(
        "kanban:createItem",
        async (
            _,
            title: string,
            description: string,
            column: KanbanColumnType,
            linkedIssueKey?: string
        ) => {
            return kanbanService.createItem(
                title,
                description,
                column,
                linkedIssueKey
            )
        }
    )

    ipcMain.handle(
        "kanban:updateItem",
        async (
            _,
            id: number,
            title: string,
            description: string,
            linkedIssueKey?: string
        ) => {
            kanbanService.updateItem(id, title, description, linkedIssueKey)
            return { success: true }
        }
    )

    ipcMain.handle(
        "kanban:moveItem",
        async (
            _,
            id: number,
            newColumn: KanbanColumnType,
            newPosition: number
        ) => {
            kanbanService.moveItem(id, newColumn, newPosition)
            return { success: true }
        }
    )

    ipcMain.handle("kanban:deleteItem", async (_, id: number) => {
        kanbanService.deleteItem(id)
        return { success: true }
    })

    // Version handlers
    ipcMain.handle("version:getInfo", async () => {
        return versionService.getVersionInfo()
    })

    ipcMain.handle("version:checkForUpdates", async () => {
        return await versionService.checkForUpdates()
    })

    // Logging handlers
    ipcMain.handle("logging:getLogs", async (_, date?: string) => {
        const logDate = date ? new Date(date) : undefined
        return loggingService.getLogs(logDate)
    })

    ipcMain.handle("logging:getAllLogFiles", async () => {
        return loggingService.getAllLogFiles()
    })

    ipcMain.handle("logging:getLogsPath", async () => {
        return loggingService.getLogsPath()
    })

    // Analytics handlers
    ipcMain.handle("analytics:getDailyStats", async (_, days: number) => {
        return analyticsService.getDailyStats(days)
    })

    ipcMain.handle("analytics:getHourlyStats", async () => {
        return analyticsService.getHourlyStats()
    })

    ipcMain.handle("analytics:getIssueStats", async (_, limit: number) => {
        return analyticsService.getIssueStats(limit)
    })

    ipcMain.handle("analytics:getProductivityInsights", async () => {
        return analyticsService.getProductivityInsights()
    })

    // Milestones handlers
    ipcMain.handle(
        "milestone:add",
        async (_, description: string, issueKey?: string | null) => {
            try {
                const added = milestoneService.addMilestone(
                    description,
                    issueKey
                )
                return added
            } catch (error) {
                loggingService.logError(
                    "Failed to add milestone",
                    error,
                    "milestone:add"
                )
                throw error
            }
        }
    )

    ipcMain.handle("milestone:getAll", async () => {
        try {
            return milestoneService.getAll()
        } catch (error) {
            loggingService.logError(
                "Failed to get milestones",
                error,
                "milestone:getAll"
            )
            throw error
        }
    })

    ipcMain.handle("milestone:getLast12Months", async () => {
        try {
            return milestoneService.getLast12Months()
        } catch (error) {
            loggingService.logError(
                "Failed to get last 12 months milestones",
                error,
                "milestone:getLast12Months"
            )
            throw error
        }
    })

    ipcMain.handle(
        "milestone:generatePdf",
        async (_, saveFileName?: string) => {
            try {
                const window = new BrowserWindow({
                    show: false,
                    webPreferences: { offscreen: true },
                })
                const milestones = milestoneService.getAll()

                const html = `<!doctype html><html><head><meta charset="utf-8"><title>Milestones Report</title><style>body{font-family: Arial, sans-serif;padding:20px}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h1>Milestones Report</h1><table><thead><tr><th>Date</th><th>Issue</th><th>Description</th></tr></thead><tbody>${milestones.map((m) => `<tr><td>${m.loggedAt.toISOString().split("T")[0]}</td><td>${m.issueKey || ""}</td><td>${m.description}</td></tr>`).join("")}</tbody></table></body></html>`

                await window.loadURL(
                    `data:text/html,${encodeURIComponent(html)}`
                )
                const pdfBuffer = await window.webContents.printToPDF({})

                const userDataPath = app.getPath("userData")

                const fileName =
                    saveFileName ||
                    `milestones-${new Date().toISOString().split("T")[0]}.pdf`
                const fullPath = path.join(userDataPath, fileName)
                fs.writeFileSync(fullPath, pdfBuffer)

                window.destroy()
                return { success: true, path: fullPath }
            } catch (error) {
                loggingService.logError(
                    "Failed to generate milestones PDF",
                    error,
                    "milestone:generatePdf"
                )
                throw error
            }
        }
    )

    // Exports management - list and delete milestone PDF exports from userData
    ipcMain.handle("exports:listMilestonePdfs", async () => {
        try {
            const userDataPath = app.getPath("userData")
            const files = fs.readdirSync(userDataPath)
            const pdfs = files
                .filter((f) => f.toLowerCase().endsWith(".pdf"))
                .filter((f) => f.toLowerCase().includes("milestones"))
                .map((name) => {
                    const fullPath = path.join(userDataPath, name)
                    const stat = fs.statSync(fullPath)
                    return {
                        name,
                        path: fullPath,
                        createdAt: stat.ctime.toISOString(),
                    }
                })
            // sort by createdAt descending
            pdfs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            return pdfs
        } catch (error) {
            loggingService.logError(
                "Failed to list exported milestone PDFs",
                error,
                "exports:listMilestonePdfs"
            )
            throw error
        }
    })

    ipcMain.handle("exports:delete", async (_, filePath: string) => {
        try {
            if (!filePath) return { success: false }
            fs.unlinkSync(filePath)
            return { success: true }
        } catch (error) {
            loggingService.logError(
                "Failed to delete exported file",
                error,
                "exports:delete"
            )
            throw error
        }
    })

    ipcMain.handle(
        "milestone:update",
        async (
            _,
            id: number,
            description: string,
            issueKey?: string | null,
            loggedAt?: string
        ) => {
            try {
                const date = loggedAt ? new Date(loggedAt) : new Date()
                const updated = milestoneService.updateMilestone(
                    id,
                    description,
                    issueKey || null,
                    date
                )
                return updated
            } catch (error) {
                loggingService.logError(
                    "Failed to update milestone",
                    error,
                    "milestone:update"
                )
                throw error
            }
        }
    )

    ipcMain.handle("milestone:delete", async (_, id: number) => {
        try {
            const ok = milestoneService.deleteMilestone(id)
            return { success: ok }
        } catch (error) {
            loggingService.logError(
                "Failed to delete milestone",
                error,
                "milestone:delete"
            )
            throw error
        }
    })
}
