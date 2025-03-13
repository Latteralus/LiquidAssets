// Data Store - Handles local data storage

class DataStore {
    constructor() {
      this.localStorage = window.localStorage;
    }
    
    // Save data to local storage
    save(key, data) {
      try {
        const serializedData = JSON.stringify(data);
        this.localStorage.setItem(key, serializedData);
        return true;
      } catch (error) {
        console.error('Error saving data:', error);
        return false;
      }
    }
    
    // Load data from local storage
    load(key) {
      try {
        const serializedData = this.localStorage.getItem(key);
        if (serializedData === null) {
          return null;
        }
        return JSON.parse(serializedData);
      } catch (error) {
        console.error('Error loading data:', error);
        return null;
      }
    }
    
    // Remove data from local storage
    remove(key) {
      try {
        this.localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing data:', error);
        return false;
      }
    }
    
    // Clear all data from local storage
    clear() {
      try {
        this.localStorage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing data:', error);
        return false;
      }
    }
    
    // Get all keys in local storage
    getKeys() {
      const keys = [];
      for (let i = 0; i < this.localStorage.length; i++) {
        keys.push(this.localStorage.key(i));
      }
      return keys;
    }
    
    // Get all saved games
    getSavedGames() {
      const savedGames = [];
      const keys = this.getKeys();
      
      for (const key of keys) {
        if (key.startsWith('liquid-assets-save-')) {
          const gameData = this.load(key);
          if (gameData) {
            savedGames.push({
              id: key.replace('liquid-assets-save-', ''),
              name: gameData.saveName || 'Unnamed Save',
              date: gameData.saveDate || 'Unknown Date',
              cash: gameData.player ? gameData.player.cash : 0,
              venues: gameData.player ? gameData.player.venues.length : 0
            });
          }
        }
      }
      
      return savedGames;
    }
    
    // Save game with a specific name
    saveGame(name, gameData) {
      const saveData = {
        ...gameData,
        saveName: name,
        saveDate: new Date().toISOString()
      };
      
      const saveId = Date.now().toString();
      return this.save(`liquid-assets-save-${saveId}`, saveData);
    }
    
    // Load a specific game
    loadGame(id) {
      return this.load(`liquid-assets-save-${id}`);
    }
    
    // Delete a specific game
    deleteGame(id) {
      return this.remove(`liquid-assets-save-${id}`);
    }
    
    // Save options
    saveOptions(options) {
      return this.save('liquid-assets-options', options);
    }
    
    // Load options
    loadOptions() {
      return this.load('liquid-assets-options') || {
        soundEnabled: true,
        musicVolume: 50,
        sfxVolume: 50,
        textSpeed: 'normal',
        autosave: true
      };
    }
  }
  
  module.exports = DataStore;