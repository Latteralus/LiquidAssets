// js/utils/eventBus.js
/**
 * Centralized event bus for application-wide events.
 */
class EventBus {
    constructor() {
      this.events = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Event name
     * @param {Function} callback - Event callback
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      
      this.events[eventName].push(callback);
      
      // Return unsubscribe function
      return () => {
        this.off(eventName, callback);
      };
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} eventName - Event name
     * @param {Function} callback - Event callback
     */
    off(eventName, callback) {
      if (!this.events[eventName]) {
        return;
      }
      
      this.events[eventName] = this.events[eventName]
        .filter(cb => cb !== callback);
    }
    
    /**
     * Emit an event
     * @param {string} eventName - Event name
     * @param {...any} args - Event arguments
     */
    emit(eventName, ...args) {
      if (!this.events[eventName]) {
        return;
      }
      
      // Create a copy of the callbacks array to prevent issues
      // if a callback modifies the events array
      const callbacks = [...this.events[eventName]];
      
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      }
    }
    
    /**
     * Subscribe to an event once
     * @param {string} eventName - Event name
     * @param {Function} callback - Event callback
     */
    once(eventName, callback) {
      const onceWrapper = (...args) => {
        this.off(eventName, onceWrapper);
        callback(...args);
      };
      
      this.on(eventName, onceWrapper);
    }
    
    /**
     * Clear all event listeners
     * @param {string} [eventName] - Optional event name to clear
     */
    clear(eventName) {
      if (eventName) {
        this.events[eventName] = [];
      } else {
        this.events = {};
      }
    }
    
    /**
     * Get event names with listeners
     * @returns {Array<string>} Array of event names
     */
    getEventNames() {
      return Object.keys(this.events);
    }
    
    /**
     * Get listener count for an event
     * @param {string} eventName - Event name
     * @returns {number} Listener count
     */
    listenerCount(eventName) {
      return this.events[eventName]?.length || 0;
    }
  }
  
  // Export a singleton instance
  const eventBus = new EventBus();
  module.exports = eventBus;