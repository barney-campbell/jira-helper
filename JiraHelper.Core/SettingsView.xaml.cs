using JiraHelper.Settings;
using System.Windows;
using System.Windows.Controls;

namespace JiraHelper.Core
{
    public partial class SettingsView : UserControl
    {
        private readonly UserSettingsService _settingsService = new UserSettingsService();
        public SettingsView()
        {
            InitializeComponent();
            LoadSettings();
        }

        private void LoadSettings()
        {
            var settings = _settingsService.Load();
            BaseUrlTextBox.Text = settings.BaseUrl;
            EmailTextBox.Text = settings.Email;
            ApiTokenBox.Password = settings.ApiToken;
        }

        private void Save_Click(object sender, RoutedEventArgs e)
        {
            var settings = new UserSettings
            {
                BaseUrl = BaseUrlTextBox.Text,
                Email = EmailTextBox.Text,
                ApiToken = ApiTokenBox.Password
            };
            _settingsService.Save(settings);
            MessageBox.Show("Settings saved.", "Info", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}
