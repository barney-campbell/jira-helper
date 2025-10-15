import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { UserSettings } from '../types';
import '../styles/views.css';

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
    <div className="settings-view">
      <h2>Settings</h2>
      <div className="form-group">
        <label>Base URL:</label>
        <Input
          value={settings.baseUrl}
          onChange={(value) => setSettings({ ...settings, baseUrl: value })}
          placeholder="https://your-domain.atlassian.net"
        />
      </div>
      <div className="form-group">
        <label>Email:</label>
        <Input
          type="email"
          value={settings.email}
          onChange={(value) => setSettings({ ...settings, email: value })}
          placeholder="your-email@example.com"
        />
      </div>
      <div className="form-group">
        <label>API Token:</label>
        <Input
          type="password"
          value={settings.apiToken}
          onChange={(value) => setSettings({ ...settings, apiToken: value })}
          placeholder="Your Jira API token"
        />
      </div>
      {message && <div className="message">{message}</div>}
      <div className="button-group">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};
