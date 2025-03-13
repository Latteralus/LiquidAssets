// js/ui/commandProcessor.js
// Main command processor that delegates to specialized command modules

// Import specialized command processors
const VenueCommands = require('./processor/venueCommands');
const StaffCommands = require('./processor/staffCommands');
const InventoryCommands = require('./processor/inventoryCommands');
const FinanceCommands = require('./processor/financeCommands');
const MarketingCommands = require('./processor/marketingCommands');
const GameCommands = require('./processor/gameCommands');

/**
 * CommandProcessor - Main class for processing user commands
 * Delegates to specialized command processors based on command category
 */
class CommandProcessor {
  /**
   * Create a new CommandProcessor
   * @param {Object} game - Reference to the game instance
   */
  constructor(game) {
    this.game = game;
    
    // Initialize specialized command processors
    this.venueCommands = new VenueCommands(game);
    this.staffCommands = new StaffCommands(game);
    this.inventoryCommands = new InventoryCommands(game);
    this.financeCommands = new FinanceCommands(game);
    this.marketingCommands = new MarketingCommands(game);
    this.gameCommands = new GameCommands(game);
    
    // Command aliases to handle common misspellings and alternatives
    this.commandAliases = {
      // Game command aliases
      'quit': 'exit',
      'unpause': 'resume',
      'savegame': 'save',
      'loadgame': 'load',
      'speed': 'setspeed',
      'cash': 'money',
      'date': 'time',
      'menu': 'mainmenu',
      
      // Venue command aliases
      'newvenue': 'createvenue',
      'venues': 'viewvenues',
      'changevenue': 'selectvenue',
      'sethours': 'venuehours',
      'setmusic': 'musicvolume',
      'setlighting': 'lighting',
      'setfee': 'entrancefee',
      'clean': 'cleanvenue',
      'expand': 'upgradevenue',
      'status': 'venuestatus',
      
      // Staff command aliases
      'hirestaff': 'hire',
      'firestaff': 'fire',
      'viewstaff': 'staff',
      'viewapplicants': 'staffpool',
      'trainstaff': 'train',
      'adjustwage': 'wage',
      'staffinfo': 'staffdetails',
      
      // Inventory command aliases
      'viewinventory': 'inventory',
      'orderinventory': 'order',
      'updateprice': 'setprice',
      'repairequipment': 'repair',
      'upgradeequipment': 'upgrade',
      
      // Finance command aliases
      'financial': 'finances',
      'viewtransactions': 'transactions',
      'viewexpenses': 'expenses',
      'viewrevenue': 'revenue',
      'itemprofitability': 'profitability',
      'financialforecast': 'forecast',
      
      // Marketing command aliases
      'viewmarketing': 'marketing',
      'advertising': 'advertise',
      'createpromotion': 'promotion',
      'specialevent': 'event'
    };
  }

  /**
   * Process a command entered by the user
   * @param {string} rawCommand - The command text to process
   * @returns {boolean} Success status
   */
  processCommand(rawCommand) {
    // Clean input
    const cleanCommand = rawCommand.trim();
    
    // Skip if empty
    if (!cleanCommand) {
      return false;
    }
    
    try {
      // Parse command and arguments
      const { command, args } = this.parseCommand(cleanCommand);
      
      // Handle command based on category
      if (this.gameCommands.processCommand(command, args)) {
        return true;
      }
      
      if (this.venueCommands.processCommand(command, args)) {
        return true;
      }
      
      if (this.staffCommands.processCommand(command, args)) {
        return true;
      }
      
      if (this.inventoryCommands.processCommand(command, args)) {
        return true;
      }
      
      if (this.financeCommands.processCommand(command, args)) {
        return true;
      }
      
      if (this.marketingCommands.processCommand(command, args)) {
        return true;
      }
      
      // Command not recognized
      this.game.notificationManager.error(`Command not recognized: ${command}`);
      this.game.notificationManager.info("Type 'help' to see available commands.");
      return false;
    } catch (error) {
      this.game.notificationManager.error(`Error processing command: ${error.message}`);
      console.error("Command processing error:", error);
      return false;
    }
  }

  /**
   * Parse raw command into command and arguments
   * @param {string} rawCommand - The raw command text
   * @returns {Object} Object containing command and arguments array
   */
  parseCommand(rawCommand) {
    // Extract quoted arguments
    const args = [];
    const pattern = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    let match;
    
    let extractedCommand = '';
    let firstItem = true;
    
    while ((match = pattern.exec(rawCommand)) !== null) {
      // The matched group is either the full match or one of the captured groups
      const arg = match[1] || match[2] || match[0];
      
      if (firstItem) {
        extractedCommand = arg.toLowerCase();
        firstItem = false;
      } else {
        args.push(arg);
      }
    }
    
    // Apply command aliases
    const command = this.commandAliases[extractedCommand] || extractedCommand;
    
    return { command, args };
  }

  /**
   * Get suggestions for command autocompletion
   * @param {string} partial - Partial command text to autocomplete
   * @returns {Array} Array of matching command suggestions
   */
  getSuggestions(partial) {
    if (!partial) return [];
    
    const lowercasePartial = partial.toLowerCase();
    
    // Combine all available commands from each processor
    const allCommands = [
      ...this.getGameCommands(),
      ...this.getVenueCommands(),
      ...this.getStaffCommands(),
      ...this.getInventoryCommands(),
      ...this.getFinanceCommands(),
      ...this.getMarketingCommands()
    ];
    
    // Filter commands that start with the partial input
    return allCommands.filter(cmd => cmd.startsWith(lowercasePartial));
  }

  /**
   * Get list of game commands for autocompletion
   * @returns {Array} List of game commands
   */
  getGameCommands() {
    return [
      'help', 'save', 'load', 'pause', 'resume', 'setspeed',
      'money', 'time', 'quit', 'mainmenu', 'clear'
    ];
  }

  /**
   * Get list of venue commands for autocompletion
   * @returns {Array} List of venue commands
   */
  getVenueCommands() {
    return [
      'createvenue', 'viewvenues', 'selectvenue', 'venuestatus',
      'renamevenue', 'venuehours', 'musicvolume', 'lighting',
      'entrancefee', 'cleanvenue', 'upgradevenue', 'sellvenue',
      'venuemenu'
    ];
  }

  /**
   * Get list of staff commands for autocompletion
   * @returns {Array} List of staff commands
   */
  getStaffCommands() {
    return [
      'hire', 'fire', 'staff', 'staffpool', 'train',
      'wage', 'staffmenu', 'staffdetails'
    ];
  }

  /**
   * Get list of inventory commands for autocompletion
   * @returns {Array} List of inventory commands
   */
  getInventoryCommands() {
    return [
      'inventory', 'order', 'setprice', 'repair',
      'upgrade', 'inventorymenu', 'checkstock'
    ];
  }

  /**
   * Get list of finance commands for autocompletion
   * @returns {Array} List of finance commands
   */
  getFinanceCommands() {
    return [
      'finances', 'dailyreport', 'weeklyreport', 'monthlyreport',
      'yearlyreport', 'transactions', 'expenses', 'revenue',
      'profitability', 'forecast', 'financemenu'
    ];
  }

  /**
   * Get list of marketing commands for autocompletion
   * @returns {Array} List of marketing commands
   */
  getMarketingCommands() {
    return [
      'marketing', 'advertise', 'promotion', 'event',
      'marketinganalysis', 'marketingmenu'
    ];
  }
}

module.exports = CommandProcessor;