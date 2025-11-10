# Kanban Board Feature

## Overview

The Kanban Board feature provides a visual task management system integrated into the Jira Helper application. It allows users to organize tasks in a three-column board (To Do, In Progress, Done) with drag-and-drop functionality and optional Jira issue linking.

## Features

### Core Functionality

- **Three-Column Board**: Todo, In Progress, and Done columns
- **Drag-and-Drop**: Move items between columns with visual feedback
- **Item Management**: Create, edit, and delete kanban items
- **Jira Integration**: Link items to Jira issues for seamless workflow
- **Persistent Storage**: All items stored in local SQLite database

### User Interface

- **Sidebar Button**: Access via 📝 icon in the sidebar
- **Modal Interface**: Add/edit items in a clean modal dialog
- **Visual Indicators**: Column counts, item positions, and drag-over states
- **Responsive Design**: Adapts to different window sizes

### Jira Integration

- **Issue Linking**: Search and link Jira issues to kanban items
- **Live Information**: Display issue key, summary, and status
- **Quick Access**: Click linked issue badge to open in Jira
- **Issue Details**: View issue information within the modal

## Architecture

### Database Schema

```sql
CREATE TABLE KanbanItems (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Title TEXT NOT NULL,
  Description TEXT NOT NULL DEFAULT '',
  Column TEXT NOT NULL,              -- 'todo', 'inProgress', 'done'
  Position INTEGER NOT NULL,
  LinkedIssueKey TEXT,               -- Optional Jira issue key
  CreatedAt TEXT NOT NULL,
  UpdatedAt TEXT NOT NULL
)
```

### Components

#### KanbanView (`src/renderer/views/KanbanView.tsx`)

Main view component that renders the kanban board with three columns.

**Key Features:**

- Grid layout with three equal columns
- Drag-and-drop event handlers
- Item CRUD operations
- Visual feedback during drag operations

**Props:** None (standalone view)

#### KanbanItemModal (`src/renderer/components/KanbanItemModal.tsx`)

Modal component for creating and editing kanban items.

**Key Features:**

- Form validation
- Jira issue search and linking
- Live issue information display
- Unlink issue capability

**Props:**

- `isOpen: boolean` - Modal visibility
- `item: KanbanItem | null` - Item to edit (null for new item)
- `onClose: () => void` - Close handler
- `onSave: (title, description, linkedIssueKey?) => void` - Save handler

### Services

#### KanbanService (`src/main/services/kanban-service.ts`)

Backend service handling all database operations.

**Methods:**

- `getAllItems(): KanbanItem[]` - Get all items
- `getItemsByColumn(column): KanbanItem[]` - Get items in specific column
- `createItem(title, description, column, linkedIssueKey?): KanbanItem` - Create new item
- `updateItem(id, title, description, linkedIssueKey?)` - Update existing item
- `moveItem(id, newColumn, newPosition)` - Move item with position management
- `deleteItem(id)` - Delete item and adjust positions

**Position Management:**
The service automatically manages item positions within columns:

- New items are added to the end of their column
- Moved items trigger position adjustments for affected items
- Deleted items trigger position consolidation

### IPC Communication

#### Exposed API (preload.ts)

```typescript
window.electronAPI.getAllKanbanItems(): Promise<KanbanItem[]>
window.electronAPI.getKanbanItemsByColumn(column): Promise<KanbanItem[]>
window.electronAPI.createKanbanItem(title, description, column, linkedIssueKey?): Promise<KanbanItem>
window.electronAPI.updateKanbanItem(id, title, description, linkedIssueKey?): Promise<{success: boolean}>
window.electronAPI.moveKanbanItem(id, newColumn, newPosition): Promise<{success: boolean}>
window.electronAPI.deleteKanbanItem(id): Promise<{success: boolean}>
```

## User Workflows

### Creating a New Item

1. Click "Add Item" button in any column
2. Enter title (required)
3. Enter description (optional)
4. Optionally link a Jira issue:
   - Enter issue key (e.g., PROJ-123)
   - Click "Link Issue"
   - Review issue details
5. Click "Save"

### Editing an Item

1. Click edit (✏️) button on item card
2. Modify title, description, or linked issue
3. Click "Save"

### Moving Items

1. Click and hold on an item card
2. Drag to desired column
3. Release to drop
4. Item automatically positioned at end of target column

### Deleting an Item

1. Click delete (🗑️) button on item card
2. Confirm deletion
3. Item removed and positions adjusted

### Linking to Jira Issue

1. Open item modal (create or edit)
2. Enter Jira issue key in "Link to Jira Issue" field
3. Click "Link Issue" or press Enter
4. Issue information displays if found
5. Click issue key badge to open in Jira
6. Click "✕ Unlink" to remove link

## Implementation Details

### Drag-and-Drop

The drag-and-drop system uses native HTML5 drag-and-drop APIs:

```typescript
// Drag start - capture item
onDragStart={(e) => {
  setDraggedItem(item);
  e.dataTransfer.effectAllowed = 'move';
}}

// Drop - move item
onDrop={async (e, targetColumn) => {
  e.preventDefault();
  await window.electronAPI.moveKanbanItem(
    draggedItem.id,
    targetColumn,
    newPosition
  );
}}
```

### Position Management Algorithm

When moving items, the service uses a transaction-based approach:

1. **Same Column Move:**
   - Calculate shift direction (up/down)
   - Update positions of items between old and new position
   - Update item position

2. **Cross-Column Move:**
   - Shift items in old column up to fill gap
   - Shift items in new column down to make space
   - Update item position and column

This ensures consistent, gap-free positioning.

### Jira Integration

Issue linking uses existing Jira service:

- Validates issue exists before linking
- Displays live issue information
- Uses same authentication as other Jira features
- Opens issues in external browser

## Styling

### Theme

- **Background**: White cards on gray (#f5f5f5) columns
- **Hover**: Elevation and shadow on hover
- **Drag State**: Semi-transparent when dragging
- **Drop Zone**: Blue tint when dragging over

### Responsive Behavior

- Three equal columns on desktop
- Scrollable columns with fixed header
- Automatic text wrapping in cards
- Modal adapts to content size

## Database Location

The kanban database is stored separately from time tracking:

- **Path**: `{userData}/kanban.db`
- **Format**: SQLite 3
- **Backup**: Follows standard Electron userData backup patterns

## Error Handling

### Common Errors

- **Invalid Issue Key**: Displays error message, doesn't save link
- **Database Error**: Console logged, operation aborted
- **Network Error**: Falls back gracefully for Jira operations

### User Feedback

- Confirmation dialogs for destructive actions
- Loading states during async operations
- Error messages in modal for invalid inputs

## Future Enhancements

### Potential Improvements

1. **Custom Columns**: Allow users to define custom columns
2. **Due Dates**: Add deadline tracking
3. **Labels/Tags**: Categorize items with tags
4. **Priorities**: Set item priority levels
5. **Search/Filter**: Find items by title or issue key
6. **Bulk Operations**: Move/delete multiple items
7. **Export**: Export board to CSV or JSON
8. **Templates**: Save item templates for common tasks
9. **Notifications**: Remind users about items
10. **Collaboration**: Sync boards across team members

### Technical Improvements

1. **Virtual Scrolling**: For large number of items
2. **Undo/Redo**: Action history
3. **Keyboard Navigation**: Tab/arrow key support
4. **Accessibility**: ARIA labels and screen reader support
5. **Animations**: Smooth transitions between states

## Testing

### Manual Testing Checklist

- [ ] Create item in each column
- [ ] Edit item title and description
- [ ] Link Jira issue to item
- [ ] View linked issue in Jira
- [ ] Unlink Jira issue
- [ ] Drag item within same column
- [ ] Drag item to different column
- [ ] Delete item with confirmation
- [ ] Verify position ordering after operations
- [ ] Test with no Jira connection
- [ ] Test with invalid issue key
- [ ] Verify database persistence across app restarts

### Known Limitations

- No real-time sync between multiple app instances
- Maximum ~1000 items recommended for performance
- Requires Jira configuration for issue linking
- Native drag-and-drop may have browser-specific quirks

## Troubleshooting

### Items Not Appearing

- Check database file exists at `{userData}/kanban.db`
- Verify console for database errors
- Try creating a new item

### Drag-and-Drop Not Working

- Ensure browser supports HTML5 drag-and-drop
- Check console for JavaScript errors
- Verify item has `draggable` attribute

### Jira Linking Fails

- Verify Settings have valid Jira credentials
- Check network connectivity
- Ensure issue key format is correct
- Verify user has access to the issue

## Modular Design

The Kanban feature follows the application's modular architecture:

- **Isolated Service**: `KanbanService` is independent of other services
- **Separate Database**: Uses its own SQLite database file
- **Type Safety**: All types defined in common/types
- **IPC Separation**: Clear boundary between main and renderer
- **Reusable Components**: Modal and Button components shared
- **No External Dependencies**: Uses existing libraries only

This design allows the feature to be:

- Easily maintained independently
- Potentially extracted to a plugin
- Extended without affecting other features
- Tested in isolation
