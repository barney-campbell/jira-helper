# Jira Helper

Electron desktop application for managing Jira-related tasks such as time tracking, built with React and TypeScript.

## Features

- **Dashboard** - View unuploaded time tracking logs and yesterday's work summary
- **Assigned Issues** - Browse, filter, and manage your assigned Jira issues
- **Issue Search** - Search for issues using JQL queries
- **Issue Details** - View detailed information including description, comments, and time tracking
- **Time Tracking** - Track time spent on issues locally and upload to Jira
- **Calendar View** - Visualize your week's worklogs in a time-block format
- **Kanban Board** - Personal to-do list with ability to link Jira issues
- **Theme Support** - Dark, light, and system themes
- **Log Viewer** - View application error logs
- **Settings** - Configure Jira connection and preferences

## Technology Stack

- **Electron** - Cross-platform desktop application framework
- **React** - Frontend UI library
- **TypeScript** - Type-safe development
- **SQLite** - Local database for time tracking and settings
- **Vite** - Build tool and dev server

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

Start the development server with hot reload:

```bash
npm run dev
```

In another terminal, start the application:

```bash
npm run start:dev
```

## Building for Production

Build and package the application:

```bash
npm run package
```

This creates distributable packages in the `release` directory.

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
│   │   ├── services/           # Backend services and utilities
│   │   ├── main.ts             # Main entry point
│   │   ├── preload.ts          # Preload script for IPC
│   │   └── ipc-handlers.ts     # IPC communication handlers
│   └── renderer/               # Electron renderer process (React app)
│       ├── components/         # Reusable React components
│       ├── views/              # Main application views
│       └── types/              # TypeScript type definitions
├── public/                     # Static assets
├── dist/                       # Built application files
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies and scripts
```

## Reusable Components

The application includes reusable React components:

- **Button** - Customizable button with variants
- **Input** - Text input field
- **DataGrid** & **IssueTable** - Table components for displaying data
- **LoadingSpinner** - Loading indicator
- **Modal** - Dialog component
- **Toggle** - Toggle switch
- **Widget** - Container for dashboard widgets
- **Time Tracking Widgets** - Active, unuploaded, and yesterday's time tracking

## Versioning

Update the version using npm:

```bash
npm version patch   # 1.2.0 → 1.2.1
npm version minor   # 1.2.0 → 1.3.0
npm version major   # 1.2.0 → 2.0.0
```

## License

ISC
