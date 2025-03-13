// js/ui/render/entityRenderer.js

class EntityRenderer {
    constructor(renderEngine) {
      this.renderEngine = renderEngine;
      this.game = renderEngine.game;
      this.customerSprites = {}; // Will store customer appearance data
      this.staffSprites = {}; // Will store staff appearance data
    }
    
    renderEntities(ctx, venue, gridSize, deltaTime) {
      // First render all static entities (tables, furniture)
      this.renderStaticEntities(ctx, venue, gridSize);
      
      // Then render dynamic entities (customers, staff)
      this.renderDynamicEntities(ctx, venue, gridSize, deltaTime);
    }
    
    renderStaticEntities(ctx, venue, gridSize) {
      // This is handled by the venue renderer for most static elements
      // We would handle furniture here that isn't part of the basic layout
      if (!venue || !venue.layout) return;
      
      // Render decorations
      if (venue.layout.decoration) {
        venue.layout.decoration.forEach(decoration => {
          switch(decoration.type) {
            case 'plant':
              this.renderPlant(ctx, decoration, gridSize);
              break;
            case 'painting':
              this.renderPainting(ctx, decoration, gridSize);
              break;
            case 'tv':
              this.renderTV(ctx, decoration, gridSize);
              break;
            case 'speaker':
              this.renderSpeaker(ctx, decoration, gridSize);
              break;
            case 'light':
              this.renderLight(ctx, decoration, gridSize);
              break;
            // Add more decoration types as needed
          }
        });
      }
    }
    
    renderDynamicEntities(ctx, venue, gridSize, deltaTime) {
      // Render customers
      this.renderCustomers(ctx, venue, gridSize, deltaTime);
      
      // Render staff
      this.renderStaff(ctx, venue, gridSize, deltaTime);
    }
    
    renderCustomers(ctx, venue, gridSize, deltaTime) {
      const customers = this.game.customerManager ? 
        this.game.customerManager.getCustomersByVenue(venue.id) : [];
      
      // Sort customers by y position for proper layering
      customers.sort((a, b) => {
        if (!a.position || !b.position) return 0;
        return a.position.y - b.position.y;
      });
      
      customers.forEach(customer => {
        if (!customer.position) return;
        
        // Get or generate customer sprite
        if (!this.customerSprites[customer.id]) {
          this.customerSprites[customer.id] = this.generateCustomerSprite(customer);
        }
        
        const sprite = this.customerSprites[customer.id];
        
        // Base position
        const x = customer.position.x * gridSize;
        const y = customer.position.y * gridSize;
        
        // Status-based rendering
        this.renderCustomerBasedOnStatus(ctx, customer, sprite, x, y, gridSize, deltaTime);
      });
    }
    
    renderCustomerBasedOnStatus(ctx, customer, sprite, x, y, gridSize, deltaTime) {
      // Base circle for customer group
      const radius = 5 + customer.groupSize;
      
      // Color based on status
      let color;
      switch(customer.status) {
        case 'entering':
          color = '#FFD700'; // Gold
          break;
        case 'seated':
        case 'ordering':
          color = '#32CD32'; // Lime green
          break;
        case 'waiting':
          color = '#FF8C00'; // Dark orange
          break;
        case 'eating':
        case 'drinking':
          color = '#00BFFF'; // Deep sky blue
          break;
        case 'paying':
          color = '#6A5ACD'; // Slate blue
          break;
        case 'leaving':
          color = '#FF6347'; // Tomato
          break;
        default:
          color = '#FFFFFF'; // White
      }
      
      // Draw customer circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw number of people in group
      ctx.fillStyle = '#111';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customer.groupSize.toString(), x, y);
      
      // Add activity indicators based on status
      if (customer.status === 'eating' || customer.status === 'drinking') {
        // Animate consumption
        const time = performance.now() / 1000;
        const bobAmount = Math.sin(time * 3 + customer.id.charCodeAt(0)) * 2;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y - radius - 4 - bobAmount, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (customer.status === 'waiting') {
        // Show impatience indicator if waiting a long time
        const time = performance.now() / 1000;
        const frequency = Math.max(1, 5 - (customer.patience / 20)); // Faster as patience decreases
        const bubbleSize = Math.sin(time * frequency) > 0 ? 4 : 0; // Pulsing bubble
        
        if (bubbleSize > 0) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(x + radius, y - radius, bubbleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Satisfaction indicator
      this.renderSatisfactionIndicator(ctx, customer, x, y, radius);
    }
    
    renderSatisfactionIndicator(ctx, customer, x, y, radius) {
      // Only show for customers that have been in the venue long enough
      if (customer.status === 'entering' || !customer.satisfaction) return;
      
      // Small colored dot representing satisfaction
      let color;
      if (customer.satisfaction >= 80) {
        color = '#3CB371'; // Green for high satisfaction
      } else if (customer.satisfaction >= 50) {
        color = '#FFD700'; // Yellow for medium satisfaction
      } else {
        color = '#DC143C'; // Red for low satisfaction
      }
      
      // Draw dot at top-right of customer circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + radius * 0.7, y - radius * 0.7, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    renderStaff(ctx, venue, gridSize, deltaTime) {
      const staff = this.game.staffManager ? 
        this.game.staffManager.getStaffByVenue(venue.id) : [];
      
      staff.forEach(member => {
        // Skip if not working or no position
        if (!member.isWorking || !member.position) return;
        
        // Get or generate staff sprite
        if (!this.staffSprites[member.id]) {
          this.staffSprites[member.id] = this.generateStaffSprite(member);
        }
        
        const sprite = this.staffSprites[member.id];
        
        // Base position
        const x = member.position.x * gridSize;
        const y = member.position.y * gridSize;
        
        // Draw staff based on type
        this.renderStaffMember(ctx, member, sprite, x, y, gridSize, deltaTime);
      });
    }
    
    renderStaffMember(ctx, member, sprite, x, y, gridSize, deltaTime) {
      // Draw a rectangle for staff
      ctx.fillStyle = this.getStaffColor(member.type);
      ctx.fillRect(x - 5, y - 5, 10, 10);
      
      // Draw staff type indicator
      ctx.fillStyle = '#fff';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(member.type.charAt(0).toUpperCase(), x, y);
      
      // Add activity indicators based on staff type and current task
      this.renderStaffActivity(ctx, member, x, y, deltaTime);
      
      // Draw morale indicator
      this.renderMoraleIndicator(ctx, member, x, y);
    }
    
    renderStaffActivity(ctx, member, x, y, deltaTime) {
      // Animate staff activity
      const time = performance.now() / 1000;
      
      if (member.type === 'bartender') {
        // Show mixing animation
        if (Math.sin(time * 4) > 0.7) {
          ctx.strokeStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(x + 8, y - 3);
          ctx.lineTo(x + 12, y);
          ctx.stroke();
        }
      } else if (member.type === 'waiter') {
        // Show movement lines when moving
        if (Math.sin(time * 3) > 0) {
          ctx.strokeStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(x + 7, y + 7);
          ctx.lineTo(x + 10, y + 10);
          ctx.stroke();
        }
      } else if (member.type === 'cook') {
        // Show cooking animation
        if (Math.sin(time * 2) > 0) {
          ctx.fillStyle = '#ff9900';
          ctx.beginPath();
          ctx.arc(x + 8, y - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    renderMoraleIndicator(ctx, member, x, y) {
      // Only show if morale data is available
      if (member.morale === undefined) return;
      
      // Small colored dot representing morale
      let color;
      if (member.morale >= 80) {
        color = '#3CB371'; // Green for high morale
      } else if (member.morale >= 50) {
        color = '#FFD700'; // Yellow for medium morale
      } else {
        color = '#DC143C'; // Red for low morale
      }
      
      // Draw dot above staff member
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Helper methods for entity rendering
    generateCustomerSprite(customer) {
      // Generate visual appearance data for the customer
      // For now, just return basic data
      return {
        color: this.getRandomCustomerColor(),
        size: customer.groupSize
      };
    }
    
    generateStaffSprite(staff) {
      // Generate visual appearance data for the staff member
      // For now, just return basic data
      return {
        color: this.getStaffColor(staff.type),
        type: staff.type
      };
    }
    
    getRandomCustomerColor() {
      const colors = ['#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
                    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getStaffColor(staffType) {
      const staffColors = {
        'bartender': '#FF1493', // Deep pink
        'waiter': '#20B2AA', // Light sea green
        'cook': '#FF8C00', // Dark orange
        'bouncer': '#4B0082', // Indigo
        'dj': '#BA55D3', // Medium orchid
        'manager': '#4682B4', // Steel blue
        'cleaner': '#2E8B57'  // Sea green
      };
      
      return staffColors[staffType] || '#FF1493';
    }
    
    // Rendering methods for decorations
    renderPlant(ctx, decoration, gridSize) {
      const x = decoration.x * gridSize;
      const y = decoration.y * gridSize;
      
      if (decoration.size === 'large') {
        // Draw pot
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 5, y + 5, 10, 10);
        
        // Draw plant
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x - 10, y + 5);
        ctx.lineTo(x + 10, y + 5);
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw pot
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 3, y + 3, 6, 6);
        
        // Draw plant
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI, true);
        ctx.fill();
      }
    }
    
    renderPainting(ctx, decoration, gridSize) {
      const x = decoration.x * gridSize;
      const y = decoration.y * gridSize;
      
      // Draw frame
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - 10, y - 10, 20, 15);
      
      // Draw painting content based on theme
      if (decoration.theme === 'landscape') {
        ctx.fillStyle = '#87CEEB'; // Sky
        ctx.fillRect(x - 8, y - 8, 16, 6);
        
        ctx.fillStyle = '#228B22'; // Land
        ctx.fillRect(x - 8, y - 2, 16, 5);
      } else if (decoration.theme === 'food') {
        ctx.fillStyle = '#FFF5E1'; // Background
        ctx.fillRect(x - 8, y - 8, 16, 11);
        
        ctx.fillStyle = '#FF4500'; // Food
        ctx.beginPath();
        ctx.arc(x, y - 3, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Abstract
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(x - 8, y - 8, 8, 5);
        
        ctx.fillStyle = '#DA70D6';
        ctx.fillRect(x, y - 8, 8, 5);
        
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(x - 8, y - 3, 8, 6);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x, y - 3, 8, 6);
      }
    }
    
    renderTV(ctx, decoration, gridSize) {
      const x = decoration.x * gridSize;
      const y = decoration.y * gridSize;
      
      // Draw TV frame
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 12, y - 8, 24, 16);
      
      // Draw screen with animated "content"
      const time = performance.now() / 1000;
      const brightness = (Math.sin(time) + 1) / 2;
      
      ctx.fillStyle = `rgba(100, 149, 237, ${0.5 + brightness * 0.5})`;
      ctx.fillRect(x - 10, y - 6, 20, 12);
    }
    
    renderSpeaker(ctx, decoration, gridSize) {
      const x = decoration.x * gridSize;
      const y = decoration.y * gridSize;
      
      // Draw speaker box
      ctx.fillStyle = '#222';
      ctx.fillRect(x - 5, y - 10, 10, 20);
      
      // Draw speaker cones
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.arc(x, y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x, y + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    renderLight(ctx, decoration, gridSize) {
      const x = decoration.x * gridSize;
      const y = decoration.y * gridSize;
      const color = decoration.color || '#fff';
      
      // Draw light fixture
      ctx.fillStyle = '#555';
      ctx.fillRect(x - 2, y - 2, 4, 4);
      
      // Draw light beam
      const time = performance.now() / 1000;
      const intensity = (Math.sin(time * 2) + 1) / 2 * 0.3 + 0.2;
      
      // Create radial gradient for the light
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
      gradient.addColorStop(0, `${color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  module.exports = EntityRenderer;