// CustomerGenerator - Handles creation of new customers and their attributes

const { GAME_CONSTANTS, CUSTOMER_TYPES } = require('../../config');

class CustomerGenerator {
  constructor(game) {
    this.game = game;
  }
  
  generateCustomers(venue) {
    // Skip if we've reached max customers
    if (this.game.state.customers.length >= GAME_CONSTANTS.MAX_CUSTOMERS) return;
    
    // Base rate of customers per hour, adjusted for venue popularity and time of day
    let hourlyCustomerBase = this.calculateHourlyCustomerRate(venue);
    
    // Adjust for day of week (weekends are busier)
    const dayOfWeek = this.game.timeManager.getGameTime().dayOfWeek;
    if (dayOfWeek >= 5) { // Friday, Saturday
      hourlyCustomerBase *= 1.5;
    }
    
    // Calculate how many customers arrive in a 15-minute period (our time step)
    const customersThisTick = Math.floor(hourlyCustomerBase / 4 * Math.random());
    
    // Generate new customers
    for (let i = 0; i < customersThisTick; i++) {
      this.addNewCustomer(venue);
    }
  }
  
  calculateHourlyCustomerRate(venue) {
    // Base number of customers depends on venue type and city
    const baseRates = {
      'Bar': 10,
      'Restaurant': 15,
      'Nightclub': 20,
      'Fast Food': 25
    };
    const baseRate = baseRates[venue.type] || 10;
    
    // Adjust for venue popularity
    const popularityMultiplier = 0.5 + (venue.stats.popularity / 100) * 1.5;
    
    // Adjust for time of day
    let timeMultiplier = 1.0;
    const hour = this.game.timeManager.getGameTime().hour;
    
    if (venue.type === 'Restaurant') {
      // Restaurants are busier during lunch and dinner
      if (hour >= 12 && hour <= 14) timeMultiplier = 2.0; // Lunch
      else if (hour >= 18 && hour <= 21) timeMultiplier = 2.5; // Dinner
    } else if (venue.type === 'Bar') {
      // Bars get busier in the evening
      if (hour >= 17 && hour <= 23) timeMultiplier = 2.0;
    } else if (venue.type === 'Nightclub') {
      // Nightclubs are dead until late evening
      if (hour < 21) timeMultiplier = 0.2;
      else if (hour >= 21 && hour <= 2) timeMultiplier = 2.5;
    } else if (venue.type === 'Fast Food') {
      // Fast food busy at lunch, after work, and late night
      if (hour >= 12 && hour <= 14) timeMultiplier = 2.0; // Lunch
      if (hour >= 17 && hour <= 19) timeMultiplier = 1.8; // After work
      if (hour >= 22 || hour <= 2) timeMultiplier = 1.5; // Late night
    }
    
    return baseRate * popularityMultiplier * timeMultiplier;
  }
  
  addNewCustomer(venue) {
    // Choose customer type
    const customerTypeKeys = Object.keys(CUSTOMER_TYPES);
    const type = customerTypeKeys[Math.floor(Math.random() * customerTypeKeys.length)];
    
    // Determine group size based on customer type probabilities
    const groupSizeProbabilities = CUSTOMER_TYPES[type].groupSizeProbability;
    let groupSize = 1;
    
    const roll = Math.random();
    let cumulativeProbability = 0;
    
    for (let i = 0; i < groupSizeProbabilities.length; i++) {
      cumulativeProbability += groupSizeProbabilities[i];
      if (roll < cumulativeProbability) {
        groupSize = i + 1;
        break;
      }
    }
    
    const customer = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      groupSize,
      arrivalTime: { ...this.game.timeManager.getGameTime() },
      status: 'entering', // entering, seated, ordering, waiting, eating/drinking, paying, leaving
      patience: this.calculateInitialPatience(type),
      spendingBudget: this.calculateSpendingBudget(type, venue),
      preferences: this.generateCustomerPreferences(type, venue),
      satisfaction: 70, // Initial satisfaction (0-100)
      assignedStaff: null,
      assignedTable: null,
      orders: [],
      venueId: venue.id
    };
    
    // Add to customers array
    this.game.state.customers.push(customer);
    
    return customer;
  }
  
  calculateInitialPatience(customerType) {
    // Base patience level (out of 100)
    const basePatience = 80 + Math.floor(Math.random() * 20); // 80-99
    
    // Apply customer type modifier
    const modifier = CUSTOMER_TYPES[customerType].patienceModifier;
    return Math.floor(basePatience * modifier);
  }
  
  calculateSpendingBudget(customerType, venue) {
    // Base spending amount depends on venue type
    let baseSpending;
    
    switch(venue.type) {
      case 'Restaurant':
        baseSpending = 25 + Math.random() * 15; // €25-€40 per person
        break;
      case 'Bar':
        baseSpending = 15 + Math.random() * 15; // €15-€30 per person
        break;
      case 'Nightclub':
        baseSpending = 20 + Math.random() * 20; // €20-€40 per person
        break;
      case 'Fast Food':
        baseSpending = 8 + Math.random() * 7; // €8-€15 per person
        break;
      default:
        baseSpending = 15;
    }
    
    // Apply customer type modifier
    const modifier = CUSTOMER_TYPES[customerType].spendingModifier;
    
    // Apply city affluence modifier
    const cityAffluence = this.game.cityManager ? 
                         this.game.cityManager.getCityCustomerAffluence(venue.city) : 1;
    
    return baseSpending * modifier * cityAffluence;
  }
  
  generateCustomerPreferences(customerType, venue) {
    // Generate preferences based on customer type and venue type
    const preferences = {
      preferredDrinks: [],
      preferredFood: [],
      musicPreference: 0, // 0-100, higher means louder music preferred
      lightingPreference: 0, // 0-100, higher means brighter lighting preferred
      qualityImportance: 0, // 0-100, higher means quality matters more than price
      serviceSpeedImportance: 0 // 0-100, higher means fast service is important
    };
    
    // Adjust preferences based on customer type
    switch(customerType) {
      case 'regular':
        // Regulars like what they know
        preferences.qualityImportance = 60 + Math.floor(Math.random() * 20);
        preferences.serviceSpeedImportance = 50 + Math.floor(Math.random() * 20);
        break;
      case 'tourist':
        // Tourists are looking for experience
        preferences.qualityImportance = 70 + Math.floor(Math.random() * 20);
        preferences.serviceSpeedImportance = 40 + Math.floor(Math.random() * 20);
        break;
      case 'business':
        // Business types want efficiency and quality
        preferences.qualityImportance = 80 + Math.floor(Math.random() * 20);
        preferences.serviceSpeedImportance = 70 + Math.floor(Math.random() * 20);
        break;
      case 'student':
        // Students care more about price than quality
        preferences.qualityImportance = 30 + Math.floor(Math.random() * 30);
        preferences.serviceSpeedImportance = 50 + Math.floor(Math.random() * 30);
        break;
    }
    
    // Adjust preferences based on venue type
    switch(venue.type) {
      case 'Restaurant':
        preferences.musicPreference = 30 + Math.floor(Math.random() * 20); // Quieter
        preferences.lightingPreference = 60 + Math.floor(Math.random() * 20); // Brighter
        break;
      case 'Bar':
        preferences.musicPreference = 50 + Math.floor(Math.random() * 30);
        preferences.lightingPreference = 40 + Math.floor(Math.random() * 20);
        break;
      case 'Nightclub':
        preferences.musicPreference = 70 + Math.floor(Math.random() * 30); // Louder
        preferences.lightingPreference = 20 + Math.floor(Math.random() * 20); // Darker
        break;
      case 'Fast Food':
        preferences.musicPreference = 40 + Math.floor(Math.random() * 20);
        preferences.lightingPreference = 70 + Math.floor(Math.random() * 20); // Very bright
        break;
    }
    
    // Select preferred drinks/food from venue inventory
    if (venue.inventory) {
      if (venue.inventory.drinks && venue.inventory.drinks.length > 0) {
        // Pick 1-3 preferred drinks
        const drinkCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < drinkCount && i < venue.inventory.drinks.length; i++) {
          const randomIndex = Math.floor(Math.random() * venue.inventory.drinks.length);
          const drink = venue.inventory.drinks[randomIndex];
          
          if (!preferences.preferredDrinks.includes(drink.name)) {
            preferences.preferredDrinks.push(drink.name);
          }
        }
      }
      
      if (venue.inventory.food && venue.inventory.food.length > 0) {
        // Pick 1-2 preferred foods
        const foodCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < foodCount && i < venue.inventory.food.length; i++) {
          const randomIndex = Math.floor(Math.random() * venue.inventory.food.length);
          const food = venue.inventory.food[randomIndex];
          
          if (!preferences.preferredFood.includes(food.name)) {
            preferences.preferredFood.push(food.name);
          }
        }
      }
    }
    
    return preferences;
  }
}

module.exports = CustomerGenerator;