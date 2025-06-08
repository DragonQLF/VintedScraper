const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const axios = require('axios');
const https = require('https');
const http = require('http');

let mainWindow;
let tray;
let isScraperRunning = false;
let lastError = null;
let statusCheckInterval = null;
let statusStream = null;

// Function to update tray tooltip and icon
const updateTrayStatus = () => {
  const status = isScraperRunning ? 'Running' : 'Stopped';
  const error = lastError ? `\nLast Error: ${lastError}` : '';
  tray.setToolTip(`Vinted Tracker\nStatus: ${status}${error}`);
  
  // Update icon based on status
  let iconName;
  if (isScraperRunning) {
    iconName = 'icon-running.png'; // Running state
  } else if (lastError) {
    iconName = 'icon-idle.png';    // Error/Idle state
  } else {
    iconName = 'icon-completed.png'; // Completed/Ready state
  }
  
  const iconPath = path.join(__dirname, '../../assets', iconName);
  tray.setImage(iconPath);
};

// Function to connect to status stream
const connectToStatusStream = async () => {
  try {
    const token = await mainWindow.webContents.executeJavaScript(`
      (async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No token found');
          }
          return token;
        } catch (error) {
          console.error('Error getting token:', error);
          throw error;
        }
      })()
    `);

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Close existing connection if any
    if (statusStream) {
      statusStream.destroy();
      statusStream = null;
    }

    // Create HTTP request
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/scraper/status/stream',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
        
        // Process complete events
        const events = data.split('\n\n');
        data = events.pop() || ''; // Keep the last incomplete event
        
        for (const event of events) {
          if (event.startsWith('data: ')) {
            try {
              const status = JSON.parse(event.slice(6));
              isScraperRunning = status.status === 'running';
              lastError = status.lastError;
              updateTrayStatus();
              mainWindow.webContents.send('scraper-status', { running: isScraperRunning });
            } catch (error) {
              console.error('Error parsing status update:', error);
            }
          }
        }
      });

      res.on('end', () => {
        console.log('Status stream ended');
        lastError = 'Lost connection to status stream';
        updateTrayStatus();
        // Try to reconnect after a delay
        setTimeout(connectToStatusStream, 5000);
      });
    });

    req.on('error', (error) => {
      console.error('Status stream error:', error);
      lastError = handleNetworkError(error);
      updateTrayStatus();
      // Try to reconnect after a delay
      setTimeout(connectToStatusStream, 5000);
    });

    statusStream = req;
    req.end();

  } catch (error) {
    console.error('Failed to connect to status stream:', error);
    lastError = handleNetworkError(error);
    updateTrayStatus();
  }
};

// Function to handle network errors
const handleNetworkError = (error) => {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return 'Cannot connect to the server. Please check if the backend is running.';
  }
  if (error.response) {
    if (error.response.status === 401) {
      return 'Authentication failed. Please log in again.';
    }
    return `Server error: ${error.response.data?.message || error.message}`;
  }
  return error.message || 'An unexpected error occurred';
};

// Function to start status checking
const startStatusChecking = () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }
  statusCheckInterval = setInterval(connectToStatusStream, 5000); // Check every 5 seconds
};

// Function to stop status checking
const stopStatusChecking = () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
};

function createWindow() {
  const preloadPath = path.join(app.getAppPath(), 'dist', 'preload.js');
  console.log('app.getAppPath():', app.getAppPath());
  console.log('Calculated preload path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: preloadPath,
    },
    autoHideMenuBar: true,
    frame: false,
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the 'dist' folder contents are copied to the app's root, so index.html is directly there
    mainWindow.loadFile(path.join(app.getAppPath(), 'index.html'));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('minimize', function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('close', function (event) {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Create system tray icon
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Start Scraper',
      click: async () => {
        if (!isScraperRunning) {
          try {
            isScraperRunning = true;
            lastError = null;
            contextMenu.items[1].label = 'Stop Scraper';
            tray.setContextMenu(contextMenu);
            updateTrayStatus();
            
            const token = await mainWindow.webContents.executeJavaScript(`
              (async () => {
                try {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    throw new Error('No token found');
                  }
                  return token;
                } catch (error) {
                  console.error('Error getting token:', error);
                  throw error;
                }
              })()
            `);
            
            if (!token) {
              throw new Error('No authentication token found');
            }
            
            await axios.post('http://localhost:3002/api/scraper/trigger', {}, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            mainWindow.webContents.send('scraper-status', { running: true });
            new Notification({ 
              title: 'Vinted Tracker', 
              body: 'Scraper started successfully' 
            }).show();
            
            // Connect to status stream
            connectToStatusStream();
          } catch (error) {
            console.error('Failed to start scraper:', error);
            isScraperRunning = false;
            lastError = handleNetworkError(error);
            contextMenu.items[1].label = 'Start Scraper';
            tray.setContextMenu(contextMenu);
            updateTrayStatus();
            new Notification({ 
              title: 'Vinted Tracker', 
              body: lastError
            }).show();
          }
        } else {
          try {
            const token = await mainWindow.webContents.executeJavaScript(`
              (async () => {
                try {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    throw new Error('No token found');
                  }
                  return token;
                } catch (error) {
                  console.error('Error getting token:', error);
                  throw error;
                }
              })()
            `);

            await axios.post('http://localhost:3002/api/scraper/stop', {}, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            isScraperRunning = false;
            lastError = null;
            contextMenu.items[1].label = 'Start Scraper';
            tray.setContextMenu(contextMenu);
            updateTrayStatus();
            mainWindow.webContents.send('scraper-status', { running: false });
            new Notification({ 
              title: 'Vinted Tracker', 
              body: 'Scraper stopped' 
            }).show();
            
            // Close status stream
            if (statusStream) {
              statusStream.destroy();
              statusStream = null;
            }
          } catch (error) {
            console.error('Failed to stop scraper:', error);
            lastError = handleNetworkError(error);
            updateTrayStatus();
            new Notification({ 
              title: 'Vinted Tracker', 
              body: lastError
            }).show();
          }
        }
      }
    },
    {
      label: 'Check Status',
      click: async () => {
        try {
          const token = await mainWindow.webContents.executeJavaScript(`
            (async () => {
              try {
                const token = localStorage.getItem('token');
                if (!token) {
                  throw new Error('No token found');
                }
                return token;
              } catch (error) {
                console.error('Error getting token:', error);
                throw error;
              }
            })()
          `);

          if (!token) {
            throw new Error('No authentication token found');
          }

          // Reconnect to status stream to get latest status
          connectToStatusStream();
          
          new Notification({ 
            title: 'Vinted Tracker', 
            body: `Scraper is ${isScraperRunning ? 'running' : 'stopped'}${lastError ? `\nLast Error: ${lastError}` : ''}` 
          }).show();
        } catch (error) {
          console.error('Failed to check status:', error);
          lastError = handleNetworkError(error);
          updateTrayStatus();
          new Notification({ 
            title: 'Vinted Tracker', 
            body: lastError
          }).show();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Vinted Tracker');
  tray.setContextMenu(contextMenu);
  updateTrayStatus();

  tray.on('double-click', () => {
    mainWindow.show();
  });

  // Connect to status stream when app starts
  connectToStatusStream();
});

app.on('window-all-closed', function () {
  // Don't quit the app when all windows are closed, minimize to tray instead
  // if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  app.isQuitting = true;
  
  // Close status stream
  if (statusStream) {
    statusStream.destroy();
    statusStream = null;
  }
  
  // If scraper is running, try to stop it
  if (isScraperRunning) {
    try {
      const token = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('No token found');
            }
            return token;
          } catch (error) {
            console.error('Error getting token:', error);
            throw error;
          }
        })()
      `);

      await axios.post('http://localhost:3002/api/scraper/stop', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Failed to stop scraper during quit:', error);
    }
  }
});

// Handle notifications
ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

// Handle window controls
ipcMain.on('minimize-window', (event) => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.on('maximize-window', (event) => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow.isMaximized()) {
    currentWindow.unmaximize();
  } else {
    currentWindow.maximize();
  }
});

ipcMain.on('close-window', (event) => {
  // Instead of closing, hide the window to tray
  BrowserWindow.getFocusedWindow().hide();
});

// Handle scraper trigger from renderer
ipcMain.on('trigger-scraper', async () => {
  if (!isScraperRunning) {
    try {
      isScraperRunning = true;
      lastError = null;
      updateTrayStatus();
      
      const token = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('No token found');
            }
            return token;
          } catch (error) {
            console.error('Error getting token:', error);
            throw error;
          }
        })()
      `);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      await axios.post('http://localhost:3002/api/scraper/trigger', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      mainWindow.webContents.send('scraper-status', { running: true });
      new Notification({ 
        title: 'Vinted Tracker', 
        body: 'Scraper finished successfully' 
      }).show();
      
      // Connect to status stream
      connectToStatusStream();
    } catch (error) {
      console.error('Failed to start scraper:', error);
      isScraperRunning = false;
      lastError = handleNetworkError(error);
      updateTrayStatus();
      new Notification({ 
        title: 'Vinted Tracker', 
        body: lastError
      }).show();
    }
  } else {
    try {
      const token = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('No token found');
            }
            return token;
          } catch (error) {
            console.error('Error getting token:', error);
            throw error;
          }
        })()
      `);

      await axios.post('http://localhost:3002/api/scraper/stop', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      isScraperRunning = false;
      lastError = null;
      updateTrayStatus();
      mainWindow.webContents.send('scraper-status', { running: false });
      new Notification({ 
        title: 'Vinted Tracker', 
        body: 'Scraper stopped' 
      }).show();
      
      // Close status stream
      if (statusStream) {
        statusStream.destroy();
        statusStream = null;
      }
    } catch (error) {
      console.error('Failed to stop scraper:', error);
      lastError = handleNetworkError(error);
      updateTrayStatus();
      new Notification({ 
        title: 'Vinted Tracker', 
        body: lastError
      }).show();
    }
  }
}); 