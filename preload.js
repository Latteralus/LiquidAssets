const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    saveGame: (gameData) => {
      return ipcRenderer.invoke('save-game', gameData);
    },
    loadGame: () => {
      return ipcRenderer.invoke('load-game');
    },
    startGameLoop: () => {
      ipcRenderer.send('start-game-loop');
    },
    pauseGameLoop: () => {
      ipcRenderer.send('pause-game-loop');
    }
  }
);