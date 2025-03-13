// Event Manager - Handles random events and scheduled occurrences

class EventManager {
    constructor(game) {
      this.game = game;
      this.events = [];
      this.eventHistory = [];
      this.eventProbability = 0.1; // 10% chance of event per check
    }
    
    scheduleEvent(event) {
      // Add a new event to the queue
      this.events.push(event);
    }
    
    cancelEvent(eventId) {
      // Remove an event from the queue
      const index = this.events.findIndex(e => e.id === eventId);
      if (index !== -1) {
        this.events.splice(index, 1);
        return true;
      }
      return false;
    }
    
    checkForRandomEvents() {
      // Check scheduled events
      this.checkScheduledEvents();
      
      // Random event check - don't run every time, but occasionally based on time passing
      if (Math.random() > this.eventProbability) return;
      
      // Pick a random event category
      const eventCategories = ['customer', 'staff', 'venue', 'city', 'financial'];
      const category = eventCategories[Math.floor(Math.random() * eventCategories.length)];
      
      // Pick an event from the category
      switch(category) {
        case 'customer':
          this.triggerCustomerEvent();
          break;
        case 'staff':
          this.triggerStaffEvent();
          break;
        case 'venue':
          this.triggerVenueEvent();
          break;
        case 'city':
          this.triggerCityEvent();
          break;
        case 'financial':
          this.triggerFinancialEvent();
          break;
      }
    }
    
    checkScheduledEvents() {
      // Skip if no events scheduled
      if (this.events.length === 0) return;
      
      const currentTime = this.game.timeManager.getGameTime();
      
      // Check each event to see if it's time to trigger it
      for (let i = this.events.length - 1; i >= 0; i--) {
        const event = this.events[i];
        
        if (this.isEventDue(event, currentTime)) {
          // Trigger the event
          this.triggerEvent(event);
          
          // Remove from queue if it's not recurring
          if (!event.recurring) {
            this.events.splice(i, 1);
          }
          
          // Add to history
          this.eventHistory.push({
            ...event,
            triggeredAt: { ...currentTime }
          });
        }
      }
    }
    
    isEventDue(event, currentTime) {
      // Check if the scheduled date/time has passed
      if (event.scheduledYear !== undefined && currentTime.year < event.scheduledYear) return false;
      if (event.scheduledMonth !== undefined && currentTime.month < event.scheduledMonth) return false;
      if (event.scheduledDay !== undefined && currentTime.day < event.scheduledDay) return false;
      if (event.scheduledHour !== undefined && currentTime.hour < event.scheduledHour) return false;
      
      return true;
    }
    
    triggerEvent(event) {
      window.logToConsole(`Event: ${event.description}`, 'info');
      
      // Handle the event based on its type
      switch(event.type) {
        case 'health_inspection':
          this.handleHealthInspection(event);
          break;
        case 'equipment_failure':
          this.handleEquipmentFailure(event);
          break;
        case 'staff_event':
          this.handleStaffEvent(event);
          break;
        case 'customer_event':
          this.handleCustomerEvent(event);
          break;
        case 'financial_event':
          this.handleFinancialEvent(event);
          break;
        case 'city_event':
          this.handleCityEvent(event);
          break;
      }
    }
    
    handleHealthInspection(event) {
      const venue = this.game.venueManager.getVenue(event.venueId);
      if (!venue) return;
      
      window.logToConsole("Health inspector has arrived for a surprise inspection!", 'warning');
      
      // Inspector checks cleanliness and equipment condition
      const cleanlinessScore = venue.stats.cleanliness;
      
      // Calculate equipment condition average if available
      let equipmentScore = 0;
      let equipmentCount = 0;
      
      if (venue.inventory && venue.inventory.equipment) {
        venue.inventory.equipment.forEach(equipment => {
          equipmentScore += equipment.condition;
          equipmentCount++;
        });
        equipmentScore = equipmentCount > 0 ? equipmentScore / equipmentCount : 0;
      }
      
      // Combine scores (60% cleanliness, 40% equipment)
      const overallScore = (cleanlinessScore * 0.6) + (equipmentScore * 0.4);
      
      // Determine results
      if (overallScore >= 80) {
        window.logToConsole("Health inspection passed with flying colors! This will boost your reputation.", 'success');
        venue.stats.popularity += 5;
      } else if (overallScore >= 60) {
        window.logToConsole("Health inspection passed, but with some minor issues noted.", 'success');
        venue.stats.popularity += 2;
      } else if (overallScore >= 40) {
        // Failed but not critically
        window.logToConsole("Health inspection failed. You must address cleanliness issues immediately.", 'error');
        venue.stats.popularity -= 5;
        
        // Fine
        const fine = 200 + Math.round((60 - overallScore) * 10);
        this.game.state.player.cash -= fine;
        window.logToConsole(`You've been fined €${fine} for health code violations.`, 'error');
        
        // Record transaction
        if (this.game.financialManager) {
          this.game.financialManager.recordTransaction({
            type: 'expense',
            category: 'fines',
            subcategory: 'health_inspection',
            amount: fine,
            date: { ...this.game.timeManager.getGameTime() },
            venueId: venue.id
          });
        }
      } else {
        // Critical failure
        window.logToConsole("Health inspection failed critically! Your venue has been temporarily closed!", 'error');
        venue.stats.popularity -= 15;
        
        // Heavy fine
        const fine = 500 + Math.round((40 - overallScore) * 20);
        this.game.state.player.cash -= fine;
        window.logToConsole(`You've been fined €${fine} for serious health code violations.`, 'error');
        
        // Record transaction
        if (this.game.financialManager) {
          this.game.financialManager.recordTransaction({
            type: 'expense',
            category: 'fines',
            subcategory: 'health_inspection',
            amount: fine,
            date: { ...this.game.timeManager.getGameTime() },
            venueId: venue.id
          });
        }
        
        // Temporarily close the venue (future feature)
      }
      
      // Schedule next inspection
      if (this.game.cityManager) {
        this.game.cityManager.scheduleHealthInspection(venue.city, venue.id);
      }
    }
    
    handleEquipmentFailure(event) {
      const venue = this.game.venueManager.getVenue(event.venueId);
      if (!venue || !venue.inventory || !venue.inventory.equipment) return;
      
      // Find the equipment
      const equipment = venue.inventory.equipment.find(eq => eq.name === event.equipmentName);
      if (!equipment) return;
      
      // Equipment breaks down
      window.logToConsole(`Your ${event.equipmentName} has broken down and needs repairs!`, 'error');
      equipment.condition = 0;
      
      // Effect on venue
      if (event.equipmentName === 'Kitchen Equipment') {
        window.logToConsole("You can't serve food until it's repaired!", 'error');
        // Future feature: temporarily disable food service
      } else if (event.equipmentName === 'Sound System') {
        window.logToConsole("The atmosphere in your venue has suffered due to the broken sound system.", 'error');
        venue.stats.atmosphere = Math.max(0, venue.stats.atmosphere - 20);
      } else if (event.equipmentName === 'Lighting Rig') {
        window.logToConsole("The venue's lighting has failed, affecting the atmosphere.", 'error');
        venue.stats.atmosphere = Math.max(0, venue.stats.atmosphere - 15);
      }
    }
    
    handleStaffEvent(event) {
      // Implement staff-specific event handling
      const staff = this.game.staffManager.getStaff(event.staffId);
      if (!staff) return;
      
      // Handle based on event subtype
      switch(event.subtype) {
        case 'sick_day':
          window.logToConsole(`${staff.name} has called in sick today.`, 'warning');
          staff.isWorking = false;
          break;
        case 'quit':
          window.logToConsole(`${staff.name} has quit unexpectedly!`, 'error');
          this.game.staffManager.fireStaff(staff.id);
          break;
        case 'raise_request':
          const raiseAmount = Math.round(staff.wage * 0.1); // 10% raise
          window.logToConsole(`${staff.name} is requesting a raise of €${raiseAmount}/week.`, 'warning');
          // Future feature: player decision to grant raise
          break;
      }
    }
    
    handleCustomerEvent(event) {
      // Implement customer-specific event handling
      const venue = this.game.venueManager.getVenue(event.venueId);
      if (!venue) return;
      
      // Handle based on event subtype
      switch(event.subtype) {
        case 'vip_visit':
          window.logToConsole("A VIP customer has visited your venue! Their positive review has boosted your popularity.", 'success');
          venue.stats.popularity = Math.min(100, venue.stats.popularity + 5);
          break;
        case 'complaint':
          window.logToConsole("A customer has filed a complaint about your venue.", 'error');
          venue.stats.popularity = Math.max(0, venue.stats.popularity - 3);
          break;
        case 'food_poisoning':
          window.logToConsole("A customer has reported food poisoning from your venue!", 'error');
          venue.stats.popularity = Math.max(0, venue.stats.popularity - 10);
          // Future feature: potential fine/closure
          break;
      }
    }
    
    handleFinancialEvent(event) {
      // Implement financial event handling
      const venue = this.game.venueManager.getVenue(event.venueId);
      if (!venue) return;
      
      // Handle based on event subtype
      switch(event.subtype) {
        case 'tax_audit':
          window.logToConsole("Your business is being audited by tax authorities.", 'warning');
          // Future feature: check financial records, potential fine
          break;
        case 'price_increase':
          window.logToConsole(`The price of ${event.itemType} has increased due to market changes.`, 'warning');
          // Increase cost prices
          if (venue.inventory && venue.inventory[event.itemType]) {
            venue.inventory[event.itemType].forEach(item => {
              item.costPrice = Math.round(item.costPrice * 1.2 * 100) / 100; // 20% increase
            });
          }
          break;
        case 'rent_increase':
          const increase = Math.round(venue.finances.rentPerMonth * 0.1);
          window.logToConsole(`Your landlord has increased the rent by €${increase}/month.`, 'warning');
          venue.finances.rentPerMonth += increase;
          break;
      }
    }
    
    handleCityEvent(event) {
      // Implement city-level event handling
      const city = this.game.cityManager.getCity(event.city);
      if (!city) return;
      
      // Handle based on event subtype
      switch(event.subtype) {
        case 'festival':
          window.logToConsole(`A festival is happening in ${event.city}! More customers are visiting the area.`, 'success');
          city.popularity = Math.min(100, city.popularity + 10);
          break;
        case 'construction':
          window.logToConsole(`Major construction work has started near your venue in ${event.city}, affecting customer access.`, 'warning');
          city.popularity = Math.max(0, city.popularity - 5);
          break;
        case 'regulation_change':
          window.logToConsole(`New regulations have been introduced in ${event.city} affecting ${event.regulationType}.`, 'warning');
          // Update relevant regulation
          if (event.regulationType === 'noise') {
            city.regulations.maxNoiseLevelAllowed -= 5;
          } else if (event.regulationType === 'hours') {
            city.regulations.openingHoursRestriction.latest -= 1;
          }
          break;
      }
    }
    
    triggerCustomerEvent() {
      if (!this.game.state.currentVenue) return;
      
      const venue = this.game.state.currentVenue;
      
      // List of possible customer events
      const customerEvents = [
        {
          type: 'customer_event',
          subtype: 'vip_visit',
          description: 'VIP customer visit',
          venueId: venue.id
        },
        {
          type: 'customer_event',
          subtype: 'complaint',
          description: 'Customer complaint',
          venueId: venue.id
        },
        {
          type: 'customer_event',
          subtype: 'group_booking',
          description: 'Large group booking',
          venueId: venue.id
        }
      ];
      
      // Add food poisoning event only for restaurants/fast food
      if (venue.type === 'Restaurant' || venue.type === 'Fast Food') {
        customerEvents.push({
          type: 'customer_event',
          subtype: 'food_poisoning',
          description: 'Food poisoning incident',
          venueId: venue.id
        });
      }
      
      // Pick a random event
      const randomEvent = customerEvents[Math.floor(Math.random() * customerEvents.length)];
      
      // Trigger it
      this.triggerEvent(randomEvent);
    }
    
    triggerStaffEvent() {
      if (!this.game.state.currentVenue) return;
      
      const venue = this.game.state.currentVenue;
      
      // Need at least one staff member
      if (!venue.staff || venue.staff.length === 0) return;
      
      // Pick a random staff member
      const randomStaffId = venue.staff[Math.floor(Math.random() * venue.staff.length)];
      const staff = this.game.staffManager.getStaff(randomStaffId);
      if (!staff) return;
      
      // List of possible staff events
      const staffEvents = [
        {
          type: 'staff_event',
          subtype: 'sick_day',
          description: `${staff.name} called in sick`,
          staffId: staff.id,
          venueId: venue.id
        },
        {
          type: 'staff_event',
          subtype: 'raise_request',
          description: `${staff.name} requested a raise`,
          staffId: staff.id,
          venueId: venue.id
        }
      ];
      
      // Add quit event only if morale is low
      if (staff.morale < 30) {
        staffEvents.push({
          type: 'staff_event',
          subtype: 'quit',
          description: `${staff.name} quit unexpectedly`,
          staffId: staff.id,
          venueId: venue.id
        });
      }
      
      // Pick a random event
      const randomEvent = staffEvents[Math.floor(Math.random() * staffEvents.length)];
      
      // Trigger it
      this.triggerEvent(randomEvent);
    }
    
    triggerVenueEvent() {
      if (!this.game.state.currentVenue) return;
      
      const venue = this.game.state.currentVenue;
      
      // List of possible venue events
      const venueEvents = [];
      
      // Equipment failure events
      if (venue.inventory && venue.inventory.equipment) {
        venue.inventory.equipment.forEach(equipment => {
          // Higher chance of failure for equipment in poor condition
          if (equipment.condition < 30 || Math.random() < 0.2) {
            venueEvents.push({
              type: 'equipment_failure',
              description: `${equipment.name} broke down`,
              equipmentName: equipment.name,
              venueId: venue.id
            });
          }
        });
      }
      
      // Other venue events
      venueEvents.push({
        type: 'venue_event',
        subtype: 'maintenance_issue',
        description: 'Maintenance issue at venue',
        venueId: venue.id
      });
      
      // Add type-specific events
      if (venue.type === 'Nightclub') {
        venueEvents.push({
          type: 'venue_event',
          subtype: 'noise_complaint',
          description: 'Noise complaint from neighbors',
          venueId: venue.id
        });
      }
      
      // Pick a random event
      if (venueEvents.length === 0) return;
      const randomEvent = venueEvents[Math.floor(Math.random() * venueEvents.length)];
      
      // Trigger it
      this.triggerEvent(randomEvent);
    }
    
    triggerCityEvent() {
      if (!this.game.state.currentVenue) return;
      
      const venue = this.game.state.currentVenue;
      const city = venue.city;
      
      // List of possible city events
      const cityEvents = [
        {
          type: 'city_event',
          subtype: 'festival',
          description: `Festival in ${city}`,
          city: city
        },
        {
          type: 'city_event',
          subtype: 'construction',
          description: `Construction near venue in ${city}`,
          city: city
        },
        {
          type: 'city_event',
          subtype: 'regulation_change',
          description: `New regulations in ${city}`,
          regulationType: Math.random() < 0.5 ? 'noise' : 'hours',
          city: city
        }
      ];
      
      // Pick a random event
      const randomEvent = cityEvents[Math.floor(Math.random() * cityEvents.length)];
      
      // Trigger it
      this.triggerEvent(randomEvent);
    }
    
    triggerFinancialEvent() {
      if (!this.game.state.currentVenue) return;
      
      const venue = this.game.state.currentVenue;
      
      // List of possible financial events
      const financialEvents = [
        {
          type: 'financial_event',
          subtype: 'tax_audit',
          description: 'Tax audit',
          venueId: venue.id
        },
        {
          type: 'financial_event',
          subtype: 'price_increase',
          description: 'Supplier price increase',
          itemType: Math.random() < 0.5 ? 'drinks' : 'food',
          venueId: venue.id
        },
        {
          type: 'financial_event',
          subtype: 'rent_increase',
          description: 'Rent increase',
          venueId: venue.id
        }
      ];
      
      // Pick a random event
      const randomEvent = financialEvents[Math.floor(Math.random() * financialEvents.length)];
      
      // Trigger it
      this.triggerEvent(randomEvent);
    }
  }
  
  module.exports = EventManager;