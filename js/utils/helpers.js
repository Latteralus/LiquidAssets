// Helper Functions - Useful utility functions for the game

// Number formatting
function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      console.error('formatCurrency received invalid input:', value);
      return '€0.00';
    }
    return '€' + value.toFixed(2);
  }
  
  function formatPercent(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      console.error('formatPercent received invalid input:', value);
      return '0.0%';
    }
    return value.toFixed(1) + '%';
  }
  
  // Time helpers
  function formatTime(hour, minute = 0) {
    if (typeof hour !== 'number' || hour < 0 || hour > 23 || !Number.isInteger(hour)) {
      console.error('formatTime received invalid hour:', hour);
      hour = 0;
    }
    
    if (typeof minute !== 'number' || minute < 0 || minute > 59 || !Number.isInteger(minute)) {
      console.error('formatTime received invalid minute:', minute);
      minute = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  function formatDate(year, month, day) {
    if (typeof year !== 'number' || year < 1 || !Number.isInteger(year)) {
      console.error('formatDate received invalid year:', year);
      year = 2025; // Default to game's starting year
    }
    
    if (typeof month !== 'number' || month < 1 || month > 12 || !Number.isInteger(month)) {
      console.error('formatDate received invalid month:', month);
      month = 1;
    }
    
    if (typeof day !== 'number' || day < 1 || day > 31 || !Number.isInteger(day)) {
      console.error('formatDate received invalid day:', day);
      day = 1;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }
  
  function getDaysInMonth(month, year) {
    if (typeof month !== 'number' || month < 1 || month > 12 || !Number.isInteger(month)) {
      console.error('getDaysInMonth received invalid month:', month);
      return 30; // Default fallback
    }
    
    if (typeof year !== 'number' || year < 1 || !Number.isInteger(year)) {
      console.error('getDaysInMonth received invalid year:', year);
      return 30; // Default fallback
    }
    
    return new Date(year, month, 0).getDate();
  }
  
  // Random generation helpers
  function getRandomInt(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      console.error('getRandomInt received invalid range:', min, max);
      return 0;
    }
    
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function getRandomFloat(min, max, decimals = 2) {
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      console.error('getRandomFloat received invalid range:', min, max);
      return 0;
    }
    
    if (typeof decimals !== 'number' || decimals < 0 || !Number.isInteger(decimals)) {
      console.error('getRandomFloat received invalid decimals:', decimals);
      decimals = 2;
    }
    
    const value = Math.random() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  function getRandomFromArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
      console.error('getRandomFromArray received invalid or empty array');
      return null;
    }
    
    return array[Math.floor(Math.random() * array.length)];
  }
  
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
    
    // Fallback (should never reach here unless there's a floating point precision issue)
    return options[options.length - 1].value;
  }
  
  // Array and object helpers
  function sumArrayValues(array) {
    if (!Array.isArray(array)) {
      console.error('sumArrayValues received a non-array:', array);
      return 0;
    }
    
    return array.reduce((sum, value) => {
      // Convert strings that look like numbers to actual numbers
      if (typeof value === 'string' && !isNaN(value)) {
        value = parseFloat(value);
      }
      
      // Only add if it's a number
      if (typeof value === 'number' && !isNaN(value)) {
        return sum + value;
      }
      return sum;
    }, 0);
  }
  
  function averageArrayValues(array) {
    if (!Array.isArray(array)) {
      console.error('averageArrayValues received a non-array:', array);
      return 0;
    }
    
    if (array.length === 0) {
      return 0;
    }
    
    const validValues = array.filter(value => {
      if (typeof value === 'string') {
        return !isNaN(value);
      }
      return typeof value === 'number' && !isNaN(value);
    }).map(value => typeof value === 'string' ? parseFloat(value) : value);
    
    if (validValues.length === 0) {
      return 0;
    }
    
    return sumArrayValues(validValues) / validValues.length;
  }
  
  function clamp(value, min, max) {
    if (typeof value !== 'number' || isNaN(value)) {
      console.error('clamp received a non-number value:', value);
      return min;
    }
    
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      console.error('clamp received invalid range:', min, max);
      return value;
    }
    
    return Math.max(min, Math.min(max, value));
  }
  
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('deepClone failed:', error);
      
      // Fallback to a basic clone if JSON serialization fails
      if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
      }
      
      const clone = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clone[key] = deepClone(obj[key]);
        }
      }
      return clone;
    }
  }
  
  // UI helpers
  function clearElement(element) {
    if (!element || typeof element.firstChild === 'undefined') {
      console.error('clearElement received an invalid element:', element);
      return;
    }
    
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  
  function createTextElement(tag, text, className) {
    if (typeof tag !== 'string' || tag.trim() === '') {
      console.error('createTextElement received an invalid tag:', tag);
      tag = 'div'; // Default fallback
    }
    
    try {
      const element = document.createElement(tag);
      element.textContent = text !== null && text !== undefined ? text : '';
      
      if (className) {
        element.className = className;
      }
      
      return element;
    } catch (error) {
      console.error('Error creating element:', error);
      return null;
    }
  }
  
  // Game-specific helpers
  function calculateRating(value, maxValue = 100) {
    if (typeof value !== 'number' || isNaN(value)) {
      console.error('calculateRating received invalid value:', value);
      return 'Unknown';
    }
    
    if (typeof maxValue !== 'number' || maxValue <= 0) {
      console.error('calculateRating received invalid maxValue:', maxValue);
      maxValue = 100;
    }
    
    const percent = clamp((value / maxValue) * 100, 0, 100);
    
    if (percent >= 90) return 'Excellent';
    if (percent >= 75) return 'Very Good';
    if (percent >= 60) return 'Good';
    if (percent >= 40) return 'Fair';
    if (percent >= 20) return 'Poor';
    return 'Terrible';
  }
  
  function calculateMoodEmoji(value, maxValue = 100) {
    if (typeof value !== 'number' || isNaN(value)) {
      console.error('calculateMoodEmoji received invalid value:', value);
      return '😐';
    }
    
    if (typeof maxValue !== 'number' || maxValue <= 0) {
      console.error('calculateMoodEmoji received invalid maxValue:', maxValue);
      maxValue = 100;
    }
    
    const percent = clamp((value / maxValue) * 100, 0, 100);
    
    if (percent >= 90) return '😄';
    if (percent >= 75) return '😊';
    if (percent >= 60) return '🙂';
    if (percent >= 40) return '😐';
    if (percent >= 20) return '🙁';
    return '😠';
  }
  
  // Date comparison helper
  function compareDates(date1, date2) {
    if (!date1 || !date2 || 
        typeof date1.year !== 'number' || typeof date2.year !== 'number' ||
        typeof date1.month !== 'number' || typeof date2.month !== 'number' ||
        typeof date1.day !== 'number' || typeof date2.day !== 'number') {
      console.error('compareDates received invalid date objects:', date1, date2);
      return 0;
    }
    
    // Compare years
    if (date1.year !== date2.year) {
      return date1.year - date2.year;
    }
    
    // Years are equal, compare months
    if (date1.month !== date2.month) {
      return date1.month - date2.month;
    }
    
    // Months are equal, compare days
    return date1.day - date2.day;
  }
  
  // Check if an object is empty
  function isEmptyObject(obj) {
    if (obj === null || typeof obj !== 'object') {
      return true;
    }
    
    return Object.keys(obj).length === 0;
  }
  
  // Safe object property access
  function getObjectProperty(obj, path, defaultValue = null) {
    if (obj === null || typeof obj !== 'object') {
      return defaultValue;
    }
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || typeof current !== 'object' || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  }
  
  // Export all helper functions
  module.exports = {
    formatCurrency,
    formatPercent,
    formatTime,
    formatDate,
    getDaysInMonth,
    getRandomInt,
    getRandomFloat,
    getRandomFromArray,
    getRandomWeighted,
    sumArrayValues,
    averageArrayValues,
    clamp,
    deepClone,
    clearElement,
    createTextElement,
    calculateRating,
    calculateMoodEmoji,
    compareDates,
    isEmptyObject,
    getObjectProperty
  };