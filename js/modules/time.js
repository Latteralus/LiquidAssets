// time.js - Core time utilities and standardization for the game
// This module serves as the single source of truth for time-related operations

const { GAME_CONSTANTS } = require('../config');

class Time {
  constructor() {
    // Default game time start is January 1, 2025 at 8:00 AM
    this.gameTime = {
      year: 2025,
      month: 1,
      day: 1,
      hour: 8,
      minute: 0,
      dayOfWeek: 1, // Monday
      dayOfYear: 1
    };
    
    // Time scale (how many game minutes pass per real second)
    this.timeScale = GAME_CONSTANTS.TIME_SCALE || 1;
    
    // Time tracking for game loop
    this.lastUpdateTime = Date.now();
    this.accumulatedTime = 0;
    
    // Days in each month (accounting for leap years)
    this.daysInMonth = [
      31, // January
      28, // February (will be updated for leap years)
      31, // March
      30, // April
      31, // May
      30, // June
      31, // July
      31, // August
      30, // September
      31, // October
      30, // November
      31  // December
    ];
    
    // Event callbacks for time changes
    this.minuteCallbacks = [];
    this.hourCallbacks = [];
    this.dayCallbacks = [];
    this.weekCallbacks = [];
    this.monthCallbacks = [];
    
    // Initialize leap year calculation
    this.updateLeapYear();
  }
  
  // Core time advancement function
  advanceTime(deltaTimeMs) {
    // Calculate game minutes to advance
    const minutesToAdvance = (deltaTimeMs / 1000) * this.timeScale;
    
    // If less than a minute has passed, just accumulate time
    if (minutesToAdvance < 1) {
      this.accumulatedTime += minutesToAdvance;
      return false; // No significant time change
    }
    
    // Include any accumulated time
    const totalMinutesToAdvance = Math.floor(minutesToAdvance + this.accumulatedTime);
    this.accumulatedTime = (minutesToAdvance + this.accumulatedTime) - totalMinutesToAdvance;
    
    // Track if certain time boundaries are crossed
    let minuteChanged = false;
    let hourChanged = false;
    let dayChanged = false;
    let weekChanged = false;
    let monthChanged = false;
    
    // Advance minute by minute to properly trigger all events
    for (let i = 0; i < totalMinutesToAdvance; i++) {
      this.gameTime.minute++;
      minuteChanged = true;
      
      // Handle hour rollover
      if (this.gameTime.minute >= 60) {
        this.gameTime.minute = 0;
        this.gameTime.hour++;
        hourChanged = true;
        
        // Handle day rollover
        if (this.gameTime.hour >= 24) {
          this.gameTime.hour = 0;
          this.gameTime.day++;
          this.gameTime.dayOfWeek = (this.gameTime.dayOfWeek % 7) + 1;
          this.gameTime.dayOfYear++;
          dayChanged = true;
          
          // Check for week boundary
          if (this.gameTime.dayOfWeek === 1) { // Monday
            weekChanged = true;
          }
          
          // Handle month rollover
          const daysInCurrentMonth = this.getDaysInMonth(this.gameTime.month, this.gameTime.year);
          if (this.gameTime.day > daysInCurrentMonth) {
            this.gameTime.day = 1;
            this.gameTime.month++;
            monthChanged = true;
            
            // Handle year rollover
            if (this.gameTime.month > 12) {
              this.gameTime.month = 1;
              this.gameTime.year++;
              this.gameTime.dayOfYear = 1;
              
              // Update leap year calculation for the new year
              this.updateLeapYear();
            }
          }
        }
      }
      
      // Trigger callbacks
      if (minuteChanged) {
        this.triggerCallbacks('minute');
        minuteChanged = false;
      }
    }
    
    // Trigger higher-level callbacks after all minutes have been processed
    if (hourChanged) this.triggerCallbacks('hour');
    if (dayChanged) this.triggerCallbacks('day');
    if (weekChanged) this.triggerCallbacks('week');
    if (monthChanged) this.triggerCallbacks('month');
    
    return true; // Time has advanced
  }
  
  // Update game time from real-time elapsed since last update
  update() {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // Don't process very small time steps (less than 10ms)
    if (deltaTime < 10) return false;
    
    return this.advanceTime(deltaTime);
  }
  
  // Set the game time directly
  setGameTime(time) {
    // Validate the time object
    if (!time || typeof time !== 'object') {
      console.error('Invalid time object provided to setGameTime');
      return false;
    }
    
    // Update game time
    this.gameTime = {
      year: time.year || this.gameTime.year,
      month: time.month || this.gameTime.month,
      day: time.day || this.gameTime.day,
      hour: time.hour || this.gameTime.hour,
      minute: time.minute || this.gameTime.minute,
      dayOfWeek: time.dayOfWeek || this.calculateDayOfWeek(time.year, time.month, time.day),
      dayOfYear: time.dayOfYear || this.calculateDayOfYear(time.year, time.month, time.day)
    };
    
    // Update leap year calculation
    this.updateLeapYear();
    
    return true;
  }
  
  // Set the time scale (game minutes per real second)
  setTimeScale(scale) {
    if (typeof scale !== 'number' || scale <= 0) {
      console.error('Invalid time scale:', scale);
      return false;
    }
    
    this.timeScale = scale;
    return true;
  }
  
  // Get the current game time
  getGameTime() {
    return { ...this.gameTime };
  }
  
  // Get the current time scale
  getTimeScale() {
    return this.timeScale;
  }
  
  // Format the current game time as a string
  formatGameTime(includeSeconds = false) {
    const hour = this.gameTime.hour.toString().padStart(2, '0');
    const minute = this.gameTime.minute.toString().padStart(2, '0');
    
    if (includeSeconds) {
      return `${hour}:${minute}:00`; // No actual seconds in our model
    }
    
    return `${hour}:${minute}`;
  }
  
  // Format the current game date as a string
  formatGameDate(format = 'full') {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const shortMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
      'Thursday', 'Friday', 'Saturday'
    ];
    
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Convert from 1-7 (Monday-Sunday) to 0-6 (Sunday-Saturday)
    const dayOfWeekIndex = (this.gameTime.dayOfWeek + 5) % 7;
    
    switch (format) {
      case 'short':
        return `${shortMonths[this.gameTime.month - 1]} ${this.gameTime.day}, ${this.gameTime.year}`;
      case 'compact':
        return `${this.gameTime.month}/${this.gameTime.day}/${this.gameTime.year}`;
      case 'iso':
        return `${this.gameTime.year}-${this.gameTime.month.toString().padStart(2, '0')}-${this.gameTime.day.toString().padStart(2, '0')}`;
      case 'day':
        return days[dayOfWeekIndex];
      case 'shortDay':
        return shortDays[dayOfWeekIndex];
      case 'full':
      default:
        return `${days[dayOfWeekIndex]}, ${months[this.gameTime.month - 1]} ${this.gameTime.day}, ${this.gameTime.year}`;
    }
  }
  
  // Get days in the current month
  getDaysInMonth(month = this.gameTime.month, year = this.gameTime.year) {
    // Check if February in a leap year
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }
    
    return this.daysInMonth[month - 1];
  }
  
  // Check if the given year is a leap year
  isLeapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
  }
  
  // Update leap year for the current game year
  updateLeapYear() {
    // Update February days for leap years
    this.daysInMonth[1] = this.isLeapYear(this.gameTime.year) ? 29 : 28;
  }
  
  // Calculate day of week from a date (returns 1-7 for Monday-Sunday)
  calculateDayOfWeek(year, month, day) {
    // Use JavaScript's Date to calculate day of week
    const date = new Date(year, month - 1, day);
    
    // Convert JavaScript's day of week (0-6, Sunday-Saturday) to 1-7 (Monday-Sunday)
    return date.getDay() === 0 ? 7 : date.getDay();
  }
  
  // Calculate day of year (1-366)
  calculateDayOfYear(year, month, day) {
    let dayOfYear = day;
    
    // Add days from previous months
    for (let m = 1; m < month; m++) {
      dayOfYear += this.isLeapYear(year) && m === 2 ? 29 : this.daysInMonth[m - 1];
    }
    
    return dayOfYear;
  }
  
  // Check if a date is earlier than another
  isDateEarlier(date1, date2) {
    // Convert to simplified format for comparison
    const stamp1 = date1.year * 10000 + date1.month * 100 + date1.day;
    const stamp2 = date2.year * 10000 + date2.month * 100 + date2.day;
    
    return stamp1 < stamp2;
  }
  
  // Check if a time is earlier than another on the same day
  isTimeEarlier(time1, time2) {
    // Convert to minutes for comparison
    const minutes1 = time1.hour * 60 + time1.minute;
    const minutes2 = time2.hour * 60 + time2.minute;
    
    return minutes1 < minutes2;
  }
  
  // Calculate time difference in minutes
  getTimeDifferenceInMinutes(time1, time2) {
    // Convert both times to minutes since midnight
    const minutes1 = time1.hour * 60 + time1.minute;
    const minutes2 = time2.hour * 60 + time2.minute;
    
    return Math.abs(minutes2 - minutes1);
  }
  
  // Calculate date difference in days
  getDateDifferenceInDays(date1, date2) {
    // Create JavaScript Date objects
    const jsDate1 = new Date(date1.year, date1.month - 1, date1.day);
    const jsDate2 = new Date(date2.year, date2.month - 1, date2.day);
    
    // Calculate difference in milliseconds and convert to days
    const diffTime = Math.abs(jsDate2 - jsDate1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  
  // Add minutes to a time
  addMinutesToTime(time, minutesToAdd) {
    // Create a new time object to avoid modifying the original
    const newTime = { ...time };
    
    // Add minutes
    newTime.minute += minutesToAdd;
    
    // Handle overflow
    while (newTime.minute >= 60) {
      newTime.minute -= 60;
      newTime.hour += 1;
      
      if (newTime.hour >= 24) {
        newTime.hour -= 24;
        // Note: day, month, year not updated here - use addDaysToDate for that
      }
    }
    
    return newTime;
  }
  
  // Add days to a date
  addDaysToDate(date, daysToAdd) {
    // Create JavaScript Date for easier calculation
    const jsDate = new Date(date.year, date.month - 1, date.day);
    
    // Add days
    jsDate.setDate(jsDate.getDate() + daysToAdd);
    
    // Convert back to our date format
    return {
      year: jsDate.getFullYear(),
      month: jsDate.getMonth() + 1,
      day: jsDate.getDate()
    };
  }
  
  // Register callback functions for different time units
  onMinute(callback) {
    if (typeof callback === 'function') {
      this.minuteCallbacks.push(callback);
    }
  }
  
  onHour(callback) {
    if (typeof callback === 'function') {
      this.hourCallbacks.push(callback);
    }
  }
  
  onDay(callback) {
    if (typeof callback === 'function') {
      this.dayCallbacks.push(callback);
    }
  }
  
  onWeek(callback) {
    if (typeof callback === 'function') {
      this.weekCallbacks.push(callback);
    }
  }
  
  onMonth(callback) {
    if (typeof callback === 'function') {
      this.monthCallbacks.push(callback);
    }
  }
  
  // Trigger callbacks for the given time unit
  triggerCallbacks(timeUnit) {
    let callbacks;
    switch (timeUnit) {
      case 'minute':
        callbacks = this.minuteCallbacks;
        break;
      case 'hour':
        callbacks = this.hourCallbacks;
        break;
      case 'day':
        callbacks = this.dayCallbacks;
        break;
      case 'week':
        callbacks = this.weekCallbacks;
        break;
      case 'month':
        callbacks = this.monthCallbacks;
        break;
      default:
        return; // Unknown time unit
    }
    
    // Execute all callbacks with the current game time
    callbacks.forEach(callback => {
      try {
        callback(this.getGameTime());
      } catch (error) {
        console.error(`Error in ${timeUnit} callback:`, error);
      }
    });
  }
  
  // Check if a time is between two other times
  isTimeBetween(targetTime, startTime, endTime) {
    // Convert all times to minutes since midnight
    const targetMinutes = targetTime.hour * 60 + targetTime.minute;
    const startMinutes = startTime.hour * 60 + startTime.minute;
    const endMinutes = endTime.hour * 60 + endTime.minute;
    
    // Handle normal case (start < end)
    if (startMinutes <= endMinutes) {
      return targetMinutes >= startMinutes && targetMinutes < endMinutes;
    } 
    // Handle wraparound case (e.g., 22:00 to 04:00)
    else {
      return targetMinutes >= startMinutes || targetMinutes < endMinutes;
    }
  }
  
  // Get the current time of day category
  getTimeOfDay() {
    const hour = this.gameTime.hour;
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
  
  // Get the current season
  getSeason() {
    const month = this.gameTime.month;
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }
  
  // Convert a time object to an ISO string format (for database)
  toISOString(timeObj = this.gameTime) {
    const year = timeObj.year;
    const month = timeObj.month.toString().padStart(2, '0');
    const day = timeObj.day.toString().padStart(2, '0');
    const hour = timeObj.hour.toString().padStart(2, '0');
    const minute = timeObj.minute.toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  }
  
  // Convert an ISO string to our time object format
  fromISOString(isoString) {
    if (!isoString || typeof isoString !== 'string') {
      return null;
    }
    
    try {
      const date = new Date(isoString);
      
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // JavaScript months are 0-indexed
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(), // Convert to 1-7 (Monday-Sunday)
        dayOfYear: this.calculateDayOfYear(date.getFullYear(), date.getMonth() + 1, date.getDate())
      };
    } catch (error) {
      console.error('Error parsing ISO string:', error);
      return null;
    }
  }
  
  // Synchronize with database time
  async syncWithDatabase(dbAPI) {
    if (!dbAPI) return false;
    
    try {
      // Get the current game time from the database
      const dbTime = await dbAPI.settings.getSetting('game_time');
      
      if (dbTime) {
        const timeObj = this.fromISOString(dbTime);
        if (timeObj) {
          this.setGameTime(timeObj);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error synchronizing time with database:', error);
      return false;
    }
  }
  
  // Save current time to database
  async saveToDatabase(dbAPI) {
    if (!dbAPI) return false;
    
    try {
      const isoTime = this.toISOString();
      await dbAPI.settings.setSetting('game_time', isoTime, 'time');
      return true;
    } catch (error) {
      console.error('Error saving time to database:', error);
      return false;
    }
  }
}

// Export a singleton instance
const time = new Time();
module.exports = time;