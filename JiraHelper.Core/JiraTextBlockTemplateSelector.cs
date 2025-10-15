using System.Windows;
using System.Windows.Controls;
using JiraHelper.JiraApi;

namespace JiraHelper.Core
{
    public class JiraTextBlockTemplateSelector : DataTemplateSelector
    {
        public DataTemplate TextTemplate { get; set; }
        public DataTemplate CodeTemplate { get; set; }

        public override DataTemplate SelectTemplate(object item, DependencyObject container)
        {
            if (item is JiraTextBlock block)
                return block.IsCode ? CodeTemplate : TextTemplate;
            return base.SelectTemplate(item, container);
        }
    }
}
