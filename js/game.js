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
const { DatabaseManager } = require('./database/databaseManager');

class Game {
  constructor() {
    // Initialize game state first
    this.initializeGameState();
    
    // Then initialize managers with reference to the game instance
    this.initializeManagers();
    
    // Set up event listeners and UI components
    this.setupEventListeners();
    
    // Set up global logging function that uses NotificationManager
    window.logToConsole = this.logToConsole.bind(this);
  }
  
  initializeManagers() {
    // First initialize managers that don't depend on others
    this.timeManager = new TimeManager(this);
    this.cityManager = new CityManager(this);
    this.notificationManager = new NotificationManager(this);
    
    // Then initialize the database manager (if available)
    try {
      this.dbManager = DatabaseManager.getInstance();
      this.dbManager.initialize()
        .then(() => {
          this.notificationManager.info("Database initialized successfully.");
        })
        .catch(error => {
          console.error("Database initialization error:", error);
          this.notificationManager.error("Database initialization failed. Falling back to file storage.");
        });
    } catch (error) {
      console.error("Database manager error:", error);
      this.notificationManager.warning("Database system not available. Using file storage.");
    }
    
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
  
  startNewGame() {
    // Reset game state
    this.initializeGameState();
    
    // Initialize UI components
    this.initializeUI();
    
    // Create initial venue
    this.uiManager.showVenueCreationMenu();
    
    // Start the game clock
    this.timeManager.startGameClock();
    
    // Hide main menu
    document.getElementById('main-menu').style.display = 'none';
  }
  
  createInitialVenue(name, type, city) {
    try {
      const initialVenue = this.venueManager.createNewVenue(name, type, city);
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
  
  saveGame() {
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
    
    // Save to storage (via preload)
    if (window.api) {
      window.api.saveGame(gameData)
        .then(result => {
          if (result.success) {
            this.notificationManager.success('Game saved successfully!');
          } else {
            this.notificationManager.error('Failed to save game.');
          }
        })
        .catch(err => {
          this.notificationManager.error('Error saving game: ' + err.message);
        });
    } else {
      this.notificationManager.error('Save functionality not available.');
    }
    
    return true;
  }
  
  async loadGame() {
    if (window.api) {
      try {
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
          
          // Update UI
          this.uiManager.updateDisplay();
          
          this.notificationManager.success('Game loaded successfully!');
          
          // Initialize UI components in case they weren't already
          this.initializeUI();
          
          // Hide main menu
          document.getElementById('main-menu').style.display = 'none';
          
          // Resume game clock if it was running
          if (!this.state.settings.gamePaused) {
            this.timeManager.startGameClock();
          }
          
          return true;
        } else {
          this.notificationManager.warning('No saved game found.');
          return false;
        }
      } catch (err) {
        this.notificationManager.error('Error loading game: ' + err.message);
        return false;
      }
    } else {
      this.notificationManager.error('Load functionality not available.');
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
  
  checkAutosave() {
    if (!this.state.settings.autosave) return;
    
    // Get current game time
    const gameTime = this.timeManager.getGameTime();
    
    // Autosave every in-game day at midnight
    if (gameTime.hour === 0 && gameTime.minute === 0) {
      this.saveGame();
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
        this.saveGame();
        // Give time for save to complete
        setTimeout(() => {
          if (window.api) {
            window.api.send('save-completed');
          } else {
            window.close();
          }
        }, 500);
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