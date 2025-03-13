// Venue Manager - Handles venue creation, updates, and management

const { GAME_CONSTANTS, VENUE_SIZES } = require('../config');

class VenueManager {
  constructor(game) {
    this.game = game;
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
      layout: this.generateDefaultLayout(type),
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
        lastRentPayment: 0
      },
      settings: {
        openingHour: 10,
        closingHour: 22,
        musicVolume: 50,
        lightingLevel: 50,
        entranceFee: 0,
        customerCapacity: VENUE_SIZES.small.capacity
      },
      stats: {
        popularity: 10,
        cleanliness: 100,
        atmosphere: 50,
        serviceQuality: 50,
        totalCustomersServed: 0,
        customerSatisfaction: 50
      }
    };
    
    // Add to player's venues
    this.game.state.player.venues.push(newVenue);
    
    // Register venue with city
    if (this.game.cityManager) {
      this.game.cityManager.addVenueToCity(city, newVenue);
    }
    
    return newVenue;
  }
  
  generateDefaultLayout(venueType) {
    // Basic layout with entrance, bar area, tables and restrooms
    const layout = {
      width: 20,
      height: 15,
      entrance: { x: 10, y: 0 },
      bar: { x: 3, y: 3, width: 5, height: 2 },
      tables: [],
      restrooms: { x: 18, y: 12, width: 2, height: 3 },
      kitchen: venueType === 'Restaurant' || venueType === 'Fast Food' 
        ? { x: 15, y: 3, width: 5, height: 4 } 
        : null,
      danceFloor: venueType === 'Nightclub' 
        ? { x: 8, y: 8, width: 6, height: 6 } 
        : null,
      decoration: []
    };
    
    // Add tables based on venue type
    if (venueType === 'Restaurant') {
      // More tables for restaurants
      for (let i = 0; i < 8; i++) {
        layout.tables.push({
          x: 5 + (i % 4) * 3,
          y: 8 + Math.floor(i / 4) * 3,
          size: 'medium',
          capacity: 4
        });
      }
    } else if (venueType === 'Bar') {
      // Fewer tables for bars
      for (let i = 0; i < 5; i++) {
        layout.tables.push({
          x: 5 + (i % 3) * 4,
          y: 8 + Math.floor(i / 3) * 3,
          size: 'small',
          capacity: 2
        });
      }
    } else if (venueType === 'Fast Food') {
      // Many small tables for fast food
      for (let i = 0; i < 10; i++) {
        layout.tables.push({
          x: 3 + (i % 5) * 3,
          y: 8 + Math.floor(i / 5) * 2,
          size: 'small',
          capacity: 2
        });
      }
    } else if (venueType === 'Nightclub') {
      // Few tables, more space for dance floor
      for (let i = 0; i < 4; i++) {
        layout.tables.push({
          x: 3 + (i % 2) * 12,
          y: 3 + Math.floor(i / 2) * 8,
          size: 'medium',
          capacity: 6
        });
      }
    }
    
    return layout;
  }
  
  calculateRent(size, city) {
    const baseRent = VENUE_SIZES[size].baseRent;
    const cityMultiplier = this.game.cityManager ? 
                          this.game.cityManager.getCityRentMultiplier(city) : 1;
    return baseRent * cityMultiplier;
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
  
  upgradeVenueSize(venueId) {
    const venue = this.getVenue(venueId);
    if (!venue) return false;
    
    const currentSize = venue.size;
    let newSize;
    let upgradeCost;
    
    if (currentSize === 'small') {
      newSize = 'medium';
      upgradeCost = VENUE_SIZES.small.upgradePrice;
    } else if (currentSize === 'medium') {
      newSize = 'large';
      upgradeCost = VENUE_SIZES.medium.upgradePrice;
    } else {
      window.logToConsole("This venue is already at maximum size.", 'error');
      return false;
    }
    
    // Check if player has enough cash
    if (this.game.state.player.cash < upgradeCost) {
      window.logToConsole(`Not enough cash for upgrade. Need €${upgradeCost}.`, 'error');
      return false;
    }
    
    // Apply the upgrade
    venue.size = newSize;
    venue.settings.customerCapacity = VENUE_SIZES[newSize].capacity;
    venue.finances.rentPerMonth = this.calculateRent(newSize, venue.city);
    
    // Deduct cost
    this.game.state.player.cash -= upgradeCost;
    
    // Update layout for new size (simplified - in a real game this would be more complex)
    venue.layout.width += 5;
    venue.layout.height += 5;
    
    window.logToConsole(`Upgraded ${venue.name} to ${newSize} size! New capacity: ${venue.settings.customerCapacity}`, 'success');
    return true;
  }
  
  setVenueName(venueId, newName) {
    const venue = this.getVenue(venueId);
    if (venue) {
      venue.name = newName;
      window.logToConsole(`Venue renamed to "${newName}"`, 'success');
      return true;
    }
    return false;
  }
  
  setVenueHours(venueId, openingHour, closingHour) {
    const venue = this.getVenue(venueId);
    if (!venue) return false;
    
    // Validate hours
    if (openingHour < 0 || openingHour > 23 || closingHour < 0 || closingHour > 23) {
      window.logToConsole("Hours must be between 0-23", 'error');
      return false;
    }
    
    // Check city regulations
    if (this.game.cityManager) {
      const isCompliant = this.game.cityManager.isWithinOpeningHoursRegulation(
        venue.city, openingHour, closingHour
      );
      
      if (!isCompliant) {
        window.logToConsole(`These hours violate ${venue.city} regulations.`, 'error');
        return false;
      }
    }
    
    // Set the hours
    venue.settings.openingHour = openingHour;
    venue.settings.closingHour = closingHour;
    
    window.logToConsole(`Operating hours set to ${openingHour}:00-${closingHour}:00`, 'success');
    return true;
  }
  
  setMusicVolume(venueId, volume) {
    const venue = this.getVenue(venueId);
    if (!venue) return false;
    
    // Validate volume (0-100)
    if (volume < 0 || volume > 100) {
      window.logToConsole("Volume must be between 0-100", 'error');
      return false;
    }
    
    // Check noise regulations
    if (this.game.cityManager && volume > 70) {
      const isCompliant = this.game.cityManager.checkNoiseCompliance(venue.city, volume);
      
      if (!isCompliant) {
        window.logToConsole(`Warning: This volume may violate ${venue.city} noise regulations.`, 'warning');
      }
    }
    
    // Set the volume
    venue.settings.musicVolume = volume;
    
    window.logToConsole(`Music volume set to ${volume}%`, 'success');
    return true;
  }
  
  setLightingLevel(venueId, level) {
    const venue = this.getVenue(venueId);
    if (!venue) return false;
    
    // Validate level (0-100)
    if (level < 0 || level > 100) {
      window.logToConsole("Lighting level must be between 0-100", 'error');
      return false;
    }
    
    // Set the lighting level
    venue.settings.lightingLevel = level;
    
    window.logToConsole(`Lighting level set to ${level}%`, 'success');
    return true;
  }
  
  setEntranceFee(venueId, fee) {
    const venue = this.getVenue(venueId);
    if (!venue) return false;
    
    // Validate fee (non-negative)
    if (fee < 0) {
      window.logToConsole("Entrance fee cannot be negative", 'error');
      return false;
    }
    
    // Warn about high fees
    if (fee > 20) {
      window.logToConsole("Warning: High entrance fees may discourage customers.", 'warning');
    }
    
    // Set the fee
    venue.settings.entranceFee = fee;
    
    window.logToConsole(`Entrance fee set to €${fee.toFixed(2)}`, 'success');
    return true;
  }
  
  cleanVenue(venueId) {
    const venue = this.getVenue(venueId);
    if (!venue) return false;
    
    // Check if player has a cleaner on staff
    const hasCleaner = venue.staff.some(staffId => {
      const staff = this.game.staffManager.getStaff(staffId);
      return staff && staff.type === 'cleaner';
    });
    
    let cleaningCost = 0;
    
    if (hasCleaner) {
      // With cleaner, restore cleanliness to 100% with no additional cost
      venue.stats.cleanliness = 100;
      window.logToConsole("Your cleaning staff has restored the venue to pristine condition.", 'success');
    } else {
      // Without cleaner, restore cleanliness to 90% with a cost
      cleaningCost = 50 * (1 - (venue.stats.cleanliness / 100));
      
      // Check if player has enough cash
      if (this.game.state.player.cash < cleaningCost) {
        window.logToConsole(`Not enough cash for cleaning. Need €${cleaningCost.toFixed(2)}.`, 'error');
        return false;
      }
      
      // Apply cleaning
      venue.stats.cleanliness = 90;
      this.game.state.player.cash -= cleaningCost;
      
      window.logToConsole(`Hired external cleaners for €${cleaningCost.toFixed(2)}. Venue is now clean.`, 'success');
    }
    
    return true;
  }
  
  sellVenue(venueId) {
    const venue = this.getVenue(venueId);
    if (!venue) return false;
    
    // Calculate sale value based on size, popularity, and equipment
    const sizeValue = VENUE_SIZES[venue.size].baseRent * 12; // 1 year of rent
    const popularityMultiplier = 0.5 + (venue.stats.popularity / 100);
    
    // Calculate equipment value (simplified)
    let equipmentValue = 0;
    if (venue.inventory && venue.inventory.equipment) {
      equipmentValue = venue.inventory.equipment.reduce((total, item) => {
        // Simple calculation based on quality and condition
        let baseValue = 0;
        if (item.quality === 'basic') baseValue = 100;
        else if (item.quality === 'standard') baseValue = 200;
        else if (item.quality === 'premium') baseValue = 400;
        
        return total + (baseValue * (item.condition / 100) * (item.quantity || 1));
      }, 0);
    }
    
    const totalValue = (sizeValue * popularityMultiplier) + equipmentValue;
    
    // Confirm sale
    if (confirm(`Are you sure you want to sell ${venue.name} for €${totalValue.toFixed(2)}?`)) {
      // Remove venue from city
      if (this.game.cityManager) {
        this.game.cityManager.removeVenueFromCity(venue.city, venue.id);
      }
      
      // Remove venue from player's venues
      const index = this.game.state.player.venues.findIndex(v => v.id === venueId);
      if (index !== -1) {
        this.game.state.player.venues.splice(index, 1);
      }
      
      // Add value to player's cash
      this.game.state.player.cash += totalValue;
      
      // If this was the current venue, set current venue to null or another venue
      if (this.game.state.currentVenue && this.game.state.currentVenue.id === venueId) {
        this.game.state.currentVenue = this.game.state.player.venues.length > 0 ? 
                                      this.game.state.player.venues[0] : null;
      }
      
      window.logToConsole(`Sold ${venue.name} for €${totalValue.toFixed(2)}!`, 'success');
      return true;
    }
    
    return false;
  }
}

module.exports = VenueManager;