// js/utils/stateMachine.js
/**
 * Simple state machine implementation for entity behavior management.
 */
class StateMachine {
    /**
     * Create a state machine
     * @param {Object} config - State machine configuration
     * @param {string} config.initialState - Initial state
     * @param {Object} config.states - State definitions
     * @param {Object} [config.context={}] - Shared context
     */
    constructor(config) {
      this.currentState = config.initialState;
      this.initialState = config.initialState;
      this.states = config.states;
      this.context = config.context || {};
      this.history = [];
      
      // Validate states
      if (!this.states[this.currentState]) {
        throw new Error(`Invalid initial state: ${this.currentState}`);
      }
    }
    
    /**
     * Transition to a new state
     * @param {string} newState - State to transition to
     * @param {Object} [data={}] - Transition data
     * @returns {boolean} Success status
     */
    transition(newState, data = {}) {
      // Check if the new state exists
      if (!this.states[newState]) {
        console.error(`Cannot transition to invalid state: ${newState}`);
        return false;
      }
      
      // Check if transition is allowed from current state
      const currentStateObj = this.states[this.currentState];
      if (currentStateObj.allowedTransitions && 
          !currentStateObj.allowedTransitions.includes(newState)) {
        console.error(`Transition from ${this.currentState} to ${newState} is not allowed`);
        return false;
      }
      
      // Add to history
      this.history.push({
        from: this.currentState,
        to: newState,
        timestamp: Date.now(),
        data
      });
      
      // Run exit action for current state if defined
      if (currentStateObj.onExit) {
        currentStateObj.onExit(this.context, data);
      }
      
      // Update current state
      const previousState = this.currentState;
      this.currentState = newState;
      
      // Run entry action for new state if defined
      const newStateObj = this.states[newState];
      if (newStateObj.onEntry) {
        newStateObj.onEntry(this.context, data, previousState);
      }
      
      return true;
    }
    
    /**
     * Update the state machine
     * @param {number} [deltaTime=0] - Time since last update
     * @returns {boolean} True if state changed
     */
    update(deltaTime = 0) {
      const stateObj = this.states[this.currentState];
      
      // Run update action if defined
      if (stateObj.onUpdate) {
        const nextState = stateObj.onUpdate(this.context, deltaTime);
        
        // If update returns a new state, transition to it
        if (nextState && nextState !== this.currentState) {
          return this.transition(nextState);
        }
      }
      
      return false;
    }
    
    /**
     * Get the current state
     * @returns {string} Current state
     */
    getState() {
      return this.currentState;
    }
    
    /**
     * Check if in a specific state
     * @param {string} state - State to check
     * @returns {boolean} True if in the specified state
     */
    isInState(state) {
      return this.currentState === state;
    }
    
    /**
     * Get the state history
     * @param {number} [limit] - Maximum number of history items
     * @returns {Array} State transition history
     */
    getHistory(limit) {
      if (limit) {
        return this.history.slice(-limit);
      }
      return [...this.history];
    }
    
    /**
     * Get time spent in current state
     * @returns {number} Milliseconds in current state
     */
    getTimeInState() {
      if (this.history.length === 0) {
        return 0;
      }
      
      // Find the most recent transition to the current state
      for (let i = this.history.length - 1; i >= 0; i--) {
        const transition = this.history[i];
        if (transition.to === this.currentState) {
          return Date.now() - transition.timestamp;
        }
      }
      
      return 0;
    }
    
    /**
     * Reset the state machine to initial state
     * @param {string} [initialState] - Optional new initial state
     */
    reset(initialState) {
      // If new initial state provided, validate it
      if (initialState && !this.states[initialState]) {
        throw new Error(`Invalid initial state: ${initialState}`);
      }
      
      // Reset to initial state
      this.currentState = initialState || this.initialState;
      this.history = [];
    }
    
    /**
     * Update the context
     * @param {Object} updates - Context updates
     */
    updateContext(updates) {
      this.context = {
        ...this.context,
        ...updates
      };
    }
    
    /**
     * Get allowed transitions from current state
     * @returns {Array<string>} Allowed transition states
     */
    getAllowedTransitions() {
      const currentStateObj = this.states[this.currentState];
      return currentStateObj.allowedTransitions || [];
    }
    
    /**
     * Check if a transition is possible
     * @param {string} state - Target state
     * @returns {boolean} True if transition is allowed
     */
    canTransitionTo(state) {
      if (!this.states[state]) {
        return false;
      }
      
      const currentStateObj = this.states[this.currentState];
      
      if (!currentStateObj.allowedTransitions) {
        return true; // No restrictions
      }
      
      return currentStateObj.allowedTransitions.includes(state);
    }
    
    /**
     * Get the context value
     * @param {string} [key] - Optional context key
     * @returns {any} Context value or entire context object
     */
    getContext(key) {
      if (key === undefined) {
        return { ...this.context };
      }
      
      return this.context[key];
    }
    
    /**
     * Create a serializable representation of the state machine
     * @returns {Object} Serializable state
     */
    serialize() {
      return {
        currentState: this.currentState,
        initialState: this.initialState,
        context: JSON.parse(JSON.stringify(this.context)),
        history: this.history
      };
    }
    
    /**
     * Restore state machine from serialized data
     * @param {Object} data - Serialized state machine data
     * @returns {boolean} Success status
     */
    deserialize(data) {
      if (!data || !data.currentState || !this.states[data.currentState]) {
        return false;
      }
      
      this.currentState = data.currentState;
      this.initialState = data.initialState || this.initialState;
      this.context = data.context || {};
      this.history = data.history || [];
      
      return true;
    }
    
    /**
     * Force a state without triggering transitions
     * @param {string} state - State to force
     * @returns {boolean} Success status
     */
    forceState(state) {
      if (!this.states[state]) {
        console.error(`Cannot force invalid state: ${state}`);
        return false;
      }
      
      this.currentState = state;
      
      // Add to history without running hooks
      this.history.push({
        from: null,
        to: state,
        timestamp: Date.now(),
        data: { forced: true }
      });
      
      return true;
    }
    
    /**
     * Find how long ago a specific state was active
     * @param {string} state - State to check
     * @returns {number} Milliseconds since state was active (or Infinity)
     */
    timeSinceState(state) {
      for (let i = this.history.length - 1; i >= 0; i--) {
        const transition = this.history[i];
        if (transition.from === state) {
          return Date.now() - transition.timestamp;
        }
      }
      
      return Infinity;
    }
    
    /**
     * Check if a state has ever been active
     * @param {string} state - State to check
     * @returns {boolean} True if state has been active
     */
    hasBeenInState(state) {
      return this.history.some(transition => 
        transition.from === state || transition.to === state
      );
    }
  }
  
  module.exports = StateMachine;