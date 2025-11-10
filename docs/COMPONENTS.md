# Reusable Component Guide

This document provides detailed information about all reusable components in the Jira Helper application.

## Component Overview

All components are built with React and TypeScript to ensure type safety and reusability across the application.

## Components

### 1. Button

A customizable button component with multiple variants.

**Location**: `src/renderer/components/Button.tsx`

**Props**:

- `children`: ReactNode - Button content
- `onClick?`: () => void - Click handler
- `disabled?`: boolean - Disabled state (default: false)
- `variant?`: 'primary' | 'secondary' | 'danger' - Button style (default: 'primary')
- `type?`: 'button' | 'submit' - HTML button type (default: 'button')
- `className?`: string - Additional CSS classes

**Usage Examples**:

```tsx
// Primary button (default)
<Button onClick={handleSave}>Save</Button>

// Secondary button
<Button onClick={handleCancel} variant="secondary">Cancel</Button>

// Danger button
<Button onClick={handleDelete} variant="danger">Delete</Button>

// Disabled button
<Button onClick={handleSubmit} disabled={isLoading}>Submit</Button>
```

**Where Used**:

- SettingsView - Save button
- AssignedIssuesView - Refresh button
- IssueSearchView - Search button
- IssueDetailsView - Start/Stop tracking, Edit/Delete buttons
- UnuploadedTimeTrackingWidget - Upload button

---

### 2. Input

A text input component with support for different input types.

**Location**: `src/renderer/components/Input.tsx`

**Props**:

- `value`: string - Input value
- `onChange`: (value: string) => void - Change handler
- `placeholder?`: string - Placeholder text
- `type?`: 'text' | 'password' | 'email' - Input type (default: 'text')
- `disabled?`: boolean - Disabled state (default: false)
- `className?`: string - Additional CSS classes
- `onKeyDown?`: (e: React.KeyboardEvent) => void - Key event handler

**Usage Examples**:

```tsx
// Text input
<Input
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Enter search term"
/>

// Password input
<Input
  type="password"
  value={password}
  onChange={setPassword}
  placeholder="Enter password"
/>

// Email input
<Input
  type="email"
  value={email}
  onChange={setEmail}
  placeholder="your-email@example.com"
/>

// With key event handler
<Input
  value={query}
  onChange={setQuery}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSearch();
  }}
/>
```

**Where Used**:

- SettingsView - Base URL, Email, API Token inputs
- IssueSearchView - Search query input
- IssueDetailsView - Edit time tracking modal inputs

---

### 3. DataGrid

A table component for displaying tabular data with support for custom columns and row actions.

**Location**: `src/renderer/components/DataGrid.tsx`

**Props**:

- `columns`: Column<T>[] - Column definitions
- `data`: T[] - Array of data to display
- `onRowDoubleClick?`: (row: T) => void - Double-click handler
- `className?`: string - Additional CSS classes

**Column Definition**:

```tsx
interface Column<T> {
    header: string
    accessor: keyof T | ((row: T) => React.ReactNode)
    width?: string
}
```

**Usage Examples**:

```tsx
// Simple grid with property accessors
const columns: Column<JiraIssue>[] = [
    { header: "Key", accessor: "key", width: "100px" },
    { header: "Summary", accessor: "summary", width: "700px" },
    { header: "Status", accessor: "status", width: "200px" },
]

;<DataGrid
    columns={columns}
    data={issues}
    onRowDoubleClick={handleIssueClick}
/>

// Grid with custom cell renderers
const columns: Column<TimeRecord>[] = [
    { header: "Started", accessor: "started" },
    { header: "Duration", accessor: "duration" },
    {
        header: "Actions",
        accessor: (row) => (
            <Button onClick={() => handleEdit(row)}>Edit</Button>
        ),
    },
]

;<DataGrid columns={columns} data={records} />
```

**Where Used**:

- AssignedIssuesView - Display assigned Jira issues
- IssueSearchView - Display search results
- IssueDetailsView - Display time tracking records
- UnuploadedTimeTrackingWidget - Display unuploaded logs

---

### 4. LoadingSpinner

A loading indicator component with configurable size.

**Location**: `src/renderer/components/LoadingSpinner.tsx`

**Props**:

- `size?`: 'small' | 'medium' | 'large' - Spinner size (default: 'medium')

**Usage Examples**:

```tsx
// Medium spinner (default)
<LoadingSpinner />

// Small spinner (for inline use)
<LoadingSpinner size="small" />

// Large spinner (for full-page loading)
<LoadingSpinner size="large" />

// Conditional rendering
{isLoading && <LoadingSpinner />}
```

**Where Used**:

- AssignedIssuesView - Loading assigned issues
- IssueSearchView - Loading search results
- UnuploadedTimeTrackingWidget - Uploading records

---

### 5. Modal

A dialog/modal component for forms and confirmations.

**Location**: `src/renderer/components/Modal.tsx`

**Props**:

- `isOpen`: boolean - Modal visibility
- `onClose`: () => void - Close handler
- `title`: string - Modal title
- `children`: ReactNode - Modal content
- `footer?`: ReactNode - Optional footer content

**Usage Examples**:

```tsx
// Simple modal
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to proceed?</p>
</Modal>

// Modal with footer buttons
<Modal
  isOpen={editModalOpen}
  onClose={handleClose}
  title="Edit Record"
  footer={
    <>
      <Button onClick={handleClose} variant="secondary">
        Cancel
      </Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  <form>
    <Input value={field1} onChange={setField1} />
    <Input value={field2} onChange={setField2} />
  </form>
</Modal>
```

**Where Used**:

- IssueDetailsView - Edit time tracking record modal

---

### 6. UnuploadedTimeTrackingWidget

A specialized widget for displaying and uploading unsynced time tracking logs.

**Location**: `src/renderer/components/UnuploadedTimeTrackingWidget.tsx`

**Props**: None (self-contained component)

**Features**:

- Automatically refreshes every second
- Displays issue key, start time, and elapsed time
- Bulk upload functionality
- Error handling and user feedback

**Usage Examples**:

```tsx
// Simple usage in dashboard
<UnuploadedTimeTrackingWidget />

// Can be used in any view that needs this functionality
```

**Where Used**:

- DashboardView - Main dashboard widget

---

## Component Composition

Components can be composed together to create more complex UIs:

```tsx
// Example: Custom confirmation dialog
const ConfirmDialog = ({ isOpen, onConfirm, onCancel, message }) => (
    <Modal
        isOpen={isOpen}
        onClose={onCancel}
        title="Confirm"
        footer={
            <>
                <Button onClick={onCancel} variant="secondary">
                    Cancel
                </Button>
                <Button onClick={onConfirm} variant="danger">
                    Confirm
                </Button>
            </>
        }
    >
        <p>{message}</p>
    </Modal>
)

// Example: Form with validation
const EditForm = ({ data, onSave, onCancel }) => {
    const [name, setName] = useState(data.name)
    const [isValid, setIsValid] = useState(true)

    return (
        <Modal isOpen={true} onClose={onCancel} title="Edit Item">
            <Input
                value={name}
                onChange={(value) => {
                    setName(value)
                    setIsValid(value.length > 0)
                }}
                placeholder="Enter name"
            />
            {!isValid && <span className="error">Name is required</span>}
            <div className="button-group">
                <Button onClick={onCancel} variant="secondary">
                    Cancel
                </Button>
                <Button onClick={() => onSave(name)} disabled={!isValid}>
                    Save
                </Button>
            </div>
        </Modal>
    )
}
```

## Styling

All components use CSS classes defined in `src/renderer/styles/components.css`. You can customize the appearance by:

1. **Adding custom classes**: Use the `className` prop to add additional styles
2. **Modifying component CSS**: Edit the component-specific styles
3. **Theme variables**: Add CSS variables for consistent theming

Example:

```tsx
<Button className="large-button special-style" onClick={handleClick}>
    Custom Styled Button
</Button>
```

## Best Practices

1. **Component Reusability**: Always consider if a UI element could be reused before creating it inline
2. **Props Interface**: Define clear TypeScript interfaces for props
3. **Default Props**: Provide sensible defaults for optional props
4. **Error Handling**: Handle edge cases gracefully (empty data, loading states, errors)
5. **Accessibility**: Include proper ARIA attributes and keyboard navigation
6. **Performance**: Use React.memo() for expensive components that don't change often

## Adding New Components

When creating a new reusable component:

1. Create the component file in `src/renderer/components/`
2. Define clear TypeScript interfaces for props
3. Add styles to `src/renderer/styles/components.css`
4. Export the component from `src/renderer/components/index.ts`
5. Document the component in this file
6. Use the component in at least one view to validate it works

Example template:

```tsx
import React from "react"
import "../styles/components.css"

interface MyComponentProps {
    // Define your props here
    required: string
    optional?: number
}

export const MyComponent: React.FC<MyComponentProps> = ({
    required,
    optional = 0,
}) => {
    return <div className="my-component">{/* Component implementation */}</div>
}
```
