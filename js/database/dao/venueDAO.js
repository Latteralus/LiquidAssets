// js/database/dao/venueDAO.js
const { DatabaseManager } = require('../databaseManager');

class VenueDAO {
  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Creates a new venue record in the database
   * @param {Object} venue - The venue object to create
   * @returns {Promise<Object>} The created venue with ID
   */
  async createVenue(venue) {
    try {
      // Ensure venue has all required fields
      if (!venue.name || !venue.type || !venue.city) {
        throw new Error('Missing required venue properties');
      }

      // Convert venue object to a format suitable for database
      const venueRecord = {
        name: venue.name,
        type: venue.type,
        city: venue.city,
        size: venue.size || 'small',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        finances: JSON.stringify(venue.finances || {}),
        settings: JSON.stringify(venue.settings || {}),
        stats: JSON.stringify(venue.stats || {}),
        layout: JSON.stringify(venue.layout || {}),
        staff: JSON.stringify(venue.staff || []),
        inventory: JSON.stringify(venue.inventory || {}),
        licences: JSON.stringify(venue.licences || {})
      };

      // Insert venue record and get the ID
      const id = await this.db.insert('venues', venueRecord);
      
      // Return complete venue with ID
      return {
        id: id,
        ...venue
      };
    } catch (error) {
      console.error('Error creating venue:', error);
      throw error;
    }
  }

  /**
   * Retrieves a venue by ID
   * @param {string|number} id - The venue ID
   * @returns {Promise<Object|null>} The venue object or null if not found
   */
  async getVenueById(id) {
    try {
      const record = await this.db.getById('venues', id);
      
      if (!record) {
        return null;
      }

      // Convert database record to venue object
      return this.mapRecordToVenue(record);
    } catch (error) {
      console.error(`Error retrieving venue with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing venue
   * @param {string|number} id - The venue ID
   * @param {Object} venueData - The updated venue data
   * @returns {Promise<boolean>} True if update successful
   */
  async updateVenue(id, venueData) {
    try {
      // Get current venue to merge with updates
      const currentVenue = await this.getVenueById(id);
      
      if (!currentVenue) {
        throw new Error(`Venue with ID ${id} not found`);
      }

      // Prepare update object with only supported fields
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Update basic fields
      if (venueData.name) updateData.name = venueData.name;
      if (venueData.size) updateData.size = venueData.size;

      // Update complex objects if provided
      if (venueData.finances) updateData.finances = JSON.stringify(venueData.finances);
      if (venueData.settings) updateData.settings = JSON.stringify(venueData.settings);
      if (venueData.stats) updateData.stats = JSON.stringify(venueData.stats);
      if (venueData.layout) updateData.layout = JSON.stringify(venueData.layout);
      if (venueData.staff) updateData.staff = JSON.stringify(venueData.staff);
      if (venueData.inventory) updateData.inventory = JSON.stringify(venueData.inventory);
      if (venueData.licences) updateData.licences = JSON.stringify(venueData.licences);

      // Perform update
      const success = await this.db.update('venues', id, updateData);
      return success;
    } catch (error) {
      console.error(`Error updating venue with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a venue by ID
   * @param {string|number} id - The venue ID
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deleteVenue(id) {
    try {
      return await this.db.delete('venues', id);
    } catch (error) {
      console.error(`Error deleting venue with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets all venues for a specific player
   * @param {string|number} playerId - The player ID
   * @returns {Promise<Array>} Array of venue objects
   */
  async getVenuesByPlayerId(playerId) {
    try {
      const records = await this.db.query(
        'SELECT * FROM venues WHERE player_id = ?',
        [playerId]
      );
      
      return records.map(record => this.mapRecordToVenue(record));
    } catch (error) {
      console.error(`Error retrieving venues for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Gets all venues in a specific city
   * @param {string} city - The city name
   * @returns {Promise<Array>} Array of venue objects
   */
  async getVenuesByCity(city) {
    try {
      const records = await this.db.query(
        'SELECT * FROM venues WHERE city = ?',
        [city]
      );
      
      return records.map(record => this.mapRecordToVenue(record));
    } catch (error) {
      console.error(`Error retrieving venues in city ${city}:`, error);
      throw error;
    }
  }

  /**
   * Updates venue statistics
   * @param {string|number} id - The venue ID
   * @param {Object} stats - The stats to update
   * @returns {Promise<boolean>} True if update successful
   */
  async updateVenueStats(id, stats) {
    try {
      const venue = await this.getVenueById(id);
      
      if (!venue) {
        throw new Error(`Venue with ID ${id} not found`);
      }

      // Merge new stats with existing stats
      const updatedStats = {
        ...venue.stats,
        ...stats
      };

      // Update the stats field
      return await this.db.update('venues', id, {
        stats: JSON.stringify(updatedStats),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating stats for venue ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates venue finances
   * @param {string|number} id - The venue ID
   * @param {Object} finances - The finances to update
   * @returns {Promise<boolean>} True if update successful
   */
  async updateVenueFinances(id, finances) {
    try {
      const venue = await this.getVenueById(id);
      
      if (!venue) {
        throw new Error(`Venue with ID ${id} not found`);
      }

      // Merge new finances with existing finances
      const updatedFinances = {
        ...venue.finances,
        ...finances
      };

      // Update the finances field
      return await this.db.update('venues', id, {
        finances: JSON.stringify(updatedFinances),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating finances for venue ${id}:`, error);
      throw error;
    }
  }

  /**
   * Maps a database record to a venue object
   * @private
   * @param {Object} record - The database record
   * @returns {Object} The venue object
   */
  mapRecordToVenue(record) {
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      city: record.city,
      size: record.size,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      finances: JSON.parse(record.finances || '{}'),
      settings: JSON.parse(record.settings || '{}'),
      stats: JSON.parse(record.stats || '{}'),
      layout: JSON.parse(record.layout || '{}'),
      staff: JSON.parse(record.staff || '[]'),
      inventory: JSON.parse(record.inventory || '{}'),
      licences: JSON.parse(record.licences || '{}')
    };
  }
}

module.exports = VenueDAO;