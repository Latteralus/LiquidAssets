// js/utils/formatter.js
/**
 * Centralized formatting utilities.
 */

/**
 * Format a number as currency
 * @param {number} value - Value to format
 * @param {string} [currency='€'] - Currency symbol
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, currency = '€', decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) {
      return `${currency}0.00`;
    }
    
    return `${currency}${value.toFixed(decimals)}`;
  }
  
  /**
   * Format a number as percentage
   * @param {number} value - Value to format (0-100)
   * @param {number} [decimals=1] - Number of decimal places
   * @returns {string} Formatted percentage string
   */
  function formatPercent(value, decimals = 1) {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0.0%';
    }
    
    return `${value.toFixed(decimals)}%`;
  }
  
  /**
   * Format time (hours and minutes)
   * @param {number} hour - Hour (0-23)
   * @param {number} [minute=0] - Minute (0-59)
   * @returns {string} Formatted time string (HH:MM)
   */
  function formatTime(hour, minute = 0) {
    if (typeof hour !== 'number' || hour < 0 || hour > 23 || !Number.isInteger(hour)) {
      hour = 0;
    }
    
    if (typeof minute !== 'number' || minute < 0 || minute > 59 || !Number.isInteger(minute)) {
      minute = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  /**
   * Format a date
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} day - Day
   * @returns {string} Formatted date string
   */
  function formatDate(year, month, day) {
    if (typeof year !== 'number' || year < 1 || !Number.isInteger(year)) {
      year = new Date().getFullYear();
    }
    
    if (typeof month !== 'number' || month < 1 || month > 12 || !Number.isInteger(month)) {
      month = 1;
    }
    
    if (typeof day !== 'number' || day < 1 || day > 31 || !Number.isInteger(day)) {
      day = 1;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }
  
  /**
   * Format a date object
   * @param {Object} date - Date object with year, month, day properties
   * @param {string} [format='default'] - Format style
   * @returns {string} Formatted date
   */
  function formatDateObj(date, format = 'default') {
    if (!date || typeof date !== 'object') {
      return 'Invalid Date';
    }
    
    const { year, month, day } = date;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    switch (format) {
      case 'short':
        return `${shortMonthNames[month - 1]} ${day}`;
      case 'iso':
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case 'numeric':
        return `${month}/${day}/${year}`;
      default:
        return `${monthNames[month - 1]} ${day}, ${year}`;
    }
  }
  
  /**
   * Format a price for display in menus
   * @param {number} price - Price value
   * @param {boolean} [includeSymbol=true] - Whether to include currency symbol
   * @returns {string} Formatted price
   */
  function formatMenuPrice(price, includeSymbol = true) {
    if (typeof price !== 'number' || isNaN(price)) {
      return includeSymbol ? '€0.00' : '0.00';
    }
    
    const formattedPrice = price.toFixed(2);
    return includeSymbol ? `€${formattedPrice}` : formattedPrice;
  }
  
  /**
   * Format a rating value as text
   * @param {number} value - Rating value (0-100)
   * @returns {string} Rating text
   */
  function formatRating(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'Unknown';
    }
    
    if (value >= 90) return 'Excellent';
    if (value >= 75) return 'Very Good';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    if (value >= 20) return 'Poor';
    return 'Terrible';
  }
  
  /**
   * Format a file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted file size
   */
  function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
      return '0 B';
    }
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    
    return `${bytes.toFixed(1)} ${units[i]}`;
  }
  
  module.exports = {
    formatCurrency,
    formatPercent,
    formatTime,
    formatDate,
    formatDateObj,
    formatMenuPrice,
    formatRating,
    formatFileSize
  };