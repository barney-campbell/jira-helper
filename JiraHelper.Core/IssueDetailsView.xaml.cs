using JiraHelper.JiraApi;
using JiraHelper.TimeTracking;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace JiraHelper.Core
{
    public partial class IssueDetailsView : UserControl
    {
        private string _issueKey;
        private string _baseUrl;
        private TimeTrackingService _timeTrackingService = new TimeTrackingService();
        private DispatcherTimer _timer;
        private List<TimeTrackingRecord> _records;
        private List<JiraWorklog> _jiraWorklogs;
        private IJiraService _jiraService;
        private ObservableCollection<JiraComment> _comments = new();

        public IssueDetailsView()
        {
            InitializeComponent();
            _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
            _timer.Tick += Timer_Tick;
        }

        public async Task LoadIssueAsync(IJiraService jiraService, string key)
        {
            _issueKey = key;
            _jiraService = jiraService;
            _baseUrl = jiraService.BaseUrl;
            var issue = await jiraService.GetIssueAsync(key);
            if (issue != null)
            {
                KeyText.Text = issue.Key;
                SummaryText.Text = issue.Summary;
                StatusText.Text = issue.Status;
                AssigneeText.Text = issue.Assignee;
                // Bind DescriptionBlocks to ItemsControl
                DescriptionBlocksList.ItemsSource = issue.DescriptionBlocks;
                _comments.Clear();
                if (issue.Comments != null)
                {
                    foreach (var c in issue.Comments)
                        _comments.Add(c);
                }
                CommentsList.ItemsSource = _comments;
            }
            await LoadTimeTracking();
        }

        private async Task LoadTimeTracking()
        {
            _records = _timeTrackingService.GetRecords(_issueKey);
            _jiraWorklogs = await _jiraService.GetWorklogsAsync(_issueKey);
            var items = new List<dynamic>();
            bool hasActive = false;
            TimeSpan total = TimeSpan.Zero;
            foreach (var record in _records)
            {
                TimeSpan duration = TimeSpan.Zero;
                bool canEdit = true;
                int recordId = record.Id;
                if (record.EndTime == null)
                {
                    hasActive = true;
                    duration = DateTime.UtcNow - record.StartTime;
                    items.Add(new { Started = record.StartTime.ToString("yyyy-MM-dd HH:mm:ss"), Duration = FormatCustomDuration(duration, true), Source = "Local", CanEdit = canEdit, RecordId = recordId });
                }
                else if (!record.IsUploaded)
                {
                    duration = record.EndTime.Value - record.StartTime;
                    items.Add(new { Started = record.StartTime.ToString("yyyy-MM-dd HH:mm:ss"), Duration = FormatCustomDuration(duration, false), Source = "Local", CanEdit = canEdit, RecordId = recordId });
                }
                total += duration;
            }
            foreach (var worklog in _jiraWorklogs)
            {
                var started = FormatJiraDate(worklog.Started);
                var duration = TimeSpan.FromSeconds(worklog.TimeSpentSeconds);
                items.Add(new { Started = started, Duration = FormatCustomDuration(duration, false), Source = "Jira", CanEdit = false, RecordId = 0 });
                total += duration;
            }
            TimeTrackingGrid.ItemsSource = items;
            TotalTimeText.Text = $"Total Time Tracked: {FormatCustomDuration(total, false)}";
            StartTrackingButton.Visibility = hasActive ? Visibility.Collapsed : Visibility.Visible;
            StopTrackingButton.Visibility = hasActive ? Visibility.Visible : Visibility.Collapsed;
            if (hasActive) _timer.Start(); else _timer.Stop();
        }

        private void Timer_Tick(object sender, EventArgs e)
        {
            var items = new List<dynamic>();
            TimeSpan total = TimeSpan.Zero;
            bool hasActive = false;
            foreach (var record in _records)
            {
                TimeSpan duration = TimeSpan.Zero;
                bool canEdit = true;
                int recordId = record.Id;
                if (record.EndTime == null)
                {
                    hasActive = true;
                    duration = DateTime.UtcNow - record.StartTime;
                    items.Add(new { Started = record.StartTime.ToString("yyyy-MM-dd HH:mm:ss"), Duration = FormatCustomDuration(duration, true), Source = "Local", CanEdit = canEdit, RecordId = recordId });
                }
                else if (!record.IsUploaded)
                {
                    duration = record.EndTime.Value - record.StartTime;
                    items.Add(new { Started = record.StartTime.ToString("yyyy-MM-dd HH:mm:ss"), Duration = FormatCustomDuration(duration, false), Source = "Local", CanEdit = canEdit, RecordId = recordId });
                }
                total += duration;
            }
            foreach (var worklog in _jiraWorklogs)
            {
                var started = worklog.Started;
                var duration = TimeSpan.FromSeconds(worklog.TimeSpentSeconds);
                items.Add(new { Started = FormatJiraDate(started), Duration = FormatCustomDuration(duration, false), Source = "Jira", CanEdit = false, RecordId = 0 });
                total += duration;
            }
            TimeTrackingGrid.ItemsSource = items;
            TotalTimeText.Text = $"Total Time Tracked: {FormatCustomDuration(total, false)}";
        }

        private string GetElapsed(DateTime start)
        {
            var span = DateTime.UtcNow - start;
            return span.ToString(@"hh\:mm\:ss");
        }

        private void StartTrackingButton_Click(object sender, RoutedEventArgs e)
        {
            _timeTrackingService.StartTracking(_issueKey);
            _ = LoadTimeTracking();
        }

        private void StopTrackingButton_Click(object sender, RoutedEventArgs e)
        {
            _timeTrackingService.StopTracking(_issueKey);
            _ = LoadTimeTracking();
        }

        private string FormatCustomDuration(TimeSpan span, bool showSeconds = false)
        {
            const double hoursPerDay = 7.5;
            int totalSeconds = (int)span.TotalSeconds;
            int totalMinutes = totalSeconds / 60;
            int days = (int)(totalMinutes / (hoursPerDay * 60));
            int hours = (int)((totalMinutes - days * (int)(hoursPerDay * 60)) / 60);
            int minutes = totalMinutes % 60;
            int seconds = totalSeconds % 60;
            string result = "";
            if (days > 0) result += $"{days}d ";
            if (hours > 0 || days > 0) result += $"{hours}h ";
            result += $"{minutes}m";
            if (showSeconds) result += $" {seconds}s";
            return result.Trim();
        }

        private string FormatJiraDate(string jiraDate)
        {
            if (string.IsNullOrEmpty(jiraDate)) return "";
            if (DateTimeOffset.TryParseExact(
                    jiraDate,
                    "yyyy-MM-dd'T'HH:mm:ss.fffzzz",
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None,
                    out var dto))
            {
                return dto.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss");
            }
            return jiraDate;
        }

        private void DeleteRecord_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is int id && id > 0)
            {
                _timeTrackingService.DeleteRecord(id);
                _ = LoadTimeTracking();
            }
        }

        private void EditRecord_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is int id && id > 0)
            {
                var record = _records.FirstOrDefault(r => r.Id == id);
                if (record != null)
                {
                    var dialog = new EditTimeTrackingDialog(record);
                    if (dialog.ShowDialog() == true)
                    {
                        _timeTrackingService.UpdateRecord(dialog.UpdatedRecord);
                        _ = LoadTimeTracking();
                    }
                }
            }
        }

        private void IssueWebLink_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrEmpty(_baseUrl) && !string.IsNullOrEmpty(_issueKey))
            {
                var url = $"{_baseUrl}/browse/{_issueKey}";
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = url,
                        UseShellExecute = true
                    });
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Failed to open URL: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }
    }
}
