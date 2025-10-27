import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface VersionInfo {
  version: string;
  isDev: boolean;
  updateAvailable?: boolean;
  latestVersion?: string;
}

export class VersionService {
  private packageJson: any;

  constructor() {
    this.loadPackageJson();
  }

  private loadPackageJson() {
    try {
      // In production, package.json is in the app.asar or resources
      // In development, it's in the project root
      const packagePath = app.isPackaged
        ? path.join(process.resourcesPath, 'package.json')
        : path.join(__dirname, '../../../package.json');
      
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      this.packageJson = JSON.parse(packageContent);
    } catch (error) {
      console.error('Failed to load package.json:', error);
      this.packageJson = { version: 'unknown' };
    }
  }

  getVersionInfo(): VersionInfo {
    return {
      version: this.packageJson.version || 'unknown',
      isDev: !app.isPackaged,
    };
  }

  async checkForUpdates(): Promise<VersionInfo> {
    const versionInfo = this.getVersionInfo();
    
    try {
      // Fetch latest release from GitHub
      const response = await fetch('https://api.github.com/repos/barney-campbell/jira-helper/releases/latest');
      
      if (response.ok) {
        const data = await response.json();
        const latestVersion = data.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
        
        versionInfo.latestVersion = latestVersion;
        versionInfo.updateAvailable = this.compareVersions(versionInfo.version, latestVersion) < 0;
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }

    return versionInfo;
  }

  private compareVersions(current: string, latest: string): number {
    // Simple version comparison (assumes semantic versioning)
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }

    return 0;
  }
}
