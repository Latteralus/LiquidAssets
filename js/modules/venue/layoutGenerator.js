// Layout Generator - Handles layout generation for different venue types

class LayoutGenerator {
    constructor() {
      // Initialize any constants or helper data needed for layout generation
    }
    
    generateVenueLayout(venueType, venueSize) {
      // Size multipliers for layout dimensions
      const sizeMultipliers = {
        small: 1,
        medium: 1.5,
        large: 2.5
      };
      
      const multiplier = sizeMultipliers[venueSize] || 1;
      
      // Base dimensions for small venue
      const baseWidth = 20;
      const baseHeight = 15;
      
      // Adjusted dimensions based on size
      const width = Math.floor(baseWidth * multiplier);
      const height = Math.floor(baseHeight * multiplier);
      
      // Common layout elements for all venue types
      const layout = {
        width: width,
        height: height,
        entrance: { 
          x: Math.floor(width / 2), 
          y: 0,
          width: 2,
          height: 1
        },
        walls: [],
        restrooms: { 
          x: Math.floor(width * 0.85), 
          y: Math.floor(height * 0.8), 
          width: Math.max(2, Math.floor(width * 0.1)), 
          height: Math.max(2, Math.floor(height * 0.15))
        },
        decoration: []
      };
      
      // Add venue-specific layouts
      switch(venueType) {
        case 'Restaurant':
          this.generateRestaurantLayout(layout, venueSize);
          break;
        case 'Bar':
          this.generateBarLayout(layout, venueSize);
          break;
        case 'Nightclub':
          this.generateNightclubLayout(layout, venueSize);
          break;
        case 'Fast Food':
          this.generateFastFoodLayout(layout, venueSize);
          break;
        default:
          // Generic layout with basic elements
          layout.bar = { 
            x: 3, 
            y: 3, 
            width: Math.max(5, Math.floor(width * 0.2)), 
            height: 2 
          };
          layout.tables = this.generateTables(venueSize, width, height, 8);
      }
      
      // Generate walls around the venue perimeter
      this.generateWalls(layout);
      
      // Add decorative elements based on venue type
      this.addDecorations(layout, venueType, venueSize);
      
      return layout;
    }
    
    generateRestaurantLayout(layout, venueSize) {
      const { width, height } = layout;
      
      // Restaurant has kitchen, host station, bar area, and dining sections
      layout.kitchen = {
        x: Math.floor(width * 0.7),
        y: 2,
        width: Math.max(5, Math.floor(width * 0.25)),
        height: Math.max(4, Math.floor(height * 0.3))
      };
      
      layout.hostStation = {
        x: Math.floor(width / 2) - 1,
        y: 2,
        width: 2,
        height: 1
      };
      
      layout.bar = {
        x: 2,
        y: 2,
        width: Math.max(4, Math.floor(width * 0.15)),
        height: 2
      };
      
      // Generate dining tables
      const tableCount = venueSize === 'small' ? 8 : (venueSize === 'medium' ? 15 : 25);
      layout.tables = this.generateRestaurantTables(venueSize, width, height, tableCount);
      
      // Add waiter stations
      layout.waiterStations = [];
      layout.waiterStations.push({
        x: layout.kitchen.x - 2,
        y: layout.kitchen.y + Math.floor(layout.kitchen.height / 2),
        width: 1,
        height: 1,
        type: 'service'
      });
      
      if (venueSize !== 'small') {
        layout.waiterStations.push({
          x: Math.floor(width * 0.3),
          y: Math.floor(height * 0.6),
          width: 1,
          height: 1,
          type: 'service'
        });
      }
      
      // Add private dining room for larger venues
      if (venueSize === 'large') {
        layout.privateDining = {
          x: 2,
          y: height - 6,
          width: Math.floor(width * 0.25),
          height: 5
        };
        
        // Add tables to private dining
        const privateTables = [];
        const privateDining = layout.privateDining;
        
        privateTables.push({
          x: privateDining.x + 1,
          y: privateDining.y + 2,
          size: 'large',
          capacity: 8,
          reserved: false
        });
        
        layout.privateTables = privateTables;
      }
    }
    
    generateBarLayout(layout, venueSize) {
      const { width, height } = layout;
      
      // Bars have a large bar counter, seating areas, and possibly a small kitchen
      layout.bar = {
        x: Math.floor(width * 0.1),
        y: Math.floor(height * 0.3),
        width: Math.max(6, Math.floor(width * 0.3)),
        height: 2
      };
      
      // Bar stools along the bar
      layout.barSeats = [];
      for (let i = 0; i < layout.bar.width - 1; i++) {
        layout.barSeats.push({
          x: layout.bar.x + i + 0.5,
          y: layout.bar.y + layout.bar.height + 0.5,
          size: 'stool',
          capacity: 1
        });
      }
      
      // Optional small kitchen for bar food
      layout.kitchen = {
        x: width - 5,
        y: 2,
        width: 4,
        height: 3
      };
      
      // Tables for seating
      const tableCount = venueSize === 'small' ? 6 : (venueSize === 'medium' ? 12 : 20);
      layout.tables = this.generateTables(venueSize, width, height, tableCount);
      
      // Add pool tables or other entertainment for larger venues
      if (venueSize !== 'small') {
        layout.entertainment = [];
        
        // Pool table
        layout.entertainment.push({
          x: Math.floor(width * 0.6),
          y: Math.floor(height * 0.3),
          width: 3,
          height: 2,
          type: 'pool_table'
        });
        
        if (venueSize === 'large') {
          // Darts board
          layout.entertainment.push({
            x: Math.floor(width * 0.8),
            y: Math.floor(height * 0.6),
            width: 1,
            height: 1,
            type: 'darts'
          });
          
          // Stage area for live music in large bars
          layout.stage = {
            x: width - 6,
            y: height - 5,
            width: 5,
            height: 3
          };
        }
      }
    }
    
    generateNightclubLayout(layout, venueSize) {
      const { width, height } = layout;
      
      // Nightclubs have dance floors, DJ booth, VIP areas, and multiple bars
      
      // Main dance floor
      layout.danceFloor = {
        x: Math.floor(width * 0.3),
        y: Math.floor(height * 0.4),
        width: Math.max(6, Math.floor(width * 0.4)),
        height: Math.max(6, Math.floor(height * 0.4))
      };
      
      // DJ booth
      layout.djBooth = {
        x: layout.danceFloor.x + Math.floor(layout.danceFloor.width / 2) - 1,
        y: layout.danceFloor.y - 2,
        width: 2,
        height: 1
      };
      
      // Main bar
      layout.bar = {
        x: 2,
        y: 3,
        width: Math.max(5, Math.floor(width * 0.2)),
        height: 2
      };
      
      // Secondary bar for larger venues
      if (venueSize !== 'small') {
        layout.secondaryBar = {
          x: width - 7,
          y: Math.floor(height * 0.7),
          width: 5,
          height: 2
        };
      }
      
      // Tables for seating (fewer in nightclubs)
      const tableCount = venueSize === 'small' ? 4 : (venueSize === 'medium' ? 8 : 12);
      layout.tables = this.generateTables(venueSize, width, height, tableCount);
      
      // VIP section for medium and large venues
      if (venueSize !== 'small') {
        layout.vipArea = {
          x: width - 8,
          y: 3,
          width: 6,
          height: 5
        };
        
        // VIP tables
        layout.vipTables = [];
        for (let i = 0; i < (venueSize === 'medium' ? 2 : 3); i++) {
          layout.vipTables.push({
            x: layout.vipArea.x + 1 + (i * 2),
            y: layout.vipArea.y + 2,
            size: 'medium',
            capacity: 4,
            vip: true
          });
        }
      }
      
      // Smoking area for larger venues
      if (venueSize === 'large') {
        layout.smokingArea = {
          x: 2,
          y: height - 5,
          width: 4,
          height: 4,
          outdoor: true
        };
      }
    }
    
    generateFastFoodLayout(layout, venueSize) {
      const { width, height } = layout;
      
      // Fast food places have service counters, kitchen, and seating areas
      
      // Service counter
      layout.counter = {
        x: 2,
        y: 3,
        width: Math.max(5, Math.floor(width * 0.3)),
        height: 1
      };
      
      // Kitchen behind counter
      layout.kitchen = {
        x: 2,
        y: 5,
        width: layout.counter.width,
        height: 3
      };
      
      // Drive-through window for medium and large venues
      if (venueSize !== 'small') {
        layout.driveThrough = {
          x: 0,
          y: Math.floor(height * 0.7),
          width: 1,
          height: 2,
          exit: { x: width - 1, y: Math.floor(height * 0.7) }
        };
      }
      
      // Tables for seating (many small tables)
      const tableCount = venueSize === 'small' ? 8 : (venueSize === 'medium' ? 16 : 28);
      layout.tables = this.generateFastFoodTables(venueSize, width, height, tableCount);
      
      // Self-service drink station
      layout.drinkStation = {
        x: Math.floor(width * 0.7),
        y: 3,
        width: 2,
        height: 1
      };
      
      // Condiment station
      layout.condimentStation = {
        x: Math.floor(width * 0.7),
        y: 5,
        width: 2,
        height: 1
      };
      
      // Play area for large venues
      if (venueSize === 'large') {
        layout.playArea = {
          x: width - 6,
          y: height - 6,
          width: 5,
          height: 5
        };
      }
    }
    
    generateTables(venueSize, width, height, count) {
      const tables = [];
      const usedPositions = new Set();
      
      // Define the area where tables can be placed (avoiding other elements)
      const margin = 2;
      const tableArea = {
        x1: margin,
        y1: Math.floor(height * 0.3),
        x2: width - margin,
        y2: height - margin
      };
      
      // Distribution of table sizes (small, medium, large)
      let smallTables = Math.floor(count * 0.5); // 50% small tables
      let mediumTables = Math.floor(count * 0.3); // 30% medium tables
      let largeTables = count - smallTables - mediumTables; // Remainder large tables
      
      // Ensure at least one of each size if count allows
      if (count >= 3 && (smallTables === 0 || mediumTables === 0 || largeTables === 0)) {
        smallTables = Math.max(1, smallTables);
        mediumTables = Math.max(1, mediumTables);
        largeTables = Math.max(1, count - smallTables - mediumTables);
      }
      
      // Table sizes (width, height, capacity)
      const tableSizes = {
        small: { width: 1, height: 1, capacity: 2 },
        medium: { width: 2, height: 2, capacity: 4 },
        large: { width: 3, height: 2, capacity: 6 }
      };
      
      // Add tables of each size
      this.addTablesOfSize('small', smallTables, tables, usedPositions, tableArea, tableSizes);
      this.addTablesOfSize('medium', mediumTables, tables, usedPositions, tableArea, tableSizes);
      this.addTablesOfSize('large', largeTables, tables, usedPositions, tableArea, tableSizes);
      
      return tables;
    }
    
    addTablesOfSize(size, count, tables, usedPositions, area, tableSizes) {
      const { width, height, capacity } = tableSizes[size];
      
      for (let i = 0; i < count; i++) {
        let position = null;
        let attempts = 0;
        
        // Try to find a valid position that doesn't overlap
        while (!position && attempts < 20) {
          const x = area.x1 + Math.floor(Math.random() * (area.x2 - area.x1 - width));
          const y = area.y1 + Math.floor(Math.random() * (area.y2 - area.y1 - height));
          
          // Check if position is valid
          let valid = true;
          for (let dx = 0; dx < width + 1; dx++) {
            for (let dy = 0; dy < height + 1; dy++) {
              const posKey = `${x + dx},${y + dy}`;
              if (usedPositions.has(posKey)) {
                valid = false;
                break;
              }
            }
            if (!valid) break;
          }
          
          if (valid) {
            position = { x, y };
            
            // Mark positions as used (including margin)
            for (let dx = -1; dx < width + 1; dx++) {
              for (let dy = -1; dy < height + 1; dy++) {
                const posKey = `${x + dx},${y + dy}`;
                usedPositions.add(posKey);
              }
            }
          }
          
          attempts++;
        }
        
        if (position) {
          tables.push({
            x: position.x,
            y: position.y,
            size: size,
            capacity: capacity,
            reserved: false
          });
        }
      }
    }
    
    generateRestaurantTables(venueSize, width, height, count) {
      // Similar to generateTables but organizes tables in a more structured way for restaurants
      const tables = [];
      
      // Create different seating sections
      const margin = 2;
      
      // Main dining area
      const mainDining = {
        x1: margin,
        y1: 6,
        x2: Math.floor(width * 0.6),
        y2: height - margin
      };
      
      // Window seating
      const windowSeating = {
        x1: Math.floor(width * 0.6),
        y1: Math.floor(height * 0.5),
        x2: width - margin,
        y2: height - margin
      };
      
      // Calculate tables per section based on venue size
      let mainCount, windowCount;
      
      if (venueSize === 'small') {
        mainCount = Math.floor(count * 0.7);
        windowCount = count - mainCount;
      } else if (venueSize === 'medium') {
        mainCount = Math.floor(count * 0.6);
        windowCount = count - mainCount;
      } else {
        mainCount = Math.floor(count * 0.5);
        windowCount = count - mainCount;
      }

      // Add tables to main dining area
    const usedPositions = new Set();
    const tableSizes = {
      small: { width: 1, height: 1, capacity: 2 },
      medium: { width: 2, height: 2, capacity: 4 },
      large: { width: 3, height: 2, capacity: 6 }
    };
    
    // Distribution for main dining
    let smallTables = Math.floor(mainCount * 0.3);
    let mediumTables = Math.floor(mainCount * 0.5);
    let largeTables = mainCount - smallTables - mediumTables;
    
    this.addTablesOfSize('small', smallTables, tables, usedPositions, mainDining, tableSizes);
    this.addTablesOfSize('medium', mediumTables, tables, usedPositions, mainDining, tableSizes);
    this.addTablesOfSize('large', largeTables, tables, usedPositions, mainDining, tableSizes);
    
    // Window seating is mostly small tables
    smallTables = Math.floor(windowCount * 0.7);
    mediumTables = windowCount - smallTables;
    
    this.addTablesOfSize('small', smallTables, tables, usedPositions, windowSeating, tableSizes);
    this.addTablesOfSize('medium', mediumTables, tables, usedPositions, windowSeating, tableSizes);
    
    return tables;
  }
  
  generateFastFoodTables(venueSize, width, height, count) {
    // Fast food places have more uniform table arrangements
    const tables = [];
    
    // Table size for fast food (mostly small)
    const tableSizes = {
      small: { width: 1, height: 1, capacity: 2 },
      medium: { width: 2, height: 1, capacity: 4 }, // Booths
      large: { width: 2, height: 2, capacity: 6 }  // Family tables
    };
    
    // Arrange tables in rows
    const startX = 4;
    const startY = 8;
    const spacing = 2;
    
    // Mostly small tables
    let smallCount = Math.floor(count * 0.6);
    let mediumCount = Math.floor(count * 0.3);
    let largeCount = count - smallCount - mediumCount;
    
    let x = startX;
    let y = startY;
    let rowHeight = 0;
    
    // Add small tables
    for (let i = 0; i < smallCount; i++) {
      tables.push({
        x: x,
        y: y,
        size: 'small',
        capacity: tableSizes.small.capacity
      });
      
      x += tableSizes.small.width + spacing;
      rowHeight = Math.max(rowHeight, tableSizes.small.height);
      
      // Start a new row if we're getting too close to the right edge
      if (x + tableSizes.small.width >= width - 4) {
        x = startX;
        y += rowHeight + spacing;
        rowHeight = 0;
      }
    }
    
    // Add medium tables (booths)
    for (let i = 0; i < mediumCount; i++) {
      // Ensure we have enough space for booths
      if (x + tableSizes.medium.width >= width - 4) {
        x = startX;
        y += rowHeight + spacing;
        rowHeight = 0;
      }
      
      tables.push({
        x: x,
        y: y,
        size: 'medium',
        capacity: tableSizes.medium.capacity,
        booth: true
      });
      
      x += tableSizes.medium.width + spacing;
      rowHeight = Math.max(rowHeight, tableSizes.medium.height);
    }
    
    // Add large tables (family tables)
    // Place these in the corners or specific areas
    const largeTablePositions = [
      { x: Math.floor(width * 0.7), y: Math.floor(height * 0.7) },
      { x: Math.floor(width * 0.3), y: Math.floor(height * 0.7) },
      { x: Math.floor(width * 0.5), y: Math.floor(height * 0.5) }
    ];
    
    for (let i = 0; i < Math.min(largeCount, largeTablePositions.length); i++) {
      tables.push({
        x: largeTablePositions[i].x,
        y: largeTablePositions[i].y,
        size: 'large',
        capacity: tableSizes.large.capacity,
        family: true
      });
    }
    
    return tables;
  }
  
  generateWalls(layout) {
    const { width, height } = layout;
    const walls = [];
    
    // Outer walls
    for (let x = 0; x < width; x++) {
      walls.push({ x, y: 0, type: 'exterior' }); // Top wall
      walls.push({ x, y: height - 1, type: 'exterior' }); // Bottom wall
    }
    
    for (let y = 0; y < height; y++) {
      walls.push({ x: 0, y, type: 'exterior' }); // Left wall
      walls.push({ x: width - 1, y, type: 'exterior' }); // Right wall
    }
    
    // Add entrance opening
    const entranceIndex = walls.findIndex(wall => 
      wall.x === layout.entrance.x && wall.y === 0 && wall.type === 'exterior'
    );
    
    if (entranceIndex !== -1) {
      walls.splice(entranceIndex, 1);
    }
    
    // Interior walls for specific rooms
    
    // Restroom walls
    const { restrooms } = layout;
    for (let x = restrooms.x; x < restrooms.x + restrooms.width; x++) {
      walls.push({ x, y: restrooms.y, type: 'interior' }); // Top restroom wall
    }
    
    for (let y = restrooms.y; y < restrooms.y + restrooms.height; y++) {
      walls.push({ x: restrooms.x, y, type: 'interior' }); // Left restroom wall
    }
    
    // Restroom door
    walls.push({ 
      x: restrooms.x, 
      y: restrooms.y + Math.floor(restrooms.height / 2), 
      type: 'door',
      room: 'restrooms'
    });
    
    // Kitchen walls if present
    if (layout.kitchen) {
      const { kitchen } = layout;
      for (let x = kitchen.x; x < kitchen.x + kitchen.width; x++) {
        if (x !== kitchen.x + Math.floor(kitchen.width / 2)) { // Leave space for door
          walls.push({ x, y: kitchen.y, type: 'interior' }); // Top kitchen wall
        } else {
          walls.push({ x, y: kitchen.y, type: 'door', room: 'kitchen' });
        }
      }
      
      for (let y = kitchen.y; y < kitchen.y + kitchen.height; y++) {
        walls.push({ x: kitchen.x, y, type: 'interior' }); // Left kitchen wall
        walls.push({ x: kitchen.x + kitchen.width - 1, y, type: 'interior' }); // Right kitchen wall
      }
      
      for (let x = kitchen.x; x < kitchen.x + kitchen.width; x++) {
        walls.push({ x, y: kitchen.y + kitchen.height - 1, type: 'interior' }); // Bottom kitchen wall
      }
    }
    
    // VIP area walls if present
    if (layout.vipArea) {
      const { vipArea } = layout;
      for (let x = vipArea.x; x < vipArea.x + vipArea.width; x++) {
        if (x !== vipArea.x + Math.floor(vipArea.width / 2)) { // Leave space for door
          walls.push({ x, y: vipArea.y, type: 'interior' }); // Top VIP wall
        } else {
          walls.push({ x, y: vipArea.y, type: 'door', room: 'vip' });
        }
      }
      
      for (let y = vipArea.y; y < vipArea.y + vipArea.height; y++) {
        walls.push({ x: vipArea.x, y, type: 'interior' }); // Left VIP wall
        walls.push({ x: vipArea.x + vipArea.width - 1, y, type: 'interior' }); // Right VIP wall
      }
      
      for (let x = vipArea.x; x < vipArea.x + vipArea.width; x++) {
        walls.push({ x, y: vipArea.y + vipArea.height - 1, type: 'interior' }); // Bottom VIP wall
      }
    }
    
    layout.walls = walls;
  }
  
  addDecorations(layout, venueType, venueSize) {
    const decorations = [];
    const { width, height } = layout;
    
    // Common decorations for all venues
    // Plants/greenery
    const plantCount = venueSize === 'small' ? 2 : (venueSize === 'medium' ? 4 : 6);
    
    for (let i = 0; i < plantCount; i++) {
      decorations.push({
        x: Math.floor(Math.random() * (width - 4)) + 2,
        y: Math.floor(Math.random() * (height - 4)) + 2,
        type: 'plant',
        size: Math.random() < 0.3 ? 'large' : 'small'
      });
    }
    
    // Venue-specific decorations
    switch(venueType) {
      case 'Restaurant':
        // Paintings on walls
        for (let i = 0; i < (venueSize === 'small' ? 2 : 4); i++) {
          decorations.push({
            x: Math.floor(Math.random() * (width - 4)) + 2,
            y: 1, // On the top wall
            type: 'painting',
            theme: ['food', 'landscape', 'abstract'][Math.floor(Math.random() * 3)]
          });
        }
        break;
        
      case 'Bar':
        // TVs for sports
        decorations.push({
          x: 3,
          y: 1,
          type: 'tv',
          size: 'medium'
        });
        
        if (venueSize !== 'small') {
          decorations.push({
            x: width - 4,
            y: 1,
            type: 'tv',
            size: 'medium'
          });
        }
        
        // Dartboard
        decorations.push({
          x: width - 2,
          y: 3,
          type: 'dartboard'
        });
        break;
        
      case 'Nightclub':
        // Speakers
        for (let i = 0; i < (venueSize === 'small' ? 2 : 4); i++) {
          decorations.push({
            x: Math.floor(Math.random() * (width - 4)) + 2,
            y: 1,
            type: 'speaker',
            size: 'large'
          });
        }
        
        // Lighting fixtures
        const lightCount = venueSize === 'small' ? 4 : (venueSize === 'medium' ? 8 : 12);
        for (let i = 0; i < lightCount; i++) {
          decorations.push({
            x: Math.floor(Math.random() * (width - 4)) + 2,
            y: Math.floor(Math.random() * (height - 4)) + 2,
            type: 'light',
            color: ['red', 'blue', 'green', 'purple'][Math.floor(Math.random() * 4)]
          });
        }
        break;
        
      case 'Fast Food':
        // Menu boards
        decorations.push({
          x: layout.counter ? layout.counter.x + Math.floor(layout.counter.width / 2) : 5,
          y: 1,
          type: 'menu_board',
          size: 'large'
        });
        
        // Trash bins
        for (let i = 0; i < (venueSize === 'small' ? 2 : 3); i++) {
          decorations.push({
            x: Math.floor(Math.random() * (width - 6)) + 3,
            y: height - 3,
            type: 'trash_bin'
          });
        }
        break;
    }
    
    layout.decoration = decorations;
  }
}

module.exports = LayoutGenerator;