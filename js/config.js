// Game configuration and constants

const GAME_CONSTANTS = {
    STARTING_CASH: 10000,
    TIME_SCALE: 1, // How many minutes pass per real second
    EXPENSE_CYCLE: 30, // Days between recurring expenses
    CUSTOMER_MAX_PATIENCE: 60, // Minutes before customers leave if not served
    STAFF_WAGE_CYCLE: 7, // Days between paying staff
    CITIES: ['London', 'Berlin', 'Paris', 'Madrid', 'Rome'],
    ESTABLISHMENT_TYPES: ['Bar', 'Nightclub', 'Restaurant', 'Fast Food'],
    MAX_STAFF: 20,
    MAX_CUSTOMERS: 100
  };
  
  const CITY_DATA = {
    London: {
      rentMultiplier: 1.5,
      wageMultiplier: 1.4,
      customerAffluence: 1.3,
      openingHours: { earliest: 6, latest: 2 }, // 6 AM to 2 AM
      alcoholLicenseCost: 1500,
      noiseRestriction: 70, // 0-100 scale
      healthInspectionFrequency: 60 // Days between inspections
    },
    Berlin: {
      rentMultiplier: 1.1,
      wageMultiplier: 1.2,
      customerAffluence: 1.1,
      openingHours: { earliest: 0, latest: 24 }, // 24/7 allowed
      alcoholLicenseCost: 1000,
      noiseRestriction: 90,
      healthInspectionFrequency: 45
    },
    Paris: {
      rentMultiplier: 1.3,
      wageMultiplier: 1.3,
      customerAffluence: 1.4,
      openingHours: { earliest: 8, latest: 2 }, // 8 AM to 2 AM
      alcoholLicenseCost: 1200,
      noiseRestriction: 60,
      healthInspectionFrequency: 30
    },
    Madrid: {
      rentMultiplier: 0.9,
      wageMultiplier: 0.9,
      customerAffluence: 0.9,
      openingHours: { earliest: 10, latest: 5 }, // 10 AM to 5 AM
      alcoholLicenseCost: 900,
      noiseRestriction: 80,
      healthInspectionFrequency: 90
    },
    Rome: {
      rentMultiplier: 1.0,
      wageMultiplier: 1.0,
      customerAffluence: 1.0,
      openingHours: { earliest: 9, latest: 1 }, // 9 AM to 1 AM
      alcoholLicenseCost: 1100,
      noiseRestriction: 65,
      healthInspectionFrequency: 50
    }
  };
  
  const VENUE_SIZES = {
    small: {
      capacity: 30,
      baseRent: 1000,
      baseUtilities: 20,
      upgradePrice: 5000
    },
    medium: {
      capacity: 75,
      baseRent: 2000,
      baseUtilities: 36,
      upgradePrice: 12000
    },
    large: {
      capacity: 150,
      baseRent: 3500,
      baseUtilities: 60,
      upgradePrice: null // Cannot upgrade further
    }
  };
  
  const STAFF_TYPES = {
    bartender: {
      baseSalary: 500,
      skillNames: ['mixing', 'speed', 'customer service'],
      description: 'Prepares and serves drinks'
    },
    waiter: {
      baseSalary: 400,
      skillNames: ['speed', 'customer service', 'memory'],
      description: 'Takes orders and serves food/drinks'
    },
    cook: {
      baseSalary: 600,
      skillNames: ['cooking', 'speed', 'creativity'],
      description: 'Prepares food in the kitchen'
    },
    bouncer: {
      baseSalary: 450,
      skillNames: ['intimidation', 'judgment', 'reliability'],
      description: 'Controls entry and maintains order'
    },
    dj: {
      baseSalary: 550,
      skillNames: ['mixing', 'crowd reading', 'popularity'],
      description: 'Plays music and energizes the crowd'
    },
    manager: {
      baseSalary: 800,
      skillNames: ['leadership', 'organization', 'problem solving'],
      description: 'Oversees staff and improves efficiency'
    },
    cleaner: {
      baseSalary: 350,
      skillNames: ['thoroughness', 'speed', 'reliability'],
      description: 'Maintains cleanliness of the venue'
    }
  };
  
  const CUSTOMER_TYPES = {
    regular: {
      patienceModifier: 1.2, // More patient
      spendingModifier: 1.0,
      groupSizeProbability: [0.6, 0.3, 0.1, 0.0], // Probability of 1, 2, 3, or 4 people
      description: 'Local customers who visit frequently'
    },
    tourist: {
      patienceModifier: 0.8, // Less patient
      spendingModifier: 1.2, // Spends more
      groupSizeProbability: [0.2, 0.4, 0.3, 0.1],
      description: 'Visitors who are exploring the city'
    },
    business: {
      patienceModifier: 0.7, // Impatient
      spendingModifier: 1.5, // Spends much more
      groupSizeProbability: [0.3, 0.5, 0.2, 0.0],
      description: 'Professionals on business trips or after work'
    },
    student: {
      patienceModifier: 1.3, // Very patient
      spendingModifier: 0.7, // Spends less
      groupSizeProbability: [0.2, 0.3, 0.4, 0.1],
      description: 'Young people with limited budgets but plenty of time'
    }
  };
  
  module.exports = {
    GAME_CONSTANTS,
    CITY_DATA,
    VENUE_SIZES,
    STAFF_TYPES,
    CUSTOMER_TYPES
  };