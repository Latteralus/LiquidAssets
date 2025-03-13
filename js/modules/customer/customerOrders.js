// CustomerOrders - Handles customer ordering behavior and menu preferences

class CustomerOrders {
    constructor(game) {
      this.game = game;
    }
    
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
              drinkToOrder = availableDrinks[Math.floor(Math.random() * availableDrinks.length)];
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
              foodToOrder = availableFood[Math.floor(Math.random() * availableFood.length)];
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
        window.logToConsole(`A group of ${customer.groupSize} ordered ${orders.length} items for €${totalSpending.toFixed(2)}.`, 'info');
      } else {
        window.logToConsole(`A group of ${customer.groupSize} couldn't afford anything on the menu.`, 'warning');
        customer.patience -= 20; // Very unhappy
      }
    }
    
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
            }
          }
        }
      }
    }
    
    // Method to get average order value for analytics
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
    
    // Method to get most popular items for a venue
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
  }
  
  module.exports = CustomerOrders;