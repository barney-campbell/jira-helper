import React from "react"
import styled from "styled-components"

interface ButtonProps {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    variant?: "primary" | "secondary" | "danger"
    type?: "button" | "submit"
    className?: string
}

const StyledButton = styled.button<{
    $variant: "primary" | "secondary" | "danger"
}>`
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    outline: none;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    ${(props) =>
        props.$variant === "primary" &&
        `
    background-color: ${props.theme.colors.primary};
    color: white;

    &:hover:not(:disabled) {
      background-color: ${props.theme.colors.primaryHover};
    }
  `}

    ${(props) =>
        props.$variant === "secondary" &&
        `
    background-color: ${props.theme.colors.secondary};
    color: white;

    &:hover:not(:disabled) {
      background-color: ${props.theme.colors.secondaryHover};
    }
  `}

  ${(props) =>
        props.$variant === "danger" &&
        `
    background-color: ${props.theme.colors.danger};
    color: white;

    &:hover:not(:disabled) {
      background-color: ${props.theme.colors.dangerHover};
    }
  `}
`

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    disabled = false,
    variant = "primary",
    type = "button",
    className = "",
}) => {
    return (
        <StyledButton
            type={type}
            $variant={variant}
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {children}
        </StyledButton>
    )
}
