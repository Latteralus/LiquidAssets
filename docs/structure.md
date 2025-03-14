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
│   └── todo.md            # Current task list and project status
└── js/
    ├── game.js            # Main game logic and state management
    ├── config.js          # Game configuration and constants
    ├── modules/           # Game mechanics modules
    │   ├── timeManager.js         # Handles game time progression
    │   ├── venueManager.js        # Manages venue operations
    │   ├── venue/                 # Venue-specific modules
    │   │   ├── venueCreator.js    # Handles venue creation
    │   │   ├── layoutGenerator.js # Generates venue layouts
    │   │   └── venueUpgrader.js   # Handles venue upgrades and modifications
    │   ├── staffManager.js        # Manages staff members
    │   ├── customerManager.js     # Handles customer interactions
    │   │   ├── customer/          # Customer-specific modules
    │   │   │   ├── customerBehavior.js   # Customer behavior logic
    │   │   │   ├── customerGenerator.js  # Creates new customers
    │   │   │   ├── customerOrders.js     # Manages customer orders
    │   │   │   └── customerSatisfaction.js # Handles customer satisfaction
    │   ├── financialManager.js    # Main financial management
    │   │   ├── finances/          # Finance-specific modules
    │   │   │   ├── expenseManager.js    # Handles expenses
    │   │   │   ├── revenueManager.js    # Manages revenue
    │   │   │   ├── transactionManager.js # Tracks transactions
    │   │   │   └── reportingManager.js  # Generates financial reports
    │   ├── inventoryManager.js    # Manages venue inventory
    │   │   ├── inventory/         # Inventory-specific modules
    │   │   │   ├── inventoryGenerator.js # Default inventory creation
    │   │   │   └── inventoryOperations.js # CRUD operations
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
    │   ├── menuManager.js         # Manages game menus
    │   ├── menuComponents.js      # UI components for menus
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
        └── dataStore.js           # Data storage utilities (deprecated, use database)