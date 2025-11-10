import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { KanbanItemModal } from '../components/KanbanItemModal';
import type { KanbanItem, KanbanColumnType } from '../../common/types';

const ViewContainer = styled.div`
  background-color: ${props => props.theme.colors.surface};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid ${props => props.theme.colors.border};

  h1 {
    margin: 0;
    font-size: 28px;
    color: ${props => props.theme.colors.text};
  }
`;

const BoardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  flex: 1;
  overflow: hidden;
`;

const Column = styled.div`
  background-color: ${props => props.theme.colors.surfaceHover};
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid ${props => props.theme.colors.border};

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }

  .count {
    background-color: ${props => props.theme.colors.textSecondary};
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 600;
  }
`;

const ItemsList = styled.div<{ $isDragOver: boolean }>`
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
  transition: background-color 0.2s;
  ${props => props.$isDragOver && `
    background-color: ${props.theme.colors.surfaceHover};
    border-radius: 4px;
  `}
`;

const ItemCard = styled.div<{ $isDragging: boolean }>`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: move;
  transition: all 0.2s;
  opacity: ${props => props.$isDragging ? 0.5 : 1};

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .title {
    font-weight: 600;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.text};
    word-wrap: break-word;
  }

  .description {
    font-size: 13px;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
    line-height: 1.4;
    word-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid ${props => props.theme.colors.border};
  }

  .jira-badge {
    background-color: #0052cc;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background-color: #0747a6;
    }
  }

  .actions {
    display: flex;
    gap: 5px;
  }

  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
`;

const AddButton = styled(Button)`
  width: 100%;
  margin-top: 10px;
`;

const columnTitles: Record<KanbanColumnType, string> = {
  todo: 'To Do',
  inProgress: 'In Progress',
  done: 'Done'
};

export const KanbanView: React.FC = () => {
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);
  const [newItemColumn, setNewItemColumn] = useState<KanbanColumnType | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
  const allItems = await ipc.getAllKanbanItems();
      setItems(allItems);
    } catch (error) {
      console.error('Failed to load kanban items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (column: KanbanColumnType) => {
    setNewItemColumn(column);
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEditItem = (item: KanbanItem) => {
    setSelectedItem(item);
    setNewItemColumn(null);
    setModalOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
  await ipc.deleteKanbanItem(id);
        await loadItems();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const handleSaveItem = async (title: string, description: string, linkedIssueKey?: string) => {
    try {
      if (selectedItem) {
        // Update existing item
  await ipc.updateKanbanItem(selectedItem.id, title, description, linkedIssueKey);
      } else if (newItemColumn) {
        // Create new item
  await ipc.createKanbanItem(title, description, newItemColumn, linkedIssueKey);
      }
      await loadItems();
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: KanbanItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (column: KanbanColumnType) => {
    setDragOverColumn(column);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the column entirely
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: KanbanColumnType) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem) return;

    // Get items in the target column
    const columnItems = items.filter(item => item.column === targetColumn);
    const newPosition = columnItems.length;

    try {
  await ipc.moveKanbanItem(draggedItem.id, targetColumn, newPosition);
      await loadItems();
    } catch (error) {
      console.error('Failed to move item:', error);
    }
  };

  const handleViewIssue = async (issueKey: string) => {
    try {
  const settings = await ipc.loadSettings();
      if (settings?.baseUrl) {
        const url = `${settings.baseUrl}/browse/${issueKey}`;
  await ipc.openExternal(url);
      }
    } catch (error) {
      console.error('Failed to open issue:', error);
    }
  };

  const getItemsByColumn = (column: KanbanColumnType) => {
    return items.filter(item => item.column === column).sort((a, b) => a.position - b.position);
  };

  if (loading) {
    return (
      <ViewContainer>
        <LoadingSpinner size="large" />
      </ViewContainer>
    );
  }

  return (
    <>
      <ViewContainer>
        <Header>
          <h1>📋 Kanban Board</h1>
        </Header>
        <BoardContainer>
          {(['todo', 'inProgress', 'done'] as KanbanColumnType[]).map(column => {
            const columnItems = getItemsByColumn(column);
            return (
              <Column
                key={column}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(column)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column)}
              >
                <ColumnHeader>
                  <h2>{columnTitles[column]}</h2>
                  <span className="count">{columnItems.length}</span>
                </ColumnHeader>
                <ItemsList $isDragOver={dragOverColumn === column}>
                  {columnItems.map(item => (
                    <ItemCard
                      key={item.id}
                      draggable
                      $isDragging={draggedItem?.id === item.id}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="title">{item.title}</div>
                      {item.description && (
                        <div className="description">{item.description}</div>
                      )}
                      <div className="footer">
                        {item.linkedIssueKey && (
                          <div
                            className="jira-badge"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewIssue(item.linkedIssueKey!);
                            }}
                          >
                            {item.linkedIssueKey}
                          </div>
                        )}
                        {!item.linkedIssueKey && <div></div>}
                        <div className="actions">
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditItem(item);
                            }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </ItemCard>
                  ))}
                </ItemsList>
                <AddButton onClick={() => handleAddItem(column)} variant="secondary">
                  + Add Item
                </AddButton>
              </Column>
            );
          })}
        </BoardContainer>
      </ViewContainer>

      {modalOpen && (
        <KanbanItemModal
          isOpen={modalOpen}
          item={selectedItem}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveItem}
        />
      )}
    </>
  );
};
