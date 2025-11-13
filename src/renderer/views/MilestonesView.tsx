import React, { useEffect, useState } from "react"
import styled, { keyframes } from "styled-components"
import { Button as PrimaryButton } from "../components/Button"
import { Modal } from "../components/Modal"
import { Input as TextInput } from "../components/Input"
import type { Milestone } from "../../common/types"
import { DataGrid, Column } from "../components/DataGrid"

const Container = styled.div`
    width: 100%;
    margin: 0;
    background-color: ${(p) => p.theme.colors.surface};
    padding: 24px;
    border-radius: 8px;
    border: 1px solid ${(p) => p.theme.colors.border};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

    h2 {
        color: ${(p) => p.theme.colors.text};
        margin-bottom: 8px;
    }

    p {
        color: ${(p) => p.theme.colors.textSecondary};
        margin-bottom: 16px;
    }
`

const FormRow = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
`

const Input = styled.input`
    padding: 8px;
    flex: 1;
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: 4px;
    background-color: ${(p) => p.theme.colors.surface};
    color: ${(p) => p.theme.colors.text};
`

// local button wrapper to control spacing when using the shared Button
const ButtonWrapper = styled.div`
    display: inline-flex;
    align-items: center;
`

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    th,
    td {
        padding: 8px;
        border: 1px solid #ddd;
    }
    th {
        background: ${(p) => p.theme.colors.surface};
    }
`

const DateInput = styled.input`
    padding: 8px 12px;
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: 4px;
    background-color: ${(p) => p.theme.colors.surface};
    color: ${(p) => p.theme.colors.text};
    width: 200px;

    &:focus {
        outline: none;
        border-color: ${(p) => p.theme.colors.primary};
        box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary}33;
    }
`

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`

const LoadingOverlay = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 0;
`

const Spinner = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 4px solid ${(p) => p.theme.colors.border};
    border-top-color: ${(p) => p.theme.colors.primary};
    animation: ${spin} 1s linear infinite;
    margin-right: 12px;
`

const LoadingText = styled.div`
    color: ${(p) => p.theme.colors.textSecondary};
`

export const MilestonesView: React.FC = () => {
    const [description, setDescription] = useState("")
    const [issueKey, setIssueKey] = useState("")
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [loading, setLoading] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editing, setEditing] = useState<Milestone | null>(null)
    const [editDescription, setEditDescription] = useState("")
    const [editIssueKey, setEditIssueKey] = useState("")
    const [editDate, setEditDate] = useState("")

    const columns: Column<Milestone>[] = [
        {
            header: "Date",
            accessor: (row) =>
                row.loggedAt instanceof Date
                    ? row.loggedAt.toISOString().split("T")[0]
                    : new Date(row.loggedAt).toISOString().split("T")[0],
            width: "160px",
            sortable: true,
        },
        { header: "Issue", accessor: "issueKey", width: "160px" },
        { header: "Description", accessor: "description" },
        {
            header: "Action",
            accessor: (row) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <PrimaryButton
                        variant="danger"
                        onClick={() => {
                            void deleteRow(row)
                        }}
                    >
                        Delete
                    </PrimaryButton>
                </div>
            ),
            width: "100px",
            sortable: false,
        },
    ]

    const load = async () => {
        setLoading(true)
        try {
            const items = await window.electronAPI.getLast12MonthsMilestones()
            // convert loggedAt strings to Date objects if necessary
            const converted = items.map((it: any) => ({
                ...it,
                loggedAt: new Date(it.loggedAt),
            }))
            setMilestones(converted)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const openEditModal = (row: Milestone) => {
        setEditing(row)
        setEditDescription(row.description)
        setEditIssueKey(row.issueKey || "")
        const isoDate =
            row.loggedAt instanceof Date
                ? row.loggedAt.toISOString().split("T")[0]
                : new Date(row.loggedAt).toISOString().split("T")[0]
        setEditDate(isoDate)
        setEditModalOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editing) return
        const loggedAtIso = new Date(editDate + "T00:00:00").toISOString()
        const updated = await window.electronAPI.updateMilestone(
            editing.id,
            editDescription.trim(),
            editIssueKey || undefined,
            loggedAtIso
        )
        setMilestones((prev) =>
            prev.map((m) =>
                m.id === updated.id
                    ? { ...updated, loggedAt: new Date(updated.loggedAt) }
                    : m
            )
        )
        setEditModalOpen(false)
        setEditing(null)
    }

    const deleteRow = async (row: Milestone) => {
        const ok = window.confirm(
            "Are you sure you want to delete this milestone?"
        )
        if (!ok) return
        const res = await window.electronAPI.deleteMilestone(row.id)
        if (res && res.success) {
            setMilestones((prev) => prev.filter((m) => m.id !== row.id))
        } else {
            alert("Failed to delete milestone")
        }
    }

    const handleAdd = async () => {
        if (!description.trim()) return
        const added = await window.electronAPI.addMilestone(
            description.trim(),
            issueKey || undefined
        )
        setDescription("")
        setIssueKey("")
        // Prepend to list
        setMilestones((s) => [
            { ...added, loggedAt: new Date(added.loggedAt) },
            ...s,
        ])
    }

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await window.electronAPI.generateMilestonesPdf()
            if (res && res.path) {
                // Open the file externally
                await window.electronAPI.openExternal(`file://${res.path}`)
            }
        } finally {
            setLoading(false)
        }
    }
    return (
        <Container>
            <h2>Milestones</h2>
            <p>
                Log milestone work completion and generate a printable report.
            </p>

            <FormRow>
                <Input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                    placeholder="Jira issue (optional)"
                    value={issueKey}
                    onChange={(e) => setIssueKey(e.target.value)}
                />
                <ButtonWrapper>
                    <PrimaryButton onClick={handleAdd}>Add</PrimaryButton>
                </ButtonWrapper>
                <ButtonWrapper style={{ marginLeft: 8 }}>
                    <PrimaryButton onClick={handleGenerate} disabled={loading}>
                        Generate PDF
                    </PrimaryButton>
                </ButtonWrapper>
            </FormRow>

            {loading ? (
                <LoadingOverlay>
                    <Spinner aria-hidden="true" />
                    <LoadingText>Loading milestones…</LoadingText>
                </LoadingOverlay>
            ) : (
                <>
                    <h3>Last 12 months</h3>
                    <DataGrid
                        columns={columns}
                        data={milestones}
                        onRowDoubleClick={(row) => openEditModal(row)}
                    />
                </>
            )}

            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title={editing ? "Edit Milestone" : "Edit Milestone"}
                footer={
                    <div style={{ display: "flex", gap: 8 }}>
                        <PrimaryButton
                            variant="secondary"
                            onClick={() => setEditModalOpen(false)}
                        >
                            Cancel
                        </PrimaryButton>
                        <PrimaryButton
                            variant="primary"
                            onClick={handleSaveEdit}
                        >
                            Save
                        </PrimaryButton>
                    </div>
                }
            >
                <div style={{ display: "grid", gap: 12 }}>
                    <label style={{ color: "inherit" }}>Description</label>
                    <TextInput
                        value={editDescription}
                        onChange={setEditDescription}
                    />

                    <label style={{ color: "inherit" }}>
                        Jira Issue (optional)
                    </label>
                    <TextInput
                        value={editIssueKey}
                        onChange={setEditIssueKey}
                    />

                    <label style={{ color: "inherit" }}>Date</label>
                    <DateInput
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                    />
                </div>
            </Modal>
        </Container>
    )
}

export default MilestonesView
