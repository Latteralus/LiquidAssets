// js/modules/customerManager.js
// Main file that imports and orchestrates customer sub-modules

const CustomerGenerator = require('./customer/customerGenerator');
const CustomerBehavior = require('./customer/customerBehavior');
const CustomerOrders = require('./customer/customerOrders');
const CustomerSatisfaction = require('./customer/customerSatisfaction');
const { isDatabaseAvailable, withDatabaseFallback } = require('../database/dbUtils');
const { createLogger } = require('../utils/logger');
const eventBus = require('../utils/eventBus');
const { generateEntityId } = require('../utils/idGenerator');
const time = require('./time');

/**
 * Main manager class for all customer-related functionality
 */
class CustomerManager {
  /**
   * Create a new CustomerManager instance
   * @param {Object} game - The main game object
   */
  constructor(game) {
    this.game = game;
    this.logger = createLogger(game);
    
    // Initialize customers array if it doesn't exist
    if (!this.game.state.customers) {
      this.game.state.customers = [];
    }
    
    // Initialize sub-modules
    this.generator = new CustomerGenerator(game);
    this.behavior = new CustomerBehavior(game);
    this.orders = new CustomerOrders(game);
    this.satisfaction = new CustomerSatisfaction(game);

    // Set up event listeners
    this.setupEventListeners();
    
    // Database availability
    this.useDatabase = isDatabaseAvailable(game, 'customer');
    
    this.logger.info('Customer Management System initialized', 'SYSTEM');
  }
  
  /**
   * Set up event listeners for game events
   */
  setupEventListeners() {
    // Listen for time updates to generate and update customers
    if (time) {
      time.onMinute((gameTime) => {
        // Only process every 15 minutes of game time for performance
        if (gameTime.minute % 15 === 0) {
          this.updateCustomers();
        }
      });
      
      time.onHour((gameTime) => {
        // Generate new customers every hour based on venue conditions
        if (this.game.state.currentVenue) {
          this.generateCustomers(this.game.state.currentVenue);
        }
      });
    }
    
    // Listen for venue events
    eventBus.on('venueOpened', (venue) => {
      this.logger.info(`${venue.name} is now open for business`, 'VENUE');
    });
    
    eventBus.on('venueClosed', (venue) => {
      this.logger.info(`${venue.name} is now closed. Customers will leave soon.`, 'VENUE');
      this.handleVenueClosed(venue.id);
    });
    
    // Listen for staff changes that affect customers
    eventBus.on('staffHired', (staff) => {
      this.reassignCustomers(staff.venueId);
    });
    
    eventBus.on('staffFired', (staff) => {
      this.reassignCustomersFromStaff(staff.id, staff.venueId);
    });
  }
  
  /**
   * Get the current number of customers
   * @param {string|number} [venueId] - Optional venue ID filter
   * @returns {number} Number of customers
   */
  getCurrentCustomerCount(venueId) {
    if (venueId) {
      return this.game.state.customers.filter(c => c.venueId === venueId).length;
    }
    return this.game.state.customers.length;
  }
  
  /**
   * Generate customers for a venue
   * @param {Object} venue - The venue to generate customers for
   */
  generateCustomers(venue) {
    if (!venue) return;
    
    // Don't generate customers if the venue is closed
    if (!this.isVenueOpenNow(venue)) {
      return;
    }
    
    // Let the generator handle the creation logic
    this.generator.generateCustomers(venue);
  }

  /**
   * Check if a venue is currently open
   * @param {Object} venue - The venue to check
   * @returns {boolean} True if the venue is open
   */
  isVenueOpenNow(venue) {
    if (!venue || !venue.settings) return false;
    
    const gameTime = time ? time.getGameTime() : this.game.timeManager.getGameTime();
    const currentHour = gameTime.hour;
    
    const openingHour = venue.settings.openingHour || 9;
    const closingHour = venue.settings.closingHour || 22;
    
    // Handle venues that close after midnight
    if (closingHour < openingHour) {
      return currentHour >= openingHour || currentHour < closingHour;
    } else {
      return currentHour >= openingHour && currentHour < closingHour;
    }
  }
  
  /**
   * Update all customers in the game
   */
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
      
      // Update customer patience over time
      this.satisfaction.updateCustomerPatience(customer, i);
    }
    
    // Save customer data to database if using database
    if (this.useDatabase) {
      this.saveCustomerDataToDatabase();
    }
  }
  
  /**
   * Save customer data to the database
   */
  async saveCustomerDataToDatabase() {
    try {
      // In a real implementation, this would use a batch update
      // For now, we update each customer one by one
      const updates = [];
      
      for (const customer of this.game.state.customers) {
        // Only update customers that have been in the system for a while
        // to avoid excessive database operations
        updates.push(this.game.dbAPI.customer.updateVisit(customer.id, {
          status: customer.status,
          satisfaction: customer.satisfaction,
          totalSpent: customer.totalSpending || 0
        }));
      }
      
      await Promise.all(updates);
    } catch (error) {
      this.logger.error(`Error saving customer data to database: ${error.message}`, 'DATABASE');
    }
  }
  
  /**
   * Add a new customer to the game
   * @param {Object} customer - Customer data
   * @returns {Promise<Object>} The added customer
   */
  async addCustomer(customer) {
    // Generate ID if not provided
    if (!customer.id) {
      customer.id = generateEntityId('customer');
    }
    
    // Save to database if available
    if (this.useDatabase) {
      try {
        await this.game.dbAPI.customer.recordVisit({
          venueId: customer.venueId,
          customerType: customer.type,
          groupSize: customer.groupSize,
          status: customer.status || 'entering',
          satisfaction: customer.satisfaction || 70,
          totalSpent: customer.totalSpending || 0,
          metadata: {
            preferences: customer.preferences,
            patience: customer.patience,
            spendingBudget: customer.spendingBudget
          }
        });
      } catch (error) {
        this.logger.error(`Error recording customer visit: ${error.message}`, 'DATABASE');
      }
    }
    
    // Add to in-memory state
    this.game.state.customers.push(customer);
    
    // Emit event
    eventBus.emit('customerArrived', customer);
    
    return customer;
  }
  
  /**
   * Remove a customer from the game
   * @param {number} index - Customer index
   * @returns {boolean} True if customer was removed
   */
  removeCustomer(index) {
    if (index >= 0 && index < this.game.state.customers.length) {
      const customer = this.game.state.customers[index];
      
      // Update database if available
      if (this.useDatabase && customer.id) {
        this.game.dbAPI.customer.updateVisit(customer.id, {
          status: 'completed'
        }).catch(error => {
          this.logger.error(`Error updating customer status: ${error.message}`, 'DATABASE');
        });
      }
      
      // Remove from memory
      this.game.state.customers.splice(index, 1);
      
      // Emit event
      eventBus.emit('customerDeparted', customer);
      
      return true;
    }
    return false;
  }
  
  /**
   * Handle venue closed event
   * @param {string|number} venueId - Venue ID
   */
  handleVenueClosed(venueId) {
    // Change status of all customers to 'leaving'
    const customers = this.game.state.customers.filter(c => c.venueId === venueId);
    
    for (const customer of customers) {
      customer.status = 'leaving';
      customer.patience -= 20; // Reduce patience because venue closed
    }
    
    this.logger.info(`${customers.length} customers will leave venue ${venueId} due to closure`, 'VENUE');
  }
  
  /**
   * Reassign customers from one staff member to others
   * @param {string|number} staffId - Staff ID
   * @param {string|number} venueId - Venue ID
   */
  reassignCustomersFromStaff(staffId, venueId) {
    // Find all customers assigned to this staff
    const customersToReassign = this.game.state.customers.filter(
      c => c.assignedStaff === staffId && c.venueId === venueId
    );
    
    if (customersToReassign.length === 0) return;
    
    // Find other staff in the venue
    const availableStaff = this.game.staffManager.getStaffByVenue(venueId)
      .filter(s => s.id !== staffId && s.isWorking);
    
    if (availableStaff.length === 0) {
      // No staff available, customers will have to wait
      for (const customer of customersToReassign) {
        customer.assignedStaff = null;
        customer.patience -= 10; // Reduce patience due to staff loss
      }
      
      this.logger.warning(`No staff available to serve ${customersToReassign.length} customers at venue ${venueId}`, 'STAFF');
      return;
    }
    
    // Distribute customers to available staff
    const staffCustomerCounts = {};
    for (const staff of availableStaff) {
      staffCustomerCounts[staff.id] = this.game.state.customers.filter(
        c => c.assignedStaff === staff.id
      ).length;
    }
    
    // Assign each customer to the least busy staff
    for (const customer of customersToReassign) {
      // Find staff with lowest customer count
      let leastBusyStaff = availableStaff[0];
      let lowestCount = staffCustomerCounts[leastBusyStaff.id];
      
      for (const staff of availableStaff) {
        if (staffCustomerCounts[staff.id] < lowestCount) {
          lowestCount = staffCustomerCounts[staff.id];
          leastBusyStaff = staff;
        }
      }
      
      // Assign customer to this staff
      customer.assignedStaff = leastBusyStaff.id;
      staffCustomerCounts[leastBusyStaff.id]++;
      
      // Reduce patience a bit due to staff change
      customer.patience -= 5;
    }
    
    this.logger.info(`Reassigned ${customersToReassign.length} customers from staff ${staffId} to other staff`, 'STAFF');
  }
  
  /**
   * Reassign customers after new staff is hired
   * @param {string|number} venueId - Venue ID
   */
  reassignCustomers(venueId) {
    // Find customers without assigned staff
    const unassignedCustomers = this.game.state.customers.filter(
      c => c.venueId === venueId && !c.assignedStaff
    );
    
    if (unassignedCustomers.length === 0) return;
    
    // Find available staff
    const availableStaff = this.game.staffManager.getStaffByVenue(venueId)
      .filter(s => s.isWorking);
    
    if (availableStaff.length === 0) return;
    
    // Initialize customer counts
    const staffCustomerCounts = {};
    for (const staff of availableStaff) {
      staffCustomerCounts[staff.id] = this.game.state.customers.filter(
        c => c.assignedStaff === staff.id
      ).length;
    }
    
    // Assign each customer to the least busy staff
    for (const customer of unassignedCustomers) {
      // Find staff with lowest customer count
      let leastBusyStaff = availableStaff[0];
      let lowestCount = staffCustomerCounts[leastBusyStaff.id];
      
      for (const staff of availableStaff) {
        if (staffCustomerCounts[staff.id] < lowestCount) {
          lowestCount = staffCustomerCounts[staff.id];
          leastBusyStaff = staff;
        }
      }
      
      // Assign customer to this staff
      customer.assignedStaff = leastBusyStaff.id;
      staffCustomerCounts[leastBusyStaff.id]++;
      
      // Increase patience a bit due to being assigned staff
      customer.patience += 5;
    }
    
    this.logger.info(`Assigned ${unassignedCustomers.length} customers to staff in venue ${venueId}`, 'STAFF');
  }
  
  /**
   * Get customers by venue
   * @param {string|number} venueId - Venue ID
   * @returns {Array} Array of customers
   */
  getCustomersByVenue(venueId) {
    return this.game.state.customers.filter(c => c.venueId === venueId);
  }
  
  /**
   * Calculate time difference in minutes between two game times
   * @param {Object} startTime - Start time
   * @param {Object} endTime - End time
   * @returns {number} Minutes difference
   */
  calculateMinutesBetween(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    
    // If time module is available, use it
    if (time && time.getTimeDifferenceInMinutes) {
      return time.getTimeDifferenceInMinutes(startTime, endTime);
    }
    
    // Fallback calculation
    let minutes = (endTime.hour - startTime.hour) * 60;
    minutes += (endTime.minute - startTime.minute);
    
    // Handle day changes
    if (endTime.day > startTime.day || endTime.month > startTime.month || endTime.year > startTime.year) {
      minutes += 24 * 60; // Add a day's worth of minutes
    }
    
    return minutes;
  }
}

module.exports = CustomerManager;