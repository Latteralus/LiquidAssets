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

## Code Organization & File Size Constraints

All modules must adhere to the following constraints:

1. **Maximum file size: 700 lines of code**
   - If a module exceeds 700 lines, it must be broken down into smaller files in a subdirectory
   - Example: `financialManager.js` can use files in the `/finances/` subdirectory

2. **Modularization principles**
   - Modules should be organized by domain/functionality
   - Each module should have a clear, single responsibility
   - Avoid duplicate code across modules

3. **Directory structure for specialized modules**
   - `js/modules/staff/` - Contains all staff-related specialized modules:
     - `staffGenerator.js` - Staff generation
     - `staffBehavior.js` - Staff morale and behavior
     - `staffOperations.js` - Staff CRUD operations
   - `js/modules/inventory/` - Contains all inventory-related specialized modules
   - `js/modules/names/` - Contains all name generation modules:
     - `nameList.js` - Person name lists
     - `venueList.js` - Venue name patterns
     - `drinkList.js` - Drink name patterns
     - `foodList.js` - Food name patterns
     - `miscList.js` - Miscellaneous name parts

## Implementation Progress

### Names Module Implementation
We've successfully implemented a comprehensive name generation system at `js/modules/names.js` that coordinates specialized submodules:

- **Main Coordinator**: `names.js` provides high-level name generation functions
- **Specialized Modules**:
  - `names/nameList.js` - Person names with cultural diversity
  - `names/venueList.js` - Venue name patterns based on venue type
  - `names/drinkList.js` - Names for various drink types
  - `names/foodList.js` - Food names and cuisines
  - `names/miscList.js` - Reusable naming components

This system is now integrated with StaffGenerator and other modules that require name generation.

### Time Module Implementation
We've created a centralized time management system in `js/modules/time.js` that provides:

- Standardized time representation
- Time manipulation functions
- Event-based callbacks for different time scales (minute, hour, day, week, month)
- Synchronization with database time
- Conversion utilities for different time formats

This module serves as the single source of truth for game time and helps eliminate time-related inconsistencies.

### Staff Management Integration
The StaffManager module has been fully integrated with the database through:

- Transaction-based operations in StaffDAO
- Comprehensive database operations for all staff-related functionality
- Integration with the time module for schedule management
- Connection to the name generation system for staff creation

## Next Steps (Immediate Priorities)

1. Complete CustomerManager integration with CustomerDAO
   - Create specialized submodules if needed
   - Ensure proper database transaction handling

2. Create CityDAO and update CityManager to use database storage
   - Implement proper data structure for city-specific regulations and properties
   - Focus on keeping code modular and maintainable

3. Update remaining UI modules to use the database-centric approach
   - Remove direct state access and replace with DAO/service calls
   - Implement proper state update patterns

4. Implement more robust database error handling
   - Centralize error handling patterns
   - Provide meaningful error messages for debugging
   - Improve recovery procedures for database failures

## Database Performance and Optimization

To ensure good performance with the database-centric approach:

1. **Implement Indexing Strategy**
   - Create appropriate indexes for frequently queried columns
   - Focus on foreign keys and commonly filtered fields

2. **Strategic Caching**
   - Cache frequently accessed, rarely changed data
   - Implement cache invalidation on relevant database updates

3. **Query Optimization**
   - Use prepared statements consistently
   - Optimize complex queries to reduce database load
   - Use appropriate joins instead of multiple queries where beneficial

4. **Connection Pooling Refinement**
   - Adjust connection pool size based on application needs
   - Implement proper connection cleanup and monitoring

5. **Transaction Batching**
   - Batch related operations in single transactions
   - Minimize transaction scope to necessary operations

## Testing and Validation Plan

To validate the database integration:

1. **Unit Tests for DAOs**
   - Create comprehensive tests for each DAO
   - Test edge cases and error conditions

2. **Integration Tests for Services**
   - Test complex operations involving multiple DAOs
   - Verify transactional integrity

3. **Performance Benchmarks**
   - Compare performance before and after database optimization
   - Identify and address bottlenecks

4. **UI Validation**
   - Verify UI responsiveness with database-backed data
   - Test UI behavior under database failure conditions

The shift to a database-centric architecture will significantly improve the robustness and maintainability of the codebase while providing a solid foundation for future development.