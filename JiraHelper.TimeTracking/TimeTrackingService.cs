using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace JiraHelper.TimeTracking
{
    public class TimeTrackingService
    {
        public void StartTracking(string issueKey)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.Migrate();
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
            db.Database.Migrate();
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
            db.Database.Migrate();
            return db.TimeTrackingRecords.Where(r => r.IssueKey == issueKey).OrderByDescending(r => r.StartTime).ToList();
        }

        public List<TimeTrackingRecord> GetUnsentCompletedRecords()
        {
            using var db = new TimeTrackingDbContext();
            db.Database.Migrate();
            return db.TimeTrackingRecords.Where(r => r.EndTime != null && !r.IsUploaded).ToList();
        }

        public void RemoveRecord(int id)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.Migrate();
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
            db.Database.Migrate();
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
            db.Database.Migrate();
            var record = db.TimeTrackingRecords.FirstOrDefault(r => r.Id == id);
            if (record != null)
            {
                db.TimeTrackingRecords.Remove(record);
                db.SaveChanges();
            }
        }

        public void MarkAsUploaded(int id)
        {
            using var db = new TimeTrackingDbContext();
            db.Database.Migrate();
            var record = db.TimeTrackingRecords.FirstOrDefault(r => r.Id == id);
            if (record != null)
            {
                record.IsUploaded = true;
                db.SaveChanges();
            }
        }
    }
}
