import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { UserSettings, VersionInfo, ThemeMode } from '../../common/types';

const SettingsContainer = styled.div`
  max-width: 600px;
  background-color: ${props => props.theme.colors.surface};
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin-bottom: 25px;
    color: ${props => props.theme.colors.text};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
  }
`;

const Message = styled.div`
  padding: 10px;
  margin: 15px 0;
  background-color: ${props => props.theme.colors.success};
  border: 1px solid ${props => props.theme.colors.successBorder};
  border-radius: 4px;
  color: ${props => props.theme.colors.successText};
`;

const UpdateMessage = styled.div`
  padding: 10px;
  margin: 15px 0;
  background-color: ${props => props.theme.colors.info};
  border: 1px solid ${props => props.theme.colors.infoBorder};
  border-radius: 4px;
  color: ${props => props.theme.colors.infoText};
`;

const VersionContainer = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid ${props => props.theme.colors.border};

  h3 {
    margin-bottom: 15px;
    font-size: 16px;
    color: ${props => props.theme.colors.text};
  }
`;

const VersionText = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 5px;

  strong {
    color: ${props => props.theme.colors.text};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const ThemeToggle = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ThemeButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 4px;
  background-color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

interface SettingsViewProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange }) => {
  const [settings, setSettings] = useState<UserSettings>({
    id: 1,
    baseUrl: '',
    email: '',
    apiToken: '',
    theme: 'light'
  });
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    loadSettings();
    loadVersionInfo();
  }, []);

  const loadSettings = async () => {
    const loaded = await window.electronAPI.loadSettings();
    if (loaded) {
      setSettings(loaded);
    }
  };

  const loadVersionInfo = async () => {
    const info = await window.electronAPI.getVersionInfo();
    setVersionInfo(info);
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const info = await window.electronAPI.checkForUpdates();
      setVersionInfo(info);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleThemeToggle = (theme: ThemeMode) => {
    onThemeChange(theme);
  };

  return (
    <SettingsContainer>
      <h2>Settings</h2>
      <FormGroup>
        <label>Base URL:</label>
        <Input
          value={settings.baseUrl}
          onChange={(value) => setSettings({ ...settings, baseUrl: value })}
          placeholder="https://your-domain.atlassian.net"
        />
      </FormGroup>
      <FormGroup>
        <label>Email:</label>
        <Input
          type="email"
          value={settings.email}
          onChange={(value) => setSettings({ ...settings, email: value })}
          placeholder="your-email@example.com"
        />
      </FormGroup>
      <FormGroup>
        <label>API Token:</label>
        <Input
          type="password"
          value={settings.apiToken}
          onChange={(value) => setSettings({ ...settings, apiToken: value })}
          placeholder="Your Jira API token"
        />
      </FormGroup>
      <FormGroup>
        <label>Theme:</label>
        <ThemeToggle>
          <ThemeButton 
            $active={currentTheme === 'light'} 
            onClick={() => handleThemeToggle('light')}
          >
            ☀️ Light
          </ThemeButton>
          <ThemeButton 
            $active={currentTheme === 'dark'} 
            onClick={() => handleThemeToggle('dark')}
          >
            🌙 Dark
          </ThemeButton>
        </ThemeToggle>
      </FormGroup>

      <VersionContainer>
        <h3>Version Information</h3>
        {versionInfo && (
          <>
            <VersionText>
              <strong>Version:</strong> {versionInfo.version}
              {versionInfo.isDev && ' (Development Build)'}
            </VersionText>
            {versionInfo.latestVersion && (
              <VersionText>
                <strong>Latest Version:</strong> {versionInfo.latestVersion}
              </VersionText>
            )}
            {versionInfo.updateAvailable && (
              <UpdateMessage>
                A new version ({versionInfo.latestVersion}) is available!
              </UpdateMessage>
            )}
            <ButtonGroup>
              <Button onClick={handleCheckForUpdates} disabled={checkingUpdates}>
                {checkingUpdates ? 'Checking...' : 'Check for Updates'}
              </Button>
            </ButtonGroup>
          </>
        )}
      </VersionContainer>
    </SettingsContainer>
  );
};
