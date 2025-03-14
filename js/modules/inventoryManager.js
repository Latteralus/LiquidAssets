// Inventory Manager - Main file that imports and orchestrates inventory sub-modules

const dbAPI = require('../database/api');
const InventoryGenerator = require('./inventory/inventoryGenerator');
const InventoryOperations = require('./inventory/inventoryOperations');

class InventoryManager {
    constructor(game) {
      this.game = game;
      
      // Whether we're using database storage
      this.useDatabase = false;
      
      // Initialize sub-modules
      this.generator = new InventoryGenerator();
      this.operations = new InventoryOperations(game);
      
      // Check database availability
      this.checkDatabaseAvailability();
    }
    
    async checkDatabaseAvailability() {
      // Check if database API is available and initialized
      try {
        const status = await dbAPI.getStatus();
        this.useDatabase = status && status.initialized;
        
        if (this.useDatabase) {
          console.log("InventoryManager: Using database storage");
          // Share database status with sub-modules
          this.operations.setDatabaseAvailability(true);
        } else {
          console.log("InventoryManager: Using in-memory storage");
          this.operations.setDatabaseAvailability(false);
        }
      } catch (error) {
        console.error("InventoryManager: Database check failed", error);
        this.useDatabase = false;
        this.operations.setDatabaseAvailability(false);
      }
    }
    
    // Generate default inventory for a new venue
    generateDefaultInventory(venueType) {
      return this.generator.generateDefaultInventory(venueType);
    }
    
    // Inventory operations (delegated to operations module)
    async orderInventory(venueId, itemType, itemName, quantity) {
      return this.operations.orderInventory(venueId, itemType, itemName, quantity);
    }
    
    async updateInventoryPrices(venueId, itemType, itemName, newPrice) {
      return this.operations.updateInventoryPrices(venueId, itemType, itemName, newPrice);
    }
    
    async addNewInventoryItem(venueId, itemType, itemData) {
      return this.operations.addNewInventoryItem(venueId, itemType, itemData);
    }
    
    async removeInventoryItem(venueId, itemType, itemName) {
      return this.operations.removeInventoryItem(venueId, itemType, itemName);
    }
    
    // Inventory status and reporting
    async checkInventoryLevels(venue) {
      return this.operations.checkInventoryLevels(venue);
    }
    
    async reportLowInventory(venue) {
      return this.operations.reportLowInventory(venue);
    }
    
    async getInventorySummary(venueId) {
      return this.operations.getInventorySummary(venueId);
    }
    
    // Equipment maintenance
    async updateEquipmentCondition(venue) {
      return this.operations.updateEquipmentCondition(venue);
    }
}

module.exports = InventoryManager;