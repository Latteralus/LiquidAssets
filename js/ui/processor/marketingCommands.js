// js/ui/processor/marketingCommands.js
// Handles marketing-related commands for advertising, promotions, and events

/**
 * MarketingCommands - Module for processing marketing-related commands
 * @param {Object} game - Reference to the game instance
 */
class MarketingCommands {
    constructor(game) {
      this.game = game;
    }
  
    /**
     * Process marketing-related commands
     * @param {string} command - The command to process
     * @param {Array} args - The command arguments
     * @returns {boolean} True if the command was successfully processed
     */
    processCommand(command, args) {
      switch (command) {
        case 'marketing':
        case 'viewmarketing':
          return this.viewMarketing();
        case 'advertise':
        case 'advertising':
          return this.advertise(args);
        case 'promotion':
        case 'createpromotion':
          return this.createPromotion(args);
        case 'event':
        case 'specialevent':
          return this.createEvent(args);
        case 'marketinganalysis':
          return this.showMarketingAnalysis();
        case 'marketingmenu':
          return this.showMarketingMenu();
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
     * View current marketing campaigns
     * @returns {boolean} Success status
     */
    viewMarketing() {
      if (!this.validateVenueExists()) return false;
  
      // Check if marketing manager exists
      if (!this.game.marketingManager) {
        this.game.notificationManager.info("Marketing functionality is not yet implemented.");
        return true;
      }
      
      const campaigns = this.game.marketingManager.getActiveCampaigns(this.game.state.currentVenue.id);
      const promotions = this.game.marketingManager.getActivePromotions(this.game.state.currentVenue.id);
      const events = this.game.marketingManager.getUpcomingEvents(this.game.state.currentVenue.id);
      
      this.game.notificationManager.info(`=== Marketing: ${this.game.state.currentVenue.name} ===`);
      
      // Show advertising campaigns
      this.game.notificationManager.info("--- Active Advertising Campaigns ---");
      if (!campaigns || campaigns.length === 0) {
        this.game.notificationManager.info("No active advertising campaigns.");
      } else {
        campaigns.forEach(campaign => {
          const daysLeft = campaign.endDate ? 
            this.calculateDaysRemaining(campaign.endDate) : 'Ongoing';
          
          this.game.notificationManager.info(`${campaign.name}: ${campaign.description} - Budget: €${campaign.budget.toFixed(2)} - Days left: ${daysLeft}`);
        });
      }
      
      // Show promotions
      this.game.notificationManager.info("\n--- Active Promotions ---");
      if (!promotions || promotions.length === 0) {
        this.game.notificationManager.info("No active promotions.");
      } else {
        promotions.forEach(promotion => {
          const daysLeft = promotion.endDate ? 
            this.calculateDaysRemaining(promotion.endDate) : 'Ongoing';
          
          this.game.notificationManager.info(`${promotion.name}: ${promotion.description} - Days left: ${daysLeft}`);
        });
      }
      
      // Show upcoming events
      this.game.notificationManager.info("\n--- Upcoming Special Events ---");
      if (!events || events.length === 0) {
        this.game.notificationManager.info("No upcoming special events.");
      } else {
        events.forEach(event => {
          const daysUntil = event.date ? 
            this.calculateDaysRemaining(event.date) : 'TBD';
          
          this.game.notificationManager.info(`${event.name}: ${event.description} - Budget: €${event.budget.toFixed(2)} - Days until: ${daysUntil}`);
        });
      }
      
      return true;
    }
  
    /**
     * Calculate days remaining between current game time and target date
     * @param {Object} targetDate - The target date
     * @returns {number|string} Days remaining or 'Today' if same day
     */
    calculateDaysRemaining(targetDate) {
      if (!this.game.timeManager) return 'Unknown';
      
      const currentTime = this.game.timeManager.getGameTime();
      
      // Calculate days difference
      let daysDiff = 0;
      
      // Check year difference
      if (targetDate.year > currentTime.year) {
        daysDiff += (targetDate.year - currentTime.year) * 365; // Simplified
      }
      
      // Check month difference (simplified, assuming 30 days per month)
      if (targetDate.month !== currentTime.month) {
        daysDiff += (targetDate.month - currentTime.month) * 30;
      }
      
      // Add day difference
      daysDiff += targetDate.day - currentTime.day;
      
      // Return result
      if (daysDiff === 0) return 'Today';
      if (daysDiff < 0) return 'Expired';
      return daysDiff;
    }
  
    /**
     * Create an advertising campaign
     * @param {Array} args - Command arguments: [type, budget]
     * @returns {boolean} Success status
     */
    advertise(args) {
      if (!this.validateVenueExists()) return false;
  
      // Check if marketing manager exists
      if (!this.game.marketingManager) {
        this.game.notificationManager.info("Marketing functionality is not yet implemented.");
        return true;
      }
      
      if (args.length < 2) {
        this.game.notificationManager.error("Usage: advertise <type> <budget>");
        this.game.notificationManager.info("Example: advertise local 500");
        this.game.notificationManager.info("Types: local, newspaper, radio, online, social");
        return false;
      }
      
      const type = args[0].toLowerCase();
      const budget = parseFloat(args[1]);
      
      // Validate type
      const validTypes = ['local', 'newspaper', 'radio', 'online', 'social'];
      if (!validTypes.includes(type)) {
        this.game.notificationManager.error(`Invalid advertising type. Choose from: ${validTypes.join(', ')}`);
        return false;
      }
      
      // Validate budget
      if (isNaN(budget) || budget <= 0) {
        this.game.notificationManager.error("Budget must be a positive number.");
        return false;
      }
      
      // Check if player has enough cash
      if (this.game.state.player.cash < budget) {
        this.game.notificationManager.error(`Not enough cash. You need €${budget.toFixed(2)}.`);
        return false;
      }
      
      try {
        const success = this.game.marketingManager.createAdvertisingCampaign(
          this.game.state.currentVenue.id,
          type,
          budget
        );
        
        if (success) {
          // Deduct cost
          this.game.state.player.cash -= budget;
          
          // Record transaction if financial manager exists
          if (this.game.financialManager) {
            this.game.financialManager.recordTransaction({
              type: 'expense',
              category: 'marketing',
              subcategory: 'advertising',
              amount: budget,
              date: this.game.timeManager ? { ...this.game.timeManager.getGameTime() } : null,
              venueId: this.game.state.currentVenue.id
            });
          }
          
          this.game.notificationManager.success(`Started a ${type} advertising campaign with a budget of €${budget.toFixed(2)}.`);
          
          // Impact description based on type and budget
          let impactDescription = '';
          const sizeTerm = budget < 300 ? 'small' : (budget < 1000 ? 'medium' : 'large');
          
          switch (type) {
            case 'local':
              impactDescription = `${sizeTerm} local campaign targeting nearby potential customers`;
              break;
            case 'newspaper':
              impactDescription = `${sizeTerm} newspaper advertisement reaching local readers`;
              break;
            case 'radio':
              impactDescription = `${sizeTerm} radio spot advertising your venue city-wide`;
              break;
            case 'online':
              impactDescription = `${sizeTerm} online campaign targeting local internet users`;
              break;
            case 'social':
              impactDescription = `${sizeTerm} social media campaign reaching targeted audiences`;
              break;
          }
          
          this.game.notificationManager.info(`Campaign impact: A ${impactDescription}.`);
          
          return true;
        } else {
          this.game.notificationManager.error("Failed to create advertising campaign.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error creating advertising campaign: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Create a special promotion
     * @param {Array} args - Command arguments: [type, details]
     * @returns {boolean} Success status
     */
    createPromotion(args) {
      if (!this.validateVenueExists()) return false;
  
      // Check if marketing manager exists
      if (!this.game.marketingManager) {
        this.game.notificationManager.info("Marketing functionality is not yet implemented.");
        return true;
      }
      
      if (args.length < 2) {
        this.game.notificationManager.error("Usage: promotion <type> <details>");
        this.game.notificationManager.info("Example: promotion happy_hour '50% off all drinks 5-7pm'");
        this.game.notificationManager.info("Types: happy_hour, discount, two_for_one, special_menu, loyalty");
        return false;
      }
      
      const type = args[0].toLowerCase();
      const details = args.slice(1).join(' ');
      
      // Validate type
      const validTypes = ['happy_hour', 'discount', 'two_for_one', 'special_menu', 'loyalty'];
      if (!validTypes.includes(type)) {
        this.game.notificationManager.error(`Invalid promotion type. Choose from: ${validTypes.join(', ')}`);
        return false;
      }
      
      try {
        const success = this.game.marketingManager.createPromotion(
          this.game.state.currentVenue.id,
          type,
          details
        );
        
        if (success) {
          this.game.notificationManager.success(`Created a new ${this.formatPromotionType(type)} promotion: ${details}`);
          
          // Provide some guidance based on promotion type
          switch (type) {
            case 'happy_hour':
              this.game.notificationManager.info("Tip: Happy hours work best during slow periods to increase customer traffic.");
              break;
            case 'discount':
              this.game.notificationManager.info("Tip: Ensure discounted items still generate profit. Monitor profitability closely.");
              break;
            case 'two_for_one':
              this.game.notificationManager.info("Tip: Two-for-one offers can increase sales volume but may reduce profit margins.");
              break;
            case 'special_menu':
              this.game.notificationManager.info("Tip: Special menus can showcase your best items and create a unique experience.");
              break;
            case 'loyalty':
              this.game.notificationManager.info("Tip: Loyalty programs help build a regular customer base over time.");
              break;
          }
          
          return true;
        } else {
          this.game.notificationManager.error("Failed to create promotion.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error creating promotion: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Format promotion type for display
     * @param {string} type - Promotion type
     * @returns {string} Formatted type
     */
    formatPromotionType(type) {
      return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  
    /**
     * Create a special event
     * @param {Array} args - Command arguments: [type, budget]
     * @returns {boolean} Success status
     */
    createEvent(args) {
      if (!this.validateVenueExists()) return false;
  
      // Check if marketing manager exists
      if (!this.game.marketingManager) {
        this.game.notificationManager.info("Marketing functionality is not yet implemented.");
        return true;
      }
      
      if (args.length < 2) {
        this.game.notificationManager.error("Usage: event <type> <budget>");
        this.game.notificationManager.info("Example: event live_music 1000");
        this.game.notificationManager.info("Types: live_music, theme_night, tasting, celebrity, competition");
        return false;
      }
      
      const type = args[0].toLowerCase();
      const budget = parseFloat(args[1]);
      
      // Validate type
      const validTypes = ['live_music', 'theme_night', 'tasting', 'celebrity', 'competition'];
      if (!validTypes.includes(type)) {
        this.game.notificationManager.error(`Invalid event type. Choose from: ${validTypes.join(', ')}`);
        return false;
      }
      
      // Validate budget
      if (isNaN(budget) || budget <= 0) {
        this.game.notificationManager.error("Budget must be a positive number.");
        return false;
      }
      
      // Check if player has enough cash
      if (this.game.state.player.cash < budget) {
        this.game.notificationManager.error(`Not enough cash. You need €${budget.toFixed(2)}.`);
        return false;
      }
      
      // Check if venue type is compatible with event type
      const venue = this.game.state.currentVenue;
      if (!this.isEventCompatibleWithVenue(type, venue.type)) {
        this.game.notificationManager.warning(`This type of event may not be well-suited for a ${venue.type}. Consider a different event type.`);
      }
      
      try {
        const success = this.game.marketingManager.createSpecialEvent(
          venue.id,
          type,
          budget
        );
        
        if (success) {
          // Deduct cost
          this.game.state.player.cash -= budget;
          
          // Record transaction if financial manager exists
          if (this.game.financialManager) {
            this.game.financialManager.recordTransaction({
              type: 'expense',
              category: 'marketing',
              subcategory: 'special_event',
              amount: budget,
              date: this.game.timeManager ? { ...this.game.timeManager.getGameTime() } : null,
              venueId: venue.id
            });
          }
          
          this.game.notificationManager.success(`Scheduled a ${this.formatPromotionType(type)} event with a budget of €${budget.toFixed(2)}.`);
          
          // Event quality description based on budget
          let qualityDescription = '';
          if (budget < 500) {
            qualityDescription = "modest";
          } else if (budget < 2000) {
            qualityDescription = "good quality";
          } else if (budget < 5000) {
            qualityDescription = "high quality";
          } else {
            qualityDescription = "premium";
          }
          
          // Impact description based on type and budget
          const eventDetails = this.getEventDetails(type, qualityDescription);
          this.game.notificationManager.info(`Event details: A ${qualityDescription} ${eventDetails}`);
          
          return true;
        } else {
          this.game.notificationManager.error("Failed to create special event.");
          return false;
        }
      } catch (error) {
        this.game.notificationManager.error(`Error creating special event: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Check if event type is compatible with venue type
     * @param {string} eventType - Type of event
     * @param {string} venueType - Type of venue
     * @returns {boolean} Whether event is compatible with venue
     */
    isEventCompatibleWithVenue(eventType, venueType) {
      // Compatibility matrix
      const compatibility = {
        'live_music': ['Bar', 'Nightclub', 'Restaurant'],
        'theme_night': ['Bar', 'Nightclub', 'Restaurant'],
        'tasting': ['Bar', 'Restaurant'],
        'celebrity': ['Nightclub', 'Restaurant'],
        'competition': ['Bar', 'Nightclub', 'Fast Food']
      };
      
      return compatibility[eventType] && compatibility[eventType].includes(venueType);
    }
  
    /**
     * Get detailed description for an event
     * @param {string} type - Event type
     * @param {string} quality - Quality description
     * @returns {string} Detailed event description
     */
    getEventDetails(type, quality) {
      switch (type) {
        case 'live_music':
          return `live music performance that will attract music lovers to your venue.`;
        case 'theme_night':
          return `themed night that will create a unique atmosphere and experience.`;
        case 'tasting':
          return `tasting event showcasing your finest offerings to discerning customers.`;
        case 'celebrity':
          return `celebrity appearance that will generate buzz and attract curious visitors.`;
        case 'competition':
          return `competition that will engage customers and create a fun, interactive atmosphere.`;
        default:
          return `special event that will attract customers to your venue.`;
      }
    }
  
    /**
     * Show marketing analysis
     * @returns {boolean} Success status
     */
    showMarketingAnalysis() {
      if (!this.validateVenueExists()) return false;
  
      // Check if marketing manager exists
      if (!this.game.marketingManager) {
        this.game.notificationManager.info("Marketing analysis is not yet implemented.");
        return true;
      }
      
      const analysis = this.game.marketingManager.getMarketingAnalysis(this.game.state.currentVenue.id);
      
      if (!analysis) {
        this.game.notificationManager.info("Not enough data for marketing analysis. Try running some campaigns first.");
        return true;
      }
      
      this.game.notificationManager.info(`=== Marketing Analysis: ${this.game.state.currentVenue.name} ===`);
      
      // Campaign effectiveness
      this.game.notificationManager.info("--- Campaign Effectiveness ---");
      if (analysis.campaigns && analysis.campaigns.length > 0) {
        analysis.campaigns.forEach(campaign => {
          this.game.notificationManager.info(`${campaign.type}: ROI: ${campaign.roi.toFixed(1)}% | Cost: €${campaign.cost.toFixed(2)} | Revenue impact: €${campaign.impact.toFixed(2)}`);
        });
      } else {
        this.game.notificationManager.info("No campaign data available.");
      }
      
      // Customer demographics
      this.game.notificationManager.info("\n--- Customer Demographics ---");
      if (analysis.demographics) {
        Object.entries(analysis.demographics).forEach(([type, percentage]) => {
          this.game.notificationManager.info(`${this.formatPromotionType(type)}: ${percentage.toFixed(1)}%`);
        });
      } else {
        this.game.notificationManager.info("No demographic data available.");
      }
      
      // Peak times
      this.game.notificationManager.info("\n--- Peak Times ---");
      if (analysis.peakTimes && analysis.peakTimes.length > 0) {
        analysis.peakTimes.forEach(peak => {
          this.game.notificationManager.info(`${peak.day} ${peak.hour}:00: ${peak.customers} customers on average`);
        });
      } else {
        this.game.notificationManager.info("No peak time data available.");
      }
      
      // Recommendations
      this.game.notificationManager.info("\n--- Recommendations ---");
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        analysis.recommendations.forEach(recommendation => {
          this.game.notificationManager.info(`• ${recommendation}`);
        });
      } else {
        this.game.notificationManager.info("No marketing recommendations available yet.");
      }
      
      return true;
    }
  
    /**
     * Show marketing menu
     * @returns {boolean} Success status
     */
    showMarketingMenu() {
      if (this.game.uiManager && this.game.uiManager.showMarketingMenu) {
        this.game.uiManager.showMarketingMenu();
        return true;
      } else {
        this.game.notificationManager.error("Menu functionality not available.");
        return false;
      }
    }
  }
  
  module.exports = MarketingCommands;