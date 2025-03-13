// Menu Components - UI components for the menu system

class MenuComponents {
    constructor(menuManager) {
      this.menuManager = menuManager;
    }
    
    createMenu(id, title) {
      const menu = document.createElement('div');
      menu.id = id;
      menu.className = 'menu';
      
      const menuTitle = document.createElement('h2');
      menuTitle.textContent = title;
      menu.appendChild(menuTitle);
      
      return menu;
    }
    
    createButton(id, text) {
      const button = document.createElement('button');
      button.id = id;
      button.textContent = text;
      button.addEventListener('click', () => this.menuManager.handleMenuAction(id));
      
      return button;
    }
    
    createToggle(id, label, initialValue) {
      const container = document.createElement('div');
      container.className = 'toggle-container';
      
      const labelElem = document.createElement('span');
      labelElem.textContent = label;
      labelElem.className = 'toggle-label';
      
      const toggle = document.createElement('input');
      toggle.id = id;
      toggle.type = 'checkbox';
      toggle.checked = initialValue;
      toggle.className = 'toggle-input';
      toggle.addEventListener('change', () => this.menuManager.handleMenuAction(id, toggle.checked));
      
      container.appendChild(labelElem);
      container.appendChild(toggle);
      
      return container;
    }
    
    createSlider(id, label, min, max, initialValue) {
      const container = document.createElement('div');
      container.className = 'slider-container';
      
      const labelElem = document.createElement('span');
      labelElem.textContent = label;
      labelElem.className = 'slider-label';
      
      const valueDisplay = document.createElement('span');
      valueDisplay.id = `${id}-value`;
      valueDisplay.textContent = initialValue;
      valueDisplay.className = 'slider-value';
      
      const slider = document.createElement('input');
      slider.id = id;
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.value = initialValue;
      slider.className = 'slider-input';
      
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
        this.menuManager.handleMenuAction(id, parseInt(slider.value));
      });
      
      container.appendChild(labelElem);
      container.appendChild(slider);
      container.appendChild(valueDisplay);
      
      return container;
    }
    
    createSelector(id, label, options, initialValue) {
      const container = document.createElement('div');
      container.className = 'selector-container';
      
      const labelElem = document.createElement('span');
      labelElem.textContent = label;
      labelElem.className = 'selector-label';
      
      const select = document.createElement('select');
      select.id = id;
      select.className = 'selector-input';
      
      options.forEach(option => {
        const optionElem = document.createElement('option');
        optionElem.value = option.toLowerCase();
        optionElem.textContent = option;
        if (option.toLowerCase() === initialValue.toLowerCase()) {
          optionElem.selected = true;
        }
        select.appendChild(optionElem);
      });
      
      select.addEventListener('change', () => this.menuManager.handleMenuAction(id, select.value));
      
      container.appendChild(labelElem);
      container.appendChild(select);
      
      return container;
    }
    
    createTabs(id, tabNames) {
      const tabContainer = document.createElement('div');
      tabContainer.id = id;
      tabContainer.className = 'tab-container';
      
      tabNames.forEach(tabName => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.textContent = tabName;
        tab.dataset.tab = tabName.toLowerCase();
        
        tab.addEventListener('click', () => this.menuManager.switchTab(id, tabName.toLowerCase()));
        
        tabContainer.appendChild(tab);
      });
      
      // Set first tab as active
      if (tabContainer.firstChild) {
        tabContainer.firstChild.classList.add('active');
      }
      
      return tabContainer;
    }
    
    // Content updaters for tabs
    updateInventoryContent(tab, venue) {
      const contentDiv = document.getElementById('inventory-content');
      if (!contentDiv) return;
      
      contentDiv.innerHTML = '';
      
      if (!venue) return;
      
      switch(tab) {
        case 'drinks':
          if (!venue.inventory || !venue.inventory.drinks) {
            contentDiv.textContent = 'No drinks in inventory.';
            return;
          }
          
          const drinkTable = document.createElement('table');
          drinkTable.className = 'inventory-table';
          
          // Header row
          const drinkHeader = document.createElement('tr');
          ['Name', 'Type', 'Stock', 'Cost', 'Sell Price', 'Profit', 'Actions'].forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            drinkHeader.appendChild(th);
          });
          drinkTable.appendChild(drinkHeader);
          
          // Add each drink
          venue.inventory.drinks.forEach(drink => {
            const row = document.createElement('tr');
            
            // Name
            const nameCell = document.createElement('td');
            nameCell.textContent = drink.name;
            row.appendChild(nameCell);
            
            // Type
            const typeCell = document.createElement('td');
            typeCell.textContent = drink.type;
            row.appendChild(typeCell);
            
            // Stock
            const stockCell = document.createElement('td');
            stockCell.textContent = drink.stock;
            row.appendChild(stockCell);
            
            // Cost
            const costCell = document.createElement('td');
            costCell.textContent = `€${drink.costPrice.toFixed(2)}`;
            row.appendChild(costCell);
            
            // Sell price
            const priceCell = document.createElement('td');
            priceCell.textContent = `€${drink.sellPrice.toFixed(2)}`;
            row.appendChild(priceCell);
            
            // Profit
            const profitCell = document.createElement('td');
            const profit = drink.sellPrice - drink.costPrice;
            const margin = (profit / drink.sellPrice) * 100;
            profitCell.textContent = `€${profit.toFixed(2)} (${margin.toFixed(0)}%)`;
            row.appendChild(profitCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            
            const orderButton = document.createElement('button');
            orderButton.textContent = 'Order';
            orderButton.className = 'small-button';
            orderButton.addEventListener('click', () => {
              this.menuManager.hideMenu();
              this.menuManager.game.processCommand(`order drinks "${drink.name}" 10`);
            });
            
            const priceButton = document.createElement('button');
            priceButton.textContent = 'Set Price';
            priceButton.className = 'small-button';
            priceButton.addEventListener('click', () => {
              const newPrice = prompt(`Enter new price for ${drink.name}:`, drink.sellPrice);
              if (newPrice !== null) {
                this.menuManager.hideMenu();
                this.menuManager.game.processCommand(`price drinks "${drink.name}" ${newPrice}`);
              }
            });
            
            actionsCell.appendChild(orderButton);
            actionsCell.appendChild(priceButton);
            row.appendChild(actionsCell);
            
            drinkTable.appendChild(row);
          });
          
          contentDiv.appendChild(drinkTable);
          break;
          
        // Other tab content handlers (food, equipment) are similar
        // but omitted for brevity. The MenuManager will implement these.
      }
    }
    
    updateFinancesContent(tab, reports) {
      const contentDiv = document.getElementById('finances-content');
      if (!contentDiv) return;
      
      contentDiv.innerHTML = '';
      
      if (!reports || reports.length === 0) {
        contentDiv.textContent = `No ${tab} reports available yet.`;
        return;
      }
      
      // Get most recent report
      const report = reports[0];
      
      // Create summary div
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'finances-summary';
      
      summaryDiv.innerHTML = `
        <h3>Summary for ${report.date}</h3>
        <p>Revenue: <span class="money positive">€${report.revenue.toFixed(2)}</span></p>
        <p>Expenses: <span class="money negative">€${report.expenses.toFixed(2)}</span></p>
        <p>Profit: <span class="money ${report.profit >= 0 ? 'positive' : 'negative'}">€${report.profit.toFixed(2)}</span></p>
        <p>Profit Margin: <span class="${report.profitMargin >= 0 ? 'positive' : 'negative'}">${report.profitMargin.toFixed(1)}%</span></p>
      `;
      
      // Create breakdown div
      const breakdownDiv = document.createElement('div');
      breakdownDiv.className = 'finances-breakdown';
      
      // Revenue breakdown
      const revenueDiv = document.createElement('div');
      revenueDiv.className = 'breakdown-section';
      revenueDiv.innerHTML = '<h4>Revenue Breakdown</h4>';
      
      const revenueList = document.createElement('ul');
      
      Object.entries(report.revenueBreakdown).forEach(([category, amount]) => {
        const item = document.createElement('li');
        item.textContent = `${category}: €${amount.toFixed(2)}`;
        revenueList.appendChild(item);
      });
      
      revenueDiv.appendChild(revenueList);
      breakdownDiv.appendChild(revenueDiv);
      
      // Expense breakdown
      const expenseDiv = document.createElement('div');
      expenseDiv.className = 'breakdown-section';
      expenseDiv.innerHTML = '<h4>Expense Breakdown</h4>';
      
      const expenseList = document.createElement('ul');
      
      Object.entries(report.expenseBreakdown).forEach(([category, amount]) => {
        const item = document.createElement('li');
        item.textContent = `${category}: €${amount.toFixed(2)}`;
        expenseList.appendChild(item);
      });
      
      expenseDiv.appendChild(expenseList);
      breakdownDiv.appendChild(expenseDiv);
      
      // Add to content div
      contentDiv.appendChild(summaryDiv);
      contentDiv.appendChild(breakdownDiv);
    }
  }
  
  module.exports = MenuComponents;