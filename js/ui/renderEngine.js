// js/ui/renderEngine.js - Main renderer orchestrator

const VenueRenderer = require('./render/venueRenderer');
const EntityRenderer = require('./render/entityRenderer');
const AnimationManager = require('./render/animationManager');
const LayoutRenderer = require('./render/layoutRenderer');

class RenderEngine {
  constructor(game) {
    this.game = game;
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.gridSize = 30;
    this.initialized = false;
    this.lastFrameTime = 0;
    this.fps = 30;
    this.frameInterval = 1000 / this.fps;
    this.zoom = 1;
    this.viewOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.hoverEntity = null;
    this.selectedEntity = null;
    
    // Initialize sub-renderers
    this.venueRenderer = new VenueRenderer(this);
    this.entityRenderer = new EntityRenderer(this);
    this.animationManager = new AnimationManager(this);
    this.layoutRenderer = new LayoutRenderer(this);
  }
  
  initialize(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.initialized = true;
    this.resize();
    
    // Setup event listeners
    this._setupEventListeners();
    
    return this;
  }
  
  _setupEventListeners() {
    if (!this.canvas) return;
    
    // Resize handling
    window.addEventListener('resize', this.resize.bind(this));
    
    // Mouse interactions
    this.canvas.addEventListener('mousedown', this._handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this._handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this._handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this._handleWheel.bind(this));
    this.canvas.addEventListener('click', this._handleClick.bind(this));
    
    // Touch interactions for mobile
    this.canvas.addEventListener('touchstart', this._handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this._handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this._handleTouchEnd.bind(this));
  }
  
  _handleMouseDown(event) {
    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - this.viewOffset.x,
      y: event.clientY - this.viewOffset.y
    };
  }
  
  _handleMouseMove(event) {
    // Update hover entity for tooltips
    const canvasRect = this.canvas.getBoundingClientRect();
    const mouseX = (event.clientX - canvasRect.left) / this.zoom - this.viewOffset.x;
    const mouseY = (event.clientY - canvasRect.top) / this.zoom - this.viewOffset.y;
    
    this.hoverEntity = this._getEntityAtPosition(mouseX, mouseY);
    
    // Handle panning if dragging
    if (this.isDragging) {
      this.viewOffset.x = event.clientX - this.dragStart.x;
      this.viewOffset.y = event.clientY - this.dragStart.y;
    }
  }
  
  _handleMouseUp() {
    this.isDragging = false;
  }
  
  _handleWheel(event) {
    // Zoom in/out
    event.preventDefault();
    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = this.zoom * zoomDelta;
    
    // Limit zoom range
    if (newZoom >= 0.5 && newZoom <= 2.0) {
      // Get mouse position relative to canvas
      const canvasRect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - canvasRect.left;
      const mouseY = event.clientY - canvasRect.top;
      
      // Calculate new offset to zoom toward mouse position
      this.viewOffset.x = mouseX - (mouseX - this.viewOffset.x) * zoomDelta;
      this.viewOffset.y = mouseY - (mouseY - this.viewOffset.y) * zoomDelta;
      
      this.zoom = newZoom;
    }
  }
  
  _handleClick(event) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const clickX = (event.clientX - canvasRect.left) / this.zoom - this.viewOffset.x;
    const clickY = (event.clientY - canvasRect.top) / this.zoom - this.viewOffset.y;
    
    const clickedEntity = this._getEntityAtPosition(clickX, clickY);
    this.selectedEntity = clickedEntity;
    
    // Trigger event for clicked entity
    if (clickedEntity && this.game.notificationManager) {
      if (clickedEntity.type === 'customer') {
        this.game.notificationManager.info(`Selected customer group of ${clickedEntity.groupSize}`, {
          status: clickedEntity.status,
          satisfaction: `${clickedEntity.satisfaction}%`,
          spending: clickedEntity.totalSpending ? `€${clickedEntity.totalSpending.toFixed(2)}` : 'N/A'
        });
      } else if (clickedEntity.type === 'staff') {
        this.game.notificationManager.info(`Selected staff: ${clickedEntity.name}`, {
          role: clickedEntity.type,
          status: clickedEntity.isWorking ? 'Working' : 'Off-duty',
          morale: `${clickedEntity.morale}%`
        });
      }
    }
  }
  
  _handleTouchStart(event) {
    if (event.touches.length === 1) {
      // Single touch - same as mouse down
      this.isDragging = true;
      this.dragStart = {
        x: event.touches[0].clientX - this.viewOffset.x,
        y: event.touches[0].clientY - this.viewOffset.y
      };
    }
  }
  
  _handleTouchMove(event) {
    if (event.touches.length === 1 && this.isDragging) {
      // Handle panning with touch
      this.viewOffset.x = event.touches[0].clientX - this.dragStart.x;
      this.viewOffset.y = event.touches[0].clientY - this.dragStart.y;
      event.preventDefault(); // Prevent scrolling
    }
  }
  
  _handleTouchEnd() {
    this.isDragging = false;
  }
  
  _getEntityAtPosition(x, y) {
    // Get venue data
    const venue = this.game.state.currentVenue;
    if (!venue) return null;
    
    // First check staff (they're drawn on top)
    const staff = this.game.staffManager ? this.game.staffManager.getStaffByVenue(venue.id) : [];
    for (const staffMember of staff) {
      if (staffMember.position) {
        const staffX = staffMember.position.x * this.gridSize;
        const staffY = staffMember.position.y * this.gridSize;
        
        // Simple circle hit detection (staff are drawn as 10x10 rectangles)
        if (x >= staffX - 10 && x <= staffX + 10 && 
            y >= staffY - 10 && y <= staffY + 10) {
          return {
            type: 'staff',
            ...staffMember
          };
        }
      }
    }
    
    // Then check customers
    const customers = this.game.customerManager ? 
      this.game.customerManager.getCustomersByVenue(venue.id) : [];
    
    for (const customer of customers) {
      if (customer.position) {
        const customerX = customer.position.x * this.gridSize;
        const customerY = customer.position.y * this.gridSize;
        const radius = 5 + customer.groupSize; // Size based on group size
        
        // Circle hit detection
        const distance = Math.sqrt(
          Math.pow(x - customerX, 2) + Math.pow(y - customerY, 2)
        );
        
        if (distance <= radius) {
          return {
            type: 'customer',
            ...customer
          };
        }
      }
    }
    
    // Check venue elements
    if (venue.layout) {
      // Check tables
      if (venue.layout.tables) {
        for (const table of venue.layout.tables) {
          const tableX = table.x * this.gridSize;
          const tableY = table.y * this.gridSize;
          const tableWidth = (table.size === 'small' ? 1 : 
                            (table.size === 'medium' ? 2 : 3)) * this.gridSize;
          const tableHeight = (table.size === 'small' ? 1 : 2) * this.gridSize;
          
          if (x >= tableX && x <= tableX + tableWidth &&
              y >= tableY && y <= tableY + tableHeight) {
            return {
              type: 'table',
              ...table
            };
          }
        }
      }
      
      // Check other elements...
    }
    
    return null;
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
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this._renderLoop.bind(this));
  }
  
  stopRendering() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  _renderLoop(timestamp) {
    // Calculate delta time
    const delta = timestamp - this.lastFrameTime;
    
    // Only render if enough time has passed (for consistent frame rate)
    if (delta >= this.frameInterval) {
      // Update last frame time
      this.lastFrameTime = timestamp - (delta % this.frameInterval);
      
      // Render the frame
      this.render(delta / 1000); // Convert to seconds for animations
    }
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame(this._renderLoop.bind(this));
  }
  
  render(deltaTime) {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply transformations for pan and zoom
    this.ctx.save();
    this.ctx.translate(this.viewOffset.x, this.viewOffset.y);
    this.ctx.scale(this.zoom, this.zoom);
    
    // Draw grid
    this.drawGrid();
    
    // Draw venue if available
    if (this.game.state.currentVenue) {
      this.venueRenderer.renderVenue(
        this.ctx, 
        this.game.state.currentVenue, 
        this.gridSize, 
        deltaTime
      );
      
      // Render entities (customers, staff)
      this.entityRenderer.renderEntities(
        this.ctx, 
        this.game.state.currentVenue, 
        this.gridSize, 
        deltaTime
      );
      
      // Process animations
      this.animationManager.update(deltaTime);
    } else {
      // No venue loaded - show a message
      this.drawNoVenueMessage();
    }
    
    // Restore canvas state
    this.ctx.restore();
    
    // Draw UI elements that should not be affected by pan/zoom
    this.drawUI();
  }
  
  drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    
    // Calculate visible grid area
    const startX = Math.floor(-this.viewOffset.x / (this.gridSize * this.zoom));
    const startY = Math.floor(-this.viewOffset.y / (this.gridSize * this.zoom));
    const endX = startX + Math.ceil(this.canvas.width / (this.gridSize * this.zoom)) + 1;
    const endY = startY + Math.ceil(this.canvas.height / (this.gridSize * this.zoom)) + 1;
    
    // Draw vertical grid lines
    for (let x = startX; x <= endX; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.gridSize, startY * this.gridSize);
      this.ctx.lineTo(x * this.gridSize, endY * this.gridSize);
      this.ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = startY; y <= endY; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX * this.gridSize, y * this.gridSize);
      this.ctx.lineTo(endX * this.gridSize, y * this.gridSize);
      this.ctx.stroke();
    }
  }
  
  drawNoVenueMessage() {
    this.ctx.fillStyle = '#ddd';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'No venue loaded. Create or select a venue to continue.',
      this.canvas.width / (2 * this.zoom) - this.viewOffset.x / this.zoom,
      this.canvas.height / (2 * this.zoom) - this.viewOffset.y / this.zoom
    );
  }
  
  drawUI() {
    // Draw hover tooltips
    if (this.hoverEntity) {
      this.drawEntityTooltip(this.hoverEntity);
    }
    
    // Draw selection highlight
    if (this.selectedEntity) {
      this.drawSelectionHighlight(this.selectedEntity);
    }
    
    // Draw stats and info
    this.drawVenueInfo();
  }
  
  drawEntityTooltip(entity) {
    // Position tooltip near cursor but ensure it stays within canvas
    const tooltipX = 10;
    const tooltipY = this.canvas.height - 60;
    const tooltipWidth = 200;
    const tooltipHeight = 50;
    
    // Draw tooltip background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    this.ctx.strokeStyle = '#555';
    this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    // Draw tooltip content
    this.ctx.fillStyle = '#ddd';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    
    if (entity.type === 'customer') {
      this.ctx.fillText(`Customers: Group of ${entity.groupSize}`, tooltipX + 10, tooltipY + 15);
      this.ctx.fillText(`Status: ${entity.status}`, tooltipX + 10, tooltipY + 30);
      this.ctx.fillText(`Satisfaction: ${Math.round(entity.satisfaction)}%`, tooltipX + 10, tooltipY + 45);
    } else if (entity.type === 'staff') {
      this.ctx.fillText(`Staff: ${entity.name}`, tooltipX + 10, tooltipY + 15);
      this.ctx.fillText(`Role: ${entity.type}`, tooltipX + 10, tooltipY + 30);
      this.ctx.fillText(`Morale: ${Math.round(entity.morale)}%`, tooltipX + 10, tooltipY + 45);
    } else if (entity.type === 'table') {
      this.ctx.fillText(`Table (${entity.size})`, tooltipX + 10, tooltipY + 15);
      this.ctx.fillText(`Capacity: ${entity.capacity}`, tooltipX + 10, tooltipY + 30);
      this.ctx.fillText(`${entity.reserved ? 'Reserved' : 'Available'}`, tooltipX + 10, tooltipY + 45);
    }
  }
  
  drawSelectionHighlight(entity) {
    // Skip if entity doesn't have position data
    if (!entity.position) return;
    
    // Convert grid position to canvas coordinates
    const x = entity.position.x * this.gridSize * this.zoom + this.viewOffset.x;
    const y = entity.position.y * this.gridSize * this.zoom + this.viewOffset.y;
    
    // Draw pulsating highlight circle
    const pulseScale = 1 + 0.2 * Math.sin(performance.now() / 200);
    let radius = 0;
    
    if (entity.type === 'customer') {
      radius = (5 + entity.groupSize) * pulseScale;
    } else if (entity.type === 'staff') {
      radius = 10 * pulseScale;
    } else {
      radius = 15 * pulseScale;
    }
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(this.zoom, this.zoom);
    
    // Draw selection circle
    this.ctx.strokeStyle = '#ffcc00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Restore canvas state
    this.ctx.restore();
  }
  
  drawVenueInfo() {
    const venue = this.game.state.currentVenue;
    if (!venue) return;
    
    // Draw venue info at the top
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(10, 10, this.canvas.width - 20, 30);
    
    this.ctx.fillStyle = '#ddd';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    
    // Current time
    let timeText = '';
    if (this.game.timeManager) {
      const gameTime = this.game.timeManager.getGameTime();
      timeText = `${gameTime.hour.toString().padStart(2, '0')}:${gameTime.minute.toString().padStart(2, '0')}`;
    }
    
    // Customer count
    let customerCount = 0;
    if (this.game.customerManager) {
      customerCount = this.game.customerManager.getCustomersByVenue(venue.id).length;
    }
    
    // Draw text
    this.ctx.fillText(`${venue.name} (${venue.type}) - ${venue.city} - ${timeText} - Customers: ${customerCount}`, 20, 28);
    
    // Draw status indicators
    this.drawStatusIndicators(venue);
  }
  
  drawStatusIndicators(venue) {
    // Draw key status indicators at bottom right
    const indicators = [
      { name: 'Cleanliness', value: venue.stats.cleanliness, color: '#5cb85c' },
      { name: 'Service', value: venue.stats.serviceQuality, color: '#f0ad4e' },
      { name: 'Atmosphere', value: venue.stats.atmosphere, color: '#5bc0de' }
    ];
    
    const startX = this.canvas.width - 220;
    const startY = this.canvas.height - 100;
    
    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(startX, startY, 210, 90);
    
    // Draw indicators
    indicators.forEach((indicator, index) => {
      const y = startY + 20 + (index * 25);
      
      // Label
      this.ctx.fillStyle = '#ddd';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${indicator.name}: ${Math.round(indicator.value)}%`, startX + 10, y);
      
      // Bar background
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(startX + 110, y - 10, 90, 15);
      
      // Bar fill
      this.ctx.fillStyle = indicator.color;
      this.ctx.fillRect(startX + 110, y - 10, 90 * (indicator.value / 100), 15);
    });
  }
  
  // Public methods for animating entities
  animateCustomerMovement(customer, targetPosition, duration) {
    return this.animationManager.animateEntity(
      customer,
      targetPosition,
      duration
    );
  }
  
  createFloatingText(text, position, options = {}) {
    return this.animationManager.createFloatingText(
      text,
      position,
      options
    );
  }
  
  // Set rendering options
  setRenderingOptions(options) {
    if (options.gridSize !== undefined) {
      this.gridSize = options.gridSize;
    }
    
    if (options.fps !== undefined) {
      this.fps = options.fps;
      this.frameInterval = 1000 / this.fps;
    }
    
    if (options.zoom !== undefined) {
      this.zoom = options.zoom;
    }
  }
}

module.exports = RenderEngine;