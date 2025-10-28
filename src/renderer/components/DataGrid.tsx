import React from 'react';
import styled from 'styled-components';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowDoubleClick?: (row: T) => void;
  className?: string;
}

const DataGridContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};

  th {
    background-color: ${props => props.theme.colors.surfaceHover};
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid ${props => props.theme.colors.border};
    position: sticky;
    top: 0;
    color: ${props => props.theme.colors.text};
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }

  tbody tr:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
  }

  tbody tr.clickable {
    cursor: pointer;
  }

  tbody tr.clickable:hover {
    background-color: ${props => props.theme.colors.primary}22;
  }
`;

export function DataGrid<T extends { [key: string]: any }>({
  columns,
  data,
  onRowDoubleClick,
  className = ''
}: DataGridProps<T>) {
  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  return (
    <DataGridContainer className={className}>
      <Table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onDoubleClick={() => onRowDoubleClick?.(row)}
                className={onRowDoubleClick ? 'clickable' : ''}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>{getCellValue(row, column)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </DataGridContainer>
  );
}
