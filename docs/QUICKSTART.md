# Quick Start Guide

Get started with Jira Helper in 5 minutes!

## Prerequisites

Ensure you have the following installed:

- **Node.js** v20 or higher ([Download](https://nodejs.org/))
- **npm** v10 or higher (comes with Node.js)
- **Jira API Token** ([Create one](https://id.atlassian.com/manage-profile/security/api-tokens))

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/barney-campbell/jira-helper.git
   cd jira-helper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   This will take 1-2 minutes to download all packages.

## Building and Running

### Development Mode

1. **Build the application**:

   ```bash
   npm run build:dev
   ```

2. **Start the app**:
   ```bash
   npm start
   ```

The application window will open automatically.

### Development with Hot Reload

For active development, use two terminal windows:

**Terminal 1** (watches for code changes):

```bash
npm run dev
```

**Terminal 2** (runs the app):

```bash
npm start
```

Now any changes to your code will automatically rebuild.

## First-Time Setup

When you first launch the app:

1. **Click the Settings icon** (⚙️) at the bottom of the sidebar
2. **Enter your Jira credentials**:
   - **Base URL**: Your Jira instance (e.g., `https://your-company.atlassian.net`)
   - **Email**: Your Atlassian account email
   - **API Token**: [Generate one here](https://id.atlassian.com/manage-profile/security/api-tokens)
3. **Click Save**

## Basic Usage

### Dashboard (📊)

View and upload untracked time logs to Jira.

### Assigned Issues (📋)

1. Click the list icon in the sidebar
2. View all issues assigned to you
3. Double-click an issue to see details

### Search (🔍)

1. Click the search icon in the sidebar
2. Enter a JQL query (e.g., `project = MYPROJECT AND status = Open`)
3. Click Search
4. Double-click an issue to see details

### Time Tracking

From the Issue Details view:

1. Click **Start Time Tracking** to begin tracking time
2. Click **Stop Time Tracking** when done
3. View all time records in the panel
4. Edit or delete records as needed
5. Go to Dashboard to upload tracked time to Jira

## Keyboard Shortcuts

| Shortcut              | Action             |
| --------------------- | ------------------ |
| `Enter` in search box | Execute search     |
| Double-click issue    | View issue details |

## Project Structure (Simplified)

```
jira-helper/
├── src/
│   ├── main/           # Backend (Node.js)
│   └── renderer/       # Frontend (React)
├── dist/               # Built files (generated)
├── package.json        # Dependencies
└── README.md          # Full documentation
```

## Common Commands

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm install`       | Install all dependencies     |
| `npm run build:dev` | Build in development mode    |
| `npm run build`     | Build for production         |
| `npm start`         | Run the application          |
| `npm run dev`       | Watch mode (auto-rebuild)    |
| `npm run package`   | Create distributable package |

## Building for Production

Create a distributable package:

```bash
npm run build
npm run package
```

Find the packages in the `release/` directory:

- **Windows**: `.exe` installer and `.zip` portable
- **macOS**: `.dmg` installer and `.zip` archive
- **Linux**: `.AppImage`, `.deb`, and `.rpm`

## Troubleshooting

### "Module not found" error

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails

```bash
rm -rf dist
npm run build:dev
```

### App won't start

1. Check that Node.js v20+ is installed: `node --version`
2. Rebuild native dependencies: `npm rebuild`
3. Try: `npm run build:dev && npm start`

### Jira API errors

1. Verify your settings (Base URL, Email, API Token)
2. Test the API token works at: https://id.atlassian.com/manage-profile/security/api-tokens
3. Ensure your Base URL is correct (no trailing slash)

### Database errors

Delete the database files and restart:

- **Linux**: `rm ~/.config/jira-helper/*.db`
- **macOS**: `rm ~/Library/Application\ Support/jira-helper/*.db`
- **Windows**: Delete `%APPDATA%\jira-helper\*.db`

## Getting Help

1. **README.md**: Full documentation
2. **COMPONENTS.md**: Component usage guide
3. **MIGRATION.md**: Architecture details
4. **ARCHITECTURE.md**: System design
5. **GitHub Issues**: Report bugs or request features

## Quick Tips

✅ **Save frequently**: Time tracking is saved locally immediately
✅ **Upload regularly**: Upload tracked time to Jira from the Dashboard
✅ **Double-click**: Double-click issues to view details
✅ **JQL Search**: Use Jira Query Language for powerful searches
✅ **Keyboard**: Press Enter in search box to search
✅ **Multiple issues**: Track time on multiple issues, but only one active at a time

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [COMPONENTS.md](COMPONENTS.md) to learn about reusable components
- Explore [MIGRATION.md](MIGRATION.md) to understand the architecture
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design details

## Example JQL Queries

Here are some useful JQL queries to try:

```jql
# Your open issues
assignee = currentUser() AND status != Done

# Recently updated
assignee = currentUser() ORDER BY updated DESC

# By project
project = MYPROJECT AND status = "In Progress"

# By date range
created >= -7d AND assignee = currentUser()

# By priority
priority = High AND assignee = currentUser()

# Multiple projects
project in (PROJ1, PROJ2) AND assignee = currentUser()
```

## Support

For questions or issues:

- Open an issue on [GitHub](https://github.com/barney-campbell/jira-helper/issues)
- Check existing issues for solutions
- Provide error messages and steps to reproduce

---

**Happy time tracking! 🚀**
