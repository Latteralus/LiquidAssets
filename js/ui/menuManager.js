// Menu Manager - Handles game menus and overlays

const MenuComponents = require('./menuComponents');

class MenuManager {
  constructor(game) {
    this.game = game;
    this.activeMenu = null;
    this.menuStack = [];
    this.menuElements = {};
    this.eventListeners = {};
    this.components = new MenuComponents(this);
  }
  
  initialize() {
    // Get references to menu containers
    this.menuElements = {
      mainMenu: document.getElementById('main-menu'),
      // Placeholders for other menus we'll create
      optionsMenu: null,
      staffMenu: null,
      inventoryMenu: null,
      marketingMenu: null,
      financesMenu: null,
      saveMenu: null,
      loadMenu: null,
      newGameMenu: null,
      helpMenu: null
    };
    
    // Create menus that don't exist in the HTML
    this.createMenus();
    
    // Initially hide all menus
    this.hideAllMenus();
  }
  
  createMenus() {
    // Create the options menu
    this.menuElements.optionsMenu = this.components.createMenu('options-menu', 'Options');
    const soundToggle = this.components.createToggle('sound-toggle', 'Sound', this.game.state.settings.soundEnabled);
    const musicSlider = this.components.createSlider('music-slider', 'Music Volume', 0, 100, this.game.state.settings.musicVolume || 50);
    const sfxSlider = this.components.createSlider('sfx-slider', 'SFX Volume', 0, 100, this.game.state.settings.sfxVolume || 50);
    const textSpeedSelector = this.components.createSelector('text-speed', 'Text Speed', ['slow', 'normal', 'fast'], this.game.state.settings.textSpeed || 'normal');
    const autosaveToggle = this.components.createToggle('autosave-toggle', 'Autosave', this.game.state.settings.autosave !== false);
    const backButton = this.components.createButton('options-back', 'Back');
    
    this.menuElements.optionsMenu.appendChild(soundToggle);
    this.menuElements.optionsMenu.appendChild(musicSlider);
    this.menuElements.optionsMenu.appendChild(sfxSlider);
    this.menuElements.optionsMenu.appendChild(textSpeedSelector);
    this.menuElements.optionsMenu.appendChild(autosaveToggle);
    this.menuElements.optionsMenu.appendChild(backButton);
    
    document.body.appendChild(this.menuElements.optionsMenu);
    
    // Create the staff menu
    this.menuElements.staffMenu = this.components.createMenu('staff-menu', 'Staff Management');
    const staffList = document.createElement('div');
    staffList.id = 'staff-menu-list';
    staffList.className = 'menu-list';
    const staffBackButton = this.components.createButton('staff-back', 'Back');
    
    this.menuElements.staffMenu.appendChild(staffList);
    this.menuElements.staffMenu.appendChild(staffBackButton);
    
    document.body.appendChild(this.menuElements.staffMenu);
    
    // Create the inventory menu
    this.menuElements.inventoryMenu = this.components.createMenu('inventory-menu', 'Inventory Management');
    const inventoryTabs = this.components.createTabs('inventory-tabs', ['Drinks', 'Food', 'Equipment']);
    const inventoryContent = document.createElement('div');
    inventoryContent.id = 'inventory-content';
    inventoryContent.className = 'menu-content';
    const inventoryBackButton = this.components.createButton('inventory-back', 'Back');
    
    this.menuElements.inventoryMenu.appendChild(inventoryTabs);
    this.menuElements.inventoryMenu.appendChild(inventoryContent);
    this.menuElements.inventoryMenu.appendChild(inventoryBackButton);
    
    document.body.appendChild(this.menuElements.inventoryMenu);
    
    // Additional menus would continue here
    // (shortened for brevity)
  }
  
  hideAllMenus() {
    Object.values(this.menuElements).forEach(menu => {
      if (menu) {
        menu.style.display = 'none';
      }
    });
    this.activeMenu = null;
  }
  
  showMenu(menuId) {
    // Hide all menus first
    this.hideAllMenus();
    
    // Show requested menu
    const menu = this.menuElements[menuId];
    if (menu) {
      menu.style.display = 'block';
      this.activeMenu = menuId;
      
      // Update menu content if needed
      this.updateMenuContent(menuId);
      
      // Pause the game if not already paused
      if (this.game.timeManager && !this.game.state.settings.gamePaused) {
        this.game.timeManager.pauseGameClock();
      }
      
      return true;
    }
    
    return false;
  }
  
  hideMenu() {
    if (this.activeMenu) {
      const menu = this.menuElements[this.activeMenu];
      if (menu) {
        menu.style.display = 'none';
      }
      this.activeMenu = null;
      
      // Resume game if previously running
      if (this.game.timeManager && !this.game.state.settings.gamePaused) {
        this.game.timeManager.resumeGameClock();
      }
    }
  }
  
  toggleMenu(menuId) {
    if (this.activeMenu === menuId) {
      this.hideMenu();
    } else {
      this.showMenu(menuId);
    }
  }
  
  handleMenuAction(actionId, value) {
    // Handle button/control actions
    switch(actionId) {
      // Main menu actions
      case 'new-game-btn':
        this.showMenu('newGameMenu');
        break;
      case 'load-game-btn':
        this.showMenu('loadMenu');
        this.updateLoadGameList();
        break;
      case 'options-btn':
        this.showMenu('optionsMenu');
        break;
      case 'exit-btn':
        window.close();
        break;
      
      // Options menu actions
      case 'sound-toggle':
        this.game.state.settings.soundEnabled = value;
        // Additional audio handling would go here
        break;
      case 'music-slider':
        this.game.state.settings.musicVolume = value;
        // Additional audio handling would go here
        break;
      case 'sfx-slider':
        this.game.state.settings.sfxVolume = value;
        // Additional audio handling would go here
        break;
      case 'text-speed':
        this.game.state.settings.textSpeed = value;
        break;
      case 'autosave-toggle':
        this.game.state.settings.autosave = value;
        break;
      case 'options-back':
        this.hideMenu();
        this.showMenu('mainMenu');
        break;
      
      // New game menu actions
      case 'start-game':
        this.startNewGame();
        break;
      case 'cancel-new-game':
        this.hideMenu();
        this.showMenu('mainMenu');
        break;
      
      // Back buttons
      case 'staff-back':
      case 'inventory-back':
      case 'marketing-back':
      case 'finances-back':
      case 'help-back':
      case 'load-back':
      case 'save-back':
        this.hideMenu();
        break;
      
      // Save game
      case 'save-confirm':
        this.saveGame();
        break;
      case 'save-cancel':
        this.hideMenu();
        break;
    }
  }
  
  updateMenuContent(menuId) {
    switch(menuId) {
      case 'staffMenu':
        this.updateStaffList();
        break;
      case 'inventoryMenu':
        // Initialize with the first tab content
        this.updateInventoryContent('drinks');
        break;
      case 'financesMenu':
        // Initialize with the first tab content
        this.updateFinancesContent('daily');
        break;
      case 'helpMenu':
        // Initialize with the first tab content
        this.updateHelpContent('commands');
        break;
    }
  }
  
  switchTab(tabContainerId, tabId) {
    // Get all tabs in this container
    const tabContainer = document.getElementById(tabContainerId);
    const tabs = tabContainer.querySelectorAll('.tab');
    
    // Remove active class from all tabs
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to selected tab
    const selectedTab = tabContainer.querySelector(`[data-tab="${tabId}"]`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    // Handle tab content updates
    if (tabContainerId === 'inventory-tabs') {
      this.updateInventoryContent(tabId);
    } else if (tabContainerId === 'finances-tabs') {
      this.updateFinancesContent(tabId);
    } else if (tabContainerId === 'help-tabs') {
      this.updateHelpContent(tabId);
    }
  }
  
  updateStaffList() {
    if (!this.game.state.currentVenue) return;
    
    const staffList = document.getElementById('staff-menu-list');
    if (!staffList) return;
    
    staffList.innerHTML = '';
    
    // Get staff for current venue
    const staff = this.game.staffManager.getStaffByVenue(this.game.state.currentVenue.id);
    
    if (staff.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'menu-item';
      emptyItem.textContent = 'No staff hired yet';
      staffList.appendChild(emptyItem);
      return;
    }
    
    // Create staff item for each staff member
    staff.forEach(member => {
      const item = document.createElement('div');
      item.className = 'staff-item';
      
      // Status indicator
      const statusIndicator = document.createElement('span');
      statusIndicator.className = 'status-indicator';
      statusIndicator.classList.add(member.isWorking ? 'working' : 'off-duty');
      item.appendChild(statusIndicator);
      
      // Staff info
      const info = document.createElement('div');
      info.className = 'staff-info';
      
      const name = document.createElement('h4');
      name.textContent = member.name;
      info.appendChild(name);
      
      const details = document.createElement('p');
      details.textContent = `${member.type} - €${member.wage}/week - Morale: ${member.morale.toFixed(1)}%`;
      info.appendChild(details);
      
      item.appendChild(info);
      
      // Staff actions
      const actions = document.createElement('div');
      actions.className = 'staff-actions';
      
      const viewButton = document.createElement('button');
      viewButton.textContent = 'View';
      viewButton.className = 'small-button';
      viewButton.addEventListener('click', () => {
        this.hideMenu();
        this.game.processCommand(`staff ${member.id}`);
      });
      
      const trainButton = document.createElement('button');
      trainButton.textContent = 'Train';
      trainButton.className = 'small-button';
      trainButton.addEventListener('click', () => {
        const skillKeys = Object.keys(member.skills);
        if (skillKeys.length > 0) {
          const skill = skillKeys[0]; // Just train the first skill for simplicity
          this.hideMenu();
          this.game.processCommand(`train ${member.id} ${skill}`);
        }
      });
      
      const fireButton = document.createElement('button');
      fireButton.textContent = 'Fire';
      fireButton.className = 'small-button danger';
      fireButton.addEventListener('click', () => {
        if (confirm(`Are you sure you want to fire ${member.name}?`)) {
          this.hideMenu();
          this.game.processCommand(`fire ${member.id}`);
        }
      });
      
      actions.appendChild(viewButton);
      actions.appendChild(trainButton);
      actions.appendChild(fireButton);
      
      item.appendChild(actions);
      
      staffList.appendChild(item);
    });
    
    // Add hire staff button at the bottom
    const hireButton = document.createElement('button');
    hireButton.textContent = 'Hire New Staff';
    hireButton.className = 'full-button';
    hireButton.addEventListener('click', () => {
      this.hideMenu();
      this.game.processCommand('hire');
    });
    
    staffList.appendChild(hireButton);
  }
  
  updateInventoryContent(tab) {
    if (!this.game.state.currentVenue) return;
    
    // Use the component to update inventory content
    this.components.updateInventoryContent(tab, this.game.state.currentVenue);
  }
  
  updateFinancesContent(tab) {
    if (!this.game.state.currentVenue || !this.game.financialManager) return;
    
    // Get financial reports
    const reports = this.game.financialManager.getFinancialReports(tab);
    
    // Use the component to update finances content
    this.components.updateFinancesContent(tab, reports);
  }
  
  updateHelpContent(tab) {
    const contentDiv = document.getElementById('help-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = '';
    
    switch(tab) {
      case 'commands':
        // Help content for commands (this would be the same as in the previous implementation)
        contentDiv.innerHTML = '<h3>Available Commands</h3>...';
        break;
      case 'game concepts':
        // Game concepts help content
        contentDiv.innerHTML = '<h3>Game Concepts</h3>...';
        break;
      case 'tips':
        // Tips content
        contentDiv.innerHTML = '<h3>Tips for Success</h3>...';
        break;
      case 'about':
        // About content
        contentDiv.innerHTML = '<h3>About Liquid Assets</h3>...';
        break;
    }
  }
  
  updateLoadGameList() {
    const loadList = document.getElementById('load-list');
    if (!loadList) return;
    
    loadList.innerHTML = '';
    
    // Get saved games from data store
    const savedGames = this.game.dataStore.getSavedGames();
    
    if (savedGames.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'menu-item';
      emptyItem.textContent = 'No saved games found';
      loadList.appendChild(emptyItem);
      return;
    }
    
    // Create item for each saved game
    savedGames.forEach(save => {
      const item = document.createElement('div');
      item.className = 'save-item';
      
      const info = document.createElement('div');
      info.className = 'save-info';
      
      const name = document.createElement('h4');
      name.textContent = save.name;
      info.appendChild(name);
      
      const details = document.createElement('p');
      details.textContent = `${save.date} - €${save.cash.toFixed(2)} - ${save.venues} venues`;
      info.appendChild(details);
      
      item.appendChild(info);
      
      // Actions
      const actions = document.createElement('div');
      actions.className = 'save-actions';
      
      const loadButton = document.createElement('button');
      loadButton.textContent = 'Load';
      loadButton.className = 'small-button';
      loadButton.addEventListener('click', () => {
        this.loadGame(save.id);
      });
      
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'small-button danger';
      deleteButton.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete save "${save.name}"?`)) {
          this.deleteGame(save.id);
          this.updateLoadGameList();
        }
      });
      
      actions.appendChild(loadButton);
      actions.appendChild(deleteButton);
      
      item.appendChild(actions);
      
      loadList.appendChild(item);
    });
  }
  
  startNewGame() {
    const nameInput = document.getElementById('owner-name');
    const citySelector = document.getElementById('starting-city');
    const venueTypeSelector = document.getElementById('venue-type');
    const venueNameInput = document.getElementById('venue-name');
    
    if (!nameInput || !citySelector || !venueTypeSelector || !venueNameInput) return;
    
    const playerName = nameInput.value.trim() || 'Player';
    const city = citySelector.value;
    const venueType = venueTypeSelector.value;
    const venueName = venueNameInput.value.trim() || 'My Venue';
    
    // Hide menu
    this.hideMenu();
    
    // Set player name
    this.game.state.player.name = playerName;
    
    // Set current city
    this.game.cityManager.setCurrentCity(city);
    
    // Create new venue
    const venue = this.game.venueManager.createNewVenue(venueName, venueType, city);
    
    // Set as current venue
    this.game.state.currentVenue = venue;
    
    // Start the game
    this.game.startNewGame();
  }
  
  saveGame() {
    const saveNameInput = document.getElementById('save-name');
    if (!saveNameInput) return;
    
    const saveName = saveNameInput.value.trim() || 'Unnamed Save';
    
    // Prepare game data to save
    const gameData = {
      player: this.game.state.player,
      gameTime: this.game.timeManager.getGameTime(),
      cities: this.game.cityManager.getCities(),
      currentCity: this.game.state.currentCity,
      currentVenue: this.game.state.currentVenue,
      staff: this.game.staffManager.getAllStaff(),
      settings: this.game.state.settings
    };
    
    // Save the game
    const success = this.game.dataStore.saveGame(saveName, gameData);
    
    if (success) {
      window.logToConsole('Game saved successfully!', 'success');
    } else {
      window.logToConsole('Failed to save game.', 'error');
    }
    
    // Hide the save menu
    this.hideMenu();
  }
  
  loadGame(saveId) {
    const gameData = this.game.dataStore.loadGame(saveId);
    
    if (gameData) {
      // Restore game state
      this.game.state.player = gameData.player;
      this.game.cityManager.setCities(gameData.cities);
      this.game.state.currentCity = gameData.currentCity;
      this.game.state.currentVenue = gameData.currentVenue;
      this.game.timeManager.setGameTime(gameData.gameTime);
      this.game.staffManager.setAllStaff(gameData.staff);
      this.game.state.settings = gameData.settings;
      
      window.logToConsole('Game loaded successfully!', 'success');
      
      // Hide the load menu
      this.hideMenu();
      
      // Resume game if it was running
      if (!gameData.settings.gamePaused) {
        this.game.timeManager.resumeGameClock();
      }
      
      return true;
    } else {
      window.logToConsole('Failed to load game.', 'error');
      return false;
    }
  }
  
  deleteGame(saveId) {
    const success = this.game.dataStore.deleteGame(saveId);
    
    if (success) {
      window.logToConsole('Save deleted.', 'success');
    } else {
      window.logToConsole('Failed to delete save.', 'error');
    }
  }
}

module.exports = MenuManager;