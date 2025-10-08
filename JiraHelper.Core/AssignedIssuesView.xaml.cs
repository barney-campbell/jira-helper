using JiraHelper.JiraApi;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace JiraHelper.Core
{
    public partial class AssignedIssuesView : UserControl
    {
        public DataGrid IssuesList => issuesList;
        private IJiraService _jiraService;
        public event RoutedEventHandler IssueDoubleClicked;

        public AssignedIssuesView()
        {
            InitializeComponent();
        }

        public async Task LoadIssuesAsync(IJiraService jiraService)
        {
            _jiraService = jiraService;
            RefreshSpinner.Visibility = Visibility.Visible;
            try
            {
                var issues = await _jiraService.GetAssignedIssuesAsync("currentuser()");
                issuesList.ItemsSource = issues;
                UpdatedText.Text = System.DateTime.Now.ToString("g");
            }
            finally
            {
                RefreshSpinner.Visibility = Visibility.Collapsed;
            }
        }

        private async void Refresh_Click(object sender, RoutedEventArgs e)
        {
            await LoadIssuesAsync(_jiraService);
        }

        private async void IssuesList_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (issuesList.SelectedItem is JiraIssue selectedIssue)
            {
                IssueDoubleClicked?.Invoke(selectedIssue, e);
            }
        }
    }
}
