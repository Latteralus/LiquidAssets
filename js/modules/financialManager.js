// Financial Manager - Main file that imports and orchestrates financial sub-modules

const ExpenseManager = require('./finances/expenseManager');
const RevenueManager = require('./finances/revenueManager');
const TransactionManager = require('./finances/transactionManager');
const ReportingManager = require('./finances/reportingManager');

class FinancialManager {
  constructor(game) {
    this.game = game;
    
    // Initialize sub-modules
    this.expenseManager = new ExpenseManager(game);
    this.revenueManager = new RevenueManager(game);
    this.transactionManager = new TransactionManager(game);
    this.reportingManager = new ReportingManager(game, this.transactionManager);
  }
  
  // Daily financial operations
  onNewDay() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Pay daily expenses
    this.expenseManager.payDailyExpenses();
    
    // Reset daily stats
    this.game.state.currentVenue.finances.dailyRevenue = 0;
    this.game.state.currentVenue.finances.dailyExpenses = 0;
    
    // Generate daily report
    this.reportingManager.generateDailyReport();
  }
  
  // End of week financial operations
  onEndOfWeek() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Pay staff wages
    this.expenseManager.payStaffWages();
    
    // Reset weekly stats
    this.game.state.currentVenue.finances.weeklyRevenue = 0;
    this.game.state.currentVenue.finances.weeklyExpenses = 0;
    
    // Generate weekly report
    this.reportingManager.generateWeeklyReport();
  }
  
  // Monthly financial operations
  onNewMonth() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Pay rent and other monthly expenses
    this.expenseManager.payMonthlyExpenses();
    
    // Reset monthly stats
    this.game.state.currentVenue.finances.monthlyRevenue = 0;
    this.game.state.currentVenue.finances.monthlyExpenses = 0;
    
    // Generate monthly report
    this.reportingManager.generateMonthlyReport();
  }
  
  // Yearly financial operations
  onNewYear() {
    // Skip if no current venue
    if (!this.game.state.currentVenue) return;
    
    // Generate yearly report
    this.reportingManager.generateYearlyReport();
  }
  
  // Public methods for other modules to use
  recordTransaction(transaction) {
    this.transactionManager.recordTransaction(transaction);
  }
  
  getTransactions(venueId, startDate, endDate, category) {
    return this.transactionManager.getTransactions(venueId, startDate, endDate, category);
  }
  
  getFinancialReports(reportType) {
    return this.reportingManager.getReports(reportType);
  }
  
  getProfitMargin(venueId, period = 'monthly') {
    return this.reportingManager.getProfitMargin(venueId, period);
  }
  
  calculateItemProfitability(venueId) {
    return this.revenueManager.calculateItemProfitability(venueId);
  }
}

module.exports = FinancialManager;