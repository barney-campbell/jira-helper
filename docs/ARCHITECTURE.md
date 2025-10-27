# Jira Helper Architecture

This document provides a visual overview of the application architecture after the Electron migration.

## Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron App                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐         ┌──────────────────────┐  │
│  │   Main Process      │◄────────┤  Renderer Process    │  │
│  │   (Node.js)         │   IPC   │  (React/Browser)     │  │
│  └─────────────────────┘         └──────────────────────┘  │
│           │                                │                 │
│           │                                │                 │
│  ┌────────▼────────┐                ┌─────▼──────┐         │
│  │   Services      │                │   Views    │         │
│  ├─────────────────┤                ├────────────┤         │
│  │ • Jira API      │                │ • Dashboard│         │
│  │ • Time Tracking │                │ • Issues   │         │
│  │ • Settings      │                │ • Search   │         │
│  └────────┬────────┘                │ • Details  │         │
│           │                         │ • Settings │         │
│  ┌────────▼────────┐                └─────┬──────┘         │
│  │   SQLite DB     │                ┌─────▼──────┐         │
│  ├─────────────────┤                │ Components │         │
│  │ • time_tracking │                ├────────────┤         │
│  │ • settings      │                │ • Button   │         │
│  └─────────────────┘                │ • Input    │         │
│                                      │ • DataGrid │         │
│           │                         │ • Modal    │         │
│  ┌────────▼────────┐                │ • Spinner  │         │
│  │   Jira API      │                │ • Widget   │         │
│  │   (REST)        │                └────────────┘         │
│  └─────────────────┘                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx
├── Sidebar Navigation
│   ├── Dashboard Button
│   ├── Assigned Issues Button
│   ├── Search Button
│   └── Settings Button
│
└── Main Content Area
    │
    ├── DashboardView
    │   └── UnuploadedTimeTrackingWidget
    │       ├── DataGrid
    │       ├── Button (Upload)
    │       └── LoadingSpinner
    │
    ├── AssignedIssuesView
    │   ├── Button (Refresh)
    │   ├── LoadingSpinner
    │   └── DataGrid
    │       └── (on double-click) → IssueDetailsView
    │
    ├── IssueSearchView
    │   ├── Input (Search)
    │   ├── Button (Search)
    │   ├── LoadingSpinner
    │   └── DataGrid
    │       └── (on double-click) → IssueDetailsView
    │
    ├── IssueDetailsView
    │   ├── Issue Info Section
    │   │   ├── Button (View in Jira)
    │   │   ├── Description
    │   │   └── Comments
    │   │
    │   └── Time Tracking Panel
    │       ├── Button (Start/Stop)
    │       ├── DataGrid (Records)
    │       │   ├── Button (Edit)
    │       │   └── Button (Delete)
    │       └── Modal (Edit Record)
    │           ├── Input (Start Time)
    │           ├── Input (End Time)
    │           ├── Button (Cancel)
    │           └── Button (Save)
    │
    └── SettingsView
        ├── Input (Base URL)
        ├── Input (Email)
        ├── Input (API Token)
        └── Button (Save)
```

## Data Flow

### 1. Loading Assigned Issues

```
User clicks "Assigned Issues"
         │
         ▼
AssignedIssuesView.tsx
         │
         ▼
window.electronAPI.getAssignedIssues()
         │
         ▼
IPC Communication
         │
         ▼
Main Process: ipc-handlers.ts
         │
         ▼
jira-service.ts → getAssignedIssues()
         │
         ▼
Fetch to Jira API
         │
         ▼
Parse JSON Response
         │
         ▼
Return JiraIssue[]
         │
         ▼
IPC Response
         │
         ▼
AssignedIssuesView updates state
         │
         ▼
DataGrid renders issues
```

### 2. Time Tracking Flow

```
User clicks "Start Tracking"
         │
         ▼
IssueDetailsView.tsx
         │
         ▼
window.electronAPI.startTracking(issueKey)
         │
         ▼
IPC Communication
         │
         ▼
Main Process: ipc-handlers.ts
         │
         ▼
time-tracking-service.ts
         │
         ├─→ Stop any active tracking
         │   (UPDATE TimeTrackingRecords SET EndTime = NOW())
         │
         └─→ Start new tracking
             (INSERT INTO TimeTrackingRecords)
         │
         ▼
SQLite Database Updated
         │
         ▼
IPC Response
         │
         ▼
IssueDetailsView refreshes tracking data
         │
         ▼
UI updates to show tracking state
```

### 3. Upload Time Tracking

```
User clicks "Upload All"
         │
         ▼
UnuploadedTimeTrackingWidget.tsx
         │
         ▼
Get unsent records
window.electronAPI.getUnsentTimeTrackingRecords()
         │
         ▼
For each record:
  │
  ├─→ Calculate duration
  │
  ├─→ window.electronAPI.uploadTimeTracking()
  │        │
  │        ▼
  │   IPC → jira-service.ts
  │        │
  │        ▼
  │   POST to Jira API
  │        │
  │        ▼
  │   Success/Failure
  │
  └─→ window.electronAPI.markAsUploaded(id)
           │
           ▼
      UPDATE TimeTrackingRecords SET IsUploaded = 1
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Renderer Process                        │
│                 (Isolated Context)                      │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │  React Application                           │     │
│  │  • No direct Node.js access                 │     │
│  │  • No direct filesystem access              │     │
│  │  • No direct database access                │     │
│  │  • Can only use window.electronAPI          │     │
│  └────────────────────┬─────────────────────────┘     │
│                       │                                 │
└───────────────────────┼─────────────────────────────────┘
                        │
                        │ Context Bridge
                        │ (preload.ts)
                        │
┌───────────────────────▼─────────────────────────────────┐
│                 Main Process                            │
│                 (Full Node.js Access)                   │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │  Services                                    │     │
│  │  • Full filesystem access                   │     │
│  │  • Database operations                      │     │
│  │  • Network requests                         │     │
│  │  • All Node.js APIs                         │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Security Features

1. **Context Isolation**: Renderer process cannot access Node.js APIs directly
2. **Preload Script**: Acts as a secure bridge with specific exposed methods
3. **IPC Validation**: All IPC calls are validated in the main process
4. **No eval()**: Content Security Policy prevents arbitrary code execution
5. **Sandboxing**: Renderer process runs in a sandboxed environment

## Technology Stack

### Frontend (Renderer Process)
- **React 19.2**: UI library
- **TypeScript 5.9**: Type safety
- **CSS3**: Styling
- **Webpack 5**: Module bundling

### Backend (Main Process)
- **Electron 38**: Desktop framework
- **Node.js 20**: Runtime
- **better-sqlite3 12**: Database
- **TypeScript 5.9**: Type safety

### Development Tools
- **ts-loader**: TypeScript compilation
- **webpack-dev-server**: Development server
- **electron-builder**: Application packaging

## File Size Breakdown

```
Application Bundle (Production)
├── main.js                    ~70 KB    (Main process)
├── preload.js                 ~4 KB     (IPC bridge)
├── renderer.js                ~1.2 MB   (React app + dependencies)
├── node_modules/better-sqlite3 ~5 MB    (Native SQLite)
└── Electron framework         ~150 MB   (Cross-platform)
──────────────────────────────────────
Total App Size:                ~156 MB
```

## Performance Considerations

### Startup Time
1. **Electron Launch**: ~500ms
2. **Main Process Init**: ~200ms
3. **Renderer Load**: ~300ms
4. **React Render**: ~200ms
5. **Total**: ~1.2 seconds

### Memory Usage
- **Main Process**: ~50 MB
- **Renderer Process**: ~80 MB
- **Total**: ~130 MB (idle)

### Optimization Strategies
1. **Code Splitting**: Separate bundles for main/renderer
2. **Tree Shaking**: Remove unused code
3. **Lazy Loading**: Load views on demand
4. **Database Indexing**: Optimize SQLite queries
5. **IPC Batching**: Reduce IPC overhead

## Deployment Architecture

```
Release Package
├── Windows
│   ├── jira-helper-setup-1.0.0.exe    (Installer)
│   └── jira-helper-1.0.0-win.zip      (Portable)
│
├── macOS
│   ├── jira-helper-1.0.0.dmg          (Installer)
│   └── jira-helper-1.0.0-mac.zip      (Archive)
│
└── Linux
    ├── jira-helper-1.0.0.AppImage     (Portable)
    ├── jira-helper-1.0.0.deb          (Debian/Ubuntu)
    └── jira-helper-1.0.0.rpm          (RedHat/Fedora)
```

## Build Process

```
Source Code (TypeScript + React)
         │
         ▼
    Webpack Build
         │
         ├─→ Main Process Bundle
         │   └── dist/main.js
         │
         ├─→ Preload Script
         │   └── dist/preload.js
         │
         └─→ Renderer Bundle
             ├── dist/renderer.js
             └── dist/index.html
         │
         ▼
  Electron Builder
         │
         ├─→ Package for Windows
         ├─→ Package for macOS
         └─→ Package for Linux
         │
         ▼
  Distributable Packages
```

## Future Enhancements

### Planned Features
1. **Auto-updates**: Electron's built-in updater
2. **Offline Mode**: IndexedDB cache for issues
3. **Notifications**: Native desktop notifications
4. **Tray Icon**: Quick access from system tray
5. **Global Shortcuts**: Keyboard shortcuts for common actions
6. **Multi-Window**: Separate windows for different issues
7. **Export Reports**: PDF/CSV time tracking reports
8. **Themes**: Light/dark mode toggle
9. **Plugins**: Extension system for custom features
10. **Cloud Sync**: Optional cloud backup of time tracking

### Performance Improvements
1. **Virtual Scrolling**: For large issue lists
2. **Worker Threads**: Background processing
3. **React Memo**: Optimize re-renders
4. **Incremental Loading**: Load data on demand
5. **Database Caching**: In-memory cache for frequent queries
