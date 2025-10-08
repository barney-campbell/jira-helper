using JiraHelper.JiraApi;
using System.Threading.Tasks;
using System.Windows.Controls;

namespace JiraHelper.Core
{
    public partial class IssueDetailsView : UserControl
    {
        public IssueDetailsView()
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
                DescriptionText.Text = issue.Description;
            }
        }
    }
}
