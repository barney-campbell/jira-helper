using System;
using System.Collections.Generic;
using System.Linq;

namespace JiraHelper.Settings
{
    public class TimeTrackingService
    {
        public void StartTracking(string issueKey)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.EnsureCreated();
            // Stop any active tracking for other issues
            var active = db.TimeTrackingRecords.FirstOrDefault(r => r.EndTime == null);
            if (active != null)
            {
                active.EndTime = DateTime.UtcNow;
            }
            db.TimeTrackingRecords.Add(new TimeTrackingRecord
            {
                IssueKey = issueKey,
                StartTime = DateTime.UtcNow
            });
            db.SaveChanges();
        }

        public void StopTracking(string issueKey)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.EnsureCreated();
            var active = db.TimeTrackingRecords.FirstOrDefault(r => r.IssueKey == issueKey && r.EndTime == null);
            if (active != null)
            {
                active.EndTime = DateTime.UtcNow;
                db.SaveChanges();
            }
        }

        public List<TimeTrackingRecord> GetRecords(string issueKey)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.EnsureCreated();
            return db.TimeTrackingRecords.Where(r => r.IssueKey == issueKey).OrderByDescending(r => r.StartTime).ToList();
        }

        public List<TimeTrackingRecord> GetUnsentCompletedRecords()
        {
            using var db = new TimeTrackingDbContext();
            db.Database.EnsureCreated();
            return db.TimeTrackingRecords.Where(r => r.EndTime != null).ToList();
        }

        public void RemoveRecord(int id)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.EnsureCreated();
            var record = db.TimeTrackingRecords.FirstOrDefault(r => r.Id == id);
            if (record != null)
            {
                db.TimeTrackingRecords.Remove(record);
                db.SaveChanges();
            }
        }

        public void UpdateRecord(TimeTrackingRecord updated)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.EnsureCreated();
            var record = db.TimeTrackingRecords.FirstOrDefault(r => r.Id == updated.Id);
            if (record != null)
            {
                record.StartTime = updated.StartTime;
                record.EndTime = updated.EndTime;
                db.SaveChanges();
            }
        }

        public void DeleteRecord(int id)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.EnsureCreated();
            var record = db.TimeTrackingRecords.FirstOrDefault(r => r.Id == id);
            if (record != null)
            {
                db.TimeTrackingRecords.Remove(record);
                db.SaveChanges();
            }
        }
    }
}
