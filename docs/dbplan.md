# Database Implementation Plan

## Current Status

The implementation of SQLite integration into the game is in progress. Here's the current status:

### Completed Tasks:
1. ✅ Created database folder structure at `/js/database`
2. ✅ Created initial database schema design 
3. ✅ Set up database connection manager with connection pooling
4. ✅ Implemented migration system for schema updates
5. ✅ Created VenueDAO for venue data operations
6. ✅ Created StaffDAO for staff operations
7. ✅ Created CustomerDAO for customer tracking
8. ✅ Created TransactionDAO for financial operations
9. ✅ Created InventoryDAO for inventory management
10. ✅ Created SettingsDAO for game settings
11. ✅ Created service layer (VenueService, GameService)
12. ✅ Created centralized database API
13. ✅ Updated **js/game.js** with database integration
14. ✅ Updated **js/modules/venueManager.js** with database integration
15. ✅ Updated **js/modules/financialManager.js** with database integration
16. ✅ Updated **js/modules/inventoryManager.js** with database integration
17. ✅ Restructured InventoryManager into modular system with specialized submodules

### In Progress:
1. 🔄 Testing database operations for performance and reliability (preliminary testing only, comprehensive test suite planned)
2. 🔄 Refining error handling and recovery procedures for database operations (command processor error handling is complete, but other modules still need work)
3. 🔄 Updating **js/modules/staffManager.js** with database integration
4. 🔄 Integrating NotificationManager with database operations for consistent user feedback

### Remaining Tasks:

#### Core Game Files
1. `js/modules/customerManager.js` - Replace in-memory customer tracking with CustomerDAO
2. `js/modules/cityManager.js` - Create CityDAO and replace city data with database storage
3. `js/modules/eventManager.js` - Update event scheduling to persist in database
4. `js/modules/timeManager.js` - Ensure game time is persisted properly

#### UI Modules
5. `js/ui/uiManager.js` - Update to handle database-driven state updates
6. `js/ui/commandProcessor.js` - Update command handling to use database operations
7. `js/ui/processor/venueCommands.js` - Update to use VenueService
8. `js/ui/processor/staffCommands.js` - Update to use StaffDAO
9. `js/ui/processor/inventoryCommands.js` - Update to use InventoryDAO
10. `js/ui/processor/financeCommands.js` - Update to use TransactionDAO
11. `js/ui/processor/gameCommands.js` - Update save/load to use GameService

## Code Organization & File Size Constraints

All modules must adhere to the following constraints:

1. **Maximum file size: 700 lines of code**
   - If a module exceeds 700 lines, it must be broken down into smaller files in a subdirectory
   - Example: `financialManager.js` can use files in the `/finances/` subdirectory

2. **Modularization principles**
   - Modules should be organized by domain/functionality
   - Each module should have a clear, single responsibility
   - Avoid duplicate code across modules

3. **Priority order**
   - First priority: Keep files under 700 lines by using appropriate subdirectories
   - Second priority: Reduce space by eliminating redundant files and optimizing code

## File Consolidation and Optimization Progress

### Completed Optimizations
1. **InventoryManager**
   - Successfully restructured into a modular system with:
     - `inventoryManager.js` (main coordinator)
     - `inventory/inventoryGenerator.js` (default inventory creation)
     - `inventory/inventoryOperations.js` (CRUD operations)
   - Added new functionality (equipment repair and upgrades)
   - Implemented proper database integration with fallbacks
   - Eliminated redundancy between modules
   - Each file is under 700 lines as required

### Redundancy Reduction Strategy
1. **Venue Management**
   - Keep `venueCreator.js` and `venueUpgrader.js` but optimize them to only contain code not covered by the VenueService
   - Remove any duplicate code that now exists in the database layer

2. **Financial Management**
   - Keep the `/finances/` subdirectory but optimize each file:
     - `expenseManager.js`: Focus only on expense calculations and categorization
     - `revenueManager.js`: Focus only on revenue calculations and categorization
     - `reportingManager.js`: Focus only on report formatting and processing
     - `transactionManager.js`: Replace most functionality with TransactionDAO

3. **Customer Management**
   - Keep the `/customer/` subdirectory but optimize each file:
     - `customerGenerator.js`: Optimize to focus only on customer attribute generation
     - `customerBehavior.js`: Focus on behavior logic, not data storage
     - `customerOrders.js`: Optimize order processing logic
     - `customerSatisfaction.js`: Maintain satisfaction calculations

### Code Optimization Strategies
1. **Remove redundant validation code**
   - Move validation to the DAO layer where possible
   - Eliminate duplicate validation across files

2. **Simplify functions**
   - Reduce function complexity by leveraging database queries
   - Replace multi-step processes with single database calls where appropriate

3. **Eliminate caching/storage duplication**
   - Remove code that duplicates database storage functionality
   - Replace in-memory caches with database queries where appropriate

4. **Clean up unused/deprecated code**
   - Identify and remove unused functions and variables
   - Remove commented-out code that's no longer needed

## Implementation Approach

To ensure we maintain functionality while optimizing:

1. **Module-by-Module Updates**
   - Update one manager at a time to use the database
   - Test thoroughly after each update
   - Keep file size under 700 lines

2. **Database-Centric Functionality**
   - Wherever possible, switch managers to use database-only operations
   - Only retain in-memory capabilities if absolutely necessary for performance reasons
   - If a feature flag (useDatabase) is required, ensure it's only used for critical fallback situations

3. **Gradual Optimization**
   - First, make the module work with the database
   - Then optimize to remove redundancy
   - Finally, refactor to optimize file size and code quality

4. **Code Review Process**
   - After each module update, review for redundancy
   - Check file sizes and modularize if needed
   - Ensure all imports/exports are properly updated

## Addressing Architectural Challenges

### Circular Dependencies Resolution
To address the issue of circular dependencies between modules, the database layer will help by:

1. **Service-Oriented Architecture**
   - Implementing a true service layer that handles complex operations
   - Moving business logic from managers to appropriate services
   - Using dependency injection for services instead of direct imports

2. **Event-Based Communication**
   - Implementing a publish/subscribe pattern for cross-module communication
   - Leveraging database triggers for certain automatic actions
   - Reducing direct module-to-module function calls

3. **Data Access Abstraction**
   - Creating a clear separation between data access and business logic
   - Using the DAO pattern consistently across all modules
   - Implementing query objects to encapsulate complex database operations

4. **Data Flow Directionality**
   - Establishing a clear unidirectional data flow
   - Managers request data from services, not directly from other managers
   - Services coordinate complex operations involving multiple DAOs

### NotificationManager Integration
To properly integrate the NotificationManager with database operations:

1. **Database Event Notifications**
   - Implement database triggers or observers for significant state changes
   - Connect these observers to the NotificationManager to generate user notifications
   - Categorize database events by severity and relevance for appropriate notification types

2. **Transaction Feedback**
   - Provide detailed success/failure feedback for database operations
   - Use NotificationManager to convey transaction results to the user
   - Include transaction IDs in notifications for troubleshooting

3. **Data Validation Feedback**
   - Channel database constraint violation errors through NotificationManager
   - Translate technical database errors into user-friendly notifications
   - Group related validation errors into a single notification when appropriate

## Next Steps (Immediate Priorities)

1. Complete `staffManager.js` integration with StaffDAO
   - Follow the same modular approach used for InventoryManager
   - Consider breaking into specialized submodules if needed

2. Update `customerManager.js` to use CustomerDAO
   - Review existing customer modules for optimization opportunities
   - Ensure no single file exceeds 700 lines

3. Create CityDAO and update `cityManager.js` to use database storage
   - Implement proper data structure for city-specific regulations and properties
   - Focus on keeping code modular and maintainable

4. Begin optimizing venue-related files to remove redundancy
   - Maintain functionality while reducing code duplication
   - Keep all files under 700 lines