using JiraHelper.JiraApi;
using System.Windows;
using System.Windows.Controls;

namespace JiraHelper.Core
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private readonly IJiraService _jiraService;
        public MainWindow()
        {
            InitializeComponent();
            _jiraService = new JiraService();
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
    }
}