// Venue Upgrader - Handles venue upgrades and modifications

const { VENUE_SIZES } = require('../../config');
const LayoutGenerator = require('./layoutGenerator');

class VenueUpgrader {
  constructor(game) {
    this.game = game;
    this.layoutGenerator = new LayoutGenerator();
  }
  
  upgradeVenueSize(venueId) {
    const venue = this.game.venueManager.getVenue(venueId);
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
    
    // Update all size-dependent properties
    this.updateVenueForNewSize(venue, newSize);
    
    // Deduct cost
    this.game.state.player.cash -= upgradeCost;
    
    window.logToConsole(`Upgraded ${venue.name} to ${newSize} size! New capacity: ${venue.settings.customerCapacity}`, 'success');
    return true;
  }
  
  updateVenueForNewSize(venue, newSize) {
    // Update capacity
    venue.settings.customerCapacity = VENUE_SIZES[newSize].capacity;
    
    // Update rent
    const cityMultiplier = this.game.cityManager ? 
                          this.game.cityManager.getCityRentMultiplier(venue.city) : 1;
    venue.finances.rentPerMonth = VENUE_SIZES[newSize].baseRent * cityMultiplier;
    
    // Update utility costs
    const typeMultiplier = {
      'Bar': 1,
      'Restaurant': 1.5,
      'Nightclub': 2,
      'Fast Food': 1.2
    };
    
    const sizeMultiplier = { 'small': 1, 'medium': 1.8, 'large': 3 };
    venue.finances.utilityExpensePerDay = 20 * sizeMultiplier[newSize] * typeMultiplier[venue.type];
    
    // Update layout for new size
    venue.layout = this.layoutGenerator.generateVenueLayout(venue.type, newSize);
    
    // Scale staff needs (no automatic hiring, just a notification)
    const recommendedStaff = this.calculateRecommendedStaff(venue);
    const currentStaffCount = venue.staff.length;
    
    if (currentStaffCount < recommendedStaff) {
      window.logToConsole(`Your venue has grown! Consider hiring more staff - recommended: ${recommendedStaff}`, 'info');
    }
  }
  
  calculateRecommendedStaff(venue) {
    // Base staff needs by venue type and size
    const baseStaff = {
      'Bar': { 'small': 3, 'medium': 6, 'large': 10 },
      'Restaurant': { 'small': 5, 'medium': 10, 'large': 18 },
      'Nightclub': { 'small': 4, 'medium': 8, 'large': 15 },
      'Fast Food': { 'small': 4, 'medium': 8, 'large': 14 }
    };
    
    return baseStaff[venue.type][venue.size] || 5;
  }
  
  setVenueName(venueId, newName) {
    const venue = this.game.venueManager.getVenue(venueId);
    if (venue) {
      venue.name = newName;
      window.logToConsole(`Venue renamed to "${newName}"`, 'success');
      return true;
    }
    return false;
  }
  
  setVenueHours(venueId, openingHour, closingHour) {
    const venue = this.game.venueManager.getVenue(venueId);
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
    const venue = this.game.venueManager.getVenue(venueId);
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
    
    // Update atmosphere immediately if it changed significantly
    const volumeChange = Math.abs(venue.settings.musicVolume - volume);
    if (volumeChange > 20) {
      this.recalculateAtmosphere(venue);
    }
    
    window.logToConsole(`Music volume set to ${volume}%`, 'success');
    return true;
  }
  
  setLightingLevel(venueId, level) {
    const venue = this.game.venueManager.getVenue(venueId);
    if (!venue) return false;
    
    // Validate level (0-100)
    if (level < 0 || level > 100) {
      window.logToConsole("Lighting level must be between 0-100", 'error');
      return false;
    }
    
    // Set the lighting level
    venue.settings.lightingLevel = level;
    
    // Update atmosphere immediately if it changed significantly
    const lightingChange = Math.abs(venue.settings.lightingLevel - level);
    if (lightingChange > 20) {
      this.recalculateAtmosphere(venue);
    }
    
    window.logToConsole(`Lighting level set to ${level}%`, 'success');
    return true;
  }
  
  recalculateAtmosphere(venue) {
    // Quick atmosphere recalculation based on music, lighting, and cleanliness
    const musicFactor = venue.settings.musicVolume / 100;
    const lightingFactor = venue.settings.lightingLevel / 100;
    const cleanlinessFactor = venue.stats.cleanliness / 100;
    
    // Calculate atmosphere (simple weighted average)
    const newAtmosphere = (
      (musicFactor * 0.3) + 
      (lightingFactor * 0.3) + 
      (cleanlinessFactor * 0.4)
    ) * 100;
    
    // Apply a partial update (don't completely reset atmosphere)
    venue.stats.atmosphere = (venue.stats.atmosphere * 0.7) + (newAtmosphere * 0.3);
  }
  
  setEntranceFee(venueId, fee) {
    const venue = this.game.venueManager.getVenue(venueId);
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
    const venue = this.game.venueManager.getVenue(venueId);
    if (!venue) return false;
    
    // Check if player has a cleaner on staff
    const hasCleaner = venue.staff.some(staffId => {
      const staff = this.game.staffManager ? this.game.staffManager.getStaff(staffId) : null;
      return staff && staff.type === 'cleaner';
    });
    
    let cleaningCost = 0;
    
    if (hasCleaner) {
      // With cleaner, restore cleanliness to 100% with no additional cost
      venue.stats.cleanliness = 100;
      window.logToConsole("Your cleaning staff has restored the venue to pristine condition.", 'success');
    } else {
      // Without cleaner, restore cleanliness to 90% with a cost that scales with venue size
      const sizeMultiplier = { 'small': 1, 'medium': 1.8, 'large': 3 };
      const baseCleaningCost = 50;
      
      cleaningCost = baseCleaningCost * sizeMultiplier[venue.size] * (1 - (venue.stats.cleanliness / 100));
      
      // Check if player has enough cash
      if (this.game.state.player.cash < cleaningCost) {
        window.logToConsole(`Not enough cash for cleaning. Need €${cleaningCost.toFixed(2)}.`, 'error');
        return false;
      }
      
      // Apply cleaning
      venue.stats.cleanliness = 90;
      this.game.state.player.cash -= cleaningCost;
      
      // Record the expense if financial manager exists
      if (this.game.financialManager) {
        this.game.financialManager.recordTransaction({
          type: 'expense',
          category: 'maintenance',
          subcategory: 'cleaning',
          amount: cleaningCost,
          date: this.game.timeManager ? { ...this.game.timeManager.getGameTime() } : null,
          venueId: venue.id
        });
      }
      
      window.logToConsole(`Hired external cleaners for €${cleaningCost.toFixed(2)}. Venue is now clean.`, 'success');
    }
    
    // Recalculate atmosphere since cleanliness affects it
    this.recalculateAtmosphere(venue);
    
    return true;
  }
  
  sellVenue(venueId) {
    const venue = this.game.venueManager.getVenue(venueId);
    if (!venue) return false;
    
    // Calculate sale value based on size, popularity, and equipment
    const sizeValue = VENUE_SIZES[venue.size].baseRent * 12; // 1 year of rent
    const popularityMultiplier = 0.5 + (venue.stats.popularity / 100);
    
    // Calculate equipment value (more detailed)
    let equipmentValue = 0;
    if (venue.inventory && venue.inventory.equipment) {
      equipmentValue = venue.inventory.equipment.reduce((total, item) => {
        // Calculate value based on quality, condition, and quantity
        let baseValue = 0;
        if (item.quality === 'basic') baseValue = 100;
        else if (item.quality === 'standard') baseValue = 200;
        else if (item.quality === 'premium') baseValue = 400;
        
        return total + (baseValue * (item.condition / 100) * (item.quantity || 1));
      }, 0);
    }
    
    // Add inventory value
    let inventoryValue = 0;
    const inventoryTypes = ['drinks', 'food'];
    
    inventoryTypes.forEach(type => {
      if (venue.inventory && venue.inventory[type]) {
        inventoryValue += venue.inventory[type].reduce((total, item) => {
          return total + (item.costPrice * (item.stock || 0));
        }, 0);
      }
    });
    
    const totalValue = Math.round((sizeValue * popularityMultiplier) + equipmentValue + inventoryValue);
    
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
      
      // Record the transaction if financial manager exists
      if (this.game.financialManager) {
        this.game.financialManager.recordTransaction({
          type: 'revenue',
          category: 'sale',
          subcategory: 'venue',
          amount: totalValue,
          date: this.game.timeManager ? { ...this.game.timeManager.getGameTime() } : null,
          venueId: venue.id
        });
      }
      
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

module.exports = VenueUpgrader;