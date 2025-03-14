// InventoryOperations - Handles inventory CRUD operations and equipment condition

const dbAPI = require('../../database/api');

class InventoryOperations {
    constructor(game) {
      this.game = game;
      
      // Whether we're using database storage
      this.useDatabase = false;
    }
    
    setDatabaseAvailability(available) {
      this.useDatabase = available;
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
    
    // Add method to repair equipment
    async repairEquipment(venueId, equipmentName) {
      try {
        const venue = await this.getVenue(venueId);
        if (!venue) {
          throw new Error(`Cannot repair equipment: Venue ${venueId} not found`);
        }
        
        if (this.useDatabase) {
          // Get equipment from database
          const equipment = await dbAPI.inventory.getInventoryByVenue(venueId, 'equipment');
          const item = equipment.find(i => i.name === equipmentName);
          
          if (!item) {
            throw new Error(`Equipment "${equipmentName}" not found in inventory`);
          }
          
          // Calculate repair cost based on condition and quality
          const conditionPercentage = item.condition / 100;
          const qualityMultiplier = item.quality === 'premium' ? 2 : (item.quality === 'standard' ? 1.5 : 1);
          const baseCost = 100 * qualityMultiplier;
          const repairCost = Math.round(baseCost * (1 - conditionPercentage));
          
          // Check if player has enough cash
          if (this.game.state.player.cash < repairCost) {
            throw new Error(`Not enough cash to repair ${equipmentName}. Need €${repairCost.toFixed(2)}`);
          }
          
          // Update condition in database
          await dbAPI.inventory.updateInventoryItem(item.id, { condition: 100 });
          
          // Record transaction
          if (this.game.financialManager) {
            await this.game.financialManager.recordTransaction({
              venueId: venueId,
              type: 'expense',
              category: 'maintenance',
              subcategory: 'repair',
              item: equipmentName,
              amount: repairCost
            });
          } else {
            // Update player cash directly if financialManager not available
            this.game.state.player.cash -= repairCost;
          }
          
          // Also update in-memory inventory if this is the current venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            if (this.game.state.currentVenue.inventory && this.game.state.currentVenue.inventory.equipment) {
              const equipmentIndex = this.game.state.currentVenue.inventory.equipment.findIndex(e => e.name === equipmentName);
              if (equipmentIndex !== -1) {
                this.game.state.currentVenue.inventory.equipment[equipmentIndex].condition = 100;
              }
            }
          }
          
          window.logToConsole(`Repaired ${equipmentName} for €${repairCost.toFixed(2)}.`, 'success');
          return true;
        } else {
          // Fallback to in-memory inventory management
          if (!venue.inventory || !venue.inventory.equipment) {
            window.logToConsole(`Cannot repair equipment: Equipment inventory not found.`, 'error');
            return false;
          }
          
          // Find the equipment
          const equipmentIndex = venue.inventory.equipment.findIndex(item => item.name === equipmentName);
          if (equipmentIndex === -1) {
            window.logToConsole(`Equipment "${equipmentName}" not found in inventory.`, 'error');
            return false;
          }
          
          const equipment = venue.inventory.equipment[equipmentIndex];
          
          // Calculate repair cost based on condition and quality
          const conditionPercentage = equipment.condition / 100;
          const qualityMultiplier = equipment.quality === 'premium' ? 2 : (equipment.quality === 'standard' ? 1.5 : 1);
          const baseCost = 100 * qualityMultiplier;
          const repairCost = Math.round(baseCost * (1 - conditionPercentage));
          
          // Check if player has enough cash
          if (this.game.state.player.cash < repairCost) {
            window.logToConsole(`Not enough cash to repair ${equipmentName}. Need €${repairCost.toFixed(2)}.`, 'error');
            return false;
          }
          
          // Update condition
          venue.inventory.equipment[equipmentIndex].condition = 100;
          
          // Deduct cost
          this.game.state.player.cash -= repairCost;
          
          // Record transaction
          if (this.game.financialManager) {
            this.game.financialManager.recordTransaction({
              type: 'expense',
              category: 'maintenance',
              subcategory: 'repair',
              item: equipmentName,
              amount: repairCost,
              date: { ...this.game.timeManager.getGameTime() },
              venueId: venue.id
            });
          }
          
          window.logToConsole(`Repaired ${equipmentName} for €${repairCost.toFixed(2)}.`, 'success');
          return true;
        }
      } catch (error) {
        console.error(`Error repairing equipment:`, error);
        window.logToConsole(`Failed to repair equipment: ${error.message}`, 'error');
        return false;
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
          console.error(`Error getting venue ${venueId} from database:`, error);
          return null;
        }
      } else {
        // Fallback to searching in player's venues
        return this.game.state.player.venues.find(v => v.id === venueId);
      }
    }
    
    // Add method for upgrading equipment quality
    async upgradeEquipment(venueId, equipmentName) {
      try {
        const venue = await this.getVenue(venueId);
        if (!venue) {
          throw new Error(`Cannot upgrade equipment: Venue ${venueId} not found`);
        }
        
        if (this.useDatabase) {
          // Get equipment from database
          const equipment = await dbAPI.inventory.getInventoryByVenue(venueId, 'equipment');
          const item = equipment.find(i => i.name === equipmentName);
          
          if (!item) {
            throw new Error(`Equipment "${equipmentName}" not found in inventory`);
          }
          
          // Check if equipment is already premium
          if (item.quality === 'premium') {
            throw new Error(`${equipmentName} is already premium quality.`);
          }
          
          // Calculate upgrade cost
          const upgradeMultiplier = item.quality === 'standard' ? 2 : 3; // standard to premium = 2x, basic to premium = 3x
          const upgradeCost = Math.round(item.costPrice * upgradeMultiplier);
          
          // Check if player has enough cash
          if (this.game.state.player.cash < upgradeCost) {
            throw new Error(`Not enough cash to upgrade ${equipmentName}. Need €${upgradeCost.toFixed(2)}`);
          }
          
          // Determine new quality level
          const newQuality = item.quality === 'standard' ? 'premium' : 'standard';
          
          // Update quality in database
          await dbAPI.inventory.updateInventoryItem(item.id, { 
            quality: newQuality,
            costPrice: item.costPrice * 1.5 // Increase base cost for better equipment
          });
          
          // Record transaction
          if (this.game.financialManager) {
            await this.game.financialManager.recordTransaction({
              venueId: venueId,
              type: 'expense',
              category: 'equipment',
              subcategory: 'upgrade',
              item: equipmentName,
              amount: upgradeCost
            });
          } else {
            // Update player cash directly if financialManager not available
            this.game.state.player.cash -= upgradeCost;
          }
          
          // Also update in-memory inventory if this is the current venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            if (this.game.state.currentVenue.inventory && this.game.state.currentVenue.inventory.equipment) {
              const equipmentIndex = this.game.state.currentVenue.inventory.equipment.findIndex(e => e.name === equipmentName);
              if (equipmentIndex !== -1) {
                this.game.state.currentVenue.inventory.equipment[equipmentIndex].quality = newQuality;
                this.game.state.currentVenue.inventory.equipment[equipmentIndex].costPrice *= 1.5;
              }
            }
          }
          
          window.logToConsole(`Upgraded ${equipmentName} to ${newQuality} quality for €${upgradeCost.toFixed(2)}.`, 'success');
          return true;
        } else {
          // Fallback to in-memory inventory management
          if (!venue.inventory || !venue.inventory.equipment) {
            window.logToConsole(`Cannot upgrade equipment: Equipment inventory not found.`, 'error');
            return false;
          }
          
          // Find the equipment
          const equipmentIndex = venue.inventory.equipment.findIndex(item => item.name === equipmentName);
          if (equipmentIndex === -1) {
            window.logToConsole(`Equipment "${equipmentName}" not found in inventory.`, 'error');
            return false;
          }
          
          const equipment = venue.inventory.equipment[equipmentIndex];
          
          // Check if equipment is already premium
          if (equipment.quality === 'premium') {
            window.logToConsole(`${equipmentName} is already premium quality.`, 'error');
            return false;
          }
          
          // Calculate upgrade cost
          const upgradeMultiplier = equipment.quality === 'standard' ? 2 : 3; // standard to premium = 2x, basic to premium = 3x
          const upgradeCost = Math.round(equipment.costPrice * upgradeMultiplier);
          
          // Check if player has enough cash
          if (this.game.state.player.cash < upgradeCost) {
            window.logToConsole(`Not enough cash to upgrade ${equipmentName}. Need €${upgradeCost.toFixed(2)}.`, 'error');
            return false;
          }
          
          // Determine new quality level
          const newQuality = equipment.quality === 'standard' ? 'premium' : 'standard';
          
          // Update quality
          venue.inventory.equipment[equipmentIndex].quality = newQuality;
          venue.inventory.equipment[equipmentIndex].costPrice *= 1.5; // Increase base cost for better equipment
          
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
      } catch (error) {
        console.error(`Error upgrading equipment:`, error);
        window.logToConsole(`Failed to upgrade equipment: ${error.message}`, 'error');
        return false;
      }
    }
}

module.exports = InventoryOperations;