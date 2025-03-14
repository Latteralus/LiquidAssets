// js/database/dao/transactionDAO.js
const { DatabaseManager } = require('../databaseManager');

class TransactionDAO {
  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Records a financial transaction
   * @param {Object} transaction - The transaction data
   * @returns {Promise<number>} ID of created transaction
   */
  async recordTransaction(transaction) {
    try {
      // Ensure transaction has all required fields
      if (!transaction.venueId || !transaction.type || !transaction.category || transaction.amount === undefined) {
        throw new Error('Missing required transaction properties');
      }

      // Convert transaction object to a format suitable for database
      const transactionRecord = {
        venue_id: transaction.venueId,
        type: transaction.type,
        category: transaction.category,
        subcategory: transaction.subcategory || null,
        amount: transaction.amount,
        timestamp: transaction.timestamp || new Date().toISOString(),
        item: transaction.item || null,
        quantity: transaction.quantity || null,
        price: transaction.price || null,
        metadata: JSON.stringify(transaction.metadata || {})
      };

      // Insert transaction record and get the ID
      return await this.db.insert('transactions', transactionRecord);
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  /**
   * Retrieves transactions for a venue within a date range
   * @param {string|number} venueId - The venue ID
   * @param {Object} [options] - Query options
   * @param {Date|string} [options.startDate] - Start date for filtering
   * @param {Date|string} [options.endDate] - End date for filtering
   * @param {string} [options.type] - Filter by transaction type
   * @param {string} [options.category] - Filter by transaction category
   * @param {number} [options.limit] - Maximum number of results
   * @returns {Promise<Array>} Array of transaction objects
   */
  async getTransactions(venueId, options = {}) {
    try {
      let query = 'SELECT * FROM transactions WHERE venue_id = ?';
      const params = [venueId];

      // Add date range filters if provided
      if (options.startDate) {
        query += ' AND timestamp >= ?';
        params.push(typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString());
      }

      if (options.endDate) {
        query += ' AND timestamp <= ?';
        params.push(typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString());
      }

      // Add type filter if provided
      if (options.type) {
        query += ' AND type = ?';
        params.push(options.type);
      }

      // Add category filter if provided
      if (options.category) {
        query += ' AND category = ?';
        params.push(options.category);
      }

      // Order by timestamp (most recent first)
      query += ' ORDER BY timestamp DESC';

      // Add limit if provided
      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      const records = await this.db.query(query, params);
      return records.map(record => this.mapRecordToTransaction(record));
    } catch (error) {
      console.error(`Error retrieving transactions for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets financial summary by category
   * @param {string|number} venueId - The venue ID
   * @param {string} [period='monthly'] - Period for grouping ('daily', 'weekly', 'monthly')
   * @returns {Promise<Object>} Financial summary object
   */
  async getFinancialSummary(venueId, period = 'monthly') {
    try {
      let dateFilter;
      
      // Create date filter based on period
      const now = new Date();
      switch (period) {
        case 'daily':
          dateFilter = `date(timestamp) = date('${now.toISOString()}')`;
          break;
        case 'weekly':
          // Get date from 7 days ago
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = `timestamp >= '${weekAgo.toISOString()}'`;
          break;
        case 'monthly':
          // Get date from 30 days ago
          const monthAgo = new Date(now);
          monthAgo.setDate(monthAgo.getDate() - 30);
          dateFilter = `timestamp >= '${monthAgo.toISOString()}'`;
          break;
        case 'yearly':
          // Get date from 365 days ago
          const yearAgo = new Date(now);
          yearAgo.setDate(yearAgo.getDate() - 365);
          dateFilter = `timestamp >= '${yearAgo.toISOString()}'`;
          break;
        default:
          // Default to monthly
          const defaultMonthAgo = new Date(now);
          defaultMonthAgo.setDate(defaultMonthAgo.getDate() - 30);
          dateFilter = `timestamp >= '${defaultMonthAgo.toISOString()}'`;
      }

      // Query for revenue by category
      const revenueQuery = `
        SELECT 
          category,
          SUM(amount) AS total_amount
        FROM transactions
        WHERE venue_id = ? 
        AND type = 'revenue'
        AND ${dateFilter}
        GROUP BY category
        ORDER BY total_amount DESC
      `;

      // Query for expenses by category
      const expenseQuery = `
        SELECT 
          category,
          SUM(amount) AS total_amount
        FROM transactions
        WHERE venue_id = ? 
        AND type = 'expense'
        AND ${dateFilter}
        GROUP BY category
        ORDER BY total_amount DESC
      `;

      // Query for totals
      const totalsQuery = `
        SELECT 
          type,
          SUM(amount) AS total_amount
        FROM transactions
        WHERE venue_id = ? 
        AND ${dateFilter}
        GROUP BY type
      `;

      // Execute all queries
      const [revenueCategories, expenseCategories, totals] = await Promise.all([
        this.db.query(revenueQuery, [venueId]),
        this.db.query(expenseQuery, [venueId]),
        this.db.query(totalsQuery, [venueId])
      ]);

      // Calculate net income and build summary object
      let totalRevenue = 0;
      let totalExpense = 0;

      totals.forEach(total => {
        if (total.type === 'revenue') {
          totalRevenue = total.total_amount;
        } else if (total.type === 'expense') {
          totalExpense = total.total_amount;
        }
      });

      return {
        period,
        totalRevenue,
        totalExpense,
        netIncome: totalRevenue - totalExpense,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0,
        revenueByCategory: revenueCategories,
        expensesByCategory: expenseCategories
      };
    } catch (error) {
      console.error(`Error getting financial summary for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets revenue trends over time
   * @param {string|number} venueId - The venue ID
   * @param {string} [period='daily'] - Period for grouping ('daily', 'weekly', 'monthly')
   * @param {number} [limit=30] - Maximum number of data points to return
   * @returns {Promise<Array>} Array of trend objects
   */
  async getRevenueTrend(venueId, period = 'daily', limit = 30) {
    try {
      let groupBy;
      
      // Determine grouping format based on period
      switch (period) {
        case 'daily':
          groupBy = "date(timestamp)";
          break;
        case 'weekly':
          groupBy = "strftime('%Y-%W', timestamp)";
          break;
        case 'monthly':
          groupBy = "strftime('%Y-%m', timestamp)";
          break;
        default:
          groupBy = "date(timestamp)";
      }

      const query = `
        SELECT 
          ${groupBy} AS period,
          SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END) AS revenue,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
          SUM(CASE WHEN type = 'revenue' THEN amount ELSE -amount END) AS net_income
        FROM transactions
        WHERE venue_id = ?
        GROUP BY period
        ORDER BY period DESC
        LIMIT ?
      `;

      // Execute query and reverse results to get chronological order
      const results = await this.db.query(query, [venueId, limit]);
      return results.reverse();
    } catch (error) {
      console.error(`Error getting revenue trend for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Records multiple transactions in a batch
   * @param {Array<Object>} transactions - Array of transaction objects
   * @returns {Promise<number>} Number of transactions recorded
   */
  async recordTransactionBatch(transactions) {
    try {
      // Start a transaction
      const transactionId = await this.db.beginTransaction();
      
      let count = 0;
      
      try {
        // Process each transaction
        for (const transaction of transactions) {
          // Ensure transaction has all required fields
          if (!transaction.venueId || !transaction.type || !transaction.category || transaction.amount === undefined) {
            continue; // Skip invalid transactions
          }

          // Convert transaction object to a format suitable for database
          const transactionRecord = {
            venue_id: transaction.venueId,
            type: transaction.type,
            category: transaction.category,
            subcategory: transaction.subcategory || null,
            amount: transaction.amount,
            timestamp: transaction.timestamp || new Date().toISOString(),
            item: transaction.item || null,
            quantity: transaction.quantity || null,
            price: transaction.price || null,
            metadata: JSON.stringify(transaction.metadata || {})
          };

          // Insert transaction record
          await this.db.insert('transactions', transactionRecord, transactionId);
          count++;
        }

        // Commit the database transaction
        await this.db.commitTransaction(transactionId);
        
        return count;
      } catch (error) {
        // Rollback on error
        await this.db.rollbackTransaction(transactionId);
        throw error;
      }
    } catch (error) {
      console.error('Error recording transaction batch:', error);
      throw error;
    }
  }

  /**
   * Maps a database record to a transaction object
   * @private
   * @param {Object} record - The database record
   * @returns {Object} The transaction object
   */
  mapRecordToTransaction(record) {
    return {
      id: record.id,
      venueId: record.venue_id,
      type: record.type,
      category: record.category,
      subcategory: record.subcategory,
      amount: record.amount,
      timestamp: record.timestamp,
      item: record.item,
      quantity: record.quantity,
      price: record.price,
      metadata: JSON.parse(record.metadata || '{}')
    };
  }
}

module.exports = TransactionDAO;