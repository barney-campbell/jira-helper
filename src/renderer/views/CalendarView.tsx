import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { TimeTrackingRecord } from '../../common/types';
import { Button } from '../components/Button';

const pixelsPerHour = 55;

const CalendarContainer = styled.div`
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.text};
  }
`;

const WeekNavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
`;

const WeekHeader = styled.div`
  text-align: center;
  font-size: 16px;
  color: ${props => props.theme.colors.textSecondary};
  min-width: 250px;
`;

const NavButton = styled(Button)`
  padding: 8px 16px;
  font-size: 14px;
`;

const CurrentWeekButtonContainer = styled.div`
  text-align: center;
  margin-top: 20px;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  gap: 10px;
  background-color: ${props => props.theme.colors.surface};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TimeColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimeLabel = styled.div`
  height: ${pixelsPerHour}px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const DayHeader = styled.div`
  font-weight: bold;
  text-align: center;
  padding: 10px;
  background-color: ${props => props.theme.colors.sidebarButtonActive};
  border-radius: 4px;
  margin-bottom: 10px;
`;

const TimeSlot = styled.div`
  height: ${pixelsPerHour}px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  position: relative;
  background-color: ${props => props.theme.colors.background};
`;

const WorklogBlock = styled.div<{ $top: number; $height: number }>`
  position: absolute;
  top: ${props => props.$top}px;
  height: ${props => props.$height}px;
  left: 2px;
  right: 2px;
  background-color: ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 4px;
  font-size: 11px;
  color: white;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;
  z-index: 1;
  display: flex;
  flex-direction: ${props => props.$height < 40 ? 'row' : 'column'};
  align-items: ${props => props.$height < 40 ? 'center' : 'flex-start'};
  gap: ${props => props.$height < 40 ? '6px' : '0'};

  &:hover {
    opacity: 0.8;
  }
`;

const WorklogTitle = styled.div`
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;

const WorklogTime = styled.div`
  font-size: 10px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
`;

interface CalendarViewProps {}

export const CalendarView: React.FC<CalendarViewProps> = () => {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  useEffect(() => {
    loadRecords();
    calculateWeekDates();
    
    // Set up listener for time tracking changes
    const removeListener = window.electronAPI.onTimeTrackingChanged(() => {
      loadRecords();
    });

    return () => {
      removeListener();
    };
  }, [weekOffset]);

  const calculateWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Calculate Monday of current week
    const monday = new Date(today);
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysFromMonday);
    
    // Apply week offset
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const dates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    setWeekDates(dates);
  };

  const loadRecords = async () => {
    try {
      const data = await window.electronAPI.getWeekTimeTrackingRecords(weekOffset);
      setRecords(data);
      
      // Extract unique issue keys
      const uniqueIssueKeys = Array.from(new Set(data.map(record => record.issueKey)));
      
      // Fetch summaries for unique issues
      if (uniqueIssueKeys.length > 0) {
        const fetchedSummaries = await window.electronAPI.getIssueSummaries(uniqueIssueKeys);
        setSummaries(fetchedSummaries);
      }
    } catch (error) {
      console.error('Error loading week records:', error);
    }
  };

  const formatDate = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getWeekRange = (): string => {
    if (weekDates.length === 0) return '';
    const start = weekDates[0];
    const end = weekDates[4];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const getRecordsForDay = (dayIndex: number): TimeTrackingRecord[] => {
    if (weekDates.length === 0) return [];
    
    const targetDate = weekDates[dayIndex];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return records.filter(record => {
      const recordDate = new Date(record.startTime);
      return recordDate >= startOfDay && recordDate <= endOfDay;
    });
  };

  const calculateBlockPosition = (record: TimeTrackingRecord) => {
    const startTime = new Date(record.startTime);
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    
    // Calculate position from 8 AM (work day starts at 8 AM)
    const startHour = 8;
    const top = ((hours - startHour) * 60 + minutes) * (pixelsPerHour / 60);
    
    // Calculate height based on duration
    const endTime = record.endTime ? new Date(record.endTime) : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    const height = durationMinutes * (pixelsPerHour / 60);
    
    return { top, height: Math.max(height, 20) }; // Minimum height of 20px
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (date: Date): string => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const goToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Generate time slots from 8 AM to 6 PM
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  });

  return (
    <CalendarContainer>
      <CalendarGrid>
        {/* Time column */}
        <div>
          <DayHeader style={{ opacity: 0 }}>Time</DayHeader>
          <TimeColumn>
            {timeSlots.map((time, index) => (
              <TimeLabel key={index}>{time}</TimeLabel>
            ))}
          </TimeColumn>
        </div>

        {/* Day columns */}
        {weekDates.map((date, dayIndex) => (
          <div key={dayIndex}>
            <DayHeader>{formatDate(date)}</DayHeader>
            <DayColumn>
              {timeSlots.map((_, index) => (
                <TimeSlot key={index} />
              ))}
              {/* Render worklog blocks */}
              {getRecordsForDay(dayIndex).map((record) => {
                const { top, height } = calculateBlockPosition(record);
                const summary = summaries[record.issueKey] || record.issueKey;
                const isCompact = height < 40;
                return (
                  <WorklogBlock
                    key={record.id}
                    $top={top}
                    $height={height}
                    title={`${record.issueKey}: ${summary}\n${formatTime(record.startTime)} - ${record.endTime ? formatTime(record.endTime) : 'In Progress'}\nDuration: ${formatDuration(record.startTime, record.endTime)}`}
                  >
                    <WorklogTitle>{record.issueKey}</WorklogTitle>
                    {isCompact ? (
                      <WorklogTime>{formatTime(record.startTime)} • {formatDuration(record.startTime, record.endTime)}</WorklogTime>
                    ) : (
                      <>
                        <WorklogTime>{formatTime(record.startTime)}</WorklogTime>
                        <WorklogTime>{formatDuration(record.startTime, record.endTime)}</WorklogTime>
                      </>
                    )}
                  </WorklogBlock>
                );
              })}
            </DayColumn>
          </div>
        ))}
      </CalendarGrid>
      <WeekNavigationContainer>
        <NavButton variant="secondary" onClick={goToPreviousWeek}>
          &lt; Previous Week
        </NavButton>
        <WeekHeader>Week of {getWeekRange()}</WeekHeader>
        <NavButton variant="secondary" onClick={goToNextWeek}>
          Next Week &gt;
        </NavButton>
      </WeekNavigationContainer>
      {weekOffset !== 0 && (
        <CurrentWeekButtonContainer>
          <NavButton variant="primary" onClick={goToCurrentWeek}>
            Current Week
          </NavButton>
        </CurrentWeekButtonContainer>
      )}
    </CalendarContainer>
  );
};
