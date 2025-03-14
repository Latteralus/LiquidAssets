// js/database/dao/index.js
const VenueDAO = require('./venueDAO');
const StaffDAO = require('./staffDAO');
const CustomerDAO = require('./customerDAO');
const TransactionDAO = require('./transactionDAO');
const InventoryDAO = require('./inventoryDAO');
const SettingsDAO = require('./settingsDAO');

module.exports = {
  VenueDAO,
  StaffDAO,
  CustomerDAO,
  TransactionDAO,
  InventoryDAO,
  SettingsDAO
};