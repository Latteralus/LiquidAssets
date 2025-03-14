// js/database/dao/staffDAO.js
const { DatabaseManager } = require('../databaseManager');
const { v4: uuidv4 } = require('uuid');

class StaffDAO {
  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Creates a new staff record in the database
   * @param {Object} staff - The staff object to create
   * @returns {Promise<Object>} The created staff with ID
   */
  async createStaff(staff) {
    try {
      // Ensure staff has all required fields
      if (!staff.name || !staff.type) {
        throw new Error('Missing required staff properties');
      }

      // Generate ID if not provided
      const staffId = staff.id || uuidv4();

      // Convert staff object to a format suitable for database
      const staffRecord = {
        id: staffId,
        venue_id: staff.venueId || staff.venue || null,
        name: staff.name,
        type: staff.type,
        wage: staff.wage || 0,
        experience: staff.experience || 0,
        morale: staff.morale || 80,
        hire_date: staff.hireDate || null,
        is_working: staff.isWorking ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Store complex objects as JSON
        skills: JSON.stringify(staff.skills || {}),
        personality: JSON.stringify(staff.personality || {}),
        working_days: JSON.stringify(staff.workingDays || []),
        working_hours: JSON.stringify(staff.workingHours || {})
      };

      // Insert staff record
      await this.db.insert('staff', staffRecord);
      
      // Return complete staff with ID
      return {
        id: staffId,
        ...staff
      };
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  }

  /**
   * Creates multiple staff records in a single transaction
   * @param {Array<Object>} staffList - Array of staff objects to create
   * @returns {Promise<Array<Object>>} Array of created staff with IDs
   */
  async createStaffBatch(staffList) {
    if (!Array.isArray(staffList) || staffList.length === 0) {
      return [];
    }

    // Start a transaction
    const transactionId = await this.db.beginTransaction();
    
    try {
      const createdStaff = [];
      
      for (const staff of staffList) {
        // Ensure staff has all required fields
        if (!staff.name || !staff.type) {
          console.warn('Skipping staff with missing properties:', staff);
          continue;
        }

        // Generate ID if not provided
        const staffId = staff.id || uuidv4();

        // Convert staff object to a format suitable for database
        const staffRecord = {
          id: staffId,
          venue_id: staff.venueId || staff.venue || null,
          name: staff.name,
          type: staff.type,
          wage: staff.wage || 0,
          experience: staff.experience || 0,
          morale: staff.morale || 80,
          hire_date: staff.hireDate || null,
          is_working: staff.isWorking ? 1 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Store complex objects as JSON
          skills: JSON.stringify(staff.skills || {}),
          personality: JSON.stringify(staff.personality || {}),
          working_days: JSON.stringify(staff.workingDays || []),
          working_hours: JSON.stringify(staff.workingHours || {})
        };

        // Insert staff record using the transaction
        await this.db.insert('staff', staffRecord, transactionId);
        
        // Add to result list
        createdStaff.push({
          id: staffId,
          ...staff
        });
      }
      
      // Commit the transaction
      await this.db.commitTransaction(transactionId);
      
      return createdStaff;
    } catch (error) {
      // Rollback the transaction on error
      await this.db.rollbackTransaction(transactionId);
      console.error('Error creating staff batch:', error);
      throw error;
    }
  }

  /**
   * Retrieves a staff member by ID
   * @param {string|number} id - The staff ID
   * @returns {Promise<Object|null>} The staff object or null if not found
   */
  async getStaffById(id) {
    try {
      const record = await this.db.getById('staff', id);
      
      if (!record) {
        return null;
      }

      // Convert database record to staff object
      return this.mapRecordToStaff(record);
    } catch (error) {
      console.error(`Error retrieving staff with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing staff member
   * @param {string|number} id - The staff ID
   * @param {Object} staffData - The updated staff data
   * @param {string} [transactionId] - Optional transaction ID
   * @returns {Promise<boolean>} True if update successful
   */
  async updateStaff(id, staffData, transactionId = null) {
    try {
      // Prepare update object with only supported fields
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Update basic fields
      if (staffData.name !== undefined) updateData.name = staffData.name;
      if (staffData.type !== undefined) updateData.type = staffData.type;
      if (staffData.wage !== undefined) updateData.wage = staffData.wage;
      if (staffData.experience !== undefined) updateData.experience = staffData.experience;
      if (staffData.morale !== undefined) updateData.morale = staffData.morale;
      if (staffData.hireDate !== undefined) updateData.hire_date = staffData.hireDate;
      if (staffData.isWorking !== undefined) updateData.is_working = staffData.isWorking ? 1 : 0;
      if (staffData.venue !== undefined) updateData.venue_id = staffData.venue;
      if (staffData.venueId !== undefined) updateData.venue_id = staffData.venueId;

      // Update complex objects if provided
      if (staffData.skills) updateData.skills = JSON.stringify(staffData.skills);
      if (staffData.personality) updateData.personality = JSON.stringify(staffData.personality);
      if (staffData.workingDays) updateData.working_days = JSON.stringify(staffData.workingDays);
      if (staffData.workingHours) updateData.working_hours = JSON.stringify(staffData.workingHours);

      // Perform update
      const success = await this.db.update('staff', id, updateData, transactionId);
      return success;
    } catch (error) {
      console.error(`Error updating staff with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a staff member by ID
   * @param {string|number} id - The staff ID
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deleteStaff(id) {
    try {
      return await this.db.delete('staff', id);
    } catch (error) {
      console.error(`Error deleting staff with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets all staff members for a specific venue
   * @param {string|number} venueId - The venue ID
   * @returns {Promise<Array>} Array of staff objects
   */
  async getStaffByVenueId(venueId) {
    try {
      const records = await this.db.query(
        'SELECT * FROM staff WHERE venue_id = ?',
        [venueId]
      );
      
      return records.map(record => this.mapRecordToStaff(record));
    } catch (error) {
      console.error(`Error retrieving staff for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets all available staff (not assigned to any venue)
   * @returns {Promise<Array>} Array of available staff objects
   */
  async getAvailableStaff() {
    try {
      const records = await this.db.query(
        'SELECT * FROM staff WHERE venue_id IS NULL'
      );
      
      return records.map(record => this.mapRecordToStaff(record));
    } catch (error) {
      console.error('Error retrieving available staff:', error);
      throw error;
    }
  }

  /**
   * Gets staff by type
   * @param {string} type - The staff type (e.g., 'bartender', 'waiter')
   * @returns {Promise<Array>} Array of staff objects
   */
  async getStaffByType(type) {
    try {
      const records = await this.db.query(
        'SELECT * FROM staff WHERE type = ?',
        [type]
      );
      
      return records.map(record => this.mapRecordToStaff(record));
    } catch (error) {
      console.error(`Error retrieving staff of type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Gets all staff in the database
   * @returns {Promise<Array>} Array of all staff objects
   */
  async getAllStaff() {
    try {
      const records = await this.db.query('SELECT * FROM staff');
      return records.map(record => this.mapRecordToStaff(record));
    } catch (error) {
      console.error('Error retrieving all staff:', error);
      throw error;
    }
  }

  /**
   * Updates staff morale
   * @param {string|number} id - The staff ID
   * @param {number} morale - The new morale value
   * @returns {Promise<boolean>} True if update successful
   */
  async updateStaffMorale(id, morale) {
    try {
      return await this.db.update('staff', id, {
        morale: morale,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating morale for staff ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates staff skills
   * @param {string|number} id - The staff ID
   * @param {Object} skills - The updated skills object
   * @returns {Promise<boolean>} True if update successful
   */
  async updateStaffSkills(id, skills) {
    try {
      const staff = await this.getStaffById(id);
      
      if (!staff) {
        throw new Error(`Staff with ID ${id} not found`);
      }

      // Merge new skills with existing skills
      const updatedSkills = {
        ...staff.skills,
        ...skills
      };

      // Update the skills field
      return await this.db.update('staff', id, {
        skills: JSON.stringify(updatedSkills),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating skills for staff ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates staff working status
   * @param {string|number} id - The staff ID
   * @param {boolean} isWorking - New working status
   * @returns {Promise<boolean>} True if update successful
   */
  async updateStaffWorkingStatus(id, isWorking) {
    try {
      return await this.db.update('staff', id, {
        is_working: isWorking ? 1 : 0,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating working status for staff ${id}:`, error);
      throw error;
    }
  }

  /**
   * Assigns staff to a venue
   * @param {string|number} staffId - The staff ID
   * @param {string|number} venueId - The venue ID
   * @param {string} [transactionId] - Optional transaction ID
   * @returns {Promise<boolean>} True if assignment successful
   */
  async assignStaffToVenue(staffId, venueId, transactionId = null) {
    try {
      const staff = await this.getStaffById(staffId);
      
      if (!staff) {
        throw new Error(`Staff with ID ${staffId} not found`);
      }

      // Update venue assignment and set hire date if not already set
      const updateData = {
        venue_id: venueId,
        updated_at: new Date().toISOString()
      };

      if (!staff.hireDate) {
        updateData.hire_date = new Date().toISOString();
      }

      return await this.db.update('staff', staffId, updateData, transactionId);
    } catch (error) {
      console.error(`Error assigning staff ${staffId} to venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Removes staff from a venue (makes them available again)
   * @param {string|number} staffId - The staff ID
   * @returns {Promise<boolean>} True if removal successful
   */
  async removeStaffFromVenue(staffId) {
    try {
      return await this.db.update('staff', staffId, {
        venue_id: null,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error removing staff ${staffId} from venue:`, error);
      throw error;
    }
  }

  /**
   * Gets total staff cost for a venue
   * @param {string|number} venueId - The venue ID
   * @returns {Promise<number>} Total weekly wages
   */
  async getStaffCost(venueId) {
    try {
      const result = await this.db.query(
        'SELECT SUM(wage) as total_wages FROM staff WHERE venue_id = ?',
        [venueId]
      );
      
      return result[0]?.total_wages || 0;
    } catch (error) {
      console.error(`Error getting staff cost for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets average staff morale for a venue
   * @param {string|number} venueId - The venue ID
   * @returns {Promise<number>} Average morale value
   */
  async getAverageStaffMorale(venueId) {
    try {
      const result = await this.db.query(
        'SELECT AVG(morale) as avg_morale FROM staff WHERE venue_id = ?',
        [venueId]
      );
      
      return result[0]?.avg_morale || 0;
    } catch (error) {
      console.error(`Error getting average morale for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Refreshes the available staff pool by removing some and adding new ones
   * @returns {Promise<boolean>} True if refresh successful
   */
  async refreshAvailableStaff() {
    // Start a transaction
    const transactionId = await this.db.beginTransaction();
    
    try {
      // Get current available staff
      const availableStaff = await this.getAvailableStaff();
      
      if (availableStaff.length === 0) {
        // If no available staff, just create a new batch
        // This will be handled by the StaffGenerator
        await this.db.commitTransaction(transactionId);
        return true;
      }
      
      // Keep around 70% of existing staff
      const retainCount = Math.floor(availableStaff.length * 0.7);
      
      // Sort by quality (average skill level)
      const sortedStaff = availableStaff.sort((a, b) => {
        const aAvgSkill = Object.values(a.skills).reduce((sum, val) => sum + val, 0) / 
                          Object.values(a.skills).length;
        const bAvgSkill = Object.values(b.skills).reduce((sum, val) => sum + val, 0) / 
                          Object.values(b.skills).length;
        return bAvgSkill - aAvgSkill;
      });
      
      // Remove the lowest quality staff
      for (let i = retainCount; i < sortedStaff.length; i++) {
        await this.db.delete('staff', sortedStaff[i].id, transactionId);
      }
      
      // Commit the transaction
      await this.db.commitTransaction(transactionId);
      
      return true;
    } catch (error) {
      // Rollback on error
      await this.db.rollbackTransaction(transactionId);
      console.error('Error refreshing available staff:', error);
      throw error;
    }
  }

  /**
   * Gets staff that are scheduled to work for a specific venue and time
   * @param {string|number} venueId - The venue ID
   * @param {number} dayOfWeek - The day of week (1-7 for Monday-Sunday)
   * @param {number} hour - The hour of day (0-23)
   * @returns {Promise<Array>} Array of scheduled staff
   */
  async getScheduledStaff(venueId, dayOfWeek, hour) {
    try {
      const venueStaff = await this.getStaffByVenueId(venueId);
      
      // Filter staff by schedule
      return venueStaff.filter(staff => {
        // Check if the staff works on this day
        if (!staff.workingDays || !Array.isArray(staff.workingDays)) return false;
        
        // Convert from 1-7 (Monday-Sunday) to 0-6 (Sunday-Saturday)
        const dayIndex = (dayOfWeek + 5) % 7;
        
        if (!staff.workingDays[dayIndex]) return false;
        
        // Check if the staff works at this hour
        if (!staff.workingHours || typeof staff.workingHours !== 'object') return false;
        
        const { start, end } = staff.workingHours;
        
        // Handle shifts that span midnight
        if (end < start) {
          return hour >= start || hour < end;
        } else {
          return hour >= start && hour < end;
        }
      });
    } catch (error) {
      console.error(`Error getting scheduled staff for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Maps a database record to a staff object
   * @private
   * @param {Object} record - The database record
   * @returns {Object} The staff object
   */
  mapRecordToStaff(record) {
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      venue: record.venue_id,
      venueId: record.venue_id,
      wage: record.wage,
      experience: record.experience,
      morale: record.morale,
      hireDate: record.hire_date,
      isWorking: record.is_working === 1,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      skills: JSON.parse(record.skills || '{}'),
      personality: JSON.parse(record.personality || '{}'),
      workingDays: JSON.parse(record.working_days || '[]'),
      workingHours: JSON.parse(record.working_hours || '{}')
    };
  }
}

module.exports = StaffDAO;