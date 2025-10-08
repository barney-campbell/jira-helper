using JiraHelper.JiraApi;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace JiraHelper.Core
{
    public partial class IssueSearchView : UserControl
    {
        private IJiraService _jiraService;
        public event RoutedEventHandler IssueFound;

        public IssueSearchView()
        {
            InitializeComponent();
        }

        public void SetJiraService(IJiraService jiraService)
        {
            _jiraService = jiraService;
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
        }

        private async Task SearchAndShowIssue()
        {
            var key = SearchBox.Text.Trim();
            if (string.IsNullOrEmpty(key) || _jiraService == null) return;
            var issue = await _jiraService.GetIssueAsync(key);
            if (issue != null)
            {
                ResultText.Text = $"Found: {issue.Key} - {issue.Summary}";
                IssueFound?.Invoke(issue, new RoutedEventArgs());
            }
            else
            {
                ResultText.Text = $"Issue '{key}' not found.";
            }
        }
    }
}
