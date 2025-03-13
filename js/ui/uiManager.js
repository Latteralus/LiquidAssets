// UI Manager - Coordinates UI elements and interactions

class UIManager {
    constructor(game) {
      this.game = game;
      this.elements = {};
      this.menuVisible = false;
    }
    
    setupEventListeners() {
      // Get UI elements
      this.elements = {
        commandInput: document.getElementById('command-input'),
        logContainer: document.getElementById('log-container'),
        suggestionsDiv: document.getElementById('suggestions'),
        mainMenu: document.getElementById('main-menu'),
        cashValue: document.getElementById('cash-value'),
        dateValue: document.getElementById('date-value'),
        locationValue: document.getElementById('location-value'),
        customersToday: document.getElementById('customers-today'),
        revenueToday: document.getElementById('revenue-today'),
        staffMorale: document.getElementById('staff-morale'),
        venuePopularity: document.getElementById('venue-popularity'),
        staffList: document.getElementById('staff-list'),
        venueCanvas: document.getElementById('venue-canvas')
      };
      
      // Set up command input event listener
      if (this.elements.commandInput) {
        this.elements.commandInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const command = this.elements.commandInput.value.trim();
            if (command) {
              this.game.processCommand(command);
              this.elements.commandInput.value = '';
            }
          } else if (e.key === 'Tab') {
            // Tab completion
            e.preventDefault();
            this.handleTabCompletion();
          }
        });
        
        // Command suggestions
        this.elements.commandInput.addEventListener('input', () => {
          const input = this.elements.commandInput.value.trim().toLowerCase();
          if (input.length > 0) {
            this.showSuggestions(input);
          } else {
            this.hideSuggestions();
          }
        });
      }
      
      // Set up menu buttons
      const newGameBtn = document.getElementById('new-game-btn');
      const loadGameBtn = document.getElementById('load-game-btn');
      const optionsBtn = document.getElementById('options-btn');
      const exitBtn = document.getElementById('exit-btn');
      
      if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
          this.hideMenu();
          this.game.startNewGame();
        });
      }
      
      if (loadGameBtn) {
        loadGameBtn.addEventListener('click', async () => {
          const loaded = await this.game.loadGame();
          if (loaded) {
            this.hideMenu();
          }
        });
      }
      
      if (optionsBtn) {
        optionsBtn.addEventListener('click', () => {
          window.logToConsole('Options not implemented yet', 'info');
        });
      }
      
      if (exitBtn) {
        exitBtn.addEventListener('click', () => {
          window.close();
        });
      }
      
      // Function keys
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
          // Help
          this.game.processCommand('help');
        } else if (e.key === 'F5') {
          // Save game
          this.game.processCommand('save');
        } else if (e.key === 'F8') {
          // Load game
          this.game.processCommand('load');
        } else if (e.key === 'F9') {
          // Pause/Resume
          if (this.game.state.settings.gamePaused) {
            this.game.processCommand('resume');
          } else {
            this.game.processCommand('pause');
          }
        } else if (e.key === 'Escape') {
          // Toggle menu
          this.toggleMenu();
        }
      });
    }
    
    updateDisplay() {
      // Update player stats
      if (this.elements.cashValue) {
        this.elements.cashValue.textContent = this.game.state.player.cash.toFixed(2);
      }
      
      if (this.elements.locationValue && this.game.state.currentCity) {
        this.elements.locationValue.textContent = this.game.state.currentCity;
      }
      
      // Update venue stats if there's a current venue
      if (this.game.state.currentVenue) {
        const venue = this.game.state.currentVenue;
        
        if (this.elements.customersToday) {
          const customers = this.game.customerManager ? 
                           this.game.customerManager.getCustomersByVenue(venue.id).length : 0;
          this.elements.customersToday.textContent = customers;
        }
        
        if (this.elements.revenueToday) {
          this.elements.revenueToday.textContent = venue.finances.dailyRevenue.toFixed(2);
        }
        
        if (this.elements.staffMorale) {
          const avgMorale = this.game.staffManager ? 
                           this.game.staffManager.getAverageStaffMorale(venue.id) : 0;
          
          let moraleText;
          if (avgMorale > 80) moraleText = 'Excellent';
          else if (avgMorale > 60) moraleText = 'Good';
          else if (avgMorale > 40) moraleText = 'Fair';
          else if (avgMorale > 20) moraleText = 'Poor';
          else moraleText = 'Terrible';
          
          this.elements.staffMorale.textContent = moraleText;
        }
        
        if (this.elements.venuePopularity) {
          let popularityText;
          const popularity = venue.stats.popularity;
          
          if (popularity > 80) popularityText = 'High';
          else if (popularity > 50) popularityText = 'Medium';
          else if (popularity > 20) popularityText = 'Low';
          else popularityText = 'Very Low';
          
          this.elements.venuePopularity.textContent = popularityText;
        }
        
        // Update staff list
        this.updateStaffList();
        
        // Update venue canvas
        this.updateVenueCanvas();
      }
    }
    
    updateStaffList() {
      if (!this.elements.staffList || !this.game.state.currentVenue) return;
      
      // Clear current list
      this.elements.staffList.innerHTML = '';
      
      // Get staff for current venue
      const staff = this.game.staffManager ? 
                   this.game.staffManager.getStaffByVenue(this.game.state.currentVenue.id) : [];
      
      if (staff.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No staff hired yet';
        this.elements.staffList.appendChild(emptyItem);
        return;
      }
      
      // Add each staff member
      staff.forEach(member => {
        const item = document.createElement('li');
        
        // Status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'status-indicator';
        statusIndicator.classList.add(member.isWorking ? 'working' : 'off-duty');
        item.appendChild(statusIndicator);
        
        // Staff info
        const info = document.createElement('span');
        info.textContent = `${member.name} (${member.type})`;
        item.appendChild(info);
        
        this.elements.staffList.appendChild(item);
      });
    }
    
    updateVenueCanvas() {
      if (!this.elements.venueCanvas || !this.game.state.currentVenue) return;
      
      const ctx = this.elements.venueCanvas.getContext('2d');
      const venue = this.game.state.currentVenue;
      
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, this.elements.venueCanvas.width, this.elements.venueCanvas.height);
      
      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      const gridSize = 30;
      
      // Vertical lines
      for (let x = 0; x <= this.elements.venueCanvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.elements.venueCanvas.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= this.elements.venueCanvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.elements.venueCanvas.width, y);
        ctx.stroke();
      }
      
      // Draw venue layout if available
      if (venue.layout) {
        this.drawVenueLayout(ctx, venue.layout, gridSize);
      }
      
      // Draw customers if available
      if (this.game.customerManager) {
        const customers = this.game.customerManager.getCustomersByVenue(venue.id);
        this.drawCustomers(ctx, customers, gridSize, venue.layout);
      }
      
      // Draw staff if available
      if (this.game.staffManager) {
        const staff = this.game.staffManager.getStaffByVenue(venue.id);
        this.drawStaff(ctx, staff, gridSize, venue.layout);
      }
    }
    
    drawVenueLayout(ctx, layout, gridSize) {
      const canvasWidth = this.elements.venueCanvas.width;
      const canvasHeight = this.elements.venueCanvas.height;
      
      // Scale factors
      const scaleX = canvasWidth / (layout.width * gridSize);
      const scaleY = canvasHeight / (layout.height * gridSize);
      
      // Draw entrance
      if (layout.entrance) {
        ctx.fillStyle = '#8B0000'; // Dark red
        ctx.fillRect(
          layout.entrance.x * gridSize * scaleX,
          layout.entrance.y * gridSize * scaleY,
          gridSize * scaleX,
          gridSize * scaleY
        );
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(
          'Entrance',
          layout.entrance.x * gridSize * scaleX,
          layout.entrance.y * gridSize * scaleY + 20
        );
      }
      
      // Draw bar
      if (layout.bar) {
        ctx.fillStyle = '#8B4513'; // Saddle brown
        ctx.fillRect(
          layout.bar.x * gridSize * scaleX,
          layout.bar.y * gridSize * scaleY,
          layout.bar.width * gridSize * scaleX,
          layout.bar.height * gridSize * scaleY
        );
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(
          'Bar',
          layout.bar.x * gridSize * scaleX + (layout.bar.width * gridSize * scaleX) / 2 - 10,
          layout.bar.y * gridSize * scaleY + (layout.bar.height * gridSize * scaleY) / 2 + 5
        );
      }
      
      // Draw tables
      if (layout.tables) {
        layout.tables.forEach(table => {
          // Different colors based on table size
          if (table.size === 'small') {
            ctx.fillStyle = '#2F4F4F'; // Dark slate gray
          } else if (table.size === 'medium') {
            ctx.fillStyle = '#556B2F'; // Dark olive green
          } else {
            ctx.fillStyle = '#4B0082'; // Indigo
          }
          
          ctx.fillRect(
            table.x * gridSize * scaleX,
            table.y * gridSize * scaleY,
            2 * gridSize * scaleX,
            2 * gridSize * scaleY
          );
        });
      }
      
      // Draw restrooms
      if (layout.restrooms) {
        ctx.fillStyle = '#4682B4'; // Steel blue
        ctx.fillRect(
          layout.restrooms.x * gridSize * scaleX,
          layout.restrooms.y * gridSize * scaleY,
          layout.restrooms.width * gridSize * scaleX,
          layout.restrooms.height * gridSize * scaleY
        );
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(
          'Restrooms',
          layout.restrooms.x * gridSize * scaleX,
          layout.restrooms.y * gridSize * scaleY + 10
        );
      }
      
      // Draw kitchen if available
      if (layout.kitchen) {
        ctx.fillStyle = '#CD853F'; // Peru
        ctx.fillRect(
          layout.kitchen.x * gridSize * scaleX,
          layout.kitchen.y * gridSize * scaleY,
          layout.kitchen.width * gridSize * scaleX,
          layout.kitchen.height * gridSize * scaleY
        );
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(
          'Kitchen',
          layout.kitchen.x * gridSize * scaleX + 10,
          layout.kitchen.y * gridSize * scaleY + 20
        );
      }
      
      // Draw dance floor if available
      if (layout.danceFloor) {
        ctx.fillStyle = '#9932CC'; // Dark orchid
        ctx.fillRect(
          layout.danceFloor.x * gridSize * scaleX,
          layout.danceFloor.y * gridSize * scaleY,
          layout.danceFloor.width * gridSize * scaleX,
          layout.danceFloor.height * gridSize * scaleY
        );
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(
          'Dance Floor',
          layout.danceFloor.x * gridSize * scaleX + 10,
          layout.danceFloor.y * gridSize * scaleY + 20
        );
      }
    }
    
    drawCustomers(ctx, customers, gridSize, layout) {
      if (!customers || customers.length === 0) return;
      
      const canvasWidth = this.elements.venueCanvas.width;
      const canvasHeight = this.elements.venueCanvas.height;
      
      // Scale factors
      const scaleX = canvasWidth / (layout.width * gridSize);
      const scaleY = canvasHeight / (layout.height * gridSize);
      
      // Draw each customer group
      customers.forEach(customer => {
        // Skip if customer doesn't have a position yet
        if (!customer.position) {
          // Assign a random position based on status
          customer.position = this.getRandomCustomerPosition(customer, layout);
        }
        
        // Color based on status
        let color;
        switch(customer.status) {
          case 'entering':
            color = '#FFD700'; // Gold
            break;
          case 'seated':
          case 'ordering':
            color = '#32CD32'; // Lime green
            break;
          case 'waiting':
            color = '#FF8C00'; // Dark orange
            break;
          case 'eating':
          case 'drinking':
            color = '#00BFFF'; // Deep sky blue
            break;
          case 'paying':
            color = '#6A5ACD'; // Slate blue
            break;
          case 'leaving':
            color = '#FF6347'; // Tomato
            break;
          default:
            color = '#FFFFFF'; // White
        }
        
        // Draw customer circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          customer.position.x * gridSize * scaleX,
          customer.position.y * gridSize * scaleY,
          5 + customer.groupSize, // Size based on group size
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    }
    
    getRandomCustomerPosition(customer, layout) {
      // Position depends on customer status
      let x, y;
      
      switch(customer.status) {
        case 'entering':
          // Near entrance
          x = layout.entrance.x + Math.random() * 2 - 1;
          y = layout.entrance.y + Math.random() * 2 + 1;
          break;
        case 'seated':
        case 'ordering':
        case 'waiting':
        case 'eating':
        case 'drinking':
          // Near an assigned table or random table if none assigned
          if (customer.assignedTable) {
            x = customer.assignedTable.x + Math.random();
            y = customer.assignedTable.y + Math.random();
          } else if (layout.tables && layout.tables.length > 0) {
            const table = layout.tables[Math.floor(Math.random() * layout.tables.length)];
            x = table.x + Math.random();
            y = table.y + Math.random();
          } else {
            // Fallback to random position
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'paying':
          // Near bar/counter
          if (layout.bar) {
            x = layout.bar.x + Math.random() * layout.bar.width;
            y = layout.bar.y + Math.random() * layout.bar.height;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'leaving':
          // Moving toward entrance
          x = layout.entrance.x + Math.random() * 2 - 1;
          y = layout.entrance.y + Math.random() * 2 - 1;
          break;
        default:
          // Random position
          x = Math.random() * layout.width;
          y = Math.random() * layout.height;
      }
      
      return { x, y };
    }
    
    drawStaff(ctx, staff, gridSize, layout) {
      if (!staff || staff.length === 0) return;
      
      const canvasWidth = this.elements.venueCanvas.width;
      const canvasHeight = this.elements.venueCanvas.height;
      
      // Scale factors
      const scaleX = canvasWidth / (layout.width * gridSize);
      const scaleY = canvasHeight / (layout.height * gridSize);
      
      // Draw each staff member
      staff.forEach(member => {
        // Skip if not working
        if (!member.isWorking) return;
        
        // Staff position based on type
        if (!member.position) {
          member.position = this.getStaffPosition(member, layout);
        }
        
        // Draw staff rectangle
        ctx.fillStyle = '#FF1493'; // Deep pink
        ctx.fillRect(
          member.position.x * gridSize * scaleX - 5,
          member.position.y * gridSize * scaleY - 5,
          10,
          10
        );
        
        // Draw staff label
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.fillText(
          member.type.charAt(0).toUpperCase(),
          member.position.x * gridSize * scaleX - 3,
          member.position.y * gridSize * scaleY + 3
        );
      });
    }
    
    getStaffPosition(staff, layout) {
      // Position depends on staff type
      let x, y;
      
      switch(staff.type) {
        case 'bartender':
          // At the bar
          if (layout.bar) {
            x = layout.bar.x + Math.random() * layout.bar.width;
            y = layout.bar.y + Math.random() * layout.bar.height;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'waiter':
          // Moving around tables
          if (layout.tables && layout.tables.length > 0) {
            const table = layout.tables[Math.floor(Math.random() * layout.tables.length)];
            x = table.x + Math.random() * 3 - 1.5;
            y = table.y + Math.random() * 3 - 1.5;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'cook':
          // In the kitchen
          if (layout.kitchen) {
            x = layout.kitchen.x + Math.random() * layout.kitchen.width;
            y = layout.kitchen.y + Math.random() * layout.kitchen.height;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'bouncer':
          // Near entrance
          x = layout.entrance.x;
          y = layout.entrance.y;
          break;
        case 'dj':
          // Near dance floor or bar
          if (layout.danceFloor) {
            x = layout.danceFloor.x + Math.random() * layout.danceFloor.width;
            y = layout.danceFloor.y;
          } else if (layout.bar) {
            x = layout.bar.x + layout.bar.width;
            y = layout.bar.y;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        default:
          // Random position
          x = Math.random() * layout.width;
          y = Math.random() * layout.height;
      }
      
      return { x, y };
    }
    
    showSuggestions(input) {
      if (!this.elements.suggestionsDiv) return;
      
      // Get suggestions from command processor
      const suggestions = this.game.commandProcessor.getCommandSuggestions(input);
      
      if (suggestions.length > 0) {
        this.elements.suggestionsDiv.textContent = suggestions.join(' | ');
        this.elements.suggestionsDiv.style.display = 'block';
      } else {
        this.hideSuggestions();
      }
    }
    
    hideSuggestions() {
      if (this.elements.suggestionsDiv) {
        this.elements.suggestionsDiv.style.display = 'none';
      }
    }
    
    handleTabCompletion() {
      if (!this.elements.commandInput || !this.elements.suggestionsDiv) return;
      
      const input = this.elements.commandInput.value.trim();
      
      if (input.length === 0) return;
      
      // Get suggestions
      const suggestions = this.game.commandProcessor.getCommandSuggestions(input);
      
      if (suggestions.length === 1) {
        // If only one suggestion, use it
        this.elements.commandInput.value = suggestions[0] + ' ';
      } else if (suggestions.length > 1) {
        // Find longest common prefix
        let commonPrefix = suggestions[0];
        
        for (let i = 1; i < suggestions.length; i++) {
          let j = 0;
          while (j < commonPrefix.length && j < suggestions[i].length && 
                 commonPrefix.charAt(j) === suggestions[i].charAt(j)) {
            j++;
          }
          commonPrefix = commonPrefix.substring(0, j);
        }
        
        // If common prefix is longer than current input, use it
        if (commonPrefix.length > input.length) {
          this.elements.commandInput.value = commonPrefix;
        }
      }
    }
    
    showMenu() {
      if (this.elements.mainMenu) {
        this.elements.mainMenu.style.display = 'block';
        this.menuVisible = true;
        
        // Pause the game
        if (this.game.timeManager && !this.game.state.settings.gamePaused) {
          this.game.timeManager.pauseGameClock();
        }
      }
    }
    
    hideMenu() {
      if (this.elements.mainMenu) {
        this.elements.mainMenu.style.display = 'none';
        this.menuVisible = false;
      }
    }
    
    toggleMenu() {
      if (this.menuVisible) {
        this.hideMenu();
      } else {
        this.showMenu();
      }
    }
  }
  
  module.exports = UIManager;