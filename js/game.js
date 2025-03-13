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

class Game {
  constructor() {
    this.initializeManagers();
    this.initializeGameState();
    this.setupEventListeners();
    
    // Set up global logging function that uses NotificationManager
    window.logToConsole = this.logToConsole.bind(this);
  }
  
  initializeManagers() {
    // Initialize all managers with references to the game instance
    this.timeManager = new TimeManager(this);
    this.cityManager = new CityManager(this);
    this.venueManager = new VenueManager(this);
    this.staffManager = new StaffManager(this);
    this.customerManager = new CustomerManager(this);
    this.financialManager = new FinancialManager(this);
    this.inventoryManager = new InventoryManager(this);
    this.eventManager = new EventManager(this);
    this.notificationManager = new NotificationManager(this);
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
      settings: {
        gamePaused: true,
        soundEnabled: true,
        textSpeed: 'normal'
      }
    };
    
    // Initialize cities
    this.cityManager.initializeCities();
    
    // Create initial venue
    const initialVenue = this.venueManager.createNewVenue('First Venture', 'Bar', 'London');
    this.state.currentVenue = initialVenue;
  }
  
  initializeUI() {
    // Initialize notification system
    if (this.notificationManager) {
      this.notificationManager.initialize('notification-container');
    }
    
    // Other UI initialization...
  }
  
  setupEventListeners() {
    // Set up event listeners for UI interactions
    // This will be handled by the UI manager
    this.uiManager.setupEventListeners();
  }
  
  startNewGame() {
    // Reset all state
    this.initializeGameState();
    
    // Initialize UI components
    this.initializeUI();
    
    // Show initial message
    this.notificationManager.info('Welcome to Liquid Assets! Your journey as a venue owner begins now.');
    this.notificationManager.financial(`You have €${this.state.player.cash.toFixed(2)} to start your business in ${this.state.currentCity}.`);
    this.notificationManager.system('Type \'help\' to see available commands.');
    
    // Start the game clock
    this.timeManager.startGameClock();
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
      settings: this.state.settings
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
    this.commandProcessor.processCommand(command);
  }
  
  updateGameState() {
    // This is called regularly by the game clock to update all game systems
    if (this.state.currentVenue) {
      this.venueManager.updateVenue(this.state.currentVenue);
      this.customerManager.updateCustomers();
      this.staffManager.updateStaff();
      this.eventManager.checkForRandomEvents();
    }
  }
  
  // Replace the global logToConsole with a method that uses NotificationManager
  logToConsole(message, type = '') {
    // Map legacy types to notification categories
    const typeMap = {
      '': 'INFO',
      'info': 'INFO',
      'success': 'SUCCESS',
      'warning': 'WARNING',
      'error': 'ERROR'
    };
    
    // Determine the appropriate category based on message content
    let category = typeMap[type] || 'INFO';
    
    // Try to categorize based on content if not specified
    if (category === 'INFO') {
      if (message.includes('customer') || message.includes('group of')) {
        category = 'CUSTOMER';
      } else if (message.includes('staff') || message.includes('hired') || message.includes('fired')) {
        category = 'STAFF';
      } else if (message.includes('€') || message.includes('cash') || message.includes('revenue') || message.includes('expense')) {
        category = 'FINANCIAL';
      } else if (message.includes('event') || message.includes('inspection')) {
        category = 'EVENT';
      }
    }
    
    // Use our notification system
    if (this.notificationManager) {
      this.notificationManager.addNotification(message, category);
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