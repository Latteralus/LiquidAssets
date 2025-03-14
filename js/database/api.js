// js/database/api.js
const { DatabaseManager } = require('./databaseManager');
const { MigrationManager } = require('./migrationManager');
const {
  VenueDAO,
  StaffDAO,
  CustomerDAO,
  TransactionDAO,
  InventoryDAO,
  SettingsDAO
} = require('./dao');
const {
  VenueService,
  GameService
} = require('./services');

/**
 * Main Database API that provides access to all database functionality
 */
class DatabaseAPI {
  constructor() {
    // Initialize the database manager
    this.dbManager = DatabaseManager.getInstance();
    
    // Initialize data access objects
    this.venue = new VenueDAO();
    this.staff = new StaffDAO();
    this.customer = new CustomerDAO();
    this.transaction = new TransactionDAO();
    this.inventory = new InventoryDAO();
    this.settings = new SettingsDAO();
    
    // Initialize services
    this.venueService = new VenueService();
    this.gameService = new GameService();
    
    // Migration manager
    this.migrationManager = new MigrationManager();
  }

  /**
   * Initializes the database
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    try {
      // Initialize database connection
      await this.dbManager.initialize();
      
      // Run migrations if needed
      await this.migrationManager.migrate();
      
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Closes database connections
   * @returns {Promise<void>}
   */
  async close() {
    await this.dbManager.close();
  }

  /**
   * Gets the current database status
   * @returns {Promise<Object>} Database status object
   */
  async getStatus() {
    try {
      // Get migration status
      const migrationStatus = await this.migrationManager.status();
      
      // Get schema information
      const tableInfo = await this.dbManager.query(`
        SELECT 
          name, 
          sql 
        FROM 
          sqlite_master 
        WHERE 
          type='table' AND 
          name NOT LIKE 'sqlite_%'
      `);
      
      return {
        initialized: true,
        tableCount: tableInfo.length,
        migrations: {
          applied: migrationStatus.filter(m => m.status === 'Applied').length,
          pending: migrationStatus.filter(m => m.status === 'Pending').length
        }
      };
    } catch (error) {
      console.error('Error getting database status:', error);
      return {
        initialized: false,
        error: error.message
      };
    }
  }
}

// Export a singleton instance
const dbAPI = new DatabaseAPI();
module.exports = dbAPI;