import { TimeTrackingService } from '../../src/main/services/time-tracking-service';

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/tmp/test-data'),
  },
}));

// Mock better-sqlite3
jest.mock('better-sqlite3');

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let mockDb: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock database
    mockDb = {
      prepare: jest.fn(),
      exec: jest.fn(),
      close: jest.fn(),
    };

    // Mock the Database constructor
    const Database = require('better-sqlite3');
    Database.mockImplementation(() => mockDb);

    // Create service instance
    service = new TimeTrackingService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize the database', () => {
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS TimeTrackingRecords')
      );
    });
  });

  describe('startTracking', () => {
    it('should insert a new tracking record', () => {
      const mockPrepare = {
        run: jest.fn(),
      };
      mockDb.prepare.mockReturnValue(mockPrepare);

      service.startTracking('TEST-123');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO TimeTrackingRecords')
      );
      expect(mockPrepare.run).toHaveBeenCalledWith('TEST-123', expect.any(String));
    });
  });

  describe('stopTracking', () => {
    it('should update the end time for an active tracking record', () => {
      const mockPrepare = {
        run: jest.fn(),
      };
      mockDb.prepare.mockReturnValue(mockPrepare);

      service.stopTracking('TEST-123');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE TimeTrackingRecords')
      );
      expect(mockPrepare.run).toHaveBeenCalledWith(expect.any(String), 'TEST-123');
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

      const mockPrepare = {
        all: jest.fn().mockReturnValue(mockRecords),
      };
      mockDb.prepare.mockReturnValue(mockPrepare);

      const records = service.getRecords('TEST-123');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM TimeTrackingRecords')
      );
      expect(mockPrepare.all).toHaveBeenCalledWith('TEST-123');
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

      const mockPrepare = {
        all: jest.fn().mockReturnValue(mockRecords),
      };
      mockDb.prepare.mockReturnValue(mockPrepare);

      const records = service.getUnsentCompletedRecords();

      expect(mockDb.prepare).toHaveBeenCalledWith(
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

      const mockPrepare = {
        all: jest.fn().mockReturnValue(mockRecords),
      };
      mockDb.prepare.mockReturnValue(mockPrepare);

      const records = service.getActiveRecords();

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE EndTime IS NULL')
      );
      expect(records).toHaveLength(1);
      expect(records[0].endTime).toBeUndefined();
    });
  });

  describe('markAsUploaded', () => {
    it('should mark a record as uploaded', () => {
      const mockPrepare = {
        run: jest.fn(),
      };
      mockDb.prepare.mockReturnValue(mockPrepare);

      service.markAsUploaded(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'UPDATE TimeTrackingRecords SET IsUploaded = 1 WHERE Id = ?'
      );
      expect(mockPrepare.run).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record by id', () => {
      const mockPrepare = {
        run: jest.fn(),
      };
      mockDb.prepare.mockReturnValue(mockPrepare);

      service.deleteRecord(1);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'DELETE FROM TimeTrackingRecords WHERE Id = ?'
      );
      expect(mockPrepare.run).toHaveBeenCalledWith(1);
    });
  });

  describe('close', () => {
    it('should close the database connection', () => {
      service.close();

      expect(mockDb.close).toHaveBeenCalled();
    });
  });
});
