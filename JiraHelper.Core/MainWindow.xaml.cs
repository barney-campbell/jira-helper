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
        public static RoutedCommand ShowSearchCommand = new RoutedCommand();

        public MainWindow()
        {
            InitializeComponent();
            var settings = _settingsService.Load();
            _jiraService = new JiraService(settings);
            Loaded += MainWindow_Loaded;
            IssuesList.MouseDoubleClick += IssuesList_MouseDoubleClick;
            CommandBindings.Add(new CommandBinding(RefreshCommand, Refresh_Executed));
            CommandBindings.Add(new CommandBinding(ShowSearchCommand, ToggleSearch_Executed));
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

        private void ToggleSearch_Executed(object sender, ExecutedRoutedEventArgs e)
        {
            ToggleSearchBar();
        }

        private void ToggleSearch_Click(object sender, RoutedEventArgs e)
        {
            ToggleSearchBar();
        }

        private void ToggleSearchBar()
        {
            if (SearchBarPanel.Visibility == Visibility.Visible)
            {
                SearchBarPanel.Visibility = Visibility.Collapsed;
                SearchBox.Text = string.Empty;
            }
            else
            {
                SearchBarPanel.Visibility = Visibility.Visible;
                SearchBox.Text = string.Empty;
                SearchBox.Focus();
            }
        }

        private async void SearchButton_Click(object sender, RoutedEventArgs e)
        {
            await SearchAndShowIssue();
        }

        private async void SearchBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                await SearchAndShowIssue();
            }
            else if (e.Key == Key.Escape)
            {
                SearchBarPanel.Visibility = Visibility.Collapsed;
            }
        }

        private async Task SearchAndShowIssue()
        {
            var key = SearchBox.Text.Trim();
            if (string.IsNullOrEmpty(key)) return;
            var detailsView = new IssueDetailsView();
            var issue = await _jiraService.GetIssueAsync(key);
            if (issue != null)
            {
                await detailsView.LoadIssueAsync(_jiraService, key);
                MainContentView.Content = detailsView;
            }
            else
            {
                MainContentView.Content = null;
                MessageBox.Show($"Issue '{key}' not found.", "Not Found", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
    }
}