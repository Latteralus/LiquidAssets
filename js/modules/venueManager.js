// Venue Manager - Handles venue creation, updates, and management

const VenueCreator = require('./venue/venueCreator');
const LayoutGenerator = require('./venue/layoutGenerator');
const VenueUpgrader = require('./venue/venueUpgrader');
const dbAPI = require('../database/api');
const { VENUE_SIZES } = require('../config');

class VenueManager {
  constructor(game) {
    this.game = game;
    this.venueCreator = new VenueCreator(game);
    this.layoutGenerator = new LayoutGenerator();
    this.venueUpgrader = new VenueUpgrader(game);
    
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
        console.log("VenueManager: Using database storage");
      } else {
        console.log("VenueManager: Using in-memory storage");
      }
    } catch (error) {
      console.error("VenueManager: Database check failed", error);
      this.useDatabase = false;
    }
  }
  
  async createNewVenue(name, type, city) {
    try {
      if (this.useDatabase) {
        // Get player ID from game state
        const playerId = this.game.state.player.id;
        if (!playerId) {
          throw new Error("Cannot create venue: Player ID not available");
        }
        
        // Create venue using VenueService
        const venue = await dbAPI.venueService.createNewVenue({
          name,
          type,
          city,
          size: 'small',
          layout: this.layoutGenerator.generateVenueLayout(type, 'small'),
          settings: {
            openingHour: this.getDefaultOpeningHour(type),
            closingHour: this.getDefaultClosingHour(type),
            musicVolume: this.getDefaultMusicVolume(type),
            lightingLevel: this.getDefaultLightingLevel(type),
            entranceFee: 0,
            customerCapacity: VENUE_SIZES.small.capacity,
            decorationLevel: 1,
            cleaningSchedule: 'daily',
          },
          stats: {
            popularity: 10,
            cleanliness: 100,
            atmosphere: 50,
            serviceQuality: 50,
            totalCustomersServed: 0,
            customerSatisfaction: 50,
            peakHourCapacity: 0,
            lastHealthInspection: null,
            healthInspectionScore: 0
          },
          licences: {
            alcohol: type !== 'Fast Food',
            food: type === 'Restaurant' || type === 'Fast Food',
            music: type === 'Nightclub' || type === 'Bar',
            gambling: false
          }
        }, playerId);
        
        // Add to player's venues in memory for quick access
        if (!this.game.state.player.venues) {
          this.game.state.player.venues = [];
        }
        this.game.state.player.venues.push(venue);
        
        // Save current venue ID in settings
        await dbAPI.settings.setSetting('current_venue_id', venue.id, 'game');
        
        // Update game state
        this.game.state.currentVenue = venue;
        
        return venue;
      } else {
        // Fallback to using VenueCreator for in-memory venue creation
        return this.venueCreator.createNewVenue(name, type, city);
      }
    } catch (error) {
      console.error("Error creating venue:", error);
      window.logToConsole(`Failed to create venue: ${error.message}`, 'error');
      return null;
    }
  }
  
  async getVenue(venueId) {
    try {
      if (this.useDatabase) {
        // Get venue from database
        return await dbAPI.venue.getVenueById(venueId);
      } else {
        // Fallback to in-memory search
        return this.game.state.player.venues.find(v => v.id === venueId);
      }
    } catch (error) {
      console.error(`Error getting venue ${venueId}:`, error);
      return null;
    }
  }
  
  getCurrentVenue() {
    return this.game.state.currentVenue;
  }
  
  async setCurrentVenue(venueId) {
    try {
      const venue = await this.getVenue(venueId);
      if (venue) {
        this.game.state.currentVenue = venue;
        
        // Update database setting if using database
        if (this.useDatabase) {
          await dbAPI.settings.setSetting('current_venue_id', venueId, 'game');
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error setting current venue ${venueId}:`, error);
      return false;
    }
  }
  
  async updateVenue(venue) {
    // Check if the venue is open based on time
    const isOpeningHours = this.isVenueOpen(venue);
    
    if (isOpeningHours) {
      // Generate new customers during opening hours
      if (this.game.customerManager) {
        this.game.customerManager.generateCustomers(venue);
      }
    }
    
    // Update venue stats
    await this.updateVenueStats(venue);
    
    // If using database, save changes back to database periodically
    if (this.useDatabase && Math.random() < 0.05) { // 5% chance each update to reduce database load
      try {
        // Update venue stats in database
        await dbAPI.venue.updateVenue(venue.id, { 
          stats: venue.stats,
          settings: venue.settings
        });
      } catch (error) {
        console.error(`Error saving venue updates to database: ${error.message}`);
      }
    }
  }
  
  isVenueOpen(venue) {
    const currentHour = this.game.timeManager ? 
                        this.game.timeManager.getGameTime().hour : 12;
    
    // Handle venues that close after midnight
    if (venue.settings.closingHour < venue.settings.openingHour) {
      return currentHour >= venue.settings.openingHour || currentHour < venue.settings.closingHour;
    } else {
      return currentHour >= venue.settings.openingHour && currentHour < venue.settings.closingHour;
    }
  }
  
  async updateVenueStats(venue) {
    // Gradually reduce cleanliness based on customer count
    const customerCount = this.game.customerManager ? 
                         this.game.customerManager.getCurrentCustomerCount() : 0;
    
    // Cleanliness decreases faster with more customers
    const cleanlinessReduction = customerCount * 0.01;
    venue.stats.cleanliness = Math.max(0, venue.stats.cleanliness - cleanlinessReduction);
    
    // Service quality depends on staff-to-customer ratio
    const staffCount = venue.staff.length;
    const staffToCustomerRatio = staffCount / Math.max(1, customerCount);
    
    // Ideal ratio is about 1:5, adjust service quality accordingly
    if (staffToCustomerRatio >= 0.2) {
      // Good ratio - slowly improve service quality
      venue.stats.serviceQuality = Math.min(100, venue.stats.serviceQuality + 0.05);
    } else if (staffToCustomerRatio < 0.1) {
      // Poor ratio - quickly reduce service quality
      venue.stats.serviceQuality = Math.max(0, venue.stats.serviceQuality - 0.2);
    } else {
      // Medium ratio - slowly reduce service quality
      venue.stats.serviceQuality = Math.max(0, venue.stats.serviceQuality - 0.05);
    }
    
    // Atmosphere depends on music, lighting, cleanliness and customer density
    const musicFactor = venue.settings.musicVolume / 100;
    const lightingFactor = venue.settings.lightingLevel / 100;
    const cleanlinessFactor = venue.stats.cleanliness / 100;
    
    // Calculate customer density (ideal is around 70% capacity)
    const capacity = venue.settings.customerCapacity;
    const density = customerCount / capacity;
    let densityFactor;
    
    if (density <= 0.1) {
      // Too empty
      densityFactor = 0.3;
    } else if (density <= 0.4) {
      // A bit quiet
      densityFactor = 0.7;
    } else if (density <= 0.8) {
      // Ideal crowd
      densityFactor = 1.0;
    } else if (density <= 1.0) {
      // Getting crowded
      densityFactor = 0.9;
    } else {
      // Overcrowded
      densityFactor = 0.6;
    }
    
    // Calculate atmosphere as weighted average of factors
    const targetAtmosphere = (
      (musicFactor * 0.3) + 
      (lightingFactor * 0.2) + 
      (cleanlinessFactor * 0.2) + 
      (densityFactor * 0.3)
    ) * 100;
    
    // Atmosphere changes gradually
    if (targetAtmosphere > venue.stats.atmosphere) {
      venue.stats.atmosphere = Math.min(100, venue.stats.atmosphere + 0.1);
    } else if (targetAtmosphere < venue.stats.atmosphere) {
      venue.stats.atmosphere = Math.max(0, venue.stats.atmosphere - 0.1);
    }
    
    // Popularity gradually gravitates towards a combination of service, atmosphere and customer satisfaction
    const targetPopularity = (
      (venue.stats.serviceQuality * 0.4) +
      (venue.stats.atmosphere * 0.3) +
      (venue.stats.customerSatisfaction * 0.3)
    ) / 100 * 100;
    
    // Popularity changes very slowly
    if (targetPopularity > venue.stats.popularity) {
      venue.stats.popularity = Math.min(100, venue.stats.popularity + 0.02);
    } else if (targetPopularity < venue.stats.popularity) {
      venue.stats.popularity = Math.max(0, venue.stats.popularity - 0.02);
    }
  }
  
  // Default settings methods to match Game.js
  getDefaultOpeningHour(venueType) {
    switch(venueType) {
      case 'Restaurant': return 11; // Opens for lunch
      case 'Fast Food': return 10; // Early opening
      case 'Nightclub': return 20; // Evening opening
      case 'Bar': return 16; // Late afternoon
      default: return 10;
    }
  }
  
  getDefaultClosingHour(venueType) {
    switch(venueType) {
      case 'Restaurant': return 23; // Closes after dinner
      case 'Fast Food': return 22; // Earlier closing
      case 'Nightclub': return 4; // Very late closing (next day)
      case 'Bar': return 2; // Late closing (next day)
      default: return 22;
    }
  }
  
  getDefaultMusicVolume(venueType) {
    switch(venueType) {
      case 'Restaurant': return 30; // Quiet background music
      case 'Fast Food': return 40; // Moderate background music
      case 'Nightclub': return 80; // Loud music
      case 'Bar': return 60; // Moderate-loud music
      default: return 50;
    }
  }
  
  getDefaultLightingLevel(venueType) {
    switch(venueType) {
      case 'Restaurant': return 70; // Well-lit
      case 'Fast Food': return 90; // Very bright
      case 'Nightclub': return 30; // Dim lighting
      case 'Bar': return 50; // Moderate lighting
      default: return 60;
    }
  }
  
  // Delegate to VenueService/VenueUpgrader based on database availability
  async upgradeVenueSize(venueId) {
    try {
      if (this.useDatabase) {
        const venue = await this.getVenue(venueId);
        if (!venue) {
          throw new Error(`Venue with ID ${venueId} not found`);
        }
        
        let newSize;
        if (venue.size === 'small') {
          newSize = 'medium';
        } else if (venue.size === 'medium') {
          newSize = 'large';
        } else {
          throw new Error("This venue is already at maximum size.");
        }
        
        // Use VenueService for database upgrade
        const result = await dbAPI.venueService.upgradeVenueSize(venueId, newSize);
        
        if (result.success) {
          // Update in-memory venue
          const updatedVenue = await this.getVenue(venueId);
          
          // If this is the current venue, update game state
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = updatedVenue;
          }
          
          // Update venue in player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues[venueIndex] = updatedVenue;
          }
          
          window.logToConsole(result.message, 'success');
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory upgrade
        return this.venueUpgrader.upgradeVenueSize(venueId);
      }
    } catch (error) {
      console.error(`Error upgrading venue ${venueId}:`, error);
      window.logToConsole(`Failed to upgrade venue: ${error.message}`, 'error');
      return false;
    }
  }
  
  async setVenueName(venueId, newName) {
    try {
      if (this.useDatabase) {
        const result = await dbAPI.venueService.renameVenue(venueId, newName);
        
        if (result) {
          // Update in-memory venue
          const updatedVenue = await this.getVenue(venueId);
          
          // If this is the current venue, update game state
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = updatedVenue;
          }
          
          // Update venue in player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues[venueIndex] = updatedVenue;
          }
          
          window.logToConsole(`Venue renamed to "${newName}"`, 'success');
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory rename
        return this.venueUpgrader.setVenueName(venueId, newName);
      }
    } catch (error) {
      console.error(`Error renaming venue ${venueId}:`, error);
      window.logToConsole(`Failed to rename venue: ${error.message}`, 'error');
      return false;
    }
  }
  
  async setVenueHours(venueId, openingHour, closingHour) {
    try {
      if (this.useDatabase) {
        const result = await dbAPI.venueService.setVenueHours(venueId, openingHour, closingHour);
        
        if (result.success) {
          // Update in-memory venue
          const updatedVenue = await this.getVenue(venueId);
          
          // If this is the current venue, update game state
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = updatedVenue;
          }
          
          // Update venue in player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues[venueIndex] = updatedVenue;
          }
          
          window.logToConsole(result.message, 'success');
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory update
        return this.venueUpgrader.setVenueHours(venueId, openingHour, closingHour);
      }
    } catch (error) {
      console.error(`Error setting venue hours ${venueId}:`, error);
      window.logToConsole(`Failed to set venue hours: ${error.message}`, 'error');
      return false;
    }
  }
  
  async setMusicVolume(venueId, volume) {
    try {
      if (this.useDatabase) {
        const result = await dbAPI.venueService.setMusicVolume(venueId, volume);
        
        if (result.success) {
          // Update in-memory venue
          const updatedVenue = await this.getVenue(venueId);
          
          // If this is the current venue, update game state
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = updatedVenue;
          }
          
          // Update venue in player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues[venueIndex] = updatedVenue;
          }
          
          window.logToConsole(result.message, 'success');
          if (result.warning) {
            window.logToConsole(result.warning, 'warning');
          }
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory update
        return this.venueUpgrader.setMusicVolume(venueId, volume);
      }
    } catch (error) {
      console.error(`Error setting music volume for venue ${venueId}:`, error);
      window.logToConsole(`Failed to set music volume: ${error.message}`, 'error');
      return false;
    }
  }
  
  async setLightingLevel(venueId, level) {
    try {
      if (this.useDatabase) {
        const result = await dbAPI.venueService.setLightingLevel(venueId, level);
        
        if (result.success) {
          // Update in-memory venue
          const updatedVenue = await this.getVenue(venueId);
          
          // If this is the current venue, update game state
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = updatedVenue;
          }
          
          // Update venue in player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues[venueIndex] = updatedVenue;
          }
          
          window.logToConsole(result.message, 'success');
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory update
        return this.venueUpgrader.setLightingLevel(venueId, level);
      }
    } catch (error) {
      console.error(`Error setting lighting level for venue ${venueId}:`, error);
      window.logToConsole(`Failed to set lighting level: ${error.message}`, 'error');
      return false;
    }
  }
  
  async setEntranceFee(venueId, fee) {
    try {
      if (this.useDatabase) {
        const result = await dbAPI.venueService.setEntranceFee(venueId, fee);
        
        if (result.success) {
          // Update in-memory venue
          const updatedVenue = await this.getVenue(venueId);
          
          // If this is the current venue, update game state
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = updatedVenue;
          }
          
          // Update venue in player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues[venueIndex] = updatedVenue;
          }
          
          window.logToConsole(result.message, 'success');
          if (result.warning) {
            window.logToConsole(result.warning, 'warning');
          }
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory update
        return this.venueUpgrader.setEntranceFee(venueId, fee);
      }
    } catch (error) {
      console.error(`Error setting entrance fee for venue ${venueId}:`, error);
      window.logToConsole(`Failed to set entrance fee: ${error.message}`, 'error');
      return false;
    }
  }
  
  async cleanVenue(venueId) {
    try {
      if (this.useDatabase) {
        const result = await dbAPI.venueService.cleanVenue(venueId);
        
        if (result.success) {
          // Update in-memory venue
          const updatedVenue = await this.getVenue(venueId);
          
          // If this is the current venue, update game state
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = updatedVenue;
          }
          
          // Update venue in player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues[venueIndex] = updatedVenue;
          }
          
          // Update player cash if there was a cost
          if (result.cost > 0) {
            this.game.state.player.cash -= result.cost;
          }
          
          window.logToConsole(result.message, 'success');
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory cleaning
        return this.venueUpgrader.cleanVenue(venueId);
      }
    } catch (error) {
      console.error(`Error cleaning venue ${venueId}:`, error);
      window.logToConsole(`Failed to clean venue: ${error.message}`, 'error');
      return false;
    }
  }
  
  async sellVenue(venueId) {
    try {
      if (this.useDatabase) {
        const result = await dbAPI.venueService.sellVenue(venueId, this.game.state.player.id);
        
        if (result.success) {
          // Add sale amount to player's cash
          this.game.state.player.cash += result.saleValue;
          
          // Remove venue from player's venues list
          const venueIndex = this.game.state.player.venues.findIndex(v => v.id === venueId);
          if (venueIndex !== -1) {
            this.game.state.player.venues.splice(venueIndex, 1);
          }
          
          // If this was the current venue, set current venue to null or another venue
          if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
            this.game.state.currentVenue = this.game.state.player.venues.length > 0 ? 
                                          this.game.state.player.venues[0] : null;
            
            // Update database setting
            if (this.game.state.currentVenue) {
              await dbAPI.settings.setSetting('current_venue_id', this.game.state.currentVenue.id, 'game');
            } else {
              await dbAPI.settings.setSetting('current_venue_id', null, 'game');
            }
          }
          
          window.logToConsole(result.message, 'success');
          return true;
        }
        return false;
      } else {
        // Fallback to in-memory sell
        return this.venueUpgrader.sellVenue(venueId);
      }
    } catch (error) {
      console.error(`Error selling venue ${venueId}:`, error);
      window.logToConsole(`Failed to sell venue: ${error.message}`, 'error');
      return false;
    }
  }
  
  // VenueReport - new feature using database capabilities
  async getVenueReport(venueId) {
    try {
      if (this.useDatabase) {
        const report = await dbAPI.venueService.getVenueReport(venueId);
        return report;
      } else {
        // Basic report for in-memory mode
        const venue = await this.getVenue(venueId);
        if (!venue) return null;
        
        return {
          venue,
          staff: {
            count: venue.staff.length,
            totalWages: 0 // Would require staffManager integration
          },
          inventory: {
            summary: { totalValue: 0 }, // Would require inventoryManager integration
            lowStock: [],
            maintenance: []
          },
          finances: {
            summary: {
              totalRevenue: venue.finances.monthlyRevenue,
              totalExpense: venue.finances.monthlyExpenses,
              netIncome: venue.finances.monthlyRevenue - venue.finances.monthlyExpenses
            },
            trend: []
          },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Error generating venue report for ${venueId}:`, error);
      return null;
    }
  }
}

module.exports = VenueManager;