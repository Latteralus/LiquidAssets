# Database Implementation Plan

## Current Status

The implementation of SQLite integration into the game has made significant progress. Here's the current status:

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
17. ✅ Created **js/modules/time.js** for centralized time management
18. ✅ Restructured InventoryManager into modular system with specialized submodules
19. ✅ Implemented naming system module at **js/modules/names.js** with submodules
20. ✅ Completed StaffManager integration with StaffDAO and submodules

### In Progress:
1. 🔄 Transitioning from hybrid database/in-memory approach to database-only approach
2. 🔄 Improving database transaction handling for critical operations
3. 🔄 Refining error handling and recovery procedures for database operations
4. 🔄 Updating **js/modules/customerManager.js** with database integration
5. 🔄 Integrating NotificationManager with database operations for consistent user feedback

### Remaining Tasks:

#### Core Game Files
1. `js/modules/cityManager.js` - Create CityDAO and implement full database integration
2. `js/modules/eventManager.js` - Update event scheduling to persist in database
3. `js/modules/timeManager.js` - Ensure full synchronization with the time.js module

#### UI Modules
4. `js/ui/uiManager.js` - Update to handle database-driven state updates
5. `js/ui/commandProcessor.js` - Update command handling to use database operations
6. `js/ui/processor/venueCommands.js` - Update to use VenueService
7. `js/ui/processor/staffCommands.js` - Update to use StaffDAO
8. `js/ui/processor/inventoryCommands.js` - Update to use InventoryDAO
9. `js/ui/processor/financeCommands.js` - Update to use TransactionDAO
10. `js/ui/processor/gameCommands.js` - Update save/load to use GameService

## New Centralized Utilities

To reduce code duplication and improve maintainability, we're implementing a series of centralized utility files:

### Newly Added Utility Files
1. ✅ **js/utils/logger.js** - Centralized logging utility
2. ✅ **js/database/dbUtils.js** - Database operations and fallback utilities
3. ✅ **js/utils/validator.js** - Data validation utilities
4. ✅ **js/utils/formatter.js** - Text and data formatting utilities
5. ✅ **js/utils/randomGenerator.js** - Random data generation utilities
6. ✅ **js/utils/idGenerator.js** - Entity ID generation utilities
7. ✅ **js/utils/fileOperations.js** - File system operations utilities
8. ✅ **js/utils/eventBus.js** - Centralized event system
9. ✅ **js/utils/configLoader.js** - Configuration management
10. ✅ **js/utils/dataStructures.js** - Common data structure operations
11. ✅ **js/utils/domUtils.js** - DOM manipulation utilities
12. ✅ **js/utils/stateMachine.js** - Entity behavior state management
13. ✅ **js/utils/performanceMonitor.js** - Performance monitoring utilities

These utilities will significantly reduce code duplication and improve maintainability by centralizing common functionality used throughout the codebase.

## Database-Centric Architecture

After review, we are moving to a database-centric architecture where the database is the sole source of truth for all game state. This represents a shift from the previous hybrid approach that maintained both database and in-memory state.

### Key Principles of the New Approach:

1. **Single Source of Truth**: The database is the definitive source of truth for all game state data. All modules must read from and write to the database for state management.

2. **No Duplicate State**: We will eliminate redundant in-memory copies of data that exists in the database. Instead, we'll implement strategic caching where needed for performance.

3. **Clear Data Access Patterns**: All data access should go through the DAO layer, which abstracts the database operations from the business logic.

4. **Service-Layer Coordination**: The service layer will coordinate complex operations involving multiple entities, ensuring transactional integrity.

5. **Event-Based Updates**: UI updates should be triggered by events from the data layer, rather than direct polling of state.

6. **Consistent Error Handling**: All database operations should have consistent error handling patterns that gracefully manage database errors without falling back to in-memory operations.

7. **Transaction Management**: All operations that modify multiple entities should use database transactions to ensure data consistency.

## Utility Integration Plan

### Phase 1: Core Utilities Integration (Highest Priority)
1. **logger.js** - Integrate with all modules that use logging
   - **Priority Files**: StaffManager, StaffBehavior, CustomerManager, VenueManager, EventManager
   - **Implementation**: Replace all logging methods with the centralized logger
   - **Expected Reduction**: ~200-250 lines

2. **dbUtils.js** - Integrate with all database operations
   - **Priority Files**: All DAO files, service layer files, Manager classes with DB interactions
   - **Implementation**: Replace database availability checks and fallbacks with the utilities
   - **Expected Reduction**: ~150-200 lines

3. **stateMachine.js** - Integrate with entity behavior modules
   - **Priority Files**: CustomerBehavior, StaffBehavior, EventManager
   - **Implementation**: Replace custom state management with the StateMachine class
   - **Expected Reduction**: ~300-400 lines

### Phase 2: Data Handling Utilities Integration (High Priority)
1. **validator.js** - Integrate with all validation logic
   - **Priority Files**: CommandProcessor, DAO files, Service layer
   - **Implementation**: Replace repetitive validation with centralized validators
   - **Expected Reduction**: ~200-300 lines

2. **formatter.js** - Integrate with UI and reporting functions
   - **Priority Files**: UIManager, Financial reports, Notification formatting
   - **Implementation**: Replace custom formatting with centralized formatters
   - **Expected Reduction**: ~250-350 lines

3. **dataStructures.js** - Integrate with complex data operations
   - **Priority Files**: Financial calculations, Inventory management, Customer generation
   - **Implementation**: Replace custom data manipulation with utilities
   - **Expected Reduction**: ~200-300 lines

### Phase 3: UI and Event Utilities Integration (Medium Priority)
1. **domUtils.js** - Integrate with UI rendering
   - **Priority Files**: UIManager, RenderEngine, NotificationManager
   - **Implementation**: Replace DOM manipulation with utilities
   - **Expected Reduction**: ~250-350 lines

2. **eventBus.js** - Implement event-based communication
   - **Priority Files**: game.js, UIManager, all Manager classes
   - **Implementation**: Replace direct function calls with event-based system
   - **Expected Reduction**: ~150-200 lines

### Phase 4: Support Utilities Integration (Lower Priority)
1. **idGenerator.js**, **randomGenerator.js** - Entity creation utilities
   - **Priority Files**: StaffGenerator, CustomerGenerator, VenueCreator
   - **Implementation**: Replace custom ID and random generation
   - **Expected Reduction**: ~150-200 lines

2. **fileOperations.js**, **configLoader.js** - Configuration and storage
   - **Priority Files**: dataStore.js, migrationManager.js, game.js
   - **Implementation**: Replace file operations and config loading
   - **Expected Reduction**: ~300-400 lines

3. **performanceMonitor.js** - Add performance monitoring
   - **Priority Files**: game.js, time.js, render modules
   - **Implementation**: Add performance monitoring to critical paths
   - **Expected Reduction**: N/A (new functionality)

## Integration Strategy for Database Operations

The integration of utilities, particularly `dbUtils.js`, will streamline database operations. Here's how to implement this for maximum code reduction:

### 1. Standardize Database Access Pattern
```javascript
const { withDatabaseFallback } = require('../database/dbUtils');

// Replace this pattern:
async function getStaff(staffId) {
  try {
    if (this.game.dbInitialized) {
      return await this.game.dbAPI.staff.getStaffById(staffId);
    } else {
      return this.getStaffFromMemory(staffId);
    }
  } catch (error) {
    console.error(`Error getting staff ${staffId}:`, error);
    return this.getStaffFromMemory(staffId);
  }
}

// With this pattern:
async function getStaff(staffId) {
  return await withDatabaseFallback(
    this.game,
    'staff',
    'getStaffById',
    [staffId],
    () => this.getStaffFromMemory(staffId)
  );
}
```

### 2. Standardize Transaction Pattern
```javascript
const { withTransaction } = require('../database/dbUtils');

// Replace this pattern:
async function complexOperation() {
  if (!this.game.dbInitialized) {
    return this.complexOperationInMemory();
  }
  
  let transactionId = null;
  try {
    transactionId = await this.game.dbAPI.db.beginTransaction();
    // Multiple DB operations...
    await this.game.dbAPI.db.commitTransaction(transactionId);
    return result;
  } catch (error) {
    if (transactionId) {
      await this.game.dbAPI.db.rollbackTransaction(transactionId);
    }
    console.error('Transaction failed:', error);
    return this.complexOperationInMemory();
  }
}

// With this pattern:
async function complexOperation() {
  return await withTransaction(
    this.game,
    async (transactionId) => {
      // Multiple DB operations with transactionId...
      return result;
    },
    async () => {
      return this.complexOperationInMemory();
    }
  );
}
```

## Priorities for Database Integration with Utilities

Based on utility integration, the database integration priorities have been adjusted:

### Highest Priority
1. **CustomerManager with StateMachine**
   - Use StateMachine for customer behavior states
   - Use dbUtils for database operations
   - Use logger for consistent messages

2. **CityManager with dbUtils**
   - Create CityDAO and integrate with dbUtils
   - Remove in-memory state management

3. **EventManager with StateMachine and eventBus**
   - Use StateMachine for event states
   - Use eventBus for event publishing
   - Persist events in database

### High Priority
1. **UI Command Processors with validator**
   - Use validator for input validation
   - Use formatter for output formatting
   - Use dbUtils for database access

2. **Rendering System with domUtils**
   - Use domUtils for DOM manipulation
   - Use performanceMonitor for optimization

### Medium Priority
1. **Financial Reporting with dataStructures and formatter**
   - Use dataStructures for data manipulation
   - Use formatter for report generation

2. **Time Management with configLoader**
   - Ensure time.js uses configLoader
   - Add performanceMonitor to time updates

## Expected Benefits

Combining utility integration with the database-centric approach will yield several benefits:

1. **Code Reduction**: Estimated 15-30% reduction in total codebase size
2. **Consistency**: Uniform approach to common tasks across the codebase
3. **Maintainability**: Changes to core functionality in one place
4. **Performance**: Better optimization with dedicated utilities
5. **Robustness**: Improved error handling and recovery
6. **Testability**: Easier testing of isolated utility functions

## Implementation Progress Tracking

To track progress on utility integration, we'll add a new section to this document:

### Utility Integration Progress
- ⬜ logger.js - Not started
- ⬜ dbUtils.js - Not started
- ⬜ validator.js - Not started
- ⬜ formatter.js - Not started
- ⬜ randomGenerator.js - Not started
- ⬜ idGenerator.js - Not started
- ⬜ fileOperations.js - Not started
- ⬜ eventBus.js - Not started
- ⬜ configLoader.js - Not started
- ⬜ dataStructures.js - Not started
- ⬜ domUtils.js - Not started
- ⬜ stateMachine.js - Not started
- ⬜ performanceMonitor.js - Not started

As utilities are integrated into modules, we'll update this list to track progress.

## Next Steps

1. Create all utility files with complete implementations
2. Start integration with highest priority modules:
   - CustomerManager
   - CityManager
   - EventManager
3. Progressively integrate utilities with all modules
4. Measure code reduction and performance improvements
5. Refine utility implementations based on real-world usage

The combination of database-centric architecture and centralized utilities will significantly improve the codebase structure, maintainability, and performance. This strategic refactoring will set a strong foundation for future development while reducing overall code complexity.