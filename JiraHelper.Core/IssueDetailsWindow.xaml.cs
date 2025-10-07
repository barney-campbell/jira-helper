using JiraHelper.JiraApi;
using System.Windows;

namespace JiraHelper.Core
{
    public partial class IssueDetailsWindow : Window
    {
        public IssueDetailsWindow()
        {
            InitializeComponent();
        }

        public async Task LoadIssueAsync(IJiraService jiraService, string key)
        {
            var issue = await jiraService.GetIssueAsync(key);
            if (issue != null)
            {
                KeyText.Text = issue.Key;
                SummaryText.Text = issue.Summary;
                StatusText.Text = issue.Status;
                AssigneeText.Text = issue.Assignee;
                DescriptionText.Text = issue.Description; // Show parsed description
            }
        }
    }
}