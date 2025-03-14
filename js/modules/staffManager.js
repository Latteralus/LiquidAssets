// timeManager.js - Integration with centralized time module
// This class now acts as an adapter between the game and the centralized time.js module

const time = require('./time');
const { GAME_CONSTANTS } = require('../config');

class TimeManager {
  constructor(game) {
    this.game = game;
    this.gameClockInterval = null;
    
    // Register event handlers with the centralized time module
    this.registerTimeEventHandlers();
  }
  
  /**
   * Register event handlers for different time intervals
   */
  registerTimeEventHandlers() {
    // Handle minute updates (used sparingly for performance)
    time.onMinute((gameTime) => {
      // Only trigger on 15-minute intervals to reduce processing load
      if (gameTime.minute % 15 === 0) {
        this.onMinuteUpdate(gameTime);
      }
    });
    
    // Handle hour updates
    time.onHour((gameTime) => {
      this.onHourUpdate(gameTime);
    });
    
    // Handle day updates
    time.onDay((gameTime) => {
      this.onNewDay(gameTime);
    });
    
    // Handle week updates (triggered on the first day of each week)
    time.onWeek((gameTime) => {
      this.onEndOfWeek(gameTime);
    });
    
    // Handle month updates
    time.onMonth((gameTime) => {
      this.onNewMonth(gameTime);
    });
  }
  
  /**
   * Get the current game time from the centralized time module
   * @returns {Object} Current game time object
   */
  getGameTime() {
    return time.getGameTime();
  }
  
  /**
   * Set the game time in the centralized time module
   * @param {Object} timeData - Time data to set
   * @returns {boolean} Success status
   */
  setGameTime(timeData) {
    const success = time.setGameTime(timeData);
    if (success) {
      this.updateTimeDisplay();
    }
    return success;
  }
  
  /**
   * Start the game clock, initiating time progression
   */
  startGameClock() {
    if (this.gameClockInterval) {
      clearInterval(this.gameClockInterval);
    }
    
    // Set the appropriate time scale
    time.setTimeScale(GAME_CONSTANTS.TIME_SCALE);
    
    // Sync with database if available
    this.syncWithDatabase();
    
    // Start a real-time interval to update the game time
    this.gameClockInterval = setInterval(() => {
      const timeChanged = time.update();
      
      // Only update game state and UI if time has actually changed
      if (timeChanged) {
        this.game.updateGameState();
        this.updateTimeDisplay();
      }
    }, 1000 / GAME_CONSTANTS.TIME_SCALE); // Adjust interval based on time scale
    
    this.game.state.settings.gamePaused = false;
    
    // Log time started if notification manager is available
    if (this.game.notificationManager) {
      this.game.notificationManager.info('Game time has started.');
    }
  }
  
  /**
   * Pause the game clock, stopping time progression
   */
  pauseGameClock() {
    if (this.gameClockInterval) {
      clearInterval(this.gameClockInterval);
      this.gameClockInterval = null;
    }
    this.game.state.settings.gamePaused = true;
    
    // Save current time to database if available
    this.saveToDatabase();
  }
  
  /**
   * Resume the game clock if it was paused
   */
  resumeGameClock() {
    if (!this.gameClockInterval) {
      this.startGameClock();
    }
    this.game.state.settings.gamePaused = false;
  }
  
  /**
   * Change the game speed (time scale)
   * @param {number} speedMultiplier - How many times faster than normal
   */
  setGameSpeed(speedMultiplier) {
    // Validate input
    if (typeof speedMultiplier !== 'number' || speedMultiplier <= 0) {
      console.error('Invalid game speed multiplier:', speedMultiplier);
      return;
    }
    
    // Set new time scale
    time.setTimeScale(GAME_CONSTANTS.TIME_SCALE * speedMultiplier);
    
    // Restart the clock with the new speed if it's running
    if (this.gameClockInterval) {
      this.pauseGameClock();
      this.resumeGameClock();
    }
    
    // Log speed change if notification manager is available
    if (this.game.notificationManager) {
      this.game.notificationManager.info(`Game speed set to ${speedMultiplier}x.`);
    }
  }
  
  /**
   * Format current date for display
   * @returns {string} Formatted date string
   */
  getFormattedDate() {
    return time.formatGameDate('short') + ' ' + time.formatGameTime();
  }
  
  /**
   * Get the name of the current day of the week
   * @returns {string} Day name
   */
  getDayOfWeekName() {
    return time.formatGameDate('day');
  }
  
  /**
   * Helper function to pad numbers with leading zeros
   * @param {number} num - Number to pad
   * @returns {string} Padded number string
   */
  padZero(num) {
    return num.toString().padStart(2, '0');
  }
  
  /**
   * Update the UI time display
   */
  updateTimeDisplay() {
    // Update the date display in the UI
    const dateValue = document.getElementById('date-value');
    if (dateValue) {
      dateValue.textContent = this.getFormattedDate();
    }
  }
  
  /**
   * Synchronize time with database
   * @returns {Promise<boolean>} Success status
   */
  async syncWithDatabase() {
    if (this.game.dbInitialized && this.game.dbAPI) {
      return await time.syncWithDatabase(this.game.dbAPI);
    }
    return false;
  }
  
  /**
   * Save current time to database
   * @returns {Promise<boolean>} Success status
   */
  async saveToDatabase() {
    if (this.game.dbInitialized && this.game.dbAPI) {
      return await time.saveToDatabase(this.game.dbAPI);
    }
    return false;
  }
  
  /**
   * Handler for minute updates - for high-frequency updates
   * @param {Object} gameTime - Current game time
   */
  onMinuteUpdate(gameTime) {
    // Placeholder for specific minute-based logic
    // Currently not used to reduce processing burden
  }
  
  /**
   * Handler for hour updates
   * @param {Object} gameTime - Current game time
   */
  onHourUpdate(gameTime) {
    // Delegate to customer manager for customer updates
    if (this.game.customerManager) {
      this.game.customerManager.hourlyUpdate(gameTime);
    }
    
    // Update staff behavior
    if (this.game.staffManager) {
      this.game.staffManager.onHourUpdate(gameTime);
    }
    
    // Check for hourly events
    if (this.game.eventManager) {
      this.game.eventManager.checkHourlyEvents(gameTime);
    }
  }
  
  /**
   * Handler for new day events
   * @param {Object} gameTime - Current game time
   */
  onNewDay(gameTime) {
    // Call financial manager to handle daily finances
    if (this.game.financialManager) {
      this.game.financialManager.onNewDay(gameTime);
    }
    
    // Update venue statistics
    if (this.game.venueManager && this.game.state.currentVenue) {
      this.game.venueManager.updateDailyStats(this.game.state.currentVenue.id);
    }
    
    // Process staff daily updates
    if (this.game.staffManager) {
      this.game.staffManager.onDayUpdate(gameTime);
    }
    
    // Check for daily events
    if (this.game.eventManager) {
      this.game.eventManager.checkDailyEvents(gameTime);
    }
    
    // Handle automatic saving if enabled
    if (this.game.state.settings.autosave) {
      // Only autosave on day change and if not in the middle of the night
      const hour = gameTime.hour;
      if (hour >= 4 && hour <= 23) { // Only save between 4 AM and 11 PM
        this.game.saveGame('autosave');
      }
    }
  }
  
  /**
   * Handler for end of week events
   * @param {Object} gameTime - Current game time
   */
  onEndOfWeek(gameTime) {
    // Call financial manager to handle weekly finances
    if (this.game.financialManager) {
      this.game.financialManager.onEndOfWeek(gameTime);
    }
    
    // Process weekly staff payments
    if (this.game.staffManager) {
      this.game.staffManager.processStaffPayments();
    }
    
    // Generate weekly reports
    if (this.game.financialManager) {
      this.game.financialManager.generateWeeklyReport();
    }
  }
  
  /**
   * Handler for new month events
   * @param {Object} gameTime - Current game time
   */
  onNewMonth(gameTime) {
    // Call financial manager to handle monthly finances
    if (this.game.financialManager) {
      this.game.financialManager.onNewMonth(gameTime);
    }
    
    // Update city popularity and trends
    if (this.game.cityManager) {
      this.game.cityManager.updateCityTrends();
    }
    
    // Process rent payments
    if (this.game.financialManager && this.game.state.currentVenue) {
      this.game.financialManager.processRentPayment(this.game.state.currentVenue.id);
    }
    
    // Generate monthly financial report
    if (this.game.financialManager) {
      this.game.financialManager.generateMonthlyReport();
    }
  }
  
  /**
   * Check if current time is within working hours
   * @returns {boolean} True if within standard working hours
   */
  isWorkingHours() {
    const gameTime = time.getGameTime();
    const hour = gameTime.hour;
    // Consider 8 AM to 10 PM as standard working hours
    return hour >= 8 && hour < 22;
  }
  
  /**
   * Check if current day is a weekend
   * @returns {boolean} True if weekend (Saturday or Sunday)
   */
  isWeekend() {
    const gameTime = time.getGameTime();
    // Convert 1-7 (Monday-Sunday) to 0-6 (Sunday-Saturday)
    const dayOfWeek = (gameTime.dayOfWeek + 5) % 7;
    // Saturday (6) or Sunday (0)
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  
  /**
   * Check if current time is peak hours for venues
   * @returns {boolean} True if during peak hours
   */
  isPeakHours() {
    const gameTime = time.getGameTime();
    const hour = gameTime.hour;
    
    // Late evening on weekends is peak time for venues
    if (this.isWeekend()) {
      return hour >= 19 || hour < 2;
    } else {
      return hour >= 17 && hour < 22;
    }
  }
  
  /**
   * Get current season
   * @returns {string} Current season name
   */
  getCurrentSeason() {
    return time.getSeason();
  }
  
  /**
   * Get current time of day
   * @returns {string} Time of day category
   */
  getTimeOfDay() {
    return time.getTimeOfDay();
  }
  
  /**
   * Calculate minutes between two time objects
   * @param {Object} startTime - Start time object
   * @param {Object} endTime - End time object
   * @returns {number} Minutes between times
   */
  calculateMinutesBetween(startTime, endTime) {
    return time.getTimeDifferenceInMinutes(startTime, endTime);
  }
  
  /**
   * Add minutes to current game time
   * @param {number} minutes - Minutes to add
   * @returns {Object} New time after adding minutes
   */
  addMinutes(minutes) {
    const currentTime = time.getGameTime();
    return time.addMinutesToTime(currentTime, minutes);
  }
  
  /**
   * Add days to current game date
   * @param {number} days - Days to add
   * @returns {Object} New date after adding days
   */
  addDays(days) {
    const currentTime = time.getGameTime();
    const date = {
      year: currentTime.year,
      month: currentTime.month,
      day: currentTime.day
    };
    return time.addDaysToDate(date, days);
  }
}

module.exports = TimeManager;