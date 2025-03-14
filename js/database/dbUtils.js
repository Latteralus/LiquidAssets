// js/database/dbUtils.js
/**
 * Database utility functions for handling common
 * database operations and fallback mechanisms.
 */

/**
 * Check if database API and specific DAO are available
 * @param {Object} game - Game instance
 * @param {string} daoName - Name of the DAO to check
 * @returns {boolean} True if database and DAO are available
 */
function isDatabaseAvailable(game, daoName = null) {
    if (!game || !game.dbInitialized) {
      return false;
    }
    
    if (daoName && (!game.dbAPI || !game.dbAPI[daoName])) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Execute a database operation with fallback to in-memory
   * @param {Object} game - Game instance
   * @param {string} daoName - DAO name (e.g., 'staff', 'venue')
   * @param {string} method - Method name to call
   * @param {Array} args - Arguments to pass to the method
   * @param {Function} fallbackFn - Fallback function for in-memory operation
   * @returns {Promise<any>} Result of the operation
   */
  async function withDatabaseFallback(game, daoName, method, args = [], fallbackFn) {
    try {
      if (isDatabaseAvailable(game, daoName)) {
        return await game.dbAPI[daoName][method](...args);
      } else {
        return await fallbackFn();
      }
    } catch (error) {
      console.error(`Database operation failed (${daoName}.${method}):`, error);
      return await fallbackFn();
    }
  }
  
  /**
   * Execute a transaction with proper error handling
   * @param {Object} game - Game instance
   * @param {Function} transactionFn - Function that executes the transaction
   * @param {Function} fallbackFn - Fallback function if transaction fails
   * @returns {Promise<any>} Result of the transaction
   */
  async function withTransaction(game, transactionFn, fallbackFn) {
    if (!isDatabaseAvailable(game)) {
      return await fallbackFn();
    }
    
    let transactionId = null;
    
    try {
      // Start a transaction
      transactionId = await game.dbAPI.db.beginTransaction();
      
      // Execute the transaction function
      const result = await transactionFn(transactionId);
      
      // Commit the transaction
      await game.dbAPI.db.commitTransaction(transactionId);
      
      return result;
    } catch (error) {
      // Rollback on error
      if (transactionId) {
        await game.dbAPI.db.rollbackTransaction(transactionId);
      }
      
      console.error('Transaction failed:', error);
      
      // Execute fallback
      return await fallbackFn();
    }
  }
  
  module.exports = {
    isDatabaseAvailable,
    withDatabaseFallback,
    withTransaction
  };