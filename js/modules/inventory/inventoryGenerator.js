// InventoryGenerator - Handles creation of default inventory items

class InventoryGenerator {
    constructor() {
      // Empty constructor as this class just handles inventory generation
    }
    
    generateDefaultInventory(venueType) {
      const inventory = {
        drinks: [],
        equipment: []
      };
      
      // Add default drinks based on venue type
      this.addDefaultDrinks(inventory.drinks, venueType);
      
      // Add default equipment
      this.addDefaultEquipment(inventory.equipment, venueType);
      
      // Add food for venues that serve it
      if (venueType === 'Restaurant' || venueType === 'Fast Food') {
        inventory.food = [];
        this.addDefaultFood(inventory.food, venueType);
      }
      
      return inventory;
    }
    
    addDefaultDrinks(drinksArray, venueType) {
      // Common drinks for all venue types
      const commonDrinks = [
        { name: 'Water', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.2, sellPrice: 1.5, stock: 100 },
        { name: 'Cola', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.5, stock: 50 },
        { name: 'Beer', type: 'drinks', subtype: 'alcoholic', costPrice: 1.2, sellPrice: 4.0, stock: 50 }
      ];
      
      drinksArray.push(...commonDrinks);
      
      // Add venue-specific drinks
      if (venueType === 'Bar' || venueType === 'Nightclub') {
        const specializedDrinks = [
          { name: 'Wine', type: 'drinks', subtype: 'alcoholic', costPrice: 3.0, sellPrice: 6.5, stock: 30 },
          { name: 'Whiskey', type: 'drinks', subtype: 'alcoholic', costPrice: 2.5, sellPrice: 7.0, stock: 20 },
          { name: 'Vodka', type: 'drinks', subtype: 'alcoholic', costPrice: 2.0, sellPrice: 6.0, stock: 20 },
          { name: 'Cocktail', type: 'drinks', subtype: 'alcoholic', costPrice: 3.0, sellPrice: 8.5, stock: 15 }
        ];
        drinksArray.push(...specializedDrinks);
      }
      
      if (venueType === 'Nightclub') {
        const nightclubDrinks = [
          { name: 'Energy Drink', type: 'drinks', subtype: 'non-alcoholic', costPrice: 1.5, sellPrice: 5.0, stock: 40 },
          { name: 'Premium Cocktail', type: 'drinks', subtype: 'alcoholic', costPrice: 4.5, sellPrice: 12.0, stock: 10 }
        ];
        drinksArray.push(...nightclubDrinks);
      }
      
      if (venueType === 'Restaurant') {
        const restaurantDrinks = [
          { name: 'Wine', type: 'drinks', subtype: 'alcoholic', costPrice: 3.0, sellPrice: 8.0, stock: 40 },
          { name: 'Coffee', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.5, stock: 50 },
          { name: 'Tea', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.3, sellPrice: 2.0, stock: 40 }
        ];
        drinksArray.push(...restaurantDrinks);
      }
      
      if (venueType === 'Fast Food') {
        const fastFoodDrinks = [
          { name: 'Milkshake', type: 'drinks', subtype: 'non-alcoholic', costPrice: 1.0, sellPrice: 3.5, stock: 30 },
          { name: 'Coffee', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.5, sellPrice: 2.0, stock: 50 },
          { name: 'Juice', type: 'drinks', subtype: 'non-alcoholic', costPrice: 0.8, sellPrice: 2.5, stock: 40 }
        ];
        drinksArray.push(...fastFoodDrinks);
      }
    }
    
    addDefaultFood(foodArray, venueType) {
      if (venueType === 'Restaurant') {
        const restaurantFood = [
          { name: 'Steak', type: 'food', subtype: 'main', costPrice: 8.0, sellPrice: 22.0, stock: 20 },
          { name: 'Pasta', type: 'food', subtype: 'main', costPrice: 3.0, sellPrice: 14.0, stock: 30 },
          { name: 'Salad', type: 'food', subtype: 'starter', costPrice: 2.0, sellPrice: 8.0, stock: 25 },
          { name: 'Soup', type: 'food', subtype: 'starter', costPrice: 1.5, sellPrice: 6.0, stock: 20 },
          { name: 'Cake', type: 'food', subtype: 'dessert', costPrice: 2.0, sellPrice: 7.0, stock: 15 }
        ];
        foodArray.push(...restaurantFood);
      } else if (venueType === 'Fast Food') {
        const fastFood = [
          { name: 'Burger', type: 'food', subtype: 'main', costPrice: 2.5, sellPrice: 6.5, stock: 40 },
          { name: 'Fries', type: 'food', subtype: 'side', costPrice: 0.8, sellPrice: 3.0, stock: 50 },
          { name: 'Pizza Slice', type: 'food', subtype: 'main', costPrice: 1.5, sellPrice: 4.0, stock: 30 },
          { name: 'Chicken Wings', type: 'food', subtype: 'side', costPrice: 2.0, sellPrice: 5.5, stock: 25 },
          { name: 'Ice Cream', type: 'food', subtype: 'dessert', costPrice: 1.0, sellPrice: 3.0, stock: 20 }
        ];
        foodArray.push(...fastFood);
      }
    }
    
    addDefaultEquipment(equipmentArray, venueType) {
      // Basic equipment for all venue types
      const basicEquipment = [
        { name: 'Chairs', type: 'equipment', subtype: 'furniture', quality: 'standard', condition: 90, stock: 20 },
        { name: 'Tables', type: 'equipment', subtype: 'furniture', quality: 'standard', condition: 90, stock: 8 },
        { name: 'Lights', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 100, stock: 10 },
        { name: 'Sound System', type: 'equipment', subtype: 'electronics', quality: 'basic', condition: 85, stock: 1 }
      ];
      
      equipmentArray.push(...basicEquipment);
      
      // Add venue-specific equipment
      if (venueType === 'Bar') {
        const barEquipment = [
          { name: 'Bar Counter', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Beer Taps', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 95, stock: 1 },
          { name: 'Glassware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 50 }
        ];
        equipmentArray.push(...barEquipment);
      } else if (venueType === 'Nightclub') {
        const nightclubEquipment = [
          { name: 'Bar Counter', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'DJ Booth', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 100, stock: 1 },
          { name: 'Dance Floor', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Lighting Rig', type: 'equipment', subtype: 'electronics', quality: 'standard', condition: 95, stock: 1 },
          { name: 'Glassware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 100 }
        ];
        equipmentArray.push(...nightclubEquipment);
      } else if (venueType === 'Restaurant') {
        const restaurantEquipment = [
          { name: 'Kitchen Equipment', type: 'equipment', subtype: 'appliance', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Dinnerware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 60 },
          { name: 'Silverware', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 60 },
          { name: 'Wine Glasses', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 100, stock: 40 }
        ];
        equipmentArray.push(...restaurantEquipment);
      } else if (venueType === 'Fast Food') {
        const fastFoodEquipment = [
          { name: 'Counter', type: 'equipment', subtype: 'fixture', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Kitchen Equipment', type: 'equipment', subtype: 'appliance', quality: 'standard', condition: 90, stock: 1 },
          { name: 'Fryer', type: 'equipment', subtype: 'appliance', quality: 'standard', condition: 95, stock: 1 },
          { name: 'Trays', type: 'equipment', subtype: 'utensil', quality: 'standard', condition: 90, stock: 30 }
        ];
        equipmentArray.push(...fastFoodEquipment);
      }
    }
}

module.exports = InventoryGenerator;