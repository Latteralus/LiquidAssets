// staffBehavior.js - Handles staff morale, events, and behavior

const time = require('../time');
const { GAME_CONSTANTS, STAFF_TYPES } = require('../../config');

class StaffBehavior {
  constructor(game) {
    this.game = game;
  }
  
  /**
   * Update all staff members - primarily their morale and working status
   * @returns {Promise<void>}
   */
  async updateStaff() {
    try {
      // Get all staff, either from database or memory
      let allStaff = [];
      
      if (this.game.dbInitialized) {
        try {
          // If we have a current venue, focus on staff for that venue for performance
          if (this.game.state.currentVenue) {
            allStaff = await this.game.dbAPI.staff.getStaffByVenueId(this.game.state.currentVenue.id);
          } else {
            allStaff = await this.game.dbAPI.staff.getAllStaff();
          }
        } catch (error) {
          console.error('Error getting staff from database:', error);
          // Fall back to in-memory staff
          allStaff = this.game.state.staff || [];
        }
      } else {
        allStaff = this.game.state.staff || [];
      }
      
      // Skip if no staff
      if (!allStaff || allStaff.length === 0) return;
      
      // Get current game time
      const gameTime = time ? time.getGameTime() : this.game.timeManager.getGameTime();
      
      // Process each staff member
      for (const staff of allStaff) {
        // Check if staff should be working now
        const isWorkDay = this.isWorkingDay(staff, gameTime);
        const isWorkHour = this.isWorkingHour(staff, gameTime);
        const isWorking = isWorkDay && isWorkHour;
        
        // Update staff working status if needed
        if (staff.isWorking !== isWorking) {
          await this.updateStaffWorkingStatus(staff.id, isWorking);
        }
        
        // Update morale based on various factors
        const newMorale = this.calculateMoraleChange(staff, isWorking);
        if (newMorale !== staff.morale) {
          await this.updateStaffMorale(staff.id, newMorale);
        }
        
        // Check for potential staff quitting due to low morale
        if (newMorale < 20 && Math.random() < 0.01) {
          await this.staffQuits(staff.id);
          continue; // Skip to next staff member
        }
        
        // Random events for working staff
        if (isWorking && Math.random() < 0.005) { // 0.5% chance per update
          await this.checkForStaffEvents(staff);
        }
      }
    } catch (error) {
      console.error('Error updating staff:', error);
    }
  }
  
  /**
   * Check if today is a working day for the staff member
   * @param {Object} staff - Staff member
   * @param {Object} gameTime - Current game time
   * @returns {boolean} True if today is a working day
   */
  isWorkingDay(staff, gameTime) {
    // Ensure working days is properly defined
    if (!staff.workingDays || !Array.isArray(staff.workingDays) || staff.workingDays.length !== 7) {
      return true; // Default to working if schedule not defined
    }
    
    // Convert from 1-7 (Monday-Sunday) to 0-6 (Sunday-Saturday)
    const dayIndex = ((gameTime.dayOfWeek + 5) % 7);
    return staff.workingDays[dayIndex] === true;
  }
  
  /**
   * Check if current hour is a working hour for the staff member
   * @param {Object} staff - Staff member
   * @param {Object} gameTime - Current game time
   * @returns {boolean} True if current hour is a working hour
   */
  isWorkingHour(staff, gameTime) {
    // Ensure working hours is properly defined
    if (!staff.workingHours || typeof staff.workingHours !== 'object' || 
        staff.workingHours.start === undefined || staff.workingHours.end === undefined) {
      return true; // Default to working if hours not defined
    }
    
    const currentHour = gameTime.hour;
    
    // Handle shifts that span midnight
    if (staff.workingHours.end < staff.workingHours.start) {
      return currentHour >= staff.workingHours.start || currentHour < staff.workingHours.end;
    } else {
      return currentHour >= staff.workingHours.start && currentHour < staff.workingHours.end;
    }
  }
  
  /**
   * Update staff working status in database or memory
   * @param {string} staffId - Staff ID
   * @param {boolean} isWorking - New working status
   * @returns {Promise<boolean>} Success status
   */
  async updateStaffWorkingStatus(staffId, isWorking) {
    try {
      if (this.game.dbInitialized) {
        return await this.game.dbAPI.staff.updateStaffWorkingStatus(staffId, isWorking);
      } else {
        // Fall back to in-memory update
        return this.updateStaffWorkingStatusInMemory(staffId, isWorking);
      }
    } catch (error) {
      console.error(`Error updating working status for staff ${staffId}:`, error);
      return false;
    }
  }
  
  /**
   * Update staff working status in memory
   * @param {string} staffId - Staff ID
   * @param {boolean} isWorking - New working status
   * @returns {boolean} Success status
   */
  updateStaffWorkingStatusInMemory(staffId, isWorking) {
    try {
      const staff = this.game.state.staff.find(s => s.id === staffId);
      if (staff) {
        staff.isWorking = isWorking;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating staff working status in memory:`, error);
      return false;
    }
  }
  
  /**
   * Calculate new morale based on various factors
   * @param {Object} staff - Staff member
   * @param {boolean} isWorking - Whether the staff is currently working
   * @returns {number} New morale value (0-100)
   */
  calculateMoraleChange(staff, isWorking) {
    // Start with current morale
    let moraleChange = 0;
    
    // Get venue if available
    let venue = null;
    if (this.game.state.currentVenue && staff.venue === this.game.state.currentVenue.id) {
      venue = this.game.state.currentVenue;
    } else if (this.game.venueManager && typeof this.game.venueManager.getVenue === 'function') {
      venue = this.game.venueManager.getVenue(staff.venue);
    }
    
    if (!venue) return staff.morale; // No change if venue not found
    
    // 1. Venue popularity effect
    const venuePopularity = venue.stats?.popularity || 50;
    moraleChange += (venuePopularity - 50) / 200; // -0.25 to +0.25
    
    // 2. Workload effect
    const customerCount = this.game.customerManager ? 
                          this.game.customerManager.getCurrentCustomerCount() : 0;
    const venueStaff = staff.venue ? this.game.state.staff.filter(s => s.venue === staff.venue) : [];
    const staffCount = venueStaff.length || 1;
    const workloadRatio = customerCount / Math.max(1, staffCount);
    
    if (workloadRatio > 15) {
      moraleChange -= 0.3; // Severely overworked
    } else if (workloadRatio > 10) {
      moraleChange -= 0.1; // Overworked
    } else if (workloadRatio < 2 && customerCount > 0) {
      moraleChange += 0.05; // Very light workload, but not empty
    }
    
    // 3. Pay satisfaction
    const averageSkill = Object.values(staff.skills).reduce((sum, val) => sum + val, 0) / 
                        Object.values(staff.skills).length;
    
    // Get expected wage based on skill level
    const baseWage = STAFF_TYPES[staff.type] ? STAFF_TYPES[staff.type].baseSalary : 500;
    const expectedWage = baseWage * (0.7 + (averageSkill / 100) * 0.6);
    
    // Calculate pay satisfaction factor
    const wageSatisfaction = (staff.wage - expectedWage) / expectedWage;
    moraleChange += wageSatisfaction * 0.1; // Pay effect is relatively small
    
    // 4. Work duration effect
    if (isWorking) {
      moraleChange -= 0.05; // Small decrease while working (fatigue)
    } else {
      moraleChange += 0.1; // Recovery while not working
    }
    
    // 5. Apply personality effects
    if (staff.personality) {
      moraleChange += (staff.personality.energy || 0) / 1000; // Energy helps maintain morale
    }
    
    // 6. Venue cleanliness effect
    if (venue.stats && typeof venue.stats.cleanliness === 'number') {
      moraleChange += (venue.stats.cleanliness - 50) / 500; // -0.1 to +0.1
    }
    
    // Calculate new morale and clamp between 0-100
    let newMorale = Math.max(0, Math.min(100, staff.morale + moraleChange));
    
    return newMorale;
  }
  
  /**
   * Update staff morale in database or memory
   * @param {string} staffId - Staff ID
   * @param {number} newMorale - New morale value
   * @returns {Promise<boolean>} Success status
   */
  async updateStaffMorale(staffId, newMorale) {
    try {
      if (this.game.dbInitialized) {
        return await this.game.dbAPI.staff.updateStaffMorale(staffId, newMorale);
      } else {
        return this.updateStaffMoraleInMemory(staffId, newMorale);
      }
    } catch (error) {
      console.error(`Error updating morale for staff ${staffId}:`, error);
      return false;
    }
  }
  
  /**
   * Update staff morale in memory
   * @param {string} staffId - Staff ID
   * @param {number} newMorale - New morale value
   * @returns {boolean} Success status
   */
  updateStaffMoraleInMemory(staffId, newMorale) {
    try {
      const staff = this.game.state.staff.find(s => s.id === staffId);
      if (staff) {
        staff.morale = newMorale;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating staff morale in memory:`, error);
      return false;
    }
  }
  
  /**
   * Handle staff quitting due to low morale
   * @param {string} staffId - Staff ID
   * @returns {Promise<boolean>} Success status
   */
  async staffQuits(staffId) {
    try {
      // Get staff details for the notification
      let staffName = "staff member";
      let staffVenueId = null;
      
      if (this.game.dbInitialized) {
        try {
          const staff = await this.game.dbAPI.staff.getStaffById(staffId);
          if (staff) {
            staffName = staff.name;
            staffVenueId = staff.venue || staff.venueId;
          }
        } catch (error) {
          // Try to find name in memory
          const memoryStaff = this.game.state.staff.find(s => s.id === staffId);
          if (memoryStaff) {
            staffName = memoryStaff.name;
            staffVenueId = memoryStaff.venue;
          }
        }
      } else {
        const staff = this.game.state.staff.find(s => s.id === staffId);
        if (staff) {
          staffName = staff.name;
          staffVenueId = staff.venue;
        }
      }
      
      // Remove staff from venue (but keep in database as available staff with reset morale)
      if (this.game.dbInitialized) {
        // Update staff in database
        await this.game.dbAPI.staff.updateStaff(staffId, {
          venue_id: null,
          morale: 50, // Reset morale to neutral
          isWorking: false
        });
      } else {
        // Remove from venue's staff list
        if (staffVenueId && this.game.venueManager) {
          const venue = this.game.venueManager.getVenue(staffVenueId);
          if (venue && venue.staff) {
            const staffIndex = venue.staff.indexOf(staffId);
            if (staffIndex !== -1) {
              venue.staff.splice(staffIndex, 1);
            }
          }
        }
        
        // Update in-memory staff
        const staffIndex = this.game.state.staff.findIndex(s => s.id === staffId);
        if (staffIndex !== -1) {
          // Remove from game's staff list
          this.game.state.staff.splice(staffIndex, 1);
        }
      }
      
      // Notify the player
      this.logError(`${staffName} has quit due to low morale!`);
      
      return true;
    } catch (error) {
      console.error(`Error handling staff quitting:`, error);
      return false;
    }
  }
  
  /**
   * Check for random staff events based on staff properties
   * @param {Object} staff - Staff member
   * @returns {Promise<boolean>} True if an event was triggered
   */
  async checkForStaffEvents(staff) {
    try {
      // Determine event type based on staff traits and random chance
      const eventRoll = Math.random();
      
      if (staff.personality.reliability < 0 && eventRoll < 0.3) {
        // Unreliable staff might not show up
        this.logWarning(`${staff.name} didn't show up for their shift today.`);
        await this.updateStaffWorkingStatus(staff.id, false);
        return true;
      }
      
      if (staff.personality.creativity > 0 && staff.type === 'cook' && eventRoll < 0.4) {
        // Creative cook comes up with a special dish
        this.logSuccess(`${staff.name} created a special dish that customers love!`);
        
        // Update venue stats (slightly increase popularity and customer satisfaction)
        if (this.game.state.currentVenue && staff.venue === this.game.state.currentVenue.id) {
          // Get current venue stats
          const venueStats = this.game.state.currentVenue.stats || {};
          
          // Update stats
          const updates = {
            popularity: Math.min(100, (venueStats.popularity || 50) + 1),
            customerSatisfaction: Math.min(100, (venueStats.customerSatisfaction || 50) + 2)
          };
          
          // Update in database or memory
          if (this.game.dbInitialized) {
            await this.game.dbAPI.venue.updateVenueStats(staff.venue, updates);
          } else {
            // Update in-memory stats
            this.game.state.currentVenue.stats = {
              ...this.game.state.currentVenue.stats,
              ...updates
            };
          }
        }
        
        // Boost staff morale
        await this.updateStaffMorale(staff.id, Math.min(100, staff.morale + 10));
        return true;
      }
      
      if (staff.personality.friendliness > 0 && 
          (staff.type === 'waiter' || staff.type === 'bartender') && 
          eventRoll < 0.5) {
        // Friendly staff gets good tips
        this.logSuccess(`${staff.name} received excellent tips due to great customer service!`);
        
        // Add a small bonus to player's cash (tips)
        const tipAmount = Math.floor(Math.random() * 20) + 5; // 5-25 euros
        this.game.state.player.cash += tipAmount;
        
        // Boost staff morale
        await this.updateStaffMorale(staff.id, Math.min(100, staff.morale + 5));
        return true;
      }
      
      if (staff.type === 'dj' && eventRoll < 0.3) {
        // DJ attracts a crowd
        this.logSuccess(`${staff.name}'s music selection is bringing in more customers tonight!`);
        
        // Trigger additional customers via customer manager if available
        if (this.game.customerManager && typeof this.game.customerManager.addExtraCustomers === 'function') {
          const extraCustomers = Math.floor(Math.random() * 5) + 3; // 3-7 extra customers
          this.game.customerManager.addExtraCustomers(extraCustomers);
        }
        
        // Boost staff morale
        await this.updateStaffMorale(staff.id, Math.min(100, staff.morale + 3));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking for staff events:`, error);
      return false;
    }
  }
  
  /**
   * Get total staff cost for a venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<number>} Total weekly wage cost
   */
  async getStaffCost(venueId) {
    try {
      if (this.game.dbInitialized) {
        // Use database query
        return await this.game.dbAPI.staff.getStaffCost(venueId);
      } else {
        // Calculate from in-memory staff
        const venueStaff = this.game.state.staff.filter(s => s.venue === venueId);
        return venueStaff.reduce((total, staff) => total + staff.wage, 0);
      }
    } catch (error) {
      console.error(`Error getting staff cost for venue ${venueId}:`, error);
      
      // Fallback to calculating from in-memory staff
      try {
        const venueStaff = this.game.state.staff.filter(s => s.venue === venueId);
        return venueStaff.reduce((total, staff) => total + staff.wage, 0);
      } catch (fallbackError) {
        console.error('Fallback for getting staff cost also failed:', fallbackError);
        return 0;
      }
    }
  }
  
  /**
   * Get average staff morale for a venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<number>} Average morale (0-100)
   */
  async getAverageStaffMorale(venueId) {
    try {
      if (this.game.dbInitialized) {
        // Use database query
        return await this.game.dbAPI.staff.getAverageStaffMorale(venueId);
      } else {
        // Calculate from in-memory staff
        const venueStaff = this.game.state.staff.filter(s => s.venue === venueId);
        if (venueStaff.length === 0) return 0;
        
        const totalMorale = venueStaff.reduce((sum, staff) => sum + staff.morale, 0);
        return totalMorale / venueStaff.length;
      }
    } catch (error) {
      console.error(`Error getting average staff morale for venue ${venueId}:`, error);
      
      // Fallback to calculating from in-memory staff
      try {
        const venueStaff = this.game.state.staff.filter(s => s.venue === venueId);
        if (venueStaff.length === 0) return 0;
        
        const totalMorale = venueStaff.reduce((sum, staff) => sum + staff.morale, 0);
        return totalMorale / venueStaff.length;
      } catch (fallbackError) {
        console.error('Fallback for getting average morale also failed:', fallbackError);
        return 50; // Default to neutral morale
      }
    }
  }
  
  /**
   * Get staff morale rating as a text description
   * @param {number} morale - Morale value (0-100)
   * @returns {string} Morale rating description
   */
  getMoraleRating(morale) {
    if (morale >= 90) return 'Excellent';
    if (morale >= 75) return 'Very Good';
    if (morale >= 60) return 'Good';
    if (morale >= 40) return 'Fair';
    if (morale >= 20) return 'Poor';
    return 'Terrible';
  }
  
  // Logging helpers with NotificationManager integration
  
  logInfo(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.info(message);
    } else if (window.logToConsole) {
      window.logToConsole(message, 'info');
    } else {
      console.log(message);
    }
  }
  
  logSuccess(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.success(message);
    } else if (window.logToConsole) {
      window.logToConsole(message, 'success');
    } else {
      console.log(message);
    }
  }
  
  logWarning(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.warning(message);
    } else if (window.logToConsole) {
      window.logToConsole(message, 'warning');
    } else {
      console.warn(message);
    }
  }
  
  logError(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.error(message);
    } else if (window.logToConsole) {
      window.logToConsole(message, 'error');
    } else {
      console.error(message);
    }
  }
}

module.exports = StaffBehavior;