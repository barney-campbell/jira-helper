import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { Button } from "./Button"
import { Modal } from "./Modal"
import { LoadingSpinner } from "./LoadingSpinner"

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 360px;
    overflow: auto;
`

const Item = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: ${(p) => p.theme.colors.surface};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: 4px;
`

const Meta = styled.div`
    display: flex;
    flex-direction: column;
`

const Name = styled.div`
    color: ${(p) => p.theme.colors.text};
    font-weight: 600;
`

const Created = styled.div`
    color: ${(p) => p.theme.colors.textSecondary};
    font-size: 12px;
`

interface ExportFile {
    name: string
    path: string
    createdAt: string
}

interface ExportManagerProps {
    isOpen: boolean
    onClose: () => void
}

export const ExportManager: React.FC<ExportManagerProps> = ({
    isOpen,
    onClose,
}) => {
    const [files, setFiles] = useState<ExportFile[]>([])
    const [loading, setLoading] = useState(false)

    const load = async () => {
        try {
            setLoading(true)
            const items = await window.electronAPI.listMilestonePdfs()
            setFiles(items || [])
        } catch (error) {
            console.error("Failed to load exports:", error)
            setFiles([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) load()
    }, [isOpen])

    const handleOpen = async (file: ExportFile) => {
        try {
            await window.electronAPI.openExternal(`file://${file.path}`)
        } catch (error) {
            console.error("Failed to open exported file:", error)
        }
    }

    const handleDelete = async (file: ExportFile) => {
        if (!confirm(`Delete ${file.name}?`)) return
        try {
            const res = await window.electronAPI.deleteExportedFile(file.path)
            if (res && res.success) {
                setFiles((prev) => prev.filter((f) => f.path !== file.path))
            } else {
                alert("Failed to delete file")
            }
        } catch (error) {
            console.error("Failed to delete file:", error)
            alert("Failed to delete file")
        }
    }

    const footer = (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Close</Button>
        </div>
    )

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Exports" footer={footer}>
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                    <LoadingSpinner size="large" />
                </div>
            ) : (
                <>
                    {files.length === 0 ? (
                        <div style={{ padding: 24, color: "var(--text-secondary)" }}>No exported milestone PDFs found.</div>
                    ) : (
                        <List>
                            {files.map((f) => (
                                <Item key={f.path}>
                                    <Meta>
                                        <Name>{f.name}</Name>
                                        <Created>{new Date(f.createdAt).toLocaleString()}</Created>
                                    </Meta>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Button onClick={() => handleOpen(f)}>Open</Button>
                                        <Button variant="danger" onClick={() => handleDelete(f)}>Delete</Button>
                                    </div>
                                </Item>
                            ))}
                        </List>
                    )}
                </>
            )}
        </Modal>
    )
}

export default ExportManager
