import React from "react"
import styled from "styled-components"

export type SortDirection = "asc" | "desc" | null

export interface Column<T> {
    header: string
    accessor: keyof T | ((row: T) => React.ReactNode)
    width?: string
    sortable?: boolean
}

export interface SortConfig {
    columnIndex: number
    direction: SortDirection
}

interface DataGridProps<T> {
    columns: Column<T>[]
    data: T[]
    onRowDoubleClick?: (row: T) => void
    className?: string
    sortConfig?: SortConfig
    onSort?: (columnIndex: number) => void
}

const DataGridContainer = styled.div`
    width: 100%;
    overflow-x: auto;
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: 4px;
`

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    background-color: ${(props) => props.theme.colors.surface};
    color: ${(props) => props.theme.colors.text};

    th {
        background-color: ${(props) => props.theme.colors.surfaceHover};
        padding: 12px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid ${(props) => props.theme.colors.border};
        position: sticky;
        top: 0;
        color: ${(props) => props.theme.colors.text};
        user-select: none;

        &.sortable {
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
                background-color: ${(props) => props.theme.colors.border};
            }
        }
    }

    td {
        padding: 10px 12px;
        border-bottom: 1px solid ${(props) => props.theme.colors.border};
    }

    tbody tr:hover {
        background-color: ${(props) => props.theme.colors.surfaceHover};
    }

    tbody tr.clickable {
        cursor: pointer;
    }

    tbody tr.clickable:hover {
        background-color: ${(props) => props.theme.colors.primary}22;
    }
`

const SortIndicator = styled.span`
    margin-left: 8px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.primary};
`

export function DataGrid<T extends { [key: string]: any }>({
    columns,
    data,
    onRowDoubleClick,
    className = "",
    sortConfig,
    onSort,
}: DataGridProps<T>) {
    const getCellValue = (row: T, column: Column<T>) => {
        if (typeof column.accessor === "function") {
            return column.accessor(row)
        }
        return row[column.accessor]
    }

    const handleHeaderClick = (columnIndex: number) => {
        const column = columns[columnIndex]
        if (column.sortable !== false && onSort) {
            onSort(columnIndex)
        }
    }

    const getSortIndicator = (columnIndex: number) => {
        if (sortConfig?.columnIndex === columnIndex) {
            return sortConfig.direction === "asc" ? "▲" : "▼"
        }
        return ""
    }

    return (
        <DataGridContainer className={className}>
            <Table>
                <thead>
                    <tr>
                        {columns.map((column, index) => {
                            const sortIndicator = getSortIndicator(index)
                            return (
                                <th
                                    key={index}
                                    style={{ width: column.width }}
                                    className={
                                        column.sortable !== false
                                            ? "sortable"
                                            : ""
                                    }
                                    onClick={() => handleHeaderClick(index)}
                                >
                                    {column.header}
                                    {sortIndicator && (
                                        <SortIndicator>
                                            {sortIndicator}
                                        </SortIndicator>
                                    )}
                                </th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                style={{ textAlign: "center", padding: "20px" }}
                            >
                                No data available
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onDoubleClick={() => onRowDoubleClick?.(row)}
                                className={onRowDoubleClick ? "clickable" : ""}
                            >
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex}>
                                        {getCellValue(row, column)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </DataGridContainer>
    )
}
