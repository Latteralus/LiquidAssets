// Notification Manager - Handles game notifications and feedback

class NotificationManager {
    constructor(game) {
      this.game = game;
      this.notifications = [];
      this.containerElement = null;
      this.maxNotifications = 100; // Max number of notifications to store
      this.categories = {
        INFO: { name: 'info', icon: 'ℹ️', color: '#5cb3fd' },
        SUCCESS: { name: 'success', icon: '✅', color: '#5cb85c' },
        WARNING: { name: 'warning', icon: '⚠️', color: '#f0ad4e' },
        ERROR: { name: 'error', icon: '❌', color: '#d9534f' },
        EVENT: { name: 'event', icon: '🔔', color: '#6f42c1' },
        FINANCIAL: { name: 'financial', icon: '💰', color: '#17a2b8' },
        CUSTOMER: { name: 'customer', icon: '👥', color: '#20c997' },
        STAFF: { name: 'staff', icon: '👤', color: '#fd7e14' },
        SYSTEM: { name: 'system', icon: '🖥️', color: '#adb5bd' }
      };
      this.filters = Object.keys(this.categories).reduce((obj, key) => {
        obj[key] = true; // All categories enabled by default
        return obj;
      }, {});
      this.relatedNotifications = new Map(); // Track relationships between notifications
    }
  
    initialize(containerId) {
      this.containerElement = document.getElementById(containerId);
      if (!this.containerElement) {
        console.error('Notification container not found:', containerId);
        return false;
      }
      
      // Add filter buttons above the container
      this.createFilterButtons();
      
      // Add notification panel controls
      this.addNotificationControls();
      
      return true;
    }
  
    createFilterButtons() {
      const filterContainer = document.createElement('div');
      filterContainer.className = 'notification-filters';
      
      Object.keys(this.categories).forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn active';
        btn.dataset.category = category;
        btn.innerHTML = `${this.categories[category].icon}`;
        btn.title = `Toggle ${this.categories[category].name} notifications`;
        
        btn.addEventListener('click', () => {
          this.filters[category] = !this.filters[category];
          btn.classList.toggle('active');
          this.updateVisibleNotifications();
        });
        
        filterContainer.appendChild(btn);
      });
      
      // Add clear button
      const clearBtn = document.createElement('button');
      clearBtn.className = 'filter-btn clear-btn';
      clearBtn.innerHTML = '🗑️';
      clearBtn.title = 'Clear all notifications';
      clearBtn.addEventListener('click', () => this.clearNotifications());
      filterContainer.appendChild(clearBtn);
      
      // Insert before the notification container
      this.containerElement.parentNode.insertBefore(filterContainer, this.containerElement);
    }
    
    addNotificationControls() {
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'notification-controls';
      
      // Add search box
      const searchContainer = document.createElement('div');
      searchContainer.className = 'notification-search';
      
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search notifications...';
      searchInput.className = 'notification-search-input';
      
      searchInput.addEventListener('input', (e) => {
        this.filterNotificationsBySearch(e.target.value);
      });
      
      searchContainer.appendChild(searchInput);
      
      // Group related toggle
      const groupToggleContainer = document.createElement('div');
      groupToggleContainer.className = 'notification-group-toggle';
      
      const groupLabel = document.createElement('label');
      groupLabel.htmlFor = 'group-related';
      groupLabel.textContent = 'Group related';
      
      const groupCheckbox = document.createElement('input');
      groupCheckbox.type = 'checkbox';
      groupCheckbox.id = 'group-related';
      groupCheckbox.checked = true;
      
      groupCheckbox.addEventListener('change', (e) => {
        this.setGroupRelated(e.target.checked);
      });
      
      groupToggleContainer.appendChild(groupCheckbox);
      groupToggleContainer.appendChild(groupLabel);
      
      // Add elements to controls container
      controlsContainer.appendChild(searchContainer);
      controlsContainer.appendChild(groupToggleContainer);
      
      // Insert after filter buttons
      const filterContainer = document.querySelector('.notification-filters');
      if (filterContainer) {
        filterContainer.parentNode.insertBefore(controlsContainer, filterContainer.nextSibling);
      } else {
        this.containerElement.parentNode.insertBefore(controlsContainer, this.containerElement);
      }
    }
  
    addNotification(message, category = 'INFO', metadata = {}) {
      if (!message || typeof message !== 'string') {
        console.error('Invalid notification message:', message);
        return false;
      }
      
      // Validate and normalize category
      category = category.toUpperCase();
      if (!this.categories[category]) {
        console.warn(`Unknown notification category: ${category}, defaulting to INFO`);
        category = 'INFO';
      }
      
      const notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        message,
        category,
        timestamp: new Date(),
        metadata: { ...metadata }
      };
      
      // Track relationships between notifications
      if (metadata.relatedTo) {
        if (!this.relatedNotifications.has(metadata.relatedTo)) {
          this.relatedNotifications.set(metadata.relatedTo, []);
        }
        this.relatedNotifications.get(metadata.relatedTo).push(notification.id);
        
        // Add the relationship to the notification itself for easier access
        notification.metadata.parentNotificationId = metadata.relatedTo;
      }
      
      // Add to notifications array
      this.notifications.unshift(notification);
      
      // Trim if exceeding max notifications
      if (this.notifications.length > this.maxNotifications) {
        this.notifications.pop();
      }
      
      // Update UI
      this.renderNotification(notification);
      
      // Also log to console for debugging/development
      console.log(`[${category}] ${message}`, metadata);
      
      return notification.id;
    }
  
    renderNotification(notification) {
      if (!this.containerElement) return;
      
      const { category, message, timestamp, id, metadata } = notification;
      const categoryInfo = this.categories[category];
      
      // Create notification element
      const element = document.createElement('div');
      element.className = `notification ${categoryInfo.name}`;
      element.dataset.id = id;
      element.dataset.category = category;
      
      // Add parent relation if exists
      if (metadata.parentNotificationId) {
        element.dataset.parentId = metadata.parentNotificationId;
      }
      
      // Add search terms to dataset for easier filtering
      if (metadata.searchTerms) {
        element.dataset.searchTerms = metadata.searchTerms;
      }
      
      // Add additional classes based on metadata
      if (metadata.important) {
        element.classList.add('important');
      }
      
      // Show/hide based on current filters
      if (!this.filters[category]) {
        element.style.display = 'none';
      }
      
      // Format timestamp
      const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Build notification content
      element.innerHTML = `
        <span class="notification-icon">${categoryInfo.icon}</span>
        <span class="notification-time">${time}</span>
        <span class="notification-message">${this.formatMessage(message, metadata)}</span>
        <button class="notification-dismiss" title="Dismiss">×</button>
      `;
      
      // Add expand button if notification has related items
      if (this.relatedNotifications.has(id) && this.relatedNotifications.get(id).length > 0) {
        const expandBtn = document.createElement('button');
        expandBtn.className = 'notification-expand';
        expandBtn.title = 'Show related notifications';
        expandBtn.innerHTML = '▼';
        expandBtn.addEventListener('click', () => {
          this.toggleRelatedNotifications(id);
        });
        
        // Insert after the message
        const messageEl = element.querySelector('.notification-message');
        messageEl.parentNode.insertBefore(expandBtn, messageEl.nextSibling);
      }
      
      // Add dismiss functionality
      const dismissBtn = element.querySelector('.notification-dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dismissNotification(id);
        });
      }
      
      // Add click handler to show details
      element.addEventListener('click', () => {
        this.showNotificationDetails(notification);
      });
      
      // Apply animation
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';
      
      // Add to container
      if (metadata.parentNotificationId) {
        // Add as a related notification
        const parentElement = this.containerElement.querySelector(`.notification[data-id="${metadata.parentNotificationId}"]`);
        
        if (parentElement) {
          // Check for or create related container
          let relatedContainer = this.containerElement.querySelector(`.related-notifications[data-parent="${metadata.parentNotificationId}"]`);
          
          if (!relatedContainer) {
            relatedContainer = document.createElement('div');
            relatedContainer.className = 'related-notifications';
            relatedContainer.dataset.parent = metadata.parentNotificationId;
            relatedContainer.style.display = 'none'; // Hidden by default
            
            // Insert after parent
            parentElement.parentNode.insertBefore(relatedContainer, parentElement.nextSibling);
          }
          
          relatedContainer.appendChild(element);
        } else {
          // Parent not found, add to main container
          if (this.containerElement.firstChild) {
            this.containerElement.insertBefore(element, this.containerElement.firstChild);
          } else {
            this.containerElement.appendChild(element);
          }
        }
      } else {
        // Regular notification, add to top
        if (this.containerElement.firstChild) {
          this.containerElement.insertBefore(element, this.containerElement.firstChild);
        } else {
          this.containerElement.appendChild(element);
        }
      }
      
      // Trigger animation
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 10);
      
      // Auto-scroll to ensure the latest notification is visible
      if (!metadata.parentNotificationId) {
        this.containerElement.scrollTop = 0;
      }
    }
    
    formatMessage(message, metadata) {
      // Basic formatting to highlight important information
      let formattedMessage = message;
      
      // Highlight currency values
      formattedMessage = formattedMessage.replace(/(€\d+(\.\d+)?)/g, '<span class="highlight-money">$1</span>');
      
      // Add venue name if available but not already in message
      if (metadata.venueName && !message.includes(metadata.venueName)) {
        formattedMessage = `<span class="venue-name">${metadata.venueName}</span>: ${formattedMessage}`;
      }
      
      return formattedMessage;
    }
    
    toggleRelatedNotifications(parentId) {
      const relatedContainer = this.containerElement.querySelector(`.related-notifications[data-parent="${parentId}"]`);
      const expandBtn = this.containerElement.querySelector(`.notification[data-id="${parentId}"] .notification-expand`);
      
      if (relatedContainer) {
        const isVisible = relatedContainer.style.display !== 'none';
        
        // Toggle visibility
        relatedContainer.style.display = isVisible ? 'none' : 'block';
        
        // Update expand button
        if (expandBtn) {
          expandBtn.innerHTML = isVisible ? '▼' : '▲';
          expandBtn.title = isVisible ? 'Show related notifications' : 'Hide related notifications';
        }
      }
    }
    
    showNotificationDetails(notification) {
      // Create or update the details panel
      let detailsPanel = document.getElementById('notification-details');
      
      if (!detailsPanel) {
        detailsPanel = document.createElement('div');
        detailsPanel.id = 'notification-details';
        detailsPanel.className = 'notification-details-panel';
        document.body.appendChild(detailsPanel);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'details-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => {
          detailsPanel.classList.remove('visible');
        });
        detailsPanel.appendChild(closeBtn);
      }
      
      // Format the details content
      const { message, category, timestamp, metadata } = notification;
      const categoryInfo = this.categories[category];
      
      let content = `
        <div class="details-header ${categoryInfo.name}">
          <span class="details-icon">${categoryInfo.icon}</span>
          <span class="details-category">${categoryInfo.name.toUpperCase()}</span>
          <span class="details-time">${timestamp.toLocaleString()}</span>
        </div>
        <div class="details-message">${message}</div>
      `;
      
      // Add metadata if available
      if (Object.keys(metadata).length > 0) {
        content += '<div class="details-metadata">';
        
        // Skip certain internal metadata fields
        const skipFields = ['relatedTo', 'parentNotificationId', 'searchTerms'];
        
        Object.entries(metadata)
          .filter(([key]) => !skipFields.includes(key))
          .forEach(([key, value]) => {
            if (key === 'amount' && typeof value === 'number') {
              content += `<div class="metadata-item"><span class="metadata-key">${this.formatMetadataKey(key)}</span>: <span class="metadata-value money">€${value.toFixed(2)}</span></div>`;
            } else {
              content += `<div class="metadata-item"><span class="metadata-key">${this.formatMetadataKey(key)}</span>: <span class="metadata-value">${value}</span></div>`;
            }
          });
        
        content += '</div>';
      }
      
      // Add related notifications if any
      if (this.relatedNotifications.has(notification.id)) {
        const relatedIds = this.relatedNotifications.get(notification.id);
        if (relatedIds.length > 0) {
          content += '<div class="details-related"><h4>Related Events</h4><ul>';
          
          relatedIds.forEach(id => {
            const related = this.notifications.find(n => n.id === id);
            if (related) {
              content += `<li class="${this.categories[related.category].name}">
                <span class="related-icon">${this.categories[related.category].icon}</span>
                <span class="related-time">${related.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span class="related-message">${related.message}</span>
              </li>`;
            }
          });
          
          content += '</ul></div>';
        }
      }
      
      // Update panel content
      detailsPanel.innerHTML = detailsPanel.innerHTML.split('<div class="details-content">')[0]; // Keep close button
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'details-content';
      contentDiv.innerHTML = content;
      detailsPanel.appendChild(contentDiv);
      
      // Show the panel
      detailsPanel.classList.add('visible');
    }
    
    formatMetadataKey(key) {
      // Convert camelCase or snake_case to Title Case with spaces
      return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    }
  
    dismissNotification(id) {
      // First, check if this notification has related ones
      if (this.relatedNotifications.has(id)) {
        // Get all related notification IDs
        const relatedIds = this.relatedNotifications.get(id);
        
        // Dismiss all related notifications first
        relatedIds.forEach(relatedId => {
          this.dismissSingleNotification(relatedId);
        });
        
        // Clear the related map entry
        this.relatedNotifications.delete(id);
      }
      
      // Then dismiss this notification
      this.dismissSingleNotification(id);
      
      // If this notification is related to another one, remove it from that relationship
      for (const [parentId, childIds] of this.relatedNotifications.entries()) {
        const index = childIds.indexOf(id);
        if (index !== -1) {
          childIds.splice(index, 1);
          
          // If no more related notifications, clean up
          if (childIds.length === 0) {
            this.relatedNotifications.delete(parentId);
            
            // Update parent notification UI to remove expand button
            const parentElement = this.containerElement.querySelector(`.notification[data-id="${parentId}"] .notification-expand`);
            if (parentElement) {
              parentElement.remove();
            }
          }
        }
      }
    }
    
    dismissSingleNotification(id) {
      // Remove from DOM
      const element = this.containerElement.querySelector(`.notification[data-id="${id}"]`);
      if (element) {
        // Animate out
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
          if (element.parentNode) {
            // Also remove related container if this is a parent
            const relatedContainer = this.containerElement.querySelector(`.related-notifications[data-parent="${id}"]`);
            if (relatedContainer) {
              relatedContainer.remove();
            }
            
            element.parentNode.removeChild(element);
          }
        }, 300); // Match the CSS transition duration
      }
      
      // Remove from array
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    }
  
    clearNotifications() {
      // Clear DOM
      if (this.containerElement) {
        // Animate all notifications out
        const elements = this.containerElement.querySelectorAll('.notification');
        elements.forEach((el, index) => {
          setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(100%)';
          }, index * 50); // Stagger the animations
        });
        
        // Remove related containers
        const relatedContainers = this.containerElement.querySelectorAll('.related-notifications');
        relatedContainers.forEach(container => {
          container.remove();
        });
        
        // Remove after animations
        setTimeout(() => {
          while (this.containerElement.firstChild) {
            this.containerElement.removeChild(this.containerElement.firstChild);
          }
        }, elements.length * 50 + 300);
      }
      
      // Clear arrays and maps
      this.notifications = [];
      this.relatedNotifications.clear();
    }
  
    updateVisibleNotifications() {
      if (!this.containerElement) return;
      
      const elements = this.containerElement.querySelectorAll('.notification');
      elements.forEach(el => {
        const category = el.dataset.category;
        if (this.filters[category]) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
          
          // Also hide related container if this is a parent
          const relatedContainer = this.containerElement.querySelector(`.related-notifications[data-parent="${el.dataset.id}"]`);
          if (relatedContainer) {
            relatedContainer.style.display = 'none';
          }
        }
      });
    }
    
    filterNotificationsBySearch(query) {
      if (!this.containerElement || !query) {
        // If no query, show all (respecting category filters)
        this.updateVisibleNotifications();
        return;
      }
      
      const elements = this.containerElement.querySelectorAll('.notification');
      const lowerQuery = query.toLowerCase();
      
      elements.forEach(el => {
        const category = el.dataset.category;
        const message = el.querySelector('.notification-message').textContent.toLowerCase();
        const searchTerms = el.dataset.searchTerms ? el.dataset.searchTerms.toLowerCase() : '';
        
        // Show if category is not filtered out AND (message or search terms match)
        const shouldShow = this.filters[category] && 
                           (message.includes(lowerQuery) || searchTerms.includes(lowerQuery));
        
        el.style.display = shouldShow ? '' : 'none';
        
        // For parent notifications, also update related containers
        const relatedContainer = this.containerElement.querySelector(`.related-notifications[data-parent="${el.dataset.id}"]`);
        if (relatedContainer) {
          relatedContainer.style.display = shouldShow && relatedContainer.style.display !== 'none' ? '' : 'none';
        }
      });
    }
    
    setGroupRelated(shouldGroup) {
      // Update all related notification containers
      const relatedContainers = this.containerElement.querySelectorAll('.related-notifications');
      
      if (shouldGroup) {
        // Group mode - keep related notifications in their containers
        relatedContainers.forEach(container => {
          const isExpanded = container.style.display !== 'none';
          
          // If not expanded, hide it
          if (!isExpanded) {
            container.style.display = 'none';
          }
        });
      } else {
        // Flat mode - move all related notifications to main container
        relatedContainers.forEach(container => {
          const parentId = container.dataset.parent;
          const childNodes = Array.from(container.querySelectorAll('.notification'));
          
          // Move children to main container, right after their parent
          const parentElement = this.containerElement.querySelector(`.notification[data-id="${parentId}"]`);
          
          if (parentElement) {
            childNodes.forEach(child => {
              this.containerElement.insertBefore(child, parentElement.nextSibling);
            });
          } else {
            // If parent not found, add to the top
            childNodes.forEach(child => {
              if (this.containerElement.firstChild) {
                this.containerElement.insertBefore(child, this.containerElement.firstChild);
              } else {
                this.containerElement.appendChild(child);
              }
            });
          }
          
          // Remove the now-empty container
          container.remove();
        });
        
        // Hide all expand buttons
        const expandButtons = this.containerElement.querySelectorAll('.notification-expand');
        expandButtons.forEach(btn => {
          btn.style.display = 'none';
        });
      }
    }
  
    // Convenience methods for different notification types
    info(message, metadata = {}) {
      return this.addNotification(message, 'INFO', metadata);
    }
    
    success(message, metadata = {}) {
      return this.addNotification(message, 'SUCCESS', metadata);
    }
    
    warning(message, metadata = {}) {
      return this.addNotification(message, 'WARNING', metadata);
    }
    
    error(message, metadata = {}) {
      return this.addNotification(message, 'ERROR', metadata);
    }
    
    event(message, metadata = {}) {
      return this.addNotification(message, 'EVENT', metadata);
    }
    
    financial(message, metadata = {}) {
      return this.addNotification(message, 'FINANCIAL', metadata);
    }
    
    customer(message, metadata = {}) {
      return this.addNotification(message, 'CUSTOMER', metadata);
    }
    
    staff(message, metadata = {}) {
      return this.addNotification(message, 'STAFF', metadata);
    }
    
    system(message, metadata = {}) {
      return this.addNotification(message, 'SYSTEM', metadata);
    }
    
    // Get notifications filtered by category
    getNotificationsByCategory(category) {
      return this.notifications.filter(n => n.category === category.toUpperCase());
    }
    
    // Get recent notifications
    getRecentNotifications(count = 10) {
      return this.notifications.slice(0, count);
    }
    
    // Search notifications
    searchNotifications(query) {
      if (!query || typeof query !== 'string') return [];
      
      const lowerQuery = query.toLowerCase();
      return this.notifications.filter(n => 
        n.message.toLowerCase().includes(lowerQuery) ||
        (n.metadata && JSON.stringify(n.metadata).toLowerCase().includes(lowerQuery))
      );
    }
    
    // Export notifications to file
    exportNotifications() {
      try {
        const data = JSON.stringify(this.notifications, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `notifications-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
      } catch (error) {
        console.error('Error exporting notifications:', error);
        return false;
      }
    }
  }
  
  module.exports = NotificationManager;