import styled from 'styled-components';

export const WidgetContainer = styled.div`
  background-color: ${props => props.theme.colors.surface};
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    margin-bottom: 15px;
    font-size: 18px;
    color: ${props => props.theme.colors.text};
  }
`;

export const WidgetFooter = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
`;
