// js/database/dao/inventoryDAO.js
const { DatabaseManager } = require('../databaseManager');

class InventoryDAO {
  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Adds a new inventory item to a venue
   * @param {Object} item - The inventory item to add
   * @returns {Promise<number>} ID of created inventory item
   */
  async addInventoryItem(item) {
    try {
      // Ensure item has all required fields
      if (!item.venueId || !item.name || !item.type || !item.subtype || item.costPrice === undefined) {
        throw new Error('Missing required inventory item properties');
      }

      // Convert item object to a format suitable for database
      const itemRecord = {
        venue_id: item.venueId,
        name: item.name,
        type: item.type,
        subtype: item.subtype,
        cost_price: item.costPrice,
        sell_price: item.sellPrice || item.costPrice * 2, // Default markup
        stock: item.stock || 0,
        quality: item.quality || 'standard',
        condition: item.condition || 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert item record and get the ID
      return await this.db.insert('inventory_items', itemRecord);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  /**
   * Gets all inventory items for a venue
   * @param {string|number} venueId - The venue ID
   * @param {string} [type] - Optional type filter
   * @returns {Promise<Array>} Array of inventory item objects
   */
  async getInventoryByVenue(venueId, type = null) {
    try {
      let query = 'SELECT * FROM inventory_items WHERE venue_id = ?';
      const params = [venueId];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY type, subtype, name';

      const records = await this.db.query(query, params);
      return records.map(record => this.mapRecordToInventoryItem(record));
    } catch (error) {
      console.error(`Error retrieving inventory for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets a specific inventory item by ID
   * @param {string|number} id - The inventory item ID
   * @returns {Promise<Object|null>} The inventory item or null if not found
   */
  async getInventoryItemById(id) {
    try {
      const record = await this.db.getById('inventory_items', id);
      
      if (!record) {
        return null;
      }

      return this.mapRecordToInventoryItem(record);
    } catch (error) {
      console.error(`Error retrieving inventory item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an inventory item
   * @param {string|number} id - The inventory item ID
   * @param {Object} itemData - The updated item data
   * @returns {Promise<boolean>} True if update successful
   */
  async updateInventoryItem(id, itemData) {
    try {
      // Prepare update object with only supported fields
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Update basic fields
      if (itemData.name !== undefined) updateData.name = itemData.name;
      if (itemData.costPrice !== undefined) updateData.cost_price = itemData.costPrice;
      if (itemData.sellPrice !== undefined) updateData.sell_price = itemData.sellPrice;
      if (itemData.stock !== undefined) updateData.stock = itemData.stock;
      if (itemData.quality !== undefined) updateData.quality = itemData.quality;
      if (itemData.condition !== undefined) updateData.condition = itemData.condition;
      if (itemData.subtype !== undefined) updateData.subtype = itemData.subtype;

      // Perform update
      return await this.db.update('inventory_items', id, updateData);
    } catch (error) {
      console.error(`Error updating inventory item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates inventory stock level
   * @param {string|number} id - The inventory item ID
   * @param {number} stockChange - The change in stock (positive or negative)
   * @returns {Promise<boolean>} True if update successful
   */
  async updateStock(id, stockChange) {
    try {
      const item = await this.getInventoryItemById(id);
      
      if (!item) {
        throw new Error(`Inventory item with ID ${id} not found`);
      }

      const newStock = Math.max(0, item.stock + stockChange);
      
      return await this.updateInventoryItem(id, { stock: newStock });
    } catch (error) {
      console.error(`Error updating stock for inventory item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates the condition of an equipment item
   * @param {string|number} id - The inventory item ID
   * @param {number} conditionChange - The change in condition (positive or negative)
   * @returns {Promise<boolean>} True if update successful
   */
  async updateCondition(id, conditionChange) {
    try {
      const item = await this.getInventoryItemById(id);
      
      if (!item) {
        throw new Error(`Inventory item with ID ${id} not found`);
      }

      if (item.type !== 'equipment') {
        throw new Error('Condition can only be updated for equipment items');
      }

      const newCondition = Math.max(0, Math.min(100, item.condition + conditionChange));
      
      return await this.updateInventoryItem(id, { condition: newCondition });
    } catch (error) {
      console.error(`Error updating condition for inventory item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an inventory item
   * @param {string|number} id - The inventory item ID
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deleteInventoryItem(id) {
    try {
      return await this.db.delete('inventory_items', id);
    } catch (error) {
      console.error(`Error deleting inventory item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets items with low stock
   * @param {string|number} venueId - The venue ID
   * @param {number} [threshold=10] - Stock level threshold
   * @returns {Promise<Array>} Array of low stock items
   */
  async getLowStockItems(venueId, threshold = 10) {
    try {
      const query = `
        SELECT * FROM inventory_items 
        WHERE venue_id = ? 
        AND type IN ('drinks', 'food')
        AND stock <= ?
        ORDER BY stock ASC
      `;

      const records = await this.db.query(query, [venueId, threshold]);
      return records.map(record => this.mapRecordToInventoryItem(record));
    } catch (error) {
      console.error(`Error getting low stock items for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets equipment items that need maintenance
   * @param {string|number} venueId - The venue ID
   * @param {number} [threshold=40] - Condition threshold
   * @returns {Promise<Array>} Array of equipment items needing maintenance
   */
  async getEquipmentNeedingMaintenance(venueId, threshold = 40) {
    try {
      const query = `
        SELECT * FROM inventory_items 
        WHERE venue_id = ? 
        AND type = 'equipment'
        AND condition <= ?
        ORDER BY condition ASC
      `;

      const records = await this.db.query(query, [venueId, threshold]);
      return records.map(record => this.mapRecordToInventoryItem(record));
    } catch (error) {
      console.error(`Error getting equipment needing maintenance for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Gets inventory value summary for a venue
   * @param {string|number} venueId - The venue ID
   * @returns {Promise<Object>} Inventory value summary
   */
  async getInventoryValueSummary(venueId) {
    try {
      const query = `
        SELECT 
          type,
          SUM(cost_price * stock) AS total_value,
          COUNT(*) AS item_count,
          SUM(stock) AS total_stock
        FROM inventory_items 
        WHERE venue_id = ? 
        GROUP BY type
      `;

      const results = await this.db.query(query, [venueId]);
      
      // Calculate grand total
      let grandTotal = 0;
      results.forEach(result => {
        grandTotal += result.total_value;
      });

      return {
        categories: results,
        totalValue: grandTotal
      };
    } catch (error) {
      console.error(`Error getting inventory value summary for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Analyzes inventory profitability
   * @param {string|number} venueId - The venue ID
   * @returns {Promise<Array>} Array of item profitability objects
   */
  async analyzeInventoryProfitability(venueId) {
    try {
      const query = `
        SELECT 
          id,
          name,
          type,
          subtype,
          cost_price,
          sell_price,
          stock,
          (sell_price - cost_price) AS profit_per_unit,
          ((sell_price - cost_price) / cost_price * 100) AS markup_percentage
        FROM inventory_items 
        WHERE venue_id = ? 
        AND type IN ('drinks', 'food')
        ORDER BY markup_percentage DESC
      `;

      return await this.db.query(query, [venueId]);
    } catch (error) {
      console.error(`Error analyzing inventory profitability for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Maps a database record to an inventory item object
   * @private
   * @param {Object} record - The database record
   * @returns {Object} The inventory item object
   */
  mapRecordToInventoryItem(record) {
    return {
      id: record.id,
      venueId: record.venue_id,
      name: record.name,
      type: record.type,
      subtype: record.subtype,
      costPrice: record.cost_price,
      sellPrice: record.sell_price,
      stock: record.stock,
      quality: record.quality,
      condition: record.condition,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}

module.exports = InventoryDAO;