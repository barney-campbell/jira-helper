import React from "react";
import styled from "styled-components";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "email" | "datetime-local";
  disabled?: boolean;
  className?: string;
  step?: number | string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const StyledInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${(props) => props.theme.colors.primary}33;
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.surfaceHover};
    cursor: not-allowed;
  }
`;

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  className = "",
  onKeyDown,
  step,
}) => {
  return (
    <StyledInput
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={className}
      step={step}
    />
  );
};
