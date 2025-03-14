// staffGenerator.js - Handles staff generation and attributes

const { GAME_CONSTANTS, STAFF_TYPES } = require('../../config');

class StaffGenerator {
  constructor(game) {
    this.game = game;
  }
  
  generateStaffMember(type) {
    if (!STAFF_TYPES[type]) return null;
    
    // Generate name
    const firstNames = ['Alex', 'Jamie', 'Jordan', 'Casey', 'Sam', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Avery', 
                       'Charlie', 'Finley', 'Skyler', 'Reese', 'Emerson', 'Sascha', 'Drew', 'Parker'];
    const lastNames = ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Walker', 'Wright', 'Edwards', 'Green', 
                      'Lewis', 'Wood', 'Harris', 'Martin', 'White', 'Clarke', 'Robinson', 'Garcia', 'Lee'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Calculate base wage based on city's wage multiplier
    const cityMultiplier = this.game.cityManager ? 
                          this.game.cityManager.getCityWageMultiplier(this.game.state.currentCity) : 1;
    const baseWage = STAFF_TYPES[type].baseSalary * cityMultiplier;
    
    // Generate skills
    const skills = {};
    STAFF_TYPES[type].skillNames.forEach(skillName => {
      // Skills range from 30-100
      skills[skillName] = 30 + Math.floor(Math.random() * 70);
    });
    
    // Higher skills mean higher wage demands
    const averageSkill = Object.values(skills).reduce((sum, value) => sum + value, 0) / 
                        Object.values(skills).length;
    const skillMultiplier = 0.7 + (averageSkill / 100) * 0.6;
    
    const wage = Math.round(baseWage * skillMultiplier);
    
    // Generate personality traits
    const personalityTraits = this.generatePersonalityTraits();
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: `${firstName} ${lastName}`,
      type: type,
      skills: skills,
      wage: wage,
      experience: Math.floor(Math.random() * 10), // 0-9 years
      personality: personalityTraits,
      morale: 80 + Math.floor(Math.random() * 20), // 80-99 to start
      hireDate: null,
      workingDays: this.generateWorkingDays(),
      workingHours: this.generateWorkingHours(type)
    };
  }
  
  generatePersonalityTraits() {
    const traits = {
      friendliness: 0, // -10 to 10, higher is more friendly
      reliability: 0, // -10 to 10, higher is more reliable
      energy: 0, // -10 to 10, higher is more energetic
      creativity: 0 // -10 to 10, higher is more creative
    };
    
    // Randomly assign trait values
    Object.keys(traits).forEach(trait => {
      traits[trait] = Math.floor(Math.random() * 21) - 10;
    });
    
    return traits;
  }
  
  generateWorkingDays() {
    // By default, make staff available 5 days a week with weekends more likely to be worked
    const days = [false, false, false, false, false, false, false]; // Sunday to Saturday
    let daysAssigned = 0;
    
    // Assign 5 working days
    while (daysAssigned < 5) {
      // Weights for days: higher for Friday/Saturday
      const dayWeights = [0.5, 1, 1, 1, 1, 1.5, 1.5]; // Sunday to Saturday
      
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
  
  async generateInitialStaffPool() {
    // Check if we can use the database
    if (this.game.dbInitialized) {
      try {
        // Check if staff pool already exists in database
        const availableStaff = await this.game.dbAPI.staff.getAvailableStaff();
        
        // Only generate new staff if the pool is too small
        if (availableStaff.length < 10) {
          await this.generateNewDbStaffPool();
        }
        
        return availableStaff;
      } catch (error) {
        console.error('Error generating initial staff pool from database:', error);
        // Fall back to in-memory generation
        return this.generateInMemoryStaffPool();
      }
    } else {
      // Generate in-memory staff pool
      return this.generateInMemoryStaffPool();
    }
  }
  
  async generateNewDbStaffPool() {
    // Generate several potential staff members of each type in the database
    for (const type of Object.keys(STAFF_TYPES)) {
      for (let i = 0; i < 3; i++) {
        const newStaff = this.generateStaffMember(type);
        await this.game.dbAPI.staff.createStaff(newStaff);
      }
    }
  }
  
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
  
  async refreshStaffPool(currentStaffPool) {
    if (this.game.dbInitialized) {
      try {
        // Let the database handle staff pool refreshing
        await this.game.dbAPI.staff.refreshStaffPool();
        return await this.game.dbAPI.staff.getAvailableStaff();
      } catch (error) {
        console.error('Error refreshing staff pool from database:', error);
        // Fall back to in-memory refresh
        return this.refreshInMemoryStaffPool(currentStaffPool);
      }
    } else {
      // Refresh in-memory staff pool
      return this.refreshInMemoryStaffPool(currentStaffPool);
    }
  }
  
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
}

module.exports = StaffGenerator;