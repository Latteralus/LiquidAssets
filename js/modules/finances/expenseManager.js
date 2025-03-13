// ExpenseManager - Handles all expense-related operations

class ExpenseManager {
    constructor(game) {
      this.game = game;
    }
    
    payDailyExpenses() {
      const venue = this.game.state.currentVenue;
      
      // Utilities, consumables, etc.
      const dailyUtilities = this.calculateDailyUtilities(venue);
      
      // Deduct from cash
      this.game.state.player.cash -= dailyUtilities;
      
      // Update finances
      venue.finances.dailyExpenses += dailyUtilities;
      venue.finances.weeklyExpenses += dailyUtilities;
      venue.finances.monthlyExpenses += dailyUtilities;
      
      // Log the expense
      window.logToConsole(`Daily utilities expense: €${dailyUtilities.toFixed(2)}`, 'info');
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'expense',
        category: 'utilities',
        amount: dailyUtilities,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
    }
    
    calculateDailyUtilities(venue) {
      // Base costs depend on venue size and type
      const sizeMultiplier = { 'small': 1, 'medium': 1.8, 'large': 3 };
      const typeMultiplier = {
        'Bar': 1,
        'Restaurant': 1.5,
        'Nightclub': 2,
        'Fast Food': 1.2
      };
      
      // Calculate base utility cost
      const baseUtilityCost = 20 * sizeMultiplier[venue.size] * typeMultiplier[venue.type];
      
      // Add additional costs based on equipment and settings
      let additionalCosts = 0;
      
      // Music and lighting costs
      additionalCosts += (venue.settings.musicVolume / 100) * 10;
      additionalCosts += (venue.settings.lightingLevel / 100) * 8;
      
      // Kitchen costs if applicable
      if (venue.type === 'Restaurant' || venue.type === 'Fast Food') {
        additionalCosts += 30;
      }
      
      return baseUtilityCost + additionalCosts;
    }
    
    payStaffWages() {
      const venue = this.game.state.currentVenue;
      if (!venue.staff || venue.staff.length === 0) return;
      
      let totalWages = 0;
      
      // Calculate wages for each staff member
      venue.staff.forEach(staffId => {
        const staff = this.game.staffManager.getStaff(staffId);
        if (staff) {
          totalWages += staff.wage;
          
          // Record individual wage payment
          this.game.financialManager.recordTransaction({
            type: 'expense',
            category: 'wages',
            amount: staff.wage,
            date: { ...this.game.timeManager.getGameTime() },
            venueId: venue.id,
            staffId: staff.id,
            staffName: staff.name
          });
        }
      });
      
      // Deduct from cash
      this.game.state.player.cash -= totalWages;
      
      // Update finances
      venue.finances.weeklyExpenses += totalWages;
      venue.finances.monthlyExpenses += totalWages;
      
      // Log the expense
      window.logToConsole(`Staff wages paid: €${totalWages.toFixed(2)}`, 'info');
    }
    
    payMonthlyExpenses() {
      const venue = this.game.state.currentVenue;
      
      // Pay rent
      const rent = venue.finances.rentPerMonth;
      
      // Deduct from cash
      this.game.state.player.cash -= rent;
      
      // Update finances
      venue.finances.monthlyExpenses += rent;
      venue.finances.lastRentPayment = this.game.timeManager.getGameTime().day;
      
      // Log the expense
      window.logToConsole(`Monthly rent paid: €${rent.toFixed(2)}`, 'info');
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'expense',
        category: 'rent',
        amount: rent,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      // Check if cash is running low
      if (this.game.state.player.cash < rent) {
        window.logToConsole('WARNING: Your cash reserves are running low! Consider adjusting prices or cutting expenses.', 'warning');
      }
    }
    
    payUtilityBill(venue, utilityType) {
      // Different utility types (electricity, water, gas, etc.)
      const utilityRates = {
        electricity: 0.15 * venue.settings.musicVolume + 0.2 * venue.settings.lightingLevel,
        water: venue.type === 'Restaurant' ? 50 : 20,
        gas: venue.type === 'Restaurant' || venue.type === 'Fast Food' ? 40 : 10,
        internet: 30,
        waste: venue.type === 'Restaurant' || venue.type === 'Fast Food' ? 40 : 20
      };
      
      // Calculate cost based on venue size
      const sizeMultiplier = { 'small': 1, 'medium': 1.8, 'large': 3 };
      const cost = utilityRates[utilityType] * sizeMultiplier[venue.size];
      
      // Deduct from cash
      this.game.state.player.cash -= cost;
      
      // Update finances
      venue.finances.monthlyExpenses += cost;
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'expense',
        category: 'utilities',
        subcategory: utilityType,
        amount: cost,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      return cost;
    }
    
    payLicenseFee(venue, licenseType) {
      // License types (alcohol, food, music, etc.)
      const licenseFees = {
        alcohol: this.game.cityManager.getCityRegulations(venue.city).alcoholLicenseCost,
        food: 500,
        music: 300,
        business: 200
      };
      
      const cost = licenseFees[licenseType] || 0;
      
      // Deduct from cash
      this.game.state.player.cash -= cost;
      
      // Update finances
      venue.finances.monthlyExpenses += cost;
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'expense',
        category: 'license',
        subcategory: licenseType,
        amount: cost,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      return cost;
    }
    
    payMarketingExpense(venue, marketingType, amount) {
      // Deduct from cash
      this.game.state.player.cash -= amount;
      
      // Update finances
      venue.finances.monthlyExpenses += amount;
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'expense',
        category: 'marketing',
        subcategory: marketingType,
        amount: amount,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      return amount;
    }
    
    payMaintenanceExpense(venue, maintenanceType, amount) {
      // Deduct from cash
      this.game.state.player.cash -= amount;
      
      // Update finances
      venue.finances.monthlyExpenses += amount;
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'expense',
        category: 'maintenance',
        subcategory: maintenanceType,
        amount: amount,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      return amount;
    }
    
    calculateDetailedExpenses(period, venueId) {
      // Get all expenses for the period
      const startDate = this.getStartDateForPeriod(period);
      const expenses = this.game.financialManager.getTransactions(
        venueId, 
        startDate, 
        null, 
        'expense'
      );
      
      // Group by category
      const expensesByCategory = {};
      
      expenses.forEach(expense => {
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = 0;
        }
        expensesByCategory[expense.category] += expense.amount;
      });
      
      return expensesByCategory;
    }
    
    getStartDateForPeriod(period) {
      const currentTime = this.game.timeManager.getGameTime();
      const startDate = { ...currentTime };
      
      // Calculate start date based on period
      switch (period) {
        case 'daily':
          // Start of current day
          startDate.hour = 0;
          startDate.minute = 0;
          break;
        case 'weekly':
          // Go back 7 days
          startDate.day -= 7;
          if (startDate.day <= 0) {
            startDate.month--;
            if (startDate.month <= 0) {
              startDate.year--;
              startDate.month = 12;
            }
            // Simplified - assume 30 days per month
            startDate.day += 30;
          }
          break;
        case 'monthly':
          // Go back one month
          startDate.month--;
          if (startDate.month <= 0) {
            startDate.year--;
            startDate.month = 12;
          }
          break;
        case 'yearly':
          // Go back one year
          startDate.year--;
          break;
      }
      
      return startDate;
    }
    
    // Calculate expense forecasts
    forecastExpenses(venueId, periodMonths = 3) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue) return null;
      
      // Get historical expense data
      const startDate = this.getStartDateForPeriod('monthly');
      startDate.month -= (periodMonths - 1);
      if (startDate.month <= 0) {
        startDate.year--;
        startDate.month += 12;
      }
      
      const expenses = this.game.financialManager.getTransactions(
        venueId, 
        startDate, 
        null, 
        'expense'
      );
      
      // Group by category and month for trend analysis
      const expensesTrend = {};
      
      expenses.forEach(expense => {
        const monthKey = `${expense.date.year}-${expense.date.month}`;
        
        if (!expensesTrend[expense.category]) {
          expensesTrend[expense.category] = {};
        }
        
        if (!expensesTrend[expense.category][monthKey]) {
          expensesTrend[expense.category][monthKey] = 0;
        }
        
        expensesTrend[expense.category][monthKey] += expense.amount;
      });
      
      // Calculate forecast for each category
      const forecast = {};
      
      Object.keys(expensesTrend).forEach(category => {
        const monthlyValues = Object.values(expensesTrend[category]);
        
        // Simple average for forecast
        let sum = 0;
        monthlyValues.forEach(value => sum += value);
        forecast[category] = sum / monthlyValues.length;
        
        // Adjust for trend if we have enough data
        if (monthlyValues.length >= 3) {
          const recentMonths = monthlyValues.slice(-3);
          let trendSum = 0;
          recentMonths.forEach(value => trendSum += value);
          const recentAvg = trendSum / recentMonths.length;
          
          // Weight recent trend more heavily
          forecast[category] = forecast[category] * 0.3 + recentAvg * 0.7;
        }
      });
      
      return forecast;
    }
  }
  
  module.exports = ExpenseManager;