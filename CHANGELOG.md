# Next

### Added

- Error logging service that captures errors throughout the application with timestamps, error messages, stack traces, and code locations
- Log viewer in settings page showing logs in a side-by-side layout with credentials/theme settings
- Logs are stored as sequential JSON objects in daily log files in the app data logs directory

# Planned

- Better "empty" states
- Filtering issues table

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
