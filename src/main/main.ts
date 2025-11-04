import { app, BrowserWindow, Menu, MenuItem, ipcMain } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;
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
    title: 'Jira Helper'
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
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMenu();
  createWindow();

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
