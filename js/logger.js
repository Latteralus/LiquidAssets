// js/utils/logger.js
/**
 * Centralized logging utility that integrates with NotificationManager
 * and provides consistent fallbacks across the application.
 */
class Logger {
    constructor(game) {
      this.game = game;
    }
  
    /**
     * Log an informational message
     * @param {string} message - Message to log
     * @param {string} [category='INFO'] - Message category
     */
    info(message, category = 'INFO') {
      if (this.game && this.game.notificationManager) {
        this.game.notificationManager.info(message, category);
      } else if (window.logToConsole) {
        window.logToConsole(message, 'info');
      } else {
        console.log(message);
      }
    }
  
    /**
     * Log a success message
     * @param {string} message - Message to log
     * @param {string} [category='SUCCESS'] - Message category
     */
    success(message, category = 'SUCCESS') {
      if (this.game && this.game.notificationManager) {
        this.game.notificationManager.success(message, category);
      } else if (window.logToConsole) {
        window.logToConsole(message, 'success');
      } else {
        console.log(message);
      }
    }
  
    /**
     * Log a warning message
     * @param {string} message - Message to log
     * @param {string} [category='WARNING'] - Message category
     */
    warning(message, category = 'WARNING') {
      if (this.game && this.game.notificationManager) {
        this.game.notificationManager.warning(message, category);
      } else if (window.logToConsole) {
        window.logToConsole(message, 'warning');
      } else {
        console.warn(message);
      }
    }
  
    /**
     * Log an error message
     * @param {string} message - Message to log
     * @param {string} [category='ERROR'] - Message category
     */
    error(message, category = 'ERROR') {
      if (this.game && this.game.notificationManager) {
        this.game.notificationManager.error(message, category);
      } else if (window.logToConsole) {
        window.logToConsole(message, 'error');
      } else {
        console.error(message);
      }
    }
  
    /**
     * Log a message with a specific category
     * @param {string} message - Message to log
     * @param {string} category - Message category
     * @param {string} [type='info'] - Message type (info, success, warning, error)
     */
    log(message, category, type = 'info') {
      if (this.game && this.game.notificationManager) {
        this.game.notificationManager.addNotification(message, category);
      } else if (window.logToConsole) {
        window.logToConsole(message, type);
      } else {
        console.log(`[${category}] ${message}`);
      }
    }
  }
  
  // Create a factory function to get logger instances
  function createLogger(game) {
    return new Logger(game);
  }
  
  module.exports = {
    Logger,
    createLogger
  };