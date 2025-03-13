// js/ui/processor/financeCommands.js
// Handles financial commands for reports, transactions, and analysis

/**
 * FinanceCommands - Module for processing financial commands
 * @param {Object} game - Reference to the game instance
 */
class FinanceCommands {
    constructor(game) {
      this.game = game;
    }
  
    /**
     * Process finance-related commands
     * @param {string} command - The command to process
     * @param {Array} args - The command arguments
     * @returns {boolean} True if the command was successfully processed
     */
    processCommand(command, args) {
      switch (command) {
        case 'finances':
        case 'financial':
          return this.showFinancialSummary();
        case 'dailyreport':
          return this.showDailyReport();
        case 'weeklyreport':
          return this.showWeeklyReport();
        case 'monthlyreport':
          return this.showMonthlyReport();
        case 'yearlyreport':
          return this.showYearlyReport();
        case 'transactions':
        case 'viewtransactions':
          return this.viewTransactions(args);
        case 'expenses':
        case 'viewexpenses':
          return this.viewExpenses();
        case 'revenue':
        case 'viewrevenue':
          return this.viewRevenue();
        case 'profitability':
        case 'itemprofitability':
          return this.showItemProfitability();
        case 'forecast':
        case 'financialforecast':
          return this.showFinancialForecast();
        case 'financemenu':
          return this.showFinanceMenu();
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
     * Show financial summary
     * @returns {boolean} Success status
     */
    showFinancialSummary() {
      if (!this.validateVenueExists()) return false;
  
      const venue = this.game.state.currentVenue;
      
      this.game.notificationManager.info(`=== Financial Summary: ${venue.name} ===`);
      
      // Today's summary
      this.game.notificationManager.info("--- Today ---");
      this.game.notificationManager.info(`Revenue: €${venue.finances.dailyRevenue.toFixed(2)}`);
      this.game.notificationManager.info(`Expenses: €${venue.finances.dailyExpenses.toFixed(2)}`);
      const dailyProfit = venue.finances.dailyRevenue - venue.finances.dailyExpenses;
      this.game.notificationManager.info(`Profit: €${dailyProfit.toFixed(2)}`);
      
      // This week's summary
      this.game.notificationManager.info("--- This Week ---");
      this.game.notificationManager.info(`Revenue: €${venue.finances.weeklyRevenue.toFixed(2)}`);
      this.game.notificationManager.info(`Expenses: €${venue.finances.weeklyExpenses.toFixed(2)}`);
      const weeklyProfit = venue.finances.weeklyRevenue - venue.finances.weeklyExpenses;
      this.game.notificationManager.info(`Profit: €${weeklyProfit.toFixed(2)}`);
      
      // This month's summary
      this.game.notificationManager.info("--- This Month ---");
      this.game.notificationManager.info(`Revenue: €${venue.finances.monthlyRevenue.toFixed(2)}`);
      this.game.notificationManager.info(`Expenses: €${venue.finances.monthlyExpenses.toFixed(2)}`);
      const monthlyProfit = venue.finances.monthlyRevenue - venue.finances.monthlyExpenses;
      this.game.notificationManager.info(`Profit: €${monthlyProfit.toFixed(2)}`);
      
      // Fixed costs
      this.game.notificationManager.info("--- Fixed Costs ---");
      this.game.notificationManager.info(`Monthly Rent: €${venue.finances.rentPerMonth.toFixed(2)}`);
      
      // Calculate staff costs
      let staffCosts = 0;
      if (this.game.staffManager) {
        staffCosts = this.game.staffManager.getStaffCost(venue.id);
      }
      this.game.notificationManager.info(`Weekly Staff Wages: €${staffCosts.toFixed(2)}`);
      
      // Daily utility expenses
      this.game.notificationManager.info(`Daily Utilities: €${venue.finances.utilityExpensePerDay.toFixed(2)}`);
      
      // Cash on hand
      this.game.notificationManager.info(`\nCash on hand: €${this.game.state.player.cash.toFixed(2)}`);
      
      return true;
    }
  
    /**
     * Show daily financial report
     * @returns {boolean} Success status
     */
    showDailyReport() {
      if (!this.validateVenueExists()) return false;
  
      // Generate report if the financial manager exists
      if (!this.game.financialManager || !this.game.financialManager.reportingManager) {
        this.game.notificationManager.error("Financial reporting system not available.");
        return false;
      }
      
      const report = this.game.financialManager.reportingManager.generateDailyReport();
      
      if (!report) {
        this.game.notificationManager.error("Failed to generate daily report.");
        return false;
      }
      
      this.displayReport(report);
      return true;
    }
  
    /**
     * Show weekly financial report
     * @returns {boolean} Success status
     */
    showWeeklyReport() {
      if (!this.validateVenueExists()) return false;
  
      // Generate report if the financial manager exists
      if (!this.game.financialManager || !this.game.financialManager.reportingManager) {
        this.game.notificationManager.error("Financial reporting system not available.");
        return false;
      }
      
      const report = this.game.financialManager.reportingManager.generateWeeklyReport();
      
      if (!report) {
        this.game.notificationManager.error("Failed to generate weekly report.");
        return false;
      }
      
      this.displayReport(report);
      return true;
    }
  
    /**
     * Show monthly financial report
     * @returns {boolean} Success status
     */
    showMonthlyReport() {
      if (!this.validateVenueExists()) return false;
  
      // Generate report if the financial manager exists
      if (!this.game.financialManager || !this.game.financialManager.reportingManager) {
        this.game.notificationManager.error("Financial reporting system not available.");
        return false;
      }
      
      const report = this.game.financialManager.reportingManager.generateMonthlyReport();
      
      if (!report) {
        this.game.notificationManager.error("Failed to generate monthly report.");
        return false;
      }
      
      this.displayReport(report);
      return true;
    }
  
    /**
     * Show yearly financial report
     * @returns {boolean} Success status
     */
    showYearlyReport() {
      if (!this.validateVenueExists()) return false;
  
      // Generate report if the financial manager exists
      if (!this.game.financialManager || !this.game.financialManager.reportingManager) {
        this.game.notificationManager.error("Financial reporting system not available.");
        return false;
      }
      
      const report = this.game.financialManager.reportingManager.generateYearlyReport();
      
      if (!report) {
        this.game.notificationManager.error("Failed to generate yearly report.");
        return false;
      }
      
      this.displayReport(report);
      return true;
    }
  
    /**
     * Display a financial report
     * @param {Object} report - The report to display
     */
    displayReport(report) {
      this.game.notificationManager.info(`=== ${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report: ${report.venueName} ===`);
      this.game.notificationManager.info(`Date: ${report.date}`);
      
      // Summary
      this.game.notificationManager.info("--- Summary ---");
      this.game.notificationManager.info(`Revenue: €${report.revenue.toFixed(2)}`);
      this.game.notificationManager.info(`Expenses: €${report.expenses.toFixed(2)}`);
      this.game.notificationManager.info(`Profit: €${report.profit.toFixed(2)}`);
      this.game.notificationManager.info(`Profit Margin: ${report.profitMargin.toFixed(2)}%`);
      
      // Revenue breakdown
      if (report.revenueBreakdown && Object.keys(report.revenueBreakdown).length > 0) {
        this.game.notificationManager.info("--- Revenue Breakdown ---");
        Object.entries(report.revenueBreakdown).forEach(([category, amount]) => {
          const percentage = (amount / report.revenue * 100).toFixed(1);
          this.game.notificationManager.info(`${this.formatCategory(category)}: €${amount.toFixed(2)} (${percentage}%)`);
        });
      }
      
      // Expense breakdown
      if (report.expenseBreakdown && Object.keys(report.expenseBreakdown).length > 0) {
        this.game.notificationManager.info("--- Expense Breakdown ---");
        Object.entries(report.expenseBreakdown).forEach(([category, amount]) => {
          const percentage = (amount / report.expenses * 100).toFixed(1);
          this.game.notificationManager.info(`${this.formatCategory(category)}: €${amount.toFixed(2)} (${percentage}%)`);
        });
      }
      
      // Monthly data for yearly reports
      if (report.type === 'yearly' && report.monthlyData) {
        this.game.notificationManager.info("--- Monthly Trends ---");
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 1; i <= 12; i++) {
          const monthData = report.monthlyData[i];
          if (monthData) {
            this.game.notificationManager.info(`${monthNames[i-1]}: Revenue: €${monthData.revenue.toFixed(2)} | Profit: €${monthData.profit.toFixed(2)}`);
          }
        }
      }
      
      // Operational stats
      this.game.notificationManager.info("--- Operations ---");
      this.game.notificationManager.info(`Customers Served: ${report.customerCount}`);
      this.game.notificationManager.info(`Popularity: ${report.popularity.toFixed(1)}%`);
      this.game.notificationManager.info(`Customer Satisfaction: ${report.customerSatisfaction.toFixed(1)}%`);
    }
  
    /**
     * Format category names for display
     * @param {string} category - The category name
     * @returns {string} Formatted category name
     */
    formatCategory(category) {
      return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  
    /**
     * View recent transactions
     * @param {Array} args - Command arguments: [count]
     * @returns {boolean} Success status
     */
    viewTransactions(args) {
      if (!this.validateVenueExists()) return false;
  
      // Check if transaction manager exists
      if (!this.game.financialManager || !this.game.financialManager.transactionManager) {
        this.game.notificationManager.error("Transaction system not available.");
        return false;
      }
      
      // Parse count argument
      let count = 10; // Default
      if (args.length > 0) {
        const parsedCount = parseInt(args[0], 10);
        if (!isNaN(parsedCount) && parsedCount > 0) {
          count = Math.min(50, parsedCount); // Cap at 50
        }
      }
      
      // Get recent transactions
      const transactions = this.game.financialManager.transactionManager.getTransactions(
        this.game.state.currentVenue.id, 
        null,
        null, 
        null
      );
      
      if (!transactions || transactions.length === 0) {
        this.game.notificationManager.info("No transactions found for this venue.");
        return true;
      }
      
      // Display transactions
      this.game.notificationManager.info(`=== Recent Transactions: ${this.game.state.currentVenue.name} ===`);
      
      // Sort by timestamp (newest first)
      const sortedTransactions = [...transactions].sort((a, b) => {
        // Sort by date
        if (a.date.year !== b.date.year) return b.date.year - a.date.year;
        if (a.date.month !== b.date.month) return b.date.month - a.date.month;
        if (a.date.day !== b.date.day) return b.date.day - a.date.day;
        if (a.date.hour !== b.date.hour) return b.date.hour - a.date.hour;
        return b.date.minute - a.date.minute;
      });
      
      // Take only the requested number of transactions
      const recentTransactions = sortedTransactions.slice(0, count);
      
      // Display transactions
      recentTransactions.forEach(transaction => {
        const date = `${transaction.date.month}/${transaction.date.day} ${transaction.date.hour}:${transaction.date.minute.toString().padStart(2, '0')}`;
        const type = transaction.type === 'revenue' ? '+' : '-';
        const category = this.formatCategory(transaction.category);
        const subcategory = transaction.subcategory ? ` (${this.formatCategory(transaction.subcategory)})` : '';
        
        this.game.notificationManager.info(`${date} ${type}€${transaction.amount.toFixed(2)} - ${category}${subcategory}`);
        
        // Show item details if available
        if (transaction.item) {
          this.game.notificationManager.info(`  Item: ${transaction.item}${transaction.quantity ? ` x${transaction.quantity}` : ''}`);
        }
      });
      
      // Show instruction for more transactions
      if (transactions.length > count) {
        this.game.notificationManager.info(`\nShowing ${count} of ${transactions.length} transactions. Use 'transactions <count>' to see more.`);
      }
      
      return true;
    }
  
    /**
     * View expense breakdown
     * @returns {boolean} Success status
     */
    viewExpenses() {
      if (!this.validateVenueExists()) return false;
  
      // Check if expense manager exists
      if (!this.game.financialManager || !this.game.financialManager.expenseManager) {
        this.game.notificationManager.error("Expense manager not available.");
        return false;
      }
      
      // Get expense breakdown
      const expenses = this.game.financialManager.expenseManager.calculateDetailedExpenses(
        'monthly', 
        this.game.state.currentVenue.id
      );
      
      if (!expenses || Object.keys(expenses).length === 0) {
        this.game.notificationManager.info("No expense data available for this venue.");
        return true;
      }
      
      // Display expense breakdown
      this.game.notificationManager.info(`=== Monthly Expenses: ${this.game.state.currentVenue.name} ===`);
      
      // Calculate total expenses
      const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
      
      // Show each category
      Object.entries(expenses).forEach(([category, amount]) => {
        const percentage = (amount / totalExpenses * 100).toFixed(1);
        this.game.notificationManager.info(`${this.formatCategory(category)}: €${amount.toFixed(2)} (${percentage}%)`);
      });
      
      // Show total
      this.game.notificationManager.info(`\nTotal Monthly Expenses: €${totalExpenses.toFixed(2)}`);
      
      return true;
    }
  
    /**
     * View revenue breakdown
     * @returns {boolean} Success status
     */
    viewRevenue() {
      if (!this.validateVenueExists()) return false;
  
      // Check if revenue manager exists
      if (!this.game.financialManager || !this.game.financialManager.revenueManager) {
        this.game.notificationManager.error("Revenue manager not available.");
        return false;
      }
      
      // Get recent transactions for revenue analysis
      const transactions = this.game.financialManager.transactionManager.getTransactions(
        this.game.state.currentVenue.id, 
        this.game.financialManager.transactionManager.getStartDateForPeriod('monthly'),
        null, 
        'revenue'
      );
      
      if (!transactions || transactions.length === 0) {
        this.game.notificationManager.info("No revenue data available for this month.");
        return true;
      }
      
      // Group by category
      const revenueByCategory = {};
      let totalRevenue = 0;
      
      transactions.forEach(transaction => {
        if (!revenueByCategory[transaction.category]) {
          revenueByCategory[transaction.category] = 0;
        }
        revenueByCategory[transaction.category] += transaction.amount;
        totalRevenue += transaction.amount;
      });
      
      // Display revenue breakdown
      this.game.notificationManager.info(`=== Monthly Revenue: ${this.game.state.currentVenue.name} ===`);
      
      // Show each category
      Object.entries(revenueByCategory).forEach(([category, amount]) => {
        const percentage = (amount / totalRevenue * 100).toFixed(1);
        this.game.notificationManager.info(`${this.formatCategory(category)}: €${amount.toFixed(2)} (${percentage}%)`);
      });
      
      // Show total
      this.game.notificationManager.info(`\nTotal Monthly Revenue: €${totalRevenue.toFixed(2)}`);
      
      // Show top-selling items if available
      const topItems = this.game.customerManager?.orders?.getMostPopularItems(this.game.state.currentVenue.id);
      
      if (topItems && topItems.length > 0) {
        this.game.notificationManager.info("\n--- Top Selling Items ---");
        topItems.forEach((itemData, index) => {
          this.game.notificationManager.info(`${index + 1}. ${itemData.item}: ${itemData.count} sales`);
        });
      }
      
      return true;
    }
  
    /**
     * Show item profitability analysis
     * @returns {boolean} Success status
     */
    showItemProfitability() {
      if (!this.validateVenueExists()) return false;
  
      // Check if revenue manager exists
      if (!this.game.financialManager || !this.game.financialManager.revenueManager) {
        this.game.notificationManager.error("Revenue manager not available.");
        return false;
      }
      
      // Calculate item profitability
      const profitability = this.game.financialManager.revenueManager.calculateItemProfitability(
        this.game.state.currentVenue.id
      );
      
      if (!profitability) {
        this.game.notificationManager.info("No profitability data available for this venue.");
        return true;
      }
      
      // Display profitability analysis
      this.game.notificationManager.info(`=== Item Profitability: ${this.game.state.currentVenue.name} ===`);
      
      // Drinks
      if (profitability.drinks && profitability.drinks.length > 0) {
        this.game.notificationManager.info("--- Drinks ---");
        
        profitability.drinks.forEach(item => {
          this.game.notificationManager.info(`${item.name}: Cost: €${item.costPrice.toFixed(2)} | Price: €${item.sellPrice.toFixed(2)} | Profit: €${item.profit.toFixed(2)} | Margin: ${item.profitMargin.toFixed(1)}%`);
        });
      }
      
      // Food
      if (profitability.food && profitability.food.length > 0) {
        this.game.notificationManager.info("\n--- Food ---");
        
        profitability.food.forEach(item => {
          this.game.notificationManager.info(`${item.name}: Cost: €${item.costPrice.toFixed(2)} | Price: €${item.sellPrice.toFixed(2)} | Profit: €${item.profit.toFixed(2)} | Margin: ${item.profitMargin.toFixed(1)}%`);
        });
      }
      
      return true;
    }
  
    /**
     * Show financial forecast
     * @returns {boolean} Success status
     */
    showFinancialForecast() {
      if (!this.validateVenueExists()) return false;
  
      // Check if financial managers exist
      if (!this.game.financialManager || !this.game.financialManager.revenueManager || !this.game.financialManager.expenseManager) {
        this.game.notificationManager.error("Financial forecasting not available.");
        return false;
      }
      
      // Get revenue forecast
      const revenueForecast = this.game.financialManager.revenueManager.forecastRevenue(
        this.game.state.currentVenue.id
      );
      
      // Get expense forecast
      const expenseForecast = this.game.financialManager.expenseManager.forecastExpenses(
        this.game.state.currentVenue.id
      );
      
      if (!revenueForecast || !expenseForecast) {
        this.game.notificationManager.info("Insufficient data for financial forecast. More operating history needed.");
        return true;
      }
      
      // Calculate total forecasts
      const totalRevenue = typeof revenueForecast === 'number' ? 
        revenueForecast : 
        Object.values(revenueForecast).reduce((sum, amount) => sum + amount, 0);
      
      const totalExpenses = Object.values(expenseForecast).reduce((sum, amount) => sum + amount, 0);
      const projectedProfit = totalRevenue - totalExpenses;
      const projectedMargin = totalRevenue > 0 ? (projectedProfit / totalRevenue * 100) : 0;
      
      // Display forecast
      this.game.notificationManager.info(`=== Financial Forecast: ${this.game.state.currentVenue.name} ===`);
      this.game.notificationManager.info("Projected next month:");
      
      // Summary
      this.game.notificationManager.info(`Projected Revenue: €${totalRevenue.toFixed(2)}`);
      this.game.notificationManager.info(`Projected Expenses: €${totalExpenses.toFixed(2)}`);
      this.game.notificationManager.info(`Projected Profit: €${projectedProfit.toFixed(2)}`);
      this.game.notificationManager.info(`Projected Profit Margin: ${projectedMargin.toFixed(1)}%`);
      
      // Expense breakdown
      if (Object.keys(expenseForecast).length > 0) {
        this.game.notificationManager.info("\n--- Projected Expenses ---");
        
        Object.entries(expenseForecast).forEach(([category, amount]) => {
          const percentage = (amount / totalExpenses * 100).toFixed(1);
          this.game.notificationManager.info(`${this.formatCategory(category)}: €${amount.toFixed(2)} (${percentage}%)`);
        });
      }
      
      // Recommendations
      this.game.notificationManager.info("\n--- Recommendations ---");
      
      if (projectedProfit < 0) {
        this.game.notificationManager.info("• Warning: Projected loss for next month. Consider reducing expenses or increasing prices.");
      }
      
      if (projectedMargin < 10 && projectedProfit > 0) {
        this.game.notificationManager.info("• Profit margin is low. Consider strategies to increase revenue or reduce costs.");
      }
      
      // Specific recommendations based on expense breakdown
      if (expenseForecast.rent && (expenseForecast.rent / totalExpenses > 0.4)) {
        this.game.notificationManager.info("• Rent costs are very high relative to other expenses. Consider maximizing venue usage.");
      }
      
      if (expenseForecast.wages && (expenseForecast.wages / totalExpenses > 0.5)) {
        this.game.notificationManager.info("• Staff costs are very high. Review staffing levels and wage rates.");
      }
      
      return true;
    }
  
    /**
     * Show finance management menu
     * @returns {boolean} Success status
     */
    showFinanceMenu() {
      if (this.game.uiManager && this.game.uiManager.showFinanceMenu) {
        this.game.uiManager.showFinanceMenu();
        return true;
      } else {
        this.game.notificationManager.error("Menu functionality not available.");
        return false;
      }
    }
  }
  
  module.exports = FinanceCommands;