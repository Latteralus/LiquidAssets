// js/utils/configLoader.js
/**
 * Centralized configuration loading and management.
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Default configuration
const defaultConfig = {
  game: {
    startingCash: 10000,
    timeScale: 1,
    expenseCycle: 30,
    customerMaxPatience: 60,
    staffWageCycle: 7
  },
  ui: {
    soundEnabled: true,
    musicVolume: 50,
    sfxVolume: 50,
    textSpeed: 'normal',
    autosave: true
  },
  advanced: {
    databasePoolSize: 5,
    maxConcurrentCustomers: 100,
    maxStaffPerVenue: 20,
    debugMode: false
  }
};

let cachedConfig = null;

/**
 * Load configuration from file or use defaults
 * @param {boolean} [forceReload=false] - Force reload from file
 * @returns {Object} Configuration object
 */
function loadConfig(forceReload = false) {
  if (cachedConfig && !forceReload) {
    return cachedConfig;
  }
  
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    
    if (fs.existsSync(configPath)) {
      const configStr = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configStr);
      
      // Deep merge with defaults to ensure all properties exist
      cachedConfig = deepMerge(defaultConfig, fileConfig);
    } else {
      cachedConfig = { ...defaultConfig };
      
      // Save default config to file
      saveConfig(cachedConfig);
    }
    
    return cachedConfig;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return { ...defaultConfig };
  }
}

/**
 * Save configuration to file
 * @param {Object} config - Configuration object
 * @returns {boolean} True if successful
 */
function saveConfig(config) {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    cachedConfig = { ...config };
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error);
    return false;
  }
}

/**
 * Get a specific configuration value
 * @param {string} key - Configuration key (dot notation)
 * @param {any} [defaultValue] - Default value if key not found
 * @returns {any} Configuration value
 */
function getConfigValue(key, defaultValue) {
  const config = loadConfig();
  
  // Handle dot notation keys
  const parts = key.split('.');
  let value = config;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

/**
 * Set a specific configuration value
 * @param {string} key - Configuration key (dot notation)
 * @param {any} value - Configuration value
 * @returns {boolean} True if successful
 */
function setConfigValue(key, value) {
  const config = loadConfig();
  
  // Handle dot notation keys
  const parts = key.split('.');
  let target = config;
  
  // Navigate to the correct location
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (!(part in target)) {
      target[part] = {};
    }
    
    target = target[part];
  }
  
  // Set the value
  target[parts[parts.length - 1]] = value;
  
  // Save the updated config
  return saveConfig(config);
}

/**
 * Reset configuration to defaults
 * @returns {boolean} True if successful
 */
function resetConfig() {
  return saveConfig({ ...defaultConfig });
}

/**
 * Deep merge of objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * Check if value is an object
 * @param {any} item - Value to check
 * @returns {boolean} True if object
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  resetConfig
};