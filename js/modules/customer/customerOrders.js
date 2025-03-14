// js/modules/customer/customerOrders.js
// Handles customer ordering behavior and menu preferences

const { createLogger } = require('../../utils/logger');
const { getRandomInt, getRandomFromArray } = require('../../utils/randomGenerator');
const { formatCurrency } = require('../../utils/formatter');
const eventBus = require('../../utils/eventBus');

/**
 * Manages customer ordering behavior and preferences
 */
class CustomerOrders {
  /**
   * Create a new CustomerOrders instance
   * @param {Object} game - Reference to main game object
   */
  constructor(game) {
    this.game = game;
    this.logger = createLogger(game);
  }
  
  /**
   * Process a customer's order
   * @param {Object} customer - Customer object
   * @param {Object} staff - Staff member serving the customer
   */
  processCustomerOrder(customer, staff) {
    const venue = this.game.venueManager.getVenue(customer.venueId);
    if (!venue || !venue.inventory) return;
    
    const orders = [];
    let totalSpending = 0;
    
    // Each person in the group orders
    for (let i = 0; i < customer.groupSize; i++) {
      // Order drinks
      if (venue.inventory.drinks && venue.inventory.drinks.length > 0) {
        // Prefer preferred drinks if in stock
        let drinkToOrder = null;
        
        if (customer.preferences.preferredDrinks.length > 0) {
          // Try to find a preferred drink in stock
          for (const preferredDrink of customer.preferences.preferredDrinks) {
            const drink = venue.inventory.drinks.find(d => d.name === preferredDrink && d.stock > 0);
            if (drink) {
              drinkToOrder = drink;
              break;
            }
          }
        }
        
        // If no preferred drink found, pick a random one in stock
        if (!drinkToOrder) {
          const availableDrinks = venue.inventory.drinks.filter(d => d.stock > 0);
          if (availableDrinks.length > 0) {
            drinkToOrder = getRandomFromArray(availableDrinks);
          }
        }
        
        if (drinkToOrder) {
          orders.push({
            type: 'drink',
            item: drinkToOrder.name,
            price: drinkToOrder.sellPrice,
            prepared: false
          });
          
          // Reduce stock
          const drinkIndex = venue.inventory.drinks.findIndex(d => d.name === drinkToOrder.name);
          if (drinkIndex !== -1) {
            venue.inventory.drinks[drinkIndex].stock--;
          }
          
          totalSpending += drinkToOrder.sellPrice;
        }
      }
      
      // Order food for venues that serve it
      if ((venue.type === 'Restaurant' || venue.type === 'Fast Food') && 
          venue.inventory.food && venue.inventory.food.length > 0) {
        // Similar logic to drinks
        let foodToOrder = null;
        
        if (customer.preferences.preferredFood.length > 0) {
          for (const preferredFood of customer.preferences.preferredFood) {
            const food = venue.inventory.food.find(f => f.name === preferredFood && f.stock > 0);
            if (food) {
              foodToOrder = food;
              break;
            }
          }
        }
        
        if (!foodToOrder) {
          const availableFood = venue.inventory.food.filter(f => f.stock > 0);
          if (availableFood.length > 0) {
            foodToOrder = getRandomFromArray(availableFood);
          }
        }
        
        if (foodToOrder) {
          orders.push({
            type: 'food',
            item: foodToOrder.name,
            price: foodToOrder.sellPrice,
            prepared: false
          });
          
          // Reduce stock
          const foodIndex = venue.inventory.food.findIndex(f => f.name === foodToOrder.name);
          if (foodIndex !== -1) {
            venue.inventory.food[foodIndex].stock--;
          }
          
          totalSpending += foodToOrder.sellPrice;
        }
      }
    }
    
    // Check if total spending exceeds budget
    if (totalSpending > customer.spendingBudget) {
      // Too expensive, remove some items
      while (totalSpending > customer.spendingBudget && orders.length > 0) {
        // Remove the most expensive item
        orders.sort((a, b) => b.price - a.price);
        const removedItem = orders.shift();
        totalSpending -= removedItem.price;
        
        // Put the item back in stock
        if (removedItem.type === 'drink') {
          const drinkIndex = venue.inventory.drinks.findIndex(d => d.name === removedItem.item);
          if (drinkIndex !== -1) {
            venue.inventory.drinks[drinkIndex].stock++;
          }
        } else if (removedItem.type === 'food') {
          const foodIndex = venue.inventory.food.findIndex(f => f.name === removedItem.item);
          if (foodIndex !== -1) {
            venue.inventory.food[foodIndex].stock++;
          }
        }
      }
    }
    
    // Staff with good skills might upsell
    this.attemptUpsell(customer, staff, orders, totalSpending, venue);
    
    customer.orders = orders;
    customer.totalSpending = totalSpending;
    
    // Log the order
    if (orders.length > 0) {
      this.logger.info(`A group of ${customer.groupSize} ordered ${orders.length} items for ${formatCurrency(totalSpending)}.`, 'CUSTOMER');
      
      // Generate a more detailed order description for logs
      const orderDetails = this.formatOrderDetails(orders);
      this.logger.info(`Order details: ${orderDetails}`, 'CUSTOMER');
      
      // Emit order event
      eventBus.emit('customerOrdered', { customer, orders, totalSpending });
    } else {
      this.logger.warning(`A group of ${customer.groupSize} couldn't afford anything on the menu.`, 'CUSTOMER');
      customer.patience -= 20; // Very unhappy
      
      // Emit failed order event
      eventBus.emit('customerOrderFailed', { customer, reason: 'affordability' });
    }
  }
  
  /**
   * Format order details for logging
   * @param {Array} orders - List of order items
   * @returns {string} Formatted order details
   */
  formatOrderDetails(orders) {
    if (!orders || orders.length === 0) {
      return "No items";
    }
    
    // Count items by name and type
    const itemCounts = {};
    
    for (const order of orders) {
      const key = `${order.type}_${order.item}`;
      if (!itemCounts[key]) {
        itemCounts[key] = {
          type: order.type,
          item: order.item,
          price: order.price,
          count: 0
        };
      }
      itemCounts[key].count++;
    }
    
    // Format as string
    return Object.values(itemCounts)
      .map(item => `${item.count}x ${item.item} (${formatCurrency(item.price * item.count)})`)
      .join(', ');
  }
  
  /**
   * Attempt to upsell additional items
   * @param {Object} customer - Customer object
   * @param {Object} staff - Staff member
   * @param {Array} orders - Order list
   * @param {number} totalSpending - Current spending
   * @param {Object} venue - Venue object
   */
  attemptUpsell(customer, staff, orders, totalSpending, venue) {
    // If staff has good skills, they might upsell
    if (staff && staff.skills && staff.type === 'waiter' && staff.skills.customer_service > 70) {
      const upsellChance = (staff.skills.customer_service - 70) / 100;
      
      if (Math.random() < upsellChance && customer.spendingBudget > totalSpending * 1.2) {
        // Find an extra item to add
        let extraItem = null;
        
        if (venue.type === 'Restaurant' || venue.type === 'Bar') {
          // Upsell a drink
          const expensiveDrinks = venue.inventory.drinks
            .filter(d => d.stock > 0 && d.sellPrice > totalSpending * 0.2)
            .sort((a, b) => b.sellPrice - a.sellPrice);
          
          if (expensiveDrinks.length > 0) {
            extraItem = {
              type: 'drink',
              item: expensiveDrinks[0].name,
              price: expensiveDrinks[0].sellPrice,
              prepared: false
            };
            
            // Reduce stock
            const drinkIndex = venue.inventory.drinks.findIndex(d => d.name === extraItem.item);
            if (drinkIndex !== -1) {
              venue.inventory.drinks[drinkIndex].stock--;
            }
            
            orders.push(extraItem);
            totalSpending += extraItem.price;
            
            // Update the customer's total
            customer.totalSpending = totalSpending;
            
            // Log the upsell success
            this.logger.success(`${staff.name} successfully upsold ${extraItem.item} for ${formatCurrency(extraItem.price)}`, 'STAFF');
          }
        }
      }
    }
  }
  
  /**
   * Get average order value for analytics
   * @param {string|number} venueId - Venue ID
   * @returns {number} Average order value
   */
  getAverageOrderValue(venueId) {
    const customers = this.game.state.customers.filter(c => 
      c.venueId === venueId && 
      c.totalSpending && 
      (c.status === 'waiting' || c.status === 'eating' || 
       c.status === 'drinking' || c.status === 'paying' || c.status === 'leaving')
    );
    
    if (customers.length === 0) return 0;
    
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpending, 0);
    return totalSpent / customers.length;
  }
  
  /**
   * Get most popular items for a venue
   * @param {string|number} venueId - Venue ID
   * @param {string} [itemType='all'] - Item type filter ('all', 'food', 'drink')
   * @param {number} [limit=5] - Maximum items to return
   * @returns {Array<Object>} Most popular items
   */
  getMostPopularItems(venueId, itemType = 'all', limit = 5) {
    const customers = this.game.state.customers.filter(c => 
      c.venueId === venueId && c.orders && c.orders.length > 0
    );
    
    const itemCounts = {};
    
    customers.forEach(customer => {
      customer.orders.forEach(order => {
        if (itemType === 'all' || order.type === itemType) {
          if (!itemCounts[order.item]) {
            itemCounts[order.item] = 0;
          }
          itemCounts[order.item]++;
        }
      });
    });
    
    // Convert to array and sort
    const sortedItems = Object.entries(itemCounts)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sortedItems;
  }
  
  /**
   * Get total revenue by item type
   * @param {string|number} venueId - Venue ID
   * @param {string} [itemType='all'] - Item type ('all', 'food', 'drink')
   * @returns {number} Total revenue
   */
  getTotalRevenueByType(venueId, itemType = 'all') {
    const customers = this.game.state.customers.filter(c => 
      c.venueId === venueId && c.orders && c.orders.length > 0
    );
    
    let totalRevenue = 0;
    
    customers.forEach(customer => {
      customer.orders.forEach(order => {
        if (itemType === 'all' || order.type === itemType) {
          totalRevenue += order.price;
        }
      });
    });
    
    return totalRevenue;
  }
  
  /**
   * Get revenue by customer type
   * @param {string|number} venueId - Venue ID
   * @returns {Object} Revenue by customer type
   */
  getRevenueByCustomerType(venueId) {
    const customers = this.game.state.customers.filter(c => 
      c.venueId === venueId && c.totalSpending && c.totalSpending > 0
    );
    
    const revenueByType = {};
    
    customers.forEach(customer => {
      if (!revenueByType[customer.type]) {
        revenueByType[customer.type] = 0;
      }
      revenueByType[customer.type] += customer.totalSpending;
    });
    
    return revenueByType;
  }
 }
 
 module.exports = CustomerOrders;