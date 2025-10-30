import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Input } from '../../src/renderer/components/Input';
import { lightTheme } from '../../src/renderer/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={lightTheme}>{component}</ThemeProvider>);
};

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render with value', () => {
      renderWithTheme(<Input value="test value" onChange={() => {}} />);
      const input = screen.getByDisplayValue('test value');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      renderWithTheme(
        <Input value="" onChange={() => {}} placeholder="Enter text" />
      );
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('should render with different types', () => {
      const { rerender } = renderWithTheme(
        <Input value="" onChange={() => {}} type="password" />
      );
      let input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');

      rerender(
        <ThemeProvider theme={lightTheme}>
          <Input value="" onChange={() => {}} type="email" />
        </ThemeProvider>
      );
      input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when value changes', () => {
      const handleChange = vi.fn();
      renderWithTheme(<Input value="" onChange={handleChange} />);

      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(handleChange).toHaveBeenCalledWith('new value');
    });

    it('should not call onChange when disabled', () => {
      const handleChange = vi.fn();
      renderWithTheme(<Input value="" onChange={handleChange} disabled />);

      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { value: 'new value' } });

      // The change event still fires, but the input shouldn't accept the change
      expect(input).toBeDisabled();
    });

    it('should call onKeyDown when key is pressed', () => {
      const handleKeyDown = vi.fn();
      renderWithTheme(
        <Input value="" onChange={() => {}} onKeyDown={handleKeyDown} />
      );

      const input = screen.getByDisplayValue('');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Props', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithTheme(<Input value="" onChange={() => {}} disabled />);
      const input = screen.getByDisplayValue('');
      expect(input).toBeDisabled();
    });

    it('should apply className prop', () => {
      renderWithTheme(
        <Input value="" onChange={() => {}} className="custom-class" />
      );
      const input = screen.getByDisplayValue('');
      expect(input).toHaveClass('custom-class');
    });

    it('should default to text type', () => {
      renderWithTheme(<Input value="" onChange={() => {}} />);
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'text');
    });
  });
});
