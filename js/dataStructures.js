// js/utils/dataStructures.js
/**
 * Centralized data structure utilities.
 */

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
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
  
  /**
   * Sum array values
   * @param {Array<number|string>} array - Array of values
   * @returns {number} Sum of values
   */
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
  
  /**
   * Average array values
   * @param {Array<number|string>} array - Array of values
   * @returns {number} Average of values
   */
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
  
  /**
   * Group array items by a property
   * @param {Array<Object>} array - Array of objects
   * @param {string|Function} key - Property name or function to get group key
   * @returns {Object} Grouped objects
   */
  function groupBy(array, key) {
    if (!Array.isArray(array)) {
      return {};
    }
    
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      
      result[groupKey].push(item);
      return result;
    }, {});
  }
  
  /**
   * Filter object properties
   * @param {Object} obj - Object to filter
   * @param {Array<string>} keys - Keys to keep
   * @returns {Object} Filtered object
   */
  function filterObject(obj, keys) {
    if (!obj || typeof obj !== 'object') {
      return {};
    }
    
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  }
  
  /**
   * Merge objects with custom handling for arrays
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @param {Object} [options] - Merge options
   * @param {boolean} [options.arrayMerge=false] - Whether to merge arrays
   * @returns {Object} Merged object
   */
  function mergeObjects(target, source, options = { arrayMerge: false }) {
    if (!isObject(target) || !isObject(source)) {
      return source === undefined ? target : source;
    }
    
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          result[key] = source[key];
        } else if (isObject(target[key])) {
          result[key] = mergeObjects(target[key], source[key], options);
        } else {
          result[key] = source[key];
        }
      } else if (Array.isArray(source[key])) {
        if (options.arrayMerge && Array.isArray(target[key])) {
          result[key] = [...target[key], ...source[key]];
        } else {
          result[key] = [...source[key]];
        }
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }
  
  /**
   * Check if value is an object
   * @param {any} value - Value to check
   * @returns {boolean} True if object
   */
  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  
  /**
   * Check if an object is empty
   * @param {Object} obj - Object to check
   * @returns {boolean} True if empty
   */
  function isEmptyObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return true;
    }
    
    return Object.keys(obj).length === 0;
  }
  
  /**
   * Safe object property access
   * @param {Object} obj - Object to access
   * @param {string} path - Property path (dot notation)
   * @param {any} [defaultValue=null] - Default value if path not found
   * @returns {any} Property value or default
   */
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
  
  module.exports = {
    deepClone,
    sumArrayValues,
    averageArrayValues,
    groupBy,
    filterObject,
    mergeObjects,
    isObject,
    isEmptyObject,
    getObjectProperty
  };