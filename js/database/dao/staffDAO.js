// js/database/dao/staffDAO.js
const { DatabaseManager } = require('../databaseManager');

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

      // Convert staff object to a format suitable for database
      const staffRecord = {
        venue_id: staff.venue || null,
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

      // Insert staff record and get the ID
      const id = await this.db.insert('staff', staffRecord);
      
      // Return complete staff with ID
      return {
        id: id,
        ...staff
      };
    } catch (error) {
      console.error('Error creating staff:', error);
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
   * @returns {Promise<boolean>} True if update successful
   */
  async updateStaff(id, staffData) {
    try {
      // Get current staff to merge with updates
      const currentStaff = await this.getStaffById(id);
      
      if (!currentStaff) {
        throw new Error(`Staff with ID ${id} not found`);
      }

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

      // Update complex objects if provided
      if (staffData.skills) updateData.skills = JSON.stringify(staffData.skills);
      if (staffData.personality) updateData.personality = JSON.stringify(staffData.personality);
      if (staffData.workingDays) updateData.working_days = JSON.stringify(staffData.workingDays);
      if (staffData.workingHours) updateData.working_hours = JSON.stringify(staffData.workingHours);

      // Perform update
      const success = await this.db.update('staff', id, updateData);
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
   * Assigns staff to a venue
   * @param {string|number} staffId - The staff ID
   * @param {string|number} venueId - The venue ID
   * @returns {Promise<boolean>} True if assignment successful
   */
  async assignStaffToVenue(staffId, venueId) {
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

      return await this.db.update('staff', staffId, updateData);
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