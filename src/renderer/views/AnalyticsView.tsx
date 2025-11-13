import React, { useState, useEffect } from "react"
import styled from "styled-components"
import type {
    ProductivityInsights,
    DailyStats,
    HourlyStats,
    IssueStats,
} from "../../common/types"
import { LoadingSpinner } from "../components/LoadingSpinner"

const AnalyticsContainer = styled.div`
    margin: 0 auto;

    h1 {
        text-align: center;
        margin-bottom: 20px;
        color: ${(props) => props.theme.colors.text};
    }
`

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
`

const Card = styled.div`
    background-color: ${(props) => props.theme.colors.surface};
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h2 {
        margin: 0 0 15px 0;
        font-size: 18px;
        color: ${(props) => props.theme.colors.text};
    }

    h3 {
        margin: 10px 0;
        font-size: 16px;
        color: ${(props) => props.theme.colors.textSecondary};
    }
`

const StatValue = styled.div`
    font-size: 36px;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
    margin: 10px 0;
`

const StatLabel = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.textSecondary};
`

const List = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`

const ListItem = styled.li`
    padding: 10px 0;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:last-child {
        border-bottom: none;
    }
`

const ItemLabel = styled.span`
    color: ${(props) => props.theme.colors.text};
    font-weight: 500;
`

const ItemValue = styled.span`
    color: ${(props) => props.theme.colors.textSecondary};
`

const ChartContainer = styled.div`
    margin-top: 15px;
    padding: 10px;
`

const BarChart = styled.div`
    display: flex;
    align-items: flex-end;
    height: 200px;
    gap: 8px;
`

const Bar = styled.div<{ $height: number }>`
    flex: 1;
    background-color: ${(props) => props.theme.colors.primary};
    height: ${(props) => props.$height}%;
    border-radius: 4px 4px 0 0;
    position: relative;
    min-width: 20px;
    transition: background-color 0.2s;

    &:hover {
        background-color: ${(props) => props.theme.colors.primaryHover};
    }
`

const BarLabel = styled.div`
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    color: ${(props) => props.theme.colors.textSecondary};
    white-space: nowrap;
`

const BarValue = styled.div`
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: ${(props) => props.theme.colors.text};
    white-space: nowrap;
`

const TrendIndicator = styled.div<{ $positive: boolean }>`
    display: inline-block;
    color: ${(props) => (props.$positive ? "#22c55e" : "#ef4444")};
    font-weight: bold;
    margin-left: 10px;
`

const InsightText = styled.p`
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 14px;
    line-height: 1.6;
    margin: 10px 0;
`

const EmptyState = styled.div`
    text-align: center;
    padding: 40px;
    color: ${(props) => props.theme.colors.textSecondary};
    font-size: 16px;
`

const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    }).format(date)
}

export const AnalyticsView: React.FC = () => {
    const [insights, setInsights] = useState<ProductivityInsights | null>(null)
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
    const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadAnalytics()
    }, [])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            setError(null)

            const [insightsData, daily, hourly] = await Promise.all([
                window.electronAPI.getProductivityInsights(),
                window.electronAPI.getDailyStats(30),
                window.electronAPI.getHourlyStats(),
            ])

            setInsights(insightsData)
            setDailyStats(daily)
            setHourlyStats(hourly)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load analytics"
            )
            console.error("Failed to load analytics:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <AnalyticsContainer>
                <h1>Personal Analytics</h1>
                <LoadingSpinner size="large" />
            </AnalyticsContainer>
        )
    }

    if (error) {
        return (
            <AnalyticsContainer>
                <h1>Personal Analytics</h1>
                <EmptyState>Error: {error}</EmptyState>
            </AnalyticsContainer>
        )
    }

    if (!insights || dailyStats.length === 0) {
        return (
            <AnalyticsContainer>
                <h1>Personal Analytics</h1>
                <EmptyState>
                    No time tracking data available yet. Start tracking time on
                    issues to see your analytics!
                </EmptyState>
            </AnalyticsContainer>
        )
    }

    const weeklyChange =
        insights.totalTimeLastWeek > 0
            ? ((insights.totalTimeThisWeek - insights.totalTimeLastWeek) /
                  insights.totalTimeLastWeek) *
              100
            : 0

    // Constants
    const LAST_DAYS_COUNT = 7
    const BAR_VALUE_VISIBILITY_THRESHOLD = 20 // Percentage threshold for showing bar values

    // Prepare hourly chart data
    const maxHourlySeconds = Math.max(
        ...hourlyStats.map((h) => h.totalSeconds),
        1
    )

    // Prepare daily chart data (last 7 days)
    const last7Days = dailyStats.slice(0, LAST_DAYS_COUNT).reverse()
    const maxDailySeconds = Math.max(...last7Days.map((d) => d.totalSeconds), 1)

    return (
        <AnalyticsContainer>
            <h1>Personal Analytics</h1>

            <Grid>
                <Card>
                    <h2>This Week</h2>
                    <StatValue>
                        {formatDuration(insights.totalTimeThisWeek)}
                    </StatValue>
                    <StatLabel>Total time tracked</StatLabel>
                    {insights.totalTimeLastWeek > 0 && (
                        <TrendIndicator $positive={weeklyChange >= 0}>
                            {weeklyChange >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(weeklyChange).toFixed(0)}% vs last week
                        </TrendIndicator>
                    )}
                </Card>

                <Card>
                    <h2>Daily Average</h2>
                    <StatValue>
                        {formatDuration(insights.dailyAverage)}
                    </StatValue>
                    <StatLabel>Average per day (30 days)</StatLabel>
                </Card>

                <Card>
                    <h2>Longest Session</h2>
                    {insights.longestSession ? (
                        <>
                            <StatValue>
                                {formatDuration(
                                    insights.longestSession.duration
                                )}
                            </StatValue>
                            <StatLabel>
                                {insights.longestSession.issueKey} on{" "}
                                {formatDate(
                                    new Date(insights.longestSession.date)
                                )}
                            </StatLabel>
                        </>
                    ) : (
                        <InsightText>No completed sessions yet</InsightText>
                    )}
                </Card>
            </Grid>

            <Grid>
                <Card>
                    <h2>Most Productive Hours</h2>
                    {insights.mostProductiveHours.length > 0 ? (
                        <>
                            <InsightText>
                                You tend to be most productive during these
                                hours:
                            </InsightText>
                            <List>
                                {insights.mostProductiveHours.map((hour) => (
                                    <ListItem key={hour}>
                                        <ItemLabel>
                                            {hour}:00 - {hour + 1}:00
                                        </ItemLabel>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    ) : (
                        <InsightText>
                            Not enough data to determine productive hours
                        </InsightText>
                    )}
                </Card>

                <Card>
                    <h2>Top Issues</h2>
                    {insights.mostWorkedIssues.length > 0 ? (
                        <List>
                            {insights.mostWorkedIssues.map((issue) => (
                                <ListItem key={issue.issueKey}>
                                    <ItemLabel>{issue.issueKey}</ItemLabel>
                                    <ItemValue>
                                        {formatDuration(issue.totalSeconds)}
                                    </ItemValue>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <InsightText>No issue data available</InsightText>
                    )}
                </Card>
            </Grid>

            <Card>
                <h2>Last 7 Days Activity</h2>
                <ChartContainer>
                    <BarChart>
                        {last7Days.map((day, index) => {
                            const heightPercent =
                                (day.totalSeconds / maxDailySeconds) * 100
                            const date = new Date(day.date)
                            const dayLabel = new Intl.DateTimeFormat("en-US", {
                                weekday: "short",
                            }).format(date)

                            return (
                                <Bar key={index} $height={heightPercent}>
                                    <BarValue>
                                        {formatDuration(day.totalSeconds)}
                                    </BarValue>
                                    <BarLabel>{dayLabel}</BarLabel>
                                </Bar>
                            )
                        })}
                    </BarChart>
                </ChartContainer>
            </Card>

            <Card>
                <h2>Time by Hour of Day</h2>
                <ChartContainer>
                    <BarChart>
                        {hourlyStats.map((hour, index) => {
                            const heightPercent =
                                (hour.totalSeconds / maxHourlySeconds) * 100

                            return (
                                <Bar key={index} $height={heightPercent}>
                                    {heightPercent >
                                        BAR_VALUE_VISIBILITY_THRESHOLD && (
                                        <BarValue>
                                            {formatDuration(hour.totalSeconds)}
                                        </BarValue>
                                    )}
                                    <BarLabel>{hour.hour}h</BarLabel>
                                </Bar>
                            )
                        })}
                    </BarChart>
                </ChartContainer>
                <InsightText>
                    This chart shows your total time tracked by hour across all
                    days.
                </InsightText>
            </Card>
        </AnalyticsContainer>
    )
}
