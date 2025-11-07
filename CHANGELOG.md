# Planned

- Better "empty" states

# Next

### Changed

- Worklog edit modal now uses date-time picker UI controls instead of text inputs for improved user experience

# 1.6.0

### Changed

- Compact view is now enabled by default in Yesterday's Time Tracking widget on the homepage

# 1.5.0

### Added

- Column sorting in issue tables - click column headers to sort ascending, click again for descending, and once more to clear sorting
- Separate display for "Done" issues in assigned issues view, shown in secondary table below active issues
- Navigation history state with forward/back support via Navigate menu, keyboard shortcuts (Alt+Left, Alt+Right), and mouse navigation buttons
- Display parent issue on issue details page when available with clickable link to navigate to parent issue

# 1.4.1

### Added

- Automatic in-app updates delivered via GitHub Releases using the Electron auto-updater

# 1.4.0

### Added

- Compact mode for Yesterday's Time Tracking widget with toggle to switch between detailed and aggregated views
- Personal Analytics page displaying productivity insights, time tracking statistics, and visualizations based on historical worklog data
- Week navigation controls in Calendar view with Previous Week, Next Week, and Current Week buttons

### Changed

- Updated README to reflect current project features and simplified content

# 1.3.2

### Fixed

- Logs now display in reverse chronological order (newest first, oldest last) for easier access to recent logs
- Kanban board columns are now scrollable when items overflow, ensuring the "Add Item" button remains accessible

# 1.3.1

### Fixed

- Navigation menu now has background matching widgets to differentiate it from page contents
- Settings area now fills available space by removing max-width constraint


# 1.3.0

### Added

- Issue table filtering by status, assignee, and project
- Project column displayed in issue tables
- Calendar view displaying worklogs for the current week (Mon-Fri) in a visual time-block format
- Error logging service that captures errors throughout the application with timestamps, error messages, stack traces, and code locations
- Log viewer in settings page showing logs in a side-by-side layout with credentials/theme settings

# 1.2.4

### Fixed

- Code blocks now have correct contrast in dark and light modes (darker in light mode, lighter in dark mode)
- Theming issues for areas within TODO ([385ee02](https://github.com/barney-campbell/jira-helper/pull/16/commits/385ee02acbcab8226d5c22470e46fb91e51d2be6))
- Disable auto version tagging. NPM method works, and given the action for checking the version, it is more flexible to just tag the commit manually ([35395ff](https://github.com/barney-campbell/jira-helper/pull/16/commits/35395ffed9ebc8ccb84221c43667a271cd89aefb))

# 1.2.1 - 1.2.3

### Fixed

- Build action issues

# 1.2.0

### Added

- Dark, Light, System theme preference persists in database and can be toggled from Settings or View menu ([#10](https://github.com/barney-campbell/jira-helper/pull/10))
- Summary column in yesterday time tracking widget, widget now spans full dashboard width ([#12](https://github.com/barney-campbell/jira-helper/pull/12))
- Display version in settings, check git tags for updates

# 1.1.0

### Added

- Dashboard widget displaying time tracking from the previous working day
- Kanban-style to do list with ability to link jira issues

# 1.0.0

### Added

- Initial version ported from WPF app
