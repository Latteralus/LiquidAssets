// js/modules/customer/customerGenerator.js
// Handles creation of new customers and their attributes

const { GAME_CONSTANTS, CUSTOMER_TYPES } = require('../../config');
const { createLogger } = require('../../utils/logger');
const { getRandomFromArray, getRandomInt, getRandomFloat, getRandomWeighted } = require('../../utils/randomGenerator');
const { generateEntityId } = require('../../utils/idGenerator');
const eventBus = require('../../utils/eventBus');
const time = require('../time');

/**
 * Responsible for creating new customers with appropriate
 * attributes based on venue type, city, and time of day
 */
class CustomerGenerator {
  /**
   * Create a new CustomerGenerator
   * @param {Object} game - Reference to main game object
   */
  constructor(game) {
    this.game = game;
    this.logger = createLogger(game);
  }
  
  /**
   * Generate customers for a venue
   * @param {Object} venue - The venue to generate customers for
   */
  generateCustomers(venue) {
    // Skip if we've reached max customers
    if (this.game.state.customers.length >= GAME_CONSTANTS.MAX_CUSTOMERS) {
      return;
    }
    
    // Base rate of customers per hour, adjusted for venue popularity and time of day
    let hourlyCustomerBase = this.calculateHourlyCustomerRate(venue);
    
    // Adjust for day of week (weekends are busier)
    const gameTime = time ? time.getGameTime() : this.game.timeManager.getGameTime();
    const dayOfWeek = gameTime.dayOfWeek;
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
  
  /**
   * Calculate hourly customer rate based on venue properties
   * @param {Object} venue - The venue
   * @returns {number} Hourly customer rate
   */
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
    const gameTime = time ? time.getGameTime() : this.game.timeManager.getGameTime();
    const hour = gameTime.hour;
    
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
    
    // Calculate city popularity effect if city manager is available
    let cityMultiplier = 1.0;
    if (this.game.cityManager) {
      const city = this.game.cityManager.getCity(venue.city);
      if (city) {
        cityMultiplier = city.popularity / 50; // 50 is baseline
      }
    }
    
    return baseRate * popularityMultiplier * timeMultiplier * cityMultiplier;
  }
  
  /**
   * Add a new customer to the game
   * @param {Object} venue - The venue the customer is visiting
   * @returns {Object} The new customer
   */
  addNewCustomer(venue) {
    // Choose customer type
    const customerTypeKeys = Object.keys(CUSTOMER_TYPES);
    const weights = customerTypeKeys.map(type => {
      // Adjust weights based on time and venue type
      let weight = 1.0;
      
      // Adjust weight based on time of day
      const gameTime = time ? time.getGameTime() : this.game.timeManager.getGameTime();
      const hour = gameTime.hour;
      
      if (type === 'business') {
        // Business customers are more common during work hours
        weight *= (hour >= 12 && hour <= 14) || (hour >= 17 && hour <= 19) ? 1.5 : 0.5;
      } else if (type === 'tourist') {
        // Tourists more common during daytime
        weight *= (hour >= 10 && hour <= 18) ? 1.5 : 0.8;
      } else if (type === 'student') {
        // Students more common in late hours
        weight *= (hour >= 16 && hour <= 23) ? 1.8 : 0.7;
      }
      
      // Adjust weight based on venue type
      if (venue.type === 'Fast Food' && type === 'business') {
        weight *= 1.3; // Business people like fast food for quick lunch
      } else if (venue.type === 'Restaurant' && type === 'tourist') {
        weight *= 1.5; // Tourists like to try local restaurants
      } else if (venue.type === 'Nightclub' && type === 'student') {
        weight *= 2.0; // Students love nightclubs
      } else if (venue.type === 'Bar' && type === 'regular') {
        weight *= 1.7; // Regulars frequent bars
      }
      
      return { value: type, weight };
    });
    
    const type = getRandomWeighted(weights);
    
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
    
    // Current game time for arrival time
    const gameTime = time ? time.getGameTime() : this.game.timeManager.getGameTime();
    
    // Create the customer
    const customer = {
      id: generateEntityId('customer'),
      type,
      groupSize,
      arrivalTime: { ...gameTime },
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
    
    // Add to the game
    this.game.customerManager.addCustomer(customer);
    
    this.logger.info(`A group of ${customer.groupSize} ${type} customers entered ${venue.name}`, 'CUSTOMER');
    
    return customer;
  }
  
  /**
   * Calculate initial patience for a customer type
   * @param {string} customerType - Type of customer
   * @returns {number} Initial patience value
   */
  calculateInitialPatience(customerType) {
    // Base patience level (out of 100)
    const basePatience = getRandomInt(80, 99);
    
    // Apply customer type modifier
    const modifier = CUSTOMER_TYPES[customerType].patienceModifier;
    return Math.floor(basePatience * modifier);
  }
  
  /**
   * Calculate spending budget for a customer
   * @param {string} customerType - Type of customer
   * @param {Object} venue - Venue they're visiting
   * @returns {number} Spending budget per person
   */
  calculateSpendingBudget(customerType, venue) {
    // Base spending amount depends on venue type
    let baseSpending;
    
    switch(venue.type) {
      case 'Restaurant': 
        baseSpending = getRandomFloat(25, 40); // €25-€40 per person
        break;
      case 'Bar':
        baseSpending = getRandomFloat(15, 30); // €15-€30 per person
        break;
      case 'Nightclub':
        baseSpending = getRandomFloat(20, 40); // €20-€40 per person
        break;
      case 'Fast Food':
        baseSpending = getRandomFloat(8, 15); // €8-€15 per person
        break;
      default:
        baseSpending = 15;
    }
    
    // Apply customer type modifier
    const modifier = CUSTOMER_TYPES[customerType].spendingModifier;
    
    // Apply city affluence modifier
    let cityAffluence = 1.0;
    if (this.game.cityManager) {
      cityAffluence = this.game.cityManager.getCityCustomerAffluence(venue.city) || 1.0;
    }
    
    return baseSpending * modifier * cityAffluence;
  }
  
  /**
   * Generate customer preferences based on type and venue
   * @param {string} customerType - Type of customer
   * @param {Object} venue - The venue they're visiting
   * @returns {Object} Customer preferences
   */
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
        preferences.qualityImportance = getRandomInt(60, 80);
        preferences.serviceSpeedImportance = getRandomInt(50, 70);
        break;
      case 'tourist':
        // Tourists are looking for experience
        preferences.qualityImportance = getRandomInt(70, 90);
        preferences.serviceSpeedImportance = getRandomInt(40, 60);
        break;
      case 'business':
        // Business types want efficiency and quality
        preferences.qualityImportance = getRandomInt(80, 100);
        preferences.serviceSpeedImportance = getRandomInt(70, 90);
        break;
      case 'student':
        // Students care more about price than quality
        preferences.qualityImportance = getRandomInt(30, 60);
        preferences.serviceSpeedImportance = getRandomInt(50, 80);
        break;
    }
    
    // Adjust preferences based on venue type
    switch(venue.type) {
      case 'Restaurant':
        preferences.musicPreference = getRandomInt(30, 50); // Quieter
        preferences.lightingPreference = getRandomInt(60, 80); // Brighter
        break;
      case 'Bar':
        preferences.musicPreference = getRandomInt(50, 80);
        preferences.lightingPreference = getRandomInt(40, 60);
        break;
      case 'Nightclub':
        preferences.musicPreference = getRandomInt(70, 100); // Louder
        preferences.lightingPreference = getRandomInt(20, 40); // Darker
        break;
      case 'Fast Food':
        preferences.musicPreference = getRandomInt(40, 60);
        preferences.lightingPreference = getRandomInt(70, 90); // Very bright
        break;
    }
    
    // Select preferred drinks/food from venue inventory
    if (venue.inventory) {
      if (venue.inventory.drinks && venue.inventory.drinks.length > 0) {
        // Pick 1-3 preferred drinks
        const drinkCount = getRandomInt(1, 3);
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
        const foodCount = getRandomInt(1, 2);
        for (let i = 0; i < foodCount && i < venue.inventory.food.length; i++) {
          const randomIndex = Math.floor(Math.random() * venue.inventory.food.length);
          const food = venue.inventory.food[randomIndex];
          
          if (!preferences.preferredFood.includes(food.name))if (!preferences.preferredFood.includes(food.name)) {
            preferences.preferredFood.push(food.name);
          }
        }
      }
    }
    
    return preferences;
  }
 }
 
 module.exports = CustomerGenerator;