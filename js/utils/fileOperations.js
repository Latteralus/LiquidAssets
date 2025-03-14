// js/utils/fileOperations.js
/**
 * Centralized file operation utilities.
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - Path to directory
 * @returns {boolean} True if successful
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
}

/**
 * Get a file path in the application data directory
 * @param {string} relativePath - Path relative to data directory
 * @returns {string} Absolute file path
 */
function getDataFilePath(relativePath) {
  const dataPath = app.getPath('userData');
  return path.join(dataPath, relativePath);
}

/**
 * Save data to a JSON file
 * @param {string} filePath - Path to save file
 * @param {any} data - Data to save
 * @returns {boolean} True if successful
 */
function saveJsonToFile(filePath, data) {
  try {
    // Ensure parent directory exists
    const dirPath = path.dirname(filePath);
    ensureDirectoryExists(dirPath);
    
    // Serialize and save data
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving JSON to file:', error);
    return false;
  }
}

/**
 * Load data from a JSON file
 * @param {string} filePath - Path to load file
 * @param {any} [defaultValue=null] - Default value if file doesn't exist
 * @returns {any} Loaded data or default value
 */
function loadJsonFromFile(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading JSON from file:', error);
    return defaultValue;
  }
}

/**
 * Delete a file
 * @param {string} filePath - Path to file
 * @returns {boolean} True if successful
 */
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * List files in a directory
 * @param {string} dirPath - Path to directory
 * @param {string} [extension] - Optional file extension filter
 * @returns {Array<string>} Array of file names
 */
function listFiles(dirPath, extension) {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    let files = fs.readdirSync(dirPath);
    
    if (extension) {
      files = files.filter(file => file.endsWith(extension));
    }
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Create a backup of a file
 * @param {string} filePath - Path to file
 * @returns {string|null} Backup file path or null if failed
 */
function createFileBackup(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    console.error('Error creating file backup:', error);
    return null;
  }
}

module.exports = {
  ensureDirectoryExists,
  getDataFilePath,
  saveJsonToFile,
  loadJsonFromFile,
  deleteFile,
  listFiles,
  createFileBackup
};