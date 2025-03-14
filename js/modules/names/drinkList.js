// Contains drink names and formats

// Beer list
const beerList = [
    "Pale Ale", "IPA", "Double IPA", "Session IPA", "Lager", "Pilsner", 
    "Stout", "Imperial Stout", "Porter", "Wheat Beer", "Hefeweizen", 
    "Amber Ale", "Red Ale", "Brown Ale", "Blonde Ale", "Sour", "Gose", 
    "Saison", "Farmhouse Ale", "Belgian Tripel", "Belgian Dubbel", 
    "Belgian Witbier", "Kölsch", "Märzen", "Bock", "Doppelbock", 
    "Dunkel", "Schwarzbier", "Vienna Lager", "Oktoberfest", 
    "Cream Ale", "Barleywine", "Scotch Ale", "ESB", "Mild Ale",
    "Helles", "Altbier", "Berliner Weisse", "Rauchbier", "Dortmunder"
  ];
  
  // Wine list
  const wineList = [
    "Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah", "Shiraz", 
    "Malbec", "Zinfandel", "Grenache", "Tempranillo", "Sangiovese", 
    "Nebbiolo", "Barbera", "Chardonnay", "Sauvignon Blanc", "Pinot Grigio", 
    "Riesling", "Gewürztraminer", "Chenin Blanc", "Viognier", "Albariño", 
    "Verdejo", "Gruner Veltliner", "Moscato", "Prosecco", "Champagne", 
    "Cava", "Rosé", "White Zinfandel", "Bordeaux", "Burgundy", 
    "Chianti", "Rioja", "Barolo", "Brunello", "Port", 
    "Sherry", "Madeira", "Moscato d'Asti", "Ice Wine", "Sauternes"
  ];
  
  // Spirits list
  const spiritsList = [
    "Vodka", "Gin", "Rum", "Tequila", "Mezcal", "Whiskey", 
    "Scotch", "Bourbon", "Rye", "Irish Whiskey", "Japanese Whisky", 
    "Canadian Whisky", "Brandy", "Cognac", "Armagnac", 
    "Calvados", "Grappa", "Pisco", "Aquavit", "Baijiu", 
    "Soju", "Sake", "Shochu", "Cachaça", "Absinthe", 
    "Sambuca", "Limoncello", "Amaretto", "Amaro", "Chartreuse", 
    "Grand Marnier", "Cointreau", "Triple Sec", "Kahlúa", "Baileys", 
    "Campari", "Aperol", "Vermouth", "Fernet Branca", "Jägermeister"
  ];
  
  // Non-alcoholic drinks list
  const nonAlcoholicList = [
    "Cola", "Diet Cola", "Lemon-Lime Soda", "Ginger Ale", "Root Beer", 
    "Orange Soda", "Grape Soda", "Club Soda", "Tonic Water", "Sparkling Water", 
    "Still Water", "Iced Tea", "Sweet Tea", "Lemonade", "Arnold Palmer", 
    "Orange Juice", "Apple Juice", "Cranberry Juice", "Grapefruit Juice", "Pineapple Juice", 
    "Tomato Juice", "Coffee", "Espresso", "Cappuccino", "Latte", 
    "Americano", "Macchiato", "Mocha", "Hot Chocolate", "Tea", 
    "Green Tea", "Chai Tea", "Kombucha", "Coconut Water", "Horchata", 
    "Milk", "Chocolate Milk", "Strawberry Milk", "Milkshake", "Smoothie"
  ];
  
  // Classic cocktails
  const classicCocktails = [
    "Old Fashioned", "Negroni", "Manhattan", "Martini", "Daiquiri", 
    "Margarita", "Mojito", "Whiskey Sour", "Sazerac", "Mint Julep", 
    "Moscow Mule", "Dark 'n Stormy", "Mai Tai", "Piña Colada", "Bloody Mary", 
    "Cosmopolitan", "Sidecar", "French 75", "Boulevardier", "Tom Collins", 
    "John Collins", "Gin Fizz", "Ramos Gin Fizz", "Aviation", "Last Word", 
    "Paper Plane", "Bee's Knees", "Corpse Reviver No. 2", "Vieux Carré", "Aperol Spritz", 
    "Gimlet", "Clover Club", "Penicillin", "Vesper", "Rob Roy", 
    "Rusty Nail", "Jack Rose", "Paloma", "Cuba Libre", "Long Island Iced Tea"
  ];
  
  // Drink type categories
  const drinkTypes = [
    "Beer", "Wine", "Whiskey", "Scotch", "Bourbon", "Vodka", "Gin", "Rum", "Tequila",
    "Cocktail", "Coffee", "Tea", "Juice", "Soda", "Water", "Energy Drink", "Shot",
    "Punch", "Sangria", "Cider", "Mead", "Sake", "Spirit", "Mixer", "Cordial", "Liqueur"
  ];
  
  // Formats for cocktail naming
  const cocktailFormats = [
    "The {firstName}'s {noun}",
    "{color} {noun}",
    "{adj} {noun}",
    "{noun} Fizz",
    "{adj} {fruit}",
    "{location} Sour",
    "{firstName}'s Revenge",
    "{lastName}'s Secret",
    "{color} {location}",
    "{adj} {location}",
    "The {lastName}",
    "{fruit} Daiquiri",
    "{fruit} Martini",
    "{fruit} Mojito",
    "{adj} Mule",
    "{color} Devil",
    "{adj} Angel",
    "{color} Sunset",
    "{location} Sunrise",
    "{adj} Night",
    "{adj} Dream",
    "{noun} on the Beach",
    "{noun} in the Dark",
    "{adj} Storm",
    "{noun} Cooler",
    "{noun} Highball",
    "{color} Velvet",
    "{firstName}'s Joy",
    "{adj} Punch",
    "{noun} Sling",
    "{fruit} Sparkle"
  ];
  
  // Generic drink list for fallback
  const genericDrinks = [
    "House Special", "Bartender's Choice", "Secret Recipe", "Daily Special", "Weekly Offering"
  ];
  
  // Export all lists
  module.exports = {
    beerList,
    wineList,
    spiritsList,
    nonAlcoholicList,
    classicCocktails,
    drinkTypes,
    cocktailFormats,
    genericDrinks
  };