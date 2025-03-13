// js/ui/render/venueRenderer.js

class VenueRenderer {
    constructor(renderEngine) {
      this.renderEngine = renderEngine;
      this.game = renderEngine.game;
      this.layoutRenderer = null;
    }
    
    setLayoutRenderer(layoutRenderer) {
      this.layoutRenderer = layoutRenderer;
    }
    
    renderVenue(ctx, venue, gridSize, deltaTime) {
      if (!venue || !venue.layout) return;
      
      // Let layout renderer handle the static elements
      if (this.layoutRenderer) {
        this.layoutRenderer.renderLayout(ctx, venue.layout, gridSize);
      } else {
        // Fallback to basic layout rendering
        this.renderBasicLayout(ctx, venue.layout, gridSize);
      }
      
      // Draw time-based effects and ambiance
      this.renderAmbiance(ctx, venue, gridSize, deltaTime);
    }
    
    renderBasicLayout(ctx, layout, gridSize) {
      // Basic fallback rendering of the venue layout
      const width = layout.width * gridSize;
      const height = layout.height * gridSize;
      
      // Draw floor
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw walls
      if (layout.walls) {
        ctx.fillStyle = '#555';
        
        layout.walls.forEach(wall => {
          if (wall.type === 'door') {
            ctx.fillStyle = '#8B4513'; // Brown for doors
          } else {
            ctx.fillStyle = '#555'; // Gray for walls
          }
          
          ctx.fillRect(
            wall.x * gridSize,
            wall.y * gridSize,
            gridSize,
            gridSize
          );
        });
      }
      
      // Draw bar if present
      if (layout.bar) {
        ctx.fillStyle = '#8B4513'; // Saddle brown
        ctx.fillRect(
          layout.bar.x * gridSize,
          layout.bar.y * gridSize,
          layout.bar.width * gridSize,
          layout.bar.height * gridSize
        );
        
        // Draw bar label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Bar',
          (layout.bar.x + layout.bar.width / 2) * gridSize,
          (layout.bar.y + layout.bar.height / 2) * gridSize + 5
        );
      }
      
      // Draw tables if present
      if (layout.tables) {
        layout.tables.forEach(table => {
          let tableWidth, tableHeight;
          
          // Table size
          if (table.size === 'small') {
            tableWidth = gridSize;
            tableHeight = gridSize;
            ctx.fillStyle = '#2F4F4F'; // Dark slate gray
          } else if (table.size === 'medium') {
            tableWidth = 2 * gridSize;
            tableHeight = 2 * gridSize;
            ctx.fillStyle = '#556B2F'; // Dark olive green
          } else {
            tableWidth = 3 * gridSize;
            tableHeight = 2 * gridSize;
            ctx.fillStyle = '#4B0082'; // Indigo
          }
          
          // Draw table
          ctx.fillRect(
            table.x * gridSize,
            table.y * gridSize,
            tableWidth,
            tableHeight
          );
        });
      }
    }
    
    renderAmbiance(ctx, venue, gridSize, deltaTime) {
      // Add time-based effects and ambiance
      const layout = venue.layout;
      const width = layout.width * gridSize;
      const height = layout.height * gridSize;
      
      // Music volume visualization
      if (venue.settings.musicVolume > 30) {
        // Draw sound waves from speakers or DJ booth
        if (layout.djBooth) {
          const x = (layout.djBooth.x + layout.djBooth.width / 2) * gridSize;
          const y = (layout.djBooth.y + layout.djBooth.height / 2) * gridSize;
          
          this.drawSoundWaves(ctx, x, y, venue.settings.musicVolume, deltaTime);
        }
      }
      
      // Lighting effects
      if (venue.settings.lightingLevel < 70) {
        // Draw darkness overlay with gradient for low light
        const gradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, Math.max(width, height) / 2
        );
        
        const alpha = 0.7 - (venue.settings.lightingLevel / 100) * 0.7;
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add spotlight effects for nightclubs
        if (venue.type === 'Nightclub' && layout.danceFloor) {
          const danceX = (layout.danceFloor.x + layout.danceFloor.width / 2) * gridSize;
          const danceY = (layout.danceFloor.y + layout.danceFloor.height / 2) * gridSize;
          
          this.drawSpotlights(ctx, danceX, danceY, deltaTime);
        }
      }
      
      // Cleanliness visualization
      if (venue.stats.cleanliness < 50) {
        // Draw "dirt" spots randomly, more when cleanliness is lower
        const dirtCount = Math.floor((50 - venue.stats.cleanliness) / 5);
        
        ctx.fillStyle = 'rgba(80, 60, 30, 0.3)';
        
        for (let i = 0; i < dirtCount; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = 5 + Math.random() * 10;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    drawSoundWaves(ctx, x, y, volume, deltaTime) {
      // Draw animated sound waves
      const waveCount = Math.floor(volume / 20); // 1-5 waves based on volume
      const maxRadius = volume * 0.5;
      
      // Use deltaTime and current time to animate the waves
      const time = performance.now() / 1000;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < waveCount; i++) {
        // Calculate wave size with time-based animation
        const offset = (time * 0.5 + i / waveCount) % 1;
        const radius = offset * maxRadius;
        
        // Opacity fades as the wave expands
        ctx.globalAlpha = 1 - offset;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1; // Reset alpha
    }
    
    drawSpotlights(ctx, centerX, centerY, deltaTime) {
      // Create moving spotlight effects for nightclubs
      const time = performance.now() / 1000;
      const spotlightColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
      
      for (let i = 0; i < 3; i++) {
        // Calculate spotlight position with time-based movement
        const angle = (time * 0.5 + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
        const distance = 100 + Math.sin(time * 0.7 + i) * 50;
        
        const spotX = centerX + Math.cos(angle) * distance;
        const spotY = centerY + Math.sin(angle) * distance;
        
        // Create spotlight gradient
        const gradient = ctx.createRadialGradient(
          spotX, spotY, 0,
          spotX, spotY, 100
        );
        
        const color = spotlightColors[i % spotlightColors.length];
        gradient.addColorStop(0, color + '40'); // Semi-transparent color
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(spotX, spotY, 100, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  module.exports = VenueRenderer;