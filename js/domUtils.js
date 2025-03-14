// js/utils/domUtils.js
/**
 * Centralized DOM manipulation utilities.
 */

/**
 * Create an element with properties
 * @param {string} tag - Element tag name
 * @param {Object} [props={}] - Element properties
 * @param {Array|Node} [children=[]] - Child elements
 * @returns {HTMLElement} Created element
 */
function createElement(tag, props = {}, children = []) {
    const element = document.createElement(tag);
    
    // Add properties
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.entries(value).forEach(([styleKey, styleValue]) => {
          element.style[styleKey] = styleValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element[key] = value;
      }
    });
    
    // Add children
    if (Array.isArray(children)) {
      children.forEach(child => appendChild(element, child));
    } else {
      appendChild(element, children);
    }
    
    return element;
  }
  
  /**
   * Append a child to an element
   * @param {HTMLElement} parent - Parent element
   * @param {Node|string} child - Child element or text
   */
  function appendChild(parent, child) {
    if (child === null || child === undefined) {
      return;
    }
    
    if (typeof child === 'string' || typeof child === 'number') {
      parent.appendChild(document.createTextNode(child));
    } else {
      parent.appendChild(child);
    }
  }
  
  /**
   * Clear element contents
   * @param {HTMLElement} element - Element to clear
   */
  function clearElement(element) {
    if (!element || typeof element.firstChild === 'undefined') {
      console.error('clearElement received an invalid element:', element);
      return;
    }
    
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  
  /**
   * Create a text element
   * @param {string} tag - Element tag name
   * @param {string} text - Text content
   * @param {string} [className] - CSS class name
   * @returns {HTMLElement} Created element
   */
  function createTextElement(tag, text, className) {
    if (typeof tag !== 'string' || tag.trim() === '') {
      console.error('createTextElement received an invalid tag:', tag);
      tag = 'div'; // Default fallback
    }
    
    try {
      const element = document.createElement(tag);
      element.textContent = text !== null && text !== undefined ? text : '';
      
      if (className) {
        element.className = className;
      }
      
      return element;
    } catch (error) {
      console.error('Error creating element:', error);
      return null;
    }
  }
  
  /**
   * Create a button element
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   * @param {string} [className] - CSS class name
   * @returns {HTMLButtonElement} Created button
   */
  function createButton(text, onClick, className) {
    return createElement('button', {
      textContent: text,
      className,
      onClick
    });
  }
  
  /**
   * Show an element
   * @param {HTMLElement} element - Element to show
   * @param {string} [displayValue='block'] - Display value
   */
  function showElement(element, displayValue = 'block') {
    if (element) {
      element.style.display = displayValue;
    }
  }
  
  /**
   * Hide an element
   * @param {HTMLElement} element - Element to hide
   */
  function hideElement(element) {
    if (element) {
      element.style.display = 'none';
    }
  }
  
  /**
   * Toggle element visibility
   * @param {HTMLElement} element - Element to toggle
   * @param {boolean} [show] - Force show/hide
   * @param {string} [displayValue='block'] - Display value when showing
   */
  function toggleElement(element, show, displayValue = 'block') {
    if (!element) return;
    
    if (show === undefined) {
      // Toggle based on current state
      element.style.display = element.style.display === 'none' ? displayValue : 'none';
    } else {
      // Force state
      element.style.display = show ? displayValue : 'none';
    }
  }
  
  /**
   * Add/remove a class conditionally
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class to toggle
   * @param {boolean} condition - When true, add class; when false, remove it
   */
  function setClassIf(element, className, condition) {
    if (!element) return;
    
    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }
  
  /**
   * Set multiple CSS styles
   * @param {HTMLElement} element - Target element
   * @param {Object} styles - Object with style properties
   */
  function setStyles(element, styles) {
    if (!element || !styles) return;
    
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value;
    });
  }
  
  /**
   * Find element by selector or return null
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null} Found element or null
   */
  function findElement(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.error(`Error finding element with selector "${selector}":`, error);
      return null;
    }
  }
  
  /**
   * Find all elements by selector
   * @param {string} selector - CSS selector
   * @returns {Array<HTMLElement>} Array of found elements
   */
  function findElements(selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (error) {
      console.error(`Error finding elements with selector "${selector}":`, error);
      return [];
    }
  }
  
  /**
   * Create a select/dropdown element
   * @param {Array<Object>} options - Options array with value and text properties
   * @param {Function} onChange - Change handler
   * @param {string} [selectedValue] - Initially selected value
   * @param {string} [className] - CSS class name
   * @returns {HTMLSelectElement} Created select element
   */
  function createSelect(options, onChange, selectedValue, className) {
    const select = createElement('select', {
      className,
      onChange: (e) => onChange(e.target.value, e)
    });
    
    options.forEach(opt => {
      const option = createElement('option', {
        value: opt.value,
        textContent: opt.text,
        selected: selectedValue !== undefined && opt.value === selectedValue
      });
      
      select.appendChild(option);
    });
    
    return select;
  }
  
  /**
   * Create a simple form
   * @param {Array<Object>} fields - Form fields configuration
   * @param {Function} onSubmit - Submit handler
   * @param {string} [submitText='Submit'] - Submit button text
   * @param {string} [className] - CSS class name
   * @returns {HTMLFormElement} Created form element
   */
  function createForm(fields, onSubmit, submitText = 'Submit', className) {
    const form = createElement('form', {
      className,
      onSubmit: (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {};
        fields.forEach(field => {
          if (field.id) {
            const element = form.querySelector(`#${field.id}`);
            if (element) {
              formData[field.name || field.id] = element.value;
            }
          }
        });
        
        onSubmit(formData, e);
      }
    });
    
    // Create form fields
    fields.forEach(field => {
      const fieldContainer = createElement('div', {
        className: 'form-group'
      });
      
      // Add label if specified
      if (field.label) {
        const label = createElement('label', {
          htmlFor: field.id,
          textContent: field.label
        });
        
        fieldContainer.appendChild(label);
      }
      
      // Create the input element based on type
      let inputElement;
      
      switch (field.type) {
        case 'select':
          inputElement = createSelect(
            field.options || [],
            () => {}, // Change handler will be on the form submit
            field.value,
            field.className
          );
          break;
          
        case 'textarea':
          inputElement = createElement('textarea', {
            id: field.id,
            name: field.name || field.id,
            placeholder: field.placeholder || '',
            value: field.value || '',
            className: field.className || '',
            required: field.required || false,
            rows: field.rows || 3,
            cols: field.cols || 30
          });
          break;
          
        case 'checkbox':
          inputElement = createElement('input', {
            type: 'checkbox',
            id: field.id,
            name: field.name || field.id,
            checked: field.checked || false,
            className: field.className || '',
            required: field.required || false
          });
          break;
          
        case 'radio':
          // Radio buttons need a container
          inputElement = createElement('div', {
            className: 'radio-group'
          });
          
          (field.options || []).forEach(option => {
            const radioContainer = createElement('div', {
              className: 'radio-option'
            });
            
            const radioInput = createElement('input', {
              type: 'radio',
              id: `${field.id}_${option.value}`,
              name: field.name || field.id,
              value: option.value,
              checked: field.value === option.value,
              required: field.required || false
            });
            
            const radioLabel = createElement('label', {
              htmlFor: `${field.id}_${option.value}`,
              textContent: option.text
            });
            
            radioContainer.appendChild(radioInput);
            radioContainer.appendChild(radioLabel);
            inputElement.appendChild(radioContainer);
          });
          break;
          
        default: // Default to text input
          inputElement = createElement('input', {
            type: field.type || 'text',
            id: field.id,
            name: field.name || field.id,
            placeholder: field.placeholder || '',
            value: field.value || '',
            className: field.className || '',
            required: field.required || false,
            min: field.min,
            max: field.max,
            step: field.step
          });
      }
      
      // Add the input element to the container
      fieldContainer.appendChild(inputElement);
      
      // Add help text if specified
      if (field.helpText) {
        const helpText = createElement('small', {
          className: 'help-text',
          textContent: field.helpText
        });
        
        fieldContainer.appendChild(helpText);
      }
      
      // Add the field to the form
      form.appendChild(fieldContainer);
    });
    
    // Add submit button
    const submitButton = createElement('button', {
      type: 'submit',
      textContent: submitText,
      className: 'submit-button'
    });
    
    form.appendChild(submitButton);
    
    return form;
  }
  
  /**
   * Create a progress bar
   * @param {number} value - Current value
   * @param {number} [max=100] - Maximum value
   * @param {string} [className] - CSS class name
   * @param {string} [color] - Bar color
   * @returns {HTMLElement} Progress bar element
   */
  function createProgressBar(value, max = 100, className, color) {
    const container = createElement('div', {
      className: `progress-bar-container ${className || ''}`
    });
    
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const bar = createElement('div', {
      className: 'progress-bar-fill',
      style: {
        width: `${percentage}%`,
        backgroundColor: color
      }
    });
    
    container.appendChild(bar);
    
    // Add value label if value is provided
    if (value !== undefined) {
      const label = createElement('span', {
        className: 'progress-bar-label',
        textContent: `${Math.round(percentage)}%`
      });
      
      container.appendChild(label);
    }
    
    return container;
  }
  
  /**
   * Create a tooltip for an element
   * @param {HTMLElement} element - Element to add tooltip to
   * @param {string} text - Tooltip text
   * @param {string} [position='top'] - Tooltip position (top, bottom, left, right)
   */
  function addTooltip(element, text, position = 'top') {
    if (!element) return;
    
    // Set data attributes
    element.setAttribute('data-tooltip', text);
    element.setAttribute('data-tooltip-position', position);
    element.classList.add('has-tooltip');
    
    // Add tooltip behavior
    element.addEventListener('mouseenter', () => {
      // Create tooltip element if it doesn't exist
      let tooltip = document.querySelector('.tooltip');
      if (!tooltip) {
        tooltip = createElement('div', {
          className: 'tooltip'
        });
        document.body.appendChild(tooltip);
      }
      
      // Set tooltip text
      tooltip.textContent = text;
      
      // Position tooltip
      const rect = element.getBoundingClientRect();
      
      switch (position) {
        case 'top':
          tooltip.style.bottom = `${window.innerHeight - rect.top + 5}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          tooltip.style.top = `${rect.bottom + 5}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = 'translateX(-50%)';
          break;
        case 'left':
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.right = `${window.innerWidth - rect.left + 5}px`;
          tooltip.style.transform = 'translateY(-50%)';
          break;
        case 'right':
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.left = `${rect.right + 5}px`;
          tooltip.style.transform = 'translateY(-50%)';
          break;
      }
      
      // Show tooltip
      tooltip.classList.add('visible');
    });
    
    element.addEventListener('mouseleave', () => {
      // Hide tooltip
      const tooltip = document.querySelector('.tooltip');
      if (tooltip) {
        tooltip.classList.remove('visible');
      }
    });
  }
  
  /**
   * Create a notification/toast element
   * @param {string} message - Notification message
   * @param {string} [type='info'] - Notification type (info, success, warning, error)
   * @param {number} [duration=3000] - Duration in milliseconds
   * @returns {HTMLElement} Notification element
   */
  function createNotification(message, type = 'info', duration = 3000) {
    // Create container if it doesn't exist
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = createElement('div', {
        className: 'notification-container'
      });
      document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = createElement('div', {
      className: `notification notification-${type}`,
      textContent: message
    });
    
    // Add close button
    const closeButton = createElement('button', {
      className: 'notification-close',
      textContent: '×',
      onClick: () => {
        notification.classList.add('hiding');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    });
    
    notification.appendChild(closeButton);
    
    // Add to container
    container.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
      notification.classList.add('hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
    
    return notification;
  }
  
  /**
   * Create a modal dialog
   * @param {string} title - Modal title
   * @param {HTMLElement|string} content - Modal content
   * @param {Function} [onClose] - Close handler
   * @param {Object} [options] - Additional options
   * @returns {HTMLElement} Modal element
   */
  function createModal(title, content, onClose, options = {}) {
    // Create overlay
    const overlay = createElement('div', {
      className: 'modal-overlay'
    });
    
    // Create modal
    const modal = createElement('div', {
      className: `modal ${options.className || ''}`
    });
    
    // Create header
    const header = createElement('div', {
      className: 'modal-header'
    });
    
    const titleElement = createElement('h3', {
      className: 'modal-title',
      textContent: title
    });
    
    const closeButton = createElement('button', {
      className: 'modal-close',
      textContent: '×',
      onClick: () => {
        closeModal();
        if (onClose) {
          onClose();
        }
      }
    });
    
    header.appendChild(titleElement);
    header.appendChild(closeButton);
    
    // Create body
    const body = createElement('div', {
      className: 'modal-body'
    });
    
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }
    
    // Create footer if needed
    let footer = null;
    if (options.buttons && options.buttons.length > 0) {
      footer = createElement('div', {
        className: 'modal-footer'
      });
      
      options.buttons.forEach(button => {
        const buttonElement = createElement('button', {
          className: `modal-button ${button.className || ''}`,
          textContent: button.text,
          onClick: () => {
            if (button.onClick) {
              button.onClick();
            }
            if (button.closeOnClick !== false) {
              closeModal();
            }
          }
        });
        
        footer.appendChild(buttonElement);
      });
    }
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    if (footer) {
      modal.appendChild(footer);
    }
    
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Prevent scrolling of the body
    document.body.style.overflow = 'hidden';
    
    // Close modal function
    function closeModal() {
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
      }, 300);
    }
    
    // Close on overlay click if specified
    if (options.closeOnOverlayClick !== false) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal();
          if (onClose) {
            onClose();
          }
        }
      });
    }
    
    // Close on escape key if specified
    if (options.closeOnEscape !== false) {
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          if (onClose) {
            onClose();
          }
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      
      document.addEventListener('keydown', escapeHandler);
    }
    
    // Return the modal with close method
    return {
      element: modal,
      close: closeModal
    };
  }
  
  /**
   * Create a confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Confirm handler
   * @param {Function} [onCancel] - Cancel handler
   * @param {Object} [options] - Additional options
   * @returns {HTMLElement} Modal element
   */
  function createConfirmDialog(message, onConfirm, onCancel, options = {}) {
    const content = createElement('p', {
      className: 'confirm-message',
      textContent: message
    });
    
    return createModal(
      options.title || 'Confirmation',
      content,
      onCancel,
      {
        className: 'confirm-dialog',
        closeOnOverlayClick: options.closeOnOverlayClick,
        closeOnEscape: options.closeOnEscape,
        buttons: [
          {
            text: options.cancelText || 'Cancel',
            className: 'cancel-button',
            onClick: onCancel
          },
          {
            text: options.confirmText || 'Confirm',
            className: 'confirm-button',
            onClick: onConfirm
          }
        ]
      }
    );
  }
  
  /**
   * Inject CSS styles into the document
   * @param {string} css - CSS styles
   * @param {string} [id] - Optional style element ID
   * @returns {HTMLStyleElement} Style element
   */
  function injectStyles(css, id) {
    // Check if styles with this ID already exist
    if (id) {
      const existingStyles = document.getElementById(id);
      if (existingStyles) {
        existingStyles.innerHTML = css;
        return existingStyles;
      }
    }
    
    // Create new style element
    const style = document.createElement('style');
    
    if (id) {
      style.id = id;
    }
    
    style.textContent = css;
    document.head.appendChild(style);
    
    return style;
  }
  
  module.exports = {
    createElement,
    appendChild,
    clearElement,
    createTextElement,
    createButton,
    showElement,
    hideElement,
    toggleElement,
    setClassIf,
    setStyles,
    findElement,
    findElements,
    createSelect,
    createForm,
    createProgressBar,
    addTooltip,
    createNotification,
    createModal,
    createConfirmDialog,
    injectStyles
  };