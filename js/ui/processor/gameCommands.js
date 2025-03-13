// js/ui/processor/gameCommands.js
// Handles system-level game commands like saving, loading, speed control, etc.

/**
 * GameCommands - Module for processing system-level game commands
 * @param {Object} game - Reference to the game instance
 */
class GameCommands {
    constructor(game) {
      this.game = game;
    }
  
    /**
     * Process game-related commands
     * @param {string} command - The command to process
     * @param {Array} args - The command arguments
     * @returns {boolean} True if the command was successfully processed
     */
    processCommand(command, args) {
      switch (command) {
        case 'help':
          return this.showHelp(args);
        case 'save':
        case 'savegame':
          return this.saveGame();
        case 'load':
        case 'loadgame':
          return this.loadGame();
        case 'pause':
          return this.pauseGame();
        case 'resume':
        case 'unpause':
          return this.resumeGame();
        case 'speed':
        case 'setspeed':
          return this.setGameSpeed(args);
        case 'money':
        case 'cash':
          return this.showMoney();
        case 'time':
        case 'date':
          return this.showDateTime();
        case 'quit':
        case 'exit':
          return this.quitGame();
        case 'mainmenu':
          return this.showMainMenu();
        case 'clear':
          return this.clearConsole();
        default:
          return false;
      }
    }
  
    /**
     * Show help information
     * @param {Array} args - Command arguments: [category]
     * @returns {boolean} Success status
     */
    showHelp(args) {
      let category = 'general';
      if (args.length > 0) {
        category = args[0].toLowerCase();
      }
  
      switch (category) {
        case 'general':
          this.showGeneralHelp();
          break;
        case 'venue':
          this.showVenueHelp();
          break;
        case 'staff':
          this.showStaffHelp();
          break;
        case 'inventory':
          this.showInventoryHelp();
          break;
        case 'finance':
        case 'finances':
          this.showFinanceHelp();
          break;
        case 'marketing':
          this.showMarketingHelp();
          break;
        case 'system':
          this.showSystemHelp();
          break;
        default:
          this.game.notificationManager.error(`Unknown help category: ${category}`);
          this.game.notificationManager.info("Available help categories: general, venue, staff, inventory, finance, marketing, system");
          return false;
      }
      
      return true;
    }
  
    /**
     * Show general help information
     */
    showGeneralHelp() {
      this.game.notificationManager.info("=== Liquid Assets Help ===");
      this.game.notificationManager.info("Welcome to Liquid Assets, a business simulation game where you manage venues like bars, restaurants, and nightclubs.");
      
      this.game.notificationManager.info("--- Getting Started ---");
      this.game.notificationManager.info("1. Create a venue with 'createvenue <name> <type> <city>'");
      this.game.notificationManager.info("2. Hire staff with 'hire <staff_type>'");
      this.game.notificationManager.info("3. Manage inventory with 'viewinventory' and 'order'");
      this.game.notificationManager.info("4. Adjust prices with 'setprice'");
      this.game.notificationManager.info("5. Monitor your performance with 'venuestatus'");
      
      this.game.notificationManager.info("--- Help Categories ---");
      this.game.notificationManager.info("Type 'help <category>' for specific help:");
      this.game.notificationManager.info("- venue: Managing venues and their settings");
      this.game.notificationManager.info("- staff: Hiring and managing staff");
      this.game.notificationManager.info("- inventory: Stock and equipment management");
      this.game.notificationManager.info("- finance: Financial management and reporting");
      this.game.notificationManager.info("- marketing: Advertising and promotions");
      this.game.notificationManager.info("- system: Game system commands");
    }
  
    /**
     * Show venue help information
     */
    showVenueHelp() {
      this.game.notificationManager.info("=== Venue Commands ===");
      this.game.notificationManager.info("createvenue <name> <type> <city> - Create a new venue");
      this.game.notificationManager.info("viewvenues - List all your venues");
      this.game.notificationManager.info("selectvenue <number/name> - Select active venue");
      this.game.notificationManager.info("venuestatus - Show venue statistics");
      this.game.notificationManager.info("renamevenue <new_name> - Rename your venue");
      this.game.notificationManager.info("sethours <opening> <closing> - Set operating hours (24h format)");
      this.game.notificationManager.info("setmusic <volume> - Set music volume (0-100)");
      this.game.notificationManager.info("setlighting <level> - Set lighting level (0-100)");
      this.game.notificationManager.info("setfee <amount> - Set entrance fee");
      this.game.notificationManager.info("clean - Clean the venue");
      this.game.notificationManager.info("upgradevenue - Expand venue size");
      this.game.notificationManager.info("sellvenue - Sell the venue");
    }
  
    /**
     * Show staff help information
     */
    showStaffHelp() {
      this.game.notificationManager.info("=== Staff Commands ===");
      this.game.notificationManager.info("staffpool - View available staff candidates");
      this.game.notificationManager.info("hire <staff_type> - View candidates of specific type");
      this.game.notificationManager.info("hire <staff_id> - Hire a specific staff member");
      this.game.notificationManager.info("viewstaff - View your current staff");
      this.game.notificationManager.info("staffdetails <staff_id> - View detailed staff information");
      this.game.notificationManager.info("train <staff_id> <skill> - Train staff in a specific skill");
      this.game.notificationManager.info("adjustwage <staff_id> <amount> - Change staff wage");
      this.game.notificationManager.info("fire <staff_id> - Fire a staff member");
    }
  
    /**
     * Show inventory help information
     */
    showInventoryHelp() {
      this.game.notificationManager.info("=== Inventory Commands ===");
      this.game.notificationManager.info("viewinventory [category] - View inventory (drinks/food/equipment/all)");
      this.game.notificationManager.info("order <type> <item_name> <quantity> - Order inventory items");
      this.game.notificationManager.info("setprice <type> <item_name> <price> - Set item selling price");
      this.game.notificationManager.info("repair <equipment_name> - Repair damaged equipment");
      this.game.notificationManager.info("upgrade <equipment_name> - Upgrade equipment quality");
      this.game.notificationManager.info("checkstock - Check for low stock items");
    }
  
    /**
     * Show finance help information
     */
    showFinanceHelp() {
      this.game.notificationManager.info("=== Finance Commands ===");
      this.game.notificationManager.info("finances - View financial summary");
      this.game.notificationManager.info("dailyreport - View daily financial report");
      this.game.notificationManager.info("weeklyreport - View weekly financial report");
      this.game.notificationManager.info("monthlyreport - View monthly financial report");
      this.game.notificationManager.info("transactions - View recent transactions");
      this.game.notificationManager.info("expenses - View expense breakdown");
      this.game.notificationManager.info("revenue - View revenue breakdown");
      this.game.notificationManager.info("profitability - View item profitability report");
    }
  
    /**
     * Show marketing help information
     */
    showMarketingHelp() {
      this.game.notificationManager.info("=== Marketing Commands ===");
      this.game.notificationManager.info("marketing - View current marketing campaigns");
      this.game.notificationManager.info("advertise <type> <budget> - Launch advertising campaign");
      this.game.notificationManager.info("promotion <type> <details> - Create special promotion");
      this.game.notificationManager.info("event <type> <budget> - Host a special event");
      this.game.notificationManager.info("marketinganalysis - Analyze marketing effectiveness");
    }
  
    /**
     * Show system help information
     */
    showSystemHelp() {
      this.game.notificationManager.info("=== System Commands ===");
      this.game.notificationManager.info("save - Save game");
      this.game.notificationManager.info("load - Load game");
      this.game.notificationManager.info("pause - Pause game");
      this.game.notificationManager.info("resume - Resume game");
      this.game.notificationManager.info("speed <1-10> - Set game speed");
      this.game.notificationManager.info("money - Show current cash");
      this.game.notificationManager.info("time - Show current game date/time");
      this.game.notificationManager.info("clear - Clear console");
      this.game.notificationManager.info("mainmenu - Return to main menu");
      this.game.notificationManager.info("quit - Exit the game");
    }
  
    /**
     * Save the game
     * @returns {boolean} Success status
     */
    saveGame() {
      try {
        this.game.saveGame();
        this.game.notificationManager.success("Game saved successfully!");
        return true;
      } catch (error) {
        this.game.notificationManager.error(`Error saving game: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Load the game
     * @returns {boolean} Success status
     */
    loadGame() {
      try {
        const success = this.game.loadGame();
        
        if (success) {
          this.game.notificationManager.success("Game loaded successfully!");
        } else {
          this.game.notificationManager.error("No saved game found or loading failed.");
        }
        
        return success;
      } catch (error) {
        this.game.notificationManager.error(`Error loading game: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Pause the game
     * @returns {boolean} Success status
     */
    pauseGame() {
      try {
        if (this.game.state.settings.gamePaused) {
          this.game.notificationManager.info("Game is already paused.");
          return true;
        }
        
        if (window.api) {
          window.api.pauseGameLoop();
        }
        
        this.game.state.settings.gamePaused = true;
        this.game.notificationManager.info("Game paused.");
        return true;
      } catch (error) {
        this.game.notificationManager.error(`Error pausing game: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Resume the game
     * @returns {boolean} Success status
     */
    resumeGame() {
      try {
        if (!this.game.state.settings.gamePaused) {
          this.game.notificationManager.info("Game is already running.");
          return true;
        }
        
        if (window.api) {
          window.api.startGameLoop();
        }
        
        this.game.state.settings.gamePaused = false;
        this.game.notificationManager.info("Game resumed.");
        return true;
      } catch (error) {
        this.game.notificationManager.error(`Error resuming game: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Set game speed
     * @param {Array} args - Command arguments: [speed]
     * @returns {boolean} Success status
     */
    setGameSpeed(args) {
      if (args.length < 1) {
        this.game.notificationManager.error("Usage: speed <1-10>");
        this.game.notificationManager.info("Example: speed 5");
        return false;
      }
  
      const speed = parseInt(args[0], 10);
  
      // Validate speed
      if (isNaN(speed) || speed < 1 || speed > 10) {
        this.game.notificationManager.error("Speed must be between 1-10");
        return false;
      }
  
      try {
        if (window.api) {
          window.api.send('set-game-speed', speed);
        }
        
        this.game.notificationManager.success(`Game speed set to ${speed}x`);
        return true;
      } catch (error) {
        this.game.notificationManager.error(`Error setting game speed: ${error.message}`);
        return false;
      }
    }
  
    /**
     * Show current money
     * @returns {boolean} Success status
     */
    showMoney() {
      const cash = this.game.state.player.cash;
      this.game.notificationManager.info(`Current cash: €${cash.toFixed(2)}`);
      return true;
    }
  
    /**
     * Show current date and time
     * @returns {boolean} Success status
     */
    showDateTime() {
      if (!this.game.timeManager) {
        this.game.notificationManager.error("Time manager not initialized.");
        return false;
      }
      
      const gameTime = this.game.timeManager.getGameTime();
      const formattedDate = this.game.timeManager.getFormattedDate();
      const dayOfWeek = this.game.timeManager.getDayOfWeekName();
      
      this.game.notificationManager.info(`Current date: ${formattedDate}`);
      this.game.notificationManager.info(`Day of week: ${dayOfWeek}`);
      
      return true;
    }
  
    /**
     * Quit the game
     * @returns {boolean} Success status
     */
    quitGame() {
      // Confirm exit
      if (confirm("Are you sure you want to quit? Any unsaved progress will be lost.")) {
        if (confirm("Would you like to save before exiting?")) {
          this.saveGame();
        }
        
        if (window.api) {
          window.api.send('exit-confirmed', false);
        } else {
          window.close();
        }
      } else {
        this.game.notificationManager.info("Quit cancelled.");
      }
      
      return true;
    }
  
    /**
     * Show main menu
     * @returns {boolean} Success status
     */
    showMainMenu() {
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) {
        // Pause the game
        this.pauseGame();
        
        // Show the menu
        mainMenu.style.display = 'block';
        this.game.state.showingMenu = true;
        
        return true;
      }
      
      this.game.notificationManager.error("Menu not available.");
      return false;
    }
  
    /**
     * Clear the console
     * @returns {boolean} Success status
     */
    clearConsole() {
      const logContainer = document.getElementById('log-container');
      if (logContainer) {
        logContainer.innerHTML = '';
        return true;
      }
      
      return false;
    }
  }