// Inventory Manager - Handles venue inventory including drinks, food, and equipment

const dbAPI = require('../database/api');

class InventoryManager {
    constructor(game) {
      this.game = game;
      
      // Whether we're using database storage
      this.useDatabase = false;
      
      // Check database availability
      this.checkDatabaseAvailability();
    }
    
    async checkDatabaseAvailability() {
      // Check if database API is available and initialized
      try {
        const status = await dbAPI.getStatus();
        this.useDatabase = status && status.initialized;
        
        if (this.useDatabase) {
          console.log("InventoryManager: Using database storage");
        } else {
          console.log("InventoryManager: Using in-memory storage");
        }
      } catch (error) {
        console.error("InventoryManager: Database check failed", error);
        this.useDatabase = false;
      }
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
        { name: 'Water', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.2, sellPrice: 1.5, stock: 100 },
        { name: 'Cola', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.5, stock: 50 },
        { name: 'Beer', type: 'drinks', subtype: 'alcoholic', costPrice: 1.2, sellPrice: 4.0, stock: 50 }
      ];
      
      drinksArray.push(...commonDrinks);
      
      // Add venue-specific drinks
      if (venueType === 'Bar' || venueType === 'Nightclub') {
        const specializedDrinks = [
          { name: 'Wine', type: 'drinks', subtype: 'alcoholic', costPrice: 3.0, sellPrice: 6.5, stock: 30 },
          { name: 'Whiskey', type: 'drinks', subtype: 'alcoholic', costPrice: 2.5, sellPrice: 7.0, stock: 20 },
          { name: 'Vodka', type: 'drinks', subtype: 'alcoholic', costPrice: 2.0, sellPrice: 6.0, stock: 20 },
          { name: 'Cocktail', type: 'drinks', subtype: 'alcoholic', costPrice: 3.0, sellPrice: 8.5, stock: 15 }
        ];
        drinksArray.push(...specializedDrinks);
      }
      
      if (venueType === 'Nightclub') {
        const nightclubDrinks = [
          { name: 'Energy Drink', type: 'drinks', subtype: 'non-alcoholic', costPrice: 1.5, sellPrice: 5.0, stock: 40 },
          { name: 'Premium Cocktail', type: 'drinks', subtype: 'alcoholic', costPrice: 4.5, sellPrice: 12.0, stock: 10 }
        ];
        drinksArray.push(...nightclubDrinks);
      }
      
      if (venueType === 'Restaurant') {
        const restaurantDrinks = [
          { name: 'Wine', type: 'drinks', subtype: 'alcoholic', costPrice: 3.0, sellPrice: 8.0, stock: 40 },
          { name: 'Coffee', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.5, stock: 50 },
          { name: 'Tea', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.3, sellPrice: 2.0, stock: 40 }
        ];
        drinksArray.push(...restaurantDrinks);
      }
      
      if (venueType === 'Fast Food') {
        const fastFoodDrinks = [
          { name: 'Milkshake', type: 'drinks', subtype: 'non-alcoholic', costPrice: 1.0, sellPrice: 3.5, stock: 30 },
          { name: 'Coffee', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.0, stock: 50 },
          { name: 'Juice', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.8, sellPrice: 2.5, stock: 40 }
        ];
        drinksArray.push(...fastFoodDrinks);
      }
    }
    
    addDefaultFood(foodArray, venueType) {
      if (venueType === 'Restaurant') {
        const restaurantFood = [
          { name: 'Steak', type: 'food', subtype: 'main', costPrice: 8.0, sellPrice: 22.0, stock: 20 },
          { name: 'Pasta', type: 'food', subtype: 'main', costPrice: 3.0, sellPrice: 14.0, stock: 30 },
          { name: 'Salad', type: 'food', subtype: 'starter', costPrice: 2.0, sellPrice: 8.0, stock: 25 },
          { name: 'Soup', type: 'food', subtype: 'starter', costPrice: 1.5, sellPrice: 6.0, stock: 20 },
          { name: 'Cake', type: 'food', subtype: 'dessert', costPrice: 2.0, sellPrice: 7.0, stock: 15 }
        ];
        foodArray.push(...restaurantFood);
      } else if (venueType === 'Fast Food') {
        const fastFood = [
          { name: 'Burger', type: 'food', subtype: 'main', costPrice: 2.5, sellPrice: 6.5, stock: 40 },
          { name: 'Fries', type: 'food', subtype: 'side', costPrice: 0.8, sellPrice: 3.0, stock: 50 },
          { name: 'Pizza Slice', type: 'food', subtype: 'main', costPrice: 1.5, sellPrice: 4.0, stock: 30 },
          { name: 'Chicken Wings', type: 'food', subtype: 'side', costPrice: 2.0, sellPrice: 5.5, stock: 25 },
          { name: 'Ice Cream', type: 'food', subtype: 'dessert', costPrice: 1.0, sellPrice: 3.0, stock: 20 }
        ];
        foodArray.push(...fastFood);
      }
    }
    
    addDefaultEquipment(equipmentArray, venueType) {
      // Basic equipment for all venue types
      const basicEquipment = [
        { name: 'Chairs', type: 'equipment', subtype: 'furniture', quality: 'standard', condition: 90, stock: 20 },
        { name: 'Tables', type: 'equipment', subtype: 'furniture', quality: 'standard', condition: 90, stock: 8 },
        { name: 'Lights', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 100, stock: 10 },
        { name: 'Sound System', type: 'equipment', subtype: 'electronics', quality: 'basic', condition: 85, stock: 1 }
      ];
      
      equipmentArray.push(...basicEquipment);
      
      // Add venue-specific equipment
      if (venueType === 'Bar') {
        const barEquipment = [
          { name: 'Bar Counter', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Beer Taps', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 95, stock: 1 },
          { name: 'Glassware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 50 }
        ];
        equipmentArray.push(...barEquipment);
      } else if (venueType === 'Nightclub') {
        const nightclubEquipment = [
          { name: 'Bar Counter', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'DJ Booth', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 100, stock: 1 },
          { name: 'Dance Floor', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Lighting Rig', type: 'equipment', subtype: 'electronics', quality: 'standard', condition: 95, stock: 1 },
          { name: 'Glassware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 100 }
        ];
        equipmentArray.push(...nightclubEquipment);
      } else if (venueType === 'Restaurant') {
        const restaurantEquipment = [
          { name: 'Kitchen Equipment', type: 'equipment', subtype: 'appliance', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Dinnerware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 60 },
          { name: 'Silverware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 60 },
          { name: 'Wine Glasses', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 40 }
        ];
        equipmentArray.push(...restaurantEquipment);
      } else if (venueType === 'Fast Food') {
        const fastFoodEquipment = [
          { name: 'Counter', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Kitchen Equipment', type: 'equipment', subtype: 'appliance', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Fryer', type: 'equipment', subtype: 'appliance', quality: 'standard', condition: 95, stock: 1 },
          { name: 'Trays', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 90, stock: 30 }
        ];
        equipmentArray.push(...fastFoodEquipment);
      }
    }
    
    async orderInventory(venueId, itemType, itemName, quantity) {
      try {
        const venue = await this.getVenue(venueId);
        if (!venue) {
          throw new Error(`Cannot order inventory: Venue ${venueId} not found`);
        }
        
        if (this.useDatabase) {
          // Get the item from the database
          const items = await dbAPI.inventory.getInventoryByVenue(venueId, itemType);
          const item = items.find(i => i.name === itemName);
          
          if (!item) {
            throw new Error(`Item "${itemName}" not found in inventory`);
          }
          
          // Calculate total cost
          const totalCost = item.costPrice * quantity;
          
          // Check if player has enough cash
          if (this.game.state.player.cash < totalCost) {
            throw new Error(`Not enough cash to order ${quantity} ${itemName}. Need €${totalCost.toFixed(2)}`);
          }
          
          // Update stock in database
          const newStock = item.stock + quantity;
          await dbAPI.inventory.updateInventoryItem(item.id, { stock: newStock });
          
          // Record transaction
          if (this.game.financialManager) {
            await this.game.financialManager.recordTransaction({
              venueId: venueId,
              type: 'expense',
              category: 'inventory',
              subcategory: itemType,
              item: itemName,
              quantity: quantity,
              price: item.costPrice,
              amount: totalCost
            });
          } else {
            // Update player cash directly if financialManager not available
            this.game.state.player.cash -= totalCost;
          }
          
          // Also update in-memory inventory if this is the current venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            const inventoryItem = this.game.state.currentVenue.inventory[itemType]?.find(i => i.name === itemName);
            if (inventoryItem) {
              inventoryItem.stock += quantity;
            }
          }
          
          window.logToConsole(`Ordered ${quantity} ${itemName} for €${totalCost.toFixed(2)}.`, 'success');
          return true;
        } else {
          // Fallback to in-memory inventory management
          if (!venue.inventory || !venue.inventory[itemType]) {
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
      } catch (error) {
        console.error(`Error ordering inventory:`, error);
        window.logToConsole(`Failed to order inventory: ${error.message}`, 'error');
        return false;
      }
    }
    
    async updateInventoryPrices(venueId, itemType, itemName, newPrice) {
      try {
        const venue = await this.getVenue(venueId);
        if (!venue) {
          throw new Error(`Cannot update prices: Venue ${venueId} not found`);
        }
        
        if (this.useDatabase) {
          // Get the item from the database
          const items = await dbAPI.inventory.getInventoryByVenue(venueId, itemType);
          const item = items.find(i => i.name === itemName);
          
          if (!item) {
            throw new Error(`Item "${itemName}" not found in inventory`);
          }
          
          // Validate price (must be positive)
          if (newPrice <= 0) {
            throw new Error("Price must be positive.");
          }
          
          // Check if price is reasonable (not too low compared to cost)
          if (newPrice < item.costPrice) {
            window.logToConsole(`Warning: Price is below cost price (€${item.costPrice.toFixed(2)}).`, 'warning');
          }
          
          // Update price in database
          await dbAPI.inventory.updateInventoryItem(item.id, { sellPrice: newPrice });
          
          // Also update in-memory inventory if this is the current venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            const inventoryItem = this.game.state.currentVenue.inventory[itemType]?.find(i => i.name === itemName);
            if (inventoryItem) {
              inventoryItem.sellPrice = newPrice;
            }
          }
          
          window.logToConsole(`Updated price of ${itemName} to €${newPrice.toFixed(2)}.`, 'success');
          return true;
        } else {
          // Fallback to in-memory inventory management
          if (!venue.inventory || !venue.inventory[itemType]) {
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
      } catch (error) {
        console.error(`Error updating inventory prices:`, error);
        window.logToConsole(`Failed to update inventory prices: ${error.message}`, 'error');
        return false;
      }
    }
    
    async addNewInventoryItem(venueId, itemType, itemData) {
      try {
        const venue = await this.getVenue(venueId);
        if (!venue) {
          throw new Error(`Cannot add item: Venue ${venueId} not found`);
        }
        
        if (this.useDatabase) {
          // Check if item already exists
          const items = await dbAPI.inventory.getInventoryByVenue(venueId, itemType);
          const existingItem = items.find(i => i.name === itemData.name);
          
          if (existingItem) {
            throw new Error(`Item "${itemData.name}" already exists in inventory`);
          }
          
          // Ensure item has required properties
          const newItem = {
            ...itemData,
            venueId,
            type: itemType,
            subtype: itemData.subtype || itemType,
            stock: itemData.stock || 0,
            quality: itemData.quality || 'standard',
            condition: itemData.condition || 100
          };
          
          // Create item in database
          await dbAPI.inventory.addInventoryItem(newItem);
          
          // Also update in-memory inventory if this is the current venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            if (!this.game.state.currentVenue.inventory[itemType]) {
              this.game.state.currentVenue.inventory[itemType] = [];
            }
            this.game.state.currentVenue.inventory[itemType].push(newItem);
          }
          
          window.logToConsole(`Added new ${itemType} item: ${itemData.name}.`, 'success');
          return true;
        } else {
          // Fallback to in-memory inventory management
          if (!venue.inventory) {
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
      } catch (error) {
        console.error(`Error adding inventory item:`, error);
        window.logToConsole(`Failed to add inventory item: ${error.message}`, 'error');
        return false;
      }
    }
    
    async removeInventoryItem(venueId, itemType, itemName) {
      try {
        const venue = await this.getVenue(venueId);
        if (!venue) {
          throw new Error(`Cannot remove item: Venue ${venueId} not found`);
        }
        
        if (this.useDatabase) {
          // Find the item in the database
          const items = await dbAPI.inventory.getInventoryByVenue(venueId, itemType);
          const item = items.find(i => i.name === itemName);
          
          if (!item) {
            throw new Error(`Item "${itemName}" not found in inventory`);
          }
          
          // Delete from database
          await dbAPI.inventory.deleteInventoryItem(item.id);
          
          // Also update in-memory inventory if this is the current venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            if (this.game.state.currentVenue.inventory[itemType]) {
              const itemIndex = this.game.state.currentVenue.inventory[itemType].findIndex(i => i.name === itemName);
              if (itemIndex !== -1) {
                this.game.state.currentVenue.inventory[itemType].splice(itemIndex, 1);
              }
            }
          }
          
          window.logToConsole(`Removed ${itemName} from inventory.`, 'success');
          return true;
        } else {
          // Fallback to in-memory inventory management
          if (!venue.inventory || !venue.inventory[itemType]) {
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
      } catch (error) {
        console.error(`Error removing inventory item:`, error);
        window.logToConsole(`Failed to remove inventory item: ${error.message}`, 'error');
        return false;
      }
    }
    
    async checkInventoryLevels(venue) {
      try {
        if (!venue) return [];
        
        if (this.useDatabase) {
          // Get inventory items with low stock
          return await dbAPI.inventory.getLowStockItems(venue.id);
        } else {
          // Fallback to in-memory check
          if (!venue.inventory) return [];
          
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
      } catch (error) {
        console.error(`Error checking inventory levels:`, error);
        return [];
      }
    }
    
    async reportLowInventory(venue) {
      try {
        const lowStock = await this.checkInventoryLevels(venue);
        
        if (lowStock && lowStock.length > 0) {
          window.logToConsole('Low inventory alert:', 'warning');
          lowStock.forEach(item => {
            window.logToConsole(`${item.name}: Only ${item.stock} left in stock.`, 'warning');
          });
          return lowStock;
        }
        return [];
      } catch (error) {
        console.error(`Error reporting low inventory:`, error);
        return [];
      }
    }
    
    async getInventorySummary(venueId) {
      try {
        if (this.useDatabase) {
          // Get inventory value summary from database
          return await dbAPI.inventory.getInventoryValueSummary(venueId);
        } else {
          // Fallback to in-memory summary
          const venue = await this.getVenue(venueId);
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
      } catch (error) {
        console.error(`Error getting inventory summary:`, error);
        return null;
      }
    }
    
    async updateEquipmentCondition(venue) {
      try {
        if (!venue) return;
        
        if (this.useDatabase) {
          // Get equipment items from database
          const equipment = await dbAPI.inventory.getInventoryByVenue(venue.id, 'equipment');
          
          if (!equipment || equipment.length === 0) return;
          
          // Gradually reduce equipment condition based on usage
          const customerCount = this.game.customerManager ? 
                             this.game.customerManager.getCurrentCustomerCount() : 0;
          
          // More customers means faster wear and tear
          const wearRate = 0.01 + (customerCount / 1000);
          
          // Update each piece of equipment
          for (const item of equipment) {
            const newCondition = Math.max(0, item.condition - wearRate);
            
            // Update in database
            await dbAPI.inventory.updateInventoryItem(item.id, { condition: newCondition });
            
            // If condition is very low, equipment might break
            if (newCondition < 10 && Math.random() < 0.05) {
              window.logToConsole(`Your ${item.name} broke down and needs to be repaired!`, 'error');
              await dbAPI.inventory.updateInventoryItem(item.id, { condition: 0 });
            }
          }
          
          // Also update in-memory equipment if this is the current venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venue.id) {
            if (this.game.state.currentVenue.inventory && this.game.state.currentVenue.inventory.equipment) {
              this.game.state.currentVenue.inventory.equipment.forEach((equipment, index) => {
                // Reduce condition
                this.game.state.currentVenue.inventory.equipment[index].condition = Math.max(0, equipment.condition - wearRate);
                
                // If condition is very low, equipment might break
                if (equipment.condition < 10 && Math.random() < 0.05) {
                  window.logToConsole(`Your ${equipment.name} broke down and needs to be repaired!`, 'error');
                  this.game.state.currentVenue.inventory.equipment[index].condition = 0;
                }
              });
            }
          }
        } else {
          // Fallback to in-memory condition updates
          if (!venue.inventory || !venue.inventory.equipment) return;
          
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
      } catch (error) {
        console.error(`Error updating equipment condition:`, error);
      }
    }
    
    // Helper method to get venue (either from current venue or by ID)
    async getVenue(venueId) {
      if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
        return this.game.state.currentVenue;
      }
      
      if (this.useDatabase) {
        try {
          return await dbAPI.venue.getVenueById(venueId);
        } catch (error) {
          console