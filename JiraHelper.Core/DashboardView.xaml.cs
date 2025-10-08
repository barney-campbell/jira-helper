using JiraHelper.JiraApi;
using System.Windows.Controls;

namespace JiraHelper.Core
{
    public partial class DashboardView : UserControl
    {
        private IJiraService _jiraService;
        public DashboardView()
        {
            InitializeComponent();
        }
        public void SetJiraService(IJiraService jiraService)
        {
            _jiraService = jiraService;
            UnuploadedTimeTrackingWidget.SetJiraService(jiraService);
        }
    }
}
