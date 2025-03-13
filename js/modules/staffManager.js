// Staff Manager - Handles staff hiring, firing, and management

const { GAME_CONSTANTS, STAFF_TYPES } = require('../config');

class StaffManager {
  constructor(game) {
    this.game = game;
    this.staffPool = [];
    this.generateInitialStaffPool();
  }
  
  generateInitialStaffPool() {
    // Generate a pool of potential staff to hire
    this.staffPool = [];
    
    // Generate several potential staff members of each type
    Object.keys(STAFF_TYPES).forEach(type => {
      for (let i = 0; i < 3; i++) {
        this.staffPool.push(this.generateStaffMember(type));
      }
    });
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
  
  refreshStaffPool() {
    // Replace a portion of the staff pool with new candidates
    const retainCount = Math.floor(this.staffPool.length * 0.7); // Keep 70%
    
    // Sort by quality so we keep the best candidates
    this.staffPool.sort((a, b) => {
      const aAvgSkill = Object.values(a.skills).reduce((sum, val) => sum + val, 0) / Object.values(a.skills).length;
      const bAvgSkill = Object.values(b.skills).reduce((sum, val) => sum + val, 0) / Object.values(b.skills).length;
      return bAvgSkill - aAvgSkill;
    });
    
    // Keep the top candidates
    this.staffPool = this.staffPool.slice(0, retainCount);
    
    // Add new candidates
    const newCandidateCount = Math.floor(Math.random() * 5) + 3; // 3-7 new candidates
    
    for (let i = 0; i < newCandidateCount; i++) {
      const staffTypes = Object.keys(STAFF_TYPES);
      const randomType = staffTypes[Math.floor(Math.random() * staffTypes.length)];
      this.staffPool.push(this.generateStaffMember(randomType));
    }
  }
  
  getStaffPool() {
    return [...this.staffPool];
  }
  
  getStaffPoolByType(type) {
    return this.staffPool.filter(staff => staff.type === type);
  }
  
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
  
  hireStaff(staffId, venueId) {
    // Find the staff in the pool
    const staffIndex = this.staffPool.findIndex(staff => staff.id === staffId);
    if (staffIndex === -1) {
      window.logToConsole("Staff member not found in pool.", 'error');
      return false;
    }
    
    // Get the venue
    const venue = this.game.venueManager.getVenue(venueId);
    if (!venue) {
      window.logToConsole("Venue not found.", 'error');
      return false;
    }
    
    // Check if venue has reached staff limit
    if (venue.staff.length >= GAME_CONSTANTS.MAX_STAFF) {
      window.logToConsole(`You've reached the maximum staff limit (${GAME_CONSTANTS.MAX_STAFF}).`, 'error');
      return false;
    }
    
    // Check if player has enough cash for first wage payment
    const staff = this.staffPool[staffIndex];
    if (this.game.state.player.cash < staff.wage) {
      window.logToConsole(`Not enough cash to hire staff. You need €${staff.wage}.`, 'error');
      return false;
    }
    
    // Copy staff member and update
    const hiredStaff = { ...staff };
    hiredStaff.hireDate = { ...this.game.timeManager.getGameTime() };
    hiredStaff.venue = venueId;
    
    // Add to venue's staff list
    venue.staff.push(hiredStaff.id);
    
    // Remove from staff pool
    this.staffPool.splice(staffIndex, 1);
    
    // Add to game's staff list
    if (!this.game.state.staff) {
      this.game.state.staff = [];
    }
    this.game.state.staff.push(hiredStaff);
    
    window.logToConsole(`Hired ${hiredStaff.name} as a ${STAFF_TYPES[hiredStaff.type].description} for €${hiredStaff.wage}/week.`, 'success');
    return true;
  }
  
  fireStaff(staffId) {
    // Find the staff member
    const staffIndex = this.game.state.staff.findIndex(staff => staff.id === staffId);
    if (staffIndex === -1) {
      window.logToConsole("Staff member not found.", 'error');
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
    
    window.logToConsole(`Fired ${staff.name}.`, 'info');
    return true;
  }
  
  getStaff(staffId) {
    return this.game.state.staff ? this.game.state.staff.find(staff => staff.id === staffId) : null;
  }
  
  getAllStaff() {
    return this.game.state.staff ? [...this.game.state.staff] : [];
  }
  
  setAllStaff(staffData) {
    this.game.state.staff = [...staffData];
  }
  
  getStaffByVenue(venueId) {
    if (!this.game.state.staff) return [];
    return this.game.state.staff.filter(staff => staff.venue === venueId);
  }
  
  updateStaff() {
    // Skip if no staff
    if (!this.game.state.staff || this.game.state.staff.length === 0) return;
    
    // Update each staff member
    this.game.state.staff.forEach(staff => {
      // Check if staff should be working now
      const isWorkDay = this.isWorkingDay(staff);
      const isWorkHour = this.isWorkingHour(staff);
      staff.isWorking = isWorkDay && isWorkHour;
      
      // Update morale based on various factors
      this.updateStaffMorale(staff);
      
      // Random chance of staff-related events
      this.checkForStaffEvents(staff);
    });
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
  
  updateStaffMorale(staff) {
    // Factors affecting morale:
    // 1. Venue popularity (popular venues are more satisfying to work at)
    // 2. Workload (too many customers per staff = stress)
    // 3. Pay relative to skill level
    // 4. How long they've worked without a break
    
    let moraleChange = 0;
    
    // Get venue
    const venue = this.game.venueManager.getVenue(staff.venue);
    if (!venue) return;
    
    // Venue popularity effect
    moraleChange += (venue.stats.popularity - 50) / 200; // -0.25 to +0.25
    
    // Workload effect
    const customerCount = this.game.customerManager ? 
                          this.game.customerManager.getCurrentCustomerCount() : 0;
    const staffCount = venue.staff.length;
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
    if (staff.isWorking) {
      moraleChange -= 0.05; // Just a small decrease while working
    } else {
      moraleChange += 0.1; // Recovery while not working
    }
    
    // Apply personality effects
    moraleChange += (staff.personality.energy / 100) * 0.1; // Energy helps maintain morale
    
    // Apply the change
    staff.morale += moraleChange;
    
    // Clamp morale between 0 and 100
    if (staff.morale < 0) staff.morale = 0;
    if (staff.morale > 100) staff.morale = 100;
    
    // If morale gets very low, there's a chance the staff member quits
    if (staff.morale < 20 && Math.random() < 0.01) {
      this.staffQuits(staff.id);
    }
  }
  
  staffQuits(staffId) {
    const staff = this.getStaff(staffId);
    if (!staff) return;
    
    window.logToConsole(`${staff.name} has quit due to low morale!`, 'error');
    this.fireStaff(staffId);
  }
  
  checkForStaffEvents(staff) {
    // Skip if not working
    if (!staff.isWorking) return;
    
    // Random events based on staff personality and skills
    const eventRoll = Math.random();
    
    if (eventRoll < 0.003) { // Very rare events
      // Determine the type of event based on staff traits
      if (staff.personality.reliability < -5 && eventRoll < 0.001) {
        // Unreliable staff might not show up
        window.logToConsole(`${staff.name} didn't show up for work today.`, 'error');
        staff.isWorking = false;
        staff.morale -= 5;
      } else if (staff.personality.creativity > 5 && staff.type === 'cook' && eventRoll < 0.002) {
        // Creative cook comes up with a special dish
        window.logToConsole(`${staff.name} created a special dish that customers love!`, 'success');
        const venue = this.game.venueManager.getVenue(staff.venue);
        if (venue) {
          venue.stats.popularity += 1;
          venue.stats.customerSatisfaction += 2;
        }
        staff.morale += 10;
      } else if (staff.personality.friendliness > 5 && (staff.type === 'waiter' || staff.type === 'bartender') && eventRoll < 0.003) {
        // Friendly staff gets good tips
        window.logToConsole(`${staff.name} received excellent tips today!`, 'success');
        staff.morale += 5;
      }
    }
  }
  
  trainStaff(staffId, skillToTrain) {
    const staff = this.getStaff(staffId);
    if (!staff) {
      window.logToConsole("Staff member not found.", 'error');
      return false;
    }
    
    // Check if the skill exists for this staff type
    if (!STAFF_TYPES[staff.type].skillNames.includes(skillToTrain)) {
      window.logToConsole(`${staff.type} cannot be trained in ${skillToTrain}.`, 'error');
      return false;
    }
    
    // Calculate training cost - higher for higher current skill
    const currentSkill = staff.skills[skillToTrain];
    const trainingCost = 50 + Math.round(currentSkill * 0.5);
    
    // Check if player has enough cash
    if (this.game.state.player.cash < trainingCost) {
      window.logToConsole(`Not enough cash for training. Need €${trainingCost}.`, 'error');
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
    staff.skills[skillToTrain] = Math.min(100, currentSkill + skillIncrease);
    
    // Deduct cost
    this.game.state.player.cash -= trainingCost;
    
    // Boost morale slightly
    staff.morale = Math.min(100, staff.morale + 5);
    
    window.logToConsole(`Trained ${staff.name} in ${skillToTrain}. Skill increased by ${skillIncrease} to ${staff.skills[skillToTrain]}.`, 'success');
    return true;
  }
  
  adjustStaffWage(staffId, newWage) {
    const staff = this.getStaff(staffId);
    if (!staff) {
      window.logToConsole("Staff member not found.", 'error');
      return false;
    }
    
    // Validate wage (must be positive)
    if (newWage <= 0) {
      window.logToConsole("Wage must be positive.", 'error');
      return false;
    }
    
    // Calculate minimum acceptable wage based on skills
    const averageSkill = Object.values(staff.skills).reduce((sum, val) => sum + val, 0) / 
                        Object.values(staff.skills).length;
    const minAcceptableWage = STAFF_TYPES[staff.type].baseSalary * 0.7;
    
    if (newWage < minAcceptableWage) {
      window.logToConsole(`${staff.name} won't accept a wage below €${minAcceptableWage}.`, 'error');
      return false;
    }
    
    // Calculate wage change percentage for morale effect
    const changePercent = (newWage - staff.wage) / staff.wage * 100;
    
    // Update wage
    staff.wage = newWage;
    
    // Adjust morale based on change
    if (changePercent > 5) {
      // Significant raise
      staff.morale = Math.min(100, staff.morale + 10);
      window.logToConsole(`${staff.name} is very happy with the raise!`, 'success');
    } else if (changePercent > 0) {
      // Small raise
      staff.morale = Math.min(100, staff.morale + 5);
      window.logToConsole(`${staff.name} appreciates the raise.`, 'success');
    } else if (changePercent < -5) {
      // Significant pay cut
      staff.morale = Math.max(0, staff.morale - 15);
      window.logToConsole(`${staff.name} is upset about the pay cut.`, 'warning');
      
      // Risk of quitting if morale is too low
      if (staff.morale < 30 && Math.random() < 0.3) {
        window.logToConsole(`${staff.name} quit due to the pay cut!`, 'error');
        this.fireStaff(staffId);
        return true; // Still return true as the action was completed
      }
    } else {
      // Small pay cut
      staff.morale = Math.max(0, staff.morale - 8);
      window.logToConsole(`${staff.name} is not happy about the pay cut.`, 'warning');
    }
    
    window.logToConsole(`${staff.name}'s wage adjusted to €${newWage}.`, 'info');
    return true;
  }
  
  getStaffCost(venueId) {
    const staff = this.getStaffByVenue(venueId);
    return staff.reduce((total, member) => total + member.wage, 0);
  }
  
  getAverageStaffMorale(venueId) {
    const staff = this.getStaffByVenue(venueId);
    if (staff.length === 0) return 0;
    
    const totalMorale = staff.reduce((total, member) => total + member.morale, 0);
    return totalMorale / staff.length;
  }
}

module.exports = StaffManager;