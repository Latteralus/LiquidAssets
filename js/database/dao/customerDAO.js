// js/database/dao/customerDAO.js
const { DatabaseManager } = require('../databaseManager');

class CustomerDAO {
  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Records a customer visit to a venue
   * @param {Object} visit - Customer visit data
   * @returns {Promise<number>} ID of created visit record
   */
  async recordVisit(visit) {
    try {
      // Ensure visit has all required fields
      if (!visit.venueId || !visit.customerType || !visit.groupSize) {
        throw new Error('Missing required visit properties');
      }

      // Convert visit object to a format suitable for database
      const visitRecord = {
        venue_id: visit.venueId,
        visit_date: visit.date || new Date().toISOString(),
        customer_type: visit.customerType,
        group_size: visit.groupSize,
        total_spent: visit.totalSpent || 0,
        satisfaction: visit.satisfaction || 50,
        status: visit.status || 'completed',
        metadata: JSON.stringify(visit.metadata || {})
      };

      // Insert visit record and get the ID
      return await this.db.insert('customer_visits', visitRecord);
    } catch (error) {
      console.error('Error recording customer visit:', error);
      throw error;
    }
  }

  /**
   * Gets customer visits for a specific venue
   * @param {string|number} venueId - The venue ID
   * @param {Object} [options] - Query options
   * @param {Date|string} [options.startDate] - Start date for filtering
   * @param {Date|string} [options.endDate] - End date for filtering
   * @param {number} [options.limit] - Maximum number of results
   * @param {string} [options.status] - Filter by visit status
   * @returns {Promise<Array>} Array of customer visit objects
   */
  async getVisitsByVenue(venueId, options = {}) {
    try {
      let query = 'SELECT * FROM customer_visits WHERE venue_id = ?';
      const params = [venueId];

      // Add date range filters if provided
      if (options.startDate) {
        query += ' AND visit_date >= ?';
        params.push(typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString());
      }

      if (options.endDate) {
        query += ' AND visit_date <= ?';
        params.push(typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString());
      }

      // Add status filter if provided
      if (options.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      // Order by visit date (most recent first)
      query += ' ORDER BY visit_date DESC';

      // Add limit if provided
      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      const records = await this.db.query(query, params);
      return records.map(record => this.mapRecordToVisit(record));
    } catch (error) {
      console.error(`Error retrieving visits for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets summary statistics for customer visits
   * @param {string|number} venueId - The venue ID
   * @param {string} [period='daily'] - Period for grouping ('daily', 'weekly', 'monthly')
   * @returns {Promise<Array>} Array of summary objects
   */
  async getVisitSummary(venueId, period = 'daily') {
    try {
      let groupBy;
      
      // Determine grouping format based on period
      switch (period) {
        case 'daily':
          groupBy = "strftime('%Y-%m-%d', visit_date)";
          break;
        case 'weekly':
          groupBy = "strftime('%Y-%W', visit_date)";
          break;
        case 'monthly':
          groupBy = "strftime('%Y-%m', visit_date)";
          break;
        default:
          groupBy = "strftime('%Y-%m-%d', visit_date)";
      }

      const query = `
        SELECT 
          ${groupBy} AS period,
          COUNT(*) AS visit_count,
          SUM(group_size) AS total_customers,
          SUM(total_spent) AS total_revenue,
          AVG(satisfaction) AS avg_satisfaction
        FROM customer_visits
        WHERE venue_id = ?
        GROUP BY period
        ORDER BY period DESC
      `;

      return await this.db.query(query, [venueId]);
    } catch (error) {
      console.error(`Error getting visit summary for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets customer type distribution for a venue
   * @param {string|number} venueId - The venue ID
   * @returns {Promise<Array>} Array of customer type distribution objects
   */
  async getCustomerTypeDistribution(venueId) {
    try {
      const query = `
        SELECT 
          customer_type,
          COUNT(*) AS visit_count,
          SUM(group_size) AS total_customers,
          SUM(total_spent) AS total_revenue,
          AVG(satisfaction) AS avg_satisfaction
        FROM customer_visits
        WHERE venue_id = ?
        GROUP BY customer_type
        ORDER BY total_customers DESC
      `;

      return await this.db.query(query, [venueId]);
    } catch (error) {
      console.error(`Error getting customer type distribution for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets satisfaction trends over time
   * @param {string|number} venueId - The venue ID
   * @param {string} [period='weekly'] - Period for grouping ('daily', 'weekly', 'monthly')
   * @returns {Promise<Array>} Array of trend objects
   */
  async getSatisfactionTrend(venueId, period = 'weekly') {
    try {
      let groupBy;
      
      // Determine grouping format based on period
      switch (period) {
        case 'daily':
          groupBy = "strftime('%Y-%m-%d', visit_date)";
          break;
        case 'weekly':
          groupBy = "strftime('%Y-%W', visit_date)";
          break;
        case 'monthly':
          groupBy = "strftime('%Y-%m', visit_date)";
          break;
        default:
          groupBy = "strftime('%Y-%W', visit_date)";
      }

      const query = `
        SELECT 
          ${groupBy} AS period,
          AVG(satisfaction) AS avg_satisfaction,
          COUNT(*) AS visit_count
        FROM customer_visits
        WHERE venue_id = ?
        GROUP BY period
        ORDER BY period DESC
        LIMIT 12
      `;

      return await this.db.query(query, [venueId]);
    } catch (error) {
      console.error(`Error getting satisfaction trend for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Updates a customer visit
   * @param {string|number} id - The visit ID
   * @param {Object} visitData - The updated visit data
   * @returns {Promise<boolean>} True if update successful
   */
  async updateVisit(id, visitData) {
    try {
      // Prepare update object with only supported fields
      const updateData = {};

      if (visitData.totalSpent !== undefined) updateData.total_spent = visitData.totalSpent;
      if (visitData.satisfaction !== undefined) updateData.satisfaction = visitData.satisfaction;
      if (visitData.status !== undefined) updateData.status = visitData.status;
      
      if (visitData.metadata) {
        updateData.metadata = JSON.stringify(visitData.metadata);
      }

      // Perform update
      return await this.db.update('customer_visits', id, updateData);
    } catch (error) {
      console.error(`Error updating visit with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Maps a database record to a customer visit object
   * @private
   * @param {Object} record - The database record
   * @returns {Object} The customer visit object
   */
  mapRecordToVisit(record) {
    return {
      id: record.id,
      venueId: record.venue_id,
      date: record.visit_date,
      customerType: record.customer_type,
      groupSize: record.group_size,
      totalSpent: record.total_spent,
      satisfaction: record.satisfaction,
      status: record.status,
      metadata: JSON.parse(record.metadata || '{}')
    };
  }
}

module.exports = CustomerDAO;