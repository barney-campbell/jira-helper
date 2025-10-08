using JiraHelper.Settings;
using System;
using System.Windows;
using System.Windows.Controls;

namespace JiraHelper.Core
{
    public partial class EditTimeTrackingDialog : Window
    {
        public TimeTrackingRecord UpdatedRecord { get; private set; }

        public EditTimeTrackingDialog(TimeTrackingRecord record)
        {
            InitializeComponent();
            StartTimePicker.SelectedDate = record.StartTime;
            EndTimePicker.SelectedDate = record.EndTime;
            UpdatedRecord = new TimeTrackingRecord
            {
                Id = record.Id,
                IssueKey = record.IssueKey,
                StartTime = record.StartTime,
                EndTime = record.EndTime
            };
        }

        private void OkButton_Click(object sender, RoutedEventArgs e)
        {
            if (StartTimePicker.SelectedDate.HasValue)
                UpdatedRecord.StartTime = StartTimePicker.SelectedDate.Value;
            UpdatedRecord.EndTime = EndTimePicker.SelectedDate;
            DialogResult = true;
            Close();
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
