// Venue Creator - Handles venue creation and default settings
const { GAME_CONSTANTS, VENUE_SIZES } = require('../../config');
const LayoutGenerator = require('./layoutGenerator');

class VenueCreator {
  constructor(game) {
    this.game = game;
    this.layoutGenerator = new LayoutGenerator();
  }
  
  createNewVenue(name, type, city) {
    if (!GAME_CONSTANTS.ESTABLISHMENT_TYPES.includes(type)) {
      window.logToConsole(`Invalid venue type: ${type}`, 'error');
      return null;
    }
    
    if (!GAME_CONSTANTS.CITIES.includes(city)) {
      window.logToConsole(`Invalid city: ${city}`, 'error');
      return null;
    }
    
    const newVenue = {
      id: Date.now().toString(),
      name: name,
      type: type,
      city: city,
      size: 'small', // small, medium, large
      layout: this.layoutGenerator.generateVenueLayout(type, 'small'),
      staff: [],
      inventory: this.game.inventoryManager ? 
                this.game.inventoryManager.generateDefaultInventory(type) : {},
      finances: {
        dailyRevenue: 0,
        dailyExpenses: 0,
        weeklyRevenue: 0,
        weeklyExpenses: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        rentPerMonth: this.calculateRent('small', city),
        lastRentPayment: 0,
        utilityExpensePerDay: this.calculateDailyUtilities('small', type)
      },
      settings: {
        openingHour: this.getDefaultOpeningHour(type),
        closingHour: this.getDefaultClosingHour(type),
        musicVolume: this.getDefaultMusicVolume(type),
        lightingLevel: this.getDefaultLightingLevel(type),
        entranceFee: 0,
        customerCapacity: VENUE_SIZES.small.capacity,
        decorationLevel: 1, // 1-5 scale
        cleaningSchedule: 'daily', // daily, alternate, weekly
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
        alcohol: type !== 'Fast Food', // Default true except for fast food
        food: type === 'Restaurant' || type === 'Fast Food',
        music: type === 'Nightclub' || type === 'Bar',
        gambling: false
      }
    };
    
    // Add to player's venues
    this.game.state.player.venues.push(newVenue);
    
    // Register venue with city
    if (this.game.cityManager) {
      this.game.cityManager.addVenueToCity(city, newVenue);
    }
    
    // Schedule initial health inspection
    if (this.game.cityManager && this.game.eventManager) {
      const inspectionEvent = this.game.cityManager.scheduleHealthInspection(city, newVenue.id);
      if (inspectionEvent) {
        this.game.eventManager.scheduleEvent(inspectionEvent);
      }
    }
    
    return newVenue;
  }
  
  calculateRent(size, city) {
    const baseRent = VENUE_SIZES[size].baseRent;
    const cityMultiplier = this.game.cityManager ? 
                          this.game.cityManager.getCityRentMultiplier(city) : 1;
    return baseRent * cityMultiplier;
  }
  
  calculateDailyUtilities(size, type) {
    // Base costs depend on venue size and type
    const sizeMultiplier = { 'small': 1, 'medium': 1.8, 'large': 3 };
    const typeMultiplier = {
      'Bar': 1,
      'Restaurant': 1.5,
      'Nightclub': 2,
      'Fast Food': 1.2
    };
    
    // Calculate base utility cost
    return 20 * sizeMultiplier[size] * typeMultiplier[type];
  }
  
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
}

module.exports = VenueCreator;