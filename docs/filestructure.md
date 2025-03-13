# docs/filestructure.md

Last Updated: March 13, 2025 5:45pm MST

liquidassets/
├── main.js
├── preload.js
├── index.html
├── style.css
├── renderer.js
├── assets/
│   ├── icons/
│   │   └── icon.png
│   ├── images/
│   └── sounds/
├── docs/
│   ├── plan.md
│   ├── filestructure.md
│   └── todo.md
└── js/
    ├── game.js
    ├── config.js
    ├── modules/
    │   ├── timeManager.js
    │   ├── venueManager.js
    │   ├── venue/
    │   │   ├── venueCreator.js
    │   │   ├── layoutGenerator.js
    │   │   └── venueUpgrader.js
    │   ├── staffManager.js
    │   ├── customerManager.js
    │   │   ├── customer/
    │   │   │   ├── customerBehavior.js
    │   │   │   ├── customerGenerator.js
    │   │   │   ├── customerOrders.js
    │   │   │   └── customerSatisfaction.js
    │   ├── financialManager.js
    │   │   ├── finances/
    │   │   │   ├── expenseManager.js
    │   │   │   ├── revenueManager.js
    │   │   │   ├── transactionManager.js
    │   │   │   └── reportingManager.js
    │   ├── inventoryManager.js
    │   ├── eventManager.js
    │   └── cityManager.js
    ├── ui/
    │   ├── uiManager.js
    │   ├── commandProcessor.js
    │   ├── renderEngine.js
    │   ├── menuManager.js
    │   ├── menuComponents.js
    │   └── notificationManager.js
    └── utils/
        ├── helpers.js
        └── dataStore.js