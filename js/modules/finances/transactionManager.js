// TransactionManager - Handles recording and tracking all financial transactions

class TransactionManager {
    constructor(game) {
      this.game = game;
      this.transactions = [];
    }
    
    recordTransaction(transaction) {
      // Add unique ID and timestamp to transaction
      transaction.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      transaction.timestamp = Date.now();
      
      // Add to transactions array
      this.transactions.push(transaction);
      
      // Trim transactions list if it gets too long
      if (this.transactions.length > 1000) {
        this.transactions = this.transactions.slice(-1000);
      }
      
      return transaction.id;
    }
    
    getTransaction(transactionId) {
      return this.transactions.find(t => t.id === transactionId);
    }
    
    getTransactions(venueId, startDate, endDate, category) {
      // Filter transactions based on parameters
      return this.transactions.filter(transaction => {
        // Filter by venue
        if (venueId && transaction.venueId !== venueId) return false;
        
        // Filter by date range
        if (startDate && this.isDateBefore(transaction.date, startDate)) return false;
        if (endDate && this.isDateAfter(transaction.date, endDate)) return false;
        
        // Filter by category
        if (category && transaction.category !== category) return false;
        
        return true;
      });
    }
    
    getTransactionsByType(type, venueId) {
      return this.transactions.filter(t => t.type === type && (!venueId || t.venueId === venueId));
    }
    
    getTransactionsByCategory(category, venueId) {
      return this.transactions.filter(t => t.category === category && (!venueId || t.venueId === venueId));
    }
    
    getTransactionsByDateRange(startDate, endDate, venueId) {
      return this.transactions.filter(t => {
        if (venueId && t.venueId !== venueId) return false;
        if (startDate && this.isDateBefore(t.date, startDate)) return false;
        if (endDate && this.isDateAfter(t.date, endDate)) return false;
        return true;
      });
    }
    
    getTotalsByCategory(startDate, endDate, venueId) {
      const filteredTransactions = this.getTransactionsByDateRange(startDate, endDate, venueId);
      
      const categoryTotals = {
        revenue: {},
        expense: {}
      };
      
      filteredTransactions.forEach(t => {
        if (!t.category) return;
        
        const type = t.type || 'other';
        const category = t.category;
        
        if (!categoryTotals[type]) {
          categoryTotals[type] = {};
        }
        
        if (!categoryTotals[type][category]) {
          categoryTotals[type][category] = 0;
        }
        
        categoryTotals[type][category] += t.amount || 0;
      });
      
      return categoryTotals;
    }
    
    getNetIncome(startDate, endDate, venueId) {
      const filteredTransactions = this.getTransactionsByDateRange(startDate, endDate, venueId);
      
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      filteredTransactions.forEach(t => {
        if (t.type === 'revenue') {
          totalRevenue += t.amount || 0;
        } else if (t.type === 'expense') {
          totalExpenses += t.amount || 0;
        }
      });
      
      return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome: totalRevenue - totalExpenses
      };
    }
    
    isDateBefore(date1, date2) {
      // Compare dates (assumes same format as game time)
      if (date1.year < date2.year) return true;
      if (date1.year > date2.year) return false;
      
      if (date1.month < date2.month) return true;
      if (date1.month > date2.month) return false;
      
      if (date1.day < date2.day) return true;
      if (date1.day > date2.day) return false;
      
      if (date1.hour < date2.hour) return true;
      if (date1.hour > date2.hour) return false;
      
      return date1.minute < date2.minute;
    }
    
    isDateAfter(date1, date2) {
      // Compare dates (assumes same format as game time)
      if (date1.year > date2.year) return true;
      if (date1.year < date2.year) return false;
      
      if (date1.month > date2.month) return true;
      if (date1.month < date2.month) return false;
      
      if (date1.day > date2.day) return true;
      if (date1.day < date2.day) return false;
      
      if (date1.hour > date2.hour) return true;
      if (date1.hour < date2.hour) return false;
      
      return date1.minute > date2.minute;
    }
    
    getTransactionSummary(startDate, endDate, venueId) {
      const filteredTransactions = this.getTransactionsByDateRange(startDate, endDate, venueId);
      
      // Group by day
      const dailyData = {};
      
      filteredTransactions.forEach(t => {
        const dateKey = `${t.date.year}-${t.date.month}-${t.date.day}`;
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: { ...t.date },
            revenue: 0,
            expenses: 0,
            netIncome: 0,
            transactions: 0
          };
        }
        
        if (t.type === 'revenue') {
          dailyData[dateKey].revenue += t.amount || 0;
        } else if (t.type === 'expense') {
          dailyData[dateKey].expenses += t.amount || 0;
        }
        
        dailyData[dateKey].transactions++;
      });
      
      // Calculate net income for each day
      Object.values(dailyData).forEach(day => {
        day.netIncome = day.revenue - day.expenses;
      });
      
      // Convert to array and sort by date
      const summary = Object.values(dailyData).sort((a, b) => {
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        if (a.date.month !== b.date.month) return a.date.month - b.date.month;
        return a.date.day - b.date.day;
      });
      
      return summary;
    }
    
    exportTransactionsToCSV(startDate, endDate, venueId) {
      const filteredTransactions = this.getTransactionsByDateRange(startDate, endDate, venueId);
      
      // Create CSV header
      let csv = 'Date,Time,Type,Category,Subcategory,Item,Quantity,Price,Amount,VenueId\n';
      
      // Add each transaction
      filteredTransactions.forEach(t => {
        const date = `${t.date.year}-${t.date.month}-${t.date.day}`;
        const time = `${t.date.hour}:${t.date.minute}`;
        
        csv += `${date},${time},`;
        csv += `${t.type || ''},${t.category || ''},${t.subcategory || ''},`;
        csv += `${t.item || ''},${t.quantity || ''},${t.price || ''},`;
        csv += `${t.amount || 0},${t.venueId || ''}\n`;
      });
      
      return csv;
    }
    
    getVenueProfitability(venueId, period = 'monthly') {
      const startDate = this.getStartDateForPeriod(period);
      const data = this.getNetIncome(startDate, null, venueId);
      
      if (data.revenue === 0) return 0;
      
      return (data.netIncome / data.revenue) * 100;
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
    
    // Get cash flow data for charts/graphs
    getCashFlowData(venueId, period = 'monthly', dataPoints = 10) {
      const startDate = this.getStartDateForPeriod(period);
      
      // Adjust start date to get more history
      if (period === 'daily') {
        startDate.day -= (dataPoints - 1);
        if (startDate.day <= 0) {
          startDate.month--;
          if (startDate.month <= 0) {
            startDate.year--;
            startDate.month = 12;
          }
          // Simplified - assume 30 days per month
          startDate.day += 30;
        }
      } else if (period === 'weekly') {
        startDate.day -= 7 * (dataPoints - 1);
        while (startDate.day <= 0) {
          startDate.month--;
          if (startDate.month <= 0) {
            startDate.year--;
            startDate.month = 12;
          }
          // Simplified - assume 30 days per month
          startDate.day += 30;
        }
      } else if (period === 'monthly') {
        startDate.month -= (dataPoints - 1);
        while (startDate.month <= 0) {
          startDate.year--;
          startDate.month += 12;
        }
      }
      
      const summary = this.getTransactionSummary(startDate, null, venueId);
      
      // Group by period
      const periodData = [];
      
      if (period === 'daily') {
        // Already grouped by day in summary
        periodData.push(...summary);
      } else if (period === 'weekly') {
        // Group by week
        const weeklyData = {};
        
        summary.forEach(day => {
          // Simplified week calculation - just divide days into 7-day chunks
          const weekStart = new Date(day.date.year, day.date.month - 1, day.date.day);
          const weekNumber = Math.floor(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000));
          const weekKey = `week-${weekNumber}`;
          
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              date: { ...day.date },
              revenue: 0,
              expenses: 0,
              netIncome: 0,
              transactions: 0
            };
          }
          
          weeklyData[weekKey].revenue += day.revenue;
          weeklyData[weekKey].expenses += day.expenses;
          weeklyData[weekKey].netIncome += day.netIncome;
          weeklyData[weekKey].transactions += day.transactions;
        });
        
        periodData.push(...Object.values(weeklyData).sort((a, b) => {
          if (a.date.year !== b.date.year) return a.date.year - b.date.year;
          if (a.date.month !== b.date.month) return a.date.month - b.date.month;
          return a.date.day - b.date.day;
        }));
      } else if (period === 'monthly') {
        // Group by month
        const monthlyData = {};
        
        summary.forEach(day => {
          const monthKey = `${day.date.year}-${day.date.month}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: { year: day.date.year, month: day.date.month, day: 1 },
              revenue: 0,
              expenses: 0,
              netIncome: 0,
              transactions: 0
            };
          }
          
          monthlyData[monthKey].revenue += day.revenue;
          monthlyData[monthKey].expenses += day.expenses;
          monthlyData[monthKey].netIncome += day.netIncome;
          monthlyData[monthKey].transactions += day.transactions;
        });
        
        periodData.push(...Object.values(monthlyData).sort((a, b) => {
          if (a.date.year !== b.date.year) return a.date.year - b.date.year;
          return a.date.month - b.date.month;
        }));
      }
      
      // Format for display
      return periodData.map(data => {
        let label;
        
        if (period === 'daily') {
          label = `${data.date.month}/${data.date.day}`;
        } else if (period === 'weekly') {
          label = `Week of ${data.date.month}/${data.date.day}`;
        } else if (period === 'monthly') {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = `${monthNames[data.date.month - 1]} ${data.date.year}`;
        }
        
        return {
          label,
          revenue: data.revenue,
          expenses: data.expenses,
          netIncome: data.netIncome
        };
      }).slice(-dataPoints); // Only return the requested number of data points
    }
  }
  
  module.exports = TransactionManager;