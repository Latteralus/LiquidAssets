// Main name generation module

// Import name lists from submodules
const nameList = require('./names/nameList');
const venueList = require('./names/venueList');
const drinkList = require('./names/drinkList');
const foodList = require('./names/foodList');
const miscList = require('./names/miscList');

/**
 * Picks a random element from an array
 * @param {Array} array - The array to pick from
 * @returns {*} A random element from the array
 */
function getRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random full name (first and last name)
 * @param {string} gender - 'male', 'female', or 'random'
 * @returns {object} Object containing firstName, lastName, and fullName
 */
function generateFullName(gender = 'random') {
  // Default to random gender if not specified or invalid
  let firstName;
  
  if (gender === 'male') {
    firstName = getRandomFromArray(nameList.maleFirstNames);
  } else if (gender === 'female') {
    firstName = getRandomFromArray(nameList.femaleFirstNames);
  } else {
    // Random gender
    firstName = Math.random() < 0.5 
      ? getRandomFromArray(nameList.maleFirstNames) 
      : getRandomFromArray(nameList.femaleFirstNames);
  }
  
  const lastName = getRandomFromArray(nameList.lastNames);
  
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    // Include determined gender for reference
    gender: nameList.maleFirstNames.includes(firstName) ? 'male' : 'female'
  };
}

/**
 * Generates a random name for a venue
 * @param {string} venueType - The type of venue (e.g., 'Bar', 'Restaurant', 'Nightclub', 'Fast Food')
 * @returns {string} A random venue name
 */
function generateVenueName(venueType) {
  // Get venue formats for the specified type, defaulting to generic formats if type not found
  const formats = venueList.venueFormats[venueType] || venueList.venueFormats['Generic'];
  const format = getRandomFromArray(formats);
  
  // Generate a random first and last name to use
  const { firstName, lastName } = generateFullName();
  
  // Replace tokens in the format with random values
  return format
    .replace('{firstName}', getRandomFromArray(nameList.maleFirstNames))
    .replace('{firstName}', getRandomFromArray(nameList.femaleFirstNames)) // In case there are two
    .replace('{lastName}', lastName)
    .replace('{adj}', getRandomFromArray(miscList.adjectives))
    .replace('{noun}', getRandomFromArray(miscList.nouns))
    .replace('{color}', getRandomFromArray(miscList.colors))
    .replace('{city}', getRandomFromArray(miscList.cities))
    .replace('{cuisine}', getRandomFromArray(foodList.cuisines))
    .replace('{foodItem}', getRandomFromArray(foodList.fastFoodItems))
    .replace('{drink}', getRandomFromArray(drinkList.drinkTypes))
    .replace('{digit}', Math.floor(Math.random() * 10))
    .replace('{digit}', Math.floor(Math.random() * 10)); // In case there are two
}

/**
 * Generates a random drink name
 * @param {string} drinkType - The type of drink (e.g., 'cocktail', 'beer', 'wine', etc.)
 * @returns {string} A random drink name
 */
function generateDrinkName(drinkType = 'cocktail') {
  if (drinkType === 'cocktail') {
    // Cocktails can use special formats
    const format = getRandomFromArray(drinkList.cocktailFormats);
    
    // Generate a name
    const { firstName, lastName } = generateFullName();
    
    return format
      .replace('{firstName}', firstName)
      .replace('{lastName}', lastName)
      .replace('{adj}', getRandomFromArray(miscList.adjectives))
      .replace('{color}', getRandomFromArray(miscList.colors))
      .replace('{fruit}', getRandomFromArray(foodList.fruits))
      .replace('{location}', getRandomFromArray(miscList.locations))
      .replace('{noun}', getRandomFromArray(miscList.nouns));
  } else {
    // For other drink types, return a drink from the appropriate list
    const drinkCategory = drinkList[drinkType + 'List'] || drinkList.genericDrinks;
    return getRandomFromArray(drinkCategory);
  }
}

/**
 * Generates a random food dish name
 * @param {string} cuisineType - The type of cuisine
 * @param {string} dishType - The type of dish (e.g., 'appetizer', 'main', 'dessert')
 * @returns {string} A random food name
 */
function generateFoodName(cuisineType = 'generic', dishType = 'main') {
  // Try to get cuisine-specific dish list
  const cuisineDishes = foodList.dishes[cuisineType] || foodList.dishes['generic'];
  
  // Get dishes of the requested type, or default to all dishes
  const dishes = cuisineDishes[dishType] || cuisineDishes['main'] || cuisineDishes;
  
  // Choose a random dish
  return getRandomFromArray(dishes);
}

/**
 * Generates a set of potential staff members to choose from
 * @param {string} staffType - The type of staff member (e.g., 'bartender', 'waiter', etc.)
 * @param {number} count - How many staff members to generate
 * @param {string} preferredGender - Optional gender preference ('male', 'female', or 'random')
 * @returns {Array} Array of staff member objects
 */
function generateStaffPool(staffType, count = 3, preferredGender = 'random') {
  const staffPool = [];
  
  // Some staff types might have gender tendencies (historical/cultural)
  // but we'll always allow for diversity with some probability
  let genderDistribution;
  
  if (preferredGender === 'male' || preferredGender === 'female') {
    // If a specific gender is preferred, bias heavily toward it
    genderDistribution = preferredGender === 'male' ? 0.9 : 0.1;
  } else {
    // Otherwise use role-based tendencies but maintain diversity
    switch(staffType) {
      case 'bouncer':
        genderDistribution = 0.8; // 80% male, 20% female
        break;
      case 'bartender':
        genderDistribution = 0.6; // 60% male, 40% female
        break;
      case 'waiter':
      case 'waitress': // Handle both terms
        genderDistribution = 0.3; // 30% male, 70% female
        break;
      case 'dj':
        genderDistribution = 0.7; // 70% male, 30% female
        break;
      case 'cook':
        genderDistribution = 0.65; // 65% male, 35% female
        break;
      case 'manager':
        genderDistribution = 0.6; // 60% male, 40% female
        break;
      case 'cleaner':
        genderDistribution = 0.4; // 40% male, 60% female
        break;
      default:
        genderDistribution = 0.5; // 50/50 for undefined types
    }
  }
  
  // Generate the requested number of staff members
  for (let i = 0; i < count; i++) {
    // Determine gender based on distribution
    const gender = Math.random() < genderDistribution ? 'male' : 'female';
    
    // Generate name
    const person = generateFullName(gender);
    
    // Calculate experience (0-15 years)
    const experience = Math.floor(Math.random() * 16);
    
    // Add to pool
    staffPool.push({
      name: person.fullName,
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      type: staffType,
      experience: experience,
      // The staffManager will add other attributes like skills, wage, etc.
    });
  }
  
  return staffPool;
}

/**
 * Generates a customer name
 * @param {string} customerType - Type of customer (e.g., 'regular', 'tourist', etc.)
 * @param {string} gender - Optional gender ('male', 'female', 'random')
 * @returns {object} Customer name object
 */
function generateCustomerName(customerType = 'regular', gender = 'random') {
  // Different customer types might have different name generation logic
  // For example, tourists might have names from specific countries
  
  switch(customerType) {
    case 'tourist':
      // Tourists more likely to have international names
      return generateFullName(gender);
    case 'business':
      // Business customers - standard names
      return generateFullName(gender);
    case 'student':
      // Students might have more trendy/younger names
      return generateFullName(gender);
    case 'regular':
    default:
      // Regular customers - standard names
      return generateFullName(gender);
  }
}

/**
 * Generates a group of customers
 * @param {string} customerType - Type of customers in the group
 * @param {number} groupSize - Number of customers in the group
 * @returns {Array} Array of customer name objects
 */
function generateCustomerGroup(customerType = 'regular', groupSize = 1) {
  const group = [];
  
  for (let i = 0; i < groupSize; i++) {
    // Mix of genders in groups
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    group.push(generateCustomerName(customerType, gender));
  }
  
  return group;
}

/**
 * Generates a random event name based on type
 * @param {string} eventType - Type of event to generate a name for
 * @returns {string} Generated event name
 */
function generateEventName(eventType = 'generic') {
  const eventFormats = miscList.eventFormats[eventType] || miscList.eventFormats.generic;
  const format = getRandomFromArray(eventFormats);
  
  // Generate a name
  const { firstName, lastName } = generateFullName();
  
  return format
    .replace('{firstName}', firstName)
    .replace('{lastName}', lastName)
    .replace('{adj}', getRandomFromArray(miscList.adjectives))
    .replace('{noun}', getRandomFromArray(miscList.nouns))
    .replace('{color}', getRandomFromArray(miscList.colors))
    .replace('{city}', getRandomFromArray(miscList.cities))
    .replace('{music}', getRandomFromArray(miscList.musicGenres))
    .replace('{drink}', getRandomFromArray(drinkList.drinkTypes))
    .replace('{food}', getRandomFromArray(foodList.fastFoodItems))
    .replace('{holiday}', getRandomFromArray(miscList.holidays));
}

// Export the public API
module.exports = {
  generateFullName,
  generateVenueName,
  generateDrinkName,
  generateFoodName,
  generateStaffPool,
  generateCustomerName,
  generateCustomerGroup,
  generateEventName,
  getRandomFromArray
};