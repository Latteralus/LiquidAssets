// staffBehavior.js - Handles staff morale, events, and behavior

const { GAME_CONSTANTS, STAFF_TYPES } = require('../../config');

class StaffBehavior {
  constructor(game) {
    this.game = game;
  }
  
  async updateStaff() {
    // Get all staff, either from database or memory
    let allStaff = [];
    
    if (this.game.dbInitialized) {
      try {
        allStaff = await this.game.dbAPI.staff.getAllStaff();
      } catch (error) {
        console.error('Error getting staff from database:', error);
        // Fall back to in-memory staff
        allStaff = this.game.state.staff || [];
      }
    } else {
      allStaff = this.game.state.staff || [];
    }
    
    // Skip if no staff
    if (allStaff.length === 0) return;
    
    // Process each staff member
    for (const staff of allStaff) {
      // Check if staff should be working now
      const isWorkDay = this.isWorkingDay(staff);
      const isWorkHour = this.isWorkingHour(staff);
      const isWorking = isWorkDay && isWorkHour;
      
      // Update staff working status if needed
      if (staff.isWorking !== isWorking) {
        this.updateStaffWorkingStatus(staff.id, isWorking);
      }
      
      // Update morale based on various factors
      const newMorale = this.calculateMoraleChange(staff, isWorking);
      if (newMorale !== staff.morale) {
        this.updateStaffMorale(staff.id, newMorale);
      }
      
      // Check for potential staff quitting due to low morale
      if (newMorale < 20 && Math.random() < 0.01) {
        this.staffQuits(staff.id);
        continue; // Skip to next staff member
      }
      
      // Random events for working staff
      if (isWorking) {
        this.checkForStaffEvents(staff);
      }
    }
  }
  
  isWorkingDay(staff) {
    const currentDayOfWeek = this.game.timeManager.getGameTime().dayOfWeek;
    // Convert from 1-7 (Monday-Sunday) to 0-6 (Sunday-Saturday)
    const dayIndex = (currentDayOfWeek + 5) % 7;
    return staff.workingDays[dayIndex];
  }
  
  isWorkingHour(staff) {
    const currentHour = this.game.timeManager.getGameTime().hour;
    
    // Handle shifts that span midnight
    if (staff.workingHours.end < staff.workingHours.start) {
      return currentHour >= staff.workingHours.start || currentHour < staff.workingHours.end;
    } else {
      return currentHour >= staff.workingHours.start && currentHour < staff.workingHours.end;
    }
  }
  
  async updateStaffWorkingStatus(staffId, isWorking) {
    if (this.game.dbInitialized) {
      try {
        await this.game.dbAPI.staff.updateStaff(staffId, { isWorking });
      } catch (error) {
        console.error(`Error updating working status for staff ${staffId}:`, error);
        // Fall back to in-memory update
        this.updateStaffWorkingStatusInMemory(staffId, isWorking);
      }
    } else {
      this.updateStaffWorkingStatusInMemory(staffId, isWorking);
    }
  }
  
  updateStaffWorkingStatusInMemory(staffId, isWorking) {
    const staff = this.game.state.staff.find(s => s.id === staffId);
    if (staff) {
      staff.isWorking = isWorking;
    }
  }
  
  calculateMoraleChange(staff, isWorking) {
    // Factors affecting morale:
    // 1. Venue popularity (popular venues are more satisfying to work at)
    // 2. Workload (too many customers per staff = stress)
    // 3. Pay relative to skill level
    // 4. How long they've worked without a break
    
    let moraleChange = 0;
    
    // Get venue
    let venue = null;
    if (this.game.state.currentVenue && staff.venue === this.game.state.currentVenue.id) {
      venue = this.game.state.currentVenue;
    } else if (this.game.venueManager && this.game.venueManager.getVenue) {
      venue = this.game.venueManager.getVenue(staff.venue);
    }
    
    if (!venue) return staff.morale; // No change if venue not found
    
    // Venue popularity effect
    const venuePopularity = venue.stats?.popularity || 50;
    moraleChange += (venuePopularity - 50) / 200; // -0.25 to +0.25
    
    // Workload effect
    const customerCount = this.game.customerManager ? 
                          this.game.customerManager.getCurrentCustomerCount() : 0;
    const staffCount = venue.staff?.length || 1;
    const workloadRatio = customerCount / Math.max(1, staffCount);
    
    if (workloadRatio > 15) {
      // Severely overworked
      moraleChange -= 0.3;
    } else if (workloadRatio > 10) {
      // Overworked
      moraleChange -= 0.1;
    } else if (workloadRatio < 2 && customerCount > 0) {
      // Very light workload, but not empty
      moraleChange += 0.05;
    }
    
    // Pay satisfaction
    const averageSkill = Object.values(staff.skills).reduce((sum, val) => sum + val, 0) / 
                        Object.values(staff.skills).length;
    const expectedWage = STAFF_TYPES[staff.type].baseSalary * (0.7 + (averageSkill / 100) * 0.6);
    const wageSatisfaction = (staff.wage - expectedWage) / expectedWage;
    
    moraleChange += wageSatisfaction * 0.1; // Pay effect is relatively small
    
    // Work duration effect - staff get tired the longer they work
    if (isWorking) {
      moraleChange -= 0.05; // Just a small decrease while working
    } else {
      moraleChange += 0.1; // Recovery while not working
    }
    
    // Apply personality effects
    moraleChange += (staff.personality.energy / 100) * 0.1; // Energy helps maintain morale
    
    // Calculate new morale
    let newMorale = staff.morale + moraleChange;
    
    // Clamp morale between 0 and 100
    if (newMorale < 0) newMorale = 0;
    if (newMorale > 100) newMorale = 100;
    
    return newMorale;
  }
  
  async updateStaffMorale(staffId, newMorale) {
    if (this.game.dbInitialized) {
      try {
        await this.game.dbAPI.staff.updateStaffMorale(staffId, newMorale);
      } catch (error) {
        console.error(`Error updating morale for staff ${staffId}:`, error);
        // Fall back to in-memory update
        this.updateStaffMoraleInMemory(staffId, newMorale);
      }
    } else {
      this.updateStaffMoraleInMemory(staffId, newMorale);
    }
  }
  
  updateStaffMoraleInMemory(staffId, newMorale) {
    const staff = this.game.state.staff.find(s => s.id === staffId);
    if (staff) {
      staff.morale = newMorale;
    }
  }
  
  async staffQuits(staffId) {
    // Get staff details for the notification
    let staffName = "staff member";
    
    if (this.game.dbInitialized) {
      try {
        const staff = await this.game.dbAPI.staff.getStaffById(staffId);
        if (staff) {
          staffName = staff.name;
        }
      } catch (error) {
        console.error(`Error getting staff data for quitting notification:`, error);
        // Try to find name in memory
        const memoryStaff = this.game.state.staff.find(s => s.id === staffId);
        if (memoryStaff) {
          staffName = memoryStaff.name;
        }
      }
    } else {
      const staff = this.game.state.staff.find(s => s.id === staffId);
      if (staff) {
        staffName = staff.name;
      }
    }
    
    // Fire the staff (removes from venue and database/memory)
    if (this.game.staffManager && this.game.staffManager.operations) {
      await this.game.staffManager.operations.fireStaff(staffId);
    } else {
      // Direct database removal if staffManager operations not available
      if (this.game.dbInitialized) {
        try {
          await this.game.dbAPI.staff.removeStaffFromVenue(staffId);
        } catch (error) {
          console.error(`Error removing quitting staff from database:`, error);
        }
      }
    }
    
    // Notify the player
    this.logError(`${staffName} has quit due to low morale!`);
  }
  
  checkForStaffEvents(staff) {
    // Random events based on staff personality and skills
    const eventRoll = Math.random();
    
    if (eventRoll < 0.003) { // Very rare events
      // Determine the type of event based on staff traits
      if (staff.personality.reliability < -5 && eventRoll < 0.001) {
        // Unreliable staff might not show up
        this.logError(`${staff.name} didn't show up for work today.`);
        this.updateStaffWorkingStatus(staff.id, false);
        this.updateStaffMorale(staff.id, Math.max(0, staff.morale - 5));
      } else if (staff.personality.creativity > 5 && staff.type === 'cook' && eventRoll < 0.002) {
        // Creative cook comes up with a special dish
        this.logSuccess(`${staff.name} created a special dish that customers love!`);
        
        // Update venue stats
        if (this.game.state.currentVenue && staff.venue === this.game.state.currentVenue.id) {
          // Update in-memory stats
          if (this.game.state.currentVenue.stats) {
            this.game.state.currentVenue.stats.popularity += 1;
            this.game.state.currentVenue.stats.customerSatisfaction += 2;
          }
          
          // Update database if available
          if (this.game.dbInitialized) {
            try {
              this.game.dbAPI.venue.updateVenueStats(staff.venue, {
                popularity: this.game.state.currentVenue.stats.popularity,
                customerSatisfaction: this.game.state.currentVenue.stats.customerSatisfaction
              });
            } catch (error) {
              console.error('Error updating venue stats after staff event:', error);
            }
          }
        }
        
        // Boost staff morale
        this.updateStaffMorale(staff.id, Math.min(100, staff.morale + 10));
      } else if (staff.personality.friendliness > 5 && (staff.type === 'waiter' || staff.type === 'bartender') && eventRoll < 0.003) {
        // Friendly staff gets good tips
        this.logSuccess(`${staff.name} received excellent tips today!`);
        
        // Boost staff morale
        this.updateStaffMorale(staff.id, Math.min(100, staff.morale + 5));
      }
    }
  }
  
  getStaffCost(venueId) {
    if (this.game.dbInitialized) {
      // This would be better done in the database directly
      return this.game.dbAPI.staff.getStaffCost(venueId);
    } else {
      // Calculate in memory
      const staff = this.game.state.staff ? this.game.state.staff.filter(s => s.venue === venueId) : [];
      return staff.reduce((total, member) => total + member.wage, 0);
    }
  }
  
  getAverageStaffMorale(venueId) {
    if (this.game.dbInitialized) {
      // This would be better done in the database directly
      return this.game.dbAPI.staff.getAverageStaffMorale(venueId);
    } else {
      // Calculate in memory
      const staff = this.game.state.staff ? this.game.state.staff.filter(s => s.venue === venueId) : [];
      if (staff.length === 0) return 0;
      
      const totalMorale = staff.reduce((total, member) => total + member.morale, 0);
      return totalMorale / staff.length;
    }
  }
  
  // Logging helpers
  logInfo(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.info(message);
    } else {
      window.logToConsole(message, 'info');
    }
  }
  
  logSuccess(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.success(message);
    } else {
      window.logToConsole(message, 'success');
    }
  }
  
  logWarning(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.warning(message);
    } else {
      window.logToConsole(message, 'warning');
    }
  }
  
  logError(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.error(message);
    } else {
      window.logToConsole(message, 'error');
    }
  }
}

module.exports = StaffBehavior;