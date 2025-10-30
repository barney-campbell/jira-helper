import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Button } from '../../src/renderer/components/Button';
import { lightTheme } from '../../src/renderer/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={lightTheme}>{component}</ThemeProvider>);
};

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with children text', () => {
      renderWithTheme(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render as primary variant by default', () => {
      renderWithTheme(<Button>Primary</Button>);
      const button = screen.getByText('Primary');
      expect(button).toBeInTheDocument();
    });

    it('should render with secondary variant', () => {
      renderWithTheme(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByText('Secondary');
      expect(button).toBeInTheDocument();
    });

    it('should render with danger variant', () => {
      renderWithTheme(<Button variant="danger">Danger</Button>);
      const button = screen.getByText('Danger');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      renderWithTheme(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByText('Click Me');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      renderWithTheme(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByText('Disabled');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Props', () => {
    it('should accept type prop', () => {
      renderWithTheme(<Button type="submit">Submit</Button>);
      const button = screen.getByText('Submit');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should default to button type', () => {
      renderWithTheme(<Button>Default</Button>);
      const button = screen.getByText('Default');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should apply className prop', () => {
      renderWithTheme(<Button className="custom-class">Custom</Button>);
      const button = screen.getByText('Custom');
      expect(button).toHaveClass('custom-class');
    });

    it('should be disabled when disabled prop is true', () => {
      renderWithTheme(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toBeDisabled();
    });
  });
});
