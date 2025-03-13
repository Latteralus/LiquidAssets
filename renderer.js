// Renderer process

// Elements
const commandInput = document.getElementById('command-input');
const logContainer = document.getElementById('log-container');
const suggestionsDiv = document.getElementById('suggestions');
const mainMenu = document.getElementById('main-menu');
const newGameBtn = document.getElementById('new-game-btn');
const loadGameBtn = document.getElementById('load-game-btn');
const optionsBtn = document.getElementById('options-btn');
const exitBtn = document.getElementById('exit-btn');
const venueCanvas = document.getElementById('venue-canvas');

// Global game state
let gameState = {
  isRunning: false,
  showingMenu: true,
  suggestionsVisible: false
};

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
  // Show main menu
  mainMenu.style.display = 'block';
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize canvas
  initializeCanvas();
});

function setupEventListeners() {
  // Command input
  commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = commandInput.value.trim();
      if (command) {
        processCommand(command);
        commandInput.value = '';
      }
    }
  });
  
  // Command suggestions
  commandInput.addEventListener('input', () => {
    const input = commandInput.value.trim().toLowerCase();
    if (input.length > 0) {
      showSuggestions(input);
    } else {
      hideSuggestions();
    }
  });
  
  // Main menu buttons
  newGameBtn.addEventListener('click', () => {
    startNewGame();
  });
  
  loadGameBtn.addEventListener('click', async () => {
    await loadGame();
  });
  
  optionsBtn.addEventListener('click', () => {
    // Show options menu (to be implemented)
    logToConsole('Options not implemented yet', 'info');
  });
  
  exitBtn.addEventListener('click', () => {
    window.close();
  });
}

function initializeCanvas() {
  const ctx = venueCanvas.getContext('2d');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, venueCanvas.width, venueCanvas.height);
  
  // Draw a simple grid for now
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x <= venueCanvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, venueCanvas.height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y <= venueCanvas.height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(venueCanvas.width, y);
    ctx.stroke();
  }
}

function processCommand(command) {
  logToConsole(`> ${command}`, '');
  
  // Process command (this will be expanded in commands.js)
  if (game && game.processCommand) {
    game.processCommand(command);
  } else {
    // Fallback for testing
    const commandLower = command.toLowerCase();
    
    if (commandLower === 'help') {
      logToConsole('Available commands: help, status, hire, fire, set price, advertise, view staff, view finances', 'info');
    } else if (commandLower === 'status') {
      logToConsole('Business Status: Just starting out. No customers yet.', 'info');
    } else {
      logToConsole(`Command not recognized: ${command}`, 'error');
    }
  }
}

function showSuggestions(input) {
  // This will be expanded in commands.js
  const allCommands = [
    'help', 'status', 'hire bartender', 'hire waiter', 'hire cook',
    'fire staff', 'set drink price', 'set food price', 'advertise',
    'view staff', 'view finances', 'view customers', 'save game'
  ];
  
  const matchingCommands = allCommands.filter(cmd => cmd.startsWith(input));
  
  if (matchingCommands.length > 0) {
    suggestionsDiv.textContent = matchingCommands.join(' | ');
    suggestionsDiv.style.display = 'block';
    gameState.suggestionsVisible = true;
  } else {
    hideSuggestions();
  }
}

function hideSuggestions() {
  suggestionsDiv.style.display = 'none';
  gameState.suggestionsVisible = false;
}

function logToConsole(message, type = '') {
  const logEntry = document.createElement('p');
  logEntry.textContent = message;
  logEntry.className = 'log-entry';
  
  if (type) {
    logEntry.classList.add(type);
  }
  
  logContainer.appendChild(logEntry);
  
  // Auto-scroll to the bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

function startNewGame() {
  // Hide menu
  mainMenu.style.display = 'none';
  gameState.showingMenu = false;
  
  // Initialize game
  if (typeof initGame === 'function') {
    initGame();
  } else {
    // Fallback for testing
    logToConsole('Welcome to Liquid Assets! Your journey as a venue owner begins now.', 'info');
    logToConsole('You have €10,000 to start your business in London.', 'info');
    logToConsole('Type \'help\' to see available commands.', 'info');
  }
  
  // Focus on command input
  commandInput.focus();
  
  // Start game loop
  gameState.isRunning = true;
  if (window.api) {
    window.api.startGameLoop();
  }
}

async function loadGame() {
  if (window.api) {
    const savedGame = await window.api.loadGame();
    
    if (savedGame) {
      // Hide menu
      mainMenu.style.display = 'none';
      gameState.showingMenu = false;
      
      // Load game data
      if (typeof loadGameState === 'function') {
        loadGameState(savedGame);
      } else {
        // Fallback for testing
        logToConsole('Game loaded successfully!', 'success');
      }
      
      // Focus on command input
      commandInput.focus();
      
      // Start game loop
      gameState.isRunning = true;
      window.api.startGameLoop();
    } else {
      // No saved game found
      logToConsole('No saved game found.', 'warning');
    }
  } else {
    logToConsole('Save/Load functionality not available.', 'error');
  }
}

// Make functions available globally
window.logToConsole = logToConsole;