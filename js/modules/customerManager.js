// Customer Manager - Main file that imports and orchestrates customer sub-modules

const CustomerGenerator = require('./customer/customerGenerator');
const CustomerBehavior = require('./customer/customerBehavior');
const CustomerOrders = require('./customer/customerOrders');
const CustomerSatisfaction = require('./customer/customerSatisfaction');

class CustomerManager {
  constructor(game) {
    this.game = game;
    
    // Initialize customers array if it doesn't exist
    if (!this.game.state.customers) {
      this.game.state.customers = [];
    }
    
    // Initialize sub-modules
    this.generator = new CustomerGenerator(game);
    this.behavior = new CustomerBehavior(game);
    this.orders = new CustomerOrders(game);
    this.satisfaction = new CustomerSatisfaction(game);
  }
  
  getCurrentCustomerCount() {
    return this.game.state.customers.length;
  }
  
  generateCustomers(venue) {
    this.generator.generateCustomers(venue);
  }
  
  updateCustomers() {
    // Skip if no customers
    if (!this.game.state.customers || this.game.state.customers.length === 0) return;
    
    // Process each customer
    for (let i = this.game.state.customers.length - 1; i >= 0; i--) {
      const customer = this.game.state.customers[i];
      
      // Update customer state based on status
      switch(customer.status) {
        case 'entering':
          this.behavior.handleEnteringCustomer(customer, i);
          break;
        case 'seated':
          this.behavior.handleSeatedCustomer(customer, i);
          break;
        case 'ordering':
          this.behavior.handleOrderingCustomer(customer, i);
          break;
        case 'waiting':
          this.behavior.handleWaitingCustomer(customer, i);
          break;
        case 'eating':
        case 'drinking':
          this.behavior.handleConsumingCustomer(customer, i);
          break;
        case 'paying':
          this.behavior.handlePayingCustomer(customer, i);
          break;
        case 'leaving':
          this.behavior.handleLeavingCustomer(customer, i);
          break;
      }
      
      // Reduce patience over time
      this.satisfaction.updateCustomerPatience(customer, i);
    }
  }
  
  // Helper methods that might be needed across modules
  calculateMinutesBetween(startTime, endTime) {
    return this.behavior.calculateMinutesBetween(startTime, endTime);
  }
  
  getCustomersByVenue(venueId) {
    return this.game.state.customers.filter(c => c.venueId === venueId);
  }
  
  removeCustomer(index) {
    if (index >= 0 && index < this.game.state.customers.length) {
      this.game.state.customers.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = CustomerManager;