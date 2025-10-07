using Microsoft.Data.Sqlite;
using System.Security.Cryptography;
using System.Text;

namespace JiraHelper.Settings
{
    public class UserSettingsService
    {
        private const string DbPath = "user_settings.db";

        public UserSettingsService()
        {
            using var conn = new SqliteConnection($"Data Source={DbPath}");
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS Settings (
                    Id INTEGER PRIMARY KEY,
                    BaseUrl TEXT,
                    Email TEXT,
                    ApiToken BLOB
                );";
            cmd.ExecuteNonQuery();
        }

        public UserSettings Load()
        {
            using var conn = new SqliteConnection($"Data Source={DbPath}");
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT BaseUrl, Email, ApiToken FROM Settings WHERE Id = 1";
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                var baseUrl = reader.GetString(0);
                var email = reader.GetString(1);
                var tokenBytes = (byte[])reader["ApiToken"];
                var apiToken = Encoding.UTF8.GetString(ProtectedData.Unprotect(tokenBytes, null, DataProtectionScope.CurrentUser));
                return new UserSettings { BaseUrl = baseUrl, Email = email, ApiToken = apiToken };
            }
            return new UserSettings();
        }

        public void Save(UserSettings settings)
        {
            using var conn = new SqliteConnection($"Data Source={DbPath}");
            conn.Open();
            var cmd = conn.CreateCommand();
            var tokenBytes = ProtectedData.Protect(Encoding.UTF8.GetBytes(settings.ApiToken ?? ""), null, DataProtectionScope.CurrentUser);
            cmd.CommandText = @"
                INSERT INTO Settings (Id, BaseUrl, Email, ApiToken)
                VALUES (1, $baseUrl, $email, $apiToken)
                ON CONFLICT(Id) DO UPDATE SET
                    BaseUrl = $baseUrl,
                    Email = $email,
                    ApiToken = $apiToken;";
            cmd.Parameters.AddWithValue("$baseUrl", settings.BaseUrl ?? "");
            cmd.Parameters.AddWithValue("$email", settings.Email ?? "");
            cmd.Parameters.AddWithValue("$apiToken", tokenBytes);
            cmd.ExecuteNonQuery();
        }
    }
}
