// js/database/services/venueService.js
const { 
    VenueDAO, 
    StaffDAO, 
    InventoryDAO, 
    TransactionDAO 
  } = require('../dao');
  
  class VenueService {
    constructor() {
      this.venueDAO = new VenueDAO();
      this.staffDAO = new StaffDAO();
      this.inventoryDAO = new InventoryDAO();
      this.transactionDAO = new TransactionDAO();
    }
  
    /**
     * Creates a new venue with default inventory and records the initial expense
     * @param {Object} venueData - Venue data
     * @param {number} playerId - Player ID who owns the venue
     * @returns {Promise<Object>} Created venue with ID
     */
    async createNewVenue(venueData, playerId) {
      try {
        // Add player ID to venue data
        const venueWithPlayer = {
          ...venueData,
          player_id: playerId
        };
  
        // Create the venue
        const venue = await this.venueDAO.createVenue(venueWithPlayer);
  
        // Add default inventory based on venue type
        await this.addDefaultInventory(venue.id, venue.type);
  
        // Record initial expense (e.g., venue purchase cost)
        const initialCost = this.calculateInitialCost(venue.type, venue.size, venue.city);
        
        if (initialCost > 0) {
          await this.transactionDAO.recordTransaction({
            venueId: venue.id,
            type: 'expense',
            category: 'property',
            subcategory: 'purchase',
            amount: initialCost,
            metadata: {
              description: `Initial purchase of ${venue.name} (${venue.type}) in ${venue.city}`
            }
          });
        }
  
        return venue;
      } catch (error) {
        console.error('Error creating new venue with default setup:', error);
        throw error;
      }
    }
  
    /**
     * Adds default inventory items based on venue type
     * @param {number} venueId - Venue ID
     * @param {string} venueType - Venue type
     * @returns {Promise<void>}
     */
    async addDefaultInventory(venueId, venueType) {
      try {
        // Add common equipment for all venue types
        const commonEquipment = [
          {
            name: 'Tables',
            type: 'equipment',
            subtype: 'furniture',
            costPrice: 100,
            quality: 'standard',
            condition: 100,
            stock: 1 // Quantity
          },
          {
            name: 'Chairs',
            type: 'equipment',
            subtype: 'furniture',
            costPrice: 25,
            quality: 'standard',
            condition: 100,
            stock: 4 // Quantity
          },
          {
            name: 'Lighting',
            type: 'equipment',
            subtype: 'fixtures',
            costPrice: 200,
            quality: 'standard',
            condition: 100,
            stock: 1 // Quantity
          }
        ];
  
        // Add each common equipment item
        for (const item of commonEquipment) {
          await this.inventoryDAO.addInventoryItem({
            ...item,
            venueId
          });
        }
  
        // Add venue-specific items
        let specificItems = [];
  
        switch (venueType) {
          case 'Bar':
            specificItems = this.getDefaultBarInventory();
            break;
          case 'Restaurant':
            specificItems = this.getDefaultRestaurantInventory();
            break;
          case 'Nightclub':
            specificItems = this.getDefaultNightclubInventory();
            break;
          case 'Fast Food':
            specificItems = this.getDefaultFastFoodInventory();
            break;
        }
  
        // Add each specific item
        for (const item of specificItems) {
          await this.inventoryDAO.addInventoryItem({
            ...item,
            venueId
          });
        }
      } catch (error) {
        console.error(`Error adding default inventory for venue ${venueId}:`, error);
        throw error;
      }
    }
  
    /**
     * Gets default inventory items for a bar
     * @returns {Array<Object>} Default bar inventory items
     */
    getDefaultBarInventory() {
      // Equipment
      const equipment = [
        {
          name: 'Bar Counter',
          type: 'equipment',
          subtype: 'furniture',
          costPrice: 1000,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Glassware',
          type: 'equipment',
          subtype: 'utensils',
          costPrice: 200,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Beer Taps',
          type: 'equipment',
          subtype: 'appliance',
          costPrice: 800,
          quality: 'standard',
          condition: 100,
          stock: 1
        }
      ];
  
      // Drinks
      const drinks = [
        {
          name: 'Beer',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 1.50,
          sellPrice: 4.00,
          stock: 50
        },
        {
          name: 'Wine (Glass)',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 2.00,
          sellPrice: 6.00,
          stock: 30
        },
        {
          name: 'Whiskey',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 2.50,
          sellPrice: 7.50,
          stock: 20
        },
        {
          name: 'Soda',
          type: 'drinks',
          subtype: 'non-alcoholic',
          costPrice: 0.50,
          sellPrice: 2.50,
          stock: 40
        }
      ];
  
      return [...equipment, ...drinks];
    }
  
    /**
     * Gets default inventory items for a restaurant
     * @returns {Array<Object>} Default restaurant inventory items
     */
    getDefaultRestaurantInventory() {
      // Equipment
      const equipment = [
        {
          name: 'Dining Tables',
          type: 'equipment',
          subtype: 'furniture',
          costPrice: 300,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Kitchen Equipment',
          type: 'equipment',
          subtype: 'appliance',
          costPrice: 3000,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Tableware',
          type: 'equipment',
          subtype: 'utensils',
          costPrice: 500,
          quality: 'standard',
          condition: 100,
          stock: 1
        }
      ];
  
      // Drinks
      const drinks = [
        {
          name: 'Wine (Bottle)',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 8.00,
          sellPrice: 24.00,
          stock: 15
        },
        {
          name: 'Beer',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 1.50,
          sellPrice: 4.50,
          stock: 30
        },
        {
          name: 'Coffee',
          type: 'drinks',
          subtype: 'non-alcoholic',
          costPrice: 0.70,
          sellPrice: 3.00,
          stock: 40
        },
        {
          name: 'Soft Drinks',
          type: 'drinks',
          subtype: 'non-alcoholic',
          costPrice: 0.50,
          sellPrice: 2.50,
          stock: 40
        }
      ];
  
      // Food
      const food = [
        {
          name: 'Pasta',
          type: 'food',
          subtype: 'main',
          costPrice: 3.00,
          sellPrice: 12.00,
          stock: 20
        },
        {
          name: 'Steak',
          type: 'food',
          subtype: 'main',
          costPrice: 7.00,
          sellPrice: 22.00,
          stock: 15
        },
        {
          name: 'Salad',
          type: 'food',
          subtype: 'starter',
          costPrice: 2.00,
          sellPrice: 8.00,
          stock: 20
        },
        {
          name: 'Dessert',
          type: 'food',
          subtype: 'dessert',
          costPrice: 2.50,
          sellPrice: 8.50,
          stock: 15
        }
      ];
  
      return [...equipment, ...drinks, ...food];
    }
  
    /**
     * Gets default inventory items for a nightclub
     * @returns {Array<Object>} Default nightclub inventory items
     */
    getDefaultNightclubInventory() {
      // Equipment
      const equipment = [
        {
          name: 'DJ Equipment',
          type: 'equipment',
          subtype: 'electronics',
          costPrice: 2000,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Sound System',
          type: 'equipment',
          subtype: 'electronics',
          costPrice: 3000,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Bar Counter',
          type: 'equipment',
          subtype: 'furniture',
          costPrice: 1500,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Lighting Rig',
          type: 'equipment',
          subtype: 'electronics',
          costPrice: 2500,
          quality: 'standard',
          condition: 100,
          stock: 1
        }
      ];
  
      // Drinks
      const drinks = [
        {
          name: 'Beer',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 1.50,
          sellPrice: 5.00,
          stock: 100
        },
        {
          name: 'Vodka',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 2.00,
          sellPrice: 7.00,
          stock: 30
        },
        {
          name: 'Cocktails',
          type: 'drinks',
          subtype: 'alcoholic',
          costPrice: 3.00,
          sellPrice: 9.00,
          stock: 40
        },
        {
          name: 'Energy Drink',
          type: 'drinks',
          subtype: 'non-alcoholic',
          costPrice: 1.50,
          sellPrice: 5.00,
          stock: 50
        }
      ];
  
      return [...equipment, ...drinks];
    }
  
    /**
     * Gets default inventory items for a fast food restaurant
     * @returns {Array<Object>} Default fast food inventory items
     */
    getDefaultFastFoodInventory() {
      // Equipment
      const equipment = [
        {
          name: 'Counter',
          type: 'equipment',
          subtype: 'furniture',
          costPrice: 800,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Cooking Equipment',
          type: 'equipment',
          subtype: 'appliance',
          costPrice: 2000,
          quality: 'standard',
          condition: 100,
          stock: 1
        },
        {
          name: 'Trays',
          type: 'equipment',
          subtype: 'utensils',
          costPrice: 100,
          quality: 'standard',
          condition: 100,
          stock: 1
        }
      ];
  
      // Drinks
      const drinks = [
        {
          name: 'Soda',
          type: 'drinks',
          subtype: 'non-alcoholic',
          costPrice: 0.30,
          sellPrice: 1.80,
          stock: 100
        },
        {
          name: 'Coffee',
          type: 'drinks',
          subtype: 'non-alcoholic',
          costPrice: 0.50,
          sellPrice: 2.00,
          stock: 50
        },
        {
          name: 'Milkshake',
          type: 'drinks',
          subtype: 'non-alcoholic',
          costPrice: 0.80,
          sellPrice: 3.00,
          stock: 30
        }
      ];
  
      // Food
      const food = [
        {
          name: 'Burger',
          type: 'food',
          subtype: 'main',
          costPrice: 1.50,
          sellPrice: 4.50,
          stock: 40
        },
        {
          name: 'Fries',
          type: 'food',
          subtype: 'side',
          costPrice: 0.50,
          sellPrice: 2.00,
          stock: 50
        },
        {
          name: 'Chicken Nuggets',
          type: 'food',
          subtype: 'main',
          costPrice: 1.20,
          sellPrice: 3.50,
          stock: 30
        },
        {
          name: 'Ice Cream',
          type: 'food',
          subtype: 'dessert',
          costPrice: 0.60,
          sellPrice: 2.00,
          stock: 25
        }
      ];
  
      return [...equipment, ...drinks, ...food];
    }
  
    /**
     * Calculates initial cost of venue purchase
     * @param {string} venueType - Venue type
     * @param {string} venueSize - Venue size
     * @param {string} city - City where venue is located
     * @returns {number} Initial cost
     */
    calculateInitialCost(venueType, venueSize, city) {
      // Base costs by venue type
      const typeCosts = {
        'Bar': 20000,
        'Restaurant': 30000,
        'Nightclub': 40000,
        'Fast Food': 25000
      };
      
      // Size multipliers
      const sizeMultipliers = {
        'small': 1,
        'medium': 1.8,
        'large': 3
      };
      
      // City multipliers (can be refined based on actual city data)
      const cityMultipliers = {
        'London': 1.5,
        'Berlin': 1.2,
        'Paris': 1.4,
        'Madrid': 1.1,
        'Rome': 1.3
      };
      
      // Calculate cost based on type, size, and city
      const baseCost = typeCosts[venueType] || 25000;
      const sizeMultiplier = sizeMultipliers[venueSize] || 1;
      const cityMultiplier = cityMultipliers[city] || 1;
      
      return Math.round(baseCost * sizeMultiplier * cityMultiplier);
    }
  
    /**
     * Gets a comprehensive venue report with all related data
     * @param {number} venueId - Venue ID
     * @returns {Promise<Object>} Comprehensive venue report
     */
    async getVenueReport(venueId) {
      try {
        // Get basic venue data
        const venue = await this.venueDAO.getVenueById(venueId);
        
        if (!venue) {
          throw new Error(`Venue with ID ${venueId} not found`);
        }
        
        // Get staff data
        const staff = await this.staffDAO.getStaffByVenueId(venueId);
        
        // Get inventory summary
        const inventory = await this.inventoryDAO.getInventoryValueSummary(venueId);
        
        // Get low stock items
        const lowStockItems = await this.inventoryDAO.getLowStockItems(venueId);
        
        // Get equipment needing maintenance
        const maintenanceItems = await this.inventoryDAO.getEquipmentNeedingMaintenance(venueId);
        
        // Get financial summary for the last 30 days
        const finances = await this.transactionDAO.getFinancialSummary(venueId, 'monthly');
        
        // Get revenue trend for the last 12 periods
        const revenueTrend = await this.transactionDAO.getRevenueTrend(venueId, 'weekly', 12);
        
        // Compile the comprehensive report
        return {
          venue,
          staff: {
            count: staff.length,
            totalWages: staff.reduce((sum, s) => sum + s.wage, 0),
            details: staff
          },
          inventory: {
            summary: inventory,
            lowStock: lowStockItems,
            maintenance: maintenanceItems
          },
          finances: {
            summary: finances,
            trend: revenueTrend
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error generating venue report for venue ${venueId}:`, error);
        throw error;
      }
    }
  
    /**
     * Sells a venue and records the transaction
     * @param {number} venueId - Venue ID
     * @param {number} playerId - Player ID
     * @returns {Promise<Object>} Sale result
     */
    async sellVenue(venueId, playerId) {
      try {
        // Get venue details
        const venue = await this.venueDAO.getVenueById(venueId);
        
        if (!venue) {
          throw new Error(`Venue with ID ${venueId} not found`);
        }
        
        // Verify ownership
        if (venue.playerId !== playerId) {
          throw new Error('Player does not own this venue');
        }
        
        // Calculate sale value based on various factors
        const saleValue = await this.calculateVenueSaleValue(venueId);
        
        // Record the sale transaction
        await this.transactionDAO.recordTransaction({
          venueId: venueId,
          type: 'revenue',
          category: 'property',
          subcategory: 'sale',
          amount: saleValue,
          metadata: {
            description: `Sale of ${venue.name} (${venue.type}) in ${venue.city}`,
            originalPurchasePrice: venue.purchasePrice || 0
          }
        });
        
        // Remove all staff from venue
        const staff = await this.staffDAO.getStaffByVenueId(venueId);
        for (const staffMember of staff) {
          await this.staffDAO.removeStaffFromVenue(staffMember.id);
        }
        
        // Delete the venue
        await this.venueDAO.deleteVenue(venueId);
        
        return {
          success: true,
          venueId,
          saleValue,
          message: `${venue.name} was sold for €${saleValue.toLocaleString()}`
        };
      } catch (error) {
        console.error(`Error selling venue ${venueId}:`, error);
        throw error;
      }
    }
  
    /**
     * Calculates the sale value of a venue
     * @param {number} venueId - Venue ID
     * @returns {Promise<number>} Sale value
     */
    async calculateVenueSaleValue(venueId) {
      try {
        // Get venue details
        const venue = await this.venueDAO.getVenueById(venueId);
        
        if (!venue) {
          throw new Error(`Venue with ID ${venueId} not found`);
        }
        
        // Base value depends on venue type and size
        const baseValue = this.calculateInitialCost(venue.type, venue.size, venue.city);
        
        // Value modifiers based on various factors
        let modifiers = 1.0;
        
        // Add value based on popularity
        modifiers += (venue.stats.popularity - 50) / 100;
        
        // Add value based on equipment
        const inventorySummary = await this.inventoryDAO.getInventoryValueSummary(venueId);
        modifiers += inventorySummary.totalValue / baseValue / 2;
        
        // Add value based on profitability
        const finances = await this.transactionDAO.getFinancialSummary(venueId, 'monthly');
        if (finances.profitMargin > 0) {
          modifiers += finances.profitMargin / 100;
        }
        
        // Calculate final value
        const saleValue = Math.round(baseValue * modifiers);
        
        return saleValue;
      } catch (error) {
        console.error(`Error calculating sale value for venue ${venueId}:`, error);
        throw error;
      }
    }
    
    /**
     * Upgrades a venue to a larger size
     * @param {number} venueId - Venue ID
     * @param {string} newSize - New venue size
     * @returns {Promise<Object>} Upgrade result
     */
    async upgradeVenueSize(venueId, newSize) {
      try {
        // Get venue details
        const venue = await this.venueDAO.getVenueById(venueId);
        
        if (!venue) {
          throw new Error(`Venue with ID ${venueId} not found`);
        }
        
        // Validate upgrade path
        if (venue.size === 'large') {
          throw new Error('Venue is already at maximum size');
        }
        
        if (venue.size === 'medium' && newSize !== 'large') {
          throw new Error('Medium venues can only upgrade to large');
        }
        
        if (venue.size === 'small' && newSize !== 'medium') {
          throw new Error('Small venues can only upgrade to medium');
        }
        
        // Calculate upgrade cost
        const upgradeCost = this.calculateUpgradeCost(venue.type, venue.size, newSize, venue.city);
        
        // Record the upgrade expense
        await this.transactionDAO.recordTransaction({
          venueId: venue.id,
          type: 'expense',
          category: 'property',
          subcategory: 'upgrade',
          amount: upgradeCost,
          metadata: {
            description: `Upgrade ${venue.name} from ${venue.size} to ${newSize}`,
            oldSize: venue.size,
            newSize: newSize
          }
        });
        
        // Update venue size
        await this.venueDAO.updateVenue(venueId, { 
          size: newSize,
          settings: {
            ...venue.settings,
            customerCapacity: this.getCapacityForSize(newSize)
          }
        });
        
        // Add additional inventory appropriate for the new size
        await this.addSizeUpgradeInventory(venueId, venue.type, newSize);
        
        return {
          success: true,
          venueId,
          newSize,
          upgradeCost,
          message: `${venue.name} was upgraded to ${newSize} size for €${upgradeCost.toLocaleString()}`
        };
      } catch (error) {
        console.error(`Error upgrading venue ${venueId}:`, error);
        throw error;
      }
    }
    
    /**
     * Calculates cost of upgrading a venue
     * @param {string} venueType - Venue type
     * @param {string} currentSize - Current venue size
     * @param {string} newSize - New venue size
     * @param {string} city - City where venue is located
     * @returns {number} Upgrade cost
     */
    calculateUpgradeCost(venueType, currentSize, newSize, city) {
      // Base costs for upgrades by venue type
      const typeCosts = {
        'Bar': { 'small_to_medium': 15000, 'medium_to_large': 30000 },
        'Restaurant': { 'small_to_medium': 20000, 'medium_to_large': 40000 },
        'Nightclub': { 'small_to_medium': 25000, 'medium_to_large': 50000 },
        'Fast Food': { 'small_to_medium': 18000, 'medium_to_large': 35000 }
      };
      
      // City multipliers
      const cityMultipliers = {
        'London': 1.5,
        'Berlin': 1.2,
        'Paris': 1.4,
        'Madrid': 1.1,
        'Rome': 1.3
      };
      
      // Determine upgrade type
      const upgradeType = currentSize === 'small' ? 'small_to_medium' : 'medium_to_large';
      
      // Get base cost
      const baseCost = typeCosts[venueType]?.[upgradeType] || 20000;
      
      // Apply city multiplier
      const cityMultiplier = cityMultipliers[city] || 1;
      
      return Math.round(baseCost * cityMultiplier);
    }
    
    /**
     * Gets customer capacity for a venue size
     * @param {string} size - Venue size
     * @returns {number} Customer capacity
     */
    getCapacityForSize(size) {
      const capacities = {
        'small': 30,
        'medium': 75,
        'large': 150
      };
      
      return capacities[size] || 30;
    }
    
    /**
     * Adds additional inventory appropriate for a venue size upgrade
     * @param {number} venueId - Venue ID
     * @param {string} venueType - Venue type
     * @param {string} newSize - New venue size
     * @returns {Promise<void>}
     */
    async addSizeUpgradeInventory(venueId, venueType, newSize) {
      try {
        // Additional furniture for all venue types
        const commonItems = [
          {
            name: 'Additional Tables',
            type: 'equipment',
            subtype: 'furniture',
            costPrice: newSize === 'medium' ? 400 : 800,
            quality: 'standard',
            condition: 100,
            stock: 1
          },
          {
            name: 'Additional Chairs',
            type: 'equipment',
            subtype: 'furniture',
            costPrice: newSize === 'medium' ? 300 : 600,
            quality: 'standard',
            condition: 100,
            stock: 1
          }
        ];
        
        // Add each common item
        for (const item of commonItems) {
          await this.inventoryDAO.addInventoryItem({
            ...item,
            venueId
          });
        }
        
        // Add venue-type specific items
        let specificItems = [];
        
        if (newSize === 'medium') {
          // Medium size upgrades
          switch (venueType) {
            case 'Bar':
              specificItems = [
                {
                  name: 'Upgraded Bar Counter',
                  type: 'equipment',
                  subtype: 'furniture',
                  costPrice: 3000,
                  quality: 'standard',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
            case 'Restaurant':
              specificItems = [
                {
                  name: 'Expanded Kitchen',
                  type: 'equipment',
                  subtype: 'appliance',
                  costPrice: 5000,
                  quality: 'standard',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
            case 'Nightclub':
              specificItems = [
                {
                  name: 'Better Sound System',
                  type: 'equipment',
                  subtype: 'electronics',
                  costPrice: 4000,
                  quality: 'standard',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
            case 'Fast Food':
              specificItems = [
                {
                  name: 'Additional Cooking Area',
                  type: 'equipment',
                  subtype: 'appliance',
                  costPrice: 3500,
                  quality: 'standard',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
          }
        } else if (newSize === 'large') {
          // Large size upgrades
          switch (venueType) {
            case 'Bar':
              specificItems = [
                {
                  name: 'Second Bar Area',
                  type: 'equipment',
                  subtype: 'furniture',
                  costPrice: 8000,
                  quality: 'standard',
                  condition: 100,
                  stock: 1
                },
                {
                  name: 'Premium Glassware',
                  type: 'equipment',
                  subtype: 'utensils',
                  costPrice: 2000,
                  quality: 'premium',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
            case 'Restaurant':
              specificItems = [
                {
                  name: 'Deluxe Kitchen',
                  type: 'equipment',
                  subtype: 'appliance',
                  costPrice: 12000,
                  quality: 'premium',
                  condition: 100,
                  stock: 1
                },
                {
                  name: 'Private Dining Area',
                  type: 'equipment',
                  subtype: 'furniture',
                  costPrice: 5000,
                  quality: 'premium',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
            case 'Nightclub':
              specificItems = [
                {
                  name: 'VIP Area',
                  type: 'equipment',
                  subtype: 'furniture',
                  costPrice: 7000,
                  quality: 'premium',
                  condition: 100,
                  stock: 1
                },
                {
                  name: 'Premium Lighting System',
                  type: 'equipment',
                  subtype: 'electronics',
                  costPrice: 9000,
                  quality: 'premium',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
            case 'Fast Food':
              specificItems = [
                {
                  name: 'Drive-Through Equipment',
                  type: 'equipment',
                  subtype: 'appliance',
                  costPrice: 8000,
                  quality: 'standard',
                  condition: 100,
                  stock: 1
                },
                {
                  name: 'Expanded Seating Area',
                  type: 'equipment',
                  subtype: 'furniture',
                  costPrice: 4000,
                  quality: 'standard',
                  condition: 100,
                  stock: 1
                }
              ];
              break;
          }
        }
        
        // Add each specific item
        for (const item of specificItems) {
          await this.inventoryDAO.addInventoryItem({
            ...item,
            venueId
          });
        }
      } catch (error) {
        console.error(`Error adding upgrade inventory for venue ${venueId}:`, error);
        throw error;
      }
    }
    
    /**
   * Updates venue settings
   * @param {number} venueId - Venue ID
   * @param {Object} settings - New settings
   * @returns {Promise<boolean>} True if update successful
   */
  async updateVenueSettings(venueId, settings) {
    try {
      const venue = await this.venueDAO.getVenueById(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      // Merge new settings with existing settings
      const updatedSettings = {
        ...venue.settings,
        ...settings
      };
      
      // Update venue with new settings
      return await this.venueDAO.updateVenue(venueId, { settings: updatedSettings });
    } catch (error) {
      console.error(`Error updating settings for venue ${venueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Clean a venue (restores cleanliness)
   * @param {number} venueId - Venue ID
   * @param {boolean} [useOwnStaff=true] - Whether to use venue's own cleaning staff
   * @returns {Promise<Object>} Cleaning result
   */
  async cleanVenue(venueId, useOwnStaff = true) {
    try {
      const venue = await this.venueDAO.getVenueById(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      let cleaningCost = 0;
      let cleaningLevel = 100; // Full cleaning by default
      
      // Check if venue has cleaning staff
      if (useOwnStaff) {
        const cleaningStaff = await this.staffDAO.getStaffByVenueId(venueId)
          .then(staff => staff.filter(s => s.type === 'cleaner'));
        
        if (cleaningStaff.length > 0) {
          // Staff cleaning is free (already paid via wages)
          cleaningCost = 0;
          
          // Quality depends on staff skills
          const avgSkill = cleaningStaff.reduce((sum, staff) => {
            const thoroughness = staff.skills.thoroughness || 50;
            return sum + thoroughness;
          }, 0) / cleaningStaff.length;
          
          // Adjust cleaning level based on skill (90-100%)
          cleaningLevel = 90 + (avgSkill / 100) * 10;
        } else {
          // No cleaning staff, need to hire external service
          useOwnStaff = false;
        }
      }
      
      if (!useOwnStaff) {
        // Calculate external cleaning cost based on venue size and type
        const sizeMultipliers = {
          'small': 1,
          'medium': 1.8,
          'large': 3
        };
        
        const typeMultipliers = {
          'Bar': 1,
          'Restaurant': 1.5,
          'Nightclub': 1.2,
          'Fast Food': 1.3
        };
        
        const baseCost = 100;
        const sizeMultiplier = sizeMultipliers[venue.size] || 1;
        const typeMultiplier = typeMultipliers[venue.type] || 1;
        
        // Dirtier venues cost more to clean
        const dirtinessMultiplier = Math.max(1, (100 - venue.stats.cleanliness) / 50);
        
        cleaningCost = Math.round(baseCost * sizeMultiplier * typeMultiplier * dirtinessMultiplier);
        
        // Record the expense
        await this.transactionDAO.recordTransaction({
          venueId: venue.id,
          type: 'expense',
          category: 'maintenance',
          subcategory: 'cleaning',
          amount: cleaningCost,
          metadata: {
            description: `External cleaning service for ${venue.name}`
          }
        });
      }
      
      // Update venue cleanliness stat
      const updatedStats = {
        ...venue.stats,
        cleanliness: cleaningLevel
      };
      
      await this.venueDAO.updateVenue(venueId, { stats: updatedStats });
      
      return {
        success: true,
        venueId,
        cleanliness: cleaningLevel,
        cost: cleaningCost,
        usedOwnStaff: useOwnStaff,
        message: useOwnStaff 
          ? `Your cleaning staff restored cleanliness to ${cleaningLevel.toFixed(1)}%`
          : `External cleaning service restored cleanliness to 100% for €${cleaningCost.toLocaleString()}`
      };
    } catch (error) {
      console.error(`Error cleaning venue ${venueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Rename a venue
   * @param {number} venueId - Venue ID
   * @param {string} newName - New venue name
   * @returns {Promise<boolean>} True if update successful
   */
  async renameVenue(venueId, newName) {
    try {
      if (!newName || newName.trim().length === 0) {
        throw new Error('Venue name cannot be empty');
      }
      
      return await this.venueDAO.updateVenue(venueId, { name: newName.trim() });
    } catch (error) {
      console.error(`Error renaming venue ${venueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Set venue operating hours
   * @param {number} venueId - Venue ID
   * @param {number} openingHour - Opening hour (0-23)
   * @param {number} closingHour - Closing hour (0-23)
   * @returns {Promise<Object>} Update result
   */
  async setVenueHours(venueId, openingHour, closingHour) {
    try {
      const venue = await this.venueDAO.getVenueById(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      // Validate hours
      if (openingHour < 0 || openingHour > 23 || closingHour < 0 || closingHour > 23) {
        throw new Error('Hours must be between 0-23');
      }
      
      // Check if the venue is in a city with hour restrictions
      // This would typically be handled by a CityDAO or similar, but we'll simplify here
      // In a full implementation, you'd query city regulations from the database
      
      // Update venue settings
      const updatedSettings = {
        ...venue.settings,
        openingHour,
        closingHour
      };
      
      await this.venueDAO.updateVenue(venueId, { settings: updatedSettings });
      
      return {
        success: true,
        venueId,
        openingHour,
        closingHour,
        message: `Operating hours set to ${openingHour}:00-${closingHour}:00`
      };
    } catch (error) {
      console.error(`Error setting hours for venue ${venueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Set venue music volume
   * @param {number} venueId - Venue ID
   * @param {number} volume - Music volume (0-100)
   * @returns {Promise<Object>} Update result
   */
  async setMusicVolume(venueId, volume) {
    try {
      const venue = await this.venueDAO.getVenueById(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      // Validate volume
      if (volume < 0 || volume > 100) {
        throw new Error('Volume must be between 0-100');
      }
      
      // Update venue settings
      const updatedSettings = {
        ...venue.settings,
        musicVolume: volume
      };
      
      await this.venueDAO.updateVenue(venueId, { settings: updatedSettings });
      
      // Check if volume might violate city noise regulations
      // In a full implementation, you'd query city regulations from the database
      let warningMessage = '';
      if (volume > 80) {
        warningMessage = 'Warning: High volume may violate local noise regulations';
      }
      
      return {
        success: true,
        venueId,
        volume,
        message: `Music volume set to ${volume}%`,
        warning: warningMessage
      };
    } catch (error) {
      console.error(`Error setting music volume for venue ${venueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Set venue lighting level
   * @param {number} venueId - Venue ID
   * @param {number} level - Lighting level (0-100)
   * @returns {Promise<Object>} Update result
   */
  async setLightingLevel(venueId, level) {
    try {
      const venue = await this.venueDAO.getVenueById(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      // Validate level
      if (level < 0 || level > 100) {
        throw new Error('Lighting level must be between 0-100');
      }
      
      // Update venue settings
      const updatedSettings = {
        ...venue.settings,
        lightingLevel: level
      };
      
      await this.venueDAO.updateVenue(venueId, { settings: updatedSettings });
      
      return {
        success: true,
        venueId,
        level,
        message: `Lighting level set to ${level}%`
      };
    } catch (error) {
      console.error(`Error setting lighting level for venue ${venueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Set venue entrance fee
   * @param {number} venueId - Venue ID
   * @param {number} fee - Entrance fee
   * @returns {Promise<Object>} Update result
   */
  async setEntranceFee(venueId, fee) {
    try {
      const venue = await this.venueDAO.getVenueById(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      // Validate fee
      if (fee < 0) {
        throw new Error('Entrance fee cannot be negative');
      }
      
      // Check if fee is appropriate for venue type
      let warningMessage = '';
      if (venue.type === 'Restaurant' && fee > 0) {
        warningMessage = 'Warning: Entrance fees are unusual for restaurants';
      } else if (venue.type === 'Fast Food' && fee > 0) {
        warningMessage = 'Warning: Entrance fees are very unusual for fast food venues';
      } else if (fee > 20) {
        warningMessage = 'Warning: High entrance fees may discourage customers';
      }
      
      // Update venue settings
      const updatedSettings = {
        ...venue.settings,
        entranceFee: fee
      };
      
      await this.venueDAO.updateVenue(venueId, { settings: updatedSettings });
      
      return {
        success: true,
        venueId,
        fee,
        message: `Entrance fee set to €${fee.toFixed(2)}`,
        warning: warningMessage
      };
    } catch (error) {
      console.error(`Error setting entrance fee for venue ${venueId}:`, error);
      throw error;
    }
  }
}

module.exports = VenueService;