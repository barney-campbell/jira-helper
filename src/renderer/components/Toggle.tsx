import React from "react";
import styled from "styled-components";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const ToggleContainer = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  user-select: none;
`;

const ToggleSwitch = styled.div<{ $checked: boolean; $disabled: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${(props) =>
    props.$checked ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 12px;
  transition: background-color 0.2s;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${(props) =>
      props.$checked
        ? props.theme.colors.primaryHover
        : props.theme.colors.textSecondary};
  }
`;

const ToggleSlider = styled.div<{ $checked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${(props) => (props.$checked ? "22px" : "2px")};
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const ToggleLabel = styled.span`
  font-size: 14px;
  color: ${(props) => props.theme.colors.text};
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  return (
    <ToggleContainer $disabled={disabled}>
      <HiddenInput
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      {label && <ToggleLabel>{label}</ToggleLabel>}
      <ToggleSwitch $checked={checked} $disabled={disabled}>
        <ToggleSlider $checked={checked} />
      </ToggleSwitch>
    </ToggleContainer>
  );
};
