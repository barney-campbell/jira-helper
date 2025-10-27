import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { UserSettings, VersionInfo } from '../../common/types';

const SettingsContainer = styled.div`
  max-width: 600px;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin-bottom: 25px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }
`;

const Message = styled.div`
  padding: 10px;
  margin: 15px 0;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
`;

const UpdateMessage = styled.div`
  padding: 10px;
  margin: 15px 0;
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 4px;
  color: #0c5460;
`;

const VersionContainer = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;

  h3 {
    margin-bottom: 15px;
    font-size: 16px;
  }
`;

const VersionText = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;

  strong {
    color: #333;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

interface SettingsViewProps {
  onSave: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSave }) => {
  const [settings, setSettings] = useState<UserSettings>({
    id: 1,
    baseUrl: '',
    email: '',
    apiToken: ''
  });
  const [message, setMessage] = useState('');
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

  const handleSave = async () => {
    try {
      await window.electronAPI.saveSettings(settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      onSave();
    } catch (error) {
      setMessage('Error saving settings');
    }
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
      {message && <Message>{message}</Message>}
      <ButtonGroup>
        <Button onClick={handleSave}>Save</Button>
      </ButtonGroup>

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
