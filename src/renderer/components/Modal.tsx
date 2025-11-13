import React from "react"
import styled from "styled-components"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
}

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`

const ModalContent = styled.div`
    background-color: ${(props) => props.theme.colors.surface};
    border-radius: 8px;
    min-width: 400px;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const ModalHeader = styled.div`
    padding: 20px;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
        margin: 0;
        font-size: 20px;
        color: ${(props) => props.theme.colors.text};
    }
`

const ModalClose = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: ${(props) => props.theme.colors.textSecondary};
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover {
        background-color: ${(props) => props.theme.colors.surfaceHover};
        color: ${(props) => props.theme.colors.text};
    }
`

const ModalBody = styled.div`
    padding: 20px;
    overflow-y: auto;
    color: ${(props) => props.theme.colors.text};
`

const ModalFooter = styled.div`
    padding: 20px;
    border-top: 1px solid ${(props) => props.theme.colors.border};
    display: flex;
    justify-content: flex-end;
    gap: 10px;
`

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
}) => {
    if (!isOpen) return null

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h2>{title}</h2>
                    <ModalClose onClick={onClose}>&times;</ModalClose>
                </ModalHeader>
                <ModalBody>{children}</ModalBody>
                {footer && <ModalFooter>{footer}</ModalFooter>}
            </ModalContent>
        </ModalOverlay>
    )
}
