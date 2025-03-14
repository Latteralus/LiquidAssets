// js/utils/idGenerator.js
/**
 * Centralized ID generation utilities.
 */
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a UUID
 * @returns {string} UUID
 */
function generateUUID() {
  return uuidv4();
}

/**
 * Generate a timestamped ID
 * @param {string} [prefix=''] - Optional prefix
 * @returns {string} Timestamped ID
 */
function generateTimestampedId(prefix = '') {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `${prefix}${timestamp}_${randomSuffix}`;
}

/**
 * Generate a sequential ID with optional prefix
 * @param {string} [prefix=''] - Optional prefix
 * @param {number} [counter] - Counter value
 * @returns {string} Sequential ID
 */
function generateSequentialId(prefix = '', counter) {
  const paddedCounter = counter.toString().padStart(6, '0');
  return `${prefix}${paddedCounter}`;
}

/**
 * Generate entity-specific ID
 * @param {string} entityType - Type of entity (venue, staff, customer, etc.)
 * @returns {string} Entity-specific ID
 */
function generateEntityId(entityType) {
  const prefix = entityType.substring(0, 3).toLowerCase();
  return `${prefix}_${generateUUID()}`;
}

module.exports = {
  generateUUID,
  generateTimestampedId,
  generateSequentialId,
  generateEntityId
};