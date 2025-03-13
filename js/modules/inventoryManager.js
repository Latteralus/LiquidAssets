// Inventory Manager - Handles venue inventory including drinks, food, and equipment

class InventoryManager {
    constructor(game) {
      this.game = game;
    }
    
    generateDefaultInventory(venueType) {
      const inventory = {
        drinks: [],
        equipment: []
      };
      
      // Add default drinks based on venue type
      this.addDefaultDrinks(inventory.drinks, venueType);
      
      // Add default equipment
      this.addDefaultEquipment(inventory.equipment, venueType);
      
      // Add food for venues that serve it
      if (venueType === 'Restaurant' || venueType === 'Fast Food') {
        inventory.food = [];
        this.addDefaultFood(inventory.food, venueType);
      }
      
      return inventory;
    }
    
    addDefaultDrinks(drinksArray, venueType) {
      // Common drinks for all venue types
      const commonDrinks = [
        { name: 'Water', type: 'non-alcoholic', costPrice: 0.2, sellPrice: 1.5, stock: 100 },
        { name: 'Cola', type: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.5, stock: 50 },
        { name: 'Beer', type: 'alcoholic', costPrice: 1.2, sellPrice: 4.0, stock: 50 }
      ];
      
      drinksArray.push(...commonDrinks);
      
      // Add venue-specific drinks
      if (venueType === 'Bar' || venueType === 'Nightclub') {
        const specializedDrinks = [
          { name: 'Wine', type: 'alcoholic', costPrice: 3.0, sellPrice: 6.5, stock: 30 },
          { name: 'Whiskey', type: 'alcoholic', costPrice: 2.5, sellPrice: 7.0, stock: 20 },
          { name: 'Vodka', type: 'alcoholic', costPrice: 2.0, sellPrice: 6.0, stock: 20 },
          { name: 'Cocktail', type: 'alcoholic', costPrice: 3.0, sellPrice: 8.5, stock: 15 }
        ];
        drinksArray.push(...specializedDrinks);
      }
      
      if (venueType === 'Nightclub') {
        const nightclubDrinks = [
          { name: 'Energy Drink', type: 'non-alcoholic', costPrice: 1.5, sellPrice: 5.0, stock: 40 },
          { name: 'Premium Cocktail', type: 'alcoholic', costPrice: 4.5, sellPrice: 12.0, stock: 10 }
        ];
        drinksArray.push(...nightclubDrinks);
      }
      
      if (venueType === 'Restaurant') {
        const restaurantDrinks = [
          { name: 'Wine', type: 'alcoholic', costPrice: 3.0, sellPrice: 8.0, stock: 40 },
          { name: 'Coffee', type: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.5, stock: 50 },
          { name: 'Tea', type: 'non-alcoholic', costPrice: 0.3, sellPrice: 2.0, stock: 40 }
        ];
        drinksArray.push(...restaurantDrinks);
      }
      
      if (venueType === 'Fast Food') {
        const fastFoodDrinks = [
          { name: 'Milkshake', type: 'non-alcoholic', costPrice: 1.0, sellPrice: 3.5, stock: 30 },
          { name: 'Coffee', type: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.0, stock: 50 },
          { name: 'Juice', type: 'non-alcoholic', costPrice: 0.8, sellPrice: 2.5, stock: 40 }
        ];
        drinksArray.push(...fastFoodDrinks);
      }
    }
    
    addDefaultFood(foodArray, venueType) {
      if (venueType === 'Restaurant') {
        const restaurantFood = [
          { name: 'Steak', type: 'main', costPrice: 8.0, sellPrice: 22.0, stock: 20 },
          { name: 'Pasta', type: 'main', costPrice: 3.0, sellPrice: 14.0, stock: 30 },
          { name: 'Salad', type: 'starter', costPrice: 2.0, sellPrice: 8.0, stock: 25 },
          { name: 'Soup', type: 'starter', costPrice: 1.5, sellPrice: 6.0, stock: 20 },
          { name: 'Cake', type: 'dessert', costPrice: 2.0, sellPrice: 7.0, stock: 15 }
        ];
        foodArray.push(...restaurantFood);
      } else if (venueType === 'Fast Food') {
        const fastFood = [
          { name: 'Burger', type: 'main', costPrice: 2.5, sellPrice: 6.5, stock: 40 },
          { name: 'Fries', type: 'side', costPrice: 0.8, sellPrice: 3.0, stock: 50 },
          { name: 'Pizza Slice', type: 'main', costPrice: 1.5, sellPrice: 4.0, stock: 30 },
          { name: 'Chicken Wings', type: 'side', costPrice: 2.0, sellPrice: 5.5, stock: 25 },
          { name: 'Ice Cream', type: 'dessert', costPrice: 1.0, sellPrice: 3.0, stock: 20 }
        ];
        foodArray.push(...fastFood);
      }
    }
    
    addDefaultEquipment(equipmentArray, venueType) {
      // Basic equipment for all venue types
      const basicEquipment = [
        { name: 'Chairs', type: 'furniture', quality: 'standard', condition: 90, quantity: 20 },
        { name: 'Tables', type: 'furniture', quality: 'standard', condition: 90, quantity: 8 },
        { name: 'Lights', type: 'fixture', quality: 'standard', condition: 100, quantity: 10 },
        { name: 'Sound System', type: 'electronics', quality: 'basic', condition: 85, quantity: 1 }
      ];
      
      equipmentArray.push(...basicEquipment);
      
      // Add venue-specific equipment
      if (venueType === 'Bar') {
        const barEquipment = [
          { name: 'Bar Counter', type: 'fixture', quality: 'standard', condition: 90, quantity: 1 },
          { name: 'Beer Taps', type: 'fixture', quality: 'standard', condition: 95, quantity: 1 },
          { name: 'Glassware', type: 'utensil', quality: 'standard', condition: 100, quantity: 50 }
        ];
        equipmentArray.push(...barEquipment);
      } else if (venueType === 'Nightclub') {
        const nightclubEquipment = [
          { name: 'Bar Counter', type: 'fixture', quality: 'standard', condition: 90, quantity: 1 },
          { name: 'DJ Booth', type: 'fixture', quality: 'standard', condition: 100, quantity: 1 },
          { name: 'Dance Floor', type: 'fixture', quality: 'standard', condition: 90, quantity: 1 },
          { name: 'Lighting Rig', type: 'electronics', quality: 'standard', condition: 95, quantity: 1 },
          { name: 'Glassware', type: 'utensil', quality: 'standard', condition: 100, quantity: 100 }
        ];
        equipmentArray.push(...nightclubEquipment);
      } else if (venueType === 'Restaurant') {
        const restaurantEquipment = [
          { name: 'Kitchen Equipment', type: 'appliance', quality: 'standard', condition: 90, quantity: 1 },
          { name: 'Dinnerware', type: 'utensil', quality: 'standard', condition: 100, quantity: 60 },
          { name: 'Silverware', type: 'utensil', quality: 'standard', condition: 100, quantity: 60 },
          { name: 'Wine Glasses', type: 'utensil', quality: 'standard', condition: 100, quantity: 40 }
        ];
        equipmentArray.push(...restaurantEquipment);
      } else if (venueType === 'Fast Food') {
        const fastFoodEquipment = [
          { name: 'Counter', type: 'fixture', quality: 'standard', condition: 90, quantity: 1 },
          { name: 'Kitchen Equipment', type: 'appliance', quality: 'standard', condition: 90, quantity: 1 },
          { name: 'Fryer', type: 'appliance', quality: 'standard', condition: 95, quantity: 1 },
          { name: 'Trays', type: 'utensil', quality: 'standard', condition: 90, quantity: 30 }
        ];
        equipmentArray.push(...fastFoodEquipment);
      }
    }
    
    orderInventory(venueId, itemType, itemName, quantity) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory || !venue.inventory[itemType]) {
        window.logToConsole(`Cannot order inventory: ${itemType} inventory not found.`, 'error');
        return false;
      }
      
      // Find the item
      const itemIndex = venue.inventory[itemType].findIndex(item => item.name === itemName);
      if (itemIndex === -1) {
        window.logToConsole(`Item "${itemName}" not found in inventory.`, 'error');
        return false;
      }
      
      const item = venue.inventory[itemType][itemIndex];
      
      // Calculate total cost
      const totalCost = item.costPrice * quantity;
      
      // Check if player has enough cash
      if (this.game.state.player.cash < totalCost) {
        window.logToConsole(`Not enough cash to order ${quantity} ${itemName}. Need €${totalCost.toFixed(2)}.`, 'error');
        return false;
      }
      
      // Add to stock
      venue.inventory[itemType][itemIndex].stock += quantity;
      
      // Deduct cost
      this.game.state.player.cash -= totalCost;
      
      // Record transaction
      if (this.game.financialManager) {
        this.game.financialManager.recordTransaction({
          type: 'expense',
          category: 'inventory',
          subcategory: itemType,
          item: itemName,
          quantity: quantity,
          price: item.costPrice,
          amount: totalCost,
          date: { ...this.game.timeManager.getGameTime() },
          venueId: venue.id
        });
      }
      
      window.logToConsole(`Ordered ${quantity} ${itemName} for €${totalCost.toFixed(2)}.`, 'success');
      return true;
    }
    
    updateInventoryPrices(venueId, itemType, itemName, newPrice) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory || !venue.inventory[itemType]) {
        window.logToConsole(`Cannot update prices: ${itemType} inventory not found.`, 'error');
        return false;
      }
      
      // Find the item
      const itemIndex = venue.inventory[itemType].findIndex(item => item.name === itemName);
      if (itemIndex === -1) {
        window.logToConsole(`Item "${itemName}" not found in inventory.`, 'error');
        return false;
      }
      
      // Validate price (must be positive)
      if (newPrice <= 0) {
        window.logToConsole("Price must be positive.", 'error');
        return false;
      }
      
      const item = venue.inventory[itemType][itemIndex];
      
      // Check if price is reasonable (not too low compared to cost)
      if (newPrice < item.costPrice) {
        window.logToConsole(`Warning: Price is below cost price (€${item.costPrice.toFixed(2)}).`, 'warning');
      }
      
      // Update price
      venue.inventory[itemType][itemIndex].sellPrice = newPrice;
      
      window.logToConsole(`Updated price of ${itemName} to €${newPrice.toFixed(2)}.`, 'success');
      return true;
    }
    
    addNewInventoryItem(venueId, itemType, itemData) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory) {
        window.logToConsole(`Cannot add item: Venue or inventory not found.`, 'error');
        return false;
      }
      
      // Create inventory category if it doesn't exist
      if (!venue.inventory[itemType]) {
        venue.inventory[itemType] = [];
      }
      
      // Check if item already exists
      const existingItem = venue.inventory[itemType].find(item => item.name === itemData.name);
      if (existingItem) {
        window.logToConsole(`Item "${itemData.name}" already exists in inventory.`, 'error');
        return false;
      }
      
      // Add to inventory
      venue.inventory[itemType].push(itemData);
      
      window.logToConsole(`Added new ${itemType} item: ${itemData.name}.`, 'success');
      return true;
    }
    
    removeInventoryItem(venueId, itemType, itemName) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory || !venue.inventory[itemType]) {
        window.logToConsole(`Cannot remove item: ${itemType} inventory not found.`, 'error');
        return false;
      }
      
      // Find the item
      const itemIndex = venue.inventory[itemType].findIndex(item => item.name === itemName);
      if (itemIndex === -1) {
        window.logToConsole(`Item "${itemName}" not found in inventory.`, 'error');
        return false;
      }
      
      // Remove from inventory
      venue.inventory[itemType].splice(itemIndex, 1);
      
      window.logToConsole(`Removed ${itemName} from inventory.`, 'success');
      return true;
    }
    
    checkInventoryLevels(venue) {
      if (!venue || !venue.inventory) return;
      
      const lowStockItems = [];
      
      // Check drink levels
      if (venue.inventory.drinks) {
        venue.inventory.drinks.forEach(drink => {
          if (drink.stock < 10) {
            lowStockItems.push({ type: 'drinks', name: drink.name, stock: drink.stock });
          }
        });
      }
      
      // Check food levels
      if (venue.inventory.food) {
        venue.inventory.food.forEach(food => {
          if (food.stock < 10) {
            lowStockItems.push({ type: 'food', name: food.name, stock: food.stock });
          }
        });
      }
      
      return lowStockItems;
    }
    
    reportLowInventory(venue) {
      const lowStock = this.checkInventoryLevels(venue);
      
      if (lowStock && lowStock.length > 0) {
        window.logToConsole('Low inventory alert:', 'warning');
        lowStock.forEach(item => {
          window.logToConsole(`${item.name}: Only ${item.stock} left in stock.`, 'warning');
        });
      }
    }
    
    getInventorySummary(venueId) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory) return null;
      
      const summary = {
        totalItems: 0,
        totalValue: 0,
        categories: {}
      };
      
      // Process each inventory category
      Object.keys(venue.inventory).forEach(category => {
        if (!Array.isArray(venue.inventory[category])) return;
        
        summary.categories[category] = {
          itemCount: venue.inventory[category].length,
          totalStock: 0,
          totalValue: 0
        };
        
        venue.inventory[category].forEach(item => {
          const stock = item.stock || item.quantity || 0;
          const value = stock * item.costPrice;
          
          summary.totalItems += stock;
          summary.totalValue += value;
          summary.categories[category].totalStock += stock;
          summary.categories[category].totalValue += value;
        });
      });
      
      return summary;
    }
    
    updateEquipmentCondition(venue) {
      if (!venue || !venue.inventory || !venue.inventory.equipment) return;
      
      // Gradually reduce equipment condition based on usage
      const customerCount = this.game.customerManager ? 
                           this.game.customerManager.getCurrentCustomerCount() : 0;
      
      // More customers means faster wear and tear
      const wearRate = 0.01 + (customerCount / 1000);
      
      venue.inventory.equipment.forEach((equipment, index) => {
        // Reduce condition
        venue.inventory.equipment[index].condition = Math.max(0, equipment.condition - wearRate);
        
        // If condition is very low, equipment might break
        if (equipment.condition < 10 && Math.random() < 0.05) {
          window.logToConsole(`Your ${equipment.name} broke down and needs to be repaired!`, 'error');
          venue.inventory.equipment[index].condition = 0;
        }
      });
    }
    
    repairEquipment(venueId, equipmentName) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory || !venue.inventory.equipment) {
        window.logToConsole(`Cannot repair equipment: Venue or equipment not found.`, 'error');
        return false;
      }
      
      // Find the equipment
      const equipmentIndex = venue.inventory.equipment.findIndex(eq => eq.name === equipmentName);
      if (equipmentIndex === -1) {
        window.logToConsole(`Equipment "${equipmentName}" not found.`, 'error');
        return false;
      }
      
      const equipment = venue.inventory.equipment[equipmentIndex];
      
      // Calculate repair cost based on quality and how damaged it is
      const damagePercent = 100 - equipment.condition;
      let baseRepairCost;
      
      if (equipment.quality === 'basic') baseRepairCost = 50;
      else if (equipment.quality === 'standard') baseRepairCost = 100;
      else baseRepairCost = 200; // premium
      
      const repairCost = (baseRepairCost * damagePercent / 100) * (equipment.quantity || 1);
      
      // Check if player has enough cash
      if (this.game.state.player.cash < repairCost) {
        window.logToConsole(`Not enough cash to repair ${equipmentName}. Need €${repairCost.toFixed(2)}.`, 'error');
        return false;
      }
      
      // Repair equipment
      venue.inventory.equipment[equipmentIndex].condition = 100;
      
      // Deduct cost
      this.game.state.player.cash -= repairCost;
      
      // Record transaction
      if (this.game.financialManager) {
        this.game.financialManager.recordTransaction({
          type: 'expense',
          category: 'maintenance',
          subcategory: 'equipment',
          item: equipmentName,
          amount: repairCost,
          date: { ...this.game.timeManager.getGameTime() },
          venueId: venue.id
        });
      }
      
      window.logToConsole(`Repaired ${equipmentName} for €${repairCost.toFixed(2)}.`, 'success');
      return true;
    }
    
    upgradeEquipment(venueId, equipmentName) {
      const venue = this.game.venueManager.getVenue(venueId);
      if (!venue || !venue.inventory || !venue.inventory.equipment) {
        window.logToConsole(`Cannot upgrade equipment: Venue or equipment not found.`, 'error');
        return false;
      }
      
      // Find the equipment
      const equipmentIndex = venue.inventory.equipment.findIndex(eq => eq.name === equipmentName);
      if (equipmentIndex === -1) {
        window.logToConsole(`Equipment "${equipmentName}" not found.`, 'error');
        return false;
      }
      
      const equipment = venue.inventory.equipment[equipmentIndex];
      
      // Check if upgrade is possible
      if (equipment.quality === 'premium') {
        window.logToConsole(`${equipmentName} is already premium quality and cannot be upgraded further.`, 'error');
        return false;
      }
      
      // Calculate upgrade cost
      let upgradeCost;
      let newQuality;
      
      if (equipment.quality === 'basic') {
        upgradeCost = 200 * (equipment.quantity || 1);
        newQuality = 'standard';
      } else {
        upgradeCost = 400 * (equipment.quantity || 1);
        newQuality = 'premium';
      }
      
      // Check if player has enough cash
      if (this.game.state.player.cash < upgradeCost) {
        window.logToConsole(`Not enough cash to upgrade ${equipmentName}. Need €${upgradeCost.toFixed(2)}.`, 'error');
        return false;
      }
      
      // Upgrade equipment
      venue.inventory.equipment[equipmentIndex].quality = newQuality;
      venue.inventory.equipment[equipmentIndex].condition = 100; // Reset condition with upgrade
      
      // Deduct cost
      this.game.state.player.cash -= upgradeCost;
      
      // Record transaction
      if (this.game.financialManager) {
        this.game.financialManager.recordTransaction({
          type: 'expense',
          category: 'equipment',
          subcategory: 'upgrade',
          item: equipmentName,
          amount: upgradeCost,
          date: { ...this.game.timeManager.getGameTime() },
          venueId: venue.id
        });
      }
      
      window.logToConsole(`Upgraded ${equipmentName} to ${newQuality} quality for €${upgradeCost.toFixed(2)}.`, 'success');
      return true;
    }
  }
  
  module.exports = InventoryManager;