// js/database/migrationManager.js
const fs = require('fs');
const path = require('path');
const { DatabaseManager } = require('./databaseManager');

class MigrationManager {
  constructor() {
    this.db = DatabaseManager.getInstance();
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.migrationTableName = 'migrations';
  }

  /**
   * Initialize migration table if it doesn't exist
   * @returns {Promise<void>}
   */
  async initMigrationTable() {
    try {
      const tableExists = await this.db.tableExists(this.migrationTableName);
      
      if (!tableExists) {
        const sql = `
          CREATE TABLE ${this.migrationTableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            batch INTEGER NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        await this.db.run(sql);
        console.log(`Created migrations table: ${this.migrationTableName}`);
      }
    } catch (error) {
      console.error('Error initializing migration table:', error);
      throw error;
    }
  }

  /**
   * Get all available migration files
   * @returns {Promise<Array<string>>} Array of migration filenames
   */
  async getAvailableMigrations() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.migrationsDir, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Filter for .js files and sort by name (which should include version numbers)
        const migrations = files
          .filter(file => file.endsWith('.js'))
          .sort();
        
        resolve(migrations);
      });
    });
  }

  /**
   * Get list of migrations that have already been applied
   * @returns {Promise<Array<string>>} Array of applied migration names
   */
  async getAppliedMigrations() {
    try {
      const results = await this.db.query(`SELECT name FROM ${this.migrationTableName} ORDER BY id`);
      return results.map(row => row.name);
    } catch (error) {
      console.error('Error getting applied migrations:', error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   * @returns {Promise<Array<string>>} Names of applied migrations
   */
  async migrate() {
    try {
      // Ensure migration table exists
      await this.initMigrationTable();
      
      // Get available and applied migrations
      const available = await this.getAvailableMigrations();
      const applied = await this.getAppliedMigrations();
      
      // Find pending migrations
      const pending = available.filter(migration => !applied.includes(migration));
      
      if (pending.length === 0) {
        console.log('No pending migrations.');
        return [];
      }
      
      console.log(`Found ${pending.length} pending migrations.`);
      
      // Get current batch number
      const batchResult = await this.db.query(
        `SELECT MAX(batch) as batch FROM ${this.migrationTableName}`
      );
      const batch = (batchResult[0]?.batch || 0) + 1;
      
      // Run each pending migration in a transaction
      const appliedMigrations = [];
      
      for (const migrationFile of pending) {
        try {
          console.log(`Applying migration: ${migrationFile}`);
          
          // Start transaction
          await this.db.beginTransaction();
          
          // Import and run migration
          const migrationPath = path.join(this.migrationsDir, migrationFile);
          const migration = require(migrationPath);
          
          if (typeof migration.up !== 'function') {
            throw new Error(`Migration ${migrationFile} does not have an up() method`);
          }
          
          await migration.up(this.db);
          
          // Record the migration
          await this.db.insert(this.migrationTableName, {
            name: migrationFile,
            batch: batch
          });
          
          // Commit transaction
          await this.db.commitTransaction();
          
          appliedMigrations.push(migrationFile);
          console.log(`Successfully applied migration: ${migrationFile}`);
        } catch (error) {
          // Rollback transaction on error
          await this.db.rollbackTransaction();
          console.error(`Error applying migration ${migrationFile}:`, error);
          throw error;
        }
      }
      
      console.log(`Applied ${appliedMigrations.length} migrations successfully.`);
      return appliedMigrations;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback the last batch of migrations
   * @returns {Promise<Array<string>>} Names of rolled back migrations
   */
  async rollback() {
    try {
      // Ensure migration table exists
      await this.initMigrationTable();
      
      // Get the last batch number
      const batchResult = await this.db.query(
        `SELECT MAX(batch) as batch FROM ${this.migrationTableName}`
      );
      const lastBatch = batchResult[0]?.batch;
      
      if (!lastBatch) {
        console.log('No migrations to rollback.');
        return [];
      }
      
      // Get migrations from the last batch
      const migrations = await this.db.query(
        `SELECT * FROM ${this.migrationTableName} WHERE batch = ? ORDER BY id DESC`,
        [lastBatch]
      );
      
      if (migrations.length === 0) {
        console.log('No migrations to rollback.');
        return [];
      }
      
      console.log(`Rolling back ${migrations.length} migrations from batch ${lastBatch}.`);
      
      // Roll back each migration in reverse order
      const rolledBackMigrations = [];
      
      for (const migration of migrations) {
        try {
          console.log(`Rolling back migration: ${migration.name}`);
          
          // Start transaction
          await this.db.beginTransaction();
          
          // Import and run down method
          const migrationPath = path.join(this.migrationsDir, migration.name);
          const migrationModule = require(migrationPath);
          
          if (typeof migrationModule.down !== 'function') {
            throw new Error(`Migration ${migration.name} does not have a down() method`);
          }
          
          await migrationModule.down(this.db);
          
          // Delete migration record
          await this.db.run(
            `DELETE FROM ${this.migrationTableName} WHERE id = ?`,
            [migration.id]
          );
          
          // Commit transaction
          await this.db.commitTransaction();
          
          rolledBackMigrations.push(migration.name);
          console.log(`Successfully rolled back migration: ${migration.name}`);
        } catch (error) {
          // Rollback transaction on error
          await this.db.rollbackTransaction();
          console.error(`Error rolling back migration ${migration.name}:`, error);
          throw error;
        }
      }
      
      console.log(`Rolled back ${rolledBackMigrations.length} migrations successfully.`);
      return rolledBackMigrations;
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Create a new migration file
   * @param {string} name - Name of the migration
   * @returns {Promise<string>} Path to the created migration file
   */
  async makeMigration(name) {
    return new Promise((resolve, reject) => {
      // Ensure migrations directory exists
      if (!fs.existsSync(this.migrationsDir)) {
        fs.mkdirSync(this.migrationsDir, { recursive: true });
      }
      
      // Format the filename with timestamp and name
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${timestamp}_${sanitizedName}.js`;
      const filePath = path.join(this.migrationsDir, filename);
      
      // Migration template
      const template = `
/**
 * Migration: ${name}
 * Created at: ${new Date().toISOString()}
 */
exports.up = async function(db) {
  // Add your migration code here
  // Example:
  // await db.run(\`
  //   CREATE TABLE example (
  //     id INTEGER PRIMARY KEY,
  //     name TEXT NOT NULL
  //   )
  // \`);
};

exports.down = async function(db) {
  // Code to revert the migration
  // Example:
  // await db.run('DROP TABLE IF EXISTS example');
};
`;
      
      // Write the migration file
      fs.writeFile(filePath, template.trim(), (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`Created migration: ${filename}`);
        resolve(filePath);
      });
    });
  }

  /**
   * Get migration status
   * @returns {Promise<Array<Object>>} List of migrations with status
   */
  async status() {
    try {
      // Ensure migration table exists
      await this.initMigrationTable();
      
      // Get available and applied migrations
      const available = await this.getAvailableMigrations();
      const appliedRows = await this.db.query(`
        SELECT name, batch, applied_at 
        FROM ${this.migrationTableName}
        ORDER BY id
      `);
      
      // Convert to a map for easier lookup
      const appliedMap = {};
      appliedRows.forEach(row => {
        appliedMap[row.name] = row;
      });
      
      // Build status report
      const status = available.map(name => {
        const applied = appliedMap[name];
        return {
          name,
          status: applied ? 'Applied' : 'Pending',
          batch: applied ? applied.batch : null,
          applied_at: applied ? applied.applied_at : null
        };
      });
      
      return status;
    } catch (error) {
      console.error('Error getting migration status:', error);
      throw error;
    }
  }
}

module.exports = { MigrationManager };