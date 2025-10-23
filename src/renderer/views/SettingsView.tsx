import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { UserSettings } from '../../common/types';

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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await window.electronAPI.loadSettings();
    if (loaded) {
      setSettings(loaded);
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
    </SettingsContainer>
  );
};
