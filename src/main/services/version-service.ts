import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { VersionInfo } from '../../common/types';

export class VersionService {
  private packageJson: any;

  constructor() {
    this.loadPackageJson();
  }

  private loadPackageJson() {
    try {
      const packagePath = path.join(app.getAppPath(), 'package.json');
      
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      this.packageJson = JSON.parse(packageContent);
    } catch (error) {
      console.error('Failed to load package.json:', error);
      console.error('Attempted path:', path.join(app.getAppPath(), 'package.json'));
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
      // Get repository info from package.json or use default
      const repository = this.packageJson.repository?.url || 
                          this.packageJson.repository || 
                          'https://github.com/barney-campbell/jira-helper';
      
      // Extract owner/repo from repository URL
      const repoMatch = repository.match(/github\.com[\/:](.+?)(?:\.git)?$/);
      if (!repoMatch) {
        console.error('Could not parse repository URL:', repository);
        return versionInfo;
      }
      
      const repoPath = repoMatch[1];
      const apiUrl = `https://api.github.com/repos/${repoPath}/releases/latest`;
      
      // Fetch latest release from GitHub
      const response = await fetch(apiUrl);
      
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
    // Extract version numbers before any pre-release identifiers
    const cleanVersion = (v: string) => v.split('-')[0];
    
    const currentParts = cleanVersion(current).split('.').map(n => parseInt(n, 10) || 0);
    const latestParts = cleanVersion(latest).split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }

    return 0;
  }
}
