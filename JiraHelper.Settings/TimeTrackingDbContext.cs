using System;
using Microsoft.EntityFrameworkCore;

namespace JiraHelper.Settings
{
    public class TimeTrackingRecord
    {
        public int Id { get; set; }
        public string IssueKey { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
    }

    public class TimeTrackingDbContext : DbContext
    {
        public DbSet<TimeTrackingRecord> TimeTrackingRecords { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=time_tracking.db");
        }
    }
}
