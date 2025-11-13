import React, { useState, useEffect, useRef, useCallback } from "react"
import styled, { createGlobalStyle, ThemeProvider } from "styled-components"
import { DashboardView } from "./views/DashboardView"
import { AssignedIssuesView } from "./views/AssignedIssuesView"
import { IssueSearchView } from "./views/IssueSearchView"
import { IssueDetailsView } from "./views/IssueDetailsView"
import { SettingsView } from "./views/SettingsView"
import { KanbanView } from "./views/KanbanView"
import { CalendarView } from "./views/CalendarView"
import { AnalyticsView } from "./views/AnalyticsView"
import { MilestonesView } from "./views/MilestonesView"
import type { ViewType, JiraIssue, ThemeMode } from "./types"
import { lightTheme, darkTheme } from "./theme"

interface NavigationState {
    view: ViewType
    issueKey?: string | null
}

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text};
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme.colors.scrollbarTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.scrollbarThumb};
    border-radius: 5px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.colors.scrollbarThumbHover};
  }
`

const AppContainer = styled.div`
    display: flex;
    height: 100vh;
    overflow: hidden;
`

const Sidebar = styled.div`
    width: 70px;
    background-color: ${(props) => props.theme.colors.surface};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
`

const SidebarButton = styled.button<{ $active: boolean }>`
    width: 50px;
    height: 50px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
        background-color: ${(props) => props.theme.colors.sidebarButtonHover};
    }

    ${(props) =>
        props.$active &&
        `
    background-color: ${props.theme.colors.sidebarButtonActive};
  `}

    .icon {
        font-size: 24px;
    }
`

const SidebarSpacer = styled.div`
    flex: 1;
`

const MainContent = styled.div`
    flex: 1;
    overflow: auto;
    background-color: ${(props) => props.theme.colors.background};
    padding: 20px;
`

export const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>("dashboard")
    const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(
        null
    )
    const [themeMode, setThemeMode] = useState<ThemeMode>("light")
    const [systemPrefersDark, setSystemPrefersDark] = useState(false)

    // Navigation history management
    const [navigationHistory, setNavigationHistory] = useState<
        NavigationState[]
    >([{ view: "dashboard", issueKey: null }])
    const [historyIndex, setHistoryIndex] = useState<number>(0)
    const isNavigatingRef = useRef<boolean>(false)

    useEffect(() => {
        // Load theme once on mount
        const loadTheme = async () => {
            const settings = await window.electronAPI.loadSettings()
            if (settings?.theme) {
                setThemeMode(settings.theme)
            }
        }
        loadTheme()

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        setSystemPrefersDark(mediaQuery.matches)

        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            setSystemPrefersDark(e.matches)
        }

        mediaQuery.addEventListener("change", handleSystemThemeChange)

        return () => {
            mediaQuery.removeEventListener("change", handleSystemThemeChange)
        }
    }, [])

    useEffect(() => {
        // Listen for direct theme set from menu
        const unsubscribeSet = window.electronAPI.onSetTheme(
            (theme: string) => {
                handleThemeChange(theme as ThemeMode)
            }
        )

        return () => {
            unsubscribeSet()
        }
    }, [])

    // Update navigation state to main process
    useEffect(() => {
        const canGoBack = historyIndex > 0
        const canGoForward = historyIndex < navigationHistory.length - 1

        if (window.electronAPI.updateNavigationState) {
            window.electronAPI.updateNavigationState(canGoBack, canGoForward)
        }
    }, [historyIndex, navigationHistory.length])

    // Listen for navigation commands from main process
    useEffect(() => {
        if (
            !window.electronAPI.onNavigateBack ||
            !window.electronAPI.onNavigateForward
        ) {
            return
        }

        const unsubscribeBack = window.electronAPI.onNavigateBack(navigateBack)
        const unsubscribeForward =
            window.electronAPI.onNavigateForward(navigateForward)

        return () => {
            unsubscribeBack()
            unsubscribeForward()
        }
    }, [])

    const handleThemeChange = async (newTheme: ThemeMode) => {
        setThemeMode(newTheme)
        const settings = await window.electronAPI.loadSettings()
        if (settings) {
            await window.electronAPI.saveSettings({
                ...settings,
                theme: newTheme,
            })
        }
    }

    // Navigation helper to add to history
    const navigateToView = (view: ViewType, issueKey?: string | null) => {
        if (isNavigatingRef.current) {
            // This is a back/forward navigation, don't add to history
            isNavigatingRef.current = false
            return
        }

        const newState: NavigationState = { view, issueKey: issueKey || null }

        // Check if the new state is the same as the current state
        if (historyIndex >= 0 && historyIndex < navigationHistory.length) {
            const currentState = navigationHistory[historyIndex]
            if (
                currentState.view === view &&
                currentState.issueKey === issueKey
            ) {
                return // Don't add duplicate
            }
        }

        // Remove any forward history when navigating to a new view
        const newHistory = navigationHistory.slice(0, historyIndex + 1)
        newHistory.push(newState)

        setNavigationHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
        setCurrentView(view)
        setSelectedIssueKey(issueKey || null)
    }

    // Store the latest state in refs for event handlers
    const navigationHistoryRef = useRef(navigationHistory)
    const historyIndexRef = useRef(historyIndex)

    useEffect(() => {
        navigationHistoryRef.current = navigationHistory
        historyIndexRef.current = historyIndex
    }, [navigationHistory, historyIndex])

    // Navigate back
    const navigateBack = useCallback(() => {
        const currentIndex = historyIndexRef.current
        const currentHistory = navigationHistoryRef.current

        if (currentIndex > 0) {
            isNavigatingRef.current = true
            const newIndex = currentIndex - 1
            const state = currentHistory[newIndex]
            setHistoryIndex(newIndex)
            setCurrentView(state.view)
            setSelectedIssueKey(state.issueKey || null)
        }
    }, [])

    // Navigate forward
    const navigateForward = useCallback(() => {
        const currentIndex = historyIndexRef.current
        const currentHistory = navigationHistoryRef.current

        if (currentIndex < currentHistory.length - 1) {
            isNavigatingRef.current = true
            const newIndex = currentIndex + 1
            const state = currentHistory[newIndex]
            setHistoryIndex(newIndex)
            setCurrentView(state.view)
            setSelectedIssueKey(state.issueKey || null)
        }
    }, [])

    const handleIssueDoubleClick = (issue: JiraIssue) => {
        navigateToView("issueDetails", issue.key)
    }

    const handleIssueKeyDoubleClick = (issueKey: string) => {
        navigateToView("issueDetails", issueKey)
    }

    const renderView = () => {
        switch (currentView) {
            case "dashboard":
                return (
                    <DashboardView
                        onIssueDoubleClick={handleIssueKeyDoubleClick}
                    />
                )
            case "assignedIssues":
                return (
                    <AssignedIssuesView
                        onIssueDoubleClick={handleIssueDoubleClick}
                    />
                )
            case "search":
                return (
                    <IssueSearchView
                        onIssueDoubleClick={handleIssueDoubleClick}
                    />
                )
            case "issueDetails":
                return selectedIssueKey ? (
                    <IssueDetailsView
                        issueKey={selectedIssueKey}
                        onIssueKeyClick={handleIssueKeyDoubleClick}
                    />
                ) : (
                    <DashboardView
                        onIssueDoubleClick={handleIssueKeyDoubleClick}
                    />
                )
            case "kanban":
                return <KanbanView />
            case "calendar":
                return <CalendarView />
            case "analytics":
                return <AnalyticsView />
            case "milestones":
                return <MilestonesView />
            case "settings":
                return (
                    <SettingsView
                        currentTheme={themeMode}
                        onThemeChange={handleThemeChange}
                    />
                )
            default:
                return (
                    <DashboardView
                        onIssueDoubleClick={handleIssueKeyDoubleClick}
                    />
                )
        }
    }

    // Determine actual theme to use based on themeMode and system preference
    const getEffectiveTheme = () => {
        if (themeMode === "system") {
            return systemPrefersDark ? darkTheme : lightTheme
        }
        return themeMode === "dark" ? darkTheme : lightTheme
    }

    const theme = getEffectiveTheme()

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <AppContainer>
                <Sidebar>
                    <SidebarButton
                        $active={currentView === "dashboard"}
                        onClick={() => navigateToView("dashboard")}
                        title="Dashboard"
                    >
                        <span className="icon">📊</span>
                    </SidebarButton>
                    <SidebarButton
                        $active={currentView === "assignedIssues"}
                        onClick={() => navigateToView("assignedIssues")}
                        title="Assigned Issues"
                    >
                        <span className="icon">📋</span>
                    </SidebarButton>
                    <SidebarButton
                        $active={currentView === "search"}
                        onClick={() => navigateToView("search")}
                        title="Search"
                    >
                        <span className="icon">🔍</span>
                    </SidebarButton>
                    <SidebarButton
                        $active={currentView === "kanban"}
                        onClick={() => navigateToView("kanban")}
                        title="Kanban Board"
                    >
                        <span className="icon">📝</span>
                    </SidebarButton>
                    <SidebarButton
                        $active={currentView === "calendar"}
                        onClick={() => navigateToView("calendar")}
                        title="Calendar View"
                    >
                        <span className="icon">📅</span>
                    </SidebarButton>
                    <SidebarButton
                        $active={currentView === "analytics"}
                        onClick={() => navigateToView("analytics")}
                        title="Analytics"
                    >
                        <span className="icon">📈</span>
                    </SidebarButton>
                    <SidebarButton
                        $active={currentView === "milestones"}
                        onClick={() => navigateToView("milestones")}
                        title="Milestones"
                    >
                        <span className="icon">🏁</span>
                    </SidebarButton>
                    <SidebarSpacer />
                    <SidebarButton
                        $active={currentView === "settings"}
                        onClick={() => navigateToView("settings")}
                        title="Settings"
                    >
                        <span className="icon">⚙️</span>
                    </SidebarButton>
                </Sidebar>
                <MainContent>{renderView()}</MainContent>
            </AppContainer>
        </ThemeProvider>
    )
}
