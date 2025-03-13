// js/ui/processor/venueCommands.js
// Handles venue-related commands for managing venues and their settings

/**
 * VenueCommands - Module for processing venue-related commands
 * @param {Object} game - Reference to the game instance
 */
class VenueCommands {
    constructor(game) {
      this.game = game;
    }
  
    /**
     * Process venue-related commands
     * @param {string} command - The command to process
     * @param {Array} args - The command arguments
     * @returns {boolean} True if the command was successfully processed
     */
    processCommand(command, args) {
      switch (command) {
        case 'createvenue':
        case 'newvenue':
          return this.createVenue(args);
        case 'renamevenue':
          return this.renameVenue(args);
        case 'viewvenues':
        case 'venues':
          return this.viewVenues();
        case 'selectvenue':
        case 'changevenue':
          return this.selectVenue(args);
        case 'venuehours':
        case 'sethours':
          return this.setVenueHours(args);
        case 'musicvolume':
        case 'setmusic':
          return this.setMusicVolume(args);
        case 'lighting':
        case 'setlighting':
          return this.setLighting(args);
        case 'entrancefee':
        case 'setfee':
          return this.setEntranceFee(args);
        case 'clean':
        case 'cleanvenue':
          return this.cleanVenue();
        case 'upgradevenue':
        case 'expand':
          return this.upgradeVenue();
        case 'sellvenue':
          return this.sellVenue();
        case 'venuemenu':
          return this.showVenueMenu();
        case 'venuestatus':
        case 'status':
          return this.showVenueStatus();
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
     * Create a new venue
     * @param {Array} args - Command arguments: [name, type, city]
     * @returns {boolean} Success status
     */
    createVenue(args) {
      // Validate arguments
      if (args.length < 3) {
        this.game.notificationManager.error("Usage: createvenue <name> <type> <city>");
        this.game.notificationManager.info("Example: createvenue 'The Blue Lagoon' Bar London");
        this.game.notificationManager.info("Available types: Bar, Nightclub, Restaurant, Fast Food");
        this.game.notificationManager.info("Available cities: London, Berlin, Paris, Madrid, Rome");
        return false;
      }
  
      const name = args[0];
      const type = args[1];
      const city = args[2];
  
      // Validate venue type
      const validTypes = ['Bar', 'Nightclub', 'Restaurant', 'Fast Food'];
      if (!validTypes.includes(type)) {
        this.game.notificationManager.error(`Invalid venue type. Choose from: ${validTypes.join(', ')}`);
        return false;
      }
  
      // Validate city
      const validCities = ['London', 'Berlin', 'Paris', 'Madrid', 'Rome'];
      if (!validCities.includes(city)) {
        this.game.notificationManager.error(`Invalid city. Choose from: ${validCities.join(', ')}`);
        return false;
      }
  
      // Create venue
      try {
        const venue = this.game.venueManager.createNewVenue(name, type, city);
        if (venue) {
          this.game.state.currentVenue = venue;
          this.game.notificationManager.success(`Created new ${type} venue "${name}" in ${city}!`);
          return true;
        } else {
          this.game.notificationManager.error("Failed to create venue. Please try again.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error creating venue: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Rename the current venue
     * @param {Array} args - Command arguments: [new_name]
     * @returns {boolean} Success status
     */
    renameVenue(args) {
      if (!this.validateVenueExists()) return false;
  
      // Validate arguments
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: renamevenue <new_name>");
        return false;
      }
  
      const newName = args[0];
      
      // Update venue name
      try {
        const success = this.game.venueManager.setVenueName(this.game.state.currentVenue.id, newName);
        if (success) {
          this.game.notificationManager.success(`Venue renamed to "${newName}"`);
          return true;
        } else {
          this.game.notificationManager.error("Failed to rename venue");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error renaming venue: ${error.message}`);
        return false;
      }
    }
  
    /**
     * View all player's venues
     * @returns {boolean} Success status
     */
    viewVenues() {
      const venues = this.game.state.player.venues;
      
      if (venues.length === 0) {
        this.game.notificationManager.info("You don't own any venues yet. Use 'createvenue' to create one.");
        return true;
      }
  
      this.game.notificationManager.info("Your venues:");
      
      venues.forEach((venue, index) => {
        const isSelected = venue === this.game.state.currentVenue;
        const prefix = isSelected ? '→ ' : '  ';
        this.game.notificationManager.info(`${prefix}${index + 1}. ${venue.name} (${venue.type}) in ${venue.city}`);
      });
      
      this.game.notificationManager.info("Use 'selectvenue <number>' to change the active venue.");
      return true;
    }
  
    /**
     * Select a venue as the current venue
     * @param {Array} args - Command arguments: [venue_index or venue_name]
     * @returns {boolean} Success status
     */
    selectVenue(args) {
      const venues = this.game.state.player.venues;
      
      if (venues.length === 0) {
        this.game.notificationManager.error("You don't own any venues yet. Use 'createvenue' to create one.");
        return false;
      }
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: selectvenue <number> or selectvenue <name>");
        return false;
      }
  
      // Try to find by index
      const index = parseInt(args[0], 10) - 1;
      if (!isNaN(index) && index >= 0 && index < venues.length) {
        this.game.state.currentVenue = venues[index];
        this.game.notificationManager.success(`Selected venue: ${venues[index].name}`);
        return true;
      }
  
      // Try to find by name
      const name = args.join(' ');
      const venue = venues.find(v => v.name.toLowerCase() === name.toLowerCase());
      
      if (venue) {
        this.game.state.currentVenue = venue;
        this.game.notificationManager.success(`Selected venue: ${venue.name}`);
        return true;
      }
  
      this.game.notificationManager.error(`Venue not found: "${name}"`);
      return false;
    }
  
    /**
     * Set venue operating hours
     * @param {Array} args - Command arguments: [opening_hour, closing_hour]
     * @returns {boolean} Success status
     */
    setVenueHours(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 2) {
        this.game.notificationManager.error("Usage: sethours <opening_hour> <closing_hour>");
        this.game.notificationManager.info("Example: sethours 10 22 (for 10:00 AM to 10:00 PM)");
        this.game.notificationManager.info("Hours should be in 24-hour format (0-23)");
        return false;
      }
  
      const openingHour = parseInt(args[0], 10);
      const closingHour = parseInt(args[1], 10);
  
      // Validate hour format
      if (isNaN(openingHour) || isNaN(closingHour) || 
          openingHour < 0 || openingHour > 23 || 
          closingHour < 0 || closingHour > 23) {
        this.game.notificationManager.error("Hours must be in 24-hour format (0-23)");
        return false;
      }
  
      try {
        const success = this.game.venueManager.setVenueHours(
          this.game.state.currentVenue.id, 
          openingHour, 
          closingHour
        );
  
        if (success) {
          this.game.notificationManager.success(`Operating hours set to ${openingHour}:00-${closingHour}:00`);
          return true;
        } else {
          this.game.notificationManager.error("Failed to set venue hours. Check city regulations.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error setting venue hours: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Set venue music volume
     * @param {Array} args - Command arguments: [volume]
     * @returns {boolean} Success status
     */
    setMusicVolume(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: setmusic <volume>");
        this.game.notificationManager.info("Volume should be between 0-100");
        return false;
      }
  
      const volume = parseInt(args[0], 10);
  
      // Validate volume
      if (isNaN(volume) || volume < 0 || volume > 100) {
        this.game.notificationManager.error("Volume must be between 0-100");
        return false;
      }
  
      try {
        const success = this.game.venueManager.setMusicVolume(
          this.game.state.currentVenue.id, 
          volume
        );
  
        if (success) {
          this.game.notificationManager.success(`Music volume set to ${volume}%`);
          
          // Warn about noise regulations if volume is high
          if (volume > 70) {
            this.game.notificationManager.warning("High music volume may violate noise regulations in some cities.");
          }
          
          return true;
        } else {
          this.game.notificationManager.error("Failed to set music volume");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error setting music volume: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Set venue lighting level
     * @param {Array} args - Command arguments: [level]
     * @returns {boolean} Success status
     */
    setLighting(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: setlighting <level>");
        this.game.notificationManager.info("Lighting level should be between 0-100");
        return false;
      }
  
      const level = parseInt(args[0], 10);
  
      // Validate level
      if (isNaN(level) || level < 0 || level > 100) {
        this.game.notificationManager.error("Lighting level must be between 0-100");
        return false;
      }
  
      try {
        const success = this.game.venueManager.setLightingLevel(
          this.game.state.currentVenue.id, 
          level
        );
  
        if (success) {
          this.game.notificationManager.success(`Lighting level set to ${level}%`);
          
          // Provide feedback based on venue type
          const venue = this.game.state.currentVenue;
          if (venue.type === 'Nightclub' && level > 50) {
            this.game.notificationManager.info("Tip: Nightclubs typically benefit from lower lighting levels.");
          } else if (venue.type === 'Restaurant' && level < 40) {
            this.game.notificationManager.info("Tip: Restaurants typically benefit from higher lighting levels.");
          }
          
          return true;
        } else {
          this.game.notificationManager.error("Failed to set lighting level");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error setting lighting level: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Set venue entrance fee
     * @param {Array} args - Command arguments: [fee]
     * @returns {boolean} Success status
     */
    setEntranceFee(args) {
      if (!this.validateVenueExists()) return false;
  
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: setfee <amount>");
        this.game.notificationManager.info("Example: setfee 10 (for €10)");
        return false;
      }
  
      const fee = parseFloat(args[0]);
  
      // Validate fee
      if (isNaN(fee) || fee < 0) {
        this.game.notificationManager.error("Fee must be a non-negative number");
        return false;
      }
  
      try {
        const success = this.game.venueManager.setEntranceFee(
          this.game.state.currentVenue.id, 
          fee
        );
  
        if (success) {
          if (fee === 0) {
            this.game.notificationManager.success(`Entrance fee removed - entry is now free`);
          } else {
            this.game.notificationManager.success(`Entrance fee set to €${fee.toFixed(2)}`);
          }
          
          // Provide feedback based on venue type and fee amount
          const venue = this.game.state.currentVenue;
          if (venue.type === 'Restaurant' && fee > 0) {
            this.game.notificationManager.warning("Warning: Restaurants rarely charge entrance fees. This may discourage customers.");
          } else if (venue.type === 'Fast Food' && fee > 0) {
            this.game.notificationManager.warning("Warning: Fast food venues rarely charge entrance fees. This may discourage customers.");
          } else if (venue.type === 'Nightclub' && fee > 20) {
            this.game.notificationManager.warning("Warning: High entrance fees may discourage some customers.");
          }
          
          return true;
        } else {
          this.game.notificationManager.error("Failed to set entrance fee");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error setting entrance fee: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Clean the venue
     * @returns {boolean} Success status
     */
    cleanVenue() {
      if (!this.validateVenueExists()) return false;
  
      try {
        const success = this.game.venueManager.cleanVenue(this.game.state.currentVenue.id);
  
        if (success) {
          this.game.notificationManager.success("Venue has been cleaned!");
          return true;
        } else {
          this.game.notificationManager.error("Failed to clean venue. Make sure you have enough cash.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error cleaning venue: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Upgrade venue size
     * @returns {boolean} Success status
     */
    upgradeVenue() {
      if (!this.validateVenueExists()) return false;
  
      try {
        const success = this.game.venueManager.upgradeVenueSize(this.game.state.currentVenue.id);
  
        if (success) {
          this.game.notificationManager.success(`Venue upgraded to ${this.game.state.currentVenue.size} size!`);
          return true;
        } else {
          this.game.notificationManager.error("Failed to upgrade venue. Check if you have enough cash or if the venue is already at maximum size.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error upgrading venue: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Sell the current venue
     * @returns {boolean} Success status
     */
    sellVenue() {
      if (!this.validateVenueExists()) return false;
  
      const venueName = this.game.state.currentVenue.name;
      
      // Selling is handled by the venueManager which includes a confirmation dialog
      try {
        const success = this.game.venueManager.sellVenue(this.game.state.currentVenue.id);
  
        if (success) {
          this.game.notificationManager.success(`Sold venue: ${venueName}`);
          return true;
        } else {
          this.game.notificationManager.info("Venue sale cancelled");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error selling venue: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Show venue status
     * @returns {boolean} Success status
     */
    showVenueStatus() {
      if (!this.validateVenueExists()) return false;
  
      const venue = this.game.state.currentVenue;
      
      this.game.notificationManager.info(`=== ${venue.name} Status ===`);
      this.game.notificationManager.info(`Type: ${venue.type} | Size: ${venue.size} | City: ${venue.city}`);
      this.game.notificationManager.info(`Hours: ${venue.settings.openingHour}:00-${venue.settings.closingHour}:00`);
      this.game.notificationManager.info(`Entrance Fee: €${venue.settings.entranceFee.toFixed(2)}`);
      this.game.notificationManager.info(`Music: ${venue.settings.musicVolume}% | Lighting: ${venue.settings.lightingLevel}%`);
      this.game.notificationManager.info(`Customer Capacity: ${venue.settings.customerCapacity}`);
      
      this.game.notificationManager.info('--- Statistics ---');
      this.game.notificationManager.info(`Popularity: ${venue.stats.popularity.toFixed(1)}%`);
      this.game.notificationManager.info(`Cleanliness: ${venue.stats.cleanliness.toFixed(1)}%`);
      this.game.notificationManager.info(`Atmosphere: ${venue.stats.atmosphere.toFixed(1)}%`);
      this.game.notificationManager.info(`Service Quality: ${venue.stats.serviceQuality.toFixed(1)}%`);
      this.game.notificationManager.info(`Total Customers Served: ${venue.stats.totalCustomersServed}`);
      this.game.notificationManager.info(`Customer Satisfaction: ${venue.stats.customerSatisfaction.toFixed(1)}%`);
      
      this.game.notificationManager.info('--- Finances ---');
      this.game.notificationManager.info(`Daily Revenue: €${venue.finances.dailyRevenue.toFixed(2)}`);
      this.game.notificationManager.info(`Daily Expenses: €${venue.finances.dailyExpenses.toFixed(2)}`);
      this.game.notificationManager.info(`Monthly Rent: €${venue.finances.rentPerMonth.toFixed(2)}`);
      
      return true;
    }
  
    /**
     * Show venue management menu
     * @returns {boolean} Success status
     */
    showVenueMenu() {
      if (this.game.uiManager && this.game.uiManager.showVenueMenu) {
        this.game.uiManager.showVenueMenu();
        return true;
      } else {
        this.game.notificationManager.error("Menu functionality not available.");
        return false;
      }
    }
  }
  
  module.exports = VenueCommands;