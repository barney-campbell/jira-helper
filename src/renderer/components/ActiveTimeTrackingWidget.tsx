import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { DataGrid, Column } from "./DataGrid";
import { WidgetContainer } from "./Widget";
import type { TimeTrackingRecord } from "../../common/types";

interface ActiveTimeTrackingWidgetProps {
  onIssueDoubleClick?: (issueKey: string) => void;
}

export const ActiveTimeTrackingWidget: React.FC<
  ActiveTimeTrackingWidgetProps
> = ({ onIssueDoubleClick }) => {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);

  useEffect(() => {
    loadRecords();

    // Set up interval to update elapsed time
    const interval = setInterval(loadRecords, 1000);

    // Set up listener for time tracking changes
    const removeListener = window.electronAPI.onTimeTrackingChanged(() => {
      loadRecords();
    });

    return () => {
      clearInterval(interval);
      removeListener();
    };
  }, []);

  const loadRecords = async () => {
    try {
      const data = await window.electronAPI.getActiveTimeTrackingRecords();
      setRecords(data);
    } catch (error) {
      console.error("Error loading active records:", error);
    }
  };

  const formatElapsed = (start: Date): string => {
    const startTime = new Date(start);
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const formatDateTime = (date: Date): string => {
    const d = new Date(date);
    return d.toISOString().replace("T", " ").substring(0, 19);
  };

  const handleStopTracking = async (recordId: number) => {
    try {
      await window.electronAPI.stopTrackingById(recordId);
      await loadRecords();
    } catch (error) {
      console.error("Error stopping tracking:", error);
    }
  };

  const columns: Column<any>[] = [
    { header: "Issue Key", accessor: "issueKey", width: "25%" },
    { header: "Started", accessor: "startTime", width: "35%" },
    { header: "Elapsed", accessor: "elapsed", width: "20%" },
    {
      header: "Actions",
      accessor: (row: any) => (
        <Button variant="secondary" onClick={() => handleStopTracking(row.id)}>
          Stop
        </Button>
      ),
      width: "20%",
    },
  ];

  const displayData = records.map((record) => ({
    id: record.id,
    issueKey: record.issueKey,
    startTime: formatDateTime(record.startTime),
    elapsed: formatElapsed(record.startTime),
  }));

  return (
    <WidgetContainer>
      <h3>Active Time Tracking</h3>
      <DataGrid
        columns={columns}
        data={displayData}
        onRowDoubleClick={(row) => onIssueDoubleClick?.(row.issueKey)}
      />
    </WidgetContainer>
  );
};
