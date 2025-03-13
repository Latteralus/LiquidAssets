// js/ui/render/animationManager.js

class AnimationManager {
    constructor(renderEngine) {
      this.renderEngine = renderEngine;
      this.game = renderEngine.game;
      this.animations = []; // List of active animations
      this.floatingTexts = []; // List of floating text animations
    }
    
    update(deltaTime) {
      // Update all animations
      this.updateAnimations(deltaTime);
      
      // Update and render floating texts
      this.updateFloatingTexts(deltaTime);
    }
    
    updateAnimations(deltaTime) {
      // Update entity animations
      for (let i = this.animations.length - 1; i >= 0; i--) {
        const animation = this.animations[i];
        
        // Update progress
        animation.elapsed += deltaTime;
        const progress = Math.min(1, animation.elapsed / animation.duration);
        
        // Update entity position using easing function
        const eased = this.easeInOutQuad(progress);
        
        // Apply new position
        animation.entity.position = {
          x: animation.start.x + (animation.end.x - animation.start.x) * eased,
          y: animation.start.y + (animation.end.y - animation.start.y) * eased
        };
        
        // Remove completed animations
        if (progress >= 1) {
          // Trigger completion callback if available
          if (animation.onComplete) {
            animation.onComplete(animation.entity);
          }
          
          this.animations.splice(i, 1);
        }
      }
    }
    
    updateFloatingTexts(deltaTime) {
      const ctx = this.renderEngine.ctx;
      if (!ctx) return;
      
      // Update and render floating texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const text = this.floatingTexts[i];
        
        // Update position and opacity
        text.elapsed += deltaTime;
        const progress = Math.min(1, text.elapsed / text.duration);
        
        // Calculate position and opacity
        const y = text.position.y - (progress * text.distance);
        const opacity = text.fadeOut ? 1 - progress : 1;
        
        // Render text
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = text.color;
        ctx.strokeStyle = text.strokeColor;
        ctx.lineWidth = text.strokeWidth;
        ctx.font = text.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (text.strokeWidth > 0) {
          ctx.strokeText(text.text, text.position.x, y);
        }
        
        ctx.fillText(text.text, text.position.x, y);
        ctx.restore();
        
        // Remove completed animations
        if (progress >= 1) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }
    
    animateEntity(entity, targetPosition, duration = 1.0, easing = 'easeInOutQuad', onComplete = null) {
      // Skip if entity doesn't have position
      if (!entity.position) return null;
      
      // Convert to grid coordinates if needed
      const gridSize = this.renderEngine.gridSize;
      const startPos = { ...entity.position };
      const endPos = {
        x: targetPosition.x / gridSize,
        y: targetPosition.y / gridSize
      };
      
      // Create new animation
      const animation = {
        entity: entity,
        start: startPos,
        end: endPos,
        duration: duration,
        elapsed: 0,
        easing: easing,
        onComplete: onComplete
      };
      
      // Add to animations list
      this.animations.push(animation);
      
      return animation;
    }
    
    createFloatingText(text, position, options = {}) {
      const defaultOptions = {
        color: '#fff',
        strokeColor: '#000',
        strokeWidth: 2,
        font: '14px Arial',
        duration: 1.5,
        distance: 30,
        fadeOut: true
      };
      
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Create floating text
      const floatingText = {
        text: text,
        position: { ...position },
        elapsed: 0,
        ...mergedOptions
      };
      
      // Add to list
      this.floatingTexts.push(floatingText);
      
      return floatingText;
    }
    
    // Easing functions
    easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    easeOutBounce(t) {
      const n1 = 7.5625;
      const d1 = 2.75;
      
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
    
    easeInBack(t) {
      const c1 = 1.70158;
      return c1 * t * t * t - c1 * t * t;
    }
    
    easeOutElastic(t) {
      const c4 = (2 * Math.PI) / 3;
      
      return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    
    // Remove all animations for an entity
    clearEntityAnimations(entity) {
      this.animations = this.animations.filter(a => a.entity !== entity);
    }
    
    // Remove all animations
    clearAllAnimations() {
      this.animations = [];
      this.floatingTexts = [];
    }
  }
  
  module.exports = AnimationManager;