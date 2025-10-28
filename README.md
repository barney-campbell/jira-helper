# Jira Helper

Electron desktop application for managing Jira-related tasks such as time tracking, built with React and TypeScript.

## Features

- **Dashboard** - View unuploaded time tracking logs
- **Assigned Issues** - Browse and manage your assigned Jira issues
- **Issue Search** - Search for issues using JQL queries
- **Issue Details** - View detailed information about issues including description, comments, and time tracking
- **Time Tracking** - Track time spent on issues locally and upload to Jira
- **Settings** - Configure Jira connection (Base URL, Email, API Token)

## Technology Stack

- **Electron** - Cross-platform desktop application framework
- **React** - Frontend UI library
- **TypeScript** - Type-safe development
- **SQLite** - Local database for time tracking and settings
- **Webpack** - Module bundler

## Prerequisites

- Node.js (v20 or higher)
- npm (v10 or higher)
- Jira account with API token

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/barney-campbell/jira-helper.git
   cd jira-helper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

1. Build the application:
   ```bash
   npm run build:dev
   ```

2. Start the application:
   ```bash
   npm start
   ```

3. For development with hot reload:
   ```bash
   npm run dev
   ```
   Then in another terminal:
   ```bash
   npm start
   ```

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Package the application:
   ```bash
   npm run package
   ```

This will create distributable packages in the `release` directory.

## Configuration

On first launch, go to Settings (gear icon at the bottom of the sidebar) and configure:

- **Base URL**: Your Jira instance URL (e.g., `https://your-domain.atlassian.net`)
- **Email**: Your Jira account email
- **API Token**: Generate from your Atlassian account settings

## Project Structure

```
jira-helper/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── services/           # Backend services (Jira, Time Tracking, Settings)
│   │   ├── main.ts             # Main entry point
│   │   ├── preload.ts          # Preload script for IPC
│   │   └── ipc-handlers.ts     # IPC communication handlers
│   └── renderer/               # Electron renderer process (React app)
│       ├── components/         # Reusable React components
│       ├── views/              # Main application views
│       ├── styles/             # CSS stylesheets
│       ├── types/              # TypeScript type definitions
│       ├── App.tsx             # Main React component
│       └── index.tsx           # React entry point
├── public/                     # Static assets
├── dist/                       # Built application files
├── webpack.config.js           # Webpack configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies and scripts
```

## Reusable Components

The application includes the following reusable React components:

- **Button** - Customizable button with variants (primary, secondary, danger)
- **Input** - Text input with support for different types
- **DataGrid** - Table component for displaying data
- **LoadingSpinner** - Loading indicator with size options
- **Modal** - Dialog component for forms and confirmations
- **UnuploadedTimeTrackingWidget** - Widget for managing unuploaded time logs

## Versioning Workflow

This project uses automated versioning through GitHub Actions:

### Auto-Tagging on Master Branch

When pushing to the `master` branch, the workflow automatically:

1. Compares the version in `package.json` with the latest git tag
2. **If versions differ**: Tags the commit with the version from `package.json`
3. **If versions match**: 
   - Increments the patch version (e.g., 1.2.0 → 1.2.1)
   - Updates `package.json` and `package-lock.json` with the new version
   - Commits the version bump
   - Tags the new commit with the bumped version

### Version Check for Pull Requests to master-electron

When opening a pull request targeting `master-electron`, the workflow:

1. Checks if the version in `package.json` has been updated compared to the base branch
2. **Fails** if the version hasn't been updated
3. **Succeeds** if the version has been updated

This check is required to pass before merging to `master-electron`.

### Manual Versioning

To manually update the version before pushing to master:

```bash
npm version patch   # 1.2.0 → 1.2.1
npm version minor   # 1.2.0 → 1.3.0
npm version major   # 1.2.0 → 2.0.0
```
## License

ISC
