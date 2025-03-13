// js/ui/processor/staffCommands.js
// Handles staff-related commands for hiring, firing, and managing staff

/**
 * StaffCommands - Module for processing staff-related commands
 * @param {Object} game - Reference to the game instance
 */
class StaffCommands {
    constructor(game) {
      this.game = game;
    }
  
    /**
     * Process staff-related commands
     * @param {string} command - The command to process
     * @param {Array} args - The command arguments
     * @returns {boolean} True if the command was successfully processed
     */
    processCommand(command, args) {
      switch (command) {
        case 'hire':
        case 'hirestaff':
          return this.hireStaff(args);
        case 'fire':
        case 'firestaff':
          return this.fireStaff(args);
        case 'viewstaff':
        case 'staff':
          return this.viewStaff();
        case 'staffpool':
        case 'viewapplicants':
          return this.viewStaffPool();
        case 'train':
        case 'trainstaff':
          return this.trainStaff(args);
        case 'wage':
        case 'adjustwage':
          return this.adjustWage(args);
        case 'staffmenu':
          return this.showStaffMenu();
        case 'staffdetails':
        case 'staffinfo':
          return this.viewStaffDetails(args);
        default:
          return false;
      }
    }
  
    /**
     * Validate that a current venue is selected
     * @param {boolean} [showError=true] - Whether to show an error message if no venue is selected
     * @returns {boolean} - Whether a venue is selected
     */
    validateVenueExists(showError = true) {
      if (!this.game.state.currentVenue) {
        if (showError) {
          this.game.notificationManager.error("No venue is currently selected. Use 'selectvenue' command first.");
        }
        return false;
      }
      return true;
    }
  
    /**
     * Hire a staff member
     * @param {Array} args - Command arguments: [type or staff_id]
     * @returns {boolean} Success status
     */
    hireStaff(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: hire <staff_type> or hire <staff_id>");
        this.game.notificationManager.info("Available staff types: bartender, waiter, cook, bouncer, dj, manager, cleaner");
        this.game.notificationManager.info("Use 'staffpool' to see available candidates with their IDs");
        return false;
      }
  
      const staffTypes = ['bartender', 'waiter', 'cook', 'bouncer', 'dj', 'manager', 'cleaner'];
      const arg = args[0].toLowerCase();
  
      // Check if argument is a staff type
      if (staffTypes.includes(arg)) {
        // Show staff of the specified type from the pool
        const staffPool = this.game.staffManager.getStaffPoolByType(arg);
        
        if (!staffPool || staffPool.length === 0) {
          this.game.notificationManager.error(`No ${arg} candidates available right now.`);
          return false;
        }
  
        this.game.notificationManager.info(`Available ${arg} candidates:`);
        staffPool.forEach((staff, index) => {
          this.game.notificationManager.info(`${index + 1}. ${staff.name} - €${staff.wage}/week - ID: ${staff.id}`);
          
          // Display key skills
          const skillsText = Object.entries(staff.skills)
            .map(([skill, value]) => `${skill}: ${value}`)
            .join(', ');
          
          this.game.notificationManager.info(`   Skills: ${skillsText}`);
        });
        
        this.game.notificationManager.info(`Use 'hire <staff_id>' to hire a specific candidate.`);
        return true;
      }
  
      // Otherwise, try to hire by ID
      const staffId = arg;
      try {
        const success = this.game.staffManager.hireStaff(
          staffId, 
          this.game.state.currentVenue.id
        );
  
        if (success) {
          const staff = this.game.staffManager.getStaff(staffId);
          if (staff) {
            this.game.notificationManager.success(`Hired ${staff.name} as a ${staff.type}!`);
          } else {
            this.game.notificationManager.success(`Staff member hired successfully!`);
          }
          return true;
        } else {
          this.game.notificationManager.error("Failed to hire staff. Make sure you have enough cash and the staff member exists.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error hiring staff: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Fire a staff member
     * @param {Array} args - Command arguments: [staff_id or staff_index]
     * @returns {boolean} Success status
     */
    fireStaff(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: fire <staff_id> or fire <number>");
        this.game.notificationManager.info("Use 'viewstaff' to see your current staff with their IDs or numbers");
        return false;
      }
  
      const venueStaff = this.game.staffManager.getStaffByVenue(this.game.state.currentVenue.id);
      
      if (venueStaff.length === 0) {
        this.game.notificationManager.error("You don't have any staff at this venue.");
        return false;
      }
  
      // Try to parse as index first
      const index = parseInt(args[0], 10) - 1;
      let staffId;
      
      if (!isNaN(index) && index >= 0 && index < venueStaff.length) {
        staffId = venueStaff[index].id;
      } else {
        // Otherwise use the argument as ID
        staffId = args[0];
        
        // Check if the staff exists in this venue
        const staffExists = venueStaff.some(staff => staff.id === staffId);
        if (!staffExists) {
          this.game.notificationManager.error("Staff member not found at this venue.");
          return false;
        }
      }
  
      // Get the staff member's name for the notification
      const staffToFire = this.game.staffManager.getStaff(staffId);
      const staffName = staffToFire ? staffToFire.name : "Staff member";
  
      // Ask for confirmation
      if (confirm(`Are you sure you want to fire ${staffName}?`)) {
        try {
          const success = this.game.staffManager.fireStaff(staffId);
  
          if (success) {
            this.game.notificationManager.success(`${staffName} has been fired.`);
            return true;
          } else {
            this.game.notificationManager.error("Failed to fire staff member.");
            return false;
          }
        } catch (error) {
          this.game.notificationManager.error(`Error firing staff: ${error.message}`);
          return false;
        }
      } else {
        this.game.notificationManager.info("Staff firing cancelled.");
        return false;
      }
    }
  
    /**
     * View current staff at the venue
     * @returns {boolean} Success status
     */
    viewStaff() {
      if (!this.validateVenueExists()) return false;
  
      const staff = this.game.staffManager.getStaffByVenue(this.game.state.currentVenue.id);
      
      if (staff.length === 0) {
        this.game.notificationManager.info("You don't have any staff at this venue yet.");
        this.game.notificationManager.info("Use 'hire <staff_type>' to view candidates.");
        return true;
      }
  
      this.game.notificationManager.info(`=== Staff at ${this.game.state.currentVenue.name} ===`);
      
      // Group staff by type
      const staffByType = {};
      staff.forEach(member => {
        if (!staffByType[member.type]) {
          staffByType[member.type] = [];
        }
        staffByType[member.type].push(member);
      });
  
      // Display staff by type
      Object.entries(staffByType).forEach(([type, members]) => {
        this.game.notificationManager.info(`--- ${type.charAt(0).toUpperCase() + type.slice(1)}s ---`);
        
        members.forEach((member, index) => {
          const status = member.isWorking ? 'Working' : 'Off duty';
          
          this.game.notificationManager.info(`${index + 1}. ${member.name} - €${member.wage}/week - ${status} - ID: ${member.id}`);
          
          // Get average skill
          const avgSkill = Object.values(member.skills).reduce((sum, val) => sum + val, 0) / 
                          Object.values(member.skills).length;
                          
          this.game.notificationManager.info(`   Skill level: ${avgSkill.toFixed(1)} | Morale: ${member.morale.toFixed(1)}%`);
        });
      });
      
      return true;
    }
  
    /**
     * View available staff in the hiring pool
     * @returns {boolean} Success status
     */
    viewStaffPool() {
      if (!this.validateVenueExists()) return false;
  
      const staffPool = this.game.staffManager.getStaffPool();
      
      if (staffPool.length === 0) {
        this.game.notificationManager.info("There are no staff candidates available right now.");
        this.game.notificationManager.info("Try again later or use 'refreshstaffpool' to get new candidates.");
        return true;
      }
  
      this.game.notificationManager.info("=== Available Staff Candidates ===");
      
      // Group by type
      const staffByType = {};
      staffPool.forEach(staff => {
        if (!staffByType[staff.type]) {
          staffByType[staff.type] = [];
        }
        staffByType[staff.type].push(staff);
      });
  
      // Display staff by type
      Object.entries(staffByType).forEach(([type, members]) => {
        this.game.notificationManager.info(`--- ${type.charAt(0).toUpperCase() + type.slice(1)}s ---`);
        
        members.forEach((staff, index) => {
          this.game.notificationManager.info(`${index + 1}. ${staff.name} - €${staff.wage}/week - ID: ${staff.id}`);
          
          // Display key skills
          const skillsText = Object.entries(staff.skills)
            .map(([skill, value]) => `${skill}: ${value}`)
            .join(', ');
          
          this.game.notificationManager.info(`   Skills: ${skillsText}`);
        });
      });
      
      this.game.notificationManager.info("Use 'hire <staff_id>' to hire a candidate.");
      
      return true;
    }
  
    /**
     * Train a staff member in a specific skill
     * @param {Array} args - Command arguments: [staff_id, skill_name]
     * @returns {boolean} Success status
     */
    trainStaff(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 2) {
        this.game.notificationManager.error("Usage: train <staff_id> <skill_name>");
        this.game.notificationManager.info("Example: train 1234abcd customer_service");
        this.game.notificationManager.info("Available skills depend on staff type. Use 'staffdetails <staff_id>' to see available skills.");
        return false;
      }
  
      const staffId = args[0];
      const skill = args[1].toLowerCase();
  
      // Check if staff exists
      const staff = this.game.staffManager.getStaff(staffId);
      if (!staff) {
        this.game.notificationManager.error("Staff member not found.");
        return false;
      }
  
      // Check if staff belongs to this venue
      if (staff.venue !== this.game.state.currentVenue.id) {
        this.game.notificationManager.error("This staff member doesn't work at your current venue.");
        return false;
      }
  
      // Check if the skill exists for this staff
      if (!staff.skills || !Object.keys(staff.skills).includes(skill)) {
        this.game.notificationManager.error(`Invalid skill for ${staff.type}. Available skills: ${Object.keys(staff.skills).join(', ')}`);
        return false;
      }
  
      try {
        const success = this.game.staffManager.trainStaff(staffId, skill);
  
        if (success) {
          this.game.notificationManager.success(`${staff.name} has been trained in ${skill}!`);
          return true;
        } else {
          this.game.notificationManager.error("Training failed. Make sure you have enough cash.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error training staff: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Adjust a staff member's wage
     * @param {Array} args - Command arguments: [staff_id, new_wage]
     * @returns {boolean} Success status
     */
    adjustWage(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 2) {
        this.game.notificationManager.error("Usage: adjustwage <staff_id> <new_wage>");
        this.game.notificationManager.info("Example: adjustwage 1234abcd 600");
        return false;
      }
  
      const staffId = args[0];
      const newWage = parseFloat(args[1]);
  
      // Validate wage
      if (isNaN(newWage) || newWage <= 0) {
        this.game.notificationManager.error("Wage must be a positive number.");
        return false;
      }
  
      // Check if staff exists
      const staff = this.game.staffManager.getStaff(staffId);
      if (!staff) {
        this.game.notificationManager.error("Staff member not found.");
        return false;
      }
  
      // Check if staff belongs to this venue
      if (staff.venue !== this.game.state.currentVenue.id) {
        this.game.notificationManager.error("This staff member doesn't work at your current venue.");
        return false;
      }
  
      try {
        const success = this.game.staffManager.adjustStaffWage(staffId, newWage);
  
        if (success) {
          // Check if wage was increased or decreased
          if (newWage > staff.wage) {
            this.game.notificationManager.success(`${staff.name}'s wage increased to €${newWage}/week. They seem happy about it.`);
          } else if (newWage < staff.wage) {
            this.game.notificationManager.warning(`${staff.name}'s wage decreased to €${newWage}/week. They don't look pleased.`);
          } else {
            this.game.notificationManager.info(`${staff.name}'s wage remains €${newWage}/week.`);
          }
          return true;
        } else {
          this.game.notificationManager.error("Failed to adjust wage. The staff member may have quit due to a substantial pay cut.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error adjusting wage: ${error.message}`);
        return false;
      }
    }
  
    /**
     * View detailed information about a staff member
     * @param {Array} args - Command arguments: [staff_id]
     * @returns {boolean} Success status
     */
    viewStaffDetails(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: staffdetails <staff_id>");
        this.game.notificationManager.info("Use 'viewstaff' to see your staff with their IDs.");
        return false;
      }
  
      const staffId = args[0];
  
      // Check if staff exists
      const staff = this.game.staffManager.getStaff(staffId);
      if (!staff) {
        this.game.notificationManager.error("Staff member not found.");
        return false;
      }
  
      // Display staff details
      this.game.notificationManager.info(`=== ${staff.name} (${staff.type}) ===`);
      this.game.notificationManager.info(`Wage: €${staff.wage}/week | Experience: ${staff.experience} years`);
      this.game.notificationManager.info(`Morale: ${staff.morale.toFixed(1)}% | Status: ${staff.isWorking ? 'Working' : 'Off duty'}`);
      
      // Display skills
      this.game.notificationManager.info('--- Skills ---');
      Object.entries(staff.skills).forEach(([skill, value]) => {
        this.game.notificationManager.info(`${skill}: ${value}`);
      });
      
      // Display personality
      this.game.notificationManager.info('--- Personality ---');
      Object.entries(staff.personality).forEach(([trait, value]) => {
        // Convert numeric values to descriptive text
        let description;
        if (value > 7) description = 'Very high';
        else if (value > 3) description = 'High';
        else if (value > -3) description = 'Average';
        else if (value > -7) description = 'Low';
        else description = 'Very low';
        
        this.game.notificationManager.info(`${trait}: ${description} (${value})`);
      });
      
      // Display schedule
      this.game.notificationManager.info('--- Schedule ---');
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const workingDaysText = daysOfWeek
        .filter((_, index) => staff.workingDays[index])
        .join(', ');
      
      this.game.notificationManager.info(`Working days: ${workingDaysText}`);
      this.game.notificationManager.info(`Working hours: ${staff.workingHours.start}:00 - ${staff.workingHours.end}:00`);
      
      return true;
    }
  
    /**
     * Show staff management menu
     * @returns {boolean} Success status
     */
    showStaffMenu() {
      if (this.game.uiManager && this.game.uiManager.showStaffMenu) {
        this.game.uiManager.showStaffMenu();
        return true;
      } else {
        this.game.notificationManager.error("Menu functionality not available.");
        return false;
      }
    }
  }
  
  module.exports = StaffCommands;