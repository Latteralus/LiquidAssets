// js/utils/performanceMonitor.js
/**
 * Performance monitoring utilities.
 */
class PerformanceMonitor {
    constructor() {
      this.metrics = {};
      this.markedTimes = {};
      this.enabled = process.env.NODE_ENV === 'development' || false;
    }
    
    /**
     * Enable or disable performance monitoring
     * @param {boolean} enabled - Whether monitoring is enabled
     */
    setEnabled(enabled) {
      this.enabled = enabled;
    }
    
    /**
     * Start timing a task
     * @param {string} taskName - Task identifier
     */
    start(taskName) {
      if (!this.enabled) return;
      
      this.markedTimes[taskName] = performance.now();
    }
    
    /**
     * End timing a task and record metrics
     * @param {string} taskName - Task identifier
     */
    end(taskName) {
      if (!this.enabled || !this.markedTimes[taskName]) return;
      
      const startTime = this.markedTimes[taskName];
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Initialize metrics if needed
      if (!this.metrics[taskName]) {
        this.metrics[taskName] = {
          count: 0,
          totalTime: 0,
          minTime: Number.MAX_SAFE_INTEGER,
          maxTime: 0,
          lastTime: 0
        };
      }
      
      // Update metrics
      const metric = this.metrics[taskName];
      metric.count++;
      metric.totalTime += duration;
      metric.minTime = Math.min(metric.minTime, duration);
      metric.maxTime = Math.max(metric.maxTime, duration);
      metric.lastTime = duration;
      
      // Clear the marked time
      delete this.markedTimes[taskName];
    }
    
    /**
     * Measure execution time of a function
     * @param {string} taskName - Task identifier
     * @param {Function} fn - Function to measure
     * @param {...any} args - Function arguments
     * @returns {any} Function result
     */
    measure(taskName, fn, ...args) {
      if (!this.enabled) {
        return fn(...args);
      }
      
      this.start(taskName);
      const result = fn(...args);
      this.end(taskName);
      
      return result;
    }
    
    /**
     * Measure execution time of an async function
     * @param {string} taskName - Task identifier
     * @param {Function} fn - Async function to measure
     * @param {...any} args - Function arguments
     * @returns {Promise<any>} Function result
     */
    async measureAsync(taskName, fn, ...args) {
      if (!this.enabled) {
        return await fn(...args);
      }
      
      this.start(taskName);
      const result = await fn(...args);
      this.end(taskName);
      
      return result;
    }
    
    /**
     * Get all metrics
     * @returns {Object} All collected metrics
     */
    getMetrics() {
      return { ...this.metrics };
    }
    
    /**
     * Get metrics for a specific task
     * @param {string} taskName - Task identifier
     * @returns {Object|null} Task metrics or null if not found
     */
    getTaskMetrics(taskName) {
      return this.metrics[taskName] || null;
    }
    
    /**
     * Get average execution time for a task
     * @param {string} taskName - Task identifier
     * @returns {number} Average execution time in ms
     */
    getAverageTime(taskName) {
      const metric = this.metrics[taskName];
      if (!metric || metric.count === 0) {
        return 0;
      }
      
      return metric.totalTime / metric.count;
    }
    
    /**
     * Reset all metrics
     */
    reset() {
      this.metrics = {};
      this.markedTimes = {};
    }
    
    /**
     * Reset metrics for a specific task
     * @param {string} taskName - Task identifier
     */
    resetTask(taskName) {
      delete this.metrics[taskName];
      delete this.markedTimes[taskName];
    }
    
    /**
     * Generate a performance report
     * @returns {string} Formatted report
     */
    generateReport() {
      if (!this.enabled) {
        return 'Performance monitoring is disabled';
      }
      
      let report = 'Performance Report:\n';
      report += '=================\n\n';
      
      const tasks = Object.keys(this.metrics).sort();
      
      if (tasks.length === 0) {
        return report + 'No metrics collected yet.';
      }
      
      tasks.forEach(taskName => {
        const metric = this.metrics[taskName];
        report += `Task: ${taskName}\n`;
        report += `  Count: ${metric.count}\n`;
        report += `  Total Time: ${metric.totalTime.toFixed(2)}ms\n`;
        report += `  Average Time: ${(metric.totalTime / metric.count).toFixed(2)}ms\n`;
        report += `  Min Time: ${metric.minTime.toFixed(2)}ms\n`;
        report += `  Max Time: ${metric.maxTime.toFixed(2)}ms\n`;
        report += `  Last Time: ${metric.lastTime.toFixed(2)}ms\n\n`;
      });
      
      return report;
    }
  }
  
  // Export singleton instance
  const performanceMonitor = new PerformanceMonitor();
  module.exports = performanceMonitor;