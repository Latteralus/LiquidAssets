// Data Store - Handles local data storage

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class DataStore {
    constructor() {
      // Use userData directory for persistent storage instead of localStorage
      this.dataPath = app.getPath('userData');
      this.storageDir = path.join(this.dataPath, 'game-data');
      
      // Ensure the storage directory exists
      this.ensureDirectoryExists();
    }
    
    ensureDirectoryExists() {
      try {
        if (!fs.existsSync(this.storageDir)) {
          fs.mkdirSync(this.storageDir, { recursive: true });
        }
      } catch (error) {
        console.error('Error creating storage directory:', error);
      }
    }
    
    // Get file path for a specific key
    getFilePath(key) {
      // Sanitize key to prevent path traversal attacks
      const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
      return path.join(this.storageDir, `${sanitizedKey}.json`);
    }
    
    // Save data to file storage
    save(key, data) {
      if (!key || typeof key !== 'string') {
        console.error('Invalid key for storage:', key);
        return false;
      }
      
      // Validate data - must be serializable
      if (data === undefined) {
        console.error('Cannot store undefined data');
        return false;
      }
      
      try {
        // Test that data can be serialized
        const serializedData = JSON.stringify(data);
        
        // Write to file
        fs.writeFileSync(this.getFilePath(key), serializedData, 'utf8');
        return true;
      } catch (error) {
        console.error('Error saving data:', error);
        return false;
      }
    }
    
    // Load data from file storage
    load(key) {
      if (!key || typeof key !== 'string') {
        console.error('Invalid key for loading:', key);
        return null;
      }
      
      try {
        const filePath = this.getFilePath(key);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return null;
        }
        
        // Read and parse file
        const serializedData = fs.readFileSync(filePath, 'utf8');
        
        try {
          return JSON.parse(serializedData);
        } catch (parseError) {
          console.error('Error parsing data from storage:', parseError);
          return null;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        return null;
      }
    }
    
    // Remove data from storage
    remove(key) {
      if (!key || typeof key !== 'string') {
        console.error('Invalid key for removal:', key);
        return false;
      }
      
      try {
        const filePath = this.getFilePath(key);
        
        // Check if file exists before deleting
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return true;
      } catch (error) {
        console.error('Error removing data:', error);
        return false;
      }
    }
    
    // Clear all data from storage
    clear() {
      try {
        const files = fs.readdirSync(this.storageDir);
        
        for (const file of files) {
          // Only delete JSON files
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.storageDir, file));
          }
        }
        return true;
      } catch (error) {
        console.error('Error clearing data:', error);
        return false;
      }
    }
    
    // Get all keys in storage
    getKeys() {
      try {
        const files = fs.readdirSync(this.storageDir);
        
        // Convert filenames back to keys
        return files
          .filter(file => file.endsWith('.json'))
          .map(file => file.slice(0, -5)); // Remove .json extension
      } catch (error) {
        console.error('Error getting keys:', error);
        return [];
      }
    }
    
    // Get all saved games
    getSavedGames() {
      try {
        const savedGames = [];
        const keys = this.getKeys();
        
        for (const key of keys) {
          if (key.startsWith('liquid-assets-save-')) {
            const gameData = this.load(key);
            
            if (gameData && this.validateGameData(gameData)) {
              savedGames.push({
                id: key.replace('liquid-assets-save-', ''),
                name: gameData.saveName || 'Unnamed Save',
                date: gameData.saveDate || 'Unknown Date',
                cash: gameData.player ? gameData.player.cash : 0,
                venues: gameData.player ? gameData.player.venues.length : 0
              });
            } else {
              // Corrupted save file - consider removing it
              console.warn(`Corrupted save file detected: ${key}`);
            }
          }
        }
        
        // Sort by date (newest first)
        return savedGames.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });
      } catch (error) {
        console.error('Error getting saved games:', error);
        return [];
      }
    }
    
    // Validate game data structure
    validateGameData(gameData) {
      if (!gameData || typeof gameData !== 'object') return false;
      
      // Check for required properties
      if (!gameData.player || typeof gameData.player !== 'object') return false;
      if (typeof gameData.player.cash !== 'number') return false;
      if (!Array.isArray(gameData.player.venues)) return false;
      
      // Check for game time data
      if (!gameData.gameTime || typeof gameData.gameTime !== 'object') return false;
      
      return true;
    }
    
    // Save game with a specific name
    saveGame(name, gameData) {
      if (!name || typeof name !== 'string') {
        console.error('Invalid save name:', name);
        return false;
      }
      
      if (!gameData || typeof gameData !== 'object') {
        console.error('Invalid game data for saving');
        return false;
      }
      
      // Validate essential game data
      if (!this.validateGameData(gameData)) {
        console.error('Game data failed validation');
        return false;
      }
      
      // Add metadata to save
      const saveData = {
        ...gameData,
        saveName: name.trim() || 'Unnamed Save',
        saveDate: new Date().toISOString(),
        saveVersion: '1.0.0' // Add version tracking for future compatibility
      };
      
      const saveId = Date.now().toString();
      return this.save(`liquid-assets-save-${saveId}`, saveData);
    }
    
    // Load a specific game
    loadGame(id) {
      if (!id || typeof id !== 'string') {
        console.error('Invalid save ID for loading:', id);
        return null;
      }
      
      const gameData = this.load(`liquid-assets-save-${id}`);
      
      // Validate loaded data
      if (!gameData || !this.validateGameData(gameData)) {
        console.error('Invalid or corrupted save data');
        return null;
      }
      
      return gameData;
    }
    
    // Delete a specific game
    deleteGame(id) {
      if (!id || typeof id !== 'string') {
        console.error('Invalid save ID for deletion:', id);
        return false;
      }
      
      return this.remove(`liquid-assets-save-${id}`);
    }
    
    // Save options
    saveOptions(options) {
      if (!options || typeof options !== 'object') {
        console.error('Invalid options data');
        return false;
      }
      
      // Validate specific option fields
      const validatedOptions = {
        soundEnabled: typeof options.soundEnabled === 'boolean' ? options.soundEnabled : true,
        musicVolume: this.validateRangeValue(options.musicVolume, 0, 100, 50),
        sfxVolume: this.validateRangeValue(options.sfxVolume, 0, 100, 50),
        textSpeed: this.validateEnumValue(options.textSpeed, ['slow', 'normal', 'fast'], 'normal'),
        autosave: typeof options.autosave === 'boolean' ? options.autosave : true
      };
      
      return this.save('liquid-assets-options', validatedOptions);
    }
    
    // Load options
    loadOptions() {
      const options = this.load('liquid-assets-options');
      
      // Return options with fallbacks if loading failed or validation fails
      return {
        soundEnabled: options && typeof options.soundEnabled === 'boolean' ? options.soundEnabled : true,
        musicVolume: options ? this.validateRangeValue(options.musicVolume, 0, 100, 50) : 50,
        sfxVolume: options ? this.validateRangeValue(options.sfxVolume, 0, 100, 50) : 50,
        textSpeed: options ? this.validateEnumValue(options.textSpeed, ['slow', 'normal', 'fast'], 'normal') : 'normal',
        autosave: options && typeof options.autosave === 'boolean' ? options.autosave : true
      };
    }
    
    // Utility function to validate a value is within a range
    validateRangeValue(value, min, max, defaultValue) {
      if (typeof value !== 'number' || isNaN(value)) {
        return defaultValue;
      }
      return Math.max(min, Math.min(max, value));
    }
    
    // Utility function to validate a value is one of an allowed set
    validateEnumValue(value, allowedValues, defaultValue) {
      if (!value || !allowedValues.includes(value)) {
        return defaultValue;
      }
      return value;
    }
    
    // Create backup of save data
    createBackup() {
      try {
        const backupDir = path.join(this.dataPath, 'backups');
        
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Create a timestamped backup filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
        
        // Get all game data
        const saveData = {};
        const keys = this.getKeys();
        
        for (const key of keys) {
          saveData[key] = this.load(key);
        }
        
        // Write backup file
        fs.writeFileSync(backupFile, JSON.stringify(saveData, null, 2), 'utf8');
        
        return backupFile;
      } catch (error) {
        console.error('Error creating backup:', error);
        return null;
      }
    }
    
    // Restore from backup
    restoreFromBackup(backupFile) {
      try {
        if (!fs.existsSync(backupFile)) {
          console.error('Backup file does not exist:', backupFile);
          return false;
        }
        
        // Read and parse backup file
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        
        // Clear existing data
        this.clear();
        
        // Restore each saved item
        for (const key in backupData) {
          this.save(key, backupData[key]);
        }
        
        return true;
      } catch (error) {
        console.error('Error restoring from backup:', error);
        return false;
      }
    }
    
    // Import saves from file
    importSaves(importFile) {
      try {
        if (!fs.existsSync(importFile)) {
          console.error('Import file does not exist:', importFile);
          return false;
        }
        
        // Read and parse import file
        const importData = JSON.parse(fs.readFileSync(importFile, 'utf8'));
        
        // Validate and import each save
        let importCount = 0;
        
        for (const key in importData) {
          if (key.startsWith('liquid-assets-save-')) {
            if (this.validateGameData(importData[key])) {
              this.save(key, importData[key]);
              importCount++;
            }
          }
        }
        
        return importCount > 0;
      } catch (error) {
        console.error('Error importing saves:', error);
        return false;
      }
    }
    
    // Export saves to file
    exportSaves(exportFile) {
      try {
        const exportData = {};
        const keys = this.getKeys();
        
        // Only export save files, not settings
        for (const key of keys) {
          if (key.startsWith('liquid-assets-save-')) {
            exportData[key] = this.load(key);
          }
        }
        
        if (Object.keys(exportData).length === 0) {
          console.error('No saves to export');
          return false;
        }
        
        // Write export file
        fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2), 'utf8');
        return true;
      } catch (error) {
        console.error('Error exporting saves:', error);
        return false;
      }
    }
  }
  
  module.exports = DataStore;