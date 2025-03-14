// Contains venue name formats and related lists

// Formats for venue names by venue type
const venueFormats = {
    'Bar': [
      "The {adj} {noun}",
      "The {noun} & {noun}",
      "{lastName}'s",
      "The {lastName}",
      "{adj} {noun}",
      "The {color} {noun}",
      "{firstName}'s Place",
      "{noun} Bar",
      "The {noun} Bar",
      "{lastName}'s Bar",
      "The {city} {noun}"
    ],
    'Nightclub': [
      "Club {noun}",
      "{noun}",
      "{adj}",
      "The {adj}",
      "{firstName}'s",
      "{color} {noun}",
      "{noun} Lounge",
      "The {noun}",
      "{noun} {digit}",
      "Studio {digit}",
      "{digit}{digit}"
    ],
    'Restaurant': [
      "The {adj} {noun}",
      "{lastName}'s",
      "Café {noun}",
      "{adj} {cuisine}",
      "{firstName} & {firstName}",
      "The {lastName} Kitchen",
      "{city} {cuisine}",
      "{noun} {cuisine}",
      "The {noun} Table",
      "{lastName}'s {cuisine}",
      "Casa {lastName}"
    ],
    'Fast Food': [
      "{adj} {foodItem}",
      "{firstName}'s {foodItem}s",
      "The {adj} {foodItem}",
      "{foodItem} Express",
      "{foodItem} King",
      "{foodItem} & Co.",
      "Quick {foodItem}",
      "{lastName}'s {foodItem}s",
      "{digit} {foodItem}s",
      "{city} {foodItem}",
      "Tasty {foodItem}"
    ],
    'Generic': [
      "The {adj} {noun}",
      "{lastName}'s",
      "{firstName}'s Place",
      "The {color} {noun}",
      "{city} {noun}"
    ]
  };
  
  // Lists of famous real-world bars (for inspiration)
  const famousBars = [
    "The Ritz Bar", "Harry's New York Bar", "Hemingway Bar", "American Bar",
    "Carousel Bar", "Blackbird Bar", "Death & Co", "PDT", "Attaboy",
    "The Dead Rabbit", "Connaught Bar", "Bar Hemingway", "Bar High Five",
    "Broken Shaker", "Little Red Door", "Happiness Forgets", "Bar Termini",
    "The Clumsies", "Licorería Limantour", "Dante", "Employees Only",
    "NoMad Bar", "Trick Dog", "The Old Man", "Atlas Bar", "Operation Dagger",
    "Native", "Schumann's Bar", "Black Pearl", "Maybe Frank", "Panda & Sons"
  ];
  
  // Lists of famous real-world restaurants (for inspiration)
  const famousRestaurants = [
    "El Bulli", "Noma", "Osteria Francescana", "Mirazur", "Central",
    "Geranium", "Mugaritz", "Arzak", "Asador Etxebarri", "Gaggan",
    "The French Laundry", "Alinea", "Per Se", "Le Bernardin", "Eleven Madison Park",
    "The Fat Duck", "The Ledbury", "Dinner by Heston", "Atelier Crenn",
    "Pujol", "Quintonil", "Cosme", "Maido", "D.O.M.", "Astrid y Gastón",
    "DiverXO", "Burnt Ends", "Lyle's", "The Clove Club", "Brae",
    "Blue Hill at Stone Barns", "Le Chateaubriand", "Septime", "Saison"
  ];
  
  // Lists of famous real-world nightclubs (for inspiration)
  const famousNightclubs = [
    "Berghain", "Fabric", "Ministry of Sound", "Amnesia", "Pacha",
    "Zouk", "Space", "Ushuaïa", "Hï Ibiza", "LIV",
    "Omnia", "XS", "Marquee", "Tao", "1 OAK",
    "Lux", "Green Valley", "Echostage", "Output", "Stereo",
    "DC-10", "Printworks", "E1", "Tresor", "Watergate",
    "Cocoon", "Warung Beach Club", "The Warehouse Project", "Sub Club", "Fuse",
    "Circoloco", "Elrow", "Paradise", "HYTE", "ANTS"
  ];
  
  // Export everything
  module.exports = {
    venueFormats,
    famousBars,
    famousRestaurants,
    famousNightclubs
  };