// Financial Manager - Main file that imports and orchestrates financial sub-modules

const ExpenseManager = require('./finances/expenseManager');
const RevenueManager = require('./finances/revenueManager');
const TransactionManager = require('./finances/transactionManager');
const ReportingManager = require('./finances/reportingManager');
const dbAPI = require('../database/api');

class FinancialManager {
  constructor(game) {
    this.game = game;
    
    // Whether we're using database storage
    this.useDatabase = false;
    
    // Initialize sub-modules
    this.expenseManager = new ExpenseManager(game);
    this.revenueManager = new RevenueManager(game);
    this.transactionManager = new TransactionManager(game);
    this.reportingManager = new ReportingManager(game, this.transactionManager);
    
    // Check database availability
    this.checkDatabaseAvailability();
  }
  
  async checkDatabaseAvailability() {
    // Check if database API is available and initialized
    try {
      const status = await dbAPI.getStatus();
      this.useDatabase = status && status.initialized;
      
      if (this.useDatabase) {
        console.log("FinancialManager: Using database storage");
      } else {
        console.log("FinancialManager: Using in-memory storage");
      }
    } catch (error) {
      console.error("FinancialManager: Database check failed", error);
      this.useDatabase = false;
    }
  }
  
  // Daily financial operations
  async onNewDay() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Pay daily expenses
    await this.expenseManager.payDailyExpenses();
    
    // Reset daily stats
    this.game.state.currentVenue.finances.dailyRevenue = 0;
    this.game.state.currentVenue.finances.dailyExpenses = 0;
    
    // Generate daily report
    const dailyReport = await this.reportingManager.generateDailyReport();
    
    // If using database, save the report
    if (this.useDatabase && dailyReport) {
      try {
        // Convert report to format expected by database
        const reportData = {
          venue_id: this.game.state.currentVenue.id,
          type: 'daily',
          date: this.formatReportDate(dailyReport.date),
          revenue: dailyReport.revenue,
          expenses: dailyReport.expenses,
          profit: dailyReport.profit,
          profit_margin: dailyReport.profitMargin,
          customer_count: dailyReport.customerCount || 0,
          popularity: dailyReport.popularity || 0,
          customer_satisfaction: dailyReport.customerSatisfaction || 0,
          content: JSON.stringify(dailyReport)
        };
        
        // Save report to database
        await dbAPI.db.insert('reports', reportData);
      } catch (error) {
        console.error("Error saving daily report to database:", error);
      }
    }
  }
  
  // End of week financial operations
  async onEndOfWeek() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Pay staff wages
    await this.expenseManager.payStaffWages();
    
    // Reset weekly stats
    this.game.state.currentVenue.finances.weeklyRevenue = 0;
    this.game.state.currentVenue.finances.weeklyExpenses = 0;
    
    // Generate weekly report
    const weeklyReport = await this.reportingManager.generateWeeklyReport();
    
    // If using database, save the report
    if (this.useDatabase && weeklyReport) {
      try {
        // Convert report to format expected by database
        const reportData = {
          venue_id: this.game.state.currentVenue.id,
          type: 'weekly',
          date: this.formatReportDate(weeklyReport.date),
          revenue: weeklyReport.revenue,
          expenses: weeklyReport.expenses,
          profit: weeklyReport.profit,
          profit_margin: weeklyReport.profitMargin,
          customer_count: weeklyReport.customerCount || 0,
          popularity: weeklyReport.popularity || 0,
          customer_satisfaction: weeklyReport.customerSatisfaction || 0,
          content: JSON.stringify(weeklyReport)
        };
        
        // Save report to database
        await dbAPI.db.insert('reports', reportData);
      } catch (error) {
        console.error("Error saving weekly report to database:", error);
      }
    }
  }
  
  // Monthly financial operations
  async onNewMonth() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Pay rent and other monthly expenses
    await this.expenseManager.payMonthlyExpenses();
    
    // Reset monthly stats
    this.game.state.currentVenue.finances.monthlyRevenue = 0;
    this.game.state.currentVenue.finances.monthlyExpenses = 0;
    
    // Generate monthly report
    const monthlyReport = await this.reportingManager.generateMonthlyReport();
    
    // If using database, save the report
    if (this.useDatabase && monthlyReport) {
      try {
        // Convert report to format expected by database
        const reportData = {
          venue_id: this.game.state.currentVenue.id,
          type: 'monthly',
          date: this.formatReportDate(monthlyReport.date),
          revenue: monthlyReport.revenue,
          expenses: monthlyReport.expenses,
          profit: monthlyReport.profit,
          profit_margin: monthlyReport.profitMargin,
          customer_count: monthlyReport.customerCount || 0,
          popularity: monthlyReport.popularity || 0,
          customer_satisfaction: monthlyReport.customerSatisfaction || 0,
          content: JSON.stringify(monthlyReport)
        };
        
        // Save report to database
        await dbAPI.db.insert('reports', reportData);
      } catch (error) {
        console.error("Error saving monthly report to database:", error);
      }
    }
  }
  
  // Yearly financial operations
  async onNewYear() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Generate yearly report
    const yearlyReport = await this.reportingManager.generateYearlyReport();
    
    // If using database, save the report
    if (this.useDatabase && yearlyReport) {
      try {
        // Convert report to format expected by database
        const reportData = {
          venue_id: this.game.state.currentVenue.id,
          type: 'yearly',
          date: this.formatReportDate(yearlyReport.date),
          revenue: yearlyReport.revenue,
          expenses: yearlyReport.expenses,
          profit: yearlyReport.profit,
          profit_margin: yearlyReport.profitMargin,
          customer_count: yearlyReport.customerCount || 0,
          popularity: yearlyReport.popularity || 0,
          customer_satisfaction: yearlyReport.customerSatisfaction || 0,
          content: JSON.stringify(yearlyReport)
        };
        
        // Save report to database
        await dbAPI.db.insert('reports', reportData);
      } catch (error) {
        console.error("Error saving yearly report to database:", error);
      }
    }
  }
  
  // Helper method to format report date
  formatReportDate(dateString) {
    // Convert report date string to ISO format
    // Example: convert "2025-1" to "2025-01-01T00:00:00.000Z"
    if (!dateString) return new Date().toISOString();
    
    try {
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 2) {
          // Monthly report: "2025-1"
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          return new Date(year, month - 1, 1).toISOString();
        } else if (parts.length === 3) {
          // Daily report: "2025-1-15"
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          return new Date(year, month - 1, day).toISOString();
        }
      } else if (dateString.includes('W')) {
        // Weekly report: "2025-W5"
        const year = parseInt(dateString.split('-')[0]);
        const week = parseInt(dateString.split('W')[1]);
        // Approximate: first day of year + (week * 7)
        const date = new Date(year, 0, 1 + ((week - 1) * 7));
        return date.toISOString();
      } else {
        // Yearly report: "2025"
        return new Date(parseInt(dateString), 0, 1).toISOString();
      }
    } catch (error) {
      console.error("Error formatting report date:", error);
    }
    
    // Default fallback
    return new Date().toISOString();
  }
  
  // Public methods for other modules to use
  async recordTransaction(transaction) {
    if (this.useDatabase) {
      try {
        // Make sure transaction has a timestamp
        if (!transaction.timestamp) {
          transaction.timestamp = new Date().toISOString();
        }
        
        // Add venue ID if not provided
        if (!transaction.venueId && this.game.state.currentVenue) {
          transaction.venueId = this.game.state.currentVenue.id;
        }
        
        // Convert game date to database-friendly format
        if (transaction.date) {
          const gameDate = transaction.date;
          transaction.game_date_year = gameDate.year;
          transaction.game_date_month = gameDate.month;
          transaction.game_date_day = gameDate.day;
          transaction.game_date_hour = gameDate.hour;
          transaction.game_date_minute = gameDate.minute;
          
          // Remove the original date object
          delete transaction.date;
        }
        
        // Record in database
        await dbAPI.transaction.recordTransaction(transaction);
        
        // Also update in-memory state if needed
        if (transaction.type === 'revenue') {
          // Update venue's revenue stats in memory
          const venue = this.game.state.currentVenue;
          if (venue) {
            venue.finances.dailyRevenue += transaction.amount;
            venue.finances.weeklyRevenue += transaction.amount;
            venue.finances.monthlyRevenue += transaction.amount;
          }
          
          // Update player's cash
          this.game.state.player.cash += transaction.amount;
        } else if (transaction.type === 'expense') {
          // Update venue's expense stats in memory
          const venue = this.game.state.currentVenue;
          if (venue) {
            venue.finances.dailyExpenses += transaction.amount;
            venue.finances.weeklyExpenses += transaction.amount;
            venue.finances.monthlyExpenses += transaction.amount;
          }
          
          // Update player's cash
          this.game.state.player.cash -= transaction.amount;
        }
      } catch (error) {
        console.error("Error recording transaction in database:", error);
        // Fallback to in-memory transaction recording
        return this.transactionManager.recordTransaction(transaction);
      }
    } else {
      // Use in-memory transaction recording
      return this.transactionManager.recordTransaction(transaction);
    }
  }
  
  async getTransactions(venueId, startDate, endDate, category) {
    if (this.useDatabase) {
      try {
        // Convert parameters to database query options
        const options = {
          venueId,
          category
        };
        
        if (startDate) {
          options.startDate = this.convertGameDateToISOString(startDate);
        }
        
        if (endDate) {
          options.endDate = this.convertGameDateToISOString(endDate);
        }
        
        // Query database
        return await dbAPI.transaction.getTransactions(venueId, options);
      } catch (error) {
        console.error("Error fetching transactions from database:", error);
        // Fallback to in-memory
        return this.transactionManager.getTransactions(venueId, startDate, endDate, category);
      }
    } else {
      // Use in-memory transaction fetching
      return this.transactionManager.getTransactions(venueId, startDate, endDate, category);
    }
  }
  
  // Helper method to convert game date to ISO string
  convertGameDateToISOString(gameDate) {
    try {
      if (!gameDate) return null;
      
      const year = gameDate.year || 2025;
      const month = (gameDate.month || 1) - 1; // JS months are 0-indexed
      const day = gameDate.day || 1;
      const hour = gameDate.hour || 0;
      const minute = gameDate.minute || 0;
      
      return new Date(year, month, day, hour, minute).toISOString();
    } catch (error) {
      console.error("Error converting game date:", error);
      return new Date().toISOString();
    }
  }
  
  async getFinancialReports(reportType) {
    if (this.useDatabase) {
      try {
        // Get current venue ID
        const venueId = this.game.state.currentVenue?.id;
        if (!venueId) return [];
        
        // Query database for reports
        const query = `
          SELECT * FROM reports 
          WHERE venue_id = ? AND type = ? 
          ORDER BY date DESC
        `;
        
        const reports = await dbAPI.db.query(query, [venueId, reportType]);
        
        // Convert database records to report objects
        return reports.map(record => {
          // Parse content JSON
          let content = {};
          try {
            content = JSON.parse(record.content || '{}');
          } catch (e) {
            console.error("Error parsing report content:", e);
          }
          
          return {
            ...content,
            id: record.id,
            date: record.date,
            type: record.type
          };
        });
      } catch (error) {
        console.error("Error fetching reports from database:", error);
        // Fallback to in-memory
        return this.reportingManager.getReports(reportType);
      }
    } else {
      // Use in-memory reports
      return this.reportingManager.getReports(reportType);
    }
  }
  
  async getProfitMargin(venueId, period = 'monthly') {
    if (this.useDatabase) {
      try {
        // Get financial summary from database
        const summary = await dbAPI.transaction.getFinancialSummary(venueId, period);
        return summary.profitMargin;
      } catch (error) {
        console.error(`Error getting profit margin from database:`, error);
        // Fallback to in-memory
        return this.reportingManager.getProfitMargin(venueId, period);
      }
    } else {
      // Use in-memory calculation
      return this.reportingManager.getProfitMargin(venueId, period);
    }
  }
  
  async calculateItemProfitability(venueId) {
    if (this.useDatabase) {
      try {
        // Use InventoryDAO to analyze profitability
        return await dbAPI.inventory.analyzeInventoryProfitability(venueId);
      } catch (error) {
        console.error(`Error calculating item profitability from database:`, error);
        // Fallback to in-memory
        return this.revenueManager.calculateItemProfitability(venueId);
      }
    } else {
      // Use in-memory calculation
      return this.revenueManager.calculateItemProfitability(venueId);
    }
  }
  
  // Enhanced methods that leverage database capabilities
  
  async getRevenueTrend(venueId, period = 'monthly', limit = 12) {
    if (this.useDatabase) {
      try {
        return await dbAPI.transaction.getRevenueTrend(venueId, period, limit);
      } catch (error) {
        console.error(`Error getting revenue trend from database:`, error);
        // No direct in-memory fallback, return empty array
        return [];
      }
    } else {
      // Limited in-memory fallback
      const reports = this.reportingManager.getReports(period);
      const venueReports = reports.filter(report => report.venueId === venueId);
      
      // Convert to trend format
      return venueReports.slice(0, limit).map(report => ({
        period: report.date,
        revenue: report.revenue,
        expenses: report.expenses,
        net_income: report.profit
      }));
    }
  }
  
  async getFinancialSummary(venueId, period = 'monthly') {
    if (this.useDatabase) {
      try {
        return await dbAPI.transaction.getFinancialSummary(venueId, period);
      } catch (error) {
        console.error(`Error getting financial summary from database:`, error);
        // Fallback to in-memory
        const reports = this.reportingManager.getReports(period);
        const latestReport = reports.find(report => report.venueId === venueId);
        
        return latestReport || {
          period,
          totalRevenue: 0,
          totalExpense: 0,
          netIncome: 0,
          profitMargin: 0,
          revenueByCategory: {},
          expensesByCategory: {}
        };
      }
    } else {
      // Basic in-memory summary
      const reports = this.reportingManager.getReports(period);
      const latestReport = reports.find(report => report.venueId === venueId);
      
      return latestReport || {
        period,
        totalRevenue: 0,
        totalExpense: 0,
        netIncome: 0,
        profitMargin: 0,
        revenueByCategory: {},
        expensesByCategory: {}
      };
    }
  }
  
  async getTopSellingItems(venueId, period = 'monthly', limit = 5) {
    if (this.useDatabase) {
      try {
        // Query for top selling items
        const query = `
          SELECT 
            item,
            subcategory as type,
            SUM(quantity) as quantity,
            SUM(amount) as revenue
          FROM transactions
          WHERE venue_id = ? 
          AND type = 'revenue'
          AND category = 'sales'
          AND item IS NOT NULL
          GROUP BY item, subcategory
          ORDER BY quantity DESC
          LIMIT ?
        `;
        
        return await dbAPI.db.query(query, [venueId, limit]);
      } catch (error) {
        console.error(`Error getting top selling items from database:`, error);
        // Fallback to customer order system in memory
        if (this.game.customerManager && this.game.customerManager.orders) {
          return this.game.customerManager.orders.getMostPopularItems(venueId, 'all', limit);
        }
        return [];
      }
    } else {
      // Limited in-memory functionality
      if (this.game.customerManager && this.game.customerManager.orders) {
        return this.game.customerManager.orders.getMostPopularItems(venueId, 'all', limit);
      }
      return [];
    }
  }
}

module.exports = FinancialManager;