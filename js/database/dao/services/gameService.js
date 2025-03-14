// js/database/services/gameService.js
const { 
    VenueDAO, 
    StaffDAO, 
    CustomerDAO, 
    TransactionDAO, 
    InventoryDAO, 
    SettingsDAO 
  } = require('../dao');
  const { DatabaseManager } = require('../databaseManager');
  
  class GameService {
    constructor() {
      this.db = DatabaseManager.getInstance();
      this.venueDAO = new VenueDAO();
      this.staffDAO = new StaffDAO();
      this.customerDAO = new CustomerDAO();
      this.transactionDAO = new TransactionDAO();
      this.inventoryDAO = new InventoryDAO();
      this.settingsDAO = new SettingsDAO();
    }
  
    /**
     * Saves the current game state
     * @param {Object} gameState - The current game state
     * @param {string} saveName - Name for the save
     * @returns {Promise<Object>} Save result
     */
    async saveGame(gameState, saveName = 'Autosave') {
      try {
        // Start a transaction
        const transactionId = await this.db.beginTransaction();
        
        try {
          // Create save record
          const saveId = await this.db.insert('saved_games', {
            name: saveName,
            save_date: new Date().toISOString(),
            version: gameState.version || '1.0',
            game_data: JSON.stringify(gameState),
            metadata: JSON.stringify({
              playerCash: gameState.player?.cash || 0,
              currentVenue: gameState.currentVenue?.name || 'None',
              gameDay: gameState.gameTime?.day || 1,
              gameMonth: gameState.gameTime?.month || 1,
              gameYear: gameState.gameTime?.year || 2025
            })
          }, transactionId);
          
          // Limit the number of saves to 10 (keeping the most recent)
          const saveRecords = await this.db.query(
            'SELECT id FROM saved_games ORDER BY save_date DESC LIMIT 1000 OFFSET 10'
          );
          
          // Delete older saves
          for (const record of saveRecords) {
            await this.db.delete('saved_games', record.id, transactionId);
          }
          
          // Save settings
          if (gameState.settings) {
            await this.settingsDAO.saveSettings({
              'game': gameState.settings
            });
          }
          
          // Commit the transaction
          await this.db.commitTransaction(transactionId);
          
          return {
            success: true,
            saveId,
            saveName,
            saveDate: new Date().toISOString()
          };
        } catch (error) {
          // Rollback on error
          await this.db.rollbackTransaction(transactionId);
          throw error;
        }
      } catch (error) {
        console.error('Error saving game:', error);
        throw error;
      }
    }
  
    /**
     * Loads a saved game by ID
     * @param {number} saveId - The save ID to load
     * @returns {Promise<Object>} Loaded game state
     */
    async loadGame(saveId) {
      try {
        // Get the save record
        const saveRecord = await this.db.getById('saved_games', saveId);
        
        if (!saveRecord) {
          throw new Error(`Save with ID ${saveId} not found`);
        }
        
        // Parse the game data
        const gameState = JSON.parse(saveRecord.game_data);
        
        // Load settings
        const settings = await this.settingsDAO.getSettingsByCategory('game');
        
        // Merge settings with game state
        gameState.settings = settings;
        
        return {
          success: true,
          gameState,
          saveInfo: {
            id: saveRecord.id,
            name: saveRecord.name,
            date: saveRecord.save_date,
            version: saveRecord.version
          }
        };
      } catch (error) {
        console.error(`Error loading game save ${saveId}:`, error);
        throw error;
      }
    }
  
    /**
     * Gets list of saved games
     * @returns {Promise<Array>} List of saved games
     */
    async getSavedGames() {
      try {
        const records = await this.db.query(
          'SELECT id, name, save_date, version, metadata FROM saved_games ORDER BY save_date DESC'
        );
        
        return records.map(record => ({
          id: record.id,
          name: record.name,
          date: record.save_date,
          version: record.version,
          metadata: JSON.parse(record.metadata || '{}')
        }));
      } catch (error) {
        console.error('Error getting saved games:', error);
        throw error;
      }
    }
  
    /**
     * Deletes a saved game
     * @param {number} saveId - The save ID to delete
     * @returns {Promise<boolean>} True if deletion successful
     */
    async deleteSavedGame(saveId) {
      try {
        return await this.db.delete('saved_games', saveId);
      } catch (error) {
        console.error(`Error deleting save ${saveId}:`, error);
        throw error;
      }
    }
  
    /**
     * Creates a new player profile
     * @param {string} name - Player name
     * @returns {Promise<Object>} Created player
     */
    async createPlayer(name) {
      try {
        const playerId = await this.db.insert('players', {
          name,
          cash: 10000, // Starting cash
          reputation: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          settings: JSON.stringify({
            difficulty: 'normal',
            tutorials: true,
            notifications: true
          })
        });
        
        return {
          id: playerId,
          name,
          cash: 10000,
          reputation: 0,
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating player:', error);
        throw error;
      }
    }
  
    /**
     * Updates player data
     * @param {number} playerId - Player ID
     * @param {Object} playerData - Updated player data
     * @returns {Promise<boolean>} True if update successful
     */
    async updatePlayer(playerId, playerData) {
      try {
        const updateData = {
          updated_at: new Date().toISOString()
        };
        
        if (playerData.name !== undefined) updateData.name = playerData.name;
        if (playerData.cash !== undefined) updateData.cash = playerData.cash;
        if (playerData.reputation !== undefined) updateData.reputation = playerData.reputation;
        if (playerData.settings !== undefined) updateData.settings = JSON.stringify(playerData.settings);
        
        return await this.db.update('players', playerId, updateData);
      } catch (error) {
        console.error(`Error updating player ${playerId}:`, error);
        throw error;
      }
    }
  
    /**
     * Gets player data
     * @param {number} playerId - Player ID
     * @returns {Promise<Object|null>} Player data or null if not found
     */
    async getPlayer(playerId) {
      try {
        const record = await this.db.getById('players', playerId);
        
        if (!record) {
          return null;
        }
        
        return {
          id: record.id,
          name: record.name,
          cash: record.cash,
          reputation: record.reputation,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
          settings: JSON.parse(record.settings || '{}')
        };
      } catch (error) {
        console.error(`Error getting player ${playerId}:`, error);
        throw error;
      }
    }
  
    /**
     * Initializes a new game with first-time setup
     * @param {string} playerName - Name for the new player
     * @returns {Promise<Object>} New game state
     */
    async initializeNewGame(playerName) {
      try {
        // Start a transaction
        const transactionId = await this.db.beginTransaction();
        
        try {
          // Create player
          const player = await this.createPlayer(playerName);
          
          // Initialize game settings
          await this.settingsDAO.saveSettings({
            'game': {
              soundEnabled: true,
              musicVolume: 50,
              sfxVolume: 50,
              textSpeed: 'normal',
              autosave: true
            }
          });
          
          // Create default game time
          const gameTime = {
            day: 1,
            month: 1,
            year: 2025,
            hour: 8,
            minute: 0,
            dayOfWeek: 1 // Monday
          };
          
          // Create initial game state
          const gameState = {
            player,
            gameTime,
            currentCity: 'London',
            currentVenue: null,
            settings: {
              soundEnabled: true,
              musicVolume: 50,
              sfxVolume: 50,
              textSpeed: 'normal',
              autosave: true
            },
            version: '1.0'
          };
          
          // Save the initial game
          await this.saveGame(gameState, 'New Game');
          
          // Commit the transaction
          await this.db.commitTransaction(transactionId);
          
          return gameState;
        } catch (error) {
          // Rollback on error
          await this.db.rollbackTransaction(transactionId);
          throw error;
        }
      } catch (error) {
        console.error('Error initializing new game:', error);
        throw error;
      }
    }
  }
  
  module.exports = GameService;