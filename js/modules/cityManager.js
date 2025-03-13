// City Manager - Handles city-specific properties and differences

const { GAME_CONSTANTS, CITY_DATA } = require('../config');

class CityManager {
  constructor(game) {
    this.game = game;
    this.cities = {};
  }
  
  initializeCities() {
    // Initialize all cities with their base properties
    GAME_CONSTANTS.CITIES.forEach(cityName => {
      this.cities[cityName] = {
        name: cityName,
        rentMultiplier: CITY_DATA[cityName].rentMultiplier,
        wageMultiplier: CITY_DATA[cityName].wageMultiplier,
        customerAffluence: CITY_DATA[cityName].customerAffluence,
        popularity: 50, // Base popularity out of 100
        regulations: {
          openingHoursRestriction: CITY_DATA[cityName].openingHours,
          alcoholLicenseCost: CITY_DATA[cityName].alcoholLicenseCost,
          maxNoiseLevelAllowed: CITY_DATA[cityName].noiseRestriction,
          healthInspectionFrequency: CITY_DATA[cityName].healthInspectionFrequency
        },
        events: [], // For city-specific events
        venues: [] // All venues in the city
      };
    });
  }
  
  getCities() {
    return { ...this.cities };
  }
  
  setCities(citiesData) {
    this.cities = { ...citiesData };
  }
  
  getCity(cityName) {
    return this.cities[cityName];
  }
  
  getCurrentCity() {
    return this.cities[this.game.state.currentCity];
  }
  
  setCurrentCity(cityName) {
    if (this.cities[cityName]) {
      this.game.state.currentCity = cityName;
      return true;
    }
    return false;
  }
  
  getCityRentMultiplier(cityName) {
    return this.cities[cityName].rentMultiplier;
  }
  
  getCityWageMultiplier(cityName) {
    return this.cities[cityName].wageMultiplier;
  }
  
  getCityCustomerAffluence(cityName) {
    return this.cities[cityName].customerAffluence;
  }
  
  getCityRegulations(cityName) {
    return { ...this.cities[cityName].regulations };
  }
  
  isWithinOpeningHoursRegulation(cityName, openingHour, closingHour) {
    const restrictions = this.cities[cityName].regulations.openingHoursRestriction;
    
    // Check if the hours comply with regulations
    if (closingHour < openingHour) {
      // Venue closes after midnight
      if (openingHour < restrictions.earliest) {
        return false; // Opening too early
      }
      if (closingHour > restrictions.latest && restrictions.latest < 24) {
        return false; // Closing too late
      }
    } else {
      // Normal hours
      if (openingHour < restrictions.earliest) {
        return false; // Opening too early
      }
      if (closingHour > restrictions.latest) {
        return false; // Closing too late
      }
    }
    
    return true;
  }
  
  checkNoiseCompliance(cityName, noiseLevel) {
    return noiseLevel <= this.cities[cityName].regulations.maxNoiseLevelAllowed;
  }
  
  updateCityPopularity(cityName, delta) {
    this.cities[cityName].popularity += delta;
    
    // Clamp popularity between 0 and 100
    if (this.cities[cityName].popularity < 0) {
      this.cities[cityName].popularity = 0;
    } else if (this.cities[cityName].popularity > 100) {
      this.cities[cityName].popularity = 100;
    }
  }
  
  addCityEvent(cityName, event) {
    this.cities[cityName].events.push(event);
  }
  
  getLatestCityEvents(cityName, count = 5) {
    return this.cities[cityName].events.slice(-count);
  }
  
  addVenueToCity(cityName, venue) {
    this.cities[cityName].venues.push(venue.id);
  }
  
  removeVenueFromCity(cityName, venueId) {
    const index = this.cities[cityName].venues.indexOf(venueId);
    if (index !== -1) {
      this.cities[cityName].venues.splice(index, 1);
    }
  }
  
  getVenuesInCity(cityName) {
    return this.cities[cityName].venues;
  }
  
  getCityWithHighestPopularity() {
    let highestCity = GAME_CONSTANTS.CITIES[0];
    let highestPopularity = this.cities[highestCity].popularity;
    
    for (const city of GAME_CONSTANTS.CITIES) {
      if (this.cities[city].popularity > highestPopularity) {
        highestCity = city;
        highestPopularity = this.cities[city].popularity;
      }
    }
    
    return highestCity;
  }
  
  scheduleHealthInspection(cityName, venueId) {
    // Schedule a health inspection for the given venue
    const frequency = this.cities[cityName].regulations.healthInspectionFrequency;
    const daysUntilInspection = Math.floor(frequency * (0.8 + Math.random() * 0.4)); // Add some randomness
    
    // Create inspection event
    const inspectionEvent = {
      type: 'health_inspection',
      description: 'Health inspector visit',
      venueId: venueId,
      scheduledDay: this.game.timeManager.getGameTime().day + daysUntilInspection
    };
    
    // Add to city events
    this.addCityEvent(cityName, inspectionEvent);
    
    return inspectionEvent;
  }
}

module.exports = CityManager;