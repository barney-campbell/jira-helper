# Testing Documentation

This directory contains the automated test suite for Jira Helper. The tests are organized to ensure comprehensive coverage of both business logic and UI components.

## Test Structure

```
tests/
├── unit/                 # Unit tests for services and components
├── snapshots/            # Snapshot tests for React components
├── mocks/               # Mock utilities for testing
└── setup.ts             # Jest setup and global configuration
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Categories

### Unit Tests

Unit tests validate individual functions, services, and component behavior.

**Examples:**
- `time-tracking-service.test.ts` - Tests for time tracking database operations
- `jira-service.test.ts` - Tests for Jira API interactions
- `crypto-util.test.ts` - Tests for encryption/decryption utilities
- `Button.test.tsx` - Tests for button component interactions
- `Input.test.tsx` - Tests for input component behavior

### Snapshot Tests

Snapshot tests capture the rendered output of React components and detect unexpected changes.

**Examples:**
- `Button.snapshot.test.tsx` - Snapshots for button variants in different themes

## Mock Utilities

### Database Mocks (`mocks/database.mock.ts`)

Mock implementation of SQLite database for isolated testing:

```typescript
import { createMockDatabase } from '../mocks/database.mock';

const mockDb = createMockDatabase();
mockDb.setTableData('Users', [{ id: 1, name: 'Test User' }]);
```

### Jira API Mocks (`mocks/jira-api.mock.ts`)

Mock utilities for Jira API responses:

```typescript
import { mockFetch, mockJiraIssue } from '../mocks/jira-api.mock';

// Mock successful API response
mockFetch({ issues: [mockJiraIssue] });

// Mock API error
mockFetchError('Network error');
```

## Writing New Tests

### Unit Test Template

```typescript
import { MyService } from '../../src/main/services/my-service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  describe('myMethod', () => {
    it('should do something', () => {
      const result = service.myMethod('input');
      expect(result).toBe('expected output');
    });
  });
});
```

### Component Test Template

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { MyComponent } from '../../src/renderer/components/MyComponent';
import { lightTheme } from '../../src/renderer/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={lightTheme}>{component}</ThemeProvider>);
};

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithTheme(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Snapshot Test Template

```typescript
import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { MyComponent } from '../../src/renderer/components/MyComponent';
import { lightTheme } from '../../src/renderer/theme';

describe('MyComponent Snapshots', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <MyComponent />
      </ThemeProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Use mocks for external dependencies (database, API calls, file system)
3. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
5. **Coverage**: Aim for high test coverage but focus on meaningful tests over arbitrary coverage numbers
6. **Update Snapshots**: When intentional UI changes are made, update snapshots with `npm test -- -u`

## Continuous Integration

Tests are automatically run on:
- Pull requests to main/master/master-electron branches
- Pushes to main/master/master-electron branches

The CI workflow is defined in `.github/workflows/test.yml`.

## Troubleshooting

### Tests fail after dependency updates
Run `npm install` to ensure all test dependencies are up to date.

### Snapshot tests fail unexpectedly
Review the diff to see if the changes are intentional. If so, update snapshots with:
```bash
npm test -- -u
```

### Mock issues in Electron-specific code
Check `tests/setup.ts` for the mocked Electron modules and ensure they match your usage.

## Contributing

When adding new features:
1. Write tests for new functionality
2. Ensure all tests pass before submitting PR
3. Maintain or improve code coverage
4. Update this documentation if adding new test patterns or utilities
