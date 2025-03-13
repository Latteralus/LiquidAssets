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

class Game {
  constructor() {
    this.initializeManagers();
    this.initializeGameState();
    this.setupEventListeners();
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
  
  setupEventListeners() {
    // Set up event listeners for UI interactions
    // This will be handled by the UI manager
    this.uiManager.setupEventListeners();
  }
  
  startNewGame() {
    // Reset all state
    this.initializeGameState();
    
    // Show initial message
    window.logToConsole('Welcome to Liquid Assets! Your journey as a venue owner begins now.', 'info');
    window.logToConsole(`You have €${this.state.player.cash.toFixed(2)} to start your business in ${this.state.currentCity}.`, 'info');
    window.logToConsole('Type \'help\' to see available commands.', 'info');
    
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
            window.logToConsole('Game saved successfully!', 'success');
          } else {
            window.logToConsole('Failed to save game.', 'error');
          }
        })
        .catch(err => {
          window.logToConsole('Error saving game: ' + err.message, 'error');
        });
    } else {
      window.logToConsole('Save functionality not available.', 'error');
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
          
          window.logToConsole('Game loaded successfully!', 'success');
          
          // Resume game clock if it was running
          if (!this.state.settings.gamePaused) {
            this.timeManager.startGameClock();
          }
          
          return true;
        } else {
          window.logToConsole('No saved game found.', 'warning');
          return false;
        }
      } catch (err) {
        window.logToConsole('Error loading game: ' + err.message, 'error');
        return false;
      }
    } else {
      window.logToConsole('Load functionality not available.', 'error');
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
}

// Create global game instance when the module is imported
const game = new Game();

// Export the game instance
module.exports = game;