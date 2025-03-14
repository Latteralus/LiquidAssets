// staffManager.js - Main coordinator for staff-related functionality

const StaffGenerator = require('./staff/staffGenerator');
const StaffOperations = require('./staff/staffOperations');
const StaffBehavior = require('./staff/staffBehavior');
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
    
    // Initialize staff pool
    this.initializeStaffPool();
  }
  
  async initializeStaffPool() {
    if (this.game.dbInitialized) {
      try {
        // Check if staff already exists in the database
        const availableStaff = await this.game.dbAPI.staff.getAvailableStaff();
        if (availableStaff.length > 0) {
          this.staffPool = availableStaff;
        } else {
          // Generate initial staff pool in database
          await this.generator.generateInitialStaffPool();
          this.staffPool = await this.game.dbAPI.staff.getAvailableStaff();
        }
      } catch (error) {
        console.error('Error initializing staff pool from database:', error);
        // Fall back to in-memory generation
        this.generateInitialStaffPool();
      }
    } else {
      // Generate in-memory staff pool
      this.generateInitialStaffPool();
    }
  }
  
  generateInitialStaffPool() {
    // Generate a pool of potential staff to hire
    this.staffPool = [];
    
    // Generate several potential staff members of each type
    Object.keys(GAME_CONSTANTS.STAFF_TYPES).forEach(type => {
      for (let i = 0; i < 3; i++) {
        this.staffPool.push(this.generator.generateStaffMember(type));
      }
    });
  }
  
  async refreshStaffPool() {
    if (this.game.dbInitialized) {
      try {
        // Refresh staff pool in database
        await this.game.dbAPI.staff.refreshStaffPool();
        // Get the updated pool
        this.staffPool = await this.game.dbAPI.staff.getAvailableStaff();
      } catch (error) {
        console.error('Error refreshing staff pool from database:', error);
        // Fall back to in-memory refresh
        this.refreshInMemoryStaffPool();
      }
    } else {
      // Refresh in-memory staff pool
      this.refreshInMemoryStaffPool();
    }
  }
  
  refreshInMemoryStaffPool() {
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
      const staffTypes = Object.keys(GAME_CONSTANTS.STAFF_TYPES);
      const randomType = staffTypes[Math.floor(Math.random() * staffTypes.length)];
      this.staffPool.push(this.generator.generateStaffMember(randomType));
    }
  }
  
  // Methods to access staff pool
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
  
  getStaffPoolSize() {
    return this.staffPool.length;
  }
  
  // Forward common operations to specialized modules
  
  // Staff hiring and firing
  async hireStaff(staffId, venueId) {
    const result = await this.operations.hireStaff(staffId, venueId);
    // If hiring was successful and this is in-memory mode, remove from the staff pool
    if (result && !this.game.dbInitialized) {
      const index = this.staffPool.findIndex(staff => staff.id === staffId);
      if (index !== -1) {
        this.staffPool.splice(index, 1);
      }
    }
    return result;
  }
  
  async fireStaff(staffId) {
    return await this.operations.fireStaff(staffId);
  }
  
  // Staff data access
  async getStaff(staffId) {
    return await this.operations.getStaff(staffId);
  }
  
  async getAllStaff() {
    return await this.operations.getAllStaff();
  }
  
  setAllStaff(staffData) {
    // For compatibility with existing code
    this.game.state.staff = [...staffData];
  }
  
  async getStaffByVenue(venueId) {
    return await this.operations.getStaffByVenue(venueId);
  }
  
  // Staff updates
  async updateStaff() {
    await this.behavior.updateStaff();
  }
  
  // Staff training and wages
  async trainStaff(staffId, skillToTrain) {
    return await this.operations.trainStaff(staffId, skillToTrain);
  }
  
  async adjustStaffWage(staffId, newWage) {
    return await this.operations.adjustStaffWage(staffId, newWage);
  }
  
  // Staff costs and statistics
  async getStaffCost(venueId) {
    return await this.behavior.getStaffCost(venueId);
  }
  
  async getAverageStaffMorale(venueId) {
    return await this.behavior.getAverageStaffMorale(venueId);
  }
}

module.exports = StaffManager;