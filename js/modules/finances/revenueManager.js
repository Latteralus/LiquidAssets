// RevenueManager - Handles all revenue-related operations

class RevenueManager {
    constructor(game) {
      this.game = game;
    }
    
    recordSale(venue, itemType, itemName, quantity, price) {
      const total = quantity * price;
      
      // Update venue finances
      venue.finances.dailyRevenue += total;
      venue.finances.weeklyRevenue += total;
      venue.finances.monthlyRevenue += total;
      
      // Update player cash
      this.game.state.player.cash += total;
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'revenue',
        category: 'sales',
        subcategory: itemType,
        item: itemName,
        quantity: quantity,
        price: price,
        amount: total,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      return total;
    }
    
    recordEntranceFee(venue, customerCount, feePerPerson) {
      const total = customerCount * feePerPerson;
      
      // Update venue finances
      venue.finances.dailyRevenue += total;
      venue.finances.weeklyRevenue += total;
      venue.finances.monthlyRevenue += total;
      
      // Update player cash
      this.game.state.player.cash += total;
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'revenue',
        category: 'entrance',
        quantity: customerCount,
        price: feePerPerson,
        amount: total,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      return total;
    }
    
    recordSpecialEventRevenue(venue, eventName, amount) {
      // Update venue finances
      venue.finances.dailyRevenue += amount;
      venue.finances.weeklyRevenue += amount;
      venue.finances.monthlyRevenue += amount;
      
      // Update player cash
      this.game.state.player.cash += amount;
      
      // Record transaction
      this.game.financialManager.recordTransaction({
        type: 'revenue',
        category: 'event',
        subcategory: eventName,
        amount: amount,
        date: { ...this.game.timeManager.getGameTime() },
        venueId: venue.id
      });
      
      return amount;
    }
    
    calculateItemProfitability(venueId) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory) return {};
      
      const profitabilityData = {
        drinks: [],
        food: []
      };
      
      // Calculate for drinks
      if (venue.inventory.drinks) {
        venue.inventory.drinks.forEach(drink => {
          const profitability = {
            name: drink.name,
            costPrice: drink.costPrice,
            sellPrice: drink.sellPrice,
            markup: ((drink.sellPrice / drink.costPrice) - 1) * 100,
            profitMargin: ((drink.sellPrice - drink.costPrice) / drink.sellPrice) * 100,
            profit: drink.sellPrice - drink.costPrice,
            stock: drink.stock
          };
          
          profitabilityData.drinks.push(profitability);
        });
      }
      
      // Calculate for food
      if (venue.inventory.food) {
        venue.inventory.food.forEach(food => {
          const profitability = {
            name: food.name,
            costPrice: food.costPrice,
            sellPrice: food.sellPrice,
            markup: ((food.sellPrice / food.costPrice) - 1) * 100,
            profitMargin: ((food.sellPrice - food.costPrice) / food.sellPrice) * 100,
            profit: food.sellPrice - food.costPrice,
            stock: food.stock
          };
          
          profitabilityData.food.push(profitability);
        });
      }
      
      // Sort by profit margin
      profitabilityData.drinks.sort((a, b) => b.profitMargin - a.profitMargin);
      profitabilityData.food.sort((a, b) => b.profitMargin - a.profitMargin);
      
      return profitabilityData;
    }
    
    calculatePeakRevenueHours(venueId) {
      // Get all revenue transactions
      const startDate = this.getStartDateForPeriod('monthly');
      const revenues = this.game.financialManager.getTransactions(
        venueId, 
        startDate, 
        null, 
        'revenue'
      );
      
      // Group by hour
      const hourlyRevenue = Array(24).fill(0);
      const hourlyTransactions = Array(24).fill(0);
      
      revenues.forEach(revenue => {
        const hour = revenue.date.hour;
        hourlyRevenue[hour] += revenue.amount;
        hourlyTransactions[hour]++;
      });
      
      // Calculate average revenue per hour
      const hourlyAverages = hourlyRevenue.map((total, index) => {
        const transactions = hourlyTransactions[index];
        return {
          hour: index,
          total: total,
          transactions: transactions,
          average: transactions > 0 ? total / transactions : 0
        };
      });
      
      // Sort to find peak hours
      const sortedHours = [...hourlyAverages].sort((a, b) => b.total - a.total);
      
      return {
        hourlyData: hourlyAverages,
        peakHours: sortedHours.slice(0, 3)
      };
    }
    
    calculateRevenueByWeekday(venueId) {
      // Get all revenue transactions for the past few months
      const startDate = this.getStartDateForPeriod('monthly');
      startDate.month -= 2; // Go back 3 months total
      if (startDate.month <= 0) {
        startDate.year--;
        startDate.month += 12;
      }
      
      const revenues = this.game.financialManager.getTransactions(
        venueId, 
        startDate, 
        null, 
        'revenue'
      );
      
      // Group by day of week
      const weekdayRevenue = Array(7).fill(0);
      const weekdayTransactions = Array(7).fill(0);
      
      revenues.forEach(revenue => {
        // Convert game date to JS Date to get day of week
        const gameDate = revenue.date;
        // Create a Date object - note months are 0-indexed in JS Date
        const jsDate = new Date(gameDate.year, gameDate.month - 1, gameDate.day);
        const dayOfWeek = jsDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        weekdayRevenue[dayOfWeek] += revenue.amount;
        weekdayTransactions[dayOfWeek]++;
      });
      
      // Calculate average revenue per weekday
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekdayAverages = weekdayRevenue.map((total, index) => {
        const transactions = weekdayTransactions[index];
        return {
          day: weekdayNames[index],
          total: total,
          transactions: transactions,
          average: transactions > 0 ? total / transactions : 0
        };
      });
      
      return weekdayAverages;
    }
    
    getTopSellingItems(venueId, period = 'monthly', limit = 5) {
      // Get all sales transactions for the period
      const startDate = this.getStartDateForPeriod(period);
      const sales = this.game.financialManager.getTransactions(
        venueId, 
        startDate, 
        null, 
        'revenue'
      ).filter(t => t.category === 'sales' && t.item); // Only include item sales
      
      // Group by item
      const itemSales = {};
      
      sales.forEach(sale => {
        const itemKey = `${sale.subcategory}:${sale.item}`; // e.g. "drink:Beer"
        
        if (!itemSales[itemKey]) {
          itemSales[itemKey] = {
            type: sale.subcategory,
            name: sale.item,
            quantity: 0,
            revenue: 0
          };
        }
        
        itemSales[itemKey].quantity += sale.quantity || 1;
        itemSales[itemKey].revenue += sale.amount;
      });
      
      // Convert to array and sort by quantity
      const topItems = Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
      
      return topItems;
    }
    
    forecastRevenue(venueId, periodMonths = 3) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue) return null;
      
      // Get historical revenue data
      const startDate = this.getStartDateForPeriod('monthly');
      startDate.month -= (periodMonths - 1);
      if (startDate.month <= 0) {
        startDate.year--;
        startDate.month += 12;
      }
      
      const revenues = this.game.financialManager.getTransactions(
        venueId, 
        startDate, 
        null, 
        'revenue'
      );
      
      // Group by month for trend analysis
      const monthlyRevenue = {};
      
      revenues.forEach(revenue => {
        const monthKey = `${revenue.date.year}-${revenue.date.month}`;
        
        if (!monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey] = 0;
        }
        
        monthlyRevenue[monthKey] += revenue.amount;
      });
      
      // Calculate forecast based on trend
      const monthlyValues = Object.values(monthlyRevenue);
      
      if (monthlyValues.length === 0) {
        // No historical data, return a simple estimate based on venue type and size
        return this.estimateRevenueWithoutHistory(venue);
      }
      
      // Simple linear regression for forecast
      let forecast = 0;
      
      if (monthlyValues.length === 1) {
        // Only one month of data, use that with a slight growth
        forecast = monthlyValues[0] * 1.05;
      } else {
        // Multiple months, look for trend
        const recentMonths = monthlyValues.slice(-3);
        
        // Check if trend is upward or downward
        let trend = 0;
        for (let i = 1; i < recentMonths.length; i++) {
          const change = (recentMonths[i] - recentMonths[i-1]) / recentMonths[i-1];
          trend += change;
        }
        trend = trend / (recentMonths.length - 1); // Average change rate
        
        // Use most recent month with trend adjustment
        forecast = recentMonths[recentMonths.length - 1] * (1 + trend);
      }
      
      // Adjust for seasonal factors if we have enough data
      if (monthlyValues.length >= 12) {
        // Check same month last year
        const currentMonth = this.game.timeManager.getGameTime().month;
        const lastYearSameMonthKey = `${this.game.timeManager.getGameTime().year - 1}-${currentMonth}`;
        
        if (monthlyRevenue[lastYearSameMonthKey]) {
          const seasonalFactor = monthlyRevenue[lastYearSameMonthKey] / 
                                (Object.values(monthlyRevenue).reduce((sum, val) => sum + val, 0) / 12);
          
          forecast = forecast * (0.7 + 0.3 * seasonalFactor); // Apply seasonal adjustment with dampening
        }
      }
      
      return forecast;
    }
    
    estimateRevenueWithoutHistory(venue) {
      // Baseline estimates by venue type
      const baselineRevenue = {
        'Bar': 5000,
        'Restaurant': 7000,
        'Nightclub': 8000,
        'Fast Food': 4000
      };
      
      // Size multipliers
      const sizeMultiplier = {
        'small': 1,
        'medium': 2.2,
        'large': 4
      };
      
      // City multiplier
      const cityMultiplier = this.game.cityManager ? 
                            this.game.cityManager.getCityCustomerAffluence(venue.city) : 1;
      
      // Popularity multiplier
      const popularityMultiplier = 0.5 + (venue.stats.popularity / 100) * 1.5;
      
      // Calculate baseline estimate
      return baselineRevenue[venue.type] * 
             sizeMultiplier[venue.size] * 
             cityMultiplier * 
             popularityMultiplier;
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
    
    // Set or adjust item prices
    adjustItemPrice(venue, itemType, itemName, newPrice) {
      if (!venue.inventory || !venue.inventory[itemType]) {
        return false;
      }
      
      // Find the item
      const itemIndex = venue.inventory[itemType].findIndex(item => item.name === itemName);
      if (itemIndex === -1) return false;
      
      // Validate price (must be positive)
      if (newPrice <= 0) return false;
      
      // Set new price
      venue.inventory[itemType][itemIndex].sellPrice = newPrice;
      
      // Log the change
      window.logToConsole(`Price for ${itemName} set to €${newPrice.toFixed(2)}`, 'info');
      
      return true;
    }
    
    // Set entrance fee
    setEntranceFee(venue, fee) {
      // Validate fee (must be non-negative)
      if (fee < 0) return false;
      
      // Set new fee
      venue.settings.entranceFee = fee;
      
      // Log the change
      window.logToConsole(`Entrance fee set to €${fee.toFixed(2)}`, 'info');
      
      // Check if fee is high relative to venue type
      const highThresholds = {
        'Bar': 5,
        'Restaurant': 0, // Restaurants typically don't charge entrance
        'Nightclub': 15,
        'Fast Food': 0 // Fast food places don't charge entrance
      };
      
      if (fee > highThresholds[venue.type]) {
        window.logToConsole('Warning: This entrance fee is high for your venue type and may discourage customers.', 'warning');
      }
      
      return true;
    }
  }
  
  module.exports = RevenueManager;