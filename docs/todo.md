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

3. **Broken IPC Communication**: ⚠️ NEEDS ATTENTION
   - The IPC implementation between renderer and main processes is still problematic
   - Some operations assume direct access across process boundaries

4. **Missing Error Handling**: ✅ PARTIALLY FIXED
   - Added error handling to `helpers.js` and `dataStore.js`
   - VenueManager modules now include basic validation
   - NotificationManager includes comprehensive error handling
   - Still need to improve error handling in remaining modules, especially for async operations

### 3. Game Logic Issues

1. **Time Management Inconsistencies**: ⚠️ NEEDS ATTENTION
   - Time progression system doesn't handle time jumps cleanly
   - Day/week/month transitions need better coordination across modules

2. **Incomplete Customer Behavior Logic**: ⚠️ PARTIALLY FIXED
   - Customer behavior now accounts for venue types better
   - Still needs improvement in preferences, group dynamics, and special cases

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

2. **Incomplete Rendering System**: ⚠️ PARTIALLY FIXED
   - Layout generation now properly accounts for venue size and type
   - Still needs proper implementation of the visual rendering of venues in `renderEngine.js`

3. **Limited UI Feedback**: ✅ PARTIALLY FIXED
   - Notification system now provides rich feedback with categorization and visual distinction
   - Need to update remaining modules to use the notification system for better feedback

### 5. File-Specific Issues

#### main.js
- ⚠️ The game loop logic is not fully implemented
- ⚠️ Missing proper application shutdown handling

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
- ⚠️ PARTIALLY FIXED - Customer generation now better accounts for venue type and time of day
- ⚠️ Customer satisfaction calculations still need refinement

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
- ⚠️ NEEDS ATTENTION - The rendering system still needs implementation for proper venue visualization
- ⚠️ Animation and customer movement need refinement

#### notificationManager.js
- ✅ IMPLEMENTED - Created comprehensive notification system with categories, filtering, and metadata
- ✅ IMPLEMENTED - Added support for related notifications and detailed views
- ✅ IMPLEMENTED - Provided backwards compatibility with window.logToConsole

### 6. Architectural Issues

1. **Large Monolithic Files**: ✅ PARTIALLY FIXED
   - `venueManager.js` has been broken down into smaller, focused modules
   - Other large files like `commandProcessor.js` and `customerManager.js` still need similar treatment

2. **Mixed Responsibilities**: ✅ PARTIALLY FIXED
   - NotificationManager provides clear separation between business logic and UI updates for notifications
   - Some modules still handle both business logic and UI updates

3. **State Management Complexity**: ⚠️ ONGOING
   - Game state is distributed across multiple managers rather than using a centralized approach
   - Consider implementing a more structured state management pattern

4. **Missing Unit Tests**: ⚠️ NEEDS ATTENTION
   - The codebase still lacks tests for critical game logic
   - Need to implement testing framework and core tests

## Next Steps Priority

1. **Complete Module Migration to NotificationManager**
   - Update all modules to use the NotificationManager instead of window.logToConsole
   - Create a migration guide with examples for the development team
   - Gradually deprecate the legacy log container

2. **Complete Renderer Implementation**
   - Finish the rendering engine to properly visualize venues
   - Implement customer and staff visualization

3. **Fix IPC Communication**
   - Ensure proper communication between renderer and main processes
   - Standardize async operations across process boundaries

4. **Refine Customer and Financial Systems**
   - Improve customer behavior modeling
   - Enhance financial calculations for more realism

5. **Add Unit Tests**
   - Implement testing framework
   - Write tests for core game logic components

6. **Refactor Remaining Large Files**
   - Break down `commandProcessor.js` into smaller components
   - Separate UI logic from business logic across modules

7. **Enhance Time Management**
   - Improve handling of day/week/month transitions
   - Ensure consistent timing across all game systems

8. **Implement Dynamic Events**
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

1. **Notification System Implementation**
   - Created comprehensive NotificationManager with filtering, categorization, and metadata support
   - Implemented related notifications for tracking event sequences
   - Added detailed notification view with rich formatting
   - Provided backward compatibility for gradual migration

2. **Improved Project Organization**
   - Created docs folder for documentation files
   - Updated file structure documentation
   - Maintained consistent task tracking

The project continues to make good progress with substantial improvements to the notification system, which addresses one of our key UI/UX issues. The next focus should be on migrating existing modules to use this new system and addressing the rendering engine implementation.