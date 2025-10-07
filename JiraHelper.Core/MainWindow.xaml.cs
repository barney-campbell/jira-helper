using JiraHelper.JiraApi;
using JiraHelper.Settings;
using System.Windows;

namespace JiraHelper.Core
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private readonly IJiraService _jiraService;
        private readonly UserSettingsService _settingsService = new UserSettingsService();
        public MainWindow()
        {
            InitializeComponent();
            var settings = _settingsService.Load();
            _jiraService = new JiraService(settings);
            Loaded += MainWindow_Loaded;
            IssuesList.MouseDoubleClick += IssuesList_MouseDoubleClick;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await LoadAssignedIssuesAsync();
        }

        public async Task LoadAssignedIssuesAsync()
        {
            var issues = await _jiraService.GetAssignedIssuesAsync("currentuser()");
            IssuesList.ItemsSource = issues;
        }

        private async void IssuesList_MouseDoubleClick(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (IssuesList.SelectedItem is JiraIssue selectedIssue)
            {
                var detailsWindow = new IssueDetailsWindow();
                await detailsWindow.LoadIssueAsync(_jiraService, selectedIssue.Key);
                detailsWindow.Owner = this;
                detailsWindow.ShowDialog();
            }
        }

        // Add a menu or button handler to open the settings window
        private void OpenSettings_Click(object sender, RoutedEventArgs e)
        {
            var settingsWindow = new SettingsWindow();
            settingsWindow.Owner = this;
            settingsWindow.ShowDialog();
            var settings = _settingsService.Load();
            // Optionally, re-instantiate _jiraService with new settings
        }
    }
}