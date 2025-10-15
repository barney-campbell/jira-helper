import React from 'react';
import '../styles/components.css';

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
    <div className={`data-grid-container ${className}`}>
      <table className="data-grid">
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
      </table>
    </div>
  );
}
