import React, { useState, useEffect, useMemo } from "react"
import { ipc } from "../ipc"
import styled from "styled-components"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { LogViewer } from "../components/LogViewer"
import type {
    UserSettings,
    VersionInfo,
    ThemeMode,
    UpdateStatusPayload,
} from "../../common/types"

const SettingsContainer = styled.div`
    background-color: ${(props) => props.theme.colors.surface};
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h2 {
        margin-bottom: 25px;
        color: ${(props) => props.theme.colors.text};
    }
`

const FormGroup = styled.div`
    margin-bottom: 20px;

    label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: ${(props) => props.theme.colors.text};
    }
`

const Message = styled.div`
    padding: 10px;
    margin: 15px 0;
    background-color: ${(props) => props.theme.colors.success};
    border: 1px solid ${(props) => props.theme.colors.successBorder};
    border-radius: 4px;
    color: ${(props) => props.theme.colors.successText};
`

const UpdateMessage = styled.div`
    padding: 10px;
    margin: 15px 0;
    background-color: ${(props) => props.theme.colors.info};
    border: 1px solid ${(props) => props.theme.colors.infoBorder};
    border-radius: 4px;
    color: ${(props) => props.theme.colors.infoText};
`

const VersionContainer = styled.div`
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid ${(props) => props.theme.colors.border};

    h3 {
        margin-bottom: 15px;
        font-size: 16px;
        color: ${(props) => props.theme.colors.text};
    }
`

const VersionText = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.textSecondary};
    margin-bottom: 5px;

    strong {
        color: ${(props) => props.theme.colors.text};
    }
`

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-top: 20px;
`

const ThemeToggle = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
`

const ThemeButton = styled.button<{ $active: boolean }>`
    padding: 8px 16px;
    border: 2px solid
        ${(props) =>
            props.$active
                ? props.theme.colors.primary
                : props.theme.colors.border};
    border-radius: 4px;
    background-color: ${(props) =>
        props.$active
            ? props.theme.colors.primary
            : props.theme.colors.surface};
    color: ${(props) => (props.$active ? "white" : props.theme.colors.text)};
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
        border-color: ${(props) => props.theme.colors.primary};
    }
`

const PageContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    height: calc(100vh - 40px);
`

const LeftColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
`

const RightColumn = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
`

const LogViewerContainer = styled.div`
    background-color: ${(props) => props.theme.colors.surface};
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    height: 100%;

    h2 {
        margin-bottom: 25px;
        color: ${(props) => props.theme.colors.text};
    }
`

const StatusBanner = styled.div<{ $variant: "info" | "error" }>`
    padding: 10px;
    margin: 15px 0;
    border-radius: 4px;
    background-color: ${(props) =>
        props.$variant === "error"
            ? props.theme.colors.danger
            : props.theme.colors.info};
    border: 1px solid
        ${(props) =>
            props.$variant === "error"
                ? props.theme.colors.dangerHover
                : props.theme.colors.infoBorder};
    color: ${(props) =>
        props.$variant === "error" ? "#ffffff" : props.theme.colors.infoText};
    font-size: 14px;
`

interface SettingsViewProps {
    currentTheme: ThemeMode
    onThemeChange: (theme: ThemeMode) => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    currentTheme,
    onThemeChange,
}) => {
    const [settings, setSettings] = useState<UserSettings>({
        id: 1,
        baseUrl: "",
        email: "",
        apiToken: "",
        theme: "light",
    })
    const [message, setMessage] = useState("")
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
    const [checkingUpdates, setCheckingUpdates] = useState(false)
    const [updateStatus, setUpdateStatus] =
        useState<UpdateStatusPayload | null>(null)

    useEffect(() => {
        loadSettings()
        loadVersionInfo()

        const unsubscribe = ipc.onUpdateStatus((payload) => {
            setUpdateStatus(payload)

            setVersionInfo((prev) => {
                if (!prev) {
                    return prev
                }

                if (payload.status === "update-available") {
                    return {
                        ...prev,
                        latestVersion: payload.version ?? prev.latestVersion,
                        updateAvailable: true,
                    }
                }

                if (payload.status === "update-not-available") {
                    return {
                        ...prev,
                        latestVersion: payload.version ?? prev.latestVersion,
                        updateAvailable: false,
                    }
                }

                if (payload.status === "update-downloaded") {
                    return {
                        ...prev,
                        latestVersion: payload.version ?? prev.latestVersion,
                        updateAvailable: false,
                    }
                }

                return prev
            })
        })

        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe()
            }
        }
    }, [])

    const loadSettings = async () => {
        const loaded = await ipc.loadSettings()
        if (loaded) {
            setSettings(loaded)
        }
    }

    const loadVersionInfo = async () => {
        const info = await ipc.getVersionInfo()
        setVersionInfo(info)
    }

    const handleCheckForUpdates = async () => {
        setCheckingUpdates(true)
        setUpdateStatus({ status: "checking" })
        try {
            const info = await ipc.checkForUpdates()
            setVersionInfo(info)

            if (info.updateAvailable) {
                setUpdateStatus({
                    status: "update-available",
                    version: info.latestVersion,
                })
            } else {
                setUpdateStatus({
                    status: "update-not-available",
                    version: info.version,
                })
            }
        } finally {
            setCheckingUpdates(false)
        }
    }

    const handleSave = async () => {
        try {
            await ipc.saveSettings(settings)
            setMessage("Settings saved successfully!")
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            setMessage("Error saving settings")
        }
    }

    const handleThemeToggle = (theme: ThemeMode) => {
        onThemeChange(theme)
    }

    const updateStatusMessage = useMemo(() => {
        if (!updateStatus) {
            return null
        }

        const versionLabel =
            updateStatus.version ??
            versionInfo?.latestVersion ??
            versionInfo?.version

        switch (updateStatus.status) {
            case "checking":
                return "Checking for updates…"
            case "update-available":
                return versionLabel
                    ? `Update ${versionLabel} is available. Downloading now…`
                    : "An update is available. Downloading now…"
            case "download-progress":
                return `Downloading update… ${updateStatus.percent ? updateStatus.percent.toFixed(1) : 0}%`
            case "update-downloaded":
                return versionLabel
                    ? `Update ${versionLabel} has been downloaded. Restart the app to install.`
                    : "An update has been downloaded. Restart the app to install."
            case "update-not-available":
                return versionLabel
                    ? `You're up to date (version ${versionLabel}).`
                    : `You're up to date.`
            case "error":
                return updateStatus.message
                    ? `Update check failed: ${updateStatus.message}`
                    : "Update check failed. Please try again later."
            default:
                return null
        }
    }, [updateStatus, versionInfo])

    return (
        <PageContainer>
            <LeftColumn>
                <SettingsContainer>
                    <h2>Settings</h2>
                    <FormGroup>
                        <label>Base URL:</label>
                        <Input
                            value={settings.baseUrl}
                            onChange={(value) =>
                                setSettings({ ...settings, baseUrl: value })
                            }
                            placeholder="https://your-domain.atlassian.net"
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>Email:</label>
                        <Input
                            type="email"
                            value={settings.email}
                            onChange={(value) =>
                                setSettings({ ...settings, email: value })
                            }
                            placeholder="your-email@example.com"
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>API Token:</label>
                        <Input
                            type="password"
                            value={settings.apiToken}
                            onChange={(value) =>
                                setSettings({ ...settings, apiToken: value })
                            }
                            placeholder="Your Jira API token"
                        />
                    </FormGroup>
                    <ButtonGroup>
                        <Button onClick={handleSave}>Save</Button>
                    </ButtonGroup>
                    {message && <Message>{message}</Message>}

                    <VersionContainer>
                        <h3>Version Information</h3>
                        {versionInfo && (
                            <>
                                <VersionText>
                                    <strong>Version:</strong>{" "}
                                    {versionInfo.version}
                                    {versionInfo.isDev &&
                                        " (Development Build)"}
                                </VersionText>
                                {versionInfo.latestVersion && (
                                    <VersionText>
                                        <strong>Latest Version:</strong>{" "}
                                        {versionInfo.latestVersion}
                                    </VersionText>
                                )}
                                {updateStatusMessage && (
                                    <StatusBanner
                                        $variant={
                                            updateStatus?.status === "error"
                                                ? "error"
                                                : "info"
                                        }
                                    >
                                        {updateStatusMessage}
                                    </StatusBanner>
                                )}
                                {versionInfo.updateAvailable && (
                                    <UpdateMessage>
                                        A new version (
                                        {versionInfo.latestVersion}) is
                                        available!
                                    </UpdateMessage>
                                )}
                                <ButtonGroup>
                                    <Button
                                        onClick={handleCheckForUpdates}
                                        disabled={checkingUpdates}
                                    >
                                        {checkingUpdates
                                            ? "Checking..."
                                            : "Check for Updates"}
                                    </Button>
                                </ButtonGroup>
                            </>
                        )}
                    </VersionContainer>
                </SettingsContainer>

                <SettingsContainer>
                    <h3>Theme</h3>
                    <FormGroup>
                        <ThemeToggle>
                            <ThemeButton
                                $active={currentTheme === "light"}
                                onClick={() => handleThemeToggle("light")}
                            >
                                ☀️ Light
                            </ThemeButton>
                            <ThemeButton
                                $active={currentTheme === "dark"}
                                onClick={() => handleThemeToggle("dark")}
                            >
                                🌙 Dark
                            </ThemeButton>
                            <ThemeButton
                                $active={currentTheme === "system"}
                                onClick={() => handleThemeToggle("system")}
                            >
                                💻 System
                            </ThemeButton>
                        </ThemeToggle>
                    </FormGroup>
                </SettingsContainer>
            </LeftColumn>

            <RightColumn>
                <LogViewerContainer>
                    <h2>Logs</h2>
                    <LogViewer />
                </LogViewerContainer>
            </RightColumn>
        </PageContainer>
    )
}
