// staffOperations.js - Handles CRUD operations for staff

const { GAME_CONSTANTS, STAFF_TYPES } = require('../../config');

class StaffOperations {
  constructor(game) {
    this.game = game;
  }
  
  async hireStaff(staffId, venueId) {
    // Check if database is available
    if (this.game.dbInitialized) {
      try {
        // Use database transaction for hiring staff
        const transactionId = await this.game.dbAPI.db.beginTransaction();
        
        try {
          // Get the staff member
          const staff = await this.game.dbAPI.staff.getStaffById(staffId);
          
          if (!staff) {
            this.logError("Staff member not found in database.");
            return false;
          }
          
          // Get the venue
          const venue = await this.game.dbAPI.venue.getVenueById(venueId);
          if (!venue) {
            this.logError("Venue not found in database.");
            return false;
          }
          
          // Check if venue has reached staff limit
          const venueStaff = await this.game.dbAPI.staff.getStaffByVenueId(venueId);
          if (venueStaff.length >= GAME_CONSTANTS.MAX_STAFF) {
            this.logError(`You've reached the maximum staff limit (${GAME_CONSTANTS.MAX_STAFF}).`);
            return false;
          }
          
          // Check if player has enough cash for first wage payment
          if (this.game.state.player.cash < staff.wage) {
            this.logError(`Not enough cash to hire staff. You need €${staff.wage}.`);
            return false;
          }
          
          // Assign staff to venue
          await this.game.dbAPI.staff.assignStaffToVenue(staffId, venueId, transactionId);
          
          // Update venue's staff count if needed
          if (venue.staffCount !== undefined) {
            await this.game.dbAPI.venue.updateStaffCount(venueId, venueStaff.length + 1, transactionId);
          }
          
          // Commit transaction
          await this.game.dbAPI.db.commitTransaction(transactionId);
          
          // Update local player cash
          this.game.state.player.cash -= staff.wage;
          
          // Log success message
          this.logSuccess(`Hired ${staff.name} as a ${STAFF_TYPES[staff.type].description} for €${staff.wage}/week.`);
          return true;
        } catch (error) {
          // Rollback on error
          await this.game.dbAPI.db.rollbackTransaction(transactionId);
          console.error('Error hiring staff:', error);
          this.logError(`Error hiring staff: ${error.message}`);
          return false;
        }
      } catch (error) {
        console.error('Database transaction error:', error);
        // Fall back to in-memory hiring
        return this.hireStaffInMemory(staffId, venueId);
      }
    } else {
      // Fall back to in-memory hiring
      return this.hireStaffInMemory(staffId, venueId);
    }
  }
  
  hireStaffInMemory(staffId, venueId) {
    // Find the staff in the pool
    const staffIndex = this.game.state.staffPool.findIndex(staff => staff.id === staffId);
    if (staffIndex === -1) {
      this.logError("Staff member not found in pool.");
      return false;
    }
    
    // Get the venue
    const venue = this.game.venueManager.getVenue(venueId);
    if (!venue) {
      this.logError("Venue not found.");
      return false;
    }
    
    // Check if venue has reached staff limit
    if (venue.staff.length >= GAME_CONSTANTS.MAX_STAFF) {
      this.logError(`You've reached the maximum staff limit (${GAME_CONSTANTS.MAX_STAFF}).`);
      return false;
    }
    
    // Check if player has enough cash for first wage payment
    const staff = this.game.state.staffPool[staffIndex];
    if (this.game.state.player.cash < staff.wage) {
      this.logError(`Not enough cash to hire staff. You need €${staff.wage}.`);
      return false;
    }
    
    // Copy staff member and update
    const hiredStaff = { ...staff };
    hiredStaff.hireDate = { ...this.game.timeManager.getGameTime() };
    hiredStaff.venue = venueId;
    
    // Add to venue's staff list
    venue.staff.push(hiredStaff.id);
    
    // Remove from staff pool
    this.game.state.staffPool.splice(staffIndex, 1);
    
    // Add to game's staff list
    if (!this.game.state.staff) {
      this.game.state.staff = [];
    }
    this.game.state.staff.push(hiredStaff);
    
    // Update player cash
    this.game.state.player.cash -= staff.wage;
    
    this.logSuccess(`Hired ${hiredStaff.name} as a ${STAFF_TYPES[hiredStaff.type].description} for €${hiredStaff.wage}/week.`);
    return true;
  }
  
  async fireStaff(staffId) {
    // Check if database is available
    if (this.game.dbInitialized) {
      try {
        // Get the staff member
        const staff = await this.game.dbAPI.staff.getStaffById(staffId);
        
        if (!staff) {
          this.logError("Staff member not found in database.");
          return false;
        }
        
        // Remove staff from venue by removing venue association
        await this.game.dbAPI.staff.removeStaffFromVenue(staffId);
        
        this.logInfo(`Fired ${staff.name}.`);
        return true;
      } catch (error) {
        console.error('Error firing staff from database:', error);
        // Fall back to in-memory firing
        return this.fireStaffInMemory(staffId);
      }
    } else {
      // Fall back to in-memory firing
      return this.fireStaffInMemory(staffId);
    }
  }
  
  fireStaffInMemory(staffId) {
    // Find the staff member
    const staffIndex = this.game.state.staff.findIndex(staff => staff.id === staffId);
    if (staffIndex === -1) {
      this.logError("Staff member not found.");
      return false;
    }
    
    const staff = this.game.state.staff[staffIndex];
    
    // Remove from venue's staff list
    const venue = this.game.venueManager.getVenue(staff.venue);
    if (venue) {
      const venueStaffIndex = venue.staff.indexOf(staffId);
      if (venueStaffIndex !== -1) {
        venue.staff.splice(venueStaffIndex, 1);
      }
    }
    
    // Remove from game's staff list
    this.game.state.staff.splice(staffIndex, 1);
    
    this.logInfo(`Fired ${staff.name}.`);
    return true;
  }
  
  async getStaff(staffId) {
    if (this.game.dbInitialized) {
      try {
        return await this.game.dbAPI.staff.getStaffById(staffId);
      } catch (error) {
        console.error(`Error getting staff ${staffId} from database:`, error);
        // Fall back to in-memory retrieval
        return this.getStaffFromMemory(staffId);
      }
    } else {
      return this.getStaffFromMemory(staffId);
    }
  }
  
  getStaffFromMemory(staffId) {
    return this.game.state.staff ? this.game.state.staff.find(staff => staff.id === staffId) : null;
  }
  
  async getAllStaff() {
    if (this.game.dbInitialized) {
      try {
        // If we've specified a venue, get staff for that venue, otherwise get all staff
        if (this.game.state.currentVenue) {
          return await this.game.dbAPI.staff.getStaffByVenueId(this.game.state.currentVenue.id);
        } else {
          return await this.game.dbAPI.staff.getAllStaff();
        }
      } catch (error) {
        console.error('Error getting all staff from database:', error);
        // Fall back to in-memory retrieval
        return this.getAllStaffFromMemory();
      }
    } else {
      return this.getAllStaffFromMemory();
    }
  }
  
  getAllStaffFromMemory() {
    return this.game.state.staff ? [...this.game.state.staff] : [];
  }
  
  async getStaffByVenue(venueId) {
    if (this.game.dbInitialized) {
      try {
        return await this.game.dbAPI.staff.getStaffByVenueId(venueId);
      } catch (error) {
        console.error(`Error getting staff for venue ${venueId} from database:`, error);
        // Fall back to in-memory retrieval
        return this.getStaffByVenueFromMemory(venueId);
      }
    } else {
      return this.getStaffByVenueFromMemory(venueId);
    }
  }
  
  getStaffByVenueFromMemory(venueId) {
    if (!this.game.state.staff) return [];
    return this.game.state.staff.filter(staff => staff.venue === venueId);
  }
  
  async trainStaff(staffId, skillToTrain) {
    // Get the staff member
    const staff = await this.getStaff(staffId);
    
    if (!staff) {
      this.logError("Staff member not found.");
      return false;
    }
    
    // Check if the skill exists for this staff type
    if (!STAFF_TYPES[staff.type].skillNames.includes(skillToTrain)) {
      this.logError(`${staff.type} cannot be trained in ${skillToTrain}.`);
      return false;
    }
    
    // Calculate training cost - higher for higher current skill
    const currentSkill = staff.skills[skillToTrain];
    const trainingCost = 50 + Math.round(currentSkill * 0.5);
    
    // Check if player has enough cash
    if (this.game.state.player.cash < trainingCost) {
      this.logError(`Not enough cash for training. Need €${trainingCost}.`);
      return false;
    }
    
    // Calculate skill increase (diminishing returns at higher levels)
    let skillIncrease;
    if (currentSkill < 50) {
      skillIncrease = 5 + Math.floor(Math.random() * 6); // 5-10
    } else if (currentSkill < 80) {
      skillIncrease = 3 + Math.floor(Math.random() * 4); // 3-6
    } else {
      skillIncrease = 1 + Math.floor(Math.random() * 3); // 1-3
    }
    
    // Apply the training
    const newSkillValue = Math.min(100, currentSkill + skillIncrease);
    
    // Update in database if available
    if (this.game.dbInitialized) {
      try {
        // Create a skills object with just the updated skill
        const updatedSkills = {};
        updatedSkills[skillToTrain] = newSkillValue;
        
        // Update the skill in the database
        await this.game.dbAPI.staff.updateStaffSkills(staffId, updatedSkills);
        
        // Update morale in database
        const newMorale = Math.min(100, staff.morale + 5);
        await this.game.dbAPI.staff.updateStaffMorale(staffId, newMorale);
      } catch (error) {
        console.error(`Error updating staff skills in database:`, error);
        // We'll continue anyway and update the local state
      }
    }
    
    // Update local state if needed
    if (!this.game.dbInitialized) {
      // Find staff in local state
      const localStaff = this.getStaffFromMemory(staffId);
      if (localStaff) {
        localStaff.skills[skillToTrain] = newSkillValue;
        localStaff.morale = Math.min(100, localStaff.morale + 5);
      }
    }
    
    // Deduct cost
    this.game.state.player.cash -= trainingCost;
    
    this.logSuccess(`Trained ${staff.name} in ${skillToTrain}. Skill increased by ${skillIncrease} to ${newSkillValue}.`);
    return true;
  }
  
  async adjustStaffWage(staffId, newWage) {
    // Get the staff member
    const staff = await this.getStaff(staffId);
    
    if (!staff) {
      this.logError("Staff member not found.");
      return false;
    }
    
    // Validate wage (must be positive)
    if (newWage <= 0) {
      this.logError("Wage must be positive.");
      return false;
    }
    
    // Calculate minimum acceptable wage based on skills
    const averageSkill = Object.values(staff.skills).reduce((sum, val) => sum + val, 0) / 
                        Object.values(staff.skills).length;
    const minAcceptableWage = STAFF_TYPES[staff.type].baseSalary * 0.7;
    
    if (newWage < minAcceptableWage) {
      this.logError(`${staff.name} won't accept a wage below €${minAcceptableWage}.`);
      return false;
    }
    
    // Calculate wage change percentage for morale effect
    const changePercent = (newWage - staff.wage) / staff.wage * 100;
    
    // Calculate morale adjustment
    let moraleChange = 0;
    let messageType = 'info';
    let message = '';
    
    if (changePercent > 5) {
      // Significant raise
      moraleChange = 10;
      message = `${staff.name} is very happy with the raise!`;
      messageType = 'success';
    } else if (changePercent > 0) {
      // Small raise
      moraleChange = 5;
      message = `${staff.name} appreciates the raise.`;
      messageType = 'success';
    } else if (changePercent < -5) {
      // Significant pay cut
      moraleChange = -15;
      message = `${staff.name} is upset about the pay cut.`;
      messageType = 'warning';
    } else {
      // Small pay cut
      moraleChange = -8;
      message = `${staff.name} is not happy about the pay cut.`;
      messageType = 'warning';
    }
    
    // Update in database if available
    if (this.game.dbInitialized) {
      try {
        // Update wage in database
        await this.game.dbAPI.staff.updateStaff(staffId, { wage: newWage });
        
        // Update morale
        const newMorale = Math.max(0, Math.min(100, staff.morale + moraleChange));
        await this.game.dbAPI.staff.updateStaffMorale(staffId, newMorale);
        
        // Check if staff might quit due to pay cut
        if (changePercent < -5 && newMorale < 30 && Math.random() < 0.3) {
          await this.game.dbAPI.staff.removeStaffFromVenue(staffId);
          this.logError(`${staff.name} quit due to the pay cut!`);
          return true; // Still return true as the action was completed
        }
      } catch (error) {
        console.error(`Error updating staff wage in database:`, error);
        // We'll continue anyway and update the local state
      }
    }
    
    // Update local state if needed
    if (!this.game.dbInitialized) {
      // Find staff in local state
      const localStaff = this.getStaffFromMemory(staffId);
      if (localStaff) {
        localStaff.wage = newWage;
        localStaff.morale = Math.max(0, Math.min(100, localStaff.morale + moraleChange));
        
        // Check if staff might quit due to pay cut
        if (changePercent < -5 && localStaff.morale < 30 && Math.random() < 0.3) {
          this.fireStaffInMemory(staffId);
          this.logError(`${staff.name} quit due to the pay cut!`);
          return true; // Still return true as the action was completed
        }
      }
    }
    
    // Display appropriate message
    if (messageType === 'success') {
      this.logSuccess(message);
    } else if (messageType === 'warning') {
      this.logWarning(message);
    } else {
      this.logInfo(message);
    }
    
    this.logInfo(`${staff.name}'s wage adjusted to €${newWage}.`);
    return true;
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

module.exports = StaffOperations;