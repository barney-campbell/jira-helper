import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-data'),
  },
}));

// Mock better-sqlite3
const mockPrepare = vi.fn();
const mockExec = vi.fn();
const mockClose = vi.fn();

vi.mock('better-sqlite3', () => {
  class MockDatabase {
    prepare = mockPrepare;
    exec = mockExec;
    close = mockClose;
  }
  return { default: MockDatabase };
});

// Import after mocks are set up
const { TimeTrackingService } = await import('../../src/main/services/time-tracking-service');

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create service instance
    service = new TimeTrackingService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize the database', () => {
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS TimeTrackingRecords')
      );
    });
  });

  describe('startTracking', () => {
    it('should insert a new tracking record', () => {
      const mockStatement = {
        run: vi.fn(),
      };
      mockPrepare.mockReturnValue(mockStatement);

      service.startTracking('TEST-123');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO TimeTrackingRecords')
      );
      expect(mockStatement.run).toHaveBeenCalledWith('TEST-123', expect.any(String));
    });
  });

  describe('stopTracking', () => {
    it('should update the end time for an active tracking record', () => {
      const mockStatement = {
        run: vi.fn(),
      };
      mockPrepare.mockReturnValue(mockStatement);

      service.stopTracking('TEST-123');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE TimeTrackingRecords')
      );
      expect(mockStatement.run).toHaveBeenCalledWith(expect.any(String), 'TEST-123');
    });
  });

  describe('getRecords', () => {
    it('should return records for a specific issue', () => {
      const mockRecords = [
        {
          Id: 1,
          IssueKey: 'TEST-123',
          StartTime: new Date().toISOString(),
          EndTime: new Date().toISOString(),
          IsUploaded: 0,
        },
      ];

      const mockStatement = {
        all: vi.fn().mockReturnValue(mockRecords),
      };
      mockPrepare.mockReturnValue(mockStatement);

      const records = service.getRecords('TEST-123');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM TimeTrackingRecords')
      );
      expect(mockStatement.all).toHaveBeenCalledWith('TEST-123');
      expect(records).toHaveLength(1);
      expect(records[0].issueKey).toBe('TEST-123');
    });
  });

  describe('getUnsentCompletedRecords', () => {
    it('should return unsent completed records', () => {
      const mockRecords = [
        {
          Id: 1,
          IssueKey: 'TEST-123',
          StartTime: new Date().toISOString(),
          EndTime: new Date().toISOString(),
          IsUploaded: 0,
        },
      ];

      const mockStatement = {
        all: vi.fn().mockReturnValue(mockRecords),
      };
      mockPrepare.mockReturnValue(mockStatement);

      const records = service.getUnsentCompletedRecords();

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE IsUploaded = 0 AND EndTime IS NOT NULL')
      );
      expect(records).toHaveLength(1);
      expect(records[0].isUploaded).toBe(false);
    });
  });

  describe('getActiveRecords', () => {
    it('should return active records without end time', () => {
      const mockRecords = [
        {
          Id: 1,
          IssueKey: 'TEST-123',
          StartTime: new Date().toISOString(),
          EndTime: null,
          IsUploaded: 0,
        },
      ];

      const mockStatement = {
        all: vi.fn().mockReturnValue(mockRecords),
      };
      mockPrepare.mockReturnValue(mockStatement);

      const records = service.getActiveRecords();

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE EndTime IS NULL')
      );
      expect(records).toHaveLength(1);
      expect(records[0].endTime).toBeUndefined();
    });
  });

  describe('markAsUploaded', () => {
    it('should mark a record as uploaded', () => {
      const mockStatement = {
        run: vi.fn(),
      };
      mockPrepare.mockReturnValue(mockStatement);

      service.markAsUploaded(1);

      expect(mockPrepare).toHaveBeenCalledWith(
        'UPDATE TimeTrackingRecords SET IsUploaded = 1 WHERE Id = ?'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record by id', () => {
      const mockStatement = {
        run: vi.fn(),
      };
      mockPrepare.mockReturnValue(mockStatement);

      service.deleteRecord(1);

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM TimeTrackingRecords WHERE Id = ?'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(1);
    });
  });

  describe('close', () => {
    it('should close the database connection', () => {
      service.close();

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
