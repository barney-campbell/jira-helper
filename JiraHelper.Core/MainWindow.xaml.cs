using JiraHelper.JiraApi;
using JiraHelper.Settings;
using JiraHelper.TimeTracking;
using System.Windows;
using System.Windows.Input;

namespace JiraHelper.Core
{
    public partial class MainWindow : Window
    {
        private IJiraService _jiraService;
        private readonly UserSettingsService _settingsService = new UserSettingsService();
        private readonly TimeTrackingService _timeTrackingService = new TimeTrackingService();
        public static RoutedCommand RefreshCommand = new RoutedCommand();
        private AssignedIssuesView _assignedIssuesView;

        public MainWindow()
        {
            InitializeComponent();
            var settings = _settingsService.Load();
            _jiraService = new JiraService(settings);
            Loaded += MainWindow_Loaded;
            CommandBindings.Add(new CommandBinding(RefreshCommand, Refresh_Executed));
            ShowDashboard();
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await LoadAssignedIssuesAsync();
        }

        public async Task LoadAssignedIssuesAsync()
        {
            // Remove references to RefreshSpinner, IssuesList, and UpdatedText in MainWindow
            // These controls are now part of the dashboard or assigned issues view
            // Optionally, you can show a loading indicator in the dashboard or assigned issues view if needed

            /*
            RefreshSpinner.Visibility = Visibility.Visible;
            try
            {
                var issues = await _jiraService.GetAssignedIssuesAsync("currentuser()");
                IssuesList.ItemsSource = issues;
                UpdatedText.Text = DateTime.Now.ToString("g");
            }
            finally
            {
                RefreshSpinner.Visibility = Visibility.Collapsed;
            }
            */
        }

        private async void IssuesList_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            /*
            if (IssuesList.SelectedItem is JiraIssue selectedIssue)
            {
                var detailsView = new IssueDetailsView();
                await detailsView.LoadIssueAsync(_jiraService, selectedIssue.Key);
                MainContentView.Content = detailsView;
            }
            */
        }

        private void OpenSettings_Click(object sender, RoutedEventArgs e)
        {
            var settingsView = new SettingsView();
            settingsView.SettingsSaved += SettingsView_SettingsSaved;
            MainContentView.Content = settingsView;
        }

        private void SettingsView_SettingsSaved(object sender, EventArgs e)
        {
            var settings = _settingsService.Load();
            _jiraService = new JiraService(settings);
        }

        private async void Refresh_Click(object sender, RoutedEventArgs e)
        {
            if (MainContentView.Content is AssignedIssuesView)
            {
                await _assignedIssuesView.LoadIssuesAsync(_jiraService);
            }
            else
            {
                // Optionally, handle refresh for other views
            }
        }

        private async void Refresh_Executed(object sender, ExecutedRoutedEventArgs e)
        {
            if (MainContentView.Content is AssignedIssuesView)
            {
                await _assignedIssuesView.LoadIssuesAsync(_jiraService);
            }
            else
            {
                // Optionally, handle refresh for other views
            }
        }

        private async void SaveTimeTracking_Click(object sender, RoutedEventArgs e)
        {
            var records = _timeTrackingService.GetUnsentCompletedRecords();
            int success = 0, fail = 0;
            foreach (var record in records)
            {
                var duration = record.EndTime.Value - record.StartTime;
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
            MessageBox.Show($"Uploaded {success} time tracking records. {fail} failed.", "Time Tracking Upload", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void ShowDashboard_Click(object sender, RoutedEventArgs e)
        {
            ShowDashboard();
        }

        private void ShowDashboard()
        {
            MainContentView.Content = new DashboardView();
        }

        private void ShowAssignedIssues_Click(object sender, RoutedEventArgs e)
        {
            ShowAssignedIssues();
        }

        private async void ShowAssignedIssues()
        {
            _assignedIssuesView = new AssignedIssuesView();
            _assignedIssuesView.IssueDoubleClicked += AssignedIssuesView_IssueDoubleClicked;
            MainContentView.Content = _assignedIssuesView;
            await _assignedIssuesView.LoadIssuesAsync(_jiraService);
        }

        private async void AssignedIssuesView_IssueDoubleClicked(object sender, RoutedEventArgs e)
        {
            if (sender is JiraIssue selectedIssue)
            {
                var detailsView = new IssueDetailsView();
                await detailsView.LoadIssueAsync(_jiraService, selectedIssue.Key);
                MainContentView.Content = detailsView;
            }
        }

        private void ShowSearchPage_Click(object sender, RoutedEventArgs e)
        {
            ShowSearchPage();
        }

        private void ShowSearchPage()
        {
            var searchView = new IssueSearchView();
            searchView.SetJiraService(_jiraService);
            searchView.IssueFound += async (issueObj, args) =>
            {
                if (issueObj is JiraIssue foundIssue)
                {
                    var detailsView = new IssueDetailsView();
                    await detailsView.LoadIssueAsync(_jiraService, foundIssue.Key);
                    MainContentView.Content = detailsView;
                }
            };
            MainContentView.Content = searchView;
        }
    }
}