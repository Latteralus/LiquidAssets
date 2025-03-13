// CustomerSatisfaction - Handles customer happiness and patience levels

class CustomerSatisfaction {
  constructor(game) {
    this.game = game;
  }
  
  updateCustomerPatience(customer, index) {
    // Skip if the customer is leaving
    if (customer.status === 'leaving') return;
    
    // Get venue information for contextual patience calculation
    const venue = this.game.venueManager.getVenue(customer.venueId);
    if (!venue) return;
    
    // Base patience decrease rate varies by status
    let patienceDecreaseRate = 0;
    
    switch(customer.status) {
      case 'entering':
        // Waiting to be seated - patience decreases faster when venue is at high capacity
        const capacityFactor = this.calculateVenueCapacityFactor(venue);
        patienceDecreaseRate = 0.3 + (capacityFactor * 0.4); // 0.3 to 0.7 based on capacity
        break;
      case 'seated':
        // Just sitting at table - patience decreases slowly, but faster if no staff attention
        const hasAssignedStaff = !!customer.assignedStaff;
        patienceDecreaseRate = hasAssignedStaff ? 0.1 : 0.3;
        break;
      case 'ordering':
        // Waiting to order - patience decreases moderately
        // Adjusted by staff presence and customer type
        patienceDecreaseRate = 0.2;
        if (!customer.assignedStaff) patienceDecreaseRate += 0.2;
        break;
      case 'waiting':
        // Waiting for food/drinks - patience decreases more, affected by waiting time
        const timeWaiting = this.calculateWaitingTime(customer);
        // Non-linear increase in impatience the longer they wait
        patienceDecreaseRate = 0.2 + Math.min(0.5, timeWaiting / 30 * 0.5);
        break;
      case 'eating':
      case 'drinking':
        // Consuming order - patience decreases very slowly, influenced by food/drink quality
        patienceDecreaseRate = 0.05;
        // If food/drink preferences don't match, decrease patience slightly faster
        if (!this.checkPreferencesMatch(customer)) {
          patienceDecreaseRate += 0.1;
        }
        break;
      case 'paying':
        // Waiting to pay - patience decreases moderately
        patienceDecreaseRate = 0.2;
        // If they've been waiting to pay for a while, increase the rate
        const paymentTime = this.calculatePaymentWaitingTime(customer);
        if (paymentTime > 10) { // More than 10 minutes
          patienceDecreaseRate += Math.min(0.3, (paymentTime - 10) / 20 * 0.3);
        }
        break;
    }
    
    // Apply customer type modifier to patience decrease rate
    patienceDecreaseRate = this.applyCustomerTypeModifier(customer, patienceDecreaseRate);
    
    // Apply the patience decrease, adjusted by venue factors
    customer.patience -= this.applyVenueFactorsToPatience(patienceDecreaseRate, venue, customer);
    
    // If patience drops too low, customer leaves
    if (customer.patience <= 0) {
      this.customerLeavesDissatisfied(customer, index);
    }
  }
  
  calculateVenueCapacityFactor(venue) {
    // Calculate how full the venue is as a factor from 0 to 1
    const customerCount = this.game.customerManager ? 
                         this.game.customerManager.getCurrentCustomerCount() : 0;
    
    const capacityRatio = customerCount / (venue.settings.customerCapacity || 1);
    return Math.min(1, capacityRatio);
  }
  
  calculateWaitingTime(customer) {
    // Calculate minutes since order was placed
    if (!customer.orderTime || !this.game.timeManager) return 0;
    
    const currentTime = this.game.timeManager.getGameTime();
    return this.game.customerManager.calculateMinutesBetween(customer.orderTime, currentTime);
  }
  
  calculatePaymentWaitingTime(customer) {
    // Calculate minutes since customer wanted to pay
    if (!customer.paymentTime || !this.game.timeManager) return 0;
    
    const currentTime = this.game.timeManager.getGameTime();
    return this.game.customerManager.calculateMinutesBetween(customer.paymentTime, currentTime);
  }
  
  checkPreferencesMatch(customer) {
    // Check if any ordered items match customer preferences
    if (!customer.orders || !customer.preferences) return true; // Default to true if no data
    
    let matchCount = 0;
    
    for (const order of customer.orders) {
      if (order.type === 'drink' && customer.preferences.preferredDrinks.includes(order.item)) {
        matchCount++;
      } else if (order.type === 'food' && customer.preferences.preferredFood.includes(order.item)) {
        matchCount++;
      }
    }
    
    // Return true if at least one item matches preferences
    return matchCount > 0;
  }
  
  applyCustomerTypeModifier(customer, baseRate) {
    // Different customer types have different patience levels
    const customerTypes = {
      'regular': 0.8,  // Regulars are more patient (lower decrease)
      'tourist': 1.2,  // Tourists are less patient (higher decrease)
      'business': 1.5, // Business customers are very impatient
      'student': 0.7   // Students are very patient
    };
    
    const modifier = customerTypes[customer.type] || 1.0;
    return baseRate * modifier;
  }
  
  applyVenueFactorsToPatience(baseRate, venue, customer) {
    let finalRate = baseRate;
    
    // Cleanliness impacts patience
    const cleanlinessImpact = this.calculateCleanlinessImpact(venue.stats.cleanliness);
    finalRate *= cleanlinessImpact;
    
    // Music and lighting match with preferences
    finalRate *= this.calculateAtmosphereMatch(venue, customer);
    
    // Staff quality affects patience
    if (customer.assignedStaff) {
      finalRate *= this.calculateStaffImpact(customer.assignedStaff);
    }
    
    // Venue type specific factors
    finalRate *= this.applyVenueTypeSpecificFactors(venue, customer);
    
    return finalRate;
  }
  
  calculateCleanlinessImpact(cleanliness) {
    // Cleanliness below 50% makes customers more impatient
    if (cleanliness < 50) {
      return 1 + ((50 - cleanliness) / 50); // Up to 2x impatience for very dirty venues
    }
    return 1;
  }
  
  calculateAtmosphereMatch(venue, customer) {
    // Calculate how well the venue atmosphere matches customer preferences
    let atmosphereImpact = 1.0;
    
    // Music volume match
    const musicDifference = Math.abs(venue.settings.musicVolume - customer.preferences.musicPreference);
    if (musicDifference > 30) {
      atmosphereImpact += (musicDifference - 30) / 100;
    }
    
    // Lighting match
    const lightingDifference = Math.abs(venue.settings.lightingLevel - customer.preferences.lightingPreference);
    if (lightingDifference > 30) {
      atmosphereImpact += (lightingDifference - 30) / 100;
    }
    
    return atmosphereImpact;
  }
  
  calculateStaffImpact(staffId) {
    // Staff skills and personality affect customer patience
    const staff = this.game.staffManager ? this.game.staffManager.getStaff(staffId) : null;
    if (!staff) return 1.0;
    
    // Calculate staff factor based on skills and personality
    let staffFactor = 1.0;
    
    // Staff with good customer service skills can help maintain patience
    if (staff.skills && staff.skills.customer_service) {
      staffFactor -= (staff.skills.customer_service / 200); // Up to 0.5 reduction for max skill
    }
    
    // Staff friendliness improves patience
    if (staff.personality && staff.personality.friendliness > 0) {
      staffFactor -= (staff.personality.friendliness / 100); // Up to 0.1 reduction for friendly staff
    } else if (staff.personality && staff.personality.friendliness < 0) {
      staffFactor += (Math.abs(staff.personality.friendliness) / 100); // Up to 0.1 increase for unfriendly staff
    }
    
    // Staff morale affects their impact
    if (staff.morale < 50) {
      staffFactor += (50 - staff.morale) / 100; // Up to 0.5 increase for poor morale
    }
    
    return Math.max(0.5, staffFactor); // Ensure factor doesn't go below 0.5
  }
  
  applyVenueTypeSpecificFactors(venue, customer) {
    // Different venue types have different expectations
    switch(venue.type) {
      case 'Fast Food':
        // Fast food customers expect quick service
        if (customer.status === 'waiting' && this.calculateWaitingTime(customer) > 10) {
          return 1.5; // 50% more impatient after 10 minutes of waiting
        }
        break;
      case 'Restaurant':
        // Restaurant customers are more patient with food preparation
        if (customer.status === 'waiting') {
          return 0.8; // 20% more patient while waiting for food
        }
        break;
      case 'Nightclub':
        // Nightclub customers care more about atmosphere
        const atmosphereImpact = (100 - venue.stats.atmosphere) / 100;
        return 1 + (atmosphereImpact * 0.5); // Up to 50% more impatient in poor atmosphere
        break;
      case 'Bar':
        // Bar customers more patient with drinks, less with food
        if (customer.status === 'waiting') {
          const hasFood = customer.orders.some(order => order.type === 'food');
          return hasFood ? 1.2 : 0.9; // 20% more impatient for food, 10% more patient for just drinks
        }
        break;
    }
    return 1.0;
  }
  
  customerLeavesDissatisfied(customer, index) {
    // Determine reason for leaving
    let reason;
    switch(customer.status) {
      case 'entering':
        reason = "long wait for a table";
        break;
      case 'seated':
        reason = "being ignored by staff";
        break;
      case 'ordering':
        reason = "slow service";
        break;
      case 'waiting':
        reason = "long wait for their order";
        break;
      case 'eating':
      case 'drinking':
        reason = "dissatisfaction with their order";
        break;
      case 'paying':
        reason = "delay in processing payment";
        break;
      default:
        reason = "low patience";
    }
    
    // Log with relevant metadata
    window.logToConsole(`A group of ${customer.groupSize} left dissatisfied due to ${reason}.`, 'error');
    
    // Affect venue popularity and satisfaction based on customer group size and type
    const venue = this.game.venueManager.getVenue(customer.venueId);
    if (venue) {
      // Impact varies by customer type and group size
      const customerTypeImpact = {
        'regular': 1.5,  // Regulars leaving has bigger impact
        'tourist': 0.8,  // Tourists leaving has less impact
        'business': 1.2, // Business customers have moderate impact
        'student': 0.7   // Students have less impact
      };
      
      const impactMultiplier = (customerTypeImpact[customer.type] || 1.0) * 
                              Math.min(2, customer.groupSize / 2);
      
      venue.stats.popularity = Math.max(0, venue.stats.popularity - (0.2 * impactMultiplier));
      venue.stats.customerSatisfaction = Math.max(0, venue.stats.customerSatisfaction - (0.5 * impactMultiplier));
      
      // Record the negative experience for reporting
      if (this.game.financialManager && this.game.financialManager.reportingManager) {
        // If we had a reporting system that tracks customer experiences
        // this.game.financialManager.reportingManager.recordCustomerExperience({
        //   type: 'negative',
        //   reason: reason,
        //   customerType: customer.type,
        //   groupSize: customer.groupSize,
        //   venueId: venue.id,
        //   date: this.game.timeManager ? {...this.game.timeManager.getGameTime()} : null
        // });
      }
    }
    
    // Remove the customer
    this.game.customerManager.removeCustomer(index);
  }
  
  calculateFinalSatisfaction(customer, venue) {
    // Sophisticated calculation of final customer satisfaction
    let satisfactionScore = customer.satisfaction || 70; // Base satisfaction
    
    // Factor 1: Service quality experience
    satisfactionScore = this.applyServiceQualityFactor(satisfactionScore, customer, venue);
    
    // Factor 2: Food and drink quality/match with preferences
    satisfactionScore = this.applyFoodAndDrinkFactor(satisfactionScore, customer, venue);
    
    // Factor 3: Venue environment and experience
    satisfactionScore = this.applyVenueEnvironmentFactor(satisfactionScore, customer, venue);
    
    // Factor 4: Value for money
    satisfactionScore = this.applyValueForMoneyFactor(satisfactionScore, customer, venue);
    
    // Factor 5: Waiting times
    satisfactionScore = this.applyWaitingTimeFactor(satisfactionScore, customer);
    
    // Apply customer type preferences
    satisfactionScore = this.applyCustomerTypePreferences(satisfactionScore, customer, venue);
    
    // Clamp to 0-100 range
    customer.satisfaction = Math.max(0, Math.min(100, satisfactionScore));
    
    // Impact customer word-of-mouth
    this.calculateWordOfMouthImpact(customer, venue);
    
    return customer.satisfaction;
  }
  
  applyServiceQualityFactor(score, customer, venue) {
    // Service quality impact based on assigned staff
    if (!customer.assignedStaff) return score - 15; // Big penalty for no staff attention
    
    const staff = this.game.staffManager ? this.game.staffManager.getStaff(customer.assignedStaff) : null;
    if (!staff) return score - 10;
    
    // Calculate service score based on staff attributes
    let serviceModifier = 0;
    
    // Staff skills impact
    if (staff.skills) {
      const relevantSkills = [];
      
      if (staff.type === 'waiter') {
        relevantSkills.push(staff.skills.customer_service || 0);
        relevantSkills.push(staff.skills.speed || 0);
        relevantSkills.push(staff.skills.memory || 0);
      } else if (staff.type === 'bartender') {
        relevantSkills.push(staff.skills.mixing || 0);
        relevantSkills.push(staff.skills.speed || 0);
        relevantSkills.push(staff.skills.customer_service || 0);
      } else {
        // For other staff types, use whatever skills they have
        Object.values(staff.skills).forEach(value => relevantSkills.push(value));
      }
      
      // Average the relevant skills
      if (relevantSkills.length > 0) {
        const avgSkill = relevantSkills.reduce((sum, val) => sum + val, 0) / relevantSkills.length;
        serviceModifier += (avgSkill - 50) / 5; // -10 to +10 based on skills
      }
    }
    
    // Staff personality impact
    if (staff.personality) {
      if (staff.personality.friendliness) {
        serviceModifier += staff.personality.friendliness / 5; // -2 to +2
      }
      
      if (staff.personality.energy) {
        serviceModifier += staff.personality.energy / 10; // -1 to +1
      }
    }
    
    // Staff morale impact
    if (staff.morale) {
      serviceModifier += (staff.morale - 50) / 10; // -5 to +5
    }
    
    return score + serviceModifier;
  }
  
  applyFoodAndDrinkFactor(score, customer, venue) {
    if (!customer.orders || customer.orders.length === 0) return score;
    
    let totalQualityImpact = 0;
    let preferenceMatchCount = 0;
    
    // Analyze each order item
    customer.orders.forEach(order => {
      // Check if it's a preferred item
      if (order.type === 'drink' && customer.preferences.preferredDrinks.includes(order.item)) {
        preferenceMatchCount++;
        totalQualityImpact += 5; // Bonus for getting preferred drinks
      } else if (order.type === 'food' && customer.preferences.preferredFood.includes(order.item)) {
        preferenceMatchCount++;
        totalQualityImpact += 8; // Bigger bonus for preferred food
      }
      
      // Quality impact based on venue's inventory quality
      if (venue.inventory && venue.inventory[order.type + 's']) { // drinks -> drinks, food -> foods
        const item = venue.inventory[order.type + 's'].find(i => i.name === order.item);
        if (item) {
          // Quality implied by price markup
          const markup = (item.sellPrice / item.costPrice) - 1;
          
          // Expensive items create higher expectations
          const expectedQuality = 50 + (markup * 25);
          
          // For restaurants/bars, equipment condition affects quality
          let actualQuality = expectedQuality;
          
          if (venue.inventory.equipment) {
            let relevantEquipment;
            
            if (order.type === 'food') {
              relevantEquipment = venue.inventory.equipment.find(e => e.name === 'Kitchen Equipment');
            } else if (order.type === 'drink') {
              relevantEquipment = venue.inventory.equipment.find(e => e.name === 'Bar Equipment');
            }
            
            if (relevantEquipment) {
              // Equipment condition affects quality (0-100%)
              const equipmentFactor = relevantEquipment.condition / 100;
              actualQuality *= equipmentFactor;
            }
          }
          
          // Quality expectation gap affects satisfaction
          const qualityGap = actualQuality - expectedQuality;
          
          // Importance based on price point
          const importanceFactor = 0.5 + (item.sellPrice / 20); // More expensive = more important
          
          totalQualityImpact += qualityGap * importanceFactor / 10;
        }
      }
    });
    
    // Average the quality impact
    const avgImpact = customer.orders.length > 0 ? totalQualityImpact / customer.orders.length : 0;
    
    // Apply based on how much customer cares about quality
    const qualityImportance = customer.preferences.qualityImportance / 100;
    const qualityModifier = avgImpact * qualityImportance;
    
    return score + qualityModifier;
  }
  
  applyVenueEnvironmentFactor(score, customer, venue) {
    let environmentModifier = 0;
    
    // Cleanliness impact
    const cleanlinessImpact = (venue.stats.cleanliness - 70) / 10; // -7 to +3
    environmentModifier += cleanlinessImpact;
    
    // Atmosphere match with customer preferences
    const musicDifference = Math.abs(venue.settings.musicVolume - customer.preferences.musicPreference);
    const lightingDifference = Math.abs(venue.settings.lightingLevel - customer.preferences.lightingPreference);
    
    // Music and lighting differences reduce satisfaction if they're significant
    if (musicDifference > 30) {
      environmentModifier -= (musicDifference - 30) / 10; // Up to -7 for max difference
    }
    
    if (lightingDifference > 30) {
      environmentModifier -= (lightingDifference - 30) / 10; // Up to -7 for max difference
    }
    
    // Crowding factor - too empty or too full both reduce satisfaction
    const customerCount = this.game.customerManager ? 
                         this.game.customerManager.getCurrentCustomerCount() : 0;
    const occupancyRatio = customerCount / venue.settings.customerCapacity;
    
    if (occupancyRatio < 0.2) {
      // Too empty
      environmentModifier -= (0.2 - occupancyRatio) * 25; // Up to -5 for empty venue
    } else if (occupancyRatio > 0.9) {
      // Too crowded
      environmentModifier -= (occupancyRatio - 0.9) * 50; // Up to -5 for over-capacity
    }
    
    // Venue-specific environment factors
    switch(venue.type) {
      case 'Nightclub':
        // Nightclubs should be crowded and loud
        if (occupancyRatio > 0.5 && venue.settings.musicVolume > 60) {
          environmentModifier += 5; // Bonus for appropriately loud and crowded nightclub
        }
        break;
      case 'Restaurant':
        // Restaurants should be clean and moderately quiet
        if (venue.stats.cleanliness > 80 && venue.settings.musicVolume < 50) {
          environmentModifier += 5; // Bonus for clean, quiet restaurant
        }
        break;
      case 'Bar':
        // Bars benefit from good atmosphere
        if (venue.stats.atmosphere > 70) {
          environmentModifier += 5; // Bonus for good bar atmosphere
        }
        break;
      case 'Fast Food':
        // Fast food places should be clean and bright
        if (venue.stats.cleanliness > 70 && venue.settings.lightingLevel > 70) {
          environmentModifier += 5; // Bonus for clean, bright fast food place
        }
        break;
    }
    
    return score + environmentModifier;
  }
  
  applyValueForMoneyFactor(score, customer, venue) {
    // Calculate value for money perception
    const spentPerPerson = (customer.totalSpending || 0) / customer.groupSize;
    
    if (spentPerPerson === 0) return score; // If didn't spend anything, no impact
    
    // Base expectations by venue type (in currency units)
    const baseExpectations = {
      'Restaurant': 25,
      'Bar': 15,
      'Nightclub': 30,
      'Fast Food': 8
    };
    
    // Expected spending based on venue type and customer affluence
    const expectedSpending = baseExpectations[venue.type] || 15;
    
    // Compare actual spending to expected spending
    const spendingRatio = spentPerPerson / expectedSpending;
    
    // Calculate perceived value based on quality vs price
    const perceivedQuality = venue.stats.serviceQuality * 0.5 + venue.stats.atmosphere * 0.3 + venue.stats.cleanliness * 0.2;
    const qualityPerCurrency = perceivedQuality / Math.max(0.1, spentPerPerson);
    
    // Different customer types value money differently
    const valueImportance = (100 - customer.preferences.qualityImportance) / 100; // Price-sensitive customers care more about value
    
    let valueModifier;
    
    if (spendingRatio > 1.3) {
      // Spent more than expected - need very high quality to compensate
      const qualityThreshold = 70 + (spendingRatio - 1) * 30; // Higher spending requires higher quality
      
      if (perceivedQuality > qualityThreshold) {
        valueModifier = 5; // Expensive but worth it
      } else {
        valueModifier = -10 * valueImportance * (spendingRatio - 1); // Expensive and not worth it
      }
    } else if (spendingRatio < 0.7) {
      // Spent less than expected - good value unless quality is very poor
      if (perceivedQuality > 40) {
        valueModifier = 5 * valueImportance; // Good deal
      } else {
        valueModifier = (perceivedQuality - 40) / 8; // Poor quality for low price
      }
    } else {
      // Spent around expected amount - value depends on quality
      valueModifier = (perceivedQuality - 60) / 10; // Moderate impact based on quality vs expectation
    }
    
    return score + valueModifier;
  }
  
  applyWaitingTimeFactor(score, customer) {
    let waitingModifier = 0;
    
    // Impact of waiting to be seated
    const seatWaitTime = this.calculateMinutesBetween(customer.arrivalTime, customer.orderTime || customer.serveTime || this.game.timeManager.getGameTime());
    
    // Calculate reasonable wait times based on customer type
    const reasonableSeatWait = customer.type === 'business' ? 5 : 
                              (customer.type === 'tourist' ? 10 : 15);
    
    if (seatWaitTime > reasonableSeatWait) {
      waitingModifier -= Math.min(15, (seatWaitTime - reasonableSeatWait) / 2);
    }
    
    // Impact of waiting for order
    if (customer.orderTime && customer.serveTime) {
      const orderWaitTime = this.calculateMinutesBetween(customer.orderTime, customer.serveTime);
      
      // Reasonable wait depends on order (food takes longer) and venue type
      let reasonableOrderWait = 5; // Base for drinks only
      
      // Check if any food was ordered
      const hasFood = customer.orders && customer.orders.some(order => order.type === 'food');
      
      if (hasFood) {
        // Food takes longer
        reasonableOrderWait = 15;
        
        // Fast food should be faster
        if (venue.type === 'Fast Food') {
          reasonableOrderWait = 8;
        }
        // Restaurants can take longer
        else if (venue.type === 'Restaurant') {
          reasonableOrderWait = 20;
        }
      }
      
      if (orderWaitTime > reasonableOrderWait) {
        // Non-linear penalty for excessive waiting
        const waitPenalty = Math.pow(orderWaitTime - reasonableOrderWait, 1.3) / 5;
        waitingModifier -= Math.min(20, waitPenalty);
      } else if (orderWaitTime < reasonableOrderWait / 2) {
        // Bonus for surprisingly fast service
        waitingModifier += 5;
      }
    }
    
    // Impact of waiting to pay
    if (customer.paymentTime && customer.leaveTime) {
      const paymentWaitTime = this.calculateMinutesBetween(customer.paymentTime, customer.leaveTime);
      
      if (paymentWaitTime > 5) {
        waitingModifier -= Math.min(10, paymentWaitTime - 5);
      }
    }
    
    return score + waitingModifier;
  }
  
  calculateMinutesBetween(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    
    // Use the customer manager's method if available
    if (this.game.customerManager && this.game.customerManager.calculateMinutesBetween) {
      return this.game.customerManager.calculateMinutesBetween(startTime, endTime);
    }
    
    // Fallback calculation
    let minutes = (endTime.hour - startTime.hour) * 60;
    minutes += (endTime.minute - startTime.minute);
    
    // Handle day changes
    if (endTime.day > startTime.day || endTime.month > startTime.month || endTime.year > startTime.year) {
      minutes += 24 * 60; // Add a day's worth of minutes
    }
    
    return minutes;
  }
  
  applyCustomerTypePreferences(score, customer, venue) {
    // Different customer types care about different aspects
    switch(customer.type) {
      case 'regular':
        // Regulars care about consistency and familiarity
        // They're more sensitive to changes in quality or service
        // This would ideally track their past visits, but for now we'll just adjust based on venue stability
        
        // If venue has stable good ratings, regulars are happier
        if (venue.stats.customerSatisfaction > 70 && venue.stats.popularity > 70) {
          score += 10; // Bonus for established quality venues
        }
        break;
        
      case 'tourist':
        // Tourists care about unique experiences and atmosphere
        // They're less sensitive to value and more impressed by local character
        score += (venue.stats.atmosphere - 50) / 5; // -10 to +10 based on atmosphere
        
        // Tourists love authentic local experiences
        if (venue.stats.popularity > 60) {
          score += 5; // Popular places must be good for tourists
        }
        break;
        
      case 'business':
        // Business customers care about efficiency, quality, and presentation
        // They're more sensitive to service quality and less to price
        
        // Efficiency is key - waiting times matter more
        if (customer.serveTime && customer.orderTime) {
          const serviceSpeed = this.calculateMinutesBetween(customer.orderTime, customer.serveTime);
          if (serviceSpeed < 10) {
            score += 10; // Bonus for quick service
          } else if (serviceSpeed > 20) {
            score -= 15; // Penalty for slow service
          }
        }
        
        // Professional environment matters
        if (venue.stats.cleanliness > 80) {
          score += 5; // Clean venues are good for business
        }
        break;
        
      case 'student':
        // Students care about price, quantity, and social atmosphere
        // They're very price sensitive but tolerant of other issues
        
        // Value for money is critical
        const spentPerPerson = (customer.totalSpending || 0) / customer.groupSize;
        const valueRating = 15 - spentPerPerson; // Higher rating for lower prices
        
        score += valueRating;
        
        // Social atmosphere is important
        const customerCount = this.game.customerManager ? 
                           this.game.customerManager.getCurrentCustomerCount() : 0;
        
        if (customerCount > venue.settings.customerCapacity * 0.6) {
          score += 5; // Bonus for busy venues that feel social
        }
        break;
    }return score;
  }
  
  calculateWordOfMouthImpact(customer, venue) {
    // Calculate if this customer's experience will affect future customers
    // through word-of-mouth effects
    
    // Only significant experiences (very good or very bad) generate word-of-mouth
    if (customer.satisfaction > 85 || customer.satisfaction < 30) {
      const isPositive = customer.satisfaction > 85;
      const intensity = isPositive ? 
                      (customer.satisfaction - 85) / 15 : 
                      (30 - customer.satisfaction) / 30;
      
      // Word of mouth affects venue popularity
      const wom_impact = intensity * 0.3 * customer.groupSize / 4;
      
      if (isPositive) {
        venue.stats.popularity = Math.min(100, venue.stats.popularity + wom_impact);
        
        // Log significant positive experiences
        if (wom_impact > 0.5) {
          window.logToConsole(`A group of ${customer.groupSize} ${customer.type} customers had an excellent experience and will recommend your venue to others!`, 'success');
        }
      } else {
        venue.stats.popularity = Math.max(0, venue.stats.popularity - wom_impact);
        
        // Log significant negative experiences
        if (wom_impact > 0.5) {
          window.logToConsole(`A group of ${customer.groupSize} ${customer.type} customers had a terrible experience and may discourage others from visiting.`, 'warning');
        }
      }
      
      // Impact ongoing customer satisfaction trend
      const satisfactionImpact = wom_impact * (isPositive ? 1 : -1) * 0.5;
      venue.stats.customerSatisfaction = Math.max(0, Math.min(100, 
        venue.stats.customerSatisfaction + satisfactionImpact));
    }
  }
  
  // Get average satisfaction for a venue
  getAverageSatisfaction(venueId) {
    const customers = this.game.state.customers.filter(c => 
      c.venueId === venueId && 
      (c.status === 'eating' || c.status === 'drinking' || 
       c.status === 'paying' || c.status === 'leaving')
    );
    
    if (customers.length === 0) {
      // Fall back to venue's stored satisfaction stat
      const venue = this.game.venueManager.getVenue(venueId);
      return venue ? venue.stats.customerSatisfaction : 0;
    }
    
    const totalSatisfaction = customers.reduce((sum, c) => sum + c.satisfaction, 0);
    return totalSatisfaction / customers.length;
  }
  
  // Get satisfaction breakdown by customer type
  getSatisfactionByCustomerType(venueId) {
    const customers = this.game.state.customers.filter(c => 
      c.venueId === venueId && 
      (c.status === 'eating' || c.status === 'drinking' || 
       c.status === 'paying' || c.status === 'leaving')
    );
    
    if (customers.length === 0) {
      return null;
    }
    
    // Group customers by type and calculate average satisfaction
    const typeGroups = {};
    
    customers.forEach(customer => {
      if (!typeGroups[customer.type]) {
        typeGroups[customer.type] = {
          count: 0,
          totalSatisfaction: 0
        };
      }
      
      typeGroups[customer.type].count++;
      typeGroups[customer.type].totalSatisfaction += customer.satisfaction;
    });
    
    // Calculate averages
    Object.keys(typeGroups).forEach(type => {
      typeGroups[type].averageSatisfaction = 
        typeGroups[type].totalSatisfaction / typeGroups[type].count;
    });
    
    return typeGroups;
  }
  
  // Get most common causes of dissatisfaction
  getCommonDissatisfactionCauses(venueId) {
    // This would ideally use historical data stored in a reporting system
    // For now, we'll do a simple analysis of current customers
    
    const customers = this.game.state.customers.filter(c => 
      c.venueId === venueId && c.satisfaction < 50
    );
    
    if (customers.length === 0) {
      return [];
    }
    
    // Count potential issues
    const issues = {
      'long_wait': 0,
      'poor_service': 0,
      'food_quality': 0,
      'cleanliness': 0,
      'atmosphere': 0,
      'price': 0
    };
    
    // Get venue for analysis
    const venue = this.game.venueManager.getVenue(venueId);
    if (!venue) return [];
    
    customers.forEach(customer => {
      // Check for long wait times
      if (customer.status === 'waiting' && this.calculateWaitingTime(customer) > 15) {
        issues.long_wait++;
      }
      
      // Check for service issues
      if (!customer.assignedStaff || (customer.assignedStaff && 
          this.calculateStaffImpact(customer.assignedStaff) > 1.2)) {
        issues.poor_service++;
      }
      
      // Check for food/drink quality issues
      if (customer.orders && !this.checkPreferencesMatch(customer)) {
        issues.food_quality++;
      }
      
      // Check for cleanliness issues
      if (venue.stats.cleanliness < 60) {
        issues.cleanliness++;
      }
      
      // Check for atmosphere mismatch
      if (this.calculateAtmosphereMatch(venue, customer) > 1.3) {
        issues.atmosphere++;
      }
      
      // Check for price concerns
      if (customer.totalSpending > customer.spendingBudget * 0.8) {
        issues.price++;
      }
    });
    
    // Sort issues by frequency
    return Object.entries(issues)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: (count / customers.length) * 100
      }));
  }
  
  // Generate customer satisfaction report
  generateSatisfactionReport(venueId) {
    const venue = this.game.venueManager.getVenue(venueId);
    if (!venue) return null;
    
    const satisfactionScore = this.getAverageSatisfaction(venueId);
    const customerTypeBreakdown = this.getSatisfactionByCustomerType(venueId);
    const dissatisfactionCauses = this.getCommonDissatisfactionCauses(venueId);
    
    return {
      venueId,
      venueName: venue.name,
      date: this.game.timeManager ? { ...this.game.timeManager.getGameTime() } : null,
      overallSatisfaction: satisfactionScore,
      satisfactionRating: this.getSatisfactionRating(satisfactionScore),
      customerTypeBreakdown,
      dissatisfactionCauses,
      recommendations: this.generateRecommendations(venue, dissatisfactionCauses)
    };
  }
  
  getSatisfactionRating(score) {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Average';
    if (score >= 40) return 'Below Average';
    if (score >= 30) return 'Poor';
    if (score >= 20) return 'Very Poor';
    return 'Terrible';
  }
  
  generateRecommendations(venue, issues) {
    if (!issues || issues.length === 0) {
      return ['Customer satisfaction is good, keep up the good work!'];
    }
    
    const recommendations = [];
    
    // Generate specific recommendations based on top issues
    issues.slice(0, 3).forEach(issue => {
      switch(issue.issue) {
        case 'long_wait':
          recommendations.push('Reduce wait times by hiring more staff or improving staff efficiency.');
          if (venue.staff.length < 3) {
            recommendations.push('Consider hiring more waiters or bartenders to handle customer flow.');
          }
          break;
          
        case 'poor_service':
          recommendations.push('Improve service quality through staff training or hiring more experienced staff.');
          recommendations.push('Ensure staff morale stays high for better customer service.');
          break;
          
        case 'food_quality':
          recommendations.push('Review menu offerings and consider upgrading food/drink quality.');
          if (venue.inventory && venue.inventory.equipment) {
            const kitchenEquipment = venue.inventory.equipment.find(e => e.name === 'Kitchen Equipment');
            if (kitchenEquipment && kitchenEquipment.condition < 70) {
              recommendations.push('Repair or upgrade kitchen equipment to improve food quality.');
            }
          }
          break;
          
        case 'cleanliness':
          recommendations.push('Improve venue cleanliness through regular cleaning and maintenance.');
          recommendations.push('Consider hiring cleaning staff if you don\'t have any.');
          break;
          
        case 'atmosphere':
          recommendations.push('Adjust music volume and lighting to better match customer preferences.');
          recommendations.push('Consider investing in decoration to improve atmosphere.');
          break;
          
        case 'price':
          recommendations.push('Review pricing strategy - current prices may be too high for customer value perception.');
          recommendations.push('Consider offering promotions or happy hours to improve value perception.');
          break;
      }
    });
    
    return recommendations;
  }
}

module.exports = CustomerSatisfaction;