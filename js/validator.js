// js/utils/validator.js
/**
 * Centralized data validation utilities.
 */

/**
 * Validate a number is within a specific range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} Validated value
 */
function validateNumber(value, min, max, defaultValue) {
    if (typeof value !== 'number' || isNaN(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Validate a value is one of an allowed set
   * @param {any} value - Value to validate
   * @param {Array} allowedValues - Array of allowed values
   * @param {any} defaultValue - Default value if invalid
   * @returns {any} Validated value
   */
  function validateEnum(value, allowedValues, defaultValue) {
    if (!value || !allowedValues.includes(value)) {
      return defaultValue;
    }
    return value;
  }
  
  /**
   * Validate an integer
   * @param {any} value - Value to validate
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @param {number} defaultValue - Default value if invalid
   * @returns {number} Validated integer
   */
  function validateInteger(value, min, max, defaultValue) {
    if (typeof value !== 'number' || isNaN(value) || !Number.isInteger(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, Math.floor(value)));
  }
  
  /**
   * Validate string length
   * @param {any} value - Value to validate
   * @param {number} minLength - Minimum allowed length
   * @param {number} maxLength - Maximum allowed length
   * @param {string} defaultValue - Default value if invalid
   * @returns {string} Validated string
   */
  function validateString(value, minLength, maxLength, defaultValue) {
    if (typeof value !== 'string') {
      return defaultValue;
    }
    
    if (value.length < minLength || value.length > maxLength) {
      return defaultValue;
    }
    
    return value;
  }
  
  /**
   * Validate an object has all required properties
   * @param {Object} obj - Object to validate
   * @param {Array<string>} requiredProps - Array of required property names
   * @returns {boolean} True if valid
   */
  function hasRequiredProperties(obj, requiredProps) {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    return requiredProps.every(prop => obj[prop] !== undefined);
  }
  
  /**
   * Validate a date string is in ISO format
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} True if valid
   */
  function isValidISODate(dateStr) {
    if (typeof dateStr !== 'string') {
      return false;
    }
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr.includes('T');
  }
  
  /**
   * Sanitize a string for database use
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  function sanitizeString(str) {
    if (typeof str !== 'string') {
      return '';
    }
    
    // Replace dangerous characters
    return str
      .replace(/[<>]/g, '')
      .trim();
  }
  
  /**
   * Sanitize a filename
   * @param {string} filename - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  function sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
      return '';
    }
    
    // Replace unsafe characters
    return filename
      .replace(/[^a-zA-Z0-9-_\.]/g, '_')
      .trim();
  }
  
  module.exports = {
    validateNumber,
    validateEnum,
    validateInteger,
    validateString,
    hasRequiredProperties,
    isValidISODate,
    sanitizeString,
    sanitizeFilename
  };