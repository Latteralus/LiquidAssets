// Main game class that ties together all modules

const { GAME_CONSTANTS } = require('./config');
const TimeManager = require('./modules/timeManager');
const VenueManager = require('./modules/venueManager');
const StaffManager = require('./modules/staffManager');
const CustomerManager = require('./modules/customerManager');
const FinancialManager = require('./modules/financialManager');
const InventoryManager = require('./modules/inventoryManager');
const EventManager = require('./modules/eventManager');
const CityManager = require('./modules/cityManager');
const UIManager = require('./ui/uiManager');
const CommandProcessor = require('./ui/commandProcessor');
const NotificationManager = require('./ui/notificationManager');
const dbAPI = require('./database/api');

class Game {
  constructor() {
    // First initialize the database system
    this.dbInitialized = false;
    
    // Initialize game state with default values
    this.initializeGameState();
    
    // Initialize managers with reference to the game instance
    this.initializeManagers();
    
    // Set up event listeners and UI components
    this.setupEventListeners();
    
    // Set up global logging function that uses NotificationManager
    window.logToConsole = this.logToConsole.bind(this);
  }
  
  async initializeDatabase() {
    try {
      // Initialize the database system
      await dbAPI.initialize();
      this.dbInitialized = true;
      
      if (this.notificationManager) {
        this.notificationManager.success("Database system initialized successfully.");
      } else {
        console.log("Database system initialized successfully.");
      }
      
      return true;
    } catch (error) {
      console.error("Database initialization error:", error);
      if (this.notificationManager) {
        this.notificationManager.error("Failed to initialize database. Using in-memory storage as fallback.");
      }
      return false;
    }
  }
  
  initializeManagers() {
    // First initialize managers that don't depend on others
    this.timeManager = new TimeManager(this);
    this.cityManager = new CityManager(this);
    this.notificationManager = new NotificationManager(this);
    
    // Start database initialization (async)
    this.initializeDatabase()
      .then(success => {
        if (success) {
          // When database is ready, sync in-memory state with database
          this.syncStateWithDatabase();
        }
      })
      .catch(error => {
        console.error("Database sync error:", error);
      });
    
    // Initialize core game managers
    this.venueManager = new VenueManager(this);
    this.staffManager = new StaffManager(this);
    this.customerManager = new CustomerManager(this);
    this.financialManager = new FinancialManager(this);
    this.inventoryManager = new InventoryManager(this);
    this.eventManager = new EventManager(this);
    
    // Initialize UI-related managers last
    this.uiManager = new UIManager(this);
    this.commandProcessor = new CommandProcessor(this);
  }
  
  initializeGameState() {
    // Initialize game state with the base values
    this.state = {
      player: {
        cash: GAME_CONSTANTS.STARTING_CASH,
        reputation: 0,
        venues: []
      },
      currentCity: 'London',
      currentVenue: null,
      customers: [],
      staff: [],
      settings: {
        gamePaused: true,
        soundEnabled: true,
        musicVolume: 50,
        sfxVolume: 50,
        textSpeed: 'normal',
        autosave: true
      }
    };
  }
  
  async syncStateWithDatabase() {
    if (!this.dbInitialized) return;
    
    try {
      // Get all settings from the database
      const settings = await dbAPI.settings.getSettingsByCategory('game');
      if (settings && Object.keys(settings).length > 0) {
        // Update in-memory settings
        this.state.settings = {
          ...this.state.settings,
          ...settings
        };
      }
      
      // If there's a current player, load their data
      const playerId = await dbAPI.settings.getSetting('current_player_id');
      if (playerId) {
        const player = await dbAPI.gameService.getPlayer(playerId);
        if (player) {
          this.state.player = player;
        }
      }
      
      // If there's a current venue, load it
      const currentVenueId = await dbAPI.settings.getSetting('current_venue_id');
      if (currentVenueId) {
        const venue = await dbAPI.venue.getVenueById(currentVenueId);
        if (venue) {
          this.state.currentVenue = venue;
          this.state.currentCity = venue.city;
        }
      }
      
      // Update UI to reflect loaded data
      if (this.uiManager) {
        this.uiManager.updateDisplay();
      }
      
      this.notificationManager.info("Game state synchronized with database.");
    } catch (error) {
      console.error("Error synchronizing state with database:", error);
      this.notificationManager.error("Failed to sync game state with database.");
    }
  }
  
  initializeUI() {
    // Initialize notification system
    if (this.notificationManager) {
      this.notificationManager.initialize('notification-container');
    }
    
    // Update initial UI state
    this.uiManager.updateDisplay();
    
    // Show welcome notifications
    this.notificationManager.info('Welcome to Liquid Assets! Your journey as a venue owner begins now.');
    this.notificationManager.info(`You have €${this.state.player.cash.toFixed(2)} to start your business in ${this.state.currentCity}.`);
    this.notificationManager.info("Type 'help' to see available commands.");
  }
  
  setupEventListeners() {
    // Set up game tick listener
    window.addEventListener('game-tick', this.onGameTick.bind(this));
    
    // Command input listener
    const commandInput = document.getElementById('command-input');
    if (commandInput) {
      commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const command = commandInput.value.trim();
          if (command) {
            this.processCommand(command);
            commandInput.value = '';
          }
        }
      });
      
      // Auto-suggestions for commands
      commandInput.addEventListener('input', () => {
        const input = commandInput.value.trim().toLowerCase();
        this.updateCommandSuggestions(input);
      });
    }
    
    // Button bar event listeners
    this.setupButtonListeners();
    
    // Initialize cities
    this.cityManager.initializeCities();
  }
  
  setupButtonListeners() {
    // Main menu buttons
    const newGameBtn = document.getElementById('new-game-btn');
    const loadGameBtn = document.getElementById('load-game-btn');
    const optionsBtn = document.getElementById('options-btn');
    const exitBtn = document.getElementById('exit-btn');
    
    if (newGameBtn) newGameBtn.addEventListener('click', () => this.startNewGame());
    if (loadGameBtn) loadGameBtn.addEventListener('click', () => this.loadGame());
    if (optionsBtn) optionsBtn.addEventListener('click', () => this.showOptions());
    if (exitBtn) exitBtn.addEventListener('click', () => this.quitGame());
    
    // Action buttons in the main interface
    const staffBtn = document.getElementById('staff-btn');
    const inventoryBtn = document.getElementById('inventory-btn');
    const financeBtn = document.getElementById('finance-btn');
    const marketingBtn = document.getElementById('marketing-btn');
    const venueBtn = document.getElementById('venue-btn');
    const helpBtn = document.getElementById('help-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    if (staffBtn) staffBtn.addEventListener('click', () => this.uiManager.showStaffMenu());
    if (inventoryBtn) inventoryBtn.addEventListener('click', () => this.uiManager.showInventoryMenu());
    if (financeBtn) financeBtn.addEventListener('click', () => this.uiManager.showFinanceMenu());
    if (marketingBtn) marketingBtn.addEventListener('click', () => this.uiManager.showMarketingMenu());
    if (venueBtn) venueBtn.addEventListener('click', () => this.uiManager.showVenueMenu());
    if (helpBtn) helpBtn.addEventListener('click', () => this.processCommand('help'));
    if (menuBtn) menuBtn.addEventListener('click', () => this.uiManager.showMainMenu());
    
    // Notification filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        if (type === 'clear') {
          this.notificationManager.clearNotifications();
        } else {
          this.notificationManager.setFilter(type);
          // Update active state
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }
  
  async startNewGame() {
    try {
      // Reset game state
      this.initializeGameState();
      
      // Wait for database initialization if it's still in progress
      if (!this.dbInitialized) {
        await this.initializeDatabase();
      }
      
      // Initialize UI components
      this.initializeUI();
      
      // Create new player in database if using database
      if (this.dbInitialized) {
        // Get player name - for demo, we'll use "Player"
        const playerName = "Player";
        
        // Create new player in database
        const newGameState = await dbAPI.gameService.initializeNewGame(playerName);
        
        if (newGameState) {
          // Update in-memory state with database state
          this.state.player = newGameState.player;
          this.state.settings = newGameState.settings;
          
          // Save the player ID in settings
          await dbAPI.settings.setSetting('current_player_id', this.state.player.id, 'game');
          
          this.notificationManager.success("New game initialized in database.");
        }
      }
      
      // Show venue creation menu
      this.uiManager.showVenueCreationMenu();
      
      // Start the game clock
      this.timeManager.startGameClock();
      
      // Hide main menu
      document.getElementById('main-menu').style.display = 'none';
    } catch (error) {
      console.error("Error starting new game:", error);
      this.notificationManager.error("Failed to start new game. Please try again.");
    }
  }
  
  async createInitialVenue(name, type, city) {
    try {
      let initialVenue;
      
      if (this.dbInitialized) {
        // Create venue in database
        initialVenue = await dbAPI.venueService.createNewVenue({
          name,
          type,
          city,
          size: 'small',
          settings: {
            openingHour: this.getDefaultOpeningHour(type),
            closingHour: this.getDefaultClosingHour(type),
            musicVolume: this.getDefaultMusicVolume(type),
            lightingLevel: this.getDefaultLightingLevel(type),
            entranceFee: 0,
            customerCapacity: GAME_CONSTANTS.VENUE_SIZES.small.capacity,
            decorationLevel: 1,
            cleaningSchedule: 'daily'
          },
          stats: {
            popularity: 10,
            cleanliness: 100,
            atmosphere: 50,
            serviceQuality: 50,
            totalCustomersServed: 0,
            customerSatisfaction: 50,
            peakHourCapacity: 0
          }
        }, this.state.player.id);
        
        // Save current venue ID in settings
        await dbAPI.settings.setSetting('current_venue_id', initialVenue.id, 'game');
      } else {
        // Fallback to in-memory venue creation
        initialVenue = this.venueManager.createNewVenue(name, type, city);
      }
      
      this.state.currentVenue = initialVenue;
      this.notificationManager.success(`Created your first venue: ${name}!`);
      
      // Update UI
      this.uiManager.updateDisplay();
      
      return true;
    } catch (error) {
      this.notificationManager.error(`Failed to create venue: ${error.message}`);
      return false;
    }
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
  
  async saveGame() {
    // Prepare game data to save
    const gameData = {
      player: this.state.player,
      gameTime: this.timeManager.getGameTime(),
      cities: this.cityManager.getCities(),
      currentCity: this.state.currentCity,
      currentVenue: this.state.currentVenue,
      staff: this.staffManager.getAllStaff(),
      settings: this.state.settings,
      lastSaveTime: new Date().toISOString()
    };
    
    try {
      if (this.dbInitialized) {
        // Save via database
        const saveResult = await dbAPI.gameService.saveGame(gameData, "Manual Save");
        
        if (saveResult.success) {
          this.notificationManager.success('Game saved successfully to database!');
        } else {
          throw new Error("Database save failed");
        }
      } else {
        // Fallback to storage API (via preload)
        if (window.api) {
          const result = await window.api.saveGame(gameData);
          
          if (result.success) {
            this.notificationManager.success('Game saved successfully!');
          } else {
            throw new Error(result.error || "Save failed");
          }
        } else {
          this.notificationManager.error('Save functionality not available.');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      this.notificationManager.error('Failed to save game: ' + error.message);
      return false;
    }
  }
  
  async loadGame() {
    try {
      if (this.dbInitialized) {
        // Get list of saved games
        const savedGames = await dbAPI.gameService.getSavedGames();
        
        if (savedGames.length === 0) {
          this.notificationManager.warning('No saved games found.');
          return false;
        }
        
        // For demonstration, load the most recent save
        const mostRecentSave = savedGames[0];
        const loadResult = await dbAPI.gameService.loadGame(mostRecentSave.id);
        
        if (loadResult.success) {
          // Update in-memory state with loaded data
          const { gameState } = loadResult;
          
          // Restore player data
          this.state.player = gameState.player;
          
          // Restore city data
          this.cityManager.setCities(gameState.cities);
          this.state.currentCity = gameState.currentCity;
          
          // Restore venue
          this.state.currentVenue = gameState.currentVenue;
          
          // Restore time
          this.timeManager.setGameTime(gameState.gameTime);
          
          // Restore staff
          this.staffManager.setAllStaff(gameState.staff);
          
          // Restore settings
          this.state.settings = gameState.settings;
          
          // Save current player and venue IDs to settings
          await dbAPI.settings.setSetting('current_player_id', this.state.player.id, 'game');
          if (this.state.currentVenue) {
            await dbAPI.settings.setSetting('current_venue_id', this.state.currentVenue.id, 'game');
          }
          
          this.notificationManager.success('Game loaded successfully from database!');
        } else {
          throw new Error("Failed to load game data");
        }
      } else {
        // Fallback to file storage via preload
        if (window.api) {
          const gameData = await window.api.loadGame();
          
          if (gameData) {
            // Restore player data
            this.state.player = gameData.player;
            
            // Restore city data
            this.cityManager.setCities(gameData.cities);
            this.state.currentCity = gameData.currentCity;
            
            // Restore venue
            this.state.currentVenue = gameData.currentVenue;
            
            // Restore time
            this.timeManager.setGameTime(gameData.gameTime);
            
            // Restore staff
            this.staffManager.setAllStaff(gameData.staff);
            
            // Restore settings
            this.state.settings = gameData.settings;
            
            this.notificationManager.success('Game loaded successfully from file!');
          } else {
            this.notificationManager.warning('No saved game found.');
            return false;
          }
        } else {
          this.notificationManager.error('Load functionality not available.');
          return false;
        }
      }
      
      // Update UI
      this.uiManager.updateDisplay();
      
      // Initialize UI components in case they weren't already
      this.initializeUI();
      
      // Hide main menu
      document.getElementById('main-menu').style.display = 'none';
      
      // Resume game clock if it was running
      if (!this.state.settings.gamePaused) {
        this.timeManager.startGameClock();
      }
      
      return true;
    } catch (err) {
      console.error('Error loading game:', err);
      this.notificationManager.error('Error loading game: ' + err.message);
      return false;
    }
  }
  
  processCommand(command) {
    // Forward command to processor
    if (this.commandProcessor) {
      return this.commandProcessor.processCommand(command);
    } else {
      this.notificationManager.error('Command processor not initialized.');
      return false;
    }
  }
  
  updateCommandSuggestions(input) {
    const suggestionsDiv = document.getElementById('suggestions');
    if (!suggestionsDiv || !this.commandProcessor) return;
    
    if (input.length === 0) {
      suggestionsDiv.style.display = 'none';
      return;
    }
    
    // Get suggestions from command processor
    const suggestions = this.commandProcessor.getSuggestions(input);
    
    if (suggestions.length > 0) {
      suggestionsDiv.textContent = suggestions.join(' | ');
      suggestionsDiv.style.display = 'block';
    } else {
      suggestionsDiv.style.display = 'none';
    }
  }
  
  onGameTick() {
    // Update game state based on current time
    this.updateGameState();
    
    // Check if autosave is enabled and it's time to save
    this.checkAutosave();
    
    // Update UI
    this.uiManager.updateDisplay();
  }
  
  updateGameState() {
    // Update venue state
    if (this.state.currentVenue) {
      this.venueManager.updateVenue(this.state.currentVenue);
      this.customerManager.updateCustomers();
      this.staffManager.updateStaff();
      this.eventManager.checkForRandomEvents();
      
      // Check inventory levels periodically
      if (Math.random() < 0.1) { // 10% chance each tick
        const lowStock = this.inventoryManager.checkInventoryLevels(this.state.currentVenue);
        if (lowStock && lowStock.length > 0) {
          this.notificationManager.warning(`You have ${lowStock.length} items with low stock. Use 'checkstock' for details.`);
        }
      }
    }
  }
  
  async checkAutosave() {
    if (!this.state.settings.autosave) return;
    
    // Get current game time
    const gameTime = this.timeManager.getGameTime();
    
    // Autosave every in-game day at midnight
    if (gameTime.hour === 0 && gameTime.minute === 0) {
      if (this.dbInitialized) {
        // Use database for autosave
        await this.saveGame();
      } else {
        // Fallback to file storage
        this.saveGame();
      }
    }
  }
  
  showOptions() {
    // To be implemented
    this.notificationManager.info('Options menu not yet implemented.');
  }
  
  quitGame() {
    // Confirm exit
    if (confirm("Are you sure you want to quit? Any unsaved progress will be lost.")) {
      if (confirm("Would you like to save before exiting?")) {
        this.saveGame().then(() => {
          // Give time for save to complete
          setTimeout(() => {
            if (window.api) {
              window.api.send('save-completed');
            } else {
              window.close();
            }
          }, 500);
        });
      } else {
        if (window.api) {
          window.api.send('exit-confirmed', false);
        } else {
          window.close();
        }
      }
    }
  }
  
  // Legacy log method for backward compatibility
  logToConsole(message, type = '') {
    // Use our notification system
    if (this.notificationManager) {
      // Map legacy types to notification categories
      const typeMap = {
        '': 'info',
        'info': 'info',
        'success': 'success',
        'warning': 'warning',
        'error': 'error'
      };
      
      // Determine the appropriate category based on message content
      let category = typeMap[type] || 'info';
      
      // Try to categorize based on content if not specified
      if (category === 'info') {
        if (message.includes('customer') || message.includes('group of')) {
          category = 'customer';
        } else if (message.includes('staff') || message.includes('hired') || message.includes('fired')) {
          category = 'staff';
        } else if (message.includes('€') || message.includes('cash') || message.includes('revenue') || message.includes('expense')) {
          category = 'financial';
        } else if (message.includes('event') || message.includes('inspection')) {
          category = 'event';
        }
      }
      
      // Use our notification system
      this.notificationManager.addNotification(message, category.toUpperCase());
    }
    
    // Fallback to legacy log output
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
      const logEntry = document.createElement('p');
      logEntry.textContent = message;
      logEntry.className = 'log-entry';
      
      if (type) {
        logEntry.classList.add(type);
      }
      
      logContainer.appendChild(logEntry);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }
}

// Create global game instance when the module is imported
const game = new Game();

// Export the game instance
module.exports = game;