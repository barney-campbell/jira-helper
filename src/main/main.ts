import { app, BrowserWindow, Menu, dialog, MenuItem, ipcMain } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { autoUpdater } from 'electron-updater';
import { UpdateStatusType, UpdateStatusPayload } from '../common/types';

let mainWindow: BrowserWindow | null = null;
let updateCheckInterval: NodeJS.Timeout | null = null;
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

function broadcastUpdateStatus(payload: UpdateStatusPayload) {
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('version:update-status', payload);
  });
}

async function promptAndInstallUpdate(version?: string) {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? mainWindow ?? BrowserWindow.getAllWindows()[0];

  if (!targetWindow) {
    autoUpdater.quitAndInstall();
    return;
  }

  const { response } = await dialog.showMessageBox(targetWindow, {
    type: 'info',
    buttons: ['Restart now', 'Later'],
    defaultId: 0,
    cancelId: 1,
    title: 'Update ready',
    message: 'A new version of Jira Helper has been downloaded.',
    detail: version ? `Version ${version} will be installed after restart.` : undefined
  });

  if (response === 0) {
    autoUpdater.quitAndInstall();
  }
}

function startAutoUpdater() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    broadcastUpdateStatus({ status: 'checking' });
  });

  autoUpdater.on('update-available', info => {
    broadcastUpdateStatus({ status: 'update-available', version: info.version });
  });

  autoUpdater.on('update-not-available', info => {
    broadcastUpdateStatus({ status: 'update-not-available', version: info.version });
  });

  autoUpdater.on('download-progress', progress => {
    broadcastUpdateStatus({ status: 'download-progress', percent: progress.percent });
  });

  autoUpdater.on('update-downloaded', info => {
    broadcastUpdateStatus({ status: 'update-downloaded', version: info.version });
    promptAndInstallUpdate(info.version).catch(error => {
      console.error('Failed to prompt for update installation:', error);
      autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', error => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Auto updater error:', error);
    broadcastUpdateStatus({ status: 'error', message });
  });

  const checkForUpdates = () => {
    autoUpdater.checkForUpdates().catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to check for updates:', error);
      broadcastUpdateStatus({ status: 'error', message });
    });
  };

  checkForUpdates();
  updateCheckInterval = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);

  app.on('before-quit', () => {
    if (updateCheckInterval) {
      clearInterval(updateCheckInterval);
      updateCheckInterval = null;
    }
  });
}

let canGoBack = false;
let canGoForward = false;

function createMenu() {
  const template: any[] = [
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          enabled: canGoBack,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigation:back');
            }
          },
          id: 'navigate-back'
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          enabled: canGoForward,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigation:forward');
            }
          },
          id: 'navigate-forward'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light',
              click: () => {
                if (mainWindow) {
                  mainWindow.webContents.send('menu:setTheme', 'light');
                }
              }
            },
            {
              label: 'Dark',
              click: () => {
                if (mainWindow) {
                  mainWindow.webContents.send('menu:setTheme', 'dark');
                }
              }
            },
            {
              label: 'System',
              click: () => {
                if (mainWindow) {
                  mainWindow.webContents.send('menu:setTheme', 'system');
                }
              }
            }
          ]
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  // Add standard menus on macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function updateNavigationMenu() {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  const backItem = menu.getMenuItemById('navigate-back');
  const forwardItem = menu.getMenuItemById('navigate-forward');

  if (backItem) {
    backItem.enabled = canGoBack;
  }
  if (forwardItem) {
    forwardItem.enabled = canGoForward;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Jira Helper',
    icon: path.join(__dirname, '../../assets/jira-helper-icon.jpg')
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle mouse back/forward buttons
  mainWindow.on('app-command', (_event, command) => {
    if (command === 'browser-backward' && canGoBack) {
      mainWindow?.webContents.send('navigation:back');
    } else if (command === 'browser-forward' && canGoForward) {
      mainWindow?.webContents.send('navigation:forward');
    }
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMenu();
  createWindow();
  startAutoUpdater();

  // Listen for navigation state updates from renderer
  ipcMain.on('navigation:updateState', (_event, newCanGoBack: boolean, newCanGoForward: boolean) => {
    canGoBack = newCanGoBack;
    canGoForward = newCanGoForward;
    updateNavigationMenu();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
