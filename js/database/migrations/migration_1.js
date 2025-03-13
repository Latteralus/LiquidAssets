// js/database/migrations/migration_1.js
module.exports = {
    up: async function(db) {
      return new Promise((resolve, reject) => {
        db.exec(`
          -- Game settings table
          CREATE TABLE settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            sound_enabled BOOLEAN NOT NULL DEFAULT 1,
            music_volume INTEGER NOT NULL DEFAULT 50,
            sfx_volume INTEGER NOT NULL DEFAULT 50,
            text_speed TEXT NOT NULL DEFAULT 'normal',
            autosave BOOLEAN NOT NULL DEFAULT 1,
            last_save_time TEXT,
            current_city_id INTEGER,
            current_venue_id INTEGER
          );
          
          -- Player table
          CREATE TABLE player (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT NOT NULL,
            cash REAL NOT NULL DEFAULT 10000,
            reputation INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Cities table
          CREATE TABLE cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            rent_multiplier REAL NOT NULL,
            wage_multiplier REAL NOT NULL,
            customer_affluence REAL NOT NULL,
            popularity INTEGER NOT NULL DEFAULT 50,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          
          -- City regulations table
          CREATE TABLE city_regulations (
            city_id INTEGER PRIMARY KEY,
            opening_hour_earliest INTEGER NOT NULL,
            opening_hour_latest INTEGER NOT NULL,
            alcohol_license_cost REAL NOT NULL,
            max_noise_level INTEGER NOT NULL,
            health_inspection_frequency INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
          );
          
          -- Venues table
          CREATE TABLE venues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            city_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            size TEXT NOT NULL,
            layout_data TEXT NOT NULL,
            opening_hour INTEGER NOT NULL,
            closing_hour INTEGER NOT NULL,
            music_volume INTEGER NOT NULL,
            lighting_level INTEGER NOT NULL,
            entrance_fee REAL NOT NULL DEFAULT 0,
            customer_capacity INTEGER NOT NULL,
            decoration_level INTEGER NOT NULL DEFAULT 1,
            cleaning_schedule TEXT NOT NULL DEFAULT 'daily',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES player(id),
            FOREIGN KEY (city_id) REFERENCES cities(id)
          );
          
          -- Venue stats table
          CREATE TABLE venue_stats (
            venue_id INTEGER PRIMARY KEY,
            popularity REAL NOT NULL DEFAULT 10,
            cleanliness REAL NOT NULL DEFAULT 100,
            atmosphere REAL NOT NULL DEFAULT 50,
            service_quality REAL NOT NULL DEFAULT 50,
            total_customers_served INTEGER NOT NULL DEFAULT 0,
            customer_satisfaction REAL NOT NULL DEFAULT 50,
            peak_hour_capacity INTEGER NOT NULL DEFAULT 0,
            last_health_inspection TEXT,
            health_inspection_score INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
          );
          
          -- Venue finances table
          CREATE TABLE venue_finances (
            venue_id INTEGER PRIMARY KEY,
            daily_revenue REAL NOT NULL DEFAULT 0,
            daily_expenses REAL NOT NULL DEFAULT 0,
            weekly_revenue REAL NOT NULL DEFAULT 0,
            weekly_expenses REAL NOT NULL DEFAULT 0,
            monthly_revenue REAL NOT NULL DEFAULT 0,
            monthly_expenses REAL NOT NULL DEFAULT 0,
            rent_per_month REAL NOT NULL,
            last_rent_payment INTEGER NOT NULL DEFAULT 0,
            utility_expense_per_day REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
          );
          
          -- Venue licenses table
          CREATE TABLE venue_licenses (
            venue_id INTEGER PRIMARY KEY,
            alcohol BOOLEAN NOT NULL DEFAULT 0,
            food BOOLEAN NOT NULL DEFAULT 0,
            music BOOLEAN NOT NULL DEFAULT 0,
            gambling BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
          );
          
          -- Staff table
          CREATE TABLE staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venue_id INTEGER,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            wage REAL NOT NULL,
            experience INTEGER NOT NULL,
            morale REAL NOT NULL DEFAULT 80,
            hire_date TEXT,
            is_working BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL
          );
          
          -- Staff skills table
          CREATE TABLE staff_skills (
            staff_id INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            skill_value INTEGER NOT NULL,
            PRIMARY KEY (staff_id, skill_name),
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );
          
          -- Staff personality table
          CREATE TABLE staff_personality (
            staff_id INTEGER NOT NULL,
            trait_name TEXT NOT NULL,
            trait_value INTEGER NOT NULL,
            PRIMARY KEY (staff_id, trait_name),
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );
          
          -- Staff schedule table
          CREATE TABLE staff_schedule (
            staff_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL, -- 0-6 for Sunday-Saturday
            working BOOLEAN NOT NULL DEFAULT 0,
            start_hour INTEGER,
            end_hour INTEGER,
            PRIMARY KEY (staff_id, day_of_week),
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );
          
          -- Inventory categories table
          CREATE TABLE inventory_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
          );
          
          -- Insert default inventory categories
          INSERT INTO inventory_categories (name) VALUES
            ('drinks'),
            ('food'),
            ('equipment');
          
          -- Inventory items table
          CREATE TABLE inventory_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venue_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT,
            cost_price REAL NOT NULL,
            sell_price REAL,
            stock INTEGER DEFAULT 0,
            condition REAL,
            quality TEXT,
            quantity INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES inventory_categories(id)
          );
          
          -- Transactions table
          CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venue_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT,
            amount REAL NOT NULL,
            game_date_year INTEGER NOT NULL,
            game_date_month INTEGER NOT NULL,
            game_date_day INTEGER NOT NULL,
            game_date_hour INTEGER NOT NULL,
            game_date_minute INTEGER NOT NULL,
            item TEXT,
            quantity INTEGER,
            price REAL,
            staff_id INTEGER,
            timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
          );
          
          -- Time tracking table
          CREATE TABLE game_time (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            day INTEGER NOT NULL,
            hour INTEGER NOT NULL,
            minute INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Events table
          CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            subtype TEXT,
            description TEXT NOT NULL,
            venue_id INTEGER,
            staff_id INTEGER,
            city TEXT,
            scheduled_year INTEGER,
            scheduled_month INTEGER,
            scheduled_day INTEGER,
            scheduled_hour INTEGER,
            recurring BOOLEAN NOT NULL DEFAULT 0,
            triggered BOOLEAN NOT NULL DEFAULT 0,
            triggered_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
          );
          
          -- Reports table
          CREATE TABLE reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venue_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            revenue REAL NOT NULL,
            expenses REAL NOT NULL,
            profit REAL NOT NULL,
            profit_margin REAL NOT NULL,
            customer_count INTEGER NOT NULL,
            popularity REAL NOT NULL,
            customer_satisfaction REAL NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
          );
          
          -- Save metadata table
          CREATE TABLE save_metadata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            save_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            save_version TEXT NOT NULL,
            description TEXT
          );
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
    
    down: async function(db) {
      return new Promise((resolve, reject) => {
        db.exec(`
          DROP TABLE IF EXISTS save_metadata;
          DROP TABLE IF EXISTS reports;
          DROP TABLE IF EXISTS events;
          DROP TABLE IF EXISTS game_time;
          DROP TABLE IF EXISTS transactions;
          DROP TABLE IF EXISTS inventory_items;
          DROP TABLE IF EXISTS inventory_categories;
          DROP TABLE IF EXISTS staff_schedule;
          DROP TABLE IF EXISTS staff_personality;
          DROP TABLE IF EXISTS staff_skills;
          DROP TABLE IF EXISTS staff;
          DROP TABLE IF EXISTS venue_licenses;
          DROP TABLE IF EXISTS venue_finances;
          DROP TABLE IF EXISTS venue_stats;
          DROP TABLE IF EXISTS venues;
          DROP TABLE IF EXISTS city_regulations;
          DROP TABLE IF EXISTS cities;
          DROP TABLE IF EXISTS player;
          DROP TABLE IF EXISTS settings;
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  };