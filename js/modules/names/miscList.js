// Contains miscellaneous lists for name generation

// Adjectives for name generation
const adjectives = [
    "Golden", "Silver", "Crystal", "Royal", "Blue", "Red", "Green",
    "Black", "White", "Lucky", "Happy", "Rusty", "Salty", "Sunny",
    "Cloudy", "Misty", "Foggy", "Rainy", "Windy", "Starry", "Cosmic",
    "Wild", "Gentle", "Silent", "Loud", "Crazy", "Lazy", "Busy",
    "Fancy", "Grand", "Tiny", "Big", "Cozy", "Rich", "Poor", "Urban",
    "Rustic", "Modern", "Vintage", "Classic", "Retro", "Fresh", "Spicy",
    "Sweet", "Sour", "Bitter", "Smooth", "Rough", "Soft", "Hard",
    "Fast", "Slow", "Hot", "Cold", "Warm", "Cool", "Burning",
    "Frozen", "Dark", "Bright", "Shiny", "Dull", "Sharp", "Blunt",
    "Thick", "Thin", "Heavy", "Light", "Deep", "Shallow", "High",
    "Low", "Flat", "Round", "Square", "Oval", "Straight", "Curved",
    "Twisted", "Braided", "Knotted", "Loose", "Tight", "Open", "Closed",
    "Empty", "Full", "Half", "Double", "Triple", "Simple", "Complex",
    "Easy", "Difficult", "Clear", "Opaque", "Transparent", "Hidden", "Visible"
  ];
  
  // Nouns for name generation
  const nouns = [
    "Lion", "Tiger", "Eagle", "Dragon", "Crown", "Star", "Moon",
    "Sun", "Cloud", "Leaf", "Tree", "Flower", "Rose", "Daisy",
    "Ocean", "Sea", "River", "Lake", "Mountain", "Hill", "Valley",
    "Forest", "Wood", "Stone", "Rock", "Diamond", "Pearl", "Ruby",
    "Key", "Lock", "Door", "Window", "House", "Castle", "Tower",
    "Bridge", "Road", "Path", "Way", "Anchor", "Ship", "Boat",
    "Lantern", "Candle", "Lamp", "Light", "Shadow", "Mirror", "Glass",
    "Fountain", "Well", "Barrel", "Wagon", "Horse", "Rabbit", "Fox",
    "Wolf", "Bear", "Deer", "Owl", "Hawk", "Falcon", "Dove",
    "Sparrow", "Robin", "Duck", "Swan", "Fish", "Shark", "Whale",
    "Dolphin", "Turtle", "Frog", "Snake", "Lizard", "Spider", "Bee",
    "Butterfly", "Dragonfly", "Ant", "Cricket", "Beetle", "Sword", "Shield",
    "Armor", "Helmet", "Arrow", "Bow", "Spear", "Axe", "Hammer",
    "Anvil", "Forge", "Fire", "Water", "Earth", "Air", "Metal"
  ];
  
  // Colors for name generation
  const colors = [
    "Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Pink",
    "Black", "White", "Gray", "Brown", "Gold", "Silver", "Bronze",
    "Teal", "Turquoise", "Amber", "Crimson", "Violet", "Indigo",
    "Maroon", "Navy", "Olive", "Lime", "Coral", "Magenta", "Mint",
    "Lavender", "Beige", "Ivory", "Ruby", "Sapphire", "Emerald", "Topaz",
    "Jade", "Pearl", "Onyx", "Garnet", "Cobalt", "Burgundy", "Charcoal"
  ];
  
  // Cities for name generation
  const cities = [
    "Paris", "London", "Madrid", "Rome", "Berlin", "Vienna", "Athens",
    "Dublin", "Brussels", "Amsterdam", "Monaco", "Barcelona", "Florence",
    "Venice", "Naples", "Milan", "Prague", "Munich", "Hamburg", "Frankfurt",
    "Lisbon", "Porto", "Seville", "Granada", "Valencia", "Marseille", "Lyon",
    "Geneva", "Zurich", "Bern", "Copenhagen", "Stockholm", "Oslo", "Helsinki",
    "Warsaw", "Krakow", "Budapest", "Reykjavik", "Edinburgh", "Glasgow", "Manchester",
    "Liverpool", "Oxford", "Cambridge", "York", "Belfast", "Galway", "Cork",
    "Bordeaux", "Nice", "Cannes", "Monte Carlo", "San Sebastian", "Pamplona", "Bilbao"
  ];
  
  // Locations for name variation
  const locations = [
    "Beach", "Mountain", "Forest", "Island", "Desert", "Jungle", "Savanna",
    "Cave", "River", "Lake", "Sea", "Ocean", "Cliff", "Canyon",
    "Valley", "Meadow", "Field", "Garden", "Orchard", "Vineyard", "Plantation",
    "Highway", "Street", "Avenue", "Boulevard", "Lane", "Alley", "Path",
    "Plaza", "Square", "Market", "Bazaar", "Harbor", "Port", "Dock",
    "Bridge", "Tunnel", "Tower", "Castle", "Palace", "Mansion", "Cottage",
    "Cabin", "Lodge", "Inn", "Tavern", "Pub", "Cafe", "Bistro"
  ];
  
  // Music genres for events
  const musicGenres = [
    "Rock", "Pop", "Jazz", "Blues", "Hip Hop", "R&B", "Soul",
    "Country", "Folk", "Classical", "Opera", "Electronic", "Dance", "Techno",
    "House", "Dubstep", "Reggae", "Ska", "Punk", "Metal", "Alternative",
    "Indie", "Grunge", "Funk", "Disco", "Ambient", "Trance", "Latin",
    "Salsa", "Bachata", "Reggaeton", "Cumbia", "Flamenco", "Bossa Nova", "Samba"
  ];
  
  // Holidays for events
  const holidays = [
    "New Year's", "Valentine's Day", "St. Patrick's Day", "Easter", "Cinco de Mayo",
    "Halloween", "Thanksgiving", "Christmas", "Independence Day", "Labor Day",
    "Memorial Day", "Carnival", "Oktoberfest", "Lunar New Year", "Diwali",
    "Hanukkah", "Ramadan", "Bastille Day", "Día de los Muertos", "Mardi Gras"
  ];
  
  // Event formats by type
  const eventFormats = {
    'music': [
      "{music} Night",
      "Live {music}",
      "{firstName} and the Band",
      "{adj} {music} Festival",
      "{city} {music} Showcase",
      "{adj} Sounds",
      "{music} Jam Session",
      "The {adj} Concert"
    ],
    'food': [
      "{food} Tasting",
      "{cuisine} Night",
      "Chef {lastName}'s Special",
      "{adj} {cuisine} Experience",
      "{city} Food Festival",
      "{food} Competition"
    ],
    'drink': [
      "{drink} Tasting",
      "{adj} {drink} Night",
      "Craft {drink} Festival",
      "{color} {drink} Special",
      "{city} {drink} Tour"
    ],
    'holiday': [
      "{holiday} Celebration",
      "{adj} {holiday} Party",
      "{holiday} Special",
      "{holiday} Extravaganza"
    ],
    'generic': [
      "{adj} Night",
      "{noun} Party",
      "{firstName}'s Special Event",
      "{lastName} Showcase",
      "{color} {noun} Celebration",
      "{adj} {noun} Gathering",
      "The {adj} Experience",
      "{city} Special"
    ]
  };
  
  // Export all lists
  module.exports = {
    adjectives,
    nouns,
    colors,
    cities,
    locations,
    musicGenres,
    holidays,
    eventFormats
  };