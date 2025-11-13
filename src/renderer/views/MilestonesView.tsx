import React, { useEffect, useState } from "react"
import styled from "styled-components"
import type { Milestone } from "../../common/types"

const Container = styled.div`
    max-width: 900px;
    margin: 0 auto;
`

const FormRow = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
`

const Input = styled.input`
    padding: 8px;
    flex: 1;
`

const Button = styled.button`
    padding: 8px 12px;
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

export const MilestonesView: React.FC = () => {
    const [description, setDescription] = useState("")
    const [issueKey, setIssueKey] = useState("")
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [loading, setLoading] = useState(false)

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
            <h2>Milestone Work Completion</h2>
            <p>
                Log milestone work completion entries and optionally link to a
                Jira issue.
            </p>

            <FormRow>
                <Input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                    placeholder="Jira Issue (optional)"
                    value={issueKey}
                    onChange={(e) => setIssueKey(e.target.value)}
                />
                <Button onClick={handleAdd}>Add</Button>
                <Button onClick={handleGenerate} disabled={loading}>
                    Generate PDF
                </Button>
            </FormRow>

            <h3>Last 12 months</h3>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Issue</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {milestones.map((m) => (
                            <tr key={m.id}>
                                <td>
                                    {m.loggedAt.toISOString().split("T")[0]}
                                </td>
                                <td>{m.issueKey || ""}</td>
                                <td>{m.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    )
}

export default MilestonesView
