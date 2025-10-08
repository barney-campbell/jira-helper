using JiraHelper.JiraApi;
using JiraHelper.Settings;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace JiraHelper.Core
{
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
                var detailsView = new IssueDetailsView();
                await detailsView.LoadIssueAsync(_jiraService, selectedIssue.Key);
                MainContentView.Content = detailsView;
            }
        }

        private void OpenSettings_Click(object sender, RoutedEventArgs e)
        {
            var settingsView = new SettingsView();
            MainContentView.Content = settingsView;
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