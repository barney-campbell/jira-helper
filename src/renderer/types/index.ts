export type ThemeMode = "light" | "dark" | "system"

export interface UserSettings {
    id: number
    baseUrl: string
    email: string
    apiToken: string
    theme?: ThemeMode
}

export interface TimeTrackingRecord {
    id: number
    issueKey: string
    startTime: Date
    endTime?: Date
    isUploaded: boolean
}

export interface JiraTextBlock {
    text: string
    isCode: boolean
}

export interface JiraComment {
    author: string
    bodyBlocks: JiraTextBlock[]
    created: Date
    updated?: Date
}

export interface JiraIssue {
    id: string
    key: string
    summary: string
    status: string
    assignee: string
    descriptionBlocks?: JiraTextBlock[]
    comments?: JiraComment[]
}

export interface JiraWorklog {
    author: string
    started: Date
    timeSpentSeconds: number
}

export interface TimeTrackingDisplay {
    started: string
    duration: string
    source: string
    canEdit: boolean
    recordId: number
}

export type ViewType =
    | "dashboard"
    | "assignedIssues"
    | "search"
    | "issueDetails"
    | "settings"
    | "kanban"
    | "calendar"
    | "analytics"
    | "milestones"
