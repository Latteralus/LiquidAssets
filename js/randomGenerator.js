// js/utils/randomGenerator.js
/**
 * Centralized utilities for random data generation.
 */

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      console.error('getRandomInt received invalid range:', min, max);
      return 0;
    }
    
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Get a random float between min and max with specified decimals
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} [decimals=2] - Number of decimal places
   * @returns {number} Random float
   */
  function getRandomFloat(min, max, decimals = 2) {
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      console.error('getRandomFloat received invalid range:', min, max);
      return 0;
    }
    
    const value = Math.random() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  /**
   * Get a random item from an array
   * @param {Array} array - Array to pick from
   * @returns {any} Random item
   */
  function getRandomFromArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
      console.error('getRandomFromArray received invalid or empty array');
      return null;
    }
    
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * Get a random item from an array using weighted probability
   * @param {Array<Object>} options - Array of objects with value and weight properties
   * @returns {any} Randomly selected value
   */
  function getRandomWeighted(options) {
    if (!Array.isArray(options) || options.length === 0) {
      console.error('getRandomWeighted received invalid or empty options array');
      return null;
    }
    
    // Validate that each option has value and weight properties
    for (const option of options) {
      if (typeof option !== 'object' || option === null || 
          !('value' in option) || !('weight' in option) || 
          typeof option.weight !== 'number' || option.weight < 0) {
        console.error('getRandomWeighted received invalid option:', option);
        return options[0].value; // Return first value as fallback
      }
    }
    
    const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
    
    if (totalWeight <= 0) {
      console.error('getRandomWeighted received options with total weight <= 0');
      return options[0].value;
    }
    
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.value;
      }
    }
    
    // Fallback
    return options[options.length - 1].value;
  }
  
  /**
   * Generate a random boolean with specified true probability
   * @param {number} [trueProbability=0.5] - Probability of returning true (0-1)
   * @returns {boolean} Random boolean
   */
  function getRandomBoolean(trueProbability = 0.5) {
    return Math.random() < trueProbability;
  }
  
  /**
   * Generate a random value with normal distribution
   * @param {number} mean - Mean value
   * @param {number} stdDev - Standard deviation
   * @returns {number} Random normally distributed value
   */
  function getRandomNormal(mean, stdDev) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    
    return z0 * stdDev + mean;
  }
  
  /**
   * Generate random values following a normal distribution but clamped to a range
   * @param {number} mean - Mean value
   * @param {number} stdDev - Standard deviation
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random value
   */
  function getRandomNormalClamped(mean, stdDev, min, max) {
    let value;
    do {
      value = getRandomNormal(mean, stdDev);
    } while (value < min || value > max);
    
    return value;
  }
  
  /**
   * Generate a random date within a range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Date} Random date
   */
  function getRandomDate(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    const randomTime = start + Math.random() * (end - start);
    return new Date(randomTime);
  }
  
  module.exports = {
    getRandomInt,
    getRandomFloat,
    getRandomFromArray,
    getRandomWeighted,
    getRandomBoolean,
    getRandomNormal,
    getRandomNormalClamped,
    getRandomDate
  };