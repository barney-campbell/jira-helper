import Database from "better-sqlite3"
import { app } from "electron"
import * as path from "path"
import type { TimeTrackingRecord } from "../../common/types"

export interface DailyStats {
    date: string
    totalSeconds: number
    issueCount: number
    issues: { [key: string]: number }
}

export interface HourlyStats {
    hour: number
    totalSeconds: number
    sessionCount: number
}

export interface IssueStats {
    issueKey: string
    totalSeconds: number
    sessionCount: number
    firstSession: Date
    lastSession: Date
}

export interface ProductivityInsights {
    mostProductiveHours: number[]
    mostWorkedIssues: IssueStats[]
    dailyAverage: number
    weeklyTrend: DailyStats[]
    totalTimeThisWeek: number
    totalTimeLastWeek: number
    longestSession: {
        issueKey: string
        duration: number
        date: Date
    } | null
}

export class AnalyticsService {
    private db: Database.Database

    constructor() {
        const userDataPath = app.getPath("userData")
        const dbPath = path.join(userDataPath, "time_tracking.db")
        this.db = new Database(dbPath)
    }

    getDailyStats(days: number = 30): DailyStats[] {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        const rows = this.db
            .prepare(
                `
      SELECT 
        DATE(StartTime) as date,
        IssueKey,
        SUM(
          CASE 
            WHEN EndTime IS NOT NULL 
            THEN (julianday(EndTime) - julianday(StartTime)) * 86400
            ELSE 0
          END
        ) as totalSeconds
      FROM TimeTrackingRecords
      WHERE StartTime >= ? AND EndTime IS NOT NULL
      GROUP BY DATE(StartTime), IssueKey
      ORDER BY date DESC
    `
            )
            .all(startDate.toISOString()) as any[]

        const dailyMap = new Map<string, DailyStats>()

        rows.forEach((row) => {
            if (!dailyMap.has(row.date)) {
                dailyMap.set(row.date, {
                    date: row.date,
                    totalSeconds: 0,
                    issueCount: 0,
                    issues: {},
                })
            }

            const dayStats = dailyMap.get(row.date)!
            dayStats.totalSeconds += row.totalSeconds
            dayStats.issues[row.IssueKey] =
                (dayStats.issues[row.IssueKey] || 0) + row.totalSeconds
            dayStats.issueCount = Object.keys(dayStats.issues).length
        })

        return Array.from(dailyMap.values())
    }

    getHourlyStats(): HourlyStats[] {
        const rows = this.db
            .prepare(
                `
      SELECT 
        CAST(strftime('%H', StartTime) AS INTEGER) as hour,
        COUNT(*) as sessionCount,
        SUM(
          CASE 
            WHEN EndTime IS NOT NULL 
            THEN (julianday(EndTime) - julianday(StartTime)) * 86400
            ELSE 0
          END
        ) as totalSeconds
      FROM TimeTrackingRecords
      WHERE EndTime IS NOT NULL
      GROUP BY hour
      ORDER BY hour
    `
            )
            .all() as any[]

        return rows.map((row) => ({
            hour: row.hour,
            totalSeconds: row.totalSeconds || 0,
            sessionCount: row.sessionCount,
        }))
    }

    getIssueStats(limit: number = 10): IssueStats[] {
        const rows = this.db
            .prepare(
                `
      SELECT 
        IssueKey,
        COUNT(*) as sessionCount,
        SUM(
          CASE 
            WHEN EndTime IS NOT NULL 
            THEN (julianday(EndTime) - julianday(StartTime)) * 86400
            ELSE 0
          END
        ) as totalSeconds,
        MIN(StartTime) as firstSession,
        MAX(StartTime) as lastSession
      FROM TimeTrackingRecords
      WHERE EndTime IS NOT NULL
      GROUP BY IssueKey
      ORDER BY totalSeconds DESC
      LIMIT ?
    `
            )
            .all(limit) as any[]

        return rows.map((row) => ({
            issueKey: row.IssueKey,
            totalSeconds: row.totalSeconds || 0,
            sessionCount: row.sessionCount,
            firstSession: new Date(row.firstSession),
            lastSession: new Date(row.lastSession),
        }))
    }

    getProductivityInsights(): ProductivityInsights {
        const MAX_WEEKLY_DAYS = 7
        const TOP_PRODUCTIVE_HOURS_COUNT = 3
        const TOP_ISSUES_COUNT = 5
        const STATS_PERIOD_DAYS = 30

        const hourlyStats = this.getHourlyStats()
        const issueStats = this.getIssueStats(TOP_ISSUES_COUNT)
        const dailyStats = this.getDailyStats(STATS_PERIOD_DAYS)

        // Find most productive hours (top 3)
        const sortedHours = [...hourlyStats].sort(
            (a, b) => b.totalSeconds - a.totalSeconds
        )
        const mostProductiveHours = sortedHours
            .slice(0, TOP_PRODUCTIVE_HOURS_COUNT)
            .map((h) => h.hour)

        // Calculate daily average
        const totalSeconds = dailyStats.reduce(
            (sum, day) => sum + day.totalSeconds,
            0
        )
        const dailyAverage =
            dailyStats.length > 0 ? totalSeconds / dailyStats.length : 0

        // Get this week's stats
        const today = new Date()
        const monday = new Date(today)
        const dayOfWeek = today.getDay()
        const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        monday.setDate(today.getDate() + daysFromMonday)
        monday.setHours(0, 0, 0, 0)

        const thisWeekStart = monday.toISOString()

        // For fair comparison, calculate the same point in time last week
        const sameTimeLastWeek = new Date(today)
        sameTimeLastWeek.setDate(today.getDate() - MAX_WEEKLY_DAYS)

        const lastWeekStart = new Date(monday)
        lastWeekStart.setDate(monday.getDate() - MAX_WEEKLY_DAYS)

        const weeklyTrend = dailyStats
            .filter((day) => day.date >= thisWeekStart.split("T")[0])
            .slice(0, MAX_WEEKLY_DAYS)
        const totalTimeThisWeek = weeklyTrend.reduce(
            (sum, day) => sum + day.totalSeconds,
            0
        )

        // Compare like-for-like: same days/time last week
        const lastWeekData = dailyStats.filter((day) => {
            const dayDate = day.date
            const lastWeekEnd = sameTimeLastWeek.toISOString().split("T")[0]
            return (
                dayDate >= lastWeekStart.toISOString().split("T")[0] &&
                dayDate <= lastWeekEnd
            )
        })
        const totalTimeLastWeek = lastWeekData.reduce(
            (sum, day) => sum + day.totalSeconds,
            0
        )

        // Find longest session
        const longestSessionRow = this.db
            .prepare(
                `
      SELECT 
        IssueKey,
        StartTime,
        (julianday(EndTime) - julianday(StartTime)) * 86400 as duration
      FROM TimeTrackingRecords
      WHERE EndTime IS NOT NULL
      ORDER BY duration DESC
      LIMIT 1
    `
            )
            .get() as any

        const longestSession = longestSessionRow
            ? {
                  issueKey: longestSessionRow.IssueKey,
                  duration: longestSessionRow.duration,
                  date: new Date(longestSessionRow.StartTime),
              }
            : null

        return {
            mostProductiveHours,
            mostWorkedIssues: issueStats,
            dailyAverage,
            weeklyTrend,
            totalTimeThisWeek,
            totalTimeLastWeek,
            longestSession,
        }
    }

    close(): void {
        this.db.close()
    }
}
