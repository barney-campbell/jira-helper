using Microsoft.EntityFrameworkCore;

namespace JiraHelper.Settings
{
    public class SettingsDbContext : DbContext
    {
        public DbSet<UserSettings> Settings { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=user_settings.db");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserSettings>().HasKey(x => x.Id);
            modelBuilder.Entity<UserSettings>().Property(x => x.Id).ValueGeneratedNever();
        }
    }
}
