using JiraHelper.JiraApi;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace JiraHelper.Core
{
    public partial class IssueSearchView : UserControl
    {
        private IJiraService _jiraService;
        public event RoutedEventHandler IssueDoubleClicked;

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
            await SearchAndShowResults();
        }

        private async void SearchBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                await SearchAndShowResults();
            }
        }

        private async Task SearchAndShowResults()
        {
            var query = SearchBox.Text.Trim();
            if (string.IsNullOrEmpty(query) || _jiraService == null) return;

            SearchSpinner.Visibility = Visibility.Visible;
            ResultText.Text = "";
            resultsGrid.ItemsSource = null;

            try
            {
                // Check if the query looks like a Jira key (e.g., PROJECT-123)
                var isJiraKey = Regex.IsMatch(query, @"^[A-Z]+-\d+$", RegexOptions.IgnoreCase);
                List<JiraIssue> results;

                if (isJiraKey)
                {
                    // Try to get the specific issue by key
                    var issue = await _jiraService.GetIssueAsync(query);
                    if (issue != null)
                    {
                        results = new List<JiraIssue> { issue };
                    }
                    else
                    {
                        results = new List<JiraIssue>();
                    }
                }
                else
                {
                    // Perform keyword search using JQL, order by updated date descending
                    var jql = $"summary ~ \"{query}\" OR description ~ \"{query}\" ORDER BY updated DESC";
                    results = await _jiraService.SearchIssuesAsync(jql);
                }

                resultsGrid.ItemsSource = results;

                if (results.Count > 0)
                {
                    ResultText.Text = $"Found {results.Count} issue(s)";
                }
                else
                {
                    ResultText.Text = $"No issues found for '{query}'";
                }
            }
            finally
            {
                SearchSpinner.Visibility = Visibility.Collapsed;
            }
        }

        private void ResultsGrid_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (resultsGrid.SelectedItem is JiraIssue selectedIssue)
            {
                IssueDoubleClicked?.Invoke(selectedIssue, e);
            }
        }
    }
}
