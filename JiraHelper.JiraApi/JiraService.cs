using JiraHelper.Settings;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace JiraHelper.JiraApi
{
    public class JiraComment
    {
        public string Author { get; set; }
        public string Body { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
    }

    public class JiraIssue
    {
        public string Id { get; set; }
        public string Key { get; set; }
        public string Summary { get; set; }
        public string Status { get; set; }
        public string Assignee { get; set; }
        public string Description { get; set; }
        public List<JiraComment> Comments { get; set; } = new();
    }

    public interface IJiraService
    {
        string BaseUrl { get; }
        Task<List<JiraIssue>> GetAssignedIssuesAsync(string user);
        Task<JiraIssue> GetIssueAsync(string key);
        Task<List<JiraIssue>> SearchIssuesAsync(string jql);
        void StartWork(string issueId);
        void EndWork(string issueId);
        void UploadTimeTracking(string issueId, TimeSpan timeSpent, DateTime? started);
        void UpdateStatus(string issueId, string newStatus);
        void AddComment(string issueId, string comment);
        Task<List<JiraWorklog>> GetWorklogsAsync(string issueKey);
    }

    public class JiraService : IJiraService
    {
        private readonly string jiraBaseUrl;
        private readonly string jiraEmail;
        private readonly string jiraApiToken;
        private readonly HttpClient httpClient;

        public string BaseUrl => jiraBaseUrl;

        public JiraService(UserSettings settings)
        {
            jiraBaseUrl = settings.BaseUrl;
            jiraEmail = settings.Email;
            jiraApiToken = settings.ApiToken;
            httpClient = CreateHttpClient();
        }

        private HttpClient CreateHttpClient()
        {
            var client = new HttpClient();
            var auth = $"{jiraEmail}:{jiraApiToken}";
            var bytes = Encoding.UTF8.GetBytes(auth);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(bytes));
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.Timeout = TimeSpan.FromSeconds(15);
            return client;
        }

        public async Task<List<JiraIssue>> GetAssignedIssuesAsync(string user)
        {
            try
            {
                var jql = $"assignee={user} ORDER BY Updated";
                var url = $"{jiraBaseUrl}/rest/api/3/search/jql?jql={Uri.EscapeDataString(jql)}&fields=key&fields=summary&fields=status&fields=assignee";
                var resp = await httpClient.GetAsync(url);
                var status = resp.StatusCode;
                var json = await resp.Content.ReadAsStringAsync();
                if (!resp.IsSuccessStatusCode)
                    throw new Exception($"HTTP error: {status}\nResponse: {json}");
                using var doc = JsonDocument.Parse(json);
                var issues = new List<JiraIssue>();
                foreach (var issue in doc.RootElement.GetProperty("issues").EnumerateArray())
                {
                    var fields = issue.GetProperty("fields");
                    string assignee = "";
                    if (fields.TryGetProperty("assignee", out var assigneeProp))
                    {
                        if (assigneeProp.ValueKind != JsonValueKind.Null)
                            assignee = assigneeProp.GetProperty("displayName").GetString();
                    }
                    issues.Add(new JiraIssue
                    {
                        Id = issue.GetProperty("id").GetString(),
                        Key = issue.GetProperty("key").GetString(),
                        Summary = fields.GetProperty("summary").GetString(),
                        Status = fields.GetProperty("status").GetProperty("name").GetString(),
                        Assignee = assignee
                    });
                }
                return issues;
            }
            catch (Exception ex)
            {
                // Log or inspect the exception here
                Console.WriteLine($"Exception in GetAssignedIssuesAsync: {ex}");
                return new List<JiraIssue>();
            }
        }

        public async Task<JiraIssue> GetIssueAsync(string key)
        {
            try
            {
                var url = $"{jiraBaseUrl}/rest/api/3/issue/{key}?fields=key,summary,status,assignee,description,comment";
                var resp = await httpClient.GetAsync(url);
                var status = resp.StatusCode;
                var json = await resp.Content.ReadAsStringAsync();
                if (!resp.IsSuccessStatusCode)
                    throw new Exception($"HTTP error: {status}\nResponse: {json}");
                using var doc = JsonDocument.Parse(json);
                var fields = doc.RootElement.GetProperty("fields");
                string assignee = "";
                if (fields.TryGetProperty("assignee", out var assigneeProp))
                {
                    if (assigneeProp.ValueKind != JsonValueKind.Null)
                        assignee = assigneeProp.GetProperty("displayName").GetString();
                }
                string description = "";
                if (fields.TryGetProperty("description", out var descProp))
                {
                    description = ParseDescription(descProp);
                }
                var comments = new List<JiraComment>();
                if (fields.TryGetProperty("comment", out var commentProp) && commentProp.TryGetProperty("comments", out var commentsArray))
                {
                    foreach (var c in commentsArray.EnumerateArray())
                    {
                        var author = c.GetProperty("author").GetProperty("displayName").GetString();
                        var body = ParseDescription(c.GetProperty("body"));
                        var created = DateTime.Parse(c.GetProperty("created").GetString());
                        DateTime? updated = null;
                        if (c.TryGetProperty("updated", out var updatedProp) && updatedProp.ValueKind != JsonValueKind.Null)
                            updated = DateTime.Parse(updatedProp.GetString());
                        comments.Add(new JiraComment { Author = author, Body = body, Created = created, Updated = updated });
                    }
                }
                return new JiraIssue
                {
                    Id = doc.RootElement.GetProperty("id").GetString(),
                    Key = doc.RootElement.GetProperty("key").GetString(),
                    Summary = fields.GetProperty("summary").GetString(),
                    Status = fields.GetProperty("status").GetProperty("name").GetString(),
                    Assignee = assignee,
                    Description = description,
                    Comments = comments
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetIssueAsync: {ex}");
                return null;
            }
        }

        public async Task<List<JiraIssue>> SearchIssuesAsync(string jql)
        {
            try
            {
                var url = $"{jiraBaseUrl}/rest/api/3/search/jql?jql={Uri.EscapeDataString(jql)}&fields=key&fields=summary&fields=status&fields=assignee";
                var resp = await httpClient.GetAsync(url);
                var status = resp.StatusCode;
                var json = await resp.Content.ReadAsStringAsync();
                if (!resp.IsSuccessStatusCode)
                    throw new Exception($"HTTP error: {status}\nResponse: {json}");
                using var doc = JsonDocument.Parse(json);
                var issues = new List<JiraIssue>();
                foreach (var issue in doc.RootElement.GetProperty("issues").EnumerateArray())
                {
                    var fields = issue.GetProperty("fields");
                    string assignee = "";
                    if (fields.TryGetProperty("assignee", out var assigneeProp))
                    {
                        if (assigneeProp.ValueKind != JsonValueKind.Null)
                            assignee = assigneeProp.GetProperty("displayName").GetString();
                    }
                    issues.Add(new JiraIssue
                    {
                        Id = issue.GetProperty("id").GetString(),
                        Key = issue.GetProperty("key").GetString(),
                        Summary = fields.GetProperty("summary").GetString(),
                        Status = fields.GetProperty("status").GetProperty("name").GetString(),
                        Assignee = assignee
                    });
                }
                return issues;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in SearchIssuesAsync: {ex}");
                return new List<JiraIssue>();
            }
        }

        // Basic ADF to plain text parser
        private string ParseDescription(JsonElement description)
        {
            if (description.ValueKind == JsonValueKind.Undefined || description.ValueKind == JsonValueKind.Null)
                return string.Empty;

            var sb = new StringBuilder();
            if (description.TryGetProperty("content", out var contentArray))
            {
                foreach (var block in contentArray.EnumerateArray())
                {
                    if (block.TryGetProperty("type", out var typeProp))
                    {
                        var type = typeProp.GetString();
                        if (type == "paragraph")
                        {
                            if (block.TryGetProperty("content", out var paraContent))
                            {
                                foreach (var item in paraContent.EnumerateArray())
                                {
                                    if (item.TryGetProperty("text", out var textProp))
                                        sb.Append(textProp.GetString());
                                }
                            }
                            // Always append a newline for a paragraph, even if empty
                            sb.AppendLine();
                        }
                        else if (type == "bulletList" && block.TryGetProperty("content", out var listContent))
                        {
                            foreach (var listItem in listContent.EnumerateArray())
                            {
                                if (listItem.TryGetProperty("content", out var itemContent))
                                {
                                    foreach (var para in itemContent.EnumerateArray())
                                    {
                                        if (para.TryGetProperty("content", out var paraContent))
                                        {
                                            sb.Append("� ");
                                            foreach (var item in paraContent.EnumerateArray())
                                            {
                                                if (item.TryGetProperty("text", out var textProp))
                                                    sb.Append(textProp.GetString());
                                            }
                                            sb.AppendLine();
                                        }
                                        else
                                        {
                                            // Empty bullet
                                            sb.AppendLine("�");
                                        }
                                    }
                                }
                            }
                        }
                        // Add more handlers for other types as needed
                    }
                }
            }
            return sb.ToString().Trim();
        }

        public void StartWork(string issueId) { /* TODO: Implement */ }
        public void EndWork(string issueId) { /* TODO: Implement */ }
        public void UploadTimeTracking(string issueId, TimeSpan timeSpent, DateTime? started = null)
        {
            // Example: send worklog to Jira
            var url = $"{jiraBaseUrl}/rest/api/3/issue/{issueId}/worklog";
            var seconds = (int)timeSpent.TotalSeconds;
            string startedStr = string.Empty;
            if (started.HasValue)
            {
                // Jira expects yyyy-MM-dd'T'HH:mm:ss.SSSZ (Z = +0000 or offset)
                var dt = started.Value.ToUniversalTime();
                startedStr = dt.ToString("yyyy-MM-dd'T'HH:mm:ss.fffzzz");
                // Remove the colon in the timezone offset (e.g. -04:00 -> -0400)
                if (startedStr.Length > 5 && startedStr[^3] == ':')
                    startedStr = startedStr.Remove(startedStr.Length - 3, 1);
            }
            var body = !string.IsNullOrEmpty(startedStr)
                ? $"{{\"timeSpentSeconds\":{seconds},\"started\":\"{startedStr}\"}}"
                : $"{{\"timeSpentSeconds\":{seconds}}}";
            var content = new StringContent(body, Encoding.UTF8, "application/json");
            var resp = httpClient.PostAsync(url, content).GetAwaiter().GetResult();
            if (!resp.IsSuccessStatusCode)
            {
                var json = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                throw new Exception($"Failed to upload time tracking: {resp.StatusCode} {json}");
            }
        }
        public void UpdateStatus(string issueId, string newStatus) { /* TODO: Implement */ }
        public void AddComment(string issueId, string comment) { /* TODO: Implement */ }

        public async Task<List<JiraWorklog>> GetWorklogsAsync(string issueKey)
        {
            var url = $"{jiraBaseUrl}/rest/api/3/issue/{issueKey}/worklog";
            var resp = await httpClient.GetAsync(url);
            var json = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
                throw new Exception($"HTTP error: {resp.StatusCode}\nResponse: {json}");
            using var doc = JsonDocument.Parse(json);
            var worklogs = new List<JiraWorklog>();
            foreach (var wl in doc.RootElement.GetProperty("worklogs").EnumerateArray())
            {
                var started = wl.TryGetProperty("started", out var startedProp) ? startedProp.GetString() : null;
                var timeSpentSeconds = wl.TryGetProperty("timeSpentSeconds", out var tssProp) ? tssProp.GetInt32() : 0;
                worklogs.Add(new JiraWorklog
                {
                    Started = started,
                    TimeSpentSeconds = timeSpentSeconds
                });
            }
            return worklogs;
        }
    }

    public class JiraWorklog
    {
        public string Started { get; set; }
        public int TimeSpentSeconds { get; set; }
    }
}