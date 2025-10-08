using System.Security.Cryptography;
using System.Text;

namespace JiraHelper.Settings
{
    public class UserSettingsService
    {
        public UserSettingsService()
        {
            using var db = new SettingsDbContext();
            db.Database.EnsureCreated();
        }

        public UserSettings Load()
        {
            using var db = new SettingsDbContext();
            db.Database.EnsureCreated();
            var settings = db.Settings.FirstOrDefault(x => x.Id == 1);
            if (settings != null && settings.ApiToken != null)
            {
                // Try to decode as Base64 (new format)
                var tokenBytes = Convert.FromBase64String(settings.ApiToken);
                settings.ApiToken = Encoding.UTF8.GetString(ProtectedData.Unprotect(tokenBytes, null, DataProtectionScope.CurrentUser));
            }
            return settings ?? new UserSettings();
        }

        public void Save(UserSettings settings)
        {
            using var db = new SettingsDbContext();
            db.Database.EnsureCreated();
            var tokenBytes = ProtectedData.Protect(Encoding.UTF8.GetBytes(settings.ApiToken ?? ""), null, DataProtectionScope.CurrentUser);
            settings.ApiToken = Convert.ToBase64String(tokenBytes);
            var existing = db.Settings.FirstOrDefault(x => x.Id == 1);
            if (existing == null)
            {
                db.Settings.Add(settings);
            }
            else
            {
                existing.BaseUrl = settings.BaseUrl;
                existing.Email = settings.Email;
                existing.ApiToken = settings.ApiToken;
            }
            db.SaveChanges();
        }
    }
}