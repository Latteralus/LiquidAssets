// js/database/databaseManager.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const os = require('os');

// Define connection pool size based on environment
const POOL_SIZE = process.env.NODE_ENV === 'production' ? 5 : 2;

class DatabaseManager {
  static instance = null;

  /**
   * Get singleton instance of DatabaseManager
   * @returns {DatabaseManager}
   */
  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'liquid-assets.db');
    this.isInitialized = false;
    this.pool = [];
    this.activeConnections = 0;
    this.connectionQueue = [];
    this.transactionConnections = new Map(); // Map to track connections used in transactions
  }

  /**
   * Initialize the database
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Create initial connection pool
      for (let i = 0; i < POOL_SIZE; i++) {
        const connection = await this.createConnection();
        this.pool.push(connection);
      }

      // Set pragma configurations for all connections
      for (const conn of this.pool) {
        await this.runOnConnection(conn, 'PRAGMA foreign_keys = ON');
        await this.runOnConnection(conn, 'PRAGMA journal_mode = WAL');
      }

      this.isInitialized = true;
      console.log(`Database initialized with connection pool of size ${POOL_SIZE}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Create a new database connection
   * @private
   * @returns {Promise<sqlite3.Database>}
   */
  createConnection() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Could not connect to database: ${err.message}`));
          return;
        }
        resolve(db);
      });
    });
  }

  /**
   * Get a connection from the pool or create a new one if needed
   * @private
   * @param {string} [requesterId] - Optional ID for transaction tracking
   * @returns {Promise<sqlite3.Database>}
   */
  async getConnection(requesterId = null) {
    // If this is part of a transaction, return the same connection
    if (requesterId && this.transactionConnections.has(requesterId)) {
      return this.transactionConnections.get(requesterId);
    }

    // If pool has available connections, use one
    if (this.pool.length > 0) {
      const connection = this.pool.pop();
      this.activeConnections++;
      
      // If this is for a transaction, track it
      if (requesterId) {
        this.transactionConnections.set(requesterId, connection);
      }
      
      return connection;
    }

    // If we've reached max connections, wait for one to be released
    if (this.activeConnections >= POOL_SIZE) {
      return new Promise((resolve) => {
        this.connectionQueue.push((connection) => {
          this.activeConnections++;
          
          if (requesterId) {
            this.transactionConnections.set(requesterId, connection);
          }
          
          resolve(connection);
        });
      });
    }

    // Create a new connection if under the limit
    const connection = await this.createConnection();
    this.activeConnections++;
    
    if (requesterId) {
      this.transactionConnections.set(requesterId, connection);
    }
    
    return connection;
  }

  /**
   * Release a connection back to the pool
   * @private
   * @param {sqlite3.Database} connection
   * @param {string} [requesterId] - Optional ID for transaction tracking
   */
  releaseConnection(connection, requesterId = null) {
    // If this is a transaction connection and we're not explicitly ending the transaction, keep it
    if (requesterId && this.transactionConnections.has(requesterId)) {
      return;
    }

    // If we have waiting requests, give them this connection
    if (this.connectionQueue.length > 0) {
      const nextRequest = this.connectionQueue.shift();
      nextRequest(connection);
      return;
    }

    // Otherwise, put it back in the pool
    this.pool.push(connection);
    this.activeConnections--;

    // If requesterId is provided, remove it from transaction tracking
    if (requesterId) {
      this.transactionConnections.delete(requesterId);
    }
  }

  /**
   * Generate a unique request ID for transaction tracking
   * @private
   * @returns {string}
   */
  generateRequestId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Run a SQL statement on a specific connection
   * @private
   * @param {sqlite3.Database} connection
   * @param {string} sql
   * @param {Array} [params=[]]
   * @returns {Promise<void>}
   */
  runOnConnection(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection.run(sql, params, function(err) {
        if (err) {
          reject(new Error(`SQL error in run: ${err.message} for query: ${sql}`));
          return;
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Execute a SQL query with params on a specific connection
   * @private
   * @param {sqlite3.Database} connection
   * @param {string} sql
   * @param {Array} [params=[]]
   * @returns {Promise<Array>}
   */
  queryOnConnection(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection.all(sql, params, (err, rows) => {
        if (err) {
          reject(new Error(`SQL error in query: ${err.message} for query: ${sql}`));
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Execute a single fetch query on a specific connection
   * @private
   * @param {sqlite3.Database} connection
   * @param {string} sql
   * @param {Array} [params=[]]
   * @returns {Promise<Object|null>}
   */
  getOnConnection(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection.get(sql, params, (err, row) => {
        if (err) {
          reject(new Error(`SQL error in get: ${err.message} for query: ${sql}`));
          return;
        }
        resolve(row || null);
      });
    });
  }

  /**
   * Execute a SQL statement with proper connection management
   * @param {string} sql - SQL statement to execute
   * @param {Array} [params=[]] - Parameters for the SQL statement
   * @returns {Promise<Object>} Object with lastID and changes properties
   */
  async run(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const connection = await this.getConnection();
    try {
      const result = await this.runOnConnection(connection, sql, params);
      this.releaseConnection(connection);
      return result;
    } catch (error) {
      this.releaseConnection(connection);
      throw error;
    }
  }

  /**
   * Execute a SQL query and return all results
   * @param {string} sql - SQL query
   * @param {Array} [params=[]] - Parameters for the SQL query
   * @returns {Promise<Array>} Array of result rows
   */
  async query(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const connection = await this.getConnection();
    try {
      const rows = await this.queryOnConnection(connection, sql, params);
      this.releaseConnection(connection);
      return rows;
    } catch (error) {
      this.releaseConnection(connection);
      throw error;
    }
  }

  /**
   * Fetch a single record from the database
   * @param {string} sql - SQL query
   * @param {Array} [params=[]] - Parameters for the SQL query
   * @returns {Promise<Object|null>} Single result row or null
   */
  async get(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const connection = await this.getConnection();
    try {
      const row = await this.getOnConnection(connection, sql, params);
      this.releaseConnection(connection);
      return row;
    } catch (error) {
      this.releaseConnection(connection);
      throw error;
    }
  }

  /**
   * Begin a transaction
   * @returns {Promise<string>} Transaction ID
   */
  async beginTransaction() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const transactionId = this.generateRequestId();
    const connection = await this.getConnection(transactionId);
    
    try {
      await this.runOnConnection(connection, 'BEGIN TRANSACTION');
      return transactionId;
    } catch (error) {
      this.releaseConnection(connection, transactionId);
      throw error;
    }
  }

  /**
   * Commit a transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<boolean>}
   */
  async commitTransaction(transactionId) {
    if (!transactionId || !this.transactionConnections.has(transactionId)) {
      throw new Error('Invalid transaction ID');
    }

    const connection = this.transactionConnections.get(transactionId);
    
    try {
      await this.runOnConnection(connection, 'COMMIT');
      this.releaseConnection(connection, transactionId);
      return true;
    } catch (error) {
      this.releaseConnection(connection, transactionId);
      throw error;
    }
  }

  /**
   * Rollback a transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<boolean>}
   */
  async rollbackTransaction(transactionId) {
    if (!transactionId || !this.transactionConnections.has(transactionId)) {
      throw new Error('Invalid transaction ID');
    }

    const connection = this.transactionConnections.get(transactionId);
    
    try {
      await this.runOnConnection(connection, 'ROLLBACK');
      this.releaseConnection(connection, transactionId);
      return true;
    } catch (error) {
      this.releaseConnection(connection, transactionId);
      throw error;
    }
  }

  /**
   * Insert a record into a table
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @param {string} [transactionId] - Optional transaction ID
   * @returns {Promise<number>} ID of inserted record
   */
  async insert(table, data, transactionId = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const connection = await this.getConnection(transactionId);
    
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => data[col]);
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      const result = await this.runOnConnection(connection, sql, values);
      
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      
      return result.lastID;
    } catch (error) {
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      throw error;
    }
  }

  /**
   * Update a record in a table
   * @param {string} table - Table name
   * @param {number|string} id - ID of record to update
   * @param {Object} data - Data to update
   * @param {string} [transactionId] - Optional transaction ID
   * @returns {Promise<boolean>} True if update was successful
   */
  async update(table, id, data, transactionId = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const connection = await this.getConnection(transactionId);
    
    try {
      const columns = Object.keys(data);
      const setClauses = columns.map(col => `${col} = ?`).join(', ');
      const values = columns.map(col => data[col]);
      
      // Add ID to values
      values.push(id);
      
      const sql = `UPDATE ${table} SET ${setClauses} WHERE id = ?`;
      
      const result = await this.runOnConnection(connection, sql, values);
      
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      
      return result.changes > 0;
    } catch (error) {
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      throw error;
    }
  }

  /**
   * Delete a record from a table
   * @param {string} table - Table name
   * @param {number|string} id - ID of record to delete
   * @param {string} [transactionId] - Optional transaction ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(table, id, transactionId = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const connection = await this.getConnection(transactionId);
    
    try {
      const sql = `DELETE FROM ${table} WHERE id = ?`;
      const result = await this.runOnConnection(connection, sql, [id]);
      
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      
      return result.changes > 0;
    } catch (error) {
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      throw error;
    }
  }

  /**
   * Get a record by ID
   * @param {string} table - Table name
   * @param {number|string} id - ID of record to retrieve
   * @param {string} [transactionId] - Optional transaction ID
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async getById(table, id, transactionId = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const connection = await this.getConnection(transactionId);
    
    try {
      const sql = `SELECT * FROM ${table} WHERE id = ?`;
      const row = await this.getOnConnection(connection, sql, [id]);
      
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      
      return row;
    } catch (error) {
      if (!transactionId) {
        this.releaseConnection(connection);
      }
      throw error;
    }
  }

  /**
   * Check if a table exists
   * @param {string} tableName - Name of table to check
   * @returns {Promise<boolean>} True if table exists
   */
  async tableExists(tableName) {
    try {
      const result = await this.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return !!result;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      throw error;
    }
  }

  /**
   * Close all database connections
   * @returns {Promise<void>}
   */
  async close() {
    return new Promise((resolve, reject) => {
      const closeConnection = (conn) => {
        return new Promise((resolveClose) => {
          conn.close((err) => {
            if (err) {
              console.error('Error closing connection:', err);
            }
            resolveClose();
          });
        });
      };

      // Close all pool connections
      Promise.all([
        ...this.pool.map(closeConnection),
        ...Array.from(this.transactionConnections.values()).map(closeConnection)
      ])
        .then(() => {
          this.pool = [];
          this.transactionConnections.clear();
          this.activeConnections = 0;
          this.connectionQueue = [];
          this.isInitialized = false;
          console.log('All database connections closed');
          resolve();
        })
        .catch(reject);
    });
  }

  const fs = require('fs');
const path = require('path');

/**
 * Create a sample migration file
 * @returns {string} Path to the first migration file
 */
async function createSampleMigration() {
  const migrationsDir = path.join(__dirname, 'migrations');

  // Make sure the migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${timestamp}_initial_schema.js`;
  const filePath = path.join(migrationsDir, filename);

  const migrationContent = `
/**
 * Migration: Initial Schema
 * Created at: ${new Date().toISOString()}
 */
exports.up = async function(db) {

Create venues table
  await db.run(\`
    CREATE TABLE venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      city TEXT NOT NULL,
      size TEXT NOT NULL DEFAULT 'small',
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      finances TEXT NOT NULL, 
      settings TEXT NOT NULL,
      stats TEXT NOT NULL,
      layout TEXT NOT NULL,
      staff TEXT NOT NULL,
      inventory TEXT NOT NULL,
      licences TEXT NOT NULL,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  \`);

  // Create players table
  await db.run(\`
    CREATE TABLE players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cash REAL NOT NULL DEFAULT 10000,
      reputation INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      settings TEXT NOT NULL
    );
  \`);

  // Create staff table
  await db.run(\`
    CREATE TABLE staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      skills TEXT NOT NULL,
      wage REAL NOT NULL,
      experience INTEGER NOT NULL DEFAULT 0,
      personality TEXT NOT NULL,
      morale INTEGER NOT NULL DEFAULT 80,
      hire_date TIMESTAMP,
      working_days TEXT NOT NULL,
      working_hours TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL
    );
  \`);

  // Create inventory_items table
  await db.run(\`
    CREATE TABLE inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      subtype TEXT NOT NULL,
      cost_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      quality TEXT,
      condition INTEGER,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );
  \`);

  // Create transactions table
  await db.run(\`
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      item TEXT,
      quantity INTEGER,
      price REAL,
      amount REAL NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      metadata TEXT,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );
  \`);

  // Create customer_visits table
  await db.run(\`
    CREATE TABLE customer_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      visit_date TIMESTAMP NOT NULL,
      customer_type TEXT NOT NULL,
      group_size INTEGER NOT NULL,
      total_spent REAL NOT NULL,
      satisfaction INTEGER NOT NULL,
      status TEXT NOT NULL,
      metadata TEXT,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );
  \`);

  // Create settings table
  await db.run(\`
    CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  \`);

  // Create events table
  await db.run(\`
    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER,
      type TEXT NOT NULL,
      subtype TEXT,
      description TEXT NOT NULL,
      scheduled_year INTEGER,
      scheduled_month INTEGER,
      scheduled_day INTEGER,
      scheduled_hour INTEGER,
      recurring BOOLEAN NOT NULL DEFAULT 0,
      triggered_at TIMESTAMP,
      resolved BOOLEAN NOT NULL DEFAULT 0,
      resolution TEXT,
      metadata TEXT,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );
  \`);

  // Create cities table
  await db.run(\`
    CREATE TABLE cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      rent_multiplier REAL NOT NULL,
      wage_multiplier REAL NOT NULL,
      customer_affluence REAL NOT NULL,
      popularity INTEGER NOT NULL DEFAULT 50,
      regulations TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  \`);

  // Create saved_games table
  await db.run(\`
    CREATE TABLE saved_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      save_date TIMESTAMP NOT NULL,
      version TEXT NOT NULL,
      game_data TEXT NOT NULL,
      metadata TEXT
    );
  \`);

  // Create indexes for better performance
  await db.run(\`CREATE INDEX idx_venues_player_id ON venues(player_id);\`);
  await db.run(\`CREATE INDEX idx_venues_city ON venues(city);\`);
  await db.run(\`CREATE INDEX idx_staff_venue_id ON staff(venue_id);\`);
  await db.run(\`CREATE INDEX idx_inventory_venue_id ON inventory_items(venue_id);\`);
  await db.run(\`CREATE INDEX idx_transactions_venue_id ON transactions(venue_id);\`);
  await db.run(\`CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);\`);
  await db.run(\`CREATE INDEX idx_customer_visits_venue_id ON customer_visits(venue_id);\`);
  await db.run(\`CREATE INDEX idx_customer_visits_date ON customer_visits(visit_date);\`);
  await db.run(\`CREATE INDEX idx_events_venue_id ON events(venue_id);\`);
  await db.run(\`CREATE INDEX idx_settings_key ON settings(key);\`);
  await db.run(\`CREATE INDEX idx_settings_category ON settings(category);\`);
};

exports.down = async function(db) {
  // Drop tables in reverse order to avoid foreign key constraint issues
  await db.run('DROP TABLE IF EXISTS saved_games');
  await db.run('DROP TABLE IF EXISTS cities');
  await db.run('DROP TABLE IF EXISTS events');
  await db.run('DROP TABLE IF EXISTS settings');
  await db.run('DROP TABLE IF EXISTS customer_visits');
  await db.run('DROP TABLE IF EXISTS transactions');
  await db.run('DROP TABLE IF EXISTS inventory_items');
  await db.run('DROP TABLE IF EXISTS staff');
  await db.run('DROP TABLE IF EXISTS venues');
  await db.run('DROP TABLE IF EXISTS players');
};
`;

  fs.writeFileSync(filePath, migrationContent.trim());
  console.log(`Created sample migration: ${filePath}`);
  return filePath;
}

module.exports = { createSampleMigration };
