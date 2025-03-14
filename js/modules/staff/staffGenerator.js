// staffGenerator.js - Handles staff generation and attributes

const { GAME_CONSTANTS, STAFF_TYPES } = require('../../config');
const { v4: uuidv4 } = require('uuid');
const names = require('../names');  // Import the centralized names module

class StaffGenerator {
  constructor(game) {
    this.game = game;
  }
  
  /**
   * Generate a staff member with random attributes
   * @param {string} type - Staff type (e.g., 'bartender', 'waiter')
   * @returns {Object} Staff member object
   */
  generateStaffMember(type) {
    // Make sure the staff type is valid
    if (!STAFF_TYPES[type]) {
      console.error(`Invalid staff type: ${type}`);
      return null;
    }
    
    // Generate unique ID
    const id = uuidv4();
    
    // Generate name using the names module
    const name = names.generatePersonName();
    
    // Calculate base wage based on city's wage multiplier
    const cityMultiplier = this.getCityWageMultiplier();
    const baseWage = STAFF_TYPES[type].baseSalary * cityMultiplier;
    
    // Generate skills based on staff type
    const skills = this.generateSkills(type);
    
    // Higher skills mean higher wage demands
    const averageSkill = Object.values(skills).reduce((sum, value) => sum + value, 0) / 
                        Object.values(skills).length;
    const skillMultiplier = 0.7 + (averageSkill / 100) * 0.6;
    
    // Calculate final wage
    const wage = Math.round(baseWage * skillMultiplier);
    
    // Generate personality traits
    const personalityTraits = this.generatePersonalityTraits();
    
    // Generate working schedule
    const workingDays = this.generateWorkingDays();
    const workingHours = this.generateWorkingHours(type);
    
    // Return the complete staff member object
    return {
      id,
      name,
      type,
      skills,
      wage,
      experience: Math.floor(Math.random() * 10), // 0-9 years
      personality: personalityTraits,
      morale: 80 + Math.floor(Math.random() * 20), // 80-99 to start
      hireDate: null,
      isWorking: false,
      workingDays,
      workingHours
    };
  }
  
  /**
   * Get city wage multiplier
   * @returns {number} Wage multiplier for the current city
   */
  getCityWageMultiplier() {
    if (this.game.cityManager && typeof this.game.cityManager.getCityWageMultiplier === 'function') {
      return this.game.cityManager.getCityWageMultiplier(this.game.state.currentCity);
    }
    
    // Fallback to hardcoded values if cityManager not available
    const cityMultipliers = {
      'London': 1.5,
      'Berlin': 1.2,
      'Paris': 1.4,
      'Madrid': 1.1,
      'Rome': 1.3
    };
    
    return cityMultipliers[this.game.state.currentCity] || 1.0;
  }
  
  /**
   * Generate skills for a specific staff type
   * @param {string} type - Staff type
   * @returns {Object} Skills object
   */
  generateSkills(type) {
    const skills = {};
    
    // Make sure the staff type is valid
    if (!STAFF_TYPES[type] || !STAFF_TYPES[type].skillNames) {
      return skills; // Return empty skills if type invalid
    }
    
    // Generate each skill with random value (30-80 base range)
    STAFF_TYPES[type].skillNames.forEach(skillName => {
      skills[skillName] = 30 + Math.floor(Math.random() * 51);
    });
    
    // Occasionally add an exceptional skill (80-100)
    if (Math.random() < 0.2) { // 20% chance
      const skillNames = STAFF_TYPES[type].skillNames;
      const randomSkill = skillNames[Math.floor(Math.random() * skillNames.length)];
      skills[randomSkill] = 80 + Math.floor(Math.random() * 21);
    }
    
    return skills;
  }
  
  /**
   * Generate personality traits
   * @returns {Object} Personality traits object
   */
  generatePersonalityTraits() {
    // Default traits
    const traits = {
      friendliness: 0, // -10 to 10, higher is more friendly
      reliability: 0, // -10 to 10, higher is more reliable
      energy: 0, // -10 to 10, higher is more energetic
      creativity: 0 // -10 to 10, higher is more creative
    };
    
    // Generate random values for each trait
    Object.keys(traits).forEach(trait => {
      traits[trait] = Math.floor(Math.random() * 21) - 10;
    });
    
    return traits;
  }
  
  /**
   * Generate working days schedule
   * @returns {Array<boolean>} Working days array (7 elements for Sunday-Saturday)
   */
  generateWorkingDays() {
    // By default, assign 5 working days
    const days = [false, false, false, false, false, false, false]; // Sunday to Saturday
    let daysAssigned = 0;
    
    // Weights for days: higher for Friday/Saturday
    const dayWeights = [0.5, 1, 1, 1, 1, 1.5, 1.5]; // Sunday to Saturday
    
    // Assign 5 working days based on weights
    while (daysAssigned < 5) {
      // Normalize weights for days that haven't been assigned yet
      let totalWeights = 0;
      for (let i = 0; i < 7; i++) {
        if (!days[i]) {
          totalWeights += dayWeights[i];
        }
      }
      
      // Pick a day based on weights
      let randomWeight = Math.random() * totalWeights;
      let cumulativeWeight = 0;
      let selectedDay = -1;
      
      for (let i = 0; i < 7; i++) {
        if (!days[i]) {
          cumulativeWeight += dayWeights[i];
          if (randomWeight <= cumulativeWeight) {
            selectedDay = i;
            break;
          }
        }
      }
      
      // Mark the day as working
      if (selectedDay >= 0) {
        days[selectedDay] = true;
        daysAssigned++;
      }
    }
    
    return days;
  }
  
  /**
   * Generate working hours
   * @param {string} staffType - Staff type
   * @returns {Object} Working hours object with start and end properties
   */
  generateWorkingHours(staffType) {
    // Different staff types have different typical hours
    let startHour, endHour;
    
    switch(staffType) {
      case 'bartender':
        // Bartenders work evening/night shifts
        startHour = 16 + Math.floor(Math.random() * 2); // 16-17
        endHour = startHour + 8; // 8-hour shift
        break;
      case 'waiter':
        // Waiters might work lunch or dinner
        if (Math.random() < 0.5) {
          startHour = 11; // Lunch shift
          endHour = 19;
        } else {
          startHour = 16; // Dinner shift
          endHour = 24;
        }
        break;
      case 'cook':
        // Cooks start early to prep
        startHour = 9 + Math.floor(Math.random() * 2); // 9-10
        endHour = startHour + 8; // 8-hour shift
        break;
      case 'bouncer':
        // Bouncers work nights
        startHour = 20;
        endHour = 4; // Into the next day
        break;
      case 'dj':
        // DJs work nights
        startHour = 21;
        endHour = 3; // Into the next day
        break;
      case 'manager':
        // Managers work during business hours
        startHour = 10;
        endHour = 18;
        break;
      case 'cleaner':
        // Cleaners often work before opening or after closing
        if (Math.random() < 0.5) {
          startHour = 5; // Morning shift
          endHour = 13;
        } else {
          startHour = 22; // Night shift
          endHour = 6; // Into the next day
        }
        break;
      default:
        // Default 8-hour shift
        startHour = 9;
        endHour = 17;
    }
    
    return { start: startHour, end: endHour };
  }
  
  /**
   * Initialize staff pool with new candidates
   * @returns {Promise<Array>} Array of generated staff
   */
  async generateInitialStaffPool() {
    try {
      if (this.game.dbInitialized) {
        // Generate staff members in the database
        const staffBatch = [];
        
        // Generate several of each staff type
        Object.keys(STAFF_TYPES).forEach(type => {
          for (let i = 0; i < 3; i++) {
            staffBatch.push(this.generateStaffMember(type));
          }
        });
        
        // Insert all staff in a single transaction
        const createdStaff = await this.game.dbAPI.staff.createStaffBatch(staffBatch);
        
        return createdStaff;
      } else {
        // Generate in-memory staff pool
        return this.generateInMemoryStaffPool();
      }
    } catch (error) {
      console.error('Error generating initial staff pool:', error);
      // Fall back to in-memory generation
      return this.generateInMemoryStaffPool();
    }
  }
  
  /**
   * Generate in-memory staff pool
   * @returns {Array} Array of staff objects
   */
  generateInMemoryStaffPool() {
    const staffPool = [];
    
    // Generate several potential staff members of each type
    Object.keys(STAFF_TYPES).forEach(type => {
      for (let i = 0; i < 3; i++) {
        staffPool.push(this.generateStaffMember(type));
      }
    });
    
    return staffPool;
  }
  
  /**
   * Refresh the staff pool by replacing some candidates with new ones
   * @param {Array} currentStaffPool - Current staff pool
   * @returns {Array} Updated staff pool
   */
  refreshInMemoryStaffPool(currentStaffPool) {
    // Replace a portion of the staff pool with new candidates
    const retainCount = Math.floor(currentStaffPool.length * 0.7); // Keep 70%
    
    // Sort by quality so we keep the best candidates
    const sortedPool = [...currentStaffPool].sort((a, b) => {
      const aAvgSkill = Object.values(a.skills).reduce((sum, val) => sum + val, 0) / Object.values(a.skills).length;
      const bAvgSkill = Object.values(b.skills).reduce((sum, val) => sum + val, 0) / Object.values(b.skills).length;
      return bAvgSkill - aAvgSkill;
    });
    
    // Keep the top candidates
    const updatedPool = sortedPool.slice(0, retainCount);
    
    // Add new candidates
    const newCandidateCount = Math.floor(Math.random() * 5) + 3; // 3-7 new candidates
    
    for (let i = 0; i < newCandidateCount; i++) {
      const staffTypes = Object.keys(STAFF_TYPES);
      const randomType = staffTypes[Math.floor(Math.random() * staffTypes.length)];
      updatedPool.push(this.generateStaffMember(randomType));
    }
    
    return updatedPool;
  }
  
  /**
   * Generate staff candidates for the database
   * @param {number} count - Number of candidates to generate
   * @returns {Promise<Array>} Array of created staff
   */
  async generateCandidatesInDatabase(count = 5) {
    try {
      if (!this.game.dbInitialized) {
        throw new Error('Database not initialized');
      }
      
      const staffBatch = [];
      
      // Determine distribution - randomize staff types but ensure variety
      const staffTypes = Object.keys(STAFF_TYPES);
      const typeDistribution = {};
      
      // Initialize count for each type
      staffTypes.forEach(type => typeDistribution[type] = 0);
      
      // Generate random distribution ensuring at least one of each type if possible
      for (let i = 0; i < count; i++) {
        // If first pass, distribute evenly across types
        if (i < staffTypes.length) {
          typeDistribution[staffTypes[i]]++;
        } else {
          // After first pass, distribute randomly with higher weight for common types
          const weights = {
            'bartender': 2,
            'waiter': 2,
            'cook': 1.5,
            'bouncer': 1,
            'dj': 0.8,
            'manager': 0.5,
            'cleaner': 1.2
          };
          
          // Calculate total weights
          let totalWeight = 0;
          staffTypes.forEach(type => {
            totalWeight += weights[type] || 1;
          });
          
          // Random selection based on weights
          let random = Math.random() * totalWeight;
          let selectedType = staffTypes[0];
          
          for (const type of staffTypes) {
            random -= weights[type] || 1;
            if (random <= 0) {
              selectedType = type;
              break;
            }
          }
          
          typeDistribution[selectedType]++;
        }
      }
      
      // Generate staff based on distribution
      for (const type in typeDistribution) {
        for (let i = 0; i < typeDistribution[type]; i++) {
          staffBatch.push(this.generateStaffMember(type));
        }
      }
      
      // Insert all staff in a single transaction
      const createdStaff = await this.game.dbAPI.staff.createStaffBatch(staffBatch);
      
      return createdStaff;
    } catch (error) {
      console.error('Error generating candidates in database:', error);
      return [];
    }
  }
}

module.exports = StaffGenerator;