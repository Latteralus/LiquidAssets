// Helper Functions - Useful utility functions for the game

// Number formatting
function formatCurrency(value) {
    return '€' + value.toFixed(2);
  }
  
  function formatPercent(value) {
    return value.toFixed(1) + '%';
  }
  
  // Time helpers
  function formatTime(hour, minute = 0) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  function formatDate(year, month, day) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }
  
  function getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }
  
  // Random generation helpers
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function getRandomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  function getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  function getRandomWeighted(options) {
    // options should be an array of {value, weight} objects
    const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.value;
      }
    }
    
    return options[options.length - 1].value;
  }
  
  // Array and object helpers
  function sumArrayValues(array) {
    return array.reduce((sum, value) => sum + value, 0);
  }
  
  function averageArrayValues(array) {
    if (array.length === 0) return 0;
    return sumArrayValues(array) / array.length;
  }
  
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // UI helpers
  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  
  function createTextElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) {
      element.className = className;
    }
    return element;
  }
  
  // Game-specific helpers
  function calculateRating(value, maxValue = 100) {
    const percent = (value / maxValue) * 100;
    
    if (percent >= 90) return 'Excellent';
    if (percent >= 75) return 'Very Good';
    if (percent >= 60) return 'Good';
    if (percent >= 40) return 'Fair';
    if (percent >= 20) return 'Poor';
    return 'Terrible';
  }
  
  function calculateMoodEmoji(value, maxValue = 100) {
    const percent = (value / maxValue) * 100;
    
    if (percent >= 90) return '😄';
    if (percent >= 75) return '😊';
    if (percent >= 60) return '🙂';
    if (percent >= 40) return '😐';
    if (percent >= 20) return '🙁';
    return '😠';
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
    calculateMoodEmoji
  };