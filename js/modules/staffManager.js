// staffManager.js - Main coordinator for staff-related functionality

const StaffGenerator = require('./staff/staffGenerator');
const StaffOperations = require('./staff/staffOperations');
const StaffBehavior = require('./staff/staffBehavior');
const time = require('./time');
const { GAME_CONSTANTS } = require('../config');

class StaffManager {
  constructor(game) {
    this.game = game;
    
    // Initialize specialized modules
    this.generator = new StaffGenerator(game);
    this.operations = new StaffOperations(game);
    this.behavior = new StaffBehavior(game);
    
    // Staff pool for temporary storage (will be migrated to database fully)
    this.staffPool = [];
    
    // Register time-based events for staff updates
    if (time) {
      // Update staff every hour
      time.onHour(this.onHourUpdate.bind(this));
      // Process staff salary payments weekly
      time.onDay(this.onDayUpdate.bind(this));
    }
    
    // Initialize staff pool when the manager is created
    this.initializeStaffPool();
  }
  
  /**
   * Initialize the staff pool with available candidates
   * Uses database if available, falls back to in-memory generation
   */
  async initializeStaffPool() {
    try {
      if (this.game.dbInitialized) {
        // Check if staff already exists in the database
        const availableStaff = await this.game.dbAPI.staff.getAvailableStaff();
        
        if (availableStaff && availableStaff.length > 0) {
          this.staffPool = availableStaff;
          this.logInfo(`Loaded ${availableStaff.length} available staff from database.`);
        } else {
          // Generate initial staff pool in database
          await this.generator.generateInitialStaffPool();
          this.staffPool = await this.game.dbAPI.staff.getAvailableStaff();
          this.logInfo(`Generated new staff pool with ${this.staffPool.length} candidates.`);
        }
      } else {
        // Generate in-memory staff pool
        this.staffPool = this.generator.generateInMemoryStaffPool();
        this.logInfo(`Generated in-memory staff pool with ${this.staffPool.length} candidates.`);
      }
    } catch (error) {
      console.error('Error initializing staff pool:', error);
      this.logError('Failed to initialize staff pool. Using fallback candidates.');
      
      // Generate fallback in-memory staff pool
      this.staffPool = this.generator.generateInMemoryStaffPool();
    }
  }
  
  /**
   * Called at the beginning of each game hour
   * @param {Object} gameTime - Current game time
   */
  async onHourUpdate(gameTime) {
    try {
      // Update staff working status and behavior
      await this.behavior.updateStaff();
      
      // Every 4 hours, refresh the available staff pool
      if (gameTime.hour % 4 === 0) {
        await this.refreshStaffPool();
      }
    } catch (error) {
      console.error('Error in staff hourly update:', error);
    }
  }
  
  /**
   * Called at the beginning of each game day
   * @param {Object} gameTime - Current game time
   */
  async onDayUpdate(gameTime) {
    try {
      // Process weekly staff payments on Mondays (dayOfWeek = 1)
      if (gameTime.dayOfWeek === 1) {
        await this.processStaffPayments();
      }
      
      // Random staff events based on the day
      await this.processRandomStaffEvents(gameTime);
    } catch (error) {
      console.error('Error in staff daily update:', error);
    }
  }
  
  /**
   * Process staff salary payments (weekly)
   */
  async processStaffPayments() {
    try {
      if (!this.game.state.currentVenue) return;
      
      const venueId = this.game.state.currentVenue.id;
      
      // Get all staff for the current venue
      const venueStaff = await this.getStaffByVenue(venueId);
      if (!venueStaff || venueStaff.length === 0) return;
      
      // Calculate total wages
      const totalWages = venueStaff.reduce((sum, staff) => sum + staff.wage, 0);
      
      // Check if enough cash is available
      if (this.game.state.player.cash < totalWages) {
        this.logError(`Insufficient funds to pay staff wages! Need €${totalWages}.`);
        
        // Attempt to pay partial wages
        const partialPaymentRatio = this.game.state.player.cash / totalWages;
        
        // For each staff member, reduce morale based on missing payment
        for (const staff of venueStaff) {
          const moraleReduction = Math.ceil((1 - partialPaymentRatio) * 30); // Up to 30 points
          const newMorale = Math.max(0, staff.morale - moraleReduction);
          
          // Update staff morale in database or memory
          await this.operations.updateStaffMorale(staff.id, newMorale);
          
          // Staff might quit if morale drops too low
          if (newMorale < 20 && Math.random() < 0.5) {
            await this.fireStaff(staff.id);
            this.logError(`${staff.name} quit due to missed payment!`);
          }
        }
        
        // Record partial payment
        if (this.game.state.player.cash > 0) {
          // Record expense transaction
          if (this.game.financialManager) {
            await this.game.financialManager.recordExpense(
              'staff',
              'wages',
              this.game.state.player.cash,
              `Partial staff wages payment (${Math.round(partialPaymentRatio * 100)}%)`
            );
          }
          
          // Update player cash
          this.game.state.player.cash = 0;
        }
        
        return false;
      }
      
      // Pay full wages
      this.game.state.player.cash -= totalWages;
      
      // Record expense transaction
      if (this.game.financialManager) {
        await this.game.financialManager.recordExpense(
          'staff',
          'wages',
          totalWages,
          `Weekly staff wages for ${venueStaff.length} staff members`
        );
      }
      
      this.logInfo(`Paid €${totalWages} in weekly staff wages.`);
      return true;
    } catch (error) {
      console.error('Error processing staff payments:', error);
      this.logError('Error processing staff payments. Staff morale may decrease.');
      return false;
    }
  }
  
  /**
   * Generate random staff events based on the day
   * @param {Object} gameTime - Current game time
   */
  async processRandomStaffEvents(gameTime) {
    if (!this.game.state.currentVenue) return;
    
    try {
      // Get all staff for the current venue
      const venueStaff = await this.getStaffByVenue(this.game.state.currentVenue.id);
      if (!venueStaff || venueStaff.length === 0) return;
      
      // Get day of week as string
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayName = days[(gameTime.dayOfWeek - 1) % 7];
      
      // Each staff has a small chance of a random event
      for (const staff of venueStaff) {
        // Determine event chance based on personality and day of week
        let eventChance = 0.05; // 5% base chance
        
        // Weekend days have more events
        if (gameTime.dayOfWeek >= 5) {
          eventChance += 0.03;
        }
        
        // Staff personality affects event chance
        if (staff.personality && typeof staff.personality === 'object') {
          // Unreliable staff have more events
          if (staff.personality.reliability < 0) {
            eventChance += Math.abs(staff.personality.reliability) / 100;
          }
          
          // Creative staff have more positive events
          if (staff.personality.creativity > 0) {
            eventChance += (staff.personality.creativity / 100) * 0.05;
          }
        }
        
        // Roll for event
        if (Math.random() < eventChance) {
          await this.triggerRandomStaffEvent(staff, dayName);
        }
      }
    } catch (error) {
      console.error('Error processing random staff events:', error);
    }
  }
  
  /**
   * Trigger a random event for a specific staff member
   * @param {Object} staff - The staff member
   * @param {string} dayName - Name of the current game day
   */
  async triggerRandomStaffEvent(staff, dayName) {
    try {
      // Pool of possible events
      const events = [
        {
          id: 'sick_day',
          name: 'Sick Day',
          weight: 10,
          condition: () => true, // Always possible
          execute: async () => {
            this.logWarning(`${staff.name} has called in sick today (${dayName}).`);
            await this.operations.updateStaffWorkingStatus(staff.id, false);
            return true;
          }
        },
        {
          id: 'excellent_service',
          name: 'Excellent Service',
          weight: staff.morale > 70 ? 15 : 5,
          condition: () => staff.type === 'waiter' || staff.type === 'bartender',
          execute: async () => {
            this.logSuccess(`${staff.name} provided excellent service and received extra tips!`);
            
            // Increase venue reputation slightly
            if (this.game.state.currentVenue && this.game.state.currentVenue.stats) {
              const newPopularity = Math.min(100, this.game.state.currentVenue.stats.popularity + 1);
              
              if (this.game.dbInitialized) {
                await this.game.dbAPI.venue.updateVenueStats(this.game.state.currentVenue.id, {
                  popularity: newPopularity
                });
              } else {
                this.game.state.currentVenue.stats.popularity = newPopularity;
              }
            }
            
            // Increase staff morale
            const newMorale = Math.min(100, staff.morale + 5);
            await this.operations.updateStaffMorale(staff.id, newMorale);
            
            return true;
          }
        },
        {
          id: 'training_opportunity',
          name: 'Training Opportunity',
          weight: 8,
          condition: () => true, // Available for all staff
          execute: async () => {
            this.logInfo(`${staff.name} found a training opportunity to improve their skills.`);
            
            // Choose a random skill to improve
            const staffType = staff.type;
            if (GAME_CONSTANTS.STAFF_TYPES[staffType]) {
              const skills = GAME_CONSTANTS.STAFF_TYPES[staffType].skillNames;
              const randomSkill = skills[Math.floor(Math.random() * skills.length)];
              
              // Improve the skill
              const currentSkill = staff.skills[randomSkill] || 50;
              const skillIncrease = Math.floor(Math.random() * 5) + 1; // 1-5 point increase
              const newSkillValue = Math.min(100, currentSkill + skillIncrease);
              
              // Update the skill in database or memory
              if (this.game.dbInitialized) {
                const updatedSkills = {};
                updatedSkills[randomSkill] = newSkillValue;
                await this.game.dbAPI.staff.updateStaffSkills(staff.id, updatedSkills);
              } else {
                // Update in-memory
                const localStaff = this.getStaffFromMemory(staff.id);
                if (localStaff && localStaff.skills) {
                  localStaff.skills[randomSkill] = newSkillValue;
                }
              }
              
              this.logSuccess(`${staff.name}'s ${randomSkill} skill improved by ${skillIncrease} points!`);
            }
            
            return true;
          }
        }
      ];
      
      // Filter events by condition
      const possibleEvents = events.filter(event => event.condition());
      
      if (possibleEvents.length === 0) return false;
      
      // Select an event using weighted random selection
      const totalWeight = possibleEvents.reduce((sum, event) => sum + event.weight, 0);
      let randomWeight = Math.random() * totalWeight;
      
      for (const event of possibleEvents) {
        randomWeight -= event.weight;
        if (randomWeight <= 0) {
          // Execute the selected event
          return await event.execute();
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error triggering random staff event:', error);
      return false;
    }
  }
  
  /**
   * Refresh the staff pool with new candidates
   * Retains some existing candidates and adds new ones
   */
  async refreshStaffPool() {
    try {
      if (this.game.dbInitialized) {
        // Use database API to refresh the pool
        await this.game.dbAPI.staff.refreshAvailableStaff();
        
        // Update local pool from database
        this.staffPool = await this.game.dbAPI.staff.getAvailableStaff();
        
        this.logInfo(`Staff pool refreshed. ${this.staffPool.length} candidates available.`);
      } else {
        // Refresh in-memory staff pool
        this.staffPool = await this.generator.refreshInMemoryStaffPool(this.staffPool);
        this.logInfo(`Staff pool refreshed. ${this.staffPool.length} candidates available.`);
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing staff pool:', error);
      // Don't show error to user, just log to console
      return false;
    }
  }
  
  // Methods to access staff pool
  
  /**
   * Get all available staff candidates
   * @returns {Array} Array of staff objects
   */
  getStaffPool() {
    return [...this.staffPool];
  }
  
  /**
   * Get available staff of a specific type
   * @param {string} type - The staff type to filter by
   * @returns {Array} Array of staff objects of the specified type
   */
  getStaffPoolByType(type) {
    return this.staffPool.filter(staff => staff.type === type);
  }
  
  /**
   * Get staff pool grouped by type
   * @returns {Object} Staff categorized by type
   */
  getStaffPoolSummary() {
    // Group staff by type
    const staffByType = {};
    
    this.staffPool.forEach(staff => {
      if (!staffByType[staff.type]) {
        staffByType[staff.type] = [];
      }
      staffByType[staff.type].push(staff);
    });
    
    return staffByType;
  }
  
  /**
   * Get the current staff pool size
   * @returns {number} Number of available staff candidates
   */
  getStaffPoolSize() {
    return this.staffPool.length;
  }
  
  // Forward common operations to specialized modules
  
  /**
   * Hire staff for a venue
   * @param {string} staffId - ID of the staff to hire
   * @param {string} venueId - ID of the venue
   * @returns {Promise<boolean>} Success status
   */
  async hireStaff(staffId, venueId) {
    const result = await this.operations.hireStaff(staffId, venueId);
    
    // If hiring was successful, remove from the staff pool
    if (result) {
      const index = this.staffPool.findIndex(staff => staff.id === staffId);
      if (index !== -1) {
        this.staffPool.splice(index, 1);
      }
    }
    
    return result;
  }
  
  /**
   * Fire staff (remove from venue)
   * @param {string} staffId - ID of the staff to fire
   * @returns {Promise<boolean>} Success status
   */
  async fireStaff(staffId) {
    return await this.operations.fireStaff(staffId);
  }
  
  /**
   * Get staff by ID
   * @param {string} staffId - ID of the staff
   * @returns {Promise<Object|null>} Staff data or null if not found
   */
  async getStaff(staffId) {
    return await this.operations.getStaff(staffId);
  }
  
  /**
   * Get all staff in the game
   * @returns {Promise<Array>} Array of all staff
   */
  async getAllStaff() {
    return await this.operations.getAllStaff();
  }
  
  /**
   * Set all staff data (used for loading saved games)
   * @param {Array} staffData - Array of staff objects
   */
  setAllStaff(staffData) {
    // For compatibility with existing code
    this.game.state.staff = [...staffData];
  }
  
  /**
   * Get staff for a specific venue
   * @param {string} venueId - ID of the venue
   * @returns {Promise<Array>} Array of staff assigned to the venue
   */
  async getStaffByVenue(venueId) {
    return await this.operations.getStaffByVenue(venueId);
  }
  
  /**
   * Get staff from memory by ID (legacy/fallback)
   * @param {string} staffId - ID of the staff
   * @returns {Object|null} Staff object or null if not found
   */
  getStaffFromMemory(staffId) {
    return this.game.state.staff ? 
      this.game.state.staff.find(s => s.id === staffId) : null;
  }
  
  /**
   * Train staff to improve a specific skill
   * @param {string} staffId - ID of the staff
   * @param {string} skillToTrain - Skill name to improve
   * @returns {Promise<boolean>} Success status
   */
  async trainStaff(staffId, skillToTrain) {
    return await this.operations.trainStaff(staffId, skillToTrain);
  }
  
  /**
   * Adjust staff wage
   * @param {string} staffId - ID of the staff
   * @param {number} newWage - New wage amount
   * @returns {Promise<boolean>} Success status
   */
  async adjustStaffWage(staffId, newWage) {
    return await this.operations.adjustStaffWage(staffId, newWage);
  }
  
  /**
   * Get total staff cost for a venue
   * @param {string} venueId - ID of the venue
   * @returns {Promise<number>} Total wage cost
   */
  async getStaffCost(venueId) {
    return await this.behavior.getStaffCost(venueId);
  }
  
  /**
   * Get average staff morale for a venue
   * @param {string} venueId - ID of the venue
   * @returns {Promise<number>} Average morale (0-100)
   */
  async getAverageStaffMorale(venueId) {
    return await this.behavior.getAverageStaffMorale(venueId);
  }
  
  /**
   * Update all staff (triggered by game loop)
   */
  async updateStaff() {
    await this.behavior.updateStaff();
  }
  
  /**
   * Set the working schedule for a staff member
   * @param {string} staffId - ID of the staff
   * @param {Array<boolean>} workingDays - Array of 7 booleans for each day of week
   * @param {Object} workingHours - Object with start and end hours
   * @returns {Promise<boolean>} Success status
   */
  async setStaffSchedule(staffId, workingDays, workingHours) {
    try {
      // Validate parameters
      if (!Array.isArray(workingDays) || workingDays.length !== 7) {
        throw new Error('Working days must be an array of 7 boolean values');
      }
      
      if (!workingHours || typeof workingHours !== 'object' || 
          workingHours.start === undefined || workingHours.end === undefined) {
        throw new Error('Working hours must include start and end times');
      }
      
      // Get the staff member
      const staff = await this.getStaff(staffId);
      if (!staff) {
        throw new Error('Staff member not found');
      }
      
      // Update the schedule in database if available
      if (this.game.dbInitialized) {
        return await this.game.dbAPI.staff.updateStaff(staffId, {
          workingDays,
          workingHours
        });
      } else {
        // Update in memory
        const localStaff = this.getStaffFromMemory(staffId);
        if (localStaff) {
          localStaff.workingDays = workingDays;
          localStaff.workingHours = workingHours;
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Error setting staff schedule:', error);
      this.logError(`Could not update ${staffId}'s schedule: ${error.message}`);
      return false;
    }
  }
  
  // Logging helpers with NotificationManager integration
  
  /**
   * Log info message
   * @param {string} message - Message to log
   */
  logInfo(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.info(message);
    } else if (window.logToConsole) {
      window.logToConsole(message, 'info');
    } else {
      console.log(message);
    }
  }
  
  /**
   * Log success message
   * @param {string} message - Message to log
   */
  logSuccess(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.success(message);
    } else if (window.logToConsole) {
      window.logToConsole(message, 'success');
    } else {
      console.log(message);
    }
  }
  
  /**
   * Log warning message
   * @param {string} message - Message to log
   */
  logWarning(message) {
    if (this.game.notificationManager) {
      this.game.notificationManager.warning(message);
    } else if (window.logToConsole) {
      window.logToConsole(message, 'warning');
    } else {
      console.warn(message);
    }
  }
  
  /**
   * Log error message
   * @param {string} message - Message to log
   */
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

module.exports = StaffManager;