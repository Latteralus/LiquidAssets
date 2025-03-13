const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store();

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Game loop variables
let gameLoopInterval = null;
const GAME_LOOP_INTERVAL = 1000; // 1 second default interval
let isPaused = true;
let isShuttingDown = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icons/icon.png')
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
    stopGameLoop(); // Ensure the game loop is stopped when the window is closed
  });
  
  // Handle window close attempts - confirm before closing
  mainWindow.on('close', function(e) {
    if (!isShuttingDown && !isPaused) {
      e.preventDefault();
      mainWindow.webContents.send('confirm-exit');
    }
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  // On macOS, applications stay in the dock unless explicitly quit with Cmd+Q
  if (process.platform !== 'darwin') {
    stopGameLoop();
    app.quit();
  }
});

// Proper app shutdown handling
app.on('will-quit', (event) => {
  isShuttingDown = true;
  stopGameLoop();
});

// Game loop implementation
function startGameLoop() {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
  }
  
  isPaused = false;
  
  // Set up the game loop interval
  gameLoopInterval = setInterval(() => {
    // Send a tick event to the renderer process
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('game-tick');
    }
  }, GAME_LOOP_INTERVAL);
  
  console.log('Game loop started');
}

function stopGameLoop() {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
  }
  
  isPaused = true;
  console.log('Game loop stopped');
}

function pauseGameLoop() {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
  }
  
  isPaused = true;
  console.log('Game loop paused');
}

function resumeGameLoop() {
  if (!gameLoopInterval) {
    startGameLoop();
  }
  
  console.log('Game loop resumed');
}

function setGameLoopSpeed(speed) {
  const newInterval = Math.max(100, Math.floor(1000 / speed)); // Ensure minimum 100ms (10 ticks per second max)
  
  // Restart game loop with new interval if it's running
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    
    gameLoopInterval = setInterval(() => {
      // Send a tick event to the renderer process
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('game-tick');
      }
    }, newInterval);
  }
  
  console.log(`Game loop speed adjusted to ${speed}x (${newInterval}ms interval)`);
}

// IPC handlers for game data
ipcMain.handle('save-game', (event, gameData) => {
  try {
    // Pause the game while saving
    const wasPaused = isPaused;
    if (!wasPaused) {
      pauseGameLoop();
    }
    
    // Save the game data
    store.set('gameData', gameData);
    
    // Resume if it was running before
    if (!wasPaused) {
      resumeGameLoop();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving game:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-game', () => {
  try {
    // Pause the game while loading
    const wasPaused = isPaused;
    if (!wasPaused) {
      pauseGameLoop();
    }
    
    // Load the game data
    const gameData = store.get('gameData');
    
    // Resume if it was running before
    if (!wasPaused) {
      resumeGameLoop();
    }
    
    return gameData || null;
  } catch (error) {
    console.error('Error loading game:', error);
    return null;
  }
});

// Game simulation functions
ipcMain.on('start-game-loop', (event) => {
  startGameLoop();
});

ipcMain.on('pause-game-loop', (event) => {
  pauseGameLoop();
});

ipcMain.on('resume-game-loop', (event) => {
  resumeGameLoop();
});

ipcMain.on('set-game-speed', (event, speed) => {
  setGameLoopSpeed(speed);
});

// Exit confirmation response
ipcMain.on('exit-confirmed', (event, shouldSave) => {
  if (shouldSave) {
    // Wait for the save to complete before quitting
    mainWindow.webContents.send('save-before-exit');
  } else {
    // Just quit
    isShuttingDown = true;
    app.quit();
  }
});

ipcMain.on('save-completed', () => {
  // Now we can safely quit
  isShuttingDown = true;
  app.quit();
});

// Memory management - periodically run garbage collection if available
let gcInterval = null;
if (global.gc) {
  gcInterval = setInterval(() => {
    try {
      global.gc();
    } catch (e) {
      console.error('GC error:', e);
    }
  }, 60000); // Run GC every minute
}

// Clean up GC interval on app quit
app.on('will-quit', () => {
  if (gcInterval) {
    clearInterval(gcInterval);
  }
});