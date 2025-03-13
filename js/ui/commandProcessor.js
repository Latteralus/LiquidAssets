// Command Processor - Handles parsing and executing player commands

class CommandProcessor {
    constructor(game) {
      this.game = game;
      this.commands = {};
      this.registerCommands();
    }
  
    registerCommands() {
      // General commands
      this.commands.help = this.helpCommand.bind(this);
      this.commands.status = this.statusCommand.bind(this);
      this.commands.save = this.saveCommand.bind(this);
      this.commands.load = this.loadCommand.bind(this);
      this.commands.time = this.timeCommand.bind(this);
      this.commands.pause = this.pauseCommand.bind(this);
      this.commands.resume = this.resumeCommand.bind(this);
  
      // Venue management commands
      this.commands.venue = this.venueCommand.bind(this);
      this.commands.set = this.setCommand.bind(this);
      this.commands.upgrade = this.upgradeCommand.bind(this);
      this.commands.clean = this.cleanCommand.bind(this);
  
      // Staff commands
      this.commands.hire = this.hireCommand.bind(this);
      this.commands.fire = this.fireCommand.bind(this);
      this.commands.staff = this.staffCommand.bind(this);
      this.commands.train = this.trainCommand.bind(this);
  
      // Inventory commands
      this.commands.inventory = this.inventoryCommand.bind(this);
      this.commands.order = this.orderCommand.bind(this);
      this.commands.repair = this.repairCommand.bind(this);
  
      // Financial commands
      this.commands.finances = this.financesCommand.bind(this);
      this.commands.price = this.priceCommand.bind(this);
  
      // City commands
      this.commands.city = this.cityCommand.bind(this);
  
      // Navigation commands
      this.commands.go = this.goCommand.bind(this);
    }
  
    processCommand(commandText) {
      // Parse the command text
      const parts = commandText.trim().toLowerCase().split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);
  
      // Log the command
      window.logToConsole(`> ${commandText}`, '');
  
      // Execute the command if it exists
      if (this.commands[command]) {
        this.commands[command](args);
      } else {
        window.logToConsole(`Unknown command: ${command}. Type 'help' for a list of commands.`, 'error');
      }
    }
  
    getCommandSuggestions(input) {
      const inputLower = input.toLowerCase();
      const suggestions = [];
  
      // Check direct command matches
      for (const cmd in this.commands) {
        if (cmd.startsWith(inputLower)) {
          suggestions.push(cmd);
        }
      }
  
      // Check compound commands
      if ('help'.startsWith(inputLower)) {
        Object.keys(this.commands).forEach(cmd => {
          if (cmd !== 'help') {
            suggestions.push(`help ${cmd}`);
          }
        });
      } else if (inputLower.startsWith('help ')) {
        const subCommand = inputLower.substring(5);
        for (const cmd in this.commands) {
          if (cmd.startsWith(subCommand)) {
            suggestions.push(`help ${cmd}`);
          }
        }
      } else if (inputLower.startsWith('set ')) {
        const settingCommands = ['name', 'hours', 'music', 'lighting', 'entrance'];
        const subCommand = inputLower.substring(4);
        settingCommands.forEach(setting => {
          if (setting.startsWith(subCommand)) {
            suggestions.push(`set ${setting}`);
          }
        });
      } else if (inputLower.startsWith('hire ')) {
        const subCommand = inputLower.substring(5);
        const staffTypes = ['bartender', 'waiter', 'cook', 'bouncer', 'dj', 'manager', 'cleaner'];
        staffTypes.forEach(type => {
          if (type.startsWith(subCommand)) {
            suggestions.push(`hire ${type}`);
          }
        });
      }
  
      return suggestions;
    }
  
    // Command implementations
  
    helpCommand(args) {
      if (args.length === 0) {
        window.logToConsole("Available commands:", 'info');
        window.logToConsole("- General: help, status, save, load, time, pause, resume", 'info');
        window.logToConsole("- Venue: venue, set, upgrade, clean", 'info');
        window.logToConsole("- Staff: hire, fire, staff, train", 'info');
        window.logToConsole("- Inventory: inventory, order, repair", 'info');
        window.logToConsole("- Finances: finances, price", 'info');
        window.logToConsole("- City: city, go", 'info');
        window.logToConsole("Type 'help <command>' for more details on a specific command.", 'info');
      } else {
        // Show help for a specific command
        const command = args[0];
        switch (command) {
          case 'venue':
            window.logToConsole("venue - View information about your current venue", 'info');
            window.logToConsole("venue list - List all your venues", 'info');
            window.logToConsole("venue switch <id> - Switch to a different venue", 'info');
            break;
          case 'set':
            window.logToConsole("set name <name> - Rename your venue", 'info');
            window.logToConsole("set hours <opening> <closing> - Set operating hours (0-23)", 'info');
            window.logToConsole("set music <volume> - Set music volume (0-100)", 'info');
            window.logToConsole("set lighting <level> - Set lighting level (0-100)", 'info');
            window.logToConsole("set entrance <fee> - Set entrance fee", 'info');
            break;
          case 'hire':
            window.logToConsole("hire <type> - Browse available staff of specified type", 'info');
            window.logToConsole("hire <type> <id> - Hire specific staff member by ID", 'info');
            window.logToConsole("Available types: bartender, waiter, cook, bouncer, dj, manager, cleaner", 'info');
            break;
          case 'staff':
            window.logToConsole("staff - List all staff at current venue", 'info');
            window.logToConsole("staff <id> - View details of a specific staff member", 'info');
            break;
          case 'inventory':
            window.logToConsole("inventory - Show current inventory", 'info');
            window.logToConsole("inventory drinks - Show drink inventory", 'info');
            window.logToConsole("inventory food - Show food inventory", 'info');
            window.logToConsole("inventory equipment - Show equipment", 'info');
            break;
          case 'finances':
            window.logToConsole("finances - Show financial summary", 'info');
            window.logToConsole("finances daily - Show daily financial report", 'info');
            window.logToConsole("finances weekly - Show weekly financial report", 'info');
            window.logToConsole("finances monthly - Show monthly financial report", 'info');
            break;
          default:
            window.logToConsole(`No detailed help available for '${command}'.`, 'error');
        }
      }
    }
  
    statusCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      const venue = this.game.state.currentVenue;
  
      window.logToConsole("===== Venue Status =====", 'info');
      window.logToConsole(`Name: ${venue.name}`, 'info');
      window.logToConsole(`Type: ${venue.type}`, 'info');
      window.logToConsole(`City: ${venue.city}`, 'info');
      window.logToConsole(`Size: ${venue.size}`, 'info');
      window.logToConsole(`Popularity: ${venue.stats.popularity.toFixed(1)}%`, 'info');
      window.logToConsole(`Customer Satisfaction: ${venue.stats.customerSatisfaction.toFixed(1)}%`, 'info');
      window.logToConsole(`Cleanliness: ${venue.stats.cleanliness.toFixed(1)}%`, 'info');
      window.logToConsole(`Atmosphere: ${venue.stats.atmosphere.toFixed(1)}%`, 'info');
      window.logToConsole(`Service Quality: ${venue.stats.serviceQuality.toFixed(1)}%`, 'info');
      window.logToConsole(`Total Customers Served: ${venue.stats.totalCustomersServed}`, 'info');
      window.logToConsole(`Staff Count: ${venue.staff.length}`, 'info');
      window.logToConsole(`Operating Hours: ${venue.settings.openingHour}:00 - ${venue.settings.closingHour}:00`, 'info');
      window.logToConsole(`Music Volume: ${venue.settings.musicVolume}%`, 'info');
      window.logToConsole(`Lighting Level: ${venue.settings.lightingLevel}%`, 'info');
      window.logToConsole(`Entrance Fee: €${venue.settings.entranceFee.toFixed(2)}`, 'info');
      window.logToConsole(`Monthly Rent: €${venue.finances.rentPerMonth.toFixed(2)}`, 'info');
  
      // Current customer count
      const currentCustomers = this.game.customerManager ?
        this.game.customerManager.getCustomersByVenue(venue.id).length : 0;
      window.logToConsole(`Current Customers: ${currentCustomers}`, 'info');
    }
  
    saveCommand(args) {
      this.game.saveGame();
    }
  
    loadCommand(args) {
      this.game.loadGame();
    }
  
    timeCommand(args) {
      const gameTime = this.game.timeManager.getGameTime();
      const dayOfWeek = this.game.timeManager.getDayOfWeekName();
      window.logToConsole(`Current game time: ${this.game.timeManager.getFormattedDate()} (${dayOfWeek})`, 'info');
    }
  
    pauseCommand(args) {
      this.game.timeManager.pauseGameClock();
      window.logToConsole("Game paused.", 'info');
    }
  
    resumeCommand(args) {
      this.game.timeManager.resumeGameClock();
      window.logToConsole("Game resumed.", 'info');
    }
  
    venueCommand(args) {
      if (args.length === 0) {
        // Show current venue info
        this.statusCommand([]);
      } else if (args[0] === 'list') {
        // List all venues
        const venues = this.game.state.player.venues;
        window.logToConsole("Your venues:", 'info');
        venues.forEach(venue => {
          window.logToConsole(`ID: ${venue.id} - ${venue.name} (${venue.type} in ${venue.city})`, 'info');
        });
      } else if (args[0] === 'switch' && args[1]) {
        // Switch to a different venue
        const venueId = args[1];
        const success = this.game.venueManager.setCurrentVenue(venueId);
  
        if (success) {
          window.logToConsole(`Switched to ${this.game.state.currentVenue.name}.`, 'success');
        } else {
          window.logToConsole(`Venue with ID ${venueId} not found.`, 'error');
        }
      } else if (args[0] === 'create' && args.length >= 3) {
        // Create a new venue
        const name = args[1];
        const type = args[2];
        const city = args.length >= 4 ? args[3] : this.game.state.currentCity;
  
        const venue = this.game.venueManager.createNewVenue(name, type, city);
  
        if (venue) {
          window.logToConsole(`Created new venue: ${venue.name} (${venue.type} in ${venue.city})`, 'success');
          this.game.state.currentVenue = venue;
        } else {
          window.logToConsole("Failed to create venue. Check type and city.", 'error');
        }
      } else if (args[0] === 'sell' && args[1]) {
        // Sell a venue
        const venueId = args[1];
        const success = this.game.venueManager.sellVenue(venueId);
  
        if (success) {
          window.logToConsole("Venue sold successfully.", 'success');
        } else {
          window.logToConsole(`Failed to sell venue with ID ${venueId}.`, 'error');
        }
      } else {
        window.logToConsole("Invalid venue command. Type 'help venue' for usage.", 'error');
      }
    }
  
    setCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      if (args.length < 2) {
        window.logToConsole("Invalid set command. Type 'help set' for usage.", 'error');
        return;
      }
  
      const venue = this.game.state.currentVenue;
      const setting = args[0];
  
      switch (setting) {
        case 'name': {
          const name = args.slice(1).join(' ');
          this.game.venueManager.setVenueName(venue.id, name);
          break;
        }
        case 'hours': {
          if (args.length < 3) {
            window.logToConsole("Please specify opening and closing hours (0-23).", 'error');
            return;
          }
          const opening = parseInt(args[1]);
          const closing = parseInt(args[2]);
          this.game.venueManager.setVenueHours(venue.id, opening, closing);
          break;
        }
        case 'music': {
          if (args.length < 2) {
            window.logToConsole("Please specify music volume (0-100).", 'error');
            return;
          }
          const volume = parseInt(args[1]);
          this.game.venueManager.setMusicVolume(venue.id, volume);
          break;
        }
        case 'lighting': {
          if (args.length < 2) {
            window.logToConsole("Please specify lighting level (0-100).", 'error');
            return;
          }
          const level = parseInt(args[1]);
          this.game.venueManager.setLightingLevel(venue.id, level);
          break;
        }
        case 'entrance': {
          if (args.length < 2) {
            window.logToConsole("Please specify entrance fee.", 'error');
            return;
          }
          const fee = parseFloat(args[1]);
          this.game.venueManager.setEntranceFee(venue.id, fee);
          break;
        }
        default: {
          window.logToConsole(`Unknown setting: ${setting}. Type 'help set' for usage.`, 'error');
        }
      }
    }
  
    upgradeCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      if (args.length === 0 || args[0] === 'venue') {
        // Upgrade venue size
        this.game.venueManager.upgradeVenueSize(this.game.state.currentVenue.id);
      } else if (args[0] === 'equipment' && args[1]) {
        // Upgrade specific equipment
        const equipmentName = args.slice(1).join(' ');
        this.game.inventoryManager.upgradeEquipment(this.game.state.currentVenue.id, equipmentName);
      } else {
        window.logToConsole("Invalid upgrade command. Use 'upgrade venue' or 'upgrade equipment <name>'.", 'error');
      }
    }
  
    cleanCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      this.game.venueManager.cleanVenue(this.game.state.currentVenue.id);
    }
  
    hireCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      if (args.length === 0) {
        window.logToConsole("Please specify a staff type. Available types: bartender, waiter, cook, bouncer, dj, manager, cleaner", 'error');
        return;
      }
  
      const staffType = args[0];
  
      if (args.length === 1) {
        // Show available staff of the specified type
        const staffPool = this.game.staffManager.getStaffPoolByType(staffType);
  
        if (staffPool.length === 0) {
          window.logToConsole(`No ${staffType}s are currently available for hire.`, 'info');
          return;
        }
  
        window.logToConsole(`Available ${staffType}s:`, 'info');
        staffPool.forEach(staff => {
          // Calculate average skill
          const avgSkill = Object.values(staff.skills).reduce((sum, val) => sum + val, 0) /
            Object.values(staff.skills).length;
  
          window.logToConsole(`ID: ${staff.id} - ${staff.name} - €${staff.wage}/week - Avg Skill: ${avgSkill.toFixed(1)}`, 'info');
        });
      } else if (args.length === 2) {
        // Hire the specified staff
        const staffId = args[1];
        this.game.staffManager.hireStaff(staffId, this.game.state.currentVenue.id);
      } else {
        window.logToConsole("Invalid hire command. Type 'help hire' for usage.", 'error');
      }
    }
  
    fireCommand(args) {
      if (args.length === 0) {
        window.logToConsole("Please specify a staff ID to fire.", 'error');
        return;
      }
  
      const staffId = args[0];
      this.game.staffManager.fireStaff(staffId);
    }
  
    staffCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      if (args.length === 0) {
        // Show all staff at current venue
        const staff = this.game.staffManager.getStaffByVenue(this.game.state.currentVenue.id);
  
        if (staff.length === 0) {
          window.logToConsole("You don't have any staff at this venue.", 'info');
          return;
        }
  
        window.logToConsole("Your staff:", 'info');
        staff.forEach(member => {
          window.logToConsole(`ID: ${member.id} - ${member.name} - ${member.type} - €${member.wage}/week - Morale: ${member.morale.toFixed(1)}%`, 'info');
        });
      } else {
        // Show details of specific staff member
        const staffId = args[0];
        const staff = this.game.staffManager.getStaff(staffId);
  
        if (!staff) {
          window.logToConsole(`Staff member with ID ${staffId} not found.`, 'error');
          return;
        }
  
        window.logToConsole(`===== ${staff.name} (${staff.type}) =====`, 'info');
        window.logToConsole(`Wage: €${staff.wage}/week`, 'info');
        window.logToConsole(`Morale: ${staff.morale.toFixed(1)}%`, 'info');
        window.logToConsole(`Experience: ${staff.experience} years`, 'info');
        window.logToConsole("Skills:", 'info');
  
        Object.entries(staff.skills).forEach(([skill, value]) => {
          window.logToConsole(`- ${skill}: ${value}`, 'info');
        });
  
        window.logToConsole("Personality:", 'info');
        Object.entries(staff.personality).forEach(([trait, value]) => {
          const description = value > 0 ? "Positive" : value < 0 ? "Negative" : "Neutral";
          window.logToConsole(`- ${trait}: ${description} (${value})`, 'info');
        });
  
        window.logToConsole("Working Days:", 'info');
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const workingDays = dayNames.filter((_, index) => staff.workingDays[index]);
        window.logToConsole(workingDays.join(', '), 'info');
  
        window.logToConsole(`Working Hours: ${staff.workingHours.start}:00 - ${staff.workingHours.end}:00`, 'info');
      }
    }
  
    trainCommand(args) {
      if (args.length < 2) {
        window.logToConsole("Please specify a staff ID and skill to train.", 'error');
        return;
      }
  
      const staffId = args[0];
      const skill = args[1];
  
      this.game.staffManager.trainStaff(staffId, skill);
    }
  
    inventoryCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      const venue = this.game.state.currentVenue;
  
      if (args.length === 0) {
        // Show inventory summary
        const summary = this.game.inventoryManager.getInventorySummary(venue.id);
  
        if (!summary) {
          window.logToConsole("No inventory found.", 'error');
          return;
        }
  
        window.logToConsole("===== Inventory Summary =====", 'info');
        window.logToConsole(`Total Items: ${summary.totalItems}`, 'info');
        window.logToConsole(`Total Value: €${summary.totalValue.toFixed(2)}`, 'info');
  
        Object.entries(summary.categories).forEach(([category, data]) => {
          window.logToConsole(`${category}: ${data.itemCount} items, ${data.totalStock} units, €${data.totalValue.toFixed(2)} value`, 'info');
        });
  
        window.logToConsole("Type 'inventory <category>' to see details.", 'info');
      } else {
        // Show specific inventory category
        const category = args[0];
  
        if (!venue.inventory || !venue.inventory[category]) {
          window.logToConsole(`No ${category} inventory found.`, 'error');
          return;
        }
  
        window.logToConsole(`===== ${category.charAt(0).toUpperCase() + category.slice(1)} Inventory =====`, 'info');
  
        venue.inventory[category].forEach(item => {
          const stock = item.stock || item.quantity || 0;
          const condition = item.condition !== undefined ? ` - Condition: ${item.condition.toFixed(1)}%` : '';
          const quality = item.quality ? ` - Quality: ${item.quality}` : '';
  
          if (category === 'drinks' || category === 'food') {
            window.logToConsole(`${item.name} - Stock: ${stock} - Cost: €${item.costPrice.toFixed(2)} - Sell: €${item.sellPrice.toFixed(2)}`, 'info');
          } else if (category === 'equipment') {
            window.logToConsole(`${item.name} - Quantity: ${stock}${quality}${condition}`, 'info');
          }
        });
      }
    }
  
    orderCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      if (args.length < 3) {
        window.logToConsole("Please specify item type, name, and quantity. Example: order drinks Beer 10", 'error');
        return;
      }
  
      const itemType = args[0];
      const quantity = parseInt(args[args.length - 1]);
      const itemName = args.slice(1, -1).join(' ');
  
      if (isNaN(quantity) || quantity <= 0) {
        window.logToConsole("Quantity must be a positive number.", 'error');
        return;
      }
  
      this.game.inventoryManager.orderInventory(this.game.state.currentVenue.id, itemType, itemName, quantity);
    }
  
    repairCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      if (args.length === 0) {
        window.logToConsole("Please specify the equipment to repair.", 'error');
        return;
      }
  
      const equipmentName = args.join(' ');
      this.game.inventoryManager.repairEquipment(this.game.state.currentVenue.id, equipmentName);
    }
  
    financesCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      const venue = this.game.state.currentVenue;
  
      if (args.length === 0) {
        // Show basic finances
        window.logToConsole("===== Financial Summary =====", 'info');
        window.logToConsole(`Current Cash: €${this.game.state.player.cash.toFixed(2)}`, 'info');
        window.logToConsole(`Daily Revenue: €${venue.finances.dailyRevenue.toFixed(2)}`, 'info');
        window.logToConsole(`Daily Expenses: €${venue.finances.dailyExpenses.toFixed(2)}`, 'info');
        window.logToConsole(`Weekly Revenue: €${venue.finances.weeklyRevenue.toFixed(2)}`, 'info');
        window.logToConsole(`Weekly Expenses: €${venue.finances.weeklyExpenses.toFixed(2)}`, 'info');
        window.logToConsole(`Monthly Revenue: €${venue.finances.monthlyRevenue.toFixed(2)}`, 'info');
        window.logToConsole(`Monthly Expenses: €${venue.finances.monthlyExpenses.toFixed(2)}`, 'info');
        window.logToConsole(`Monthly Rent: €${venue.finances.rentPerMonth.toFixed(2)}`, 'info');
  
        // Calculate profit margin
        const totalRevenue = venue.finances.monthlyRevenue;
        const totalExpenses = venue.finances.monthlyExpenses;
        const profit = totalRevenue - totalExpenses;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
        window.logToConsole(`Monthly Profit: €${profit.toFixed(2)} (${margin.toFixed(1)}% margin)`, 'info');
      } else if (args[0] === 'daily' || args[0] === 'weekly' || args[0] === 'monthly') {
        // Show detailed financial report
        const period = args[0];
  
        if (!this.game.financialManager.reportingManager) {
          window.logToConsole("Financial reporting not available.", 'error');
          return;
        }
  
        const report = this.game.financialManager.getFinancialReports(period)[0];
  
        if (!report) {
          window.logToConsole(`No ${period} reports available yet.`, 'info');
          return;
        }
  
        window.logToConsole(`===== ${period.charAt(0).toUpperCase() + period.slice(1)} Financial Report =====`, 'info');
        window.logToConsole(`Period: ${report.date}`, 'info');
        window.logToConsole(`Revenue: €${report.revenue.toFixed(2)}`, 'info');
        window.logToConsole(`Expenses: €${report.expenses.toFixed(2)}`, 'info');
        window.logToConsole(`Profit: €${report.profit.toFixed(2)}`, 'info');
  
        window.logToConsole("Revenue Breakdown:", 'info');
        Object.entries(report.revenueBreakdown).forEach(([category, amount]) => {
          window.logToConsole(`- ${category}: €${amount.toFixed(2)}`, 'info');
        });
  
        window.logToConsole("Expense Breakdown:", 'info');
        Object.entries(report.expenseBreakdown).forEach(([category, amount]) => {
          window.logToConsole(`- ${category}: €${amount.toFixed(2)}`, 'info');
        });
      } else {
        window.logToConsole("Invalid finances command. Use 'finances', 'finances daily', 'finances weekly', or 'finances monthly'.", 'error');
      }
    }
  
    priceCommand(args) {
      if (!this.game.state.currentVenue) {
        window.logToConsole("You don't have an active venue.", 'error');
        return;
      }
  
      if (args.length < 3) {
        window.logToConsole("Please specify item type, name, and new price. Example: price drinks Beer 5.50", 'error');
        return;
      }
  
      const itemType = args[0];
      const price = parseFloat(args[args.length - 1]);
      const itemName = args.slice(1, -1).join(' ');
  
      if (isNaN(price) || price < 0) {
        window.logToConsole("Price must be a non-negative number.", 'error');
        return;
      }
  
      this.game.revenueManager.adjustItemPrice(this.game.state.currentVenue, itemType, itemName, price);
    }
  
    cityCommand(args) {
      if (args.length === 0) {
        // Show information about current city
        const city = this.game.cityManager.getCurrentCity();
  
        if (!city) {
          window.logToConsole("No current city.", 'error');
          return;
        }
  
        window.logToConsole(`===== ${city.name} =====`, 'info');
        window.logToConsole(`Popularity: ${city.popularity}`, 'info');
        window.logToConsole(`Rent Multiplier: ${city.rentMultiplier.toFixed(1)}x`, 'info');
        window.logToConsole(`Wage Multiplier: ${city.wageMultiplier.toFixed(1)}x`, 'info');
        window.logToConsole(`Customer Affluence: ${city.customerAffluence.toFixed(1)}x`, 'info');
  
        // Show regulations
        window.logToConsole("Regulations:", 'info');
        window.logToConsole(`- Opening Hours: ${city.regulations.openingHoursRestriction.earliest}:00 to ${city.regulations.openingHoursRestriction.latest}:00`, 'info');
        window.logToConsole(`- Alcohol License Cost: €${city.regulations.alcoholLicenseCost}`, 'info');
        window.logToConsole(`- Max Noise Level: ${city.regulations.maxNoiseLevelAllowed}/100`, 'info');
        window.logToConsole(`- Health Inspection Frequency: Every ${city.regulations.healthInspectionFrequency} days`, 'info');
  
        // Show venues in this city
        const venuesInCity = this.game.cityManager.getVenuesInCity(city.name);
        window.logToConsole(`Venues in ${city.name}: ${venuesInCity.length}`, 'info');
      } else if (args[0] === 'list') {
        // List all cities
        const cities = this.game.cityManager.getCities();
  
        window.logToConsole("Available cities:", 'info');
        Object.values(cities).forEach(city => {
          const currentMarker = city.name === this.game.state.currentCity ? " (current)" : "";
          window.logToConsole(`${city.name}${currentMarker} - Popularity: ${city.popularity} - Customer Affluence: ${city.customerAffluence.toFixed(1)}x`, 'info');
        });
      } else if (args[0] === 'go' && args[1]) {
        // Travel to a new city
        const cityName = args[1];
        const success = this.game.cityManager.setCurrentCity(cityName);
  
        if (success) {
          window.logToConsole(`Traveled to ${cityName}.`, 'success');
        } else {
          window.logToConsole(`City ${cityName} not found.`, 'error');
        }
      } else {
        window.logToConsole("Invalid city command. Use 'city', 'city list', or 'city go <name>'.", 'error');
      }
    }
  
    goCommand(args) {
      if (args.length === 0) {
        window.logToConsole("Please specify where to go. Example: go london", 'error');
        return;
      }
  
      const destination = args[0].toLowerCase();
  
      // Check if it's a city name
      const cityNames = this.game.cityManager ?
        Object.keys(this.game.cityManager.getCities()).map(c => c.toLowerCase()) : [];
  
      if (cityNames.includes(destination)) {
        // Find the actual city name with proper capitalization
        const properCityName = Object.keys(this.game.cityManager.getCities()).find(
          c => c.toLowerCase() === destination
        );
  
        // Travel to that city
        this.cityCommand(['go', properCityName]);
      } else {
        window.logToConsole(`Unknown destination: ${args[0]}`, 'error');
      }
    }
  }
  
  module.exports = CommandProcessor;
  