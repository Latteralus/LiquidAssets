# docs/todo.md

# Project Status: Liquid Assets Game

## Key Issues

### 1. Code Organization Issues

1. **Duplicate File in Structure**: ✅ FIXED - The duplicate `menuManager.js` entry has been removed from filestructure.md.

2. **Inconsistent Module Loading**: ✅ PARTIALLY FIXED - Some files now properly use CommonJS (`require()`) for imports consistently, but there are still modules that assume global availability of other modules.
   - Most core modules now properly use `require()` but UI interactions sometimes assume global availability of game objects
   - Example: Some modules still assume `window.logToConsole` exists globally, though we've created a migration path with the new NotificationManager

3. **Circular Dependencies**: ⚠️ ONGOING - The architecture still creates potential circular dependencies between modules.
   - The Game class and Manager classes have bidirectional dependencies
   - Need to consider implementing a proper dependency injection system or event bus

### 2. Technical Implementation Issues

1. **Window Object Access in Node.js Context**: ✅ FIXED - The `dataStore.js` has been updated to use Node.js file system operations instead of `window.localStorage`.

2. **Inconsistent API Usage**: ✅ PARTIALLY FIXED
   - Implemented a structured notification system with NotificationManager to replace direct DOM manipulation
   - Created clear migration path with backwards compatibility for modules to transition from window.logToConsole
   - Still need to update modules to use the new notification system

3. **Broken IPC Communication**: ✅ FIXED
   - The IPC implementation between renderer and main processes has been fixed
   - Added proper handling for save/load operations
   - Improved game loop synchronization across process boundaries
   - Added exit confirmation handling

4. **Missing Error Handling**: ✅ PARTIALLY FIXED
   - Added error handling to `helpers.js` and `dataStore.js`
   - VenueManager modules now include basic validation
   - NotificationManager includes comprehensive error handling
   - Still need to improve error handling in remaining modules, especially for async operations

### 3. Game Logic Issues

1. **Time Management Inconsistencies**: ✅ FIXED
   - Game loop now properly handles time progression with configurable speed
   - Added proper cleanup on app shutdown
   - Implemented pause/resume functionality
   - Added adequate memory management with optional garbage collection

2. **Incomplete Customer Behavior Logic**: ✅ MOSTLY FIXED
   - Customer manager has good modular structure with dedicated sub-modules
   - Customer generation properly accounts for venue type, time of day, and city demographics
   - Customer behavior cycle (entering, seated, ordering, etc.) is well implemented
   - Customer satisfaction is affected by multiple factors including service quality and venue atmosphere
   - Some refinements still needed in group dynamics and preference handling

3. **Financial Calculation Simplifications**: ⚠️ ONGOING
   - Financial calculations still use simplified assumptions
   - Need more realistic modeling of expenses, taxes, seasonal variations

4. **Static City Regulations**: ⚠️ NEEDS ATTENTION
   - City regulations don't evolve over time
   - Should implement events that change regulations periodically

### 4. UI/UX Issues

1. **Over-Reliance on Console Logs**: ✅ FIXED
   - Implemented comprehensive notification system (NotificationManager)
   - Added categorized, filterable notifications with rich metadata
   - Provided clear migration path for modules to transition from window.logToConsole
   - Added detailed notification view with related notifications linking

2. **Incomplete Rendering System**: ✅ FIXED
   - Implemented a comprehensive modular rendering system
   - Created venue visualization with dynamic elements based on venue type
   - Added support for interactive elements with hover and selection
   - Implemented animation system for smooth entity movement
   - Added ambient effects for atmosphere like lighting and music visualization

3. **Limited UI Feedback**: ✅ PARTIALLY FIXED
   - Notification system now provides rich feedback with categorization and visual distinction
   - Rendering system now shows visual indicators for entity state
   - Need to update remaining modules to use the notification system for better feedback

### 5. File-Specific Issues

#### main.js
- ✅ FIXED - The game loop logic has been implemented with proper timing
- ✅ FIXED - Added proper application shutdown handling with resource cleanup

#### commandProcessor.js
- ⚠️ Command validation is inconsistent
- ⚠️ Some commands don't check venue existence before operations
- ✅ Basic command structure is in place

#### dataStore.js
- ✅ FIXED - Now uses Node.js file system operations instead of `window.localStorage`
- ✅ FIXED - Added comprehensive data validation, error handling, and new features
- ✅ FIXED - Added import/export and backup functionalities

#### venueManager.js
- ✅ FIXED - Layout generation now includes detailed venue-specific layouts
- ✅ FIXED - Venue upgrades properly update all related properties
- ✅ FIXED - Code was modularized into specialized classes (`venueCreator.js`, `layoutGenerator.js`, `venueUpgrader.js`)

#### customerManager.js
- ✅ FIXED - Customer generation properly accounts for venue type, time of day, and preferences
- ✅ FIXED - Modular structure with well-defined sub-modules (generator, behavior, orders, satisfaction)
- ✅ FIXED - Customer lifecycle is properly implemented with appropriate state transitions
- ⚠️ IMPROVEMENTS NEEDED - Could benefit from enhanced group dynamics and preference handling

#### financialManager.js and submodules
- ⚠️ Financial reports lack proper formatting
- ⚠️ Tax considerations are missing
- ⚠️ Cash flow projections are overly simplistic

#### helpers.js
- ✅ FIXED - Utility functions now include proper validation and error handling
- ✅ FIXED - Added edge case handling and fallback values
- ✅ FIXED - Added new utility functions for common operations

#### eventManager.js
- ✅ MOSTLY FIXED - Event system has good structure and implementation
- ⚠️ Some events need better coordination with other systems

#### renderEngine.js
- ✅ FIXED - Implemented a comprehensive modular rendering system
- ✅ FIXED - Added proper venue visualization with venue-specific details
- ✅ FIXED - Added animation and refined customer/staff movement
- ✅ FIXED - Created interactive canvas with pan/zoom and entity selection
- ✅ FIXED - Split into smaller modules for better organization

#### notificationManager.js
- ✅ IMPLEMENTED - Created comprehensive notification system with categories, filtering, and metadata
- ✅ IMPLEMENTED - Added support for related notifications and detailed views
- ✅ IMPLEMENTED - Provided backwards compatibility with window.logToConsole

### 6. Architectural Issues

1. **Large Monolithic Files**: ✅ PARTIALLY FIXED
   - `venueManager.js` has been broken down into smaller, focused modules
   - `renderEngine.js` has been modularized into a well-structured system
   - `customerManager.js` uses an appropriate modular approach with sub-modules
   - Other large files like `commandProcessor.js` still need similar treatment

2. **Mixed Responsibilities**: ✅ PARTIALLY FIXED
   - NotificationManager provides clear separation between business logic and UI updates for notifications
   - The new rendering system properly separates concerns with dedicated modules
   - CustomerManager has clear separation between different customer aspects
   - Some modules still handle both business logic and UI updates

3. **State Management Complexity**: ⚠️ ONGOING
   - Game state is distributed across multiple managers rather than using a centralized approach
   - Consider implementing a more structured state management pattern

4. **Missing Unit Tests**: ⚠️ NEEDS ATTENTION
   - The codebase still lacks tests for critical game logic
   - Need to implement testing framework and core tests


## Database Implementation: SQLite Migration

### Phase 1: Setup and Infrastructure
- [x] Create database folder structure at `/js/database`
- [x] Create initial database schema design
- [x] Set up database connection manager
- [ ] Create migration system to handle schema updates
- [ ] Implement error handling and connection pooling

### Phase 2: Entity Implementation
- [ ] Create venue data access layer
- [ ] Create staff data access layer
- [ ] Create customer data access layer
- [ ] Create financial transaction data access layer
- [ ] Create inventory data access layer
- [ ] Create game settings data access layer

### Phase 3: Data Migration
- [ ] Create backward compatibility layer in `dataStore.js`
- [ ] Implement save file to database migration tool
- [ ] Create database to save file export functionality
- [ ] Add data validation and integrity checks

### Phase 4: System Integration
- [ ] Update game modules to use database manager
- [ ] Refactor save/load system to use database
- [ ] Implement transaction handling for game operations
- [ ] Create performance optimization strategies
- [ ] Add query caching where appropriate

### Phase 5: Testing and Finalization
- [ ] Create comprehensive test suite for database operations
- [ ] Benchmark performance against file-based storage
- [ ] Implement backup and restore functionality
- [ ] Create disaster recovery procedures
- [ ] Update documentation for the new storage system

## Next Steps Priority

1. **Complete Module Migration to NotificationManager**
   - Update all modules to use the NotificationManager instead of window.logToConsole
   - Create a migration guide with examples for the development team
   - Gradually deprecate the legacy log container

2. **Integrate New Rendering System**
   - Connect the modular rendering system with the game loop
   - Update UI manager to utilize the new canvas interaction features
   - Add more entity animations based on their states

3. **Enhance Customer Behavior Edge Cases**
   - Implement better group dynamics for different customer types
   - Add more sophisticated preference handling
   - Improve handling of edge cases (venue at capacity, limited stock)

4. **Refine Financial Systems**
   - Implement more realistic financial calculations
   - Add tax considerations and seasonal variations
   - Enhance reporting formats for better readability

5. **Add Unit Tests**
   - Implement testing framework
   - Write tests for core game logic components

6. **Refactor Remaining Large Files**
   - Break down `commandProcessor.js` into smaller components
   - Separate UI logic from business logic across modules

7. **Implement Dynamic Events**
   - Enhance city regulations with periodic changes
   - Add seasonal variations to customer behavior and finances

## Technical Debt to Address

1. **Documentation**
   - Add JSDoc comments to all major functions
   - Create architectural diagrams for component relationships

2. **Error Logging**
   - Complete the transition to the notification system for error reporting
   - Implement error telemetry for common failure points

3. **Performance Optimization**
   - Profile and optimize main game loop
   - Reduce unnecessary calculations on each tick

4. **Modularization**
   - Continue breaking down large files
   - Implement proper module boundaries

## Recent Accomplishments

1. **Game Loop and Shutdown Handling**
   - Implemented proper game loop with variable speed
   - Added proper shutdown handling with resource cleanup
   - Fixed IPC communication for save/load operations
   - Added memory management improvements

2. **Comprehensive Rendering System**
   - Created a modular rendering engine with clear separation of concerns
   - Implemented proper venue visualization with venue-type specific details
   - Added animation system for smooth entity movement
   - Implemented interactive canvas features like pan/zoom and selection
   - Added visual ambiance effects based on venue settings

3. **Customer System Improvements**
   - Refined customer generation to better match venue type and time of day
   - Implemented full customer lifecycle with appropriate state transitions
   - Created satisfaction system that accounts for multiple factors
   - Implemented modular approach to customer management

4. **Notification System Implementation**
   - Created comprehensive NotificationManager with filtering, categorization, and metadata support
   - Implemented related notifications for tracking event sequences
   - Added detailed notification view with rich formatting
   - Provided backward compatibility for gradual migration

5. **Improved Project Organization**
   - Created modular structure for rendering components
   - Implemented appropriate modularization for customer management
   - Updated file structure documentation
   - Maintained consistent task tracking

The project has made significant progress with the implementation of a proper game loop, a comprehensive rendering system, improvements to the customer management system, and enhancements to the notification system. These changes address several critical issues from our todo list and create a solid foundation for future development.