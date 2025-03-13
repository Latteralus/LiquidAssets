// CustomerSatisfaction - Handles customer happiness and patience levels

class CustomerSatisfaction {
    constructor(game) {
      this.game = game;
    }
    
    updateCustomerPatience(customer, index) {
      // Skip if the customer is leaving
      if (customer.status === 'leaving') return;
      
      // Patience decreases over time at different rates based on status
      let patienceDecreaseRate = 0;
      
      switch(customer.status) {
        case 'entering':
          patienceDecreaseRate = 0.5; // Waiting to be seated
          break;
        case 'seated':
          patienceDecreaseRate = 0.2; // Just sitting at the table
          break;
        case 'ordering':
          patienceDecreaseRate = 0.3; // Waiting to order
          break;
        case 'waiting':
          patienceDecreaseRate = 0.4; // Waiting for food/drinks
          break;
        case 'eating':
        case 'drinking':
          patienceDecreaseRate = 0.1; // Consuming their order
          break;
        case 'paying':
          patienceDecreaseRate = 0.3; // Waiting to pay
          break;
      }
      
      // Apply the patience decrease
      customer.patience -= patienceDecreaseRate;
      
      // Check venue conditions that affect patience
      const venue = this.game.venueManager.getVenue(customer.venueId);
      if (venue) {
        // Check venue cleanliness
        if (venue.stats.cleanliness < 50) {
          customer.patience -= (50 - venue.stats.cleanliness) / 100;
        }
        
        // Check venue atmosphere match with preferences
        this.checkAtmosphereMatch(customer, venue);
      }
      
      // If patience drops too low, customer leaves
      if (customer.patience <= 0) {
        this.customerLeavesDissatisfied(customer, index);
      }
    }
    
    checkAtmosphereMatch(customer, venue) {
      // Check if music and lighting match customer preferences
      const musicDifference = Math.abs(customer.preferences.musicPreference - venue.settings.musicVolume);
      const lightingDifference = Math.abs(customer.preferences.lightingPreference - venue.settings.lightingLevel);
      
      // If the difference is too high, it affects patience
      if (musicDifference > 30) {
        customer.patience -= (musicDifference - 30) / 200;
        customer.satisfaction -= (musicDifference - 30) / 100;
      }
      
      if (lightingDifference > 30) {
        customer.patience -= (lightingDifference - 30) / 200;
        customer.satisfaction -= (lightingDifference - 30) / 100;
      }
    }
    
    customerLeavesDissatisfied(customer, index) {
      // Log that the customer left unhappy
      let reason = "low patience";
      
      if (customer.status === 'entering') {
        reason = "long wait for a table";
      } else if (customer.status === 'seated') {
        reason = "being ignored by staff";
      } else if (customer.status === 'ordering') {
        reason = "slow service";
      } else if (customer.status === 'waiting') {
        reason = "long wait for their order";
      }
      
      window.logToConsole(`A group of ${customer.groupSize} left dissatisfied due to ${reason}.`, 'error');
      
      // Affect venue popularity negatively
      const venue = this.game.venueManager.getVenue(customer.venueId);
      if (venue) {
        venue.stats.popularity = Math.max(0, venue.stats.popularity - 0.2);
        venue.stats.customerSatisfaction = Math.max(0, venue.stats.customerSatisfaction - 0.5);
      }
      
      // Remove the customer
      this.game.customerManager.removeCustomer(index);
    }
    
    calculateFinalSatisfaction(customer, venue) {
      // Base satisfaction already tracked throughout visit
      let satisfaction = customer.satisfaction;
      
      // Adjust based on various factors
      
      // 1. Service quality
      if (customer.assignedStaff) {
        const staff = this.game.staffManager.getStaff(customer.assignedStaff);
        if (staff) {
          // Staff friendliness and skill affects satisfaction
          if (staff.personality.friendliness > 0) {
            satisfaction += staff.personality.friendliness / 2;
          }
          
          const avgSkill = Object.values(staff.skills).reduce((sum, val) => sum + val, 0) / 
                         Object.values(staff.skills).length;
          
          satisfaction += (avgSkill - 50) / 5; // Modest effect from staff skills
        }
      }
      
      // 2. Value for money
      const valueRatio = this.calculateValueForMoney(customer, venue);
      satisfaction += (valueRatio - 1) * 20; // Good value increases satisfaction
      
      // 3. Atmosphere
      satisfaction += (venue.stats.atmosphere - 50) / 5;
      
      // 4. Table assignment (simple approximation)
      if (customer.assignedTable && customer.assignedTable.size === 'large' && customer.groupSize <= 2) {
        satisfaction += 5; // Small group getting a large table is nice
      }
      
      // 5. Preferences match
      const orderedPreferredItems = customer.orders.filter(order => 
        (order.type === 'drink' && customer.preferences.preferredDrinks.includes(order.item)) ||
        (order.type === 'food' && customer.preferences.preferredFood.includes(order.item))
      ).length;
      
      if (orderedPreferredItems > 0) {
        satisfaction += orderedPreferredItems * 5;
      }
      
      // 6. First-time vs regular adjustment
      // This would require tracking customer visit history, simplified here
      
      // Clamp final satisfaction between 0 and 100
      customer.satisfaction = Math.max(0, Math.min(100, satisfaction));
      
      return customer.satisfaction;
    }
    
    calculateValueForMoney(customer, venue) {
      // Calculate how much money was spent per person
      const spentPerPerson = (customer.totalSpending || 0) / customer.groupSize;
      
      // Compare to expected spending based on venue type
      let expectedSpending;
      
      switch(venue.type) {
        case 'Restaurant':
          expectedSpending = 30; // €30 per person is expected
          break;
        case 'Bar':
          expectedSpending = 20; // €20 per person is expected
          break;
        case 'Nightclub':
          expectedSpending = 25; // €25 per person is expected
          break;
        case 'Fast Food':
          expectedSpending = 10; // €10 per person is expected
          break;
        default:
          expectedSpending = 20;
      }
      
      // Adjust for quality importance
      const qualityImportance = customer.preferences.qualityImportance / 100;
      const qualityRating = venue.stats.serviceQuality / 100;
      
      // Calculate value ratio - higher means better value
      const valueRatio = (qualityRating * expectedSpending) / Math.max(0.1, spentPerPerson);
      
      // Adjust based on how much customer cares about quality vs price
      return valueRatio * (0.5 + qualityImportance);
    }
    
    // Get average satisfaction for a venue
    getAverageSatisfaction(venueId) {
      const customers = this.game.state.customers.filter(c => 
        c.venueId === venueId && 
        (c.status === 'eating' || c.status === 'drinking' || 
         c.status === 'paying' || c.status === 'leaving')
      );
      
      if (customers.length === 0) {
        // Fall back to venue's stored satisfaction stat
        const venue = this.game.venueManager.getVenue(venueId);
        return venue ? venue.stats.customerSatisfaction : 0;
      }
      
      const totalSatisfaction = customers.reduce((sum, c) => sum + c.satisfaction, 0);
      return totalSatisfaction / customers.length;
    }
  }
  
  module.exports = CustomerSatisfaction;