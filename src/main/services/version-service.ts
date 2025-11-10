import * as fs from "fs"
import * as path from "path"
import { app } from "electron"
import { autoUpdater } from "electron-updater"
import type { VersionInfo } from "../../common/types"

export class VersionService {
    private packageJson: any

    constructor() {
        this.loadPackageJson()
    }

    private loadPackageJson() {
        try {
            const packagePath = path.join(app.getAppPath(), "package.json")

            const packageContent = fs.readFileSync(packagePath, "utf-8")
            this.packageJson = JSON.parse(packageContent)
        } catch (error) {
            console.error("Failed to load package.json:", error)
            console.error(
                "Attempted path:",
                path.join(app.getAppPath(), "package.json")
            )
            this.packageJson = { version: "unknown" }
        }
    }

    getVersionInfo(): VersionInfo {
        return {
            version: this.packageJson.version || "unknown",
            isDev: !app.isPackaged,
        }
    }

    async checkForUpdates(): Promise<VersionInfo> {
        const versionInfo = this.getVersionInfo()

        try {
            if (!app.isReady()) {
                await app.whenReady()
            }

            if (!app.isPackaged) {
                versionInfo.latestVersion = versionInfo.version
                versionInfo.updateAvailable = false
                return versionInfo
            }

            const result = await autoUpdater.checkForUpdates()

            if (result?.updateInfo?.version) {
                const latestVersion = result.updateInfo.version
                versionInfo.latestVersion = latestVersion
                versionInfo.updateAvailable =
                    this.compareVersions(versionInfo.version, latestVersion) < 0
            } else {
                versionInfo.latestVersion = versionInfo.version
                versionInfo.updateAvailable = false
            }
        } catch (error) {
            console.error("Failed to check for updates:", error)
        }

        return versionInfo
    }

    private compareVersions(current: string, latest: string): number {
        // Extract version numbers before any pre-release identifiers
        const cleanVersion = (v: string) => v.split("-")[0]

        const currentParts = cleanVersion(current)
            .split(".")
            .map((n) => parseInt(n, 10) || 0)
        const latestParts = cleanVersion(latest)
            .split(".")
            .map((n) => parseInt(n, 10) || 0)

        for (
            let i = 0;
            i < Math.max(currentParts.length, latestParts.length);
            i++
        ) {
            const currentPart = currentParts[i] || 0
            const latestPart = latestParts[i] || 0

            if (currentPart < latestPart) return -1
            if (currentPart > latestPart) return 1
        }

        return 0
    }
}
