// js/ui/render/layoutRenderer.js

class LayoutRenderer {
    constructor(renderEngine) {
      this.renderEngine = renderEngine;
      this.game = renderEngine.game;
      this.tileCache = {}; // Cache for rendered tiles
      
      // Set reference in venue renderer
      if (this.renderEngine.venueRenderer) {
        this.renderEngine.venueRenderer.setLayoutRenderer(this);
      }
    }
    
    renderLayout(ctx, layout, gridSize) {
      if (!layout) return;
      
      // Draw floor
      this.renderFloor(ctx, layout, gridSize);
      
      // Draw walls
      this.renderWalls(ctx, layout, gridSize);
      
      // Draw functional areas
      this.renderFunctionalAreas(ctx, layout, gridSize);
      
      // Draw furniture and fixtures
      this.renderFurniture(ctx, layout, gridSize);
    }
    
    renderFloor(ctx, layout, gridSize) {
      const width = layout.width * gridSize;
      const height = layout.height * gridSize;
      
      // Draw base floor
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw floor pattern based on venue type
      const venue = this.game.state.currentVenue;
      if (venue) {
        if (venue.type === 'Restaurant') {
          this.renderRestaurantFloor(ctx, layout, gridSize);
        } else if (venue.type === 'Bar') {
          this.renderBarFloor(ctx, layout, gridSize);
        } else if (venue.type === 'Nightclub') {
          this.renderNightclubFloor(ctx, layout, gridSize);
        } else if (venue.type === 'Fast Food') {
          this.renderFastFoodFloor(ctx, layout, gridSize);
        }
      }
    }
    
    renderRestaurantFloor(ctx, layout, gridSize) {
      const width = layout.width * gridSize;
      const height = layout.height * gridSize;
      
      // Wooden floor pattern
      ctx.fillStyle = '#8B4513';
      
      for (let x = 0; x < layout.width; x++) {
        for (let y = 0; y < layout.height; y++) {
          // Create a checkered pattern
          if ((x + y) % 2 === 0) {
            ctx.fillRect(
              x * gridSize + 1,
              y * gridSize + 1,
              gridSize - 2,
              gridSize - 2
            );
          }
        }
      }
    }
    
    renderBarFloor(ctx, layout, gridSize) {
      const width = layout.width * gridSize;
      const height = layout.height * gridSize;
      
      // Wooden plank pattern
      for (let y = 0; y < layout.height; y++) {
        const shade = 0.9 + Math.random() * 0.1;
        ctx.fillStyle = `rgb(${Math.floor(139 * shade)}, ${Math.floor(69 * shade)}, ${Math.floor(19 * shade)})`;
        
        ctx.fillRect(
          0,
          y * gridSize,
          width,
          gridSize - 1
        );
      }
    }
    
    renderNightclubFloor(ctx, layout, gridSize) {
      const width = layout.width * gridSize;
      const height = layout.height * gridSize;
      
      // Dark floor with highlight patterns
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);
      
      // Add some patterns
      ctx.fillStyle = '#333';
      for (let x = 0; x < layout.width; x += 2) {
        for (let y = 0; y < layout.height; y += 2) {
          ctx.fillRect(
            x * gridSize,
            y * gridSize,
            gridSize,
            gridSize
          );
        }
      }
      
      // Special dance floor if present
      if (layout.danceFloor) {
        const { x, y, width: dfWidth, height: dfHeight } = layout.danceFloor;
        
        // Draw dance floor grid
        for (let dx = 0; dx < dfWidth; dx++) {
          for (let dy = 0; dy < dfHeight; dy++) {
            // Create a colored grid pattern
            const colorIndex = (dx + dy) % 3;
            let color;
            
            if (colorIndex === 0) color = '#444';
            else if (colorIndex === 1) color = '#333';
            else color = '#222';
            
            ctx.fillStyle = color;
            ctx.fillRect(
              (x + dx) * gridSize,
              (y + dy) * gridSize,
              gridSize,
              gridSize
            );
          }
        }
      }
    }
    
    renderFastFoodFloor(ctx, layout, gridSize) {
      const width = layout.width * gridSize;
      const height = layout.height * gridSize;
      
      // Tile pattern
      for (let x = 0; x < layout.width; x++) {
        for (let y = 0; y < layout.height; y++) {
          const isAlternate = (x + y) % 2 === 0;
          ctx.fillStyle = isAlternate ? '#444' : '#333';
          
          ctx.fillRect(
            x * gridSize,
            y * gridSize,
            gridSize,
            gridSize
          );
        }
      }
    }
    
    renderWalls(ctx, layout, gridSize) {
      if (!layout.walls) return;
      
      layout.walls.forEach(wall => {
        let color;
        
        if (wall.type === 'door') {
          color = '#8B4513'; // Brown for doors
        } else if (wall.type === 'exterior') {
          color = '#444'; // Dark gray for exterior walls
        } else if (wall.type === 'interior') {
          color = '#666'; // Light gray for interior walls
        } else {
          color = '#555'; // Default wall color
        }
        
        const x = wall.x * gridSize;
        const y = wall.y * gridSize;
        
        // Draw wall
        ctx.fillStyle = color;
        ctx.fillRect(x, y, gridSize, gridSize);
        
        // Add details for doors
        if (wall.type === 'door') {
          ctx.fillStyle = '#222';
          ctx.fillRect(x + 3, y + 3, gridSize - 6, gridSize - 6);
          
          // Door handle
          ctx.fillStyle = '#ddd';
          ctx.beginPath();
          ctx.arc(x + gridSize * 0.75, y + gridSize * 0.5, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    
    renderFunctionalAreas(ctx, layout, gridSize) {
      // Draw bar if present
      if (layout.bar) {
        this.renderBar(ctx, layout.bar, gridSize);
      }
      
      // Draw kitchen if present
      if (layout.kitchen) {
        this.renderKitchen(ctx, layout.kitchen, gridSize);
      }
      
      // Draw restrooms if present
      if (layout.restrooms) {
        this.renderRestrooms(ctx, layout.restrooms, gridSize);
      }
      
      // Draw dance floor if present
      if (layout.danceFloor) {
        this.renderDanceFloor(ctx, layout.danceFloor, gridSize);
      }
      
      // Draw DJ booth if present
      if (layout.djBooth) {
        this.renderDJBooth(ctx, layout.djBooth, gridSize);
      }
      
      // Draw entrance
      if (layout.entrance) {
        this.renderEntrance(ctx, layout.entrance, gridSize);
      }
    }
    
    renderBar(ctx, bar, gridSize) {
      const x = bar.x * gridSize;
      const y = bar.y * gridSize;
      const width = bar.width * gridSize;
      const height = bar.height * gridSize;
      
      // Draw bar counter
      ctx.fillStyle = '#8B4513'; // Saddle brown
      ctx.fillRect(x, y, width, height);
      
      // Draw bar top
      ctx.fillStyle = '#A0522D'; // Sienna
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      
      // Draw bar label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Bar',
        x + width / 2,
        y + height / 2 + 5
      );
      
      // Draw bottles behind the bar
      for (let i = 0; i < bar.width; i += 1) {
        if (Math.random() < 0.7) { // 70% chance of a bottle
          const bottleX = (bar.x + i + 0.5) * gridSize;
          const bottleY = (bar.y + 0.3) * gridSize;
          
          ctx.fillStyle = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)];
          ctx.fillRect(bottleX - 2, bottleY - 6, 4, 6);
        }
      }
    }
    
    renderKitchen(ctx, kitchen, gridSize) {
      const x = kitchen.x * gridSize;
      const y = kitchen.y * gridSize;
      const width = kitchen.width * gridSize;
      const height = kitchen.height * gridSize;
      
      // Draw kitchen floor (different tile)
      ctx.fillStyle = '#555';
      for (let kx = 0; kx < kitchen.width; kx++) {
        for (let ky = 0; ky < kitchen.height; ky++) {
          const tileX = (kitchen.x + kx) * gridSize;
          const tileY = (kitchen.y + ky) * gridSize;
          
          if ((kx + ky) % 2 === 0) {
            ctx.fillRect(tileX, tileY, gridSize, gridSize);
          }
        }
      }
      
      // Draw kitchen counters along edges
      ctx.fillStyle = '#aaa';
      
      // Top counter
      ctx.fillRect(x, y, width, gridSize);
      
      // Left counter
      ctx.fillRect(x, y, gridSize, height);
      
      // Right counter
      ctx.fillRect(x + width - gridSize, y, gridSize, height);
      
      // Bottom counter
      ctx.fillRect(x, y + height - gridSize, width, gridSize);
      
      // Draw stove
      const stoveX = x + Math.floor(width / 2);
      const stoveY = y + Math.floor(height / 2);
      
      ctx.fillStyle = '#333';
      ctx.fillRect(stoveX - gridSize, stoveY - gridSize, gridSize * 2, gridSize * 2);
      
      // Draw burners
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(stoveX - gridSize / 2, stoveY - gridSize / 2, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(stoveX + gridSize / 2, stoveY - gridSize / 2, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(stoveX - gridSize / 2, stoveY + gridSize / 2, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(stoveX + gridSize / 2, stoveY + gridSize / 2, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw kitchen label
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Kitchen',
        x + width / 2,
        y + height / 2 + 30
      );
    }
    
    renderRestrooms(ctx, restrooms, gridSize) {
      const x = restrooms.x * gridSize;
      const y = restrooms.y * gridSize;
      const width = restrooms.width * gridSize;
      const height = restrooms.height * gridSize;
      
      // Draw restroom floor (different tile)
      ctx.fillStyle = '#ccc';
      ctx.fillRect(x, y, width, height);
      
      // Draw dividing wall for men/women
      ctx.fillStyle = '#555';
      ctx.fillRect(x + width / 2 - 2, y, 4, height);
      
      // Draw male/female symbols
      const maleX = x + width / 4;
      const femaleX = x + width * 3 / 4;
      const symbolY = y + height / 2;
      
      // Male symbol (simplified)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(maleX, symbolY, gridSize / 3, 0, Math.PI * 2);
      ctx.moveTo(maleX, symbolY + gridSize / 3);
      ctx.lineTo(maleX, symbolY + gridSize * 2 / 3);
      ctx.stroke();
      
      // Female symbol (simplified)
      ctx.beginPath();
      ctx.arc(femaleX, symbolY, gridSize / 3, 0, Math.PI * 2);
      ctx.moveTo(femaleX, symbolY + gridSize / 3);
      ctx.lineTo(femaleX, symbolY + gridSize * 2 / 3);
      ctx.moveTo(femaleX - gridSize / 4, symbolY + gridSize / 2);
      ctx.lineTo(femaleX + gridSize / 4, symbolY + gridSize / 2);
      ctx.stroke();
      
      // Draw restroom label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Restrooms',
        x + width / 2,
        y + height - 10
      );
    }
    
    renderDanceFloor(ctx, danceFloor, gridSize) {
      const x = danceFloor.x * gridSize;
      const y = danceFloor.y * gridSize;
      const width = danceFloor.width * gridSize;
      const height = danceFloor.height * gridSize;
      
      // Draw dance floor background
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, width, height);
      
      // Draw dance floor pattern
      const time = performance.now() / 1000;
      const colorCycle = Math.floor(time * 2) % 3;
      
      for (let dx = 0; dx < danceFloor.width; dx++) {
        for (let dy = 0; dy < danceFloor.height; dy++) {
          if ((dx + dy + colorCycle) % 3 === 0) {
            ctx.fillStyle = '#555';
            ctx.fillRect(
              (danceFloor.x + dx) * gridSize + 2,
              (danceFloor.y + dy) * gridSize + 2,
              gridSize - 4,
              gridSize - 4
            );
          }
        }
      }
      
      // Draw dance floor label
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Dance Floor',
        x + width / 2,
        y + height - 10
      );
    }
    
    renderDJBooth(ctx, djBooth, gridSize) {
      const x = djBooth.x * gridSize;
      const y = djBooth.y * gridSize;
      const width = djBooth.width * gridSize;
      const height = djBooth.height * gridSize;
      
      // Draw DJ booth
      ctx.fillStyle = '#222';
      ctx.fillRect(x, y, width, height);
      
      // Draw DJ equipment
      ctx.fillStyle = '#444';
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      
      // Draw turntables
      const turntableRadius = Math.min(width, height) / 4;
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x + width / 3, y + height / 2, turntableRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x + width * 2 / 3, y + height / 2, turntableRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add records spinning animation
      const time = performance.now() / 1000;
      const angle1 = time * 2;
      const angle2 = time * 1.5;
      
      ctx.save();
      ctx.translate(x + width / 3, y + height / 2);
      ctx.rotate(angle1);
      ctx.fillStyle = '#333';
      ctx.fillRect(-turntableRadius / 2, -1, turntableRadius, 2);
      ctx.restore();
      
      ctx.save();
      ctx.translate(x + width * 2 / 3, y + height / 2);
      ctx.rotate(angle2);
      ctx.fillStyle = '#333';
      ctx.fillRect(-turntableRadius / 2, -1, turntableRadius, 2);
      ctx.restore();
      
      // Draw DJ booth label
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'DJ',
        x + width / 2,
        y + height + 10
      );
    }
    
    renderEntrance(ctx, entrance, gridSize) {
      const x = entrance.x * gridSize;
      const y = entrance.y * gridSize;
      const width = entrance.width ? entrance.width * gridSize : gridSize;
      const height = entrance.height ? entrance.height * gridSize : gridSize;
      
      // Draw entrance area
      ctx.fillStyle = '#8B0000'; // Dark red
      ctx.fillRect(x, y, width, height);
      
      // Draw entrance pattern
      ctx.fillStyle = '#990000';
      for (let i = 0; i < width; i += 4) {
        for (let j = 0; j < height; j += 4) {
          ctx.fillRect(x + i, y + j, 2, 2);
        }
      }
      
      // Draw entrance label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Entrance',
        x + width / 2,
        y + height / 2 + 5
      );
      
      // Draw door arrow
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y - 10);
      ctx.lineTo(x + width / 2, y + 10);
      ctx.lineTo(x + width / 2 - 5, y + 5);
      ctx.moveTo(x + width / 2, y + 10);
      ctx.lineTo(x + width / 2 + 5, y + 5);
      ctx.stroke();
    }
    
    renderFurniture(ctx, layout, gridSize) {
      // Draw tables
      if (layout.tables) {
        this.renderTables(ctx, layout.tables, gridSize);
      }
      
      // Draw additional furniture types
      if (layout.barSeats) {
        this.renderBarSeats(ctx, layout.barSeats, gridSize);
      }
      
      if (layout.entertainment) {
        this.renderEntertainment(ctx, layout.entertainment, gridSize);
      }
      
      if (layout.stage) {
        this.renderStage(ctx, layout.stage, gridSize);
      }
      
      if (layout.vipArea) {
        this.renderVIPArea(ctx, layout.vipArea, gridSize);
      }
    }
    
    renderTables(ctx, tables, gridSize) {
      tables.forEach(table => {
        const x = table.x * gridSize;
        const y = table.y * gridSize;
        
        let width, height, color;
        
        // Table size and color
        if (table.size === 'small') {
          width = gridSize;
          height = gridSize;
          color = '#2F4F4F'; // Dark slate gray
        } else if (table.size === 'medium') {
          width = 2 * gridSize;
          height = 2 * gridSize;
          color = '#556B2F'; // Dark olive green
        } else { // large
          width = 3 * gridSize;
          height = 2 * gridSize;
          color = '#4B0082'; // Indigo
        }
        
        // VIP tables look fancier
        if (table.vip) {
          color = '#800080'; // Purple
        }
        
        // Family tables have different shape
        if (table.family) {
          color = '#8B0000'; // Dark red
        }
        
        // Draw table
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        // Draw table top
        ctx.fillStyle = table.vip ? '#D8BFD8' : '#A9A9A9';
        ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
        
        // Draw reservation marker if applicable
        if (table.reserved) {
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw chairs around the table
        this.renderChairsAroundTable(ctx, x, y, width, height, gridSize);
      });
    }
    
    renderChairsAroundTable(ctx, x, y, tableWidth, tableHeight, gridSize) {
      const chairSize = gridSize / 3;
      const chairColor = '#8B4513'; // Brown
      
      // Top row of chairs
      for (let i = 0; i < tableWidth; i += gridSize / 2) {
        if (i !== 0 && i !== tableWidth - chairSize) {
          ctx.fillStyle = chairColor;
          ctx.fillRect(x + i, y - chairSize, chairSize, chairSize);
        }
      }
      
      // Bottom row of chairs
      for (let i = 0; i < tableWidth; i += gridSize / 2) {
        if (i !== 0 && i !== tableWidth - chairSize) {
          ctx.fillStyle = chairColor;
          ctx.fillRect(x + i, y + tableHeight, chairSize, chairSize);
        }
      }
      
      // Left column of chairs
      for (let i = 0; i < tableHeight; i += gridSize / 2) {
        if (i !== 0 && i !== tableHeight - chairSize) {
          ctx.fillStyle = chairColor;
          ctx.fillRect(x - chairSize, y + i, chairSize, chairSize);
        }
      }
      
      // Right column of chairs
      for (let i = 0; i < tableHeight; i += gridSize / 2) {
        if (i !== 0 && i !== tableHeight - chairSize) {
          ctx.fillStyle = chairColor;
          ctx.fillRect(x + tableWidth, y + i, chairSize, chairSize);
        }
      }
    }
    
    renderBarSeats(ctx, barSeats, gridSize) {
      barSeats.forEach(seat => {
        const x = seat.x * gridSize;
        const y = seat.y * gridSize;
        
        // Draw stool
        ctx.fillStyle = '#8B4513'; // Brown
        ctx.beginPath();
        ctx.arc(x, y, gridSize / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw stool seat
        ctx.fillStyle = '#A0522D'; // Sienna
        ctx.beginPath();
        ctx.arc(x, y, gridSize / 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    renderEntertainment(ctx, entertainment, gridSize) {
      entertainment.forEach(item => {
        const x = item.x * gridSize;
        const y = item.y * gridSize;
        const width = item.width * gridSize;
        const height = item.height * gridSize;
        
        if (item.type === 'pool_table') {
          // Draw pool table
          ctx.fillStyle = '#006400'; // Dark green
          ctx.fillRect(x, y, width, height);
          
          // Draw table felt
          ctx.fillStyle = '#008000'; // Green
          ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
          
          // Draw table pockets
          ctx.fillStyle = '#000';
          const pocketSize = 4;
          
          // Corner pockets
          ctx.beginPath();
          ctx.arc(x + pocketSize, y + pocketSize, pocketSize, 0, Math.PI * 2);
          ctx.arc(x + width - pocketSize, y + pocketSize, pocketSize, 0, Math.PI * 2);
          ctx.arc(x + pocketSize, y + height - pocketSize, pocketSize, 0, Math.PI * 2);
          ctx.arc(x + width - pocketSize, y + height - pocketSize, pocketSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Side pockets
          ctx.beginPath();
          ctx.arc(x + width / 2, y + pocketSize, pocketSize, 0, Math.PI * 2);
          ctx.arc(x + width / 2, y + height - pocketSize, pocketSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'darts') {
          // Draw dart board
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw dartboard rings
          const ringCount = 5;
          const ringWidth = Math.min(width, height) / (2 * ringCount);
          
          for (let i = 0; i < ringCount; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#fff' : '#f00';
            ctx.beginPath();
            ctx.arc(x + width / 2, y + height / 2, (ringCount - i) * ringWidth, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Draw bullseye
          ctx.fillStyle = '#f00';
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, ringWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    
    renderStage(ctx, stage, gridSize) {
      const x = stage.x * gridSize;
      const y = stage.y * gridSize;
      const width = stage.width * gridSize;
      const height = stage.height * gridSize;
      
      // Draw stage platform
      ctx.fillStyle = '#8B4513'; // Brown
      ctx.fillRect(x, y, width, height);
      
      // Draw stage top
      ctx.fillStyle = '#A0522D'; // Sienna
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      
      // Draw stage front decoration
      ctx.fillStyle = '#D2691E'; // Chocolate
      ctx.fillRect(x, y + height - 5, width, 5);
      
      // Draw microphone stand
      const micX = x + width / 2;
      const micY = y + height / 3;
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(micX, micY);
      ctx.lineTo(micX, micY + 15);
      ctx.stroke();
      
      // Draw microphone
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(micX, micY, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw stage label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Stage',
        x + width / 2,
        y + height - 10
      );
    }
    
    renderVIPArea(ctx, vipArea, gridSize) {
      const x = vipArea.x * gridSize;
      const y = vipArea.y * gridSize;
      const width = vipArea.width * gridSize;
      const height = vipArea.height * gridSize;
      
      // Draw VIP area floor (fancy carpet)
      ctx.fillStyle = '#800080'; // Purple
      ctx.fillRect(x, y, width, height);
      
      // Draw carpet pattern
      ctx.fillStyle = '#9370DB'; // Medium purple
      
      for (let i = 0; i < vipArea.width; i++) {
        for (let j = 0; j < vipArea.height; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(
              (vipArea.x + i) * gridSize + 2,
              (vipArea.y + j) * gridSize + 2,
              gridSize - 4,
              gridSize - 4
            );
          }
        }
      }
      
      // Draw VIP boundary (red rope)
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw VIP posts
      const postSpacing = gridSize * 2;
      ctx.fillStyle = '#FFD700'; // Gold
      
      for (let i = 0; i <= width; i += postSpacing) {
        ctx.beginPath();
        ctx.arc(x + i, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + i, y + height, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      for (let i = postSpacing; i < height; i += postSpacing) {
        ctx.beginPath();
        ctx.arc(x, y + i, 3, 0, Math.PI * 2);
        ctx.beginPath();
      ctx.arc(x, y + i, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x + width, y + i, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw VIP label
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'VIP Area',
      x + width / 2,
      y + height / 2
    );
  }
}

module.exports = LayoutRenderer;