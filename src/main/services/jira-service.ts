import type {
    UserSettings,
    JiraIssue,
    JiraWorklog,
    JiraTextBlock,
    JiraComment,
} from "../../common/types"

export class JiraService {
    private baseUrl: string
    private email: string
    private apiToken: string
    private authHeader: string

    constructor(settings: UserSettings) {
        this.baseUrl = settings.baseUrl
        this.email = settings.email
        this.apiToken = settings.apiToken
        this.authHeader =
            "Basic " +
            Buffer.from(`${this.email}:${this.apiToken}`).toString("base64")
    }

    getBaseUrl(): string {
        return this.baseUrl
    }

    async getAssignedIssues(user: string): Promise<JiraIssue[]> {
        try {
            const jql = `assignee=${user} ORDER BY Updated`
            const url = `${this.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=key,summary,status,assignee,project`

            const response = await fetch(url, {
                headers: {
                    Authorization: this.authHeader,
                    Accept: "application/json",
                },
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(
                    `HTTP error: ${response.status}\nResponse: ${text}`
                )
            }

            const data = await response.json()
            const issues: JiraIssue[] = []

            for (const issue of data.issues) {
                const fields = issue.fields
                let assignee = ""
                if (fields.assignee && fields.assignee.displayName) {
                    assignee = fields.assignee.displayName
                }

                issues.push({
                    id: issue.id,
                    key: issue.key,
                    summary: fields.summary || "",
                    status: fields.status?.name || "",
                    assignee: assignee,
                    project: fields.project?.name || "",
                })
            }

            return issues
        } catch (error) {
            console.error("Error in getAssignedIssues:", error)
            return []
        }
    }

    async getIssue(key: string): Promise<JiraIssue> {
        const url = `${this.baseUrl}/rest/api/3/issue/${key}?fields=key,summary,status,assignee,description,comment,project,parent`

        const response = await fetch(url, {
            headers: {
                Authorization: this.authHeader,
                Accept: "application/json",
            },
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`HTTP error: ${response.status}\nResponse: ${text}`)
        }

        const data = await response.json()
        const fields = data.fields

        let assignee = ""
        if (fields.assignee && fields.assignee.displayName) {
            assignee = fields.assignee.displayName
        }

        const descriptionBlocks = this.parseDescriptionBlocks(
            fields.description
        )
        const comments = this.parseComments(fields.comment)

        // Parse parent issue if it exists (subtasks have parent issues)
        let parent
        if (fields.parent) {
            // The parent object contains key and nested fields.summary
            parent = {
                key: fields.parent.key,
                summary: fields.parent.fields?.summary || "",
            }
        }

        return {
            id: data.id,
            key: data.key,
            summary: fields.summary || "",
            status: fields.status?.name || "",
            assignee: assignee,
            project: fields.project?.name || "",
            parent: parent,
            descriptionBlocks: descriptionBlocks,
            comments: comments,
        }
    }

    async getIssueSummaries(
        issueKeys: string[]
    ): Promise<Record<string, string>> {
        if (issueKeys.length === 0) {
            return {}
        }

        try {
            // Validate issue keys to prevent injection attacks
            // Jira issue keys follow the pattern: PROJECT-123
            // Project keys can contain uppercase letters, numbers, and underscores
            const issueKeyPattern = /^[A-Z0-9_]+-[0-9]+$/i
            const validIssueKeys = issueKeys.filter((key) =>
                issueKeyPattern.test(key)
            )

            if (validIssueKeys.length === 0) {
                return {}
            }

            // Create a JQL query to fetch all issues at once
            // Wrap each key in quotes for safety
            const quotedKeys = validIssueKeys.map((key) => `"${key}"`).join(",")
            const jql = `key in (${quotedKeys})`
            const url = `${this.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=key,summary`

            const response = await fetch(url, {
                headers: {
                    Authorization: this.authHeader,
                    Accept: "application/json",
                },
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(
                    `HTTP error: ${response.status}\nResponse: ${text}`
                )
            }

            const data = await response.json()
            const summaries: Record<string, string> = {}

            for (const issue of data.issues) {
                summaries[issue.key] = issue.fields.summary || ""
            }

            return summaries
        } catch (error) {
            console.error("Error in getIssueSummaries:", error)
            return {}
        }
    }

    async searchIssues(jql: string): Promise<JiraIssue[]> {
        try {
            const url = `${this.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=key,summary,status,assignee,project`

            const response = await fetch(url, {
                headers: {
                    Authorization: this.authHeader,
                    Accept: "application/json",
                },
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(
                    `HTTP error: ${response.status}\nResponse: ${text}`
                )
            }

            const data = await response.json()
            const issues: JiraIssue[] = []

            for (const issue of data.issues) {
                const fields = issue.fields
                let assignee = ""
                if (fields.assignee && fields.assignee.displayName) {
                    assignee = fields.assignee.displayName
                }

                issues.push({
                    id: issue.id,
                    key: issue.key,
                    summary: fields.summary || "",
                    status: fields.status?.name || "",
                    assignee: assignee,
                    project: fields.project?.name || "",
                })
            }

            return issues
        } catch (error) {
            console.error("Error in searchIssues:", error)
            return []
        }
    }

    async getWorklogs(issueKey: string): Promise<JiraWorklog[]> {
        const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}/worklog`

        const response = await fetch(url, {
            headers: {
                Authorization: this.authHeader,
                Accept: "application/json",
            },
        })

        if (!response.ok) {
            return []
        }

        const data = await response.json()
        const worklogs: JiraWorklog[] = []

        for (const worklog of data.worklogs || []) {
            worklogs.push({
                author: worklog.author?.displayName || "Unknown",
                started: new Date(worklog.started),
                timeSpentSeconds: worklog.timeSpentSeconds,
            })
        }

        return worklogs
    }

    async uploadTimeTracking(
        issueKey: string,
        timeSpentSeconds: number,
        started?: Date
    ): Promise<void> {
        const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}/worklog`

        let body: any = { timeSpentSeconds }

        if (started) {
            const startedStr = started
                .toISOString()
                .replace(/\.\d{3}Z$/, ".000+0000")
            body.started = startedStr
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: this.authHeader,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(
                `Failed to upload time tracking: ${response.status} ${text}`
            )
        }
    }

    private parseDescriptionBlocks(description: any): JiraTextBlock[] {
        const blocks: JiraTextBlock[] = []

        if (!description || !description.content) {
            return blocks
        }

        for (const block of description.content) {
            const type = block.type

            if (type === "paragraph") {
                let text = ""
                if (block.content) {
                    for (const item of block.content) {
                        if (item.text) {
                            text += item.text
                        }
                    }
                }
                blocks.push({ text, isCode: false })
            } else if (type === "codeBlock") {
                let text = ""
                if (block.content) {
                    for (const item of block.content) {
                        if (item.text) {
                            text += item.text
                        }
                    }
                }
                blocks.push({ text, isCode: true })
            } else if (type === "bulletList" && block.content) {
                for (const listItem of block.content) {
                    if (listItem.content) {
                        for (const para of listItem.content) {
                            if (para.content) {
                                let text = "• "
                                for (const item of para.content) {
                                    if (item.text) {
                                        text += item.text
                                    }
                                }
                                blocks.push({ text, isCode: false })
                            }
                        }
                    }
                }
            }
        }

        return blocks
    }

    private parseComments(commentData: any): JiraComment[] {
        const comments: JiraComment[] = []

        if (!commentData || !commentData.comments) {
            return comments
        }

        for (const comment of commentData.comments) {
            const bodyBlocks = this.parseDescriptionBlocks(comment.body)

            comments.push({
                author: comment.author?.displayName || "Unknown",
                bodyBlocks: bodyBlocks,
                created: new Date(comment.created),
                updated: comment.updated
                    ? new Date(comment.updated)
                    : undefined,
            })
        }

        return comments
    }
}
