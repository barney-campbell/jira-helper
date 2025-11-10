export type ThemeMode = "light" | "dark" | "system";

export interface UserSettings {
  id: number;
  baseUrl: string;
  email: string;
  apiToken: string;
  theme?: ThemeMode;
}

export interface TimeTrackingRecord {
  id: number;
  issueKey: string;
  startTime: Date;
  endTime?: Date;
  isUploaded: boolean;
}

export interface JiraTextBlock {
  text: string;
  isCode: boolean;
}

export interface JiraComment {
  author: string;
  bodyBlocks: JiraTextBlock[];
  created: Date;
  updated?: Date;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  assignee: string;
  project?: string;
  parent?: {
    key: string;
    summary: string;
  };
  descriptionBlocks?: JiraTextBlock[];
  comments?: JiraComment[];
}

export interface JiraWorklog {
  author: string;
  started: Date;
  timeSpentSeconds: number;
}

export interface TimeTrackingDisplay {
  started: string;
  duration: string;
  source: string;
  canEdit: boolean;
  recordId: number;
}

export type ViewType =
  | "dashboard"
  | "assignedIssues"
  | "search"
  | "issueDetails"
  | "settings"
  | "kanban"
  | "calendar"
  | "analytics";

export type KanbanColumnType = "todo" | "inProgress" | "done";

export interface KanbanItem {
  id: number;
  title: string;
  description: string;
  column: KanbanColumnType;
  position: number;
  linkedIssueKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VersionInfo {
  version: string;
  isDev: boolean;
  updateAvailable?: boolean;
  latestVersion?: string;
}

export type UpdateStatusType =
  | "checking"
  | "update-available"
  | "update-not-available"
  | "download-progress"
  | "update-downloaded"
  | "error";

export interface UpdateStatusPayload {
  status: UpdateStatusType;
  version?: string;
  percent?: number;
  message?: string;
}

export interface LogEntry {
  timestamp: string;
  level: "error" | "warning" | "info";
  message: string;
  error?: string;
  stack?: string;
  location?: string;
}

export interface DailyStats {
  date: string;
  totalSeconds: number;
  issueCount: number;
  issues: { [key: string]: number };
}

export interface HourlyStats {
  hour: number;
  totalSeconds: number;
  sessionCount: number;
}

export interface IssueStats {
  issueKey: string;
  totalSeconds: number;
  sessionCount: number;
  firstSession: Date;
  lastSession: Date;
}

export interface ProductivityInsights {
  mostProductiveHours: number[];
  mostWorkedIssues: IssueStats[];
  dailyAverage: number;
  weeklyTrend: DailyStats[];
  totalTimeThisWeek: number;
  totalTimeLastWeek: number;
  longestSession: {
    issueKey: string;
    duration: number;
    date: Date;
  } | null;
}
