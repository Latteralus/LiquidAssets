// Render Engine - Handles venue visualization and animations

class RenderEngine {
    constructor(game) {
      this.game = game;
      this.canvas = null;
      this.ctx = null;
      this.animationFrameId = null;
      this.gridSize = 30;
      this.initialized = false;
    }
    
    initialize(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = this.canvas.getContext('2d');
      this.initialized = true;
      this.resize();
      
      // Setup resize listener
      window.addEventListener('resize', this.resize.bind(this));
    }
    
    resize() {
      if (!this.canvas) return;
      
      // Adjust canvas size if needed
      const container = this.canvas.parentElement;
      if (container) {
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
      }
    }
    
    startRendering() {
      if (!this.initialized) return;
      
      // Stop any existing animation
      this.stopRendering();
      
      // Start animation loop
      const renderLoop = () => {
        this.render();
        this.animationFrameId = requestAnimationFrame(renderLoop);
      };
      
      renderLoop();
    }
    
    stopRendering() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
    
    render() {
      if (!this.ctx || !this.canvas) return;
      
      // Clear canvas
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw grid
      this.drawGrid();
      
      // Draw venue if available
      if (this.game.state.currentVenue) {
        this.drawVenue(this.game.state.currentVenue);
      }
    }
    
    drawGrid() {
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    }
    
    drawVenue(venue) {
      if (!venue.layout) return;
      
      const layout = venue.layout;
      
      // Scale factors
      const scaleX = this.canvas.width / (layout.width * this.gridSize);
      const scaleY = this.canvas.height / (layout.height * this.gridSize);
      
      // Draw venue layout
      this.drawVenueLayout(layout, scaleX, scaleY);
      
      // Draw customers
      if (this.game.customerManager) {
        const customers = this.game.customerManager.getCustomersByVenue(venue.id);
        this.drawCustomers(customers, layout, scaleX, scaleY);
      }
      
      // Draw staff
      if (this.game.staffManager) {
        const staff = this.game.staffManager.getStaffByVenue(venue.id);
        this.drawStaff(staff, layout, scaleX, scaleY);
      }
    }
    
    drawVenueLayout(layout, scaleX, scaleY) {
      // Draw entrance
      if (layout.entrance) {
        this.ctx.fillStyle = '#8B0000'; // Dark red
        this.ctx.fillRect(
          layout.entrance.x * this.gridSize * scaleX,
          layout.entrance.y * this.gridSize * scaleY,
          this.gridSize * scaleX,
          this.gridSize * scaleY
        );
        
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(
          'Entrance',
          layout.entrance.x * this.gridSize * scaleX,
          layout.entrance.y * this.gridSize * scaleY + 20
        );
      }
      
      // Draw bar
      if (layout.bar) {
        this.ctx.fillStyle = '#8B4513'; // Saddle brown
        this.ctx.fillRect(
          layout.bar.x * this.gridSize * scaleX,
          layout.bar.y * this.gridSize * scaleY,
          layout.bar.width * this.gridSize * scaleX,
          layout.bar.height * this.gridSize * scaleY
        );
        
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
          'Bar',
          layout.bar.x * this.gridSize * scaleX + (layout.bar.width * this.gridSize * scaleX) / 2 - 10,
          layout.bar.y * this.gridSize * scaleY + (layout.bar.height * this.gridSize * scaleY) / 2 + 5
        );
      }
      
      // Draw tables
      if (layout.tables) {
        layout.tables.forEach(table => {
          // Different colors based on table size
          if (table.size === 'small') {
            this.ctx.fillStyle = '#2F4F4F'; // Dark slate gray
          } else if (table.size === 'medium') {
            this.ctx.fillStyle = '#556B2F'; // Dark olive green
          } else {
            this.ctx.fillStyle = '#4B0082'; // Indigo
          }
          
          this.ctx.fillRect(
            table.x * this.gridSize * scaleX,
            table.y * this.gridSize * scaleY,
            2 * this.gridSize * scaleX,
            2 * this.gridSize * scaleY
          );
        });
      }
      
      // Draw restrooms
      if (layout.restrooms) {
        this.ctx.fillStyle = '#4682B4'; // Steel blue
        this.ctx.fillRect(
          layout.restrooms.x * this.gridSize * scaleX,
          layout.restrooms.y * this.gridSize * scaleY,
          layout.restrooms.width * this.gridSize * scaleX,
          layout.restrooms.height * this.gridSize * scaleY
        );
        
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(
          'Restrooms',
          layout.restrooms.x * this.gridSize * scaleX,
          layout.restrooms.y * this.gridSize * scaleY + 10
        );
      }
      
      // Draw kitchen if available
      if (layout.kitchen) {
        this.ctx.fillStyle = '#CD853F'; // Peru
        this.ctx.fillRect(
          layout.kitchen.x * this.gridSize * scaleX,
          layout.kitchen.y * this.gridSize * scaleY,
          layout.kitchen.width * this.gridSize * scaleX,
          layout.kitchen.height * this.gridSize * scaleY
        );
        
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
          'Kitchen',
          layout.kitchen.x * this.gridSize * scaleX + 10,
          layout.kitchen.y * this.gridSize * scaleY + 20
        );
      }
      
      // Draw dance floor if available
      if (layout.danceFloor) {
        this.ctx.fillStyle = '#9932CC'; // Dark orchid
        this.ctx.fillRect(
          layout.danceFloor.x * this.gridSize * scaleX,
          layout.danceFloor.y * this.gridSize * scaleY,
          layout.danceFloor.width * this.gridSize * scaleX,
          layout.danceFloor.height * this.gridSize * scaleY
        );
        
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
          'Dance Floor',
          layout.danceFloor.x * this.gridSize * scaleX + 10,
          layout.danceFloor.y * this.gridSize * scaleY + 20
        );
      }
    }
    
    drawCustomers(customers, layout, scaleX, scaleY) {
      if (!customers || customers.length === 0) return;
      
      // Draw each customer group
      customers.forEach(customer => {
        // Skip if customer doesn't have a position yet
        if (!customer.position) {
          // Assign a random position based on status
          customer.position = this.getRandomCustomerPosition(customer, layout);
        }
        
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
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
          customer.position.x * this.gridSize * scaleX,
          customer.position.y * this.gridSize * scaleY,
          5 + customer.groupSize, // Size based on group size
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      });
    }
    
    getRandomCustomerPosition(customer, layout) {
      // Position depends on customer status
      let x, y;
      
      switch(customer.status) {
        case 'entering':
          // Near entrance
          x = layout.entrance.x + Math.random() * 2 - 1;
          y = layout.entrance.y + Math.random() * 2 + 1;
          break;
        case 'seated':
        case 'ordering':
        case 'waiting':
        case 'eating':
        case 'drinking':
          // Near an assigned table or random table if none assigned
          if (customer.assignedTable) {
            x = customer.assignedTable.x + Math.random();
            y = customer.assignedTable.y + Math.random();
          } else if (layout.tables && layout.tables.length > 0) {
            const table = layout.tables[Math.floor(Math.random() * layout.tables.length)];
            x = table.x + Math.random();
            y = table.y + Math.random();
          } else {
            // Fallback to random position
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'paying':
          // Near bar/counter
          if (layout.bar) {
            x = layout.bar.x + Math.random() * layout.bar.width;
            y = layout.bar.y + Math.random() * layout.bar.height;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'leaving':
          // Moving toward entrance
          x = layout.entrance.x + Math.random() * 2 - 1;
          y = layout.entrance.y + Math.random() * 2 - 1;
          break;
        default:
          // Random position
          x = Math.random() * layout.width;
          y = Math.random() * layout.height;
      }
      
      return { x, y };
    }
    
    drawStaff(staff, layout, scaleX, scaleY) {
      if (!staff || staff.length === 0) return;
      
      // Draw each staff member
      staff.forEach(member => {
        // Skip if not working
        if (!member.isWorking) return;
        
        // Staff position based on type
        if (!member.position) {
          member.position = this.getStaffPosition(member, layout);
        }
        
        // Draw staff rectangle
        this.ctx.fillStyle = '#FF1493'; // Deep pink
        this.ctx.fillRect(
          member.position.x * this.gridSize * scaleX - 5,
          member.position.y * this.gridSize * scaleY - 5,
          10,
          10
        );
        
        // Draw staff label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '8px Arial';
        this.ctx.fillText(
          member.type.charAt(0).toUpperCase(),
          member.position.x * this.gridSize * scaleX - 3,
          member.position.y * this.gridSize * scaleY + 3
        );
      });
    }
    
    getStaffPosition(staff, layout) {
      // Position depends on staff type
      let x, y;
      
      switch(staff.type) {
        case 'bartender':
          // At the bar
          if (layout.bar) {
            x = layout.bar.x + Math.random() * layout.bar.width;
            y = layout.bar.y + Math.random() * layout.bar.height;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'waiter':
          // Moving around tables
          if (layout.tables && layout.tables.length > 0) {
            const table = layout.tables[Math.floor(Math.random() * layout.tables.length)];
            x = table.x + Math.random() * 3 - 1.5;
            y = table.y + Math.random() * 3 - 1.5;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'cook':
          // In the kitchen
          if (layout.kitchen) {
            x = layout.kitchen.x + Math.random() * layout.kitchen.width;
            y = layout.kitchen.y + Math.random() * layout.kitchen.height;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        case 'bouncer':
          // Near entrance
          x = layout.entrance.x;
          y = layout.entrance.y;
          break;
        case 'dj':
          // Near dance floor or bar
          if (layout.danceFloor) {
            x = layout.danceFloor.x + Math.random() * layout.danceFloor.width;
            y = layout.danceFloor.y;
          } else if (layout.bar) {
            x = layout.bar.x + layout.bar.width;
            y = layout.bar.y;
          } else {
            // Fallback
            x = Math.random() * layout.width;
            y = Math.random() * layout.height;
          }
          break;
        default:
          // Random position
          x = Math.random() * layout.width;
          y = Math.random() * layout.height;
      }
      
      return { x, y };
    }
  }
  
  module.exports = RenderEngine;