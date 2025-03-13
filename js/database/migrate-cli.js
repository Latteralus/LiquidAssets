// js/database/migrate-cli.js
const { MigrationManager } = require('./migrationManager');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const migrationManager = new MigrationManager();

  try {
    switch (command) {
      case 'migrate':
        console.log('Running migrations...');
        await migrationManager.migrate();
        break;

      case 'rollback':
        console.log('Rolling back migrations...');
        await migrationManager.rollback();
        break;

      case 'status':
        console.log('Checking migration status...');
        const status = await migrationManager.status();
        console.table(status);
        break;

      case 'make':
        if (!args[1]) {
          console.error('Error: Migration name is required');
          console.log('Usage: node migrate-cli.js make <migration-name>');
          process.exit(1);
        }
        console.log(`Creating migration: ${args[1]}...`);
        const path = await migrationManager.makeMigration(args[1]);
        console.log(`Migration created at: ${path}`);
        break;

      case 'init':
        console.log('Creating initial migration file...');
        const dbManager = require('./databaseManager').DatabaseManager.getInstance();
        const filePath = dbManager.createSampleMigration();
        console.log(`Sample migration created at: ${filePath}`);
        break;

      default:
        console.log('Available commands:');
        console.log('  migrate - Run all pending migrations');
        console.log('  rollback - Rollback the last batch of migrations');
        console.log('  status - Check migration status');
        console.log('  make <name> - Create a new migration file');
        console.log('  init - Create a sample initial migration');
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Close any open connections
    const dbManager = require('./databaseManager').DatabaseManager.getInstance();
    await dbManager.close();
  }
}

main();