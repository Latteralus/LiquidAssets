// CustomerBehavior - Handles how customers move through the venue and interact

class CustomerBehavior {
    constructor(game) {
      this.game = game;
    }
  
    calculateMinutesBetween(startTime, endTime) {
      // Helper function to calculate time difference in minutes
      let minutes = (endTime.hour - startTime.hour) * 60;
      minutes += (endTime.minute - startTime.minute);
      
      // Handle day changes
      if (endTime.day > startTime.day || endTime.month > startTime.month || endTime.year > startTime.year) {
        minutes += 24 * 60; // Add a day's worth of minutes
      }
      
      return minutes;
    }
    
    handleEnteringCustomer(customer, index) {
      const venue = this.game.venueManager.getVenue(customer.venueId);
      if (!venue) {
        this.game.customerManager.removeCustomer(index);
        return;
      }
      
      // Check for entrance fee
      if (venue.settings.entranceFee > 0) {
        const totalFee = venue.settings.entranceFee * customer.groupSize;
        
        // Check if customer is willing to pay
        if (totalFee > customer.spendingBudget * 0.2) {
          // Too expensive, customer leaves
          window.logToConsole(`A group of ${customer.groupSize} customers left because the entrance fee was too high.`, 'info');
          this.game.customerManager.removeCustomer(index);
          return;
        }
        
        // Customer pays entrance fee
        customer.spendingBudget -= totalFee;
        venue.finances.dailyRevenue += totalFee;
        venue.finances.weeklyRevenue += totalFee;
        venue.finances.monthlyRevenue += totalFee;
        this.game.state.player.cash += totalFee;
      }
      
      // Check if there's an available table
      const availableTable = this.findAvailableTable(venue, customer.groupSize);
      
      if (availableTable) {
        // Seat the customer
        customer.assignedTable = availableTable;
        customer.status = 'seated';
        customer.satisfaction += 5; // Happy to be seated right away
        
        // Find available staff
        this.assignStaffToCustomer(customer, venue);
      } else {
        // No table available, customer waits or leaves
        if (customer.patience > 50) {
          window.logToConsole(`A group of ${customer.groupSize} customers is waiting for a table.`, 'info');
          customer.patience -= 10; // Reduce patience immediately due to waiting
        } else {
          // Not patient enough to wait
          window.logToConsole(`A group of ${customer.groupSize} customers left because no tables were available.`, 'info');
          this.game.customerManager.removeCustomer(index);
        }
      }
    }
    
    findAvailableTable(venue, groupSize) {
      // Implementation would check the venue layout for available tables
      // For now, we'll simulate this with a simple probability
      
      // The more customers we have relative to capacity, the less likely a table is available
      const currentCustomers = this.game.state.customers.filter(c => 
        c.venueId === venue.id && 
        (c.status === 'seated' || c.status === 'ordering' || c.status === 'waiting' || 
         c.status === 'eating' || c.status === 'drinking')
      ).length;
      
      const occupancyRatio = currentCustomers / venue.settings.customerCapacity;
      
      // Adjust probability based on occupancy
      const tableAvailableProbability = Math.max(0, 1 - occupancyRatio);
      
      if (Math.random() < tableAvailableProbability) {
        // Simulate finding a table
        return {
          id: Date.now().toString(),
          size: groupSize <= 2 ? 'small' : (groupSize <= 4 ? 'medium' : 'large')
        };
      }
      
      return null;
    }
    
    assignStaffToCustomer(customer, venue) {
      // Find available staff of the right type
      let availableStaff = [];
      
      if (venue.staff && venue.staff.length > 0 && this.game.staffManager) {
        const allStaff = this.game.staffManager.getStaffByVenue(venue.id);
        
        // For restaurants and fast food, look for waiters first
        if (venue.type === 'Restaurant' || venue.type === 'Fast Food') {
          availableStaff = allStaff.filter(staff => 
            staff.type === 'waiter' && 
            staff.isWorking && 
            // Not handling too many customers already
            this.countCustomersAssignedToStaff(staff.id) < 3
          );
        }
        
        // For bars and nightclubs, look for bartenders first
        if ((venue.type === 'Bar' || venue.type === 'Nightclub') || availableStaff.length === 0) {
          availableStaff = allStaff.filter(staff => 
            staff.type === 'bartender' && 
            staff.isWorking && 
            this.countCustomersAssignedToStaff(staff.id) < 5
          );
        }
        
        // If still no staff, try any working staff
        if (availableStaff.length === 0) {
          availableStaff = allStaff.filter(staff => 
            staff.isWorking && 
            this.countCustomersAssignedToStaff(staff.id) < 5
          );
        }
      }
      
      if (availableStaff.length > 0) {
        // Sort by who has fewer customers
        availableStaff.sort((a, b) => 
          this.countCustomersAssignedToStaff(a.id) - this.countCustomersAssignedToStaff(b.id)
        );
        
        // Assign the least busy staff member
        customer.assignedStaff = availableStaff[0].id;
      } else {
        // No staff available, customer will wait longer
        customer.patience -= 5;
      }
    }
    
    countCustomersAssignedToStaff(staffId) {
      return this.game.state.customers.filter(c => c.assignedStaff === staffId).length;
    }
    
    handleSeatedCustomer(customer, index) {
      // Customers who are seated will eventually want to order
      // Simulate time passing before they're ready to order
      const currentTime = this.game.timeManager.getGameTime();
      const minutesSeated = this.calculateMinutesBetween(customer.arrivalTime, currentTime);
      
      // After 5-15 minutes, they're ready to order
      if (minutesSeated > 5 + Math.floor(Math.random() * 10)) {
        customer.status = 'ordering';
      }
    }
    
    handleOrderingCustomer(customer, index) {
      // If no staff assigned, try to assign one
      if (!customer.assignedStaff) {
        const venue = this.game.venueManager.getVenue(customer.venueId);
        if (venue) {
          this.assignStaffToCustomer(customer, venue);
        }
        
        // If still no staff, customer gets impatient
        if (!customer.assignedStaff) {
          customer.patience -= 2;
          return;
        }
      }
      
      // Check if staff is working
      const staff = this.game.staffManager ? this.game.staffManager.getStaff(customer.assignedStaff) : null;
      if (!staff || !staff.isWorking) {
        // Reassign staff
        const venue = this.game.venueManager.getVenue(customer.venueId);
        if (venue) {
          this.assignStaffToCustomer(customer, venue);
        }
        
        // If still no staff, customer gets impatient
        if (!customer.assignedStaff) {
          customer.patience -= 2;
          return;
        }
      }
      
      // Process the order
      this.game.customerManager.orders.processCustomerOrder(customer, staff);
      
      // Move to waiting status
      customer.status = 'waiting';
      customer.orderTime = { ...this.game.timeManager.getGameTime() };
    }
    
    handleWaitingCustomer(customer, index) {
      // Check how long they've been waiting
      const currentTime = this.game.timeManager.getGameTime();
      const minutesWaiting = this.calculateMinutesBetween(customer.orderTime, currentTime);
      
      // Simulate order preparation time
      let allPrepared = true;
      const venue = this.game.venueManager.getVenue(customer.venueId);
      const staff = this.game.staffManager ? this.game.staffManager.getStaff(customer.assignedStaff) : null;
      
      // Base preparation time depends on staff skills and venue type
      let preparationSpeed = 1.0;
      
      if (staff && staff.skills) {
        // Staff speed affects preparation time
        preparationSpeed = 0.5 + (staff.skills.speed / 100);
      }
      
      // Check each order item
      for (let i = 0; i < customer.orders.length; i++) {
        const order = customer.orders[i];
        
        if (!order.prepared) {
          // Different items take different times to prepare
          let prepTime;
          
          if (order.type === 'drink') {
            prepTime = 5; // Base time for drinks (in minutes)
          } else if (order.type === 'food') {
            if (venue && venue.type === 'Fast Food') {
              prepTime = 10; // Fast food is quicker
            } else {
              prepTime = 20; // Restaurant food takes longer
            }
          } else {
            prepTime = 5; // Default
          }
          
          // Apply preparation speed modifier
          prepTime = prepTime / preparationSpeed;
          
          if (minutesWaiting >= prepTime) {
            order.prepared = true;
          } else {
            allPrepared = false;
          }
        }
      }
      
      // If all items are prepared, serve the customer
      if (allPrepared) {
        if (customer.orders.some(order => order.type === 'food')) {
          customer.status = 'eating';
        } else {
          customer.status = 'drinking';
        }
        
        customer.serveTime = { ...currentTime };
        
        // Adjust satisfaction based on waiting time
        if (minutesWaiting < 10) {
          customer.satisfaction += 10; // Fast service
        } else if (minutesWaiting < 20) {
          customer.satisfaction += 5; // Reasonable wait
        } else if (minutesWaiting > 30) {
          customer.satisfaction -= (minutesWaiting - 30) / 2; // Long wait reduces satisfaction
        }
      } else {
        // Still waiting, satisfaction decreases based on wait time and patience
        const patienceModifier = customer.patience / 100;
        const waitingTolerance = 20 + (30 * patienceModifier);
        
        if (minutesWaiting > waitingTolerance) {
          customer.satisfaction -= 1;
        }
      }
    }
    
    handleConsumingCustomer(customer, index) {
      // Check how long they've been eating/drinking
      const currentTime = this.game.timeManager.getGameTime();
      const minutesConsuming = this.calculateMinutesBetween(customer.serveTime, currentTime);
      
      // Dining time depends on the number of items and venue type
      let consumptionTime = 0;
      
      for (const order of customer.orders) {
        if (order.type === 'food') {
          consumptionTime += 20; // Food takes longer to consume
        } else {
          consumptionTime += 10; // Drinks are quicker
        }
      }
      
      // Adjust for venue type
      const venue = this.game.venueManager.getVenue(customer.venueId);
      if (venue) {
        if (venue.type === 'Fast Food') {
          consumptionTime *= 0.7; // 30% faster in fast food places
        } else if (venue.type === 'Bar' || venue.type === 'Nightclub') {
          consumptionTime *= 1.2; // 20% slower in bars/nightclubs (people linger)
        }
      }
      
      // Adjust for group size (larger groups tend to stay longer)
      consumptionTime *= (1 + (customer.groupSize - 1) * 0.1);
      
      // When done, move to paying status
      if (minutesConsuming >= consumptionTime) {
        customer.status = 'paying';
        customer.paymentTime = { ...currentTime };
      }
    }
    
    handlePayingCustomer(customer, index) {
      // Process payment
      const venue = this.game.venueManager.getVenue(customer.venueId);
      if (!venue) {
        this.game.customerManager.removeCustomer(index);
        return;
      }
      
      // Calculate final bill (should have been set during ordering)
      const totalSpent = customer.totalSpending || 0;
      
      // Add to venue revenue
      venue.finances.dailyRevenue += totalSpent;
      venue.finances.weeklyRevenue += totalSpent;
      venue.finances.monthlyRevenue += totalSpent;
      
      // Add to player's cash
      this.game.state.player.cash += totalSpent;
      
      // Update venue statistics
      venue.stats.totalCustomersServed += customer.groupSize;
      
      // Update customer satisfaction based on overall experience
      // This is handled by the satisfaction module
      this.game.customerManager.satisfaction.calculateFinalSatisfaction(customer, venue);
      
      // Move to leaving state
      customer.status = 'leaving';
      customer.leaveTime = { ...this.game.timeManager.getGameTime() };
      
      // Log the transaction
      window.logToConsole(`A group of ${customer.groupSize} paid €${totalSpent.toFixed(2)}.`, 'success');
    }
    
    handleLeavingCustomer(customer, index) {
      // Customers briefly linger before actually leaving
      const currentTime = this.game.timeManager.getGameTime();
      const minutesLeaving = this.calculateMinutesBetween(customer.leaveTime, currentTime);
      
      if (minutesLeaving >= 5) {
        // Before removing, update venue popularity based on satisfaction
        const venue = this.game.venueManager.getVenue(customer.venueId);
        if (venue) {
          // Apply a very small change to venue popularity based on this customer's experience
          const satisfactionImpact = (customer.satisfaction - 50) / 1000; // Very small adjustment
          venue.stats.popularity = Math.min(100, Math.max(0, venue.stats.popularity + satisfactionImpact));
          
          // Update venue's average customer satisfaction
          venue.stats.customerSatisfaction = (venue.stats.customerSatisfaction * 0.95) + (customer.satisfaction * 0.05);
        }
        
        // Remove the customer
        this.game.customerManager.removeCustomer(index);
      }
    }
  }
  
  module.exports = CustomerBehavior;