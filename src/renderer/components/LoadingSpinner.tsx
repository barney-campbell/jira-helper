import React from "react"
import styled, { keyframes } from "styled-components"

interface LoadingSpinnerProps {
    size?: "small" | "medium" | "large"
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const SpinnerContainer = styled.div`
    display: inline-block;
`

const SpinnerCircle = styled.div<{ $size: "small" | "medium" | "large" }>`
    border: 3px solid #f3f3f3;
    border-top: 3px solid #0052cc;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;

    ${(props) =>
        props.$size === "small" &&
        `
    width: 16px;
    height: 16px;
    border-width: 2px;
  `}

    ${(props) =>
        props.$size === "medium" &&
        `
    width: 24px;
    height: 24px;
  `}

  ${(props) =>
        props.$size === "large" &&
        `
    width: 40px;
    height: 40px;
    border-width: 4px;
  `}
`

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = "medium",
}) => {
    return (
        <SpinnerContainer>
            <SpinnerCircle $size={size} />
        </SpinnerContainer>
    )
}
