using JiraHelper.JiraApi;
using JiraHelper.TimeTracking;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace JiraHelper.Core
{
    public partial class UnuploadedTimeTrackingWidget : UserControl
    {
        private TimeTrackingService _timeTrackingService = new TimeTrackingService();
        private DispatcherTimer _timer;
        private List<TimeTrackingRecord> _records;
        private IJiraService _jiraService;

        public UnuploadedTimeTrackingWidget()
        {
            InitializeComponent();
            _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
            _timer.Tick += Timer_Tick;
            Loaded += UnuploadedTimeTrackingWidget_Loaded;
        }

        public void SetJiraService(IJiraService jiraService)
        {
            _jiraService = jiraService;
        }

        private void UnuploadedTimeTrackingWidget_Loaded(object sender, RoutedEventArgs e)
        {
            LoadRecords();
            _timer.Start();
        }

        private void Timer_Tick(object sender, EventArgs e)
        {
            LoadRecords();
        }

        private void LoadRecords()
        {
            _records = _timeTrackingService.GetUnsentCompletedRecords();
            var items = _records.Select(r => new
            {
                IssueKey = r.IssueKey,
                StartTime = r.StartTime.ToString("yyyy-MM-dd HH:mm:ss"),
                Elapsed = r.EndTime.HasValue ? FormatElapsed(r.EndTime.Value - r.StartTime) : FormatElapsed(DateTime.UtcNow - r.StartTime)
            }).ToList();
            UnuploadedGrid.ItemsSource = items;
        }

        private string FormatElapsed(TimeSpan span)
        {
            return span.ToString(@"hh\:mm\:ss");
        }

        private void UploadAll_Click(object sender, RoutedEventArgs e)
        {
            if (_jiraService == null) return;
            int success = 0, fail = 0;
            foreach (var record in _records)
            {
                var duration = (record.EndTime ?? DateTime.UtcNow) - record.StartTime;
                try
                {
                    _jiraService.UploadTimeTracking(record.IssueKey, duration, record.StartTime);
                    _timeTrackingService.MarkAsUploaded(record.Id);
                    success++;
                }
                catch
                {
                    fail++;
                }
            }
            LoadRecords();
            MessageBox.Show($"Uploaded {success} time tracking records. {fail} failed.", "Time Tracking Upload", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}
