using JiraHelper.JiraApi;
using JiraHelper.Settings;
using System.Windows;
using System.Windows.Input;

namespace JiraHelper.Core
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private readonly IJiraService _jiraService;
        private readonly UserSettingsService _settingsService = new UserSettingsService();
        public static RoutedCommand RefreshCommand = new RoutedCommand();

        public MainWindow()
        {
            InitializeComponent();
            var settings = _settingsService.Load();
            _jiraService = new JiraService(settings);
            Loaded += MainWindow_Loaded;
            IssuesList.MouseDoubleClick += IssuesList_MouseDoubleClick;
            CommandBindings.Add(new CommandBinding(RefreshCommand, Refresh_Executed));
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await LoadAssignedIssuesAsync();
        }

        public async Task LoadAssignedIssuesAsync()
        {
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
        }

        private async void IssuesList_MouseDoubleClick(object sender, MouseButtonEventArgs e)
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

        private async void Refresh_Click(object sender, RoutedEventArgs e)
        {
            await LoadAssignedIssuesAsync();
        }

        private async void Refresh_Executed(object sender, ExecutedRoutedEventArgs e)
        {
            await LoadAssignedIssuesAsync();
        }
    }
}