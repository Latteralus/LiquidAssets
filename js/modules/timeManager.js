// Time Manager - Handles the in-game clock and time-based events

const { GAME_CONSTANTS } = require('../config');

class TimeManager {
  constructor(game) {
    this.game = game;
    this.gameClockInterval = null;
    
    this.gameTime = {
      day: 1,
      month: 1,
      year: 2025,
      hour: 8,
      minute: 0,
      dayOfWeek: 1 // 1 = Monday, 7 = Sunday
    };
  }
  
  getGameTime() {
    return { ...this.gameTime };
  }
  
  setGameTime(timeData) {
    this.gameTime = { ...timeData };
    this.updateTimeDisplay();
  }
  
  getFormattedDate() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[this.gameTime.month - 1];
    const formattedTime = `${this.padZero(this.gameTime.hour)}:${this.padZero(this.gameTime.minute)}`;
    return `${month} ${this.gameTime.day}, ${this.gameTime.year} ${formattedTime}`;
  }
  
  getDayOfWeekName() {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayNames[this.gameTime.dayOfWeek - 1];
  }
  
  padZero(num) {
    return num.toString().padStart(2, '0');
  }
  
  startGameClock() {
    if (this.gameClockInterval) {
      clearInterval(this.gameClockInterval);
    }
    
    this.gameClockInterval = setInterval(() => {
      this.updateGameTime();
      this.game.updateGameState();
    }, 1000 / GAME_CONSTANTS.TIME_SCALE);
    
    this.game.state.settings.gamePaused = false;
  }
  
  pauseGameClock() {
    if (this.gameClockInterval) {
      clearInterval(this.gameClockInterval);
      this.gameClockInterval = null;
    }
    this.game.state.settings.gamePaused = true;
  }
  
  resumeGameClock() {
    if (!this.gameClockInterval) {
      this.startGameClock();
    }
    this.game.state.settings.gamePaused = false;
  }
  
  updateGameTime() {
    // Increment the game time
    this.gameTime.minute += 15; // 15-minute increments
    
    // Update hour if minutes exceed 60
    if (this.gameTime.minute >= 60) {
      this.gameTime.hour++;
      this.gameTime.minute = 0;
      
      // Update day if hours exceed 24
      if (this.gameTime.hour >= 24) {
        this.gameTime.hour = 0;
        this.gameTime.day++;
        this.gameTime.dayOfWeek = (this.gameTime.dayOfWeek % 7) + 1;
        
        // Reset daily stats and trigger daily events
        this.onNewDay();
        
        // Update month if days exceed month length
        const daysInMonth = this.getDaysInMonth(this.gameTime.month, this.gameTime.year);
        if (this.gameTime.day > daysInMonth) {
          this.gameTime.day = 1;
          this.gameTime.month++;
          
          // Trigger monthly events
          this.onNewMonth();
          
          // Update year if months exceed 12
          if (this.gameTime.month > 12) {
            this.gameTime.month = 1;
            this.gameTime.year++;
            
            // Trigger yearly events
            this.onNewYear();
          }
        }
      }
    }
    
    // Update UI with new time
    this.updateTimeDisplay();
  }
  
  getDaysInMonth(month, year) {
    // Return the number of days in the given month
    return new Date(year, month, 0).getDate();
  }
  
  updateTimeDisplay() {
    // Update the date display in the UI
    const dateValue = document.getElementById('date-value');
    if (dateValue) {
      dateValue.textContent = this.getFormattedDate();
    }
  }
  
  onNewDay() {
    // Call financial manager to handle daily finances
    if (this.game.financialManager) {
      this.game.financialManager.onNewDay();
    }
    
    // Update weekly stats if it's the end of the week
    if (this.gameTime.dayOfWeek === 7) {
      this.onEndOfWeek();
    }
  }
  
  onEndOfWeek() {
    // Call financial manager to handle weekly finances
    if (this.game.financialManager) {
      this.game.financialManager.onEndOfWeek();
    }
  }
  
  onNewMonth() {
    // Call financial manager to handle monthly finances
    if (this.game.financialManager) {
      this.game.financialManager.onNewMonth();
    }
  }
  
  onNewYear() {
    // Call financial manager to handle yearly finances
    if (this.game.financialManager) {
      this.game.financialManager.onNewYear();
    }
  }
  
  isWorkingHours() {
    const hour = this.gameTime.hour;
    // Consider 8 AM to 10 PM as standard working hours
    return hour >= 8 && hour < 22;
  }
  
  isWeekend() {
    // Saturday or Sunday
    return this.gameTime.dayOfWeek >= 6;
  }
  
  isPeakHours() {
    const hour = this.gameTime.hour;
    // Late evening on weekends is peak time for venues
    if (this.isWeekend()) {
      return hour >= 19 || hour < 2;
    } else {
      return hour >= 17 && hour < 22;
    }
  }
}

module.exports = TimeManager;