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

### In Progress:
1. 🔄 Testing database operations for performance and reliability
2. 🔄 Refining error handling and recovery procedures

### Remaining Tasks:

#### Core Game Files
1. `js/modules/staffManager.js` - Replace direct state manipulation with StaffDAO
2. `js/modules/customerManager.js` - Replace in-memory customer tracking with CustomerDAO
3. `js/modules/financialManager.js` - Replace direct financial tracking with TransactionDAO
4. `js/modules/inventoryManager.js` - Replace inventory management with InventoryDAO
5. `js/modules/cityManager.js` - Replace city data with potential CityDAO (may need to be created)
6. `js/modules/eventManager.js` - Update event scheduling to persist in database
7. `js/modules/timeManager.js` - Ensure game time is persisted properly

#### UI Modules
8. `js/ui/uiManager.js` - Update to handle database-driven state updates
9. `js/ui/commandProcessor.js` - Update command handling to use database operations
10. `js/ui/processor/venueCommands.js` - Update to use VenueService
11. `js/ui/processor/staffCommands.js` - Update to use StaffDAO
12. `js/ui/processor/inventoryCommands.js` - Update to use InventoryDAO
13. `js/ui/processor/financeCommands.js` - Update to use TransactionDAO
14. `js/ui/processor/gameCommands.js` - Update save/load to use GameService

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

## File Consolidation and Optimization Plan

To optimize our codebase while respecting the 700-line constraint, we'll follow this approach:

### Files to Eliminate
1. **`js/utils/dataStore.js`** - Completely replace with database storage

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

2. **Hybrid Functionality**
   - Each manager should maintain both database and in-memory capabilities
   - Use a feature flag (`useDatabase`) to toggle between modes
   - Ensure backward compatibility during transition

3. **Gradual Optimization**
   - First, make the module work with the database
   - Then optimize to remove redundancy
   - Finally, refactor to optimize file size and code quality

4. **Code Review Process**
   - After each module update, review for redundancy
   - Check file sizes and modularize if needed
   - Ensure all imports/exports are properly updated

## Next Steps (Immediate Priorities)

1. Update `staffManager.js` to use StaffDAO
   - Ensure it stays under 700 lines
   - Optimize any redundant code

2. Update `financialManager.js` to use TransactionDAO
   - Optimize `/finances/` subdirectory files
   - Ensure no single file exceeds 700 lines

3. Update `inventoryManager.js` to use InventoryDAO
   - Optimize inventory management logic
   - Focus on keeping file size manageable

4. Begin optimizing venue-related files to remove redundancy
   - Maintain functionality while reducing code duplication
   - Keep all files under 700 lines