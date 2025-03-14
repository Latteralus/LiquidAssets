Here are the files we'll need to adjust to integrate the database layer into the game modules:

### Core Game Files
1. `js/game.js` - Core game initialization and state management needs to use database

### Manager Modules
2. `js/modules/venueManager.js` - Replace direct state manipulation with VenueDAO/VenueService
3. `js/modules/staffManager.js` - Replace direct state manipulation with StaffDAO
4. `js/modules/customerManager.js` - Replace in-memory customer tracking with CustomerDAO
5. `js/modules/financialManager.js` - Replace direct financial tracking with TransactionDAO
6. `js/modules/inventoryManager.js` - Replace inventory management with InventoryDAO
7. `js/modules/cityManager.js` - Replace city data with potential CityDAO (may need to be created)
8. `js/modules/eventManager.js` - Update event scheduling to persist in database
9. `js/modules/timeManager.js` - Ensure game time is persisted properly

### UI Modules
10. `js/ui/uiManager.js` - Update to handle database-driven state updates
11. `js/ui/commandProcessor.js` - Update command handling to use database operations
12. `js/ui/processor/venueCommands.js` - Update to use VenueService
13. `js/ui/processor/staffCommands.js` - Update to use StaffDAO
14. `js/ui/processor/inventoryCommands.js` - Update to use InventoryDAO
15. `js/ui/processor/financeCommands.js` - Update to use TransactionDAO
16. `js/ui/processor/gameCommands.js` - Update save/load to use GameService

### Utility Files
17. `js/utils/dataStore.js` - Deprecate or convert to use database

### Save/Load System
18. `preload.js` - Update IPC handlers for save/load to use database
19. `main.js` - Update save/load handlers to use database

This migration will need to be done carefully, ideally one module at a time, starting with the most foundational ones (like venueManager) and gradually working up to higher-level modules. Each module should be updated to use the appropriate DAO or Service from the database layer instead of manipulating the game state directly.