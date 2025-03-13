// Venue Manager - Handles venue creation, updates, and management

const VenueCreator = require('./venue/venueCreator');
const LayoutGenerator = require('./venue/layoutGenerator');
const VenueUpgrader = require('./venue/venueUpgrader');
const { VENUE_SIZES } = require('../config');

class VenueManager {
  constructor(game) {
    this.game = game;
    this.venueCreator = new VenueCreator(game);
    this.layoutGenerator = new LayoutGenerator();
    this.venueUpgrader = new VenueUpgrader(game);
  }
  
  createNewVenue(name, type, city) {
    return this.venueCreator.createNewVenue(name, type, city);
  }
  
  getVenue(venueId) {
    return this.game.state.player.venues.find(v => v.id === venueId);
  }
  
  getCurrentVenue() {
    return this.game.state.currentVenue;
  }
  
  setCurrentVenue(venueId) {
    const venue = this.getVenue(venueId);
    if (venue) {
      this.game.state.currentVenue = venue;
      return true;
    }
    return false;
  }
  
  updateVenue(venue) {
    // Check if the venue is open based on time
    const isOpeningHours = this.isVenueOpen(venue);
    
    if (isOpeningHours) {
      // Generate new customers during opening hours
      if (this.game.customerManager) {
        this.game.customerManager.generateCustomers(venue);
      }
    }
    
    // Update venue stats
    this.updateVenueStats(venue);
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
  
  updateVenueStats(venue) {
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
  
  // Delegate to VenueUpgrader
  upgradeVenueSize(venueId) {
    return this.venueUpgrader.upgradeVenueSize(venueId);
  }
  
  setVenueName(venueId, newName) {
    return this.venueUpgrader.setVenueName(venueId, newName);
  }
  
  setVenueHours(venueId, openingHour, closingHour) {
    return this.venueUpgrader.setVenueHours(venueId, openingHour, closingHour);
  }
  
  setMusicVolume(venueId, volume) {
    return this.venueUpgrader.setMusicVolume(venueId, volume);
  }
  
  setLightingLevel(venueId, level) {
    return this.venueUpgrader.setLightingLevel(venueId, level);
  }
  
  setEntranceFee(venueId, fee) {
    return this.venueUpgrader.setEntranceFee(venueId, fee);
  }
  
  cleanVenue(venueId) {
    return this.venueUpgrader.cleanVenue(venueId);
  }
  
  sellVenue(venueId) {
    return this.venueUpgrader.sellVenue(venueId);
  }
}

module.exports = VenueManager;