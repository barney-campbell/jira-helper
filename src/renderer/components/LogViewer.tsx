import React, { useState, useEffect } from "react"
import styled from "styled-components"
import type { LogEntry } from "../../common/types"
import { Button } from "./Button"

const ViewerContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`

const Header = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;
    flex-wrap: wrap;
`

const DateSelector = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    flex: 1;
`

const Select = styled.select`
    padding: 8px 12px;
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: 4px;
    background-color: ${(props) => props.theme.colors.surface};
    color: ${(props) => props.theme.colors.text};
    font-size: 14px;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: ${(props) => props.theme.colors.primary};
    }
`

const LogsContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: 4px;
    background-color: ${(props) => props.theme.colors.background};
    padding: 10px;
    font-family: "Courier New", monospace;
    font-size: 12px;
`

const LogEntryDiv = styled.div<{ $level: "error" | "warning" | "info" }>`
    padding: 8px;
    margin-bottom: 8px;
    border-left: 3px solid
        ${(props) => {
            switch (props.$level) {
                case "error":
                    return props.theme.colors.error || "#e53935"
                case "warning":
                    return props.theme.colors.warning || "#fb8c00"
                case "info":
                    return props.theme.colors.info || "#1e88e5"
                default:
                    return props.theme.colors.border
            }
        }};
    background-color: ${(props) => props.theme.colors.surface};
    border-radius: 2px;
`

const LogTimestamp = styled.div`
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 11px;
    margin-bottom: 4px;
`

const LogLevel = styled.span<{ $level: "error" | "warning" | "info" }>`
    font-weight: bold;
    color: ${(props) => {
        switch (props.$level) {
            case "error":
                return props.theme.colors.error || "#e53935"
            case "warning":
                return props.theme.colors.warning || "#fb8c00"
            case "info":
                return props.theme.colors.info || "#1e88e5"
            default:
                return props.theme.colors.text
        }
    }};
    text-transform: uppercase;
    margin-right: 8px;
`

const LogMessage = styled.div`
    color: ${(props) => props.theme.colors.text};
    margin-bottom: 4px;
`

const LogLocation = styled.div`
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 11px;
    font-style: italic;
`

const LogError = styled.div`
    color: ${(props) => props.theme.colors.error || "#e53935"};
    margin-top: 4px;
    padding: 4px;
    background-color: ${(props) => props.theme.colors.background};
    border-radius: 2px;
`

const LogStack = styled.pre`
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 10px;
    margin-top: 4px;
    padding: 4px;
    background-color: ${(props) => props.theme.colors.background};
    border-radius: 2px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
`

const EmptyState = styled.div`
    color: ${(props) => props.theme.colors.textSecondary};
    text-align: center;
    padding: 40px 20px;
`

const PathInfo = styled.div`
    font-size: 11px;
    color: ${(props) => props.theme.colors.textSecondary};
    margin-top: 5px;
`

export const LogViewer: React.FC = () => {
    const [logFiles, setLogFiles] = useState<string[]>([])
    const [selectedDate, setSelectedDate] = useState<string>("")
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [logsPath, setLogsPath] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        loadLogFiles()
        loadLogsPath()
    }, [])

    useEffect(() => {
        if (selectedDate) {
            loadLogs(selectedDate)
        }
    }, [selectedDate])

    const loadLogFiles = async () => {
        try {
            setLoading(true)
            const files = await window.electronAPI.getAllLogFiles()
            setLogFiles(files)
            if (files.length > 0 && !selectedDate) {
                setSelectedDate(files[0])
            }
        } catch (error) {
            console.error("Failed to load log files:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadLogs = async (date: string) => {
        try {
            setLoading(true)
            const logEntries = await window.electronAPI.getLogs(date)
            setLogs(logEntries)
        } catch (error) {
            console.error("Failed to load logs:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadLogsPath = async () => {
        try {
            const path = await window.electronAPI.getLogsPath()
            setLogsPath(path)
        } catch (error) {
            console.error("Failed to get logs path:", error)
        }
    }

    const handleRefresh = async () => {
        await loadLogFiles()
        if (selectedDate) {
            await loadLogs(selectedDate)
        }
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDate(e.target.value)
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleString()
    }

    const formatDateLabel = (dateStr: string) => {
        // dateStr is in format YYYY-MM-DD
        const date = new Date(dateStr)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const dateToCompare = new Date(date)
        dateToCompare.setHours(0, 0, 0, 0)

        if (dateToCompare.getTime() === today.getTime()) {
            return `${dateStr} (Today)`
        } else if (dateToCompare.getTime() === yesterday.getTime()) {
            return `${dateStr} (Yesterday)`
        }
        return dateStr
    }

    return (
        <ViewerContainer>
            <Header>
                <DateSelector>
                    <label>Log Date:</label>
                    <Select
                        value={selectedDate}
                        onChange={handleDateChange}
                        disabled={loading}
                    >
                        {logFiles.length === 0 && (
                            <option value="">No logs available</option>
                        )}
                        {logFiles.map((file) => (
                            <option key={file} value={file}>
                                {formatDateLabel(file)}
                            </option>
                        ))}
                    </Select>
                </DateSelector>
                <Button onClick={handleRefresh} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                </Button>
            </Header>
            {logsPath && <PathInfo>Logs directory: {logsPath}</PathInfo>}
            <LogsContainer>
                {logs.length === 0 ? (
                    <EmptyState>
                        {loading
                            ? "Loading logs..."
                            : "No logs for selected date"}
                    </EmptyState>
                ) : (
                    logs.map((entry, index) => (
                        <LogEntryDiv key={index} $level={entry.level}>
                            <LogTimestamp>
                                <LogLevel $level={entry.level}>
                                    {entry.level}
                                </LogLevel>
                                {formatTimestamp(entry.timestamp)}
                            </LogTimestamp>
                            <LogMessage>{entry.message}</LogMessage>
                            {entry.location && (
                                <LogLocation>
                                    Location: {entry.location}
                                </LogLocation>
                            )}
                            {entry.error && (
                                <LogError>Error: {entry.error}</LogError>
                            )}
                            {entry.stack && <LogStack>{entry.stack}</LogStack>}
                        </LogEntryDiv>
                    ))
                )}
            </LogsContainer>
        </ViewerContainer>
    )
}
