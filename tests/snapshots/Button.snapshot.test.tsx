import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Button } from '../../src/renderer/components/Button';
import { lightTheme, darkTheme } from '../../src/renderer/theme';

const renderWithTheme = (component: React.ReactElement, theme = lightTheme) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Button Component Snapshots', () => {
  describe('Light Theme', () => {
    it('should match snapshot for primary variant', () => {
      const { container } = renderWithTheme(<Button>Primary Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for secondary variant', () => {
      const { container } = renderWithTheme(
        <Button variant="secondary">Secondary Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for danger variant', () => {
      const { container } = renderWithTheme(
        <Button variant="danger">Danger Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for disabled state', () => {
      const { container } = renderWithTheme(<Button disabled>Disabled Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Dark Theme', () => {
    it('should match snapshot for primary variant in dark theme', () => {
      const { container } = renderWithTheme(<Button>Primary Button</Button>, darkTheme);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for secondary variant in dark theme', () => {
      const { container } = renderWithTheme(
        <Button variant="secondary">Secondary Button</Button>,
        darkTheme
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
