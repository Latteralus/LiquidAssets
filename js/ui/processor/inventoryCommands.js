// js/ui/processor/inventoryCommands.js
// Handles inventory-related commands for managing drinks, food, and equipment

/**
 * InventoryCommands - Module for processing inventory-related commands
 * @param {Object} game - Reference to the game instance
 */
class InventoryCommands {
    constructor(game) {
      this.game = game;
    }
  
    /**
     * Process inventory-related commands
     * @param {string} command - The command to process
     * @param {Array} args - The command arguments
     * @returns {boolean} True if the command was successfully processed
     */
    processCommand(command, args) {
      switch (command) {
        case 'inventory':
        case 'viewinventory':
          return this.viewInventory(args);
        case 'order':
        case 'orderinventory':
          return this.orderInventory(args);
        case 'setprice':
        case 'updateprice':
          return this.updatePrice(args);
        case 'repair':
        case 'repairequipment':
          return this.repairEquipment(args);
        case 'upgrade':
        case 'upgradeequipment':
          return this.upgradeEquipment(args);
        case 'inventorymenu':
          return this.showInventoryMenu();
        case 'checkstock':
          return this.checkLowStock();
        default:
          return false;
      }
    }
  
    /**
     * Validate that a current venue is selected
     * @param {boolean} [showError=true] - Whether to show an error message if no venue is selected
     * @returns {boolean} - Whether a venue is selected
     */
    validateVenueExists(showError = true) {
      if (!this.game.state.currentVenue) {
        if (showError) {
          this.game.notificationManager.error("No venue is currently selected. Use 'selectvenue' command first.");
        }
        return false;
      }
      return true;
    }
  
    /**
     * View venue inventory
     * @param {Array} args - Command arguments: [category]
     * @returns {boolean} Success status
     */
    viewInventory(args) {
      if (!this.validateVenueExists()) return false;
  
      const venue = this.game.state.currentVenue;
      
      // No inventory
      if (!venue.inventory) {
        this.game.notificationManager.error("Venue inventory not initialized.");
        return false;
      }
      
      // Check for specific category
      let category = 'all';
      if (args.length > 0) {
        const validCategories = ['drinks', 'food', 'equipment', 'all'];
        const requestedCategory = args[0].toLowerCase();
        
        if (validCategories.includes(requestedCategory)) {
          category = requestedCategory;
        } else {
          this.game.notificationManager.error(`Invalid category. Choose from: ${validCategories.join(', ')}`);
          return false;
        }
      }
      
      this.game.notificationManager.info(`=== ${venue.name} Inventory ===`);
      
      // Process each inventory category as requested
      if (category === 'all' || category === 'drinks') {
        this.displayDrinksInventory(venue);
      }
      
      if (category === 'all' || category === 'food') {
        this.displayFoodInventory(venue);
      }
      
      if (category === 'all' || category === 'equipment') {
        this.displayEquipmentInventory(venue);
      }
      
      return true;
    }
  
    /**
     * Display drinks inventory
     * @param {Object} venue - Venue object
     */
    displayDrinksInventory(venue) {
      if (!venue.inventory.drinks || venue.inventory.drinks.length === 0) {
        this.game.notificationManager.info("--- Drinks: None ---");
        return;
      }
      
      this.game.notificationManager.info("--- Drinks ---");
      
      // Group by type
      const drinksByType = {};
      venue.inventory.drinks.forEach(drink => {
        if (!drinksByType[drink.type]) {
          drinksByType[drink.type] = [];
        }
        drinksByType[drink.type].push(drink);
      });
      
      // Display drinks by type
      Object.entries(drinksByType).forEach(([type, drinks]) => {
        this.game.notificationManager.info(`${type.charAt(0).toUpperCase() + type.slice(1)}:`);
        
        drinks.forEach(drink => {
          const profit = (drink.sellPrice - drink.costPrice).toFixed(2);
          const margin = ((drink.sellPrice / drink.costPrice - 1) * 100).toFixed(0);
          
          // Highlight low stock
          let stockStatus = drink.stock.toString();
          if (drink.stock < 10) {
            stockStatus = `[LOW: ${drink.stock}]`;
          }
          
          this.game.notificationManager.info(`  ${drink.name} - Stock: ${stockStatus} - Cost: €${drink.costPrice.toFixed(2)} - Price: €${drink.sellPrice.toFixed(2)} - Profit: €${profit} (${margin}%)`);
        });
      });
    }
  
    /**
     * Display food inventory
     * @param {Object} venue - Venue object
     */
    displayFoodInventory(venue) {
      // Skip if venue doesn't serve food
      if (venue.type !== 'Restaurant' && venue.type !== 'Fast Food') {
        return;
      }
      
      if (!venue.inventory.food || venue.inventory.food.length === 0) {
        this.game.notificationManager.info("--- Food: None ---");
        return;
      }
      
      this.game.notificationManager.info("--- Food ---");
      
      // Group by type
      const foodByType = {};
      venue.inventory.food.forEach(food => {
        if (!foodByType[food.type]) {
          foodByType[food.type] = [];
        }
        foodByType[food.type].push(food);
      });
      
      // Display food by type
      Object.entries(foodByType).forEach(([type, foods]) => {
        this.game.notificationManager.info(`${type.charAt(0).toUpperCase() + type.slice(1)}:`);
        
        foods.forEach(food => {
          const profit = (food.sellPrice - food.costPrice).toFixed(2);
          const margin = ((food.sellPrice / food.costPrice - 1) * 100).toFixed(0);
          
          // Highlight low stock
          let stockStatus = food.stock.toString();
          if (food.stock < 10) {
            stockStatus = `[LOW: ${food.stock}]`;
          }
          
          this.game.notificationManager.info(`  ${food.name} - Stock: ${stockStatus} - Cost: €${food.costPrice.toFixed(2)} - Price: €${food.sellPrice.toFixed(2)} - Profit: €${profit} (${margin}%)`);
        });
      });
    }
  
    /**
     * Display equipment inventory
     * @param {Object} venue - Venue object
     */
    displayEquipmentInventory(venue) {
      if (!venue.inventory.equipment || venue.inventory.equipment.length === 0) {
        this.game.notificationManager.info("--- Equipment: None ---");
        return;
      }
      
      this.game.notificationManager.info("--- Equipment ---");
      
      // Group by type
      const equipmentByType = {};
      venue.inventory.equipment.forEach(equipment => {
        if (!equipmentByType[equipment.type]) {
          equipmentByType[equipment.type] = [];
        }
        equipmentByType[equipment.type].push(equipment);
      });
      
      // Display equipment by type
      Object.entries(equipmentByType).forEach(([type, items]) => {
        this.game.notificationManager.info(`${type.charAt(0).toUpperCase() + type.slice(1)}:`);
        
        items.forEach(item => {
          // Highlight poor condition
          let conditionStatus = `${item.condition.toFixed(0)}%`;
          if (item.condition < 30) {
            conditionStatus = `[POOR: ${item.condition.toFixed(0)}%]`;
          } else if (item.condition < 60) {
            conditionStatus = `[FAIR: ${item.condition.toFixed(0)}%]`;
          }
          
          this.game.notificationManager.info(`  ${item.name} - Quantity: ${item.quantity} - Quality: ${item.quality} - Condition: ${conditionStatus}`);
        });
      });
    }
  
    /**
     * Order inventory item
     * @param {Array} args - Command arguments: [item_type, item_name, quantity]
     * @returns {boolean} Success status
     */
    orderInventory(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 3) {
        this.game.notificationManager.error("Usage: order <item_type> <item_name> <quantity>");
        this.game.notificationManager.info("Example: order drinks 'Beer' 50");
        this.game.notificationManager.info("Item types: drinks, food");
        return false;
      }
  
      const itemType = args[0].toLowerCase();
      const itemName = args[1];
      const quantity = parseInt(args[2], 10);
  
      // Validate item type
      const validTypes = ['drinks', 'food'];
      if (!validTypes.includes(itemType)) {
        this.game.notificationManager.error(`Invalid item type. Choose from: ${validTypes.join(', ')}`);
        return false;
      }
  
      // Validate quantity
      if (isNaN(quantity) || quantity <= 0) {
        this.game.notificationManager.error("Quantity must be a positive number.");
        return false;
      }
  
      try {
        const success = this.game.inventoryManager.orderInventory(
          this.game.state.currentVenue.id,
          itemType,
          itemName,
          quantity
        );
  
        if (success) {
          this.game.notificationManager.success(`Ordered ${quantity} ${itemName} for your inventory.`);
          return true;
        } else {
          this.game.notificationManager.error(`Failed to order ${itemName}. Make sure the item exists and you have enough cash.`);
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error ordering inventory: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Update item price
     * @param {Array} args - Command arguments: [item_type, item_name, price]
     * @returns {boolean} Success status
     */
    updatePrice(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 3) {
        this.game.notificationManager.error("Usage: setprice <item_type> <item_name> <price>");
        this.game.notificationManager.info("Example: setprice drinks 'Beer' 5.50");
        this.game.notificationManager.info("Item types: drinks, food");
        return false;
      }
  
      const itemType = args[0].toLowerCase();
      const itemName = args[1];
      const price = parseFloat(args[2]);
  
      // Validate item type
      const validTypes = ['drinks', 'food'];
      if (!validTypes.includes(itemType)) {
        this.game.notificationManager.error(`Invalid item type. Choose from: ${validTypes.join(', ')}`);
        return false;
      }
  
      // Validate price
      if (isNaN(price) || price < 0) {
        this.game.notificationManager.error("Price must be a non-negative number.");
        return false;
      }
  
      try {
        const success = this.game.inventoryManager.updateInventoryPrices(
          this.game.state.currentVenue.id,
          itemType,
          itemName,
          price
        );
  
        if (success) {
          this.game.notificationManager.success(`Updated ${itemName} price to €${price.toFixed(2)}.`);
          
          // Get the item to check profit margin
          const venue = this.game.state.currentVenue;
          const item = venue.inventory[itemType].find(item => item.name === itemName);
          
          if (item) {
            const margin = ((price / item.costPrice - 1) * 100).toFixed(0);
            const profit = (price - item.costPrice).toFixed(2);
            
            // Provide feedback based on margin
            if (price < item.costPrice) {
              this.game.notificationManager.warning(`Warning: You're selling this item at a loss of €${Math.abs(profit)} per unit!`);
            } else if (margin < 20) {
              this.game.notificationManager.warning(`Low profit margin of ${margin}%. Consider increasing the price.`);
            } else if (margin > 300) {
              this.game.notificationManager.warning(`Very high profit margin of ${margin}%. This might deter customers.`);
            } else {
              this.game.notificationManager.info(`Profit margin: ${margin}% (€${profit} per unit)`);
            }
          }
          
          return true;
        } else {
          this.game.notificationManager.error(`Failed to update ${itemName} price. Make sure the item exists.`);
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error updating price: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Repair equipment
     * @param {Array} args - Command arguments: [equipment_name]
     * @returns {boolean} Success status
     */
    repairEquipment(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: repair <equipment_name>");
        this.game.notificationManager.info("Example: repair 'Sound System'");
        return false;
      }
  
      const equipmentName = args[0];
  
      try {
        const success = this.game.inventoryManager.repairEquipment(
          this.game.state.currentVenue.id,
          equipmentName
        );
  
        if (success) {
          this.game.notificationManager.success(`Repaired ${equipmentName} successfully.`);
          return true;
        } else {
          this.game.notificationManager.error(`Failed to repair ${equipmentName}. Make sure it exists and you have enough cash.`);
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error repairing equipment: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Upgrade equipment
     * @param {Array} args - Command arguments: [equipment_name]
     * @returns {boolean} Success status
     */
    upgradeEquipment(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: upgrade <equipment_name>");
        this.game.notificationManager.info("Example: upgrade 'Sound System'");
        return false;
      }
  
      const equipmentName = args[0];
  
      try {
        const success = this.game.inventoryManager.upgradeEquipment(
          this.game.state.currentVenue.id,
          equipmentName
        );
  
        if (success) {
          this.game.notificationManager.success(`Upgraded ${equipmentName} successfully.`);
          return true;
        } else {
          this.game.notificationManager.error(`Failed to upgrade ${equipmentName}. Make sure it exists, is not already premium quality, and you have enough cash.`);
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error upgrading equipment: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Check for low stock items
     * @returns {boolean} Success status
     */
    checkLowStock() {
      if (!this.validateVenueExists()) return false;
  
      const venue = this.game.state.currentVenue;
      
      if (!this.game.inventoryManager) {
        this.game.notificationManager.error("Inventory manager not initialized.");
        return false;
      }
      
      const lowStock = this.game.inventoryManager.checkInventoryLevels(venue);
      
      if (!lowStock || lowStock.length === 0) {
        this.game.notificationManager.success("All inventory items have adequate stock levels.");
        return true;
      }
      
      this.game.notificationManager.warning("=== Low Stock Items ===");
      
      // Group by type
      const itemsByType = {};
      lowStock.forEach(item => {
        if (!itemsByType[item.type]) {
          itemsByType[item.type] = [];
        }
        itemsByType[item.type].push(item);
      });
      
      // Display by type
      Object.entries(itemsByType).forEach(([type, items]) => {
        this.game.notificationManager.warning(`--- ${type.charAt(0).toUpperCase() + type.slice(1)} ---`);
        
        items.forEach(item => {
          this.game.notificationManager.warning(`${item.name}: Only ${item.stock} left in stock.`);
        });
      });
      
      this.game.notificationManager.info("Use 'order <item_type> <item_name> <quantity>' to restock these items.");
      
      return true;
    }
  
    /**
     * Show inventory management menu
     * @returns {boolean} Success status
     */
    showInventoryMenu() {
      if (this.game.uiManager && this.game.uiManager.showInventoryMenu) {
        this.game.uiManager.showInventoryMenu();
        return true;
      } else {
        this.game.notificationManager.error("Menu functionality not available.");
        return false;
      }
    }
  }
  
  module.exports = InventoryCommands;