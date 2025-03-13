// Reporting Manager - Handles financial report generation and analysis

class ReportingManager {
    constructor(game, transactionManager) {
      this.game = game;
      this.transactionManager = transactionManager;
      this.reports = {
        daily: [],
        weekly: [],
        monthly: [],
        yearly: []
      };
    }
    
    generateDailyReport() {
      const venue = this.game.state.currentVenue;
      if (!venue) return null;
      
      const currentTime = this.game.timeManager.getGameTime();
      const reportDate = `${currentTime.year}-${currentTime.month}-${currentTime.day}`;
      
      // Get transactions for the day
      const startDate = { ...currentTime, hour: 0, minute: 0 };
      const endDate = { ...currentTime, hour: 23, minute: 59 };
      
      const transactions = this.transactionManager.getTransactionsByDateRange(
        startDate,
        endDate,
        venue.id
      );
      
      // Calculate totals
      let revenue = 0;
      let expenses = 0;
      const revenueBreakdown = {};
      const expenseBreakdown = {};
      
      transactions.forEach(transaction => {
        if (transaction.type === 'revenue') {
          revenue += transaction.amount;
          
          // Add to revenue breakdown
          const category = transaction.category || 'miscellaneous';
          if (!revenueBreakdown[category]) {
            revenueBreakdown[category] = 0;
          }
          revenueBreakdown[category] += transaction.amount;
        } else if (transaction.type === 'expense') {
          expenses += transaction.amount;
          
          // Add to expense breakdown
          const category = transaction.category || 'miscellaneous';
          if (!expenseBreakdown[category]) {
            expenseBreakdown[category] = 0;
          }
          expenseBreakdown[category] += transaction.amount;
        }
      });
      
      // Create report
      const report = {
        type: 'daily',
        date: reportDate,
        venueId: venue.id,
        venueName: venue.name,
        revenue,
        expenses,
        profit: revenue - expenses,
        profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
        revenueBreakdown,
        expenseBreakdown,
        customerCount: venue.stats.totalCustomersServed,
        popularity: venue.stats.popularity,
        customerSatisfaction: venue.stats.customerSatisfaction
      };
      
      // Add to daily reports
      this.reports.daily.unshift(report);
      
      // Limit the number of reports stored
      if (this.reports.daily.length > 30) {
        this.reports.daily.pop();
      }
      
      return report;
    }
    
    generateWeeklyReport() {
      const venue = this.game.state.currentVenue;
      if (!venue) return null;
      
      const currentTime = this.game.timeManager.getGameTime();
      const reportDate = `${currentTime.year}-W${Math.floor((currentTime.day - 1) / 7) + 1}`;
      
      // Get transactions for the week
      const startDate = { ...currentTime };
      startDate.day -= startDate.dayOfWeek - 1;
      if (startDate.day <= 0) {
        startDate.month--;
        if (startDate.month <= 0) {
          startDate.year--;
          startDate.month = 12;
        }
        // Simplified: assuming 30 days per month
        startDate.day += 30;
      }
      startDate.hour = 0;
      startDate.minute = 0;
      
      const transactions = this.transactionManager.getTransactionsByDateRange(
        startDate,
        currentTime,
        venue.id
      );
      
      // Calculate totals
      let revenue = 0;
      let expenses = 0;
      const revenueBreakdown = {};
      const expenseBreakdown = {};
      
      transactions.forEach(transaction => {
        if (transaction.type === 'revenue') {
          revenue += transaction.amount;
          
          // Add to revenue breakdown
          const category = transaction.category || 'miscellaneous';
          if (!revenueBreakdown[category]) {
            revenueBreakdown[category] = 0;
          }
          revenueBreakdown[category] += transaction.amount;
        } else if (transaction.type === 'expense') {
          expenses += transaction.amount;
          
          // Add to expense breakdown
          const category = transaction.category || 'miscellaneous';
          if (!expenseBreakdown[category]) {
            expenseBreakdown[category] = 0;
          }
          expenseBreakdown[category] += transaction.amount;
        }
      });
      
      // Create report
      const report = {
        type: 'weekly',
        date: reportDate,
        venueId: venue.id,
        venueName: venue.name,
        revenue,
        expenses,
        profit: revenue - expenses,
        profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
        revenueBreakdown,
        expenseBreakdown,
        customerCount: venue.stats.totalCustomersServed,
        popularity: venue.stats.popularity,
        customerSatisfaction: venue.stats.customerSatisfaction
      };
      
      // Add to weekly reports
      this.reports.weekly.unshift(report);
      
      // Limit the number of reports stored
      if (this.reports.weekly.length > 12) {
        this.reports.weekly.pop();
      }
      
      return report;
    }
    
    generateMonthlyReport() {
      const venue = this.game.state.currentVenue;
      if (!venue) return null;
      
      const currentTime = this.game.timeManager.getGameTime();
      const reportDate = `${currentTime.year}-${currentTime.month}`;
      
      // Get transactions for the month
      const startDate = { 
        year: currentTime.month === 1 ? currentTime.year - 1 : currentTime.year,
        month: currentTime.month === 1 ? 12 : currentTime.month - 1,
        day: currentTime.day,
        hour: 0,
        minute: 0
      };
      
      const transactions = this.transactionManager.getTransactionsByDateRange(
        startDate,
        currentTime,
        venue.id
      );
      
      // Calculate totals
      let revenue = 0;
      let expenses = 0;
      const revenueBreakdown = {};
      const expenseBreakdown = {};
      
      transactions.forEach(transaction => {
        if (transaction.type === 'revenue') {
          revenue += transaction.amount;
          
          // Add to revenue breakdown
          const category = transaction.category || 'miscellaneous';
          if (!revenueBreakdown[category]) {
            revenueBreakdown[category] = 0;
          }
          revenueBreakdown[category] += transaction.amount;
        } else if (transaction.type === 'expense') {
          expenses += transaction.amount;
          
          // Add to expense breakdown
          const category = transaction.category || 'miscellaneous';
          if (!expenseBreakdown[category]) {
            expenseBreakdown[category] = 0;
          }
          expenseBreakdown[category] += transaction.amount;
        }
      });
      
      // Create report
      const report = {
        type: 'monthly',
        date: reportDate,
        venueId: venue.id,
        venueName: venue.name,
        revenue,
        expenses,
        profit: revenue - expenses,
        profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
        revenueBreakdown,
        expenseBreakdown,
        customerCount: venue.stats.totalCustomersServed,
        popularity: venue.stats.popularity,
        customerSatisfaction: venue.stats.customerSatisfaction
      };
      
      // Add to monthly reports
      this.reports.monthly.unshift(report);
      
      // Limit the number of reports stored
      if (this.reports.monthly.length > 12) {
        this.reports.monthly.pop();
      }
      
      return report;
    }
    
    generateYearlyReport() {
      const venue = this.game.state.currentVenue;
      if (!venue) return null;
      
      const currentTime = this.game.timeManager.getGameTime();
      const reportDate = `${currentTime.year}`;
      
      // Get transactions for the year
      const startDate = { 
        year: currentTime.year - 1,
        month: currentTime.month,
        day: currentTime.day,
        hour: 0,
        minute: 0
      };
      
      const transactions = this.transactionManager.getTransactionsByDateRange(
        startDate,
        currentTime,
        venue.id
      );
      
      // Calculate totals
      let revenue = 0;
      let expenses = 0;
      const revenueBreakdown = {};
      const expenseBreakdown = {};
      const monthlyData = {};
      
      // Initialize monthly data
      for (let i = 1; i <= 12; i++) {
        monthlyData[i] = {
          revenue: 0,
          expenses: 0,
          profit: 0
        };
      }
      
      transactions.forEach(transaction => {
        // Update monthly data
        const month = transaction.date.month;
        
        if (transaction.type === 'revenue') {
          revenue += transaction.amount;
          monthlyData[month].revenue += transaction.amount;
          
          // Add to revenue breakdown
          const category = transaction.category || 'miscellaneous';
          if (!revenueBreakdown[category]) {
            revenueBreakdown[category] = 0;
          }
          revenueBreakdown[category] += transaction.amount;
        } else if (transaction.type === 'expense') {
          expenses += transaction.amount;
          monthlyData[month].expenses += transaction.amount;
          
          // Add to expense breakdown
          const category = transaction.category || 'miscellaneous';
          if (!expenseBreakdown[category]) {
            expenseBreakdown[category] = 0;
          }
          expenseBreakdown[category] += transaction.amount;
        }
      });
      
      // Calculate monthly profits
      for (let i = 1; i <= 12; i++) {
        monthlyData[i].profit = monthlyData[i].revenue - monthlyData[i].expenses;
      }
      
      // Create report
      const report = {
        type: 'yearly',
        date: reportDate,
        venueId: venue.id,
        venueName: venue.name,
        revenue,
        expenses,
        profit: revenue - expenses,
        profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
        revenueBreakdown,
        expenseBreakdown,
        monthlyData,
        customerCount: venue.stats.totalCustomersServed,
        popularity: venue.stats.popularity,
        customerSatisfaction: venue.stats.customerSatisfaction
      };
      
      // Add to yearly reports
      this.reports.yearly.unshift(report);
      
      // Limit the number of reports stored
      if (this.reports.yearly.length > 5) {
        this.reports.yearly.pop();
      }
      
      return report;
    }
    
    getReports(reportType) {
      if (!reportType || !this.reports[reportType]) {
        return [];
      }
      
      return [...this.reports[reportType]];
    }
    
    getProfitMargin(venueId, period = 'monthly') {
      const reports = this.getReports(period);
      
      if (reports.length === 0) {
        return 0;
      }
      
      // Filter reports for the specified venue
      const venueReports = reports.filter(report => report.venueId === venueId);
      
      if (venueReports.length === 0) {
        return 0;
      }
      
      // Use the most recent report
      const latestReport = venueReports[0];
      
      return latestReport.profitMargin;
    }
    
    getRevenueGrowth(venueId, period = 'monthly') {
      const reports = this.getReports(period);
      
      if (reports.length < 2) {
        return 0;
      }
      
      // Filter reports for the specified venue
      const venueReports = reports.filter(report => report.venueId === venueId);
      
      if (venueReports.length < 2) {
        return 0;
      }
      
      // Use the two most recent reports
      const latestReport = venueReports[0];
      const previousReport = venueReports[1];
      
      if (previousReport.revenue === 0) {
        return 0;
      }
      
      return ((latestReport.revenue - previousReport.revenue) / previousReport.revenue) * 100;
    }
    
    getTopRevenueCategory(venueId, period = 'monthly') {
      const reports = this.getReports(period);
      
      if (reports.length === 0) {
        return null;
      }
      
      // Filter reports for the specified venue
      const venueReports = reports.filter(report => report.venueId === venueId);
      
      if (venueReports.length === 0) {
        return null;
      }
      
      // Use the most recent report
      const latestReport = venueReports[0];
      
      // Find the category with the highest revenue
      let topCategory = null;
      let topAmount = 0;
      
      Object.entries(latestReport.revenueBreakdown).forEach(([category, amount]) => {
        if (amount > topAmount) {
          topCategory = category;
          topAmount = amount;
        }
      });
      
      return {
        category: topCategory,
        amount: topAmount
      };
    }
    
    getTopExpenseCategory(venueId, period = 'monthly') {
      const reports = this.getReports(period);
      
      if (reports.length === 0) {
        return null;
      }
      
      // Filter reports for the specified venue
      const venueReports = reports.filter(report => report.venueId === venueId);
      
      if (venueReports.length === 0) {
        return null;
      }
      
      // Use the most recent report
      const latestReport = venueReports[0];
      
      // Find the category with the highest expense
      let topCategory = null;
      let topAmount = 0;
      
      Object.entries(latestReport.expenseBreakdown).forEach(([category, amount]) => {
        if (amount > topAmount) {
          topCategory = category;
          topAmount = amount;
        }
      });
      
      return {
        category: topCategory,
        amount: topAmount
      };
    }
    
    getTrendAnalysis(venueId, period = 'monthly') {
      const reports = this.getReports(period);
      
      if (reports.length < 3) {
        return {
          revenue: 'insufficient data',
          profit: 'insufficient data',
          popularity: 'insufficient data'
        };
      }
      
      // Filter reports for the specified venue
      const venueReports = reports.filter(report => report.venueId === venueId);
      
      if (venueReports.length < 3) {
        return {
          revenue: 'insufficient data',
          profit: 'insufficient data',
          popularity: 'insufficient data'
        };
      }
      
      // Analyze the trend over the last 3 reports
      const revenueValues = venueReports.slice(0, 3).map(report => report.revenue);
      const profitValues = venueReports.slice(0, 3).map(report => report.profit);
      const popularityValues = venueReports.slice(0, 3).map(report => report.popularity);
      
      // Check if values are increasing, decreasing, or stable
      const revenueTrend = this.analyzeTrend(revenueValues);
      const profitTrend = this.analyzeTrend(profitValues);
      const popularityTrend = this.analyzeTrend(popularityValues);
      
      return {
        revenue: revenueTrend,
        profit: profitTrend,
        popularity: popularityTrend
      };
    }
    
    analyzeTrend(values) {
      if (values.length < 2) return 'insufficient data';
      
      // Calculate differences between consecutive values
      const diffs = [];
      for (let i = 0; i < values.length - 1; i++) {
        diffs.push(values[i] - values[i + 1]);
      }
      
      // Check if all differences are positive (increasing), negative (decreasing), or mixed (fluctuating)
      const allPositive = diffs.every(diff => diff > 0);
      const allNegative = diffs.every(diff => diff < 0);
      
      if (allPositive) {
        // Check the magnitude of increase
        const avgIncrease = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
        const percentIncrease = (avgIncrease / values[values.length - 1]) * 100;
        
        if (percentIncrease > 20) {
          return 'rapidly increasing';
        } else if (percentIncrease > 5) {
          return 'increasing';
        } else {
          return 'slightly increasing';
        }
      } else if (allNegative) {
        // Check the magnitude of decrease
        const avgDecrease = diffs.reduce((sum, diff) => sum + Math.abs(diff), 0) / diffs.length;
        const percentDecrease = (avgDecrease / values[values.length - 1]) * 100;
        
        if (percentDecrease > 20) {
          return 'rapidly decreasing';
        } else if (percentDecrease > 5) {
          return 'decreasing';
        } else {
          return 'slightly decreasing';
        }
      } else {
        // Check if the values are relatively stable
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const variation = (maxValue - minValue) / ((maxValue + minValue) / 2) * 100;
        
        if (variation < 5) {
          return 'stable';
        } else {
          return 'fluctuating';
        }
      }
    }
  }
  
  module.exports = ReportingManager;