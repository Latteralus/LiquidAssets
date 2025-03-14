// js/database/dao/settingsDAO.js
const { DatabaseManager } = require('../databaseManager');

class SettingsDAO {
  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Retrieves a setting by key
   * @param {string} key - The setting key
   * @returns {Promise<string|null>} The setting value or null if not found
   */
  async getSetting(key) {
    try {
      const record = await this.db.get(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );
      
      return record ? record.value : null;
    } catch (error) {
      console.error(`Error retrieving setting with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves settings by category
   * @param {string} category - The settings category
   * @returns {Promise<Object>} Object with settings as key-value pairs
   */
  async getSettingsByCategory(category) {
    try {
      const records = await this.db.query(
        'SELECT key, value FROM settings WHERE category = ?',
        [category]
      );
      
      const settings = {};
      records.forEach(record => {
        settings[record.key] = record.value;
      });
      
      return settings;
    } catch (error) {
      console.error(`Error retrieving settings for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Sets a setting value
   * @param {string} key - The setting key
   * @param {string|number|boolean} value - The setting value
   * @param {string} category - The settings category
   * @returns {Promise<boolean>} True if setting was created/updated
   */
  async setSetting(key, value, category) {
    try {
      // Check if setting already exists
      const existing = await this.db.get(
        'SELECT id FROM settings WHERE key = ?',
        [key]
      );

      // Convert value to string
      const stringValue = typeof value === 'object' ? 
        JSON.stringify(value) : String(value);
      
      if (existing) {
        // Update existing setting
        return await this.db.update('settings', existing.id, {
          value: stringValue,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new setting
        await this.db.insert('settings', {
          key,
          value: stringValue,
          category,
          updated_at: new Date().toISOString()
        });
        return true;
      }
    } catch (error) {
      console.error(`Error setting value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a setting
   * @param {string} key - The setting key
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deleteSetting(key) {
    try {
      const result = await this.db.run(
        'DELETE FROM settings WHERE key = ?',
        [key]
      );
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting setting with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Gets all game settings
   * @returns {Promise<Object>} All settings grouped by category
   */
  async getAllSettings() {
    try {
      const records = await this.db.query(
        'SELECT key, value, category FROM settings ORDER BY category, key'
      );
      
      const settingsByCategory = {};
      
      records.forEach(record => {
        if (!settingsByCategory[record.category]) {
          settingsByCategory[record.category] = {};
        }
        
        // Try to parse JSON values
        try {
          settingsByCategory[record.category][record.key] = JSON.parse(record.value);
        } catch (e) {
          // If not JSON, use as is
          settingsByCategory[record.category][record.key] = record.value;
        }
      });
      
      return settingsByCategory;
    } catch (error) {
      console.error('Error retrieving all settings:', error);
      throw error;
    }
  }

  /**
   * Saves game settings
   * @param {Object} settings - Object with settings grouped by category
   * @returns {Promise<boolean>} True if settings were saved
   */
  async saveSettings(settings) {
    try {
      // Start a transaction
      const transactionId = await this.db.beginTransaction();
      
      try {
        for (const category in settings) {
          for (const key in settings[category]) {
            const value = settings[category][key];
            
            // Check if setting already exists
            const existing = await this.db.get(
              'SELECT id FROM settings WHERE key = ?',
              [key]
            );

            // Convert value to string
            const stringValue = typeof value === 'object' ? 
              JSON.stringify(value) : String(value);
            
            if (existing) {
              // Update existing setting
              await this.db.update('settings', existing.id, {
                value: stringValue,
                updated_at: new Date().toISOString()
              }, transactionId);
            } else {
              // Create new setting
              await this.db.insert('settings', {
                key,
                value: stringValue,
                category,
                updated_at: new Date().toISOString()
              }, transactionId);
            }
          }
        }

        // Commit the transaction
        await this.db.commitTransaction(transactionId);
        return true;
      } catch (error) {
        // Rollback on error
        await this.db.rollbackTransaction(transactionId);
        throw error;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Imports settings from a JSON object
   * @param {Object} settingsData - Settings data to import
   * @returns {Promise<boolean>} True if import successful
   */
  async importSettings(settingsData) {
    try {
      // Validate settings data
      if (!settingsData || typeof settingsData !== 'object') {
        throw new Error('Invalid settings data format');
      }

      return await this.saveSettings(settingsData);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Exports settings to a JSON object
   * @returns {Promise<Object>} Settings data
   */
  async exportSettings() {
    try {
      return await this.getAllSettings();
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }
}

module.exports = SettingsDAO;