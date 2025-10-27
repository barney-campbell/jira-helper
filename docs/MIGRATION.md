# Migration from WPF to Electron

This document outlines the migration of the Jira Helper application from a WPF (.NET) desktop application to an Electron application with React and TypeScript.

## Architecture Changes

### Before (WPF)
```
JiraHelper.Core (WPF UI) ──┐
                           ├──> JiraHelper.JiraApi
                           ├──> JiraHelper.TimeTracking
                           └──> JiraHelper.Settings
```

### After (Electron)
```
Main Process (Node.js)
├── IPC Handlers
├── Jira Service
├── Time Tracking Service
└── Settings Service

Renderer Process (React)
├── Components (Reusable UI)
├── Views (Main Pages)
└── IPC Communication
```

## Key Migration Points

### 1. Database Access
- **Before**: Entity Framework Core with SQLite
- **After**: better-sqlite3 directly in main process
- **Benefit**: Simpler, faster, no ORM overhead

### 2. UI Framework
- **Before**: WPF with XAML
- **After**: React with TypeScript
- **Benefit**: Modern web technologies, hot reload, easier debugging

### 3. API Communication
- **Before**: HttpClient in C#
- **After**: Fetch API in TypeScript
- **Benefit**: Native JavaScript API, consistent across platform

### 4. Inter-Process Communication
- **Before**: Direct method calls
- **After**: Electron IPC (Inter-Process Communication)
- **Security**: Context isolation enabled, preload script for safe IPC

## Reusable Components

All UI components are built as reusable React components that can be used throughout the application:

### Button Component
```tsx
<Button onClick={handleClick} variant="primary">
  Click Me
</Button>

// Variants: primary, secondary, danger
```

### Input Component
```tsx
<Input
  value={text}
  onChange={setText}
  placeholder="Enter text"
  type="text"
/>

// Types: text, password, email
```

### DataGrid Component
```tsx
<DataGrid
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Status', accessor: (row) => <Badge>{row.status}</Badge> }
  ]}
  data={items}
  onRowDoubleClick={handleRowClick}
/>
```

### LoadingSpinner Component
```tsx
<LoadingSpinner size="medium" />

// Sizes: small, medium, large
```

### Modal Component
```tsx
<Modal
  isOpen={open}
  onClose={handleClose}
  title="Edit Record"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  {/* Modal content */}
</Modal>
```

### UnuploadedTimeTrackingWidget Component
A specialized widget that displays unuploaded time tracking records and provides upload functionality. This component can be reused in any view that needs to show pending time logs.

## Feature Mapping

| WPF Feature | Electron Equivalent | Status |
|------------|---------------------|--------|
| MainWindow | App.tsx + Sidebar Navigation | ✅ Complete |
| DashboardView | DashboardView.tsx | ✅ Complete |
| AssignedIssuesView | AssignedIssuesView.tsx | ✅ Complete |
| IssueSearchView | IssueSearchView.tsx | ✅ Complete |
| IssueDetailsView | IssueDetailsView.tsx | ✅ Complete |
| SettingsView | SettingsView.tsx | ✅ Complete |
| UnuploadedTimeTrackingWidget | UnuploadedTimeTrackingWidget.tsx | ✅ Complete |
| EditTimeTrackingDialog | Modal + Form in IssueDetailsView | ✅ Complete |
| JiraService | jira-service.ts (Main Process) | ✅ Complete |
| TimeTrackingService | time-tracking-service.ts (Main Process) | ✅ Complete |
| SettingsService | settings-service.ts (Main Process) | ✅ Complete |

## Data Flow

### Before (WPF - Direct Access)
```
UI Component → Service → Database
            → Jira API
```

### After (Electron - IPC)
```
React Component → IPC → Main Process → Service → Database
                                                → Jira API
```

## Benefits of the Migration

1. **Cross-Platform**: Works on Windows, macOS, and Linux
2. **Modern Stack**: React, TypeScript, and modern web technologies
3. **Developer Experience**: Hot reload, better debugging tools
4. **Component Reusability**: All UI elements are reusable React components
5. **Type Safety**: TypeScript ensures type safety across the entire application
6. **Security**: Context isolation prevents direct Node.js access from renderer
7. **Maintainability**: Clear separation between UI and business logic

## Code Organization

```
src/
├── main/                      # Electron main process (Node.js)
│   ├── services/             # Business logic services
│   │   ├── jira-service.ts
│   │   ├── time-tracking-service.ts
│   │   └── settings-service.ts
│   ├── main.ts               # Application entry point
│   ├── preload.ts            # Secure IPC bridge
│   └── ipc-handlers.ts       # IPC request handlers
│
└── renderer/                 # Electron renderer process (React)
    ├── components/           # Reusable UI components
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── DataGrid.tsx
    │   ├── LoadingSpinner.tsx
    │   ├── Modal.tsx
    │   └── UnuploadedTimeTrackingWidget.tsx
    ├── views/                # Main application views
    │   ├── DashboardView.tsx
    │   ├── AssignedIssuesView.tsx
    │   ├── IssueSearchView.tsx
    │   ├── IssueDetailsView.tsx
    │   └── SettingsView.tsx
    ├── styles/               # CSS stylesheets
    ├── types/                # TypeScript type definitions
    ├── App.tsx               # Root React component
    └── index.tsx             # React entry point
```

## Testing the Application

1. Build the application:
   ```bash
   npm run build:dev
   ```

2. Run the application:
   ```bash
   npm start
   ```

3. Configure settings:
   - Click the gear icon (⚙️) at the bottom of the sidebar
   - Enter your Jira Base URL, Email, and API Token
   - Click Save

4. Test features:
   - Dashboard: View unuploaded time logs
   - Assigned Issues: Browse your Jira issues
   - Search: Use JQL to find issues
   - Issue Details: View and track time on specific issues

## Future Enhancements

Potential improvements that leverage the new architecture:

1. **Offline Mode**: Cache issues and sync when online
2. **Notifications**: Desktop notifications for issue updates
3. **Keyboard Shortcuts**: Global shortcuts for common actions
4. **Themes**: Light/dark mode support
5. **Multi-Account**: Support for multiple Jira instances
6. **Reports**: Time tracking reports and analytics
7. **Auto-Updates**: Electron's built-in auto-updater

## Troubleshooting

### Build Issues
- Clear `dist` folder and rebuild: `rm -rf dist && npm run build:dev`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Runtime Issues
- Check the Electron console (View → Toggle Developer Tools)
- Verify settings are correctly configured
- Check database files exist in the user data directory

### Database Location
- **Linux**: `~/.config/jira-helper/`
- **macOS**: `~/Library/Application Support/jira-helper/`
- **Windows**: `%APPDATA%\jira-helper\`
