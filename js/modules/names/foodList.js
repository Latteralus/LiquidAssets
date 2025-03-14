// Contains food names and cuisine types

// Fast food/snack items
const fastFoodItems = [
    "Burger", "Pizza", "Taco", "Burrito", "Sandwich", "Fries", "Chicken",
    "Hotdog", "Steak", "Salad", "Wrap", "Kebab", "Sushi", "Pasta", "Noodle",
    "Pita", "Shawarma", "Wing", "Roll", "Dumpling", "Pancake", "Waffle",
    "Donut", "Bagel", "Pretzel", "Nachos", "Quesadilla", "Enchilada", "Curry",
    "Rice Bowl", "Ramen", "Pho", "Fish & Chips", "Onion Rings", "Mozzarella Sticks",
    "Popcorn Chicken", "Nuggets", "Churro", "Ice Cream", "Milkshake"
  ];
  
  // Fruits for cocktails and dishes
  const fruits = [
    "Apple", "Banana", "Orange", "Lemon", "Lime", "Grapefruit", "Pineapple",
    "Strawberry", "Raspberry", "Blueberry", "Blackberry", "Cherry", "Peach",
    "Pear", "Watermelon", "Mango", "Passion Fruit", "Kiwi", "Coconut", "Dragon Fruit",
    "Pomegranate", "Fig", "Apricot", "Plum", "Guava", "Lychee", "Papaya",
    "Cantaloupe", "Honeydew", "Cranberry", "Grape", "Starfruit", "Persimmon"
  ];
  
  // Cuisine types
  const cuisines = [
    "Italian", "French", "Spanish", "Greek", "Turkish", "Indian", "Chinese",
    "Japanese", "Thai", "Vietnamese", "Mexican", "American", "British",
    "German", "Lebanese", "Moroccan", "Russian", "Korean", "Brazilian",
    "Argentinian", "Ethiopian", "Mediterranean", "Caribbean", "Fusion",
    "Peruvian", "Malaysian", "Indonesian", "Filipino", "Australian", "Canadian",
    "Irish", "Scottish", "Portuguese", "Polish", "Swedish", "Norwegian",
    "Hungarian", "Austrian", "Swiss", "Belgian", "Dutch", "South African"
  ];
  
  // Collection of dishes by cuisine and type
  const dishes = {
    'italian': {
      'appetizer': [
        "Bruschetta", "Caprese Salad", "Calamari", "Arancini", "Antipasto", 
        "Carpaccio", "Prosciutto e Melone", "Fried Zucchini", "Stuffed Mushrooms"
      ],
      'main': [
        "Spaghetti Carbonara", "Lasagna", "Fettuccine Alfredo", "Risotto", "Pizza Margherita",
        "Gnocchi", "Ravioli", "Linguine with Clams", "Osso Buco", "Chicken Parmesan",
        "Eggplant Parmesan", "Veal Saltimbocca", "Chicken Marsala", "Penne Arrabbiata"
      ],
      'dessert': [
        "Tiramisu", "Panna Cotta", "Cannoli", "Gelato", "Affogato",
        "Zabaglione", "Biscotti", "Cassata", "Zeppole", "Sfogliatelle"
      ]
    },
    'french': {
      'appetizer': [
        "Escargots", "French Onion Soup", "Pâté", "Cheese Soufflé", "Quiche Lorraine",
        "Gougères", "Tarte Flambée", "Foie Gras", "Rillettes"
      ],
      'main': [
        "Coq au Vin", "Beef Bourguignon", "Cassoulet", "Ratatouille", "Bouillabaisse",
        "Duck Confit", "Steak Frites", "Sole Meunière", "Blanquette de Veau", "Pot-au-Feu"
      ],
      'dessert': [
        "Crème Brûlée", "Chocolate Soufflé", "Tarte Tatin", "Éclair", "Macaron",
        "Madeleine", "Profiterole", "Crêpe Suzette", "Clafoutis", "Paris-Brest"
      ]
    },
    'mexican': {
      'appetizer': [
        "Guacamole", "Nachos", "Quesadilla", "Elote", "Queso Fundido",
        "Ceviche", "Sopes", "Taquitos", "Flautas"
      ],
      'main': [
        "Tacos", "Enchiladas", "Burritos", "Chiles Rellenos", "Mole Poblano",
        "Pozole", "Tamales", "Carnitas", "Fajitas", "Chimichanga"
      ],
      'dessert': [
        "Churros", "Flan", "Tres Leches Cake", "Sopapillas", "Arroz con Leche",
        "Bunuelos", "Empanadas", "Chocolate Mexicano", "Cajeta", "Chocoflan"
      ]
    },
    'japanese': {
      'appetizer': [
        "Edamame", "Gyoza", "Tempura", "Agedashi Tofu", "Sashimi",
        "Yakitori", "Miso Soup", "Takoyaki", "Sunomono"
      ],
      'main': [
        "Sushi", "Ramen", "Udon", "Soba", "Teriyaki Chicken",
        "Katsu Curry", "Donburi", "Okonomiyaki", "Shabu-Shabu", "Yakisoba"
      ],
      'dessert': [
        "Mochi", "Dorayaki", "Taiyaki", "Green Tea Ice Cream", "Anmitsu",
        "Dango", "Castella", "Yokan", "Monaka", "Daifuku"
      ]
    },
    'american': {
      'appetizer': [
        "Buffalo Wings", "Potato Skins", "Mozzarella Sticks", "Onion Rings", "Spinach Dip",
        "Deviled Eggs", "Popcorn Shrimp", "Crab Cakes", "Jalapeño Poppers"
      ],
      'main': [
        "Cheeseburger", "Mac and Cheese", "Fried Chicken", "BBQ Ribs", "Steak",
        "Hot Dogs", "Meatloaf", "Chicken Fried Steak", "Philly Cheesesteak", "Buffalo Chicken Sandwich"
      ],
      'dessert': [
        "Apple Pie", "Cheesecake", "Chocolate Chip Cookies", "Brownies", "Ice Cream Sundae",
        "S'mores", "Banana Split", "Chocolate Cake", "Red Velvet Cake", "Key Lime Pie"
      ]
    },
    'generic': {
      'appetizer': [
        "Soup of the Day", "House Salad", "Chef's Special Starter", "Mixed Platter", "Seasonal Appetizer"
      ],
      'main': [
        "Chef's Special", "Daily Special", "House Favorite", "Seasonal Dish", "Signature Plate"
      ],
      'dessert': [
        "Daily Dessert", "Chef's Sweet Creation", "House Special Dessert", "Sweet Surprise", "Seasonal Fruit Dessert"
      ]
    }
  };
  
  // Export all lists
  module.exports = {
    fastFoodItems,
    fruits,
    cuisines,
    dishes
  };