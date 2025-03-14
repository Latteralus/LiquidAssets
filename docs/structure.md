I'll update the structure.md file to reflect all the utility files:

```markdown
# docs/structure.md

liquidassets/
├── main.js                # Entry point and main process for Electron application
├── preload.js             # Preload script for IPC communications
├── index.html             # Main HTML file for the UI
├── style.css              # Styling for the application
├── renderer.js            # Renderer process script
├── assets/
│   ├── icons/             # Application icons
│   │   └── icon.png       # Main application icon
│   ├── images/            # Game images and assets
│   └── sounds/            # Sound effects and music
├── docs/
│   ├── plan.md            # Game design document
│   ├── structure.md       # This file - file structure reference
│   ├── dbplan.md          # Database implementation plan
│   └── todo.md            # Current task list and project status
└── js/
    ├── game.js            # Main game logic and state management
    ├── config.js          # Game configuration and constants
    ├── modules/           # Game mechanics modules
    │   ├── time.js                # Centralized time management system
    │   ├── names.js               # Main name generation coordinator
    │   │   ├── names/             # Name-specific modules
    │   │   │   ├── nameList.js    # Person name lists (first/last names)
    │   │   │   ├── venueList.js   # Venue name formats and famous venues
    │   │   │   ├── drinkList.js   # Drink names and formats
    │   │   │   ├── foodList.js    # Food names and cuisines
    │   │   │   └── miscList.js    # Misc name parts (adjectives, nouns, etc.)
    │   ├── timeManager.js         # Adapter for time.js integration (coordinates time events)
    │   ├── venueManager.js        # Manages venue operations
    │   ├── venue/                 # Venue-specific modules
    │   │   ├── venueCreator.js    # Handles venue creation
    │   │   ├── layoutGenerator.js # Generates venue layouts
    │   │   └── venueUpgrader.js   # Handles venue upgrades and modifications
    │   ├── staffManager.js        # Manages staff members
    │   ├── staff/                 # Staff-specific modules
    │   │   ├── staffGenerator.js  # Staff generation
    │   │   ├── staffOperations.js # Staff CRUD operations
    │   │   └── staffBehavior.js   # Staff morale and behavior
    │   ├── customerManager.js     # Handles customer interactions
    │   ├── customer/              # Customer-specific modules
    │   │   ├── customerBehavior.js   # Customer behavior logic
    │   │   ├── customerGenerator.js  # Creates new customers
    │   │   ├── customerOrders.js     # Manages customer orders
    │   │   └── customerSatisfaction.js # Handles customer satisfaction
    │   ├── financialManager.js    # Main financial management
    │   ├── finances/              # Finance-specific modules
    │   │   ├── expenseManager.js    # Handles expenses
    │   │   ├── revenueManager.js    # Manages revenue
    │   │   ├── transactionManager.js # Tracks transactions
    │   │   └── reportingManager.js  # Generates financial reports
    │   ├── inventoryManager.js    # Manages venue inventory
    │   ├── inventory/             # Inventory-specific modules
    │   │   ├── inventoryGenerator.js # Default inventory creation
    │   │   └── inventoryOperations.js # CRUD operations
    │   ├── eventManager.js        # Handles random and scheduled events
    │   └── cityManager.js         # Manages city-specific properties
    ├── ui/                # User interface modules
    │   ├── uiManager.js           # Main UI management
    │   ├── commandProcessor.js    # Processes user commands
    │   ├── processor/             # Specialized command processors
    │   │   ├── venueCommands.js   # Venue-related commands
    │   │   ├── staffCommands.js   # Staff-related commands
    │   │   ├── inventoryCommands.js # Inventory commands
    │   │   ├── financeCommands.js # Financial commands
    │   │   ├── marketingCommands.js # Marketing commands
    │   │   └── gameCommands.js    # Game system commands
    │   ├── renderEngine.js        # Handles canvas rendering
    │   ├── notificationManager.js # Manages game notifications
    │   └── render/               # Rendering subsystem
    │       ├── index.js           # Main rendering module
    │       ├── venueRenderer.js   # Renders venues
    │       ├── entityRenderer.js  # Renders entities (staff, customers)
    │       ├── animationManager.js # Handles animations
    │       └── layoutRenderer.js  # Renders venue layouts
    ├── database/          # Database system
    │   ├── api.js                 # Main database API for the game
    │   ├── databaseManager.js     # Main database connection manager
    │   ├── migrationManager.js    # Handles database schema migrations
    │   ├── migrate-cli.js         # CLI tool for database migrations
    │   ├── dbUtils.js             # Centralized database utility functions
    │   ├── migrations/            # Database migration files
    │   │   ├── migration_1.js     # Initial schema migration
    │   │   └── ...                # Additional migrations
    │   ├── dao/                   # Data Access Objects
    │   │   ├── index.js           # Exports all DAOs
    │   │   ├── venueDAO.js        # Venue data access
    │   │   ├── staffDAO.js        # Staff data access
    │   │   ├── customerDAO.js     # Customer data access
    │   │   ├── transactionDAO.js  # Financial transaction data access
    │   │   ├── inventoryDAO.js    # Inventory data access
    │   │   ├── settingsDAO.js     # Game settings data access
    │   │   └── cityDAO.js         # City data access
    │   └── services/             # Service layer
    │       ├── index.js           # Exports all services
    │       ├── venueService.js    # Venue-related business logic
    │       └── gameService.js     # Game state management service
    └── utils/             # Utility functions
        ├── helpers.js             # General helper functions
        ├── dataStore.js           # Data storage utilities (deprecated, use database)
        ├── logger.js              # Centralized logging utility
        ├── validator.js           # Centralized data validation utilities
        ├── formatter.js           # Centralized formatting utilities
        ├── randomGenerator.js     # Centralized random data generation utilities
        ├── idGenerator.js         # Centralized ID generation utilities
        ├── fileOperations.js      # Centralized file operation utilities
        ├── eventBus.js            # Centralized event system
        ├── configLoader.js        # Centralized configuration management
        ├── dataStructures.js      # Common data structure operations
        ├── domUtils.js            # DOM manipulation utilities
        ├── stateMachine.js        # State machine for entity behavior
        └── performanceMonitor.js  # Performance monitoring utilities

## Module Relationships & Dependencies

### Core Coordination
- `game.js` is the central coordinator that initializes and manages all modules
- `time.js` provides a central time source for all time-based operations
- `database/api.js` provides a unified interface to all database operations
- Utility modules (`logger.js`, `validator.js`, etc.) provide common functionality

### Module Dependencies
- Most modules depend on `game.js` for access to other modules
- Domain modules (venue, staff, customer, etc.) depend on corresponding DAO modules for database access
- Service layer coordinates complex operations across multiple DAOs
- All modules use centralized utilities for common operations

### Data Flow
1. UI interactions are processed by `commandProcessor.js` and its specialized processors
2. Commands are delegated to appropriate domain managers
3. Domain managers use DAOs to read/write data from/to the database
4. Domain managers update the UI through the notification system and render engine

### State Management
- The database is the single source of truth for all game state
- Services coordinate complex state transitions
- Notifications inform the UI about state changes
- The UI reflects the current state through rendering and display updates

## Common Utility Usage

### Logger
The `logger.js` utility should be used for all message logging to provide consistent notification handling:
```javascript
// In a module constructor
this.logger = require('../utils/logger').createLogger(game);

// Usage
this.logger.info('Informational message');
this.logger.success('Success message');
this.logger.warning('Warning message');
this.logger.error('Error message');
```

### Database Utilities
The `dbUtils.js` provides common patterns for database operations:
```javascript
const { withDatabaseFallback, withTransaction } = require('../database/dbUtils');

// Simple operation with fallback
const result = await withDatabaseFallback(
  this.game,
  'staff',
  'getStaffById',
  [staffId],
  () => this.getStaffFromMemory(staffId)
);

// Transaction with fallback
const result = await withTransaction(
  this.game,
  async (transactionId) => {
    // Database operations with transactionId
    return result;
  },
  async () => {
    // In-memory fallback
    return fallbackResult;
  }
);
```

### Validation and Formatting
The `validator.js` and `formatter.js` utilities provide consistent data handling:
```javascript
const validator = require('../utils/validator');
const formatter = require('../utils/formatter');

// Validation
const validValue = validator.validateNumber(value, 0, 100, defaultValue);

// Formatting
const formattedCurrency = formatter.formatCurrency(amount);
const formattedDate = formatter.formatDate(year, month, day);
```

### DOM Manipulation
The `domUtils.js` utility provides consistent DOM operations:
```javascript
const dom = require('../utils/domUtils');

// Create elements
const container = dom.createElement('div', { className: 'container' });
const button = dom.createButton('Click me', handleClick, 'action-button');

// Show/hide elements
dom.showElement(element);
dom.hideElement(element);
dom.toggleElement(element);

// Create UI components
const modal = dom.createModal('Title', content, onClose);
const form = dom.createForm(formFields, onSubmit);
const notification = dom.createNotification('Message', 'success');
```

### State Machine
The `stateMachine.js` utility manages entity state transitions:
```javascript
const StateMachine = require('../utils/stateMachine');

// Define states
const customerStates = {
  entering: {
    onEntry: (context) => { /* ... */ },
    onUpdate: (context) => { /* ... */ },
    allowedTransitions: ['seated', 'leaving']
  },
  seated: { /* ... */ },
  ordering: { /* ... */ },
  // ...
};

// Create state machine
const customerStateMachine = new StateMachine({
  initialState: 'entering',
  states: customerStates,
  context: { customer: customerData }
});

// Use in update loops
customerStateMachine.update(deltaTime);

// Transition states
customerStateMachine.transition('ordering', { time: gameTime });
```

## File Size Management

To maintain manageable file sizes and clear module boundaries:

1. Each file should focus on a single responsibility
2. Files should be kept under 700 lines of code
3. When a file grows beyond 700 lines, it should be split into specialized submodules in a subdirectory
4. Core manager files coordinate their specialized submodules

Example pattern:
- `staffManager.js` - Top-level coordinator
  - `staff/staffGenerator.js` - Staff generation logic
  - `staff/staffOperations.js` - Staff CRUD operations
  - `staff/staffBehavior.js` - Staff behavior and morale

This structure maintains clean separation of concerns while keeping files at a manageable size.
```

This updated structure.md file now includes all 13 utility files and provides usage examples for the most important ones.