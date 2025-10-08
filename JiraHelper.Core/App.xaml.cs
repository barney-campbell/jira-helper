using System.Configuration;
using System.Data;
using System.Windows;
using JiraHelper.TimeTracking;
using JiraHelper.Settings;
using Microsoft.EntityFrameworkCore;

namespace JiraHelper.Core
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            // Apply migrations for TimeTrackingDbContext
            using (var db = new TimeTrackingDbContext())
            {
                db.Database.Migrate();
            }
            // Apply migrations for SettingsDbContext (if migrations are created)
            using (var db = new SettingsDbContext())
            {
                db.Database.Migrate();
            }
        }
    }
}
