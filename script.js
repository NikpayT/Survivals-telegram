// script.js

const GAME_VERSION = "0.4.2"; // Версия: Исправление событий, базовый склад

const game = {
    state: {
        day: 1,
        survivors: 1,
        gameOver: false,
        currentEvent: null, 
        structures: {}, 
        
        inventory: [], // Личный инвентарь игрока
        baseInventory: [], // Склад базы (общаг)

        player: {
            health: 100, maxHealth: 100,
            hunger: 100, maxHunger: 100, 
            thirst: 100, maxThirst: 100, 
            carryWeight: 0, maxCarryWeight: 25, 
            condition: "В порядке", 
        },
        dailyFoodNeed: 0, 
        dailyWaterNeed: 0, 

        currentLocationId: "base_surroundings", 
        discoveredLocations: { 
            "base_surroundings": { 
                discovered: true, 
                name: "Окрестности Базы",
                searchAttemptsLeft: (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]?.initialSearchAttempts) || 5, 
                foundSpecialItems: {} 
            } 
        },
        locationEvent: null, 
        logVisible: true, 
        flags: {}, 
    },

    get maxSurvivors() {
        let max = 0;
        if (this.state.structures.shelter && this.state.structures.shelter.level > 0 && typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') {
            max += BASE_STRUCTURE_DEFINITIONS.shelter.effect(this.state.structures.shelter.level).maxSurvivors;
        }
        return max || 1;
    },

    getHungerThresholds: function() { return { critical: 20, low: 40, normal: 100 }; },
    getThirstThresholds: function() { return { critical: 15, low: 35, normal: 100 }; },
    
    getTotalPlayerResourceValue: function(type) { 
        let totalValue = 0;
        this.state.inventory.forEach(itemSlot => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (itemDef && itemDef.effect) {
                if (type === 'food' && itemDef.type === 'food' && itemDef.effect.hunger) {
                    totalValue += itemDef.effect.hunger * itemSlot.quantity;
                } else if (type === 'water_source' && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect.thirst) {
                    totalValue += itemDef.effect.thirst * itemSlot.quantity;
                }
            }
        });
        return totalValue;
    },
    countBaseFoodItems: function() {
        let count = 0;
        this.state.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && itemDef.type === 'food') {
                count += slot.quantity * (itemDef.effect?.hunger || 0); 
            }
        });
        return count;
    },
    countBaseWaterItems: function() {
        let count = 0;
        this.state.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && (itemDef.type === 'water' || itemDef.type === 'water_source')) {
                 count += slot.quantity * (itemDef.effect?.thirst || 0); 
            }
        });
        return count;
    },


    dom: {
        gameVersionDisplay: document.getElementById('game-version'),
        day: document.getElementById('day'),
        survivors: document.getElementById('survivors'),
        maxSurvivors: document.getElementById('max-survivors'),
        
        totalFoodValue: document.getElementById('total-food-value'), 
        totalWaterValue: document.getElementById('total-water-value'), 
        playerCondition: document.getElementById('player-condition'),

        healthBarInner: document.getElementById('health-bar-inner'),
        healthBarText: document.getElementById('health-bar-text'),
        hungerBarInner: document.getElementById('hunger-bar-inner'),
        hungerBarText: document.getElementById('hunger-bar-text'),
        thirstBarInner: document.getElementById('thirst-bar-inner'),
        thirstBarText: document.getElementById('thirst-bar-text'),

        logMessages: document.getElementById('log-messages'),
        buildActions: document.getElementById('build-actions'), 
        eventActionsContainer: document.getElementById('event-actions-container'), 
        eventTextDisplay: document.getElementById('event-text-display'),
        eventActions: document.getElementById('event-actions'), 
        
        inventoryButton: document.getElementById('inventory-button'), 
        inventoryModal: document.getElementById('inventory-modal'),
        inventoryItemsList: document.getElementById('inventory-items-list'),
        inventoryWeight: document.getElementById('inventory-weight'),
        inventoryMaxWeight: document.getElementById('inventory-max-weight'),
        inventoryFilters: document.querySelector('.inventory-filters'),
        
        sidebar: document.getElementById('sidebar'),
        mainNav: document.getElementById('main-nav'),
        mainContent: document.getElementById('main-content'),
        mainHeader: document.getElementById('main-header'),
        tabContentArea: document.getElementById('tab-content-area'),
        
        logPanel: document.getElementById('log-panel'),
        toggleLogButton: document.getElementById('toggle-log'),

        currentLocationNameDisplay: document.getElementById('current-location-name'),
        currentLocationTimeDisplay: document.getElementById('current-location-time'),
        currentLocationDescriptionDisplay: document.getElementById('current-location-description'),
        scoutCurrentLocationButton: document.getElementById('scout-current-location-button'),
        discoverNewLocationButton: document.getElementById('discover-new-location-button'),
        discoveredLocationsList: document.getElementById('discovered-locations-list'),
        craftingRecipesContainer: document.getElementById('crafting-recipes'), 
     },

    init: function() {
        this.dom.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.initializeStructures();
        this.loadGame(); 
        
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedVersionKey = `zombieSurvivalGame_v${major}.${minor}`;

        if (!this.state.discoveredLocations || Object.keys(this.state.discoveredLocations).length === 0) {
            this.state.discoveredLocations = {}; 
        }
        if (!this.state.discoveredLocations["base_surroundings"] || 
            this.state.discoveredLocations["base_surroundings"].searchAttemptsLeft === undefined) {
            const baseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5};
            this.state.discoveredLocations["base_surroundings"] = { 
                discovered: true, 
                name: baseLocDef.name,
                searchAttemptsLeft: baseLocDef.initialSearchAttempts,
                foundSpecialItems: {}
            };
        }
        if (!this.state.currentLocationId) {
             this.state.currentLocationId = "base_surroundings";
        }
        if (!this.state.baseInventory) { 
            this.state.baseInventory = [];
        }


        if (!localStorage.getItem(savedVersionKey)) { 
            if (this.state.inventory.length === 0) this.addInitialItemsToPlayer(); 
            this.addInitialItemsToBase(); 
        }
        
        this.updateDisplay(); 
        this.updateBuildActions();
        this.updateExploreTab(); 
        
        this.dom.inventoryButton.onclick = () => this.openInventoryModal();
        this.dom.inventoryFilters.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => this.filterInventory(e.target.dataset.filter));
        });

        this.dom.mainNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.openTab(e.target.dataset.tab, e.target));
        });
        
        this.dom.toggleLogButton.addEventListener('click', () => this.toggleLogVisibility());
        this.applyLogVisibility();

        this.log("Игра началась. Пустошь ждет.", "event-neutral");
        const defaultNavLink = this.dom.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
        if (defaultNavLink) {
            this.openTab('main-tab', defaultNavLink);
        } else {
             this.openTab('main-tab', null);
        }
    },

    initializeStructures: function() {
        this.state.structures = {}; 
        for (const key in BASE_STRUCTURE_DEFINITIONS) {
            const def = BASE_STRUCTURE_DEFINITIONS[key];
            this.state.structures[key] = {
                level: def.initialLevel || 0,
            };
        }
    },

    addInitialItemsToPlayer: function() { 
        this.addItemToInventory(this.state.inventory, "food_canned", 1); 
        this.addItemToInventory(this.state.inventory, "water_purified", 1);
        this.addItemToInventory(this.state.inventory, "bandages_crude", 1);
    },
    addInitialItemsToBase: function() {
        this.addItemToInventory(this.state.baseInventory, "food_canned", 5);
        this.addItemToInventory(this.state.baseInventory, "water_purified", 5);
        this.addItemToInventory(this.state.baseInventory, "scrap_metal", 10);
        this.addItemToInventory(this.state.baseInventory, "wood", 10);
    },

    openTab: function(tabName, clickedLinkElement) {
        this.dom.tabContentArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = "none");
        this.dom.mainNav.querySelectorAll('.nav-link').forEach(tl => tl.classList.remove("active"));
        
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.style.display = "block";
        } else {
            console.error("Tab not found: " + tabName);
            document.getElementById('main-tab').style.display = "block"; 
            const defaultLink = this.dom.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
            if (defaultLink) defaultLink.classList.add('active');
            return;
        }

        if (clickedLinkElement) {
            clickedLinkElement.classList.add("active");
        } else { 
            const linkToActivate = this.dom.mainNav.querySelector(`.nav-link[data-tab="${tabName}"]`);
            if (linkToActivate) linkToActivate.classList.add('active');
        }
        
        if (tabName === 'main-tab') {
            if (this.state.currentEvent) { 
                this.dom.eventTextDisplay.textContent = this.state.currentEvent.text;
                this.dom.eventActionsContainer.style.display = 'block';
                this.displayEventChoices(); 
            } else if (this.state.locationEvent) { 
                 this.dom.eventTextDisplay.textContent = this.state.locationEvent.text;
                 this.dom.eventActionsContainer.style.display = 'block';
                 this.displayLocationEventChoices(); 
            }
            else {
                this.dom.eventTextDisplay.textContent = '';
                this.dom.eventActionsContainer.style.display = 'none';
            }
        } else if (tabName === 'explore-tab') {
            this.updateExploreTab(); 
        }
    },
    
    updatePlayerStatus: function() {
        const player = this.state.player;

        const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
        this.dom.healthBarInner.style.width = `${healthPercent}%`;
        this.dom.healthBarText.textContent = `${player.health}/${player.maxHealth}`;
        this.dom.healthBarInner.classList.remove('critical', 'low');
        if (healthPercent <= 25) this.dom.healthBarInner.classList.add('critical');
        else if (healthPercent <= 50) this.dom.healthBarInner.classList.add('low');

        this.dom.hungerBarText.textContent = "Норма"; 
        this.dom.hungerBarInner.style.width = `100%`; 
        this.dom.thirstBarText.textContent = "Норма"; 
        this.dom.thirstBarInner.style.width = `100%`; 
        
        this.dom.playerCondition.textContent = this.state.player.condition;

        if (this.dom.inventoryModal.style.display === 'block') {
            const activeFilter = this.dom.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            this.renderInventory(activeFilter); 
        }
    },

    consumeItem: function(itemId, inventoryItemIndex, targetInventory = this.state.inventory) { 
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef || !itemDef.effect) {
            this.log(`Предмет '${itemDef.name}' не является употребляемым.`, "event-neutral");
            return;
        }

        let consumed = false;
        if (itemDef.type === "food" && itemDef.effect.hunger) {
            // Если потребляет игрок из своего инвентаря, то на игрока.
            // Если это потребление для выживших (не через эту функцию сейчас), то на них.
            // Пока что эта функция вызывается только для игрока.
            this.state.player.hunger = Math.min(this.state.player.maxHunger, this.state.player.hunger + itemDef.effect.hunger);
            this.log(`Вы съели: ${itemDef.name}. Сытость игрока +${itemDef.effect.hunger}.`, "event-positive");
            consumed = true;
        } else if ((itemDef.type === "water" || itemDef.type === "water_source") && itemDef.effect.thirst) {
            if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance) {
                this.log(`Вы выпили ${itemDef.name}, но почувствовали себя хуже. Возможно, отравление.`, "event-negative");
                this.state.player.condition = "Подташнивает"; 
            } else {
                this.state.player.thirst = Math.min(this.state.player.maxThirst, this.state.player.thirst + itemDef.effect.thirst);
                this.log(`Вы выпили: ${itemDef.name}. Жажда игрока утолена на +${itemDef.effect.thirst}.`, "event-positive");
            }
            consumed = true;
        } else if (itemDef.type === "medicine" && itemDef.effect.healing) {
            this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + itemDef.effect.healing);
             this.log(`Вы использовали ${itemDef.name}. Здоровье игрока +${itemDef.effect.healing}.`, "event-positive");
            consumed = true;
        }

        if (consumed) {
            this.removeItemFromInventory(targetInventory, itemId, 1, inventoryItemIndex); 
        }
        this.updateDisplay(); 
    },

    takeDamage: function(amount, source) {
        if (this.state.gameOver) return;
        this.state.player.health -= amount;
        this.log(`Вы получили ${amount} урона (${source}).`, "event-negative");
        if (this.state.player.health <= 0) {
            this.state.player.health = 0;
            this.gameOver(`Вы погибли от ${source}. Пустошь беспощадна.`);
        }
        this.updatePlayerStatus(); 
    },

    addItemToInventory: function(targetInventory, itemId, quantity = 1) {
        if (!ITEM_DEFINITIONS[itemId]) {
            console.error(`Попытка добавить несуществующий предмет: ${itemId}`);
            return false;
        }
        const itemDef = ITEM_DEFINITIONS[itemId];
        
        if (targetInventory === this.state.inventory && 
            (this.state.player.carryWeight + (itemDef.weight * quantity) > this.state.player.maxCarryWeight)) {
            this.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
            return false; 
        }

        const existingItemIndex = targetInventory.findIndex(slot => slot.itemId === itemId && itemDef.stackable);
        if (existingItemIndex > -1) {
            targetInventory[existingItemIndex].quantity += quantity;
        } else {
            targetInventory.push({ itemId: itemId, quantity: quantity });
        }
        
        if (targetInventory === this.state.inventory) { 
            this.state.player.carryWeight += itemDef.weight * quantity;
            this.state.player.carryWeight = parseFloat(this.state.player.carryWeight.toFixed(2)); 
        }
        
        this.updateDisplay(); 
        return true; 
    },

    removeItemFromInventory: function(targetInventory, itemId, quantity = 1, specificIndex = -1) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) return false;

        let itemIndex;
        if (specificIndex > -1 && targetInventory[specificIndex] && targetInventory[specificIndex].itemId === itemId) {
            itemIndex = specificIndex;
        } else {
            itemIndex = targetInventory.findIndex(slot => slot.itemId === itemId);
        }

        if (itemIndex > -1) {
            const itemSlot = targetInventory[itemIndex];
            let removedQuantity = 0;
            if (itemSlot.quantity > quantity) {
                itemSlot.quantity -= quantity;
                removedQuantity = quantity;
            } else {
                removedQuantity = itemSlot.quantity; 
                targetInventory.splice(itemIndex, 1);
            }
            if (targetInventory === this.state.inventory) { 
                this.state.player.carryWeight -= itemDef.weight * removedQuantity;
                this.state.player.carryWeight = Math.max(0, parseFloat(this.state.player.carryWeight.toFixed(2)));
            }
            this.updateDisplay();
            return true;
        }
        return false; 
    },
    
    countItemInInventory: function(targetInventory, itemId) {
        let count = 0;
        targetInventory.forEach(slot => {
            if (slot.itemId === itemId) {
                count += slot.quantity;
            }
        });
        return count;
    },

    openInventoryModal: function() {
        this.dom.inventoryModal.style.display = 'block';
        this.filterInventory('all'); 
    },
    closeInventoryModal: function() {
        this.dom.inventoryModal.style.display = 'none';
    },
    filterInventory: function(filterType) {
        this.dom.inventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        const activeButton = this.dom.inventoryFilters.querySelector(`button[data-filter="${filterType}"]`);
        if (activeButton) activeButton.classList.add('active');
        this.renderInventory(filterType);
    },
    renderInventory: function(filterType = 'all') { 
        this.dom.inventoryItemsList.innerHTML = '';
        const inventoryToDisplay = this.state.inventory; 

        if (inventoryToDisplay.length === 0) {
            this.dom.inventoryItemsList.innerHTML = '<p>Ваш инвентарь пуст.</p>';
            this.updateInventoryWeightDisplay();
            return;
        }
        
        let somethingRendered = false;
        inventoryToDisplay.forEach((itemSlot, index) => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (!itemDef) return;

            let passesFilter = (filterType === 'all');
            if (!passesFilter) {
                if (filterType === 'water_source' && (itemDef.type === 'water' || itemDef.type === 'water_source')) {
                    passesFilter = true;
                } else if (itemDef.type === filterType) {
                    passesFilter = true;
                }
            }
            if (!passesFilter) return;
            
            somethingRendered = true;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';

            let itemActionsHTML = '';
            if (itemDef.type === 'food' || itemDef.type === 'water' || itemDef.type === 'water_source' || itemDef.type === 'medicine') {
                itemActionsHTML += `<button onclick="game.consumeItem('${itemSlot.itemId}', ${index}, game.state.inventory)">Использовать</button>`;
            }
            itemActionsHTML += `<button onclick="game.transferItem('${itemSlot.itemId}', ${index}, game.state.inventory, game.state.baseInventory, 1)">На склад (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="game.transferItem('${itemSlot.itemId}', ${index}, game.state.inventory, game.state.baseInventory, ${itemSlot.quantity})">На склад (Все)</button>`;
            }
            
            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4>${itemDef.name} <span class="item-quantity">(x${itemSlot.quantity})</span></h4>
                    <p>${itemDef.description} (Вес: ${itemDef.weight} кг/шт)</p>
                </div>
                <div class="item-actions">
                    ${itemActionsHTML}
                </div>
            `;
            this.dom.inventoryItemsList.appendChild(itemDiv);
        });

        if(!somethingRendered && filterType !== 'all') {
             this.dom.inventoryItemsList.innerHTML = `<p>Нет предметов типа '${filterType}'.</p>`;
        }
        this.updateInventoryWeightDisplay();
    },
    
    updateInventoryWeightDisplay: function() {
        this.dom.inventoryWeight.textContent = this.state.player.carryWeight.toFixed(1);
        this.dom.inventoryMaxWeight.textContent = this.state.player.maxCarryWeight;
    },

    transferItem: function(itemId, itemIndexInSource, sourceInventory, destinationInventory, quantity) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) return;

        // Убедимся, что sourceInventory и destinationInventory переданы корректно (массивы)
        if (!Array.isArray(sourceInventory) || !Array.isArray(destinationInventory)) {
            console.error("Ошибка: инвентарь источника или назначения не является массивом.", sourceInventory, destinationInventory);
            return;
        }
        
        const sourceSlot = sourceInventory[itemIndexInSource];
        if (!sourceSlot || sourceSlot.itemId !== itemId) {
            console.error("Ошибка: предмет не найден в исходном слоте для перемещения.", itemId, itemIndexInSource, sourceInventory);
            return;
        }

        const actualQuantity = Math.min(quantity, sourceSlot.quantity);

        if (destinationInventory === this.state.inventory) {
            if (this.state.player.carryWeight + (itemDef.weight * actualQuantity) > this.state.player.maxCarryWeight) {
                this.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${actualQuantity}).`, "event-warning");
                return;
            }
        }
        
        this.addItemToInventory(destinationInventory, itemId, actualQuantity); // Эта функция обновит вес, если destinationInventory === this.state.inventory
        this.removeItemFromInventory(sourceInventory, itemId, actualQuantity, itemIndexInSource); // Эта функция обновит вес, если sourceInventory === this.state.inventory

        this.log(`Перемещено: ${itemDef.name} (x${actualQuantity}) ${sourceInventory === this.state.inventory ? 'на склад' : 'в личный инвентарь'}.`, "event-neutral");

        if (this.dom.inventoryModal.style.display === 'block') {
            // Перерисовываем только если открыт инвентарь игрока и источник - инвентарь игрока
            if (sourceInventory === this.state.inventory || destinationInventory === this.state.inventory) {
                 this.renderInventory(this.dom.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all');
            }
        }
        this.updateDisplay(); 
    },


    updateDisplay: function() {
        this.dom.day.textContent = this.state.day;
        this.dom.survivors.textContent = this.state.survivors;
        this.dom.maxSurvivors.textContent = this.maxSurvivors; 
        
        this.updatePlayerStatus(); 
        this.updateInventoryWeightDisplay(); 

        this.dom.totalFoodValue.textContent = this.countBaseFoodItems(); 
        this.dom.totalWaterValue.textContent = this.countBaseWaterItems(); 

        if (this.dom.inventoryModal.style.display === 'block') {
            const activeFilter = this.dom.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            this.renderInventory(activeFilter);
        }
        if (document.getElementById('explore-tab').style.display === 'block') {
            this.updateExploreTabDisplay();
        }
    },

    log: function(message, type = "event-neutral") {
        const p = document.createElement('p');
        p.innerHTML = `[Д:${this.state.day}] ${message}`; 
        p.className = type;
        this.dom.logMessages.prepend(p);
        if (this.dom.logMessages.children.length > 30) {
            this.dom.logMessages.removeChild(this.dom.logMessages.lastChild);
        }
        if(this.state.logVisible) this.dom.logMessages.scrollTop = 0; 
    },

    toggleLogVisibility: function() {
        this.state.logVisible = !this.state.logVisible;
        this.applyLogVisibility();
        this.saveGame(); 
    },

    applyLogVisibility: function() {
        if (this.state.logVisible) {
            this.dom.logMessages.classList.remove('hidden');
            this.dom.toggleLogButton.textContent = '-';
        } else {
            this.dom.logMessages.classList.add('hidden');
            this.dom.toggleLogButton.textContent = '+';
        }
    },

    saveGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.setItem(`zombieSurvivalGame_v${major}.${minor}`, JSON.stringify(this.state));
    },
    loadGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedGame = localStorage.getItem(`zombieSurvivalGame_v${major}.${minor}`);
        if (savedGame) {
            const loadedState = JSON.parse(savedGame);
            
            for (const key in this.state) {
                if (loadedState.hasOwnProperty(key)) {
                    if (key === 'discoveredLocations' && typeof loadedState[key] === 'object' && loadedState[key] !== null) {
                        for (const locId in loadedState.discoveredLocations) {
                            if (this.state.discoveredLocations[locId]) {
                                this.state.discoveredLocations[locId] = { ...this.state.discoveredLocations[locId], ...loadedState.discoveredLocations[locId] };
                            } else {
                                this.state.discoveredLocations[locId] = loadedState.discoveredLocations[locId];
                            }
                            const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                            if (locDef && this.state.discoveredLocations[locId].searchAttemptsLeft === undefined) {
                                this.state.discoveredLocations[locId].searchAttemptsLeft = locDef.initialSearchAttempts;
                            }
                            if (this.state.discoveredLocations[locId].foundSpecialItems === undefined) {
                                 this.state.discoveredLocations[locId].foundSpecialItems = {};
                            }
                        }
                    } else if (key === 'baseInventory' && Array.isArray(loadedState[key])) { 
                        this.state.baseInventory = loadedState[key];
                    }
                    else if (typeof this.state[key] === 'object' && this.state[key] !== null && !Array.isArray(this.state[key])) {
                        this.state[key] = { ...this.state[key], ...loadedState[key] };
                    } else {
                        this.state[key] = loadedState[key];
                    }
                }
            }
             if (!this.state.baseInventory) this.state.baseInventory = []; 

            if (!this.state.currentLocationId) this.state.currentLocationId = "base_surroundings";
            if (!this.state.discoveredLocations || Object.keys(this.state.discoveredLocations).length === 0) {
                const baseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5};
                this.state.discoveredLocations = { "base_surroundings": { discovered: true, name: baseLocDef.name, searchAttemptsLeft: baseLocDef.initialSearchAttempts, foundSpecialItems: {} } };
            } else { 
                 for (const locId in this.state.discoveredLocations) {
                     if (this.state.discoveredLocations[locId].discovered) {
                         const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                         if (locDef && this.state.discoveredLocations[locId].searchAttemptsLeft === undefined) {
                             this.state.discoveredLocations[locId].searchAttemptsLeft = locDef.initialSearchAttempts;
                         }
                          if (this.state.discoveredLocations[locId].foundSpecialItems === undefined) {
                             this.state.discoveredLocations[locId].foundSpecialItems = {};
                         }
                     }
                 }
            }

            if (this.state.flags === undefined) this.state.flags = {};
            const defaultStructureKeys = (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') ? Object.keys(BASE_STRUCTURE_DEFINITIONS) : [];
            defaultStructureKeys.forEach(key => {
                if (!this.state.structures[key]) {
                    this.state.structures[key] = { level: BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0 };
                }
            });

            if (loadedState.logVisible !== undefined) this.state.logVisible = loadedState.logVisible;
            else this.state.logVisible = true; 
            this.log("Сохраненная игра загружена.", "event-discovery");
        } else {
             this.log("Сохраненная игра не найдена, начинаем новую.", "event-neutral");
        }
    },

    nextDay: function() {
        if (this.state.gameOver) return;
        if (this.state.currentEvent || this.state.locationEvent) { 
            this.log("Завершите текущее событие.", "event-warning");
            return;
        }

        this.state.day++;
        this.log(`--- Наступил День ${this.state.day} ---`, "event-neutral");

        this.state.dailyFoodNeed = this.state.survivors * 10; 
        this.state.dailyWaterNeed = this.state.survivors * 15; 

        let foodConsumedFromBase = this.consumeResourceFromBase('food', this.state.dailyFoodNeed);
        let waterConsumedFromBase = this.consumeResourceFromBase('water', this.state.dailyWaterNeed);

        if (foodConsumedFromBase < this.state.dailyFoodNeed) {
            this.log(`На складе не хватило еды для всех выживших! Потреблено ${foodConsumedFromBase} из ${this.state.dailyFoodNeed} необходимых. Выжившие голодают!`, "event-negative");
            if (Math.random() < 0.2 * this.state.survivors) { 
                if (this.state.survivors > 0) {
                    this.state.survivors--;
                    this.log("Один из выживших умер от голода!", "event-negative");
                    if (this.state.survivors <= 0 && !this.state.gameOver) { this.gameOver("Все выжившие погибли от голода."); return; }
                }
            }
        } else {
            this.log(`Выжившие поели. Со склада потрачено ${foodConsumedFromBase} ед. сытости.`, "event-neutral");
        }

        if (waterConsumedFromBase < this.state.dailyWaterNeed) {
            this.log(`На складе не хватило воды для всех выживших! Потреблено ${waterConsumedFromBase} из ${this.state.dailyWaterNeed} необходимых. Выжившие страдают от жажды!`, "event-negative");
             if (Math.random() < 0.25 * this.state.survivors) { 
                if (this.state.survivors > 0) {
                    this.state.survivors--;
                    this.log("Один из выживших умер от обезвоживания!", "event-negative");
                    if (this.state.survivors <= 0 && !this.state.gameOver) { this.gameOver("Все выжившие погибли от жажды."); return; }
                }
            }
        } else {
             this.log(`Выжившие попили. Со склада потрачено ${waterConsumedFromBase} ед. утоления жажды.`, "event-neutral");
        }
        
        this.triggerRandomEvent(); 
        
        if (!this.state.currentEvent && !this.state.locationEvent && document.getElementById('main-tab').style.display === 'block') {
             this.dom.eventActionsContainer.style.display = 'none';
             this.dom.eventTextDisplay.textContent = '';
             this.dom.eventActions.innerHTML = '';
        }

        this.updateDisplay();
        this.updateBuildActions();
        this.saveGame();
    },
    
    consumeResourceFromBase: function(resourceType, amountNeeded) {
        let amountFulfilled = 0;
        const inventory = this.state.baseInventory;
        
        inventory.sort((aSlot, bSlot) => {
            const aDef = ITEM_DEFINITIONS[aSlot.itemId];
            const bDef = ITEM_DEFINITIONS[bSlot.itemId];
            let aValue = 0; let bValue = 0;

            if (resourceType === 'food') {
                aValue = (aDef.effect?.hunger || 0) * (aDef.effect?.sickness_chance || aDef.effect?.radiation ? 0.5 : 1);
                bValue = (bDef.effect?.hunger || 0) * (bDef.effect?.sickness_chance || bDef.effect?.radiation ? 0.5 : 1);
            } else if (resourceType === 'water') {
                aValue = (aDef.effect?.thirst || 0) * (aDef.effect?.sickness_chance ? 0.5 : 1);
                bValue = (bDef.effect?.thirst || 0) * (bDef.effect?.sickness_chance ? 0.5 : 1);
            }
            return aValue - bValue; 
        });

        for (let i = 0; i < inventory.length && amountFulfilled < amountNeeded; ) { // Убрал i++ из for
            const slot = inventory[i];
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            let itemValue = 0;
            let isCorrectType = false;
            let sicknessThisItem = false;

            if (resourceType === 'food' && itemDef.type === 'food' && itemDef.effect?.hunger) {
                itemValue = itemDef.effect.hunger;
                isCorrectType = true;
                if (itemDef.effect?.radiation && Math.random() < 0.1 * this.state.survivors) { // Шанс получить рад. от этой еды
                    this.log(`Кто-то получил дозу радиации от ${itemDef.name}.`, "event-warning");
                }
            } else if (resourceType === 'water' && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect?.thirst) {
                itemValue = itemDef.effect.thirst;
                isCorrectType = true;
                 if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance * this.state.survivors * 0.05) { 
                    this.log(`Кто-то из выживших заболел, выпив ${itemDef.name} со склада.`, "event-warning");
                    sicknessThisItem = true; // Не реализована механика болезней, но флаг есть
                }
            }

            if (isCorrectType && itemValue > 0) {
                const neededFromThisSlot = Math.ceil((amountNeeded - amountFulfilled) / itemValue);
                const canConsumeFromSlot = Math.min(slot.quantity, neededFromThisSlot);
                
                amountFulfilled += canConsumeFromSlot * itemValue;
                // Важно: removeItemFromInventory может изменить длину массива inventory, поэтому i не инкрементируем здесь
                if (this.removeItemFromInventory(this.state.baseInventory, slot.itemId, canConsumeFromSlot, i)) {
                    // Если элемент был полностью удален или его количество уменьшилось,
                    // и мы не хотим пропустить следующий элемент (если он сдвинулся на место удаленного),
                    // то i не инкрементируем. Если же количество просто уменьшилось, можно инкрементировать.
                    // Проще всего не инкрементировать i в цикле, а делать это только если элемент не был удален.
                    // Однако, так как removeItemFromInventory удаляет элемент и массив сжимается,
                    // следующий элемент уже будет под индексом i. Поэтому, если мы УДАЛИЛИ элемент, i НЕ инкрементируем.
                    // Если просто уменьшили количество, то i инкрементируем.
                    // Текущая removeItemFromInventory удаляет если кол-во <= 0.
                    if (inventory[i] && inventory[i].itemId === slot.itemId && inventory[i].quantity > 0) { // Если слот остался и тот же предмет
                        i++;
                    } else if (!inventory[i] || inventory[i].itemId !== slot.itemId) { // Если слот удален или предмет изменился
                        // i не меняем, т.к. следующий элемент уже на этом индексе
                    } else { // На всякий случай
                        i++;
                    }
                } else { // Если по какой-то причине removeItemFromInventory вернул false
                    i++;
                }
            } else {
                 i++; // Если тип не тот или ценность 0, переходим к следующему
            }
        }
        return Math.min(amountFulfilled, amountNeeded); 
    },

    updateExploreTab: function() { 
        this.updateExploreTabDisplay();
        this.renderDiscoveredLocations();
    },

    updateExploreTabDisplay: function() { 
        const currentLocationId = this.state.currentLocationId;
        const currentLocationDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[currentLocationId] : null;
        const currentLocationState = this.state.discoveredLocations[currentLocationId];

        if (currentLocationDef && currentLocationState) {
            this.dom.currentLocationNameDisplay.textContent = currentLocationDef.name;
            this.dom.currentLocationDescriptionDisplay.textContent = `${currentLocationDef.description} (Попыток обыска: ${currentLocationState.searchAttemptsLeft || 0})`;
            this.dom.currentLocationTimeDisplay.textContent = currentLocationDef.scoutTime || 1;
            
            const canSearch = (currentLocationState.searchAttemptsLeft || 0) > 0;
            this.dom.scoutCurrentLocationButton.disabled = !canSearch || this.state.gameOver || this.state.currentEvent !== null || this.state.locationEvent !== null;
            this.dom.scoutCurrentLocationButton.textContent = canSearch ? `Обыскать (${currentLocationDef.scoutTime || 1} д.)` : "Локация обыскана";

        } else {
            this.dom.currentLocationNameDisplay.textContent = "Неизвестно";
            this.dom.currentLocationDescriptionDisplay.textContent = "Ошибка: текущая локация не найдена.";
            this.dom.scoutCurrentLocationButton.disabled = true;
            this.dom.scoutCurrentLocationButton.textContent = "Обыскать";
        }
        this.dom.discoverNewLocationButton.disabled = this.state.gameOver || this.state.currentEvent !== null || this.state.locationEvent !== null;
    },

    renderDiscoveredLocations: function() {
        this.dom.discoveredLocationsList.innerHTML = '';
        let hasDiscoveredOtherThanBase = false;
        for (const locId in this.state.discoveredLocations) {
            if (this.state.discoveredLocations[locId].discovered) {
                const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                if (!locDef) continue;
                if (locId !== "base_surroundings") hasDiscoveredOtherThanBase = true;

                const entryDiv = document.createElement('div');
                entryDiv.className = 'location-entry';
                if (locId === this.state.currentLocationId) {
                    entryDiv.classList.add('active-location');
                }
                entryDiv.onclick = () => this.setCurrentLocation(locId);

                let dangerText = "Низкая";
                let dangerClass = "low";
                if (locDef.dangerLevel === 2) { dangerText = "Средняя"; dangerClass = "medium"; }
                else if (locDef.dangerLevel === 3) { dangerText = "Высокая"; dangerClass = "high"; }
                else if (locDef.dangerLevel >= 4) { dangerText = "Очень высокая"; dangerClass = "very-high"; }
                
                entryDiv.innerHTML = `
                    <h4>${locDef.name}</h4>
                    <p>Тип: ${locDef.type || "Неизвестно"}, Опасность: <span class="location-danger ${dangerClass}">${dangerText}</span></p>
                `;
                this.dom.discoveredLocationsList.appendChild(entryDiv);
            }
        }
        if (!hasDiscoveredOtherThanBase && Object.keys(this.state.discoveredLocations).length <= 1) {
            this.dom.discoveredLocationsList.innerHTML = '<p><em>Используйте "Разведать новые территории", чтобы найти новые места.</em></p>';
        }
    },

    setCurrentLocation: function(locationId) {
        if ((typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS[locationId]) && this.state.discoveredLocations[locationId]?.discovered) {
            if (this.state.locationEvent || this.state.currentEvent) { 
                this.log("Сначала завершите текущее событие.", "event-warning");
                return;
            }
            this.state.currentLocationId = locationId;
            this.log(`Вы переместились в локацию: ${LOCATION_DEFINITIONS[locationId].name}.`, "event-neutral");
            this.updateExploreTab();
        } else {
            this.log("Невозможно переместиться в эту локацию.", "event-negative");
        }
    },

    discoverNewLocationAction: function() { 
        if (this.state.gameOver || this.state.currentEvent !== null || this.state.locationEvent !== null) return;
        this.log("Вы отправляетесь на разведку неизведанных территорий...", "event-neutral");

        const currentLocationDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[this.state.currentLocationId] : null;
        let newLocationFound = false;

        if (currentLocationDef && currentLocationDef.discoverableLocations) {
            for (const discoverable of currentLocationDef.discoverableLocations) {
                if (!this.state.discoveredLocations[discoverable.locationId]?.discovered && 
                    Math.random() < discoverable.chance &&
                    (typeof discoverable.condition === 'function' ? discoverable.condition() : true)) {
                    
                    const newLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[discoverable.locationId] : null;
                    if (newLocDef) {
                        this.state.discoveredLocations[discoverable.locationId] = { 
                            discovered: true, 
                            name: newLocDef.name,
                            searchAttemptsLeft: newLocDef.initialSearchAttempts, 
                            foundSpecialItems: {} 
                        };
                        this.log(`ОБНАРУЖЕНО! Новая локация: ${newLocDef.name}.`, "event-discovery");
                        newLocationFound = true;
                        this.renderDiscoveredLocations(); 
                        break; 
                    }
                }
            }
        }

        if (!newLocationFound) {
            this.log("Разведка не принесла новых открытий на этот раз.", "event-neutral");
        }
        this.nextDayForLocationAction(1); 
    },

    exploreCurrentLocationAction: function(actionType) { 
        if (this.state.gameOver || this.state.currentEvent !== null || this.state.locationEvent !== null) return;

        const locId = this.state.currentLocationId;
        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
        const locState = this.state.discoveredLocations[locId];

        if (!locDef || !locState) {
            this.log("Ошибка: текущая локация не определена.", "event-negative");
            return;
        }

        if (actionType === 'search') {
            if (locState.searchAttemptsLeft <= 0) {
                this.log(`Локация ${locDef.name} уже полностью обыскана.`, "event-neutral");
                this.updateExploreTabDisplay(); 
                return;
            }

            this.log(`Вы начинаете обыскивать локацию: ${locDef.name}...`, "event-neutral");
            let itemsFoundCount = 0;
            let specialItemFoundThisTurn = false;

            if (locDef.specialFinds && locDef.specialFinds.length > 0) {
                for (const special of locDef.specialFinds) {
                    const flagId = special.oneTimeFlag || `${locId}_${special.itemId}_found`; 
                    if (!this.state.flags[flagId] && (!locState.foundSpecialItems || !locState.foundSpecialItems[special.itemId])) { 
                        if (Math.random() < (special.findChance || 0.1)) { 
                            if (this.addItemToInventory(this.state.inventory, special.itemId, special.quantity || 1)) { // Лут с локаций идет игроку
                                this.log(special.descriptionLog || `ОСОБАЯ НАХОДКА: ${ITEM_DEFINITIONS[special.itemId].name}!`, "event-discovery");
                                itemsFoundCount++;
                                specialItemFoundThisTurn = true;
                                this.state.flags[flagId] = true; 
                                if (!locState.foundSpecialItems) locState.foundSpecialItems = {};
                                locState.foundSpecialItems[special.itemId] = true; 
                                break; 
                            } else {
                                this.log(`Нашли ${ITEM_DEFINITIONS[special.itemId].name}, но не смогли унести!`, "event-warning");
                            }
                        }
                    }
                }
            }

            if (!specialItemFoundThisTurn || (locDef.specialFindsContinueSearch)) { 
                if (locDef.lootTable) {
                    locDef.lootTable.forEach(lootEntry => {
                        if (Math.random() < lootEntry.chance) {
                            const quantity = Math.floor(Math.random() * (lootEntry.quantity[1] - lootEntry.quantity[0] + 1)) + lootEntry.quantity[0];
                            if (this.addItemToInventory(this.state.inventory, lootEntry.itemId, quantity)) { // Лут с локаций идет игроку
                                this.log(`Найдено: ${ITEM_DEFINITIONS[lootEntry.itemId].name} (x${quantity})`, "event-positive");
                                itemsFoundCount++;
                            } else {
                                this.log(`Нашли ${ITEM_DEFINITIONS[lootEntry.itemId].name} (x${quantity}), но не смогли унести (перевес!).`, "event-warning");
                            }
                        }
                    });
                }
            }
            
            locState.searchAttemptsLeft = Math.max(0, locState.searchAttemptsLeft - 1);
            this.updateExploreTabDisplay(); 

            if (locDef.specialEvents && locDef.specialEvents.length > 0 && !this.state.locationEvent) { 
                for (const eventDef of locDef.specialEvents) {
                    const flagId = eventDef.id + "_" + locId; 
                    if (Math.random() < eventDef.chance &&
                        (typeof eventDef.condition === 'function' ? eventDef.condition() : true) &&
                        (!this.state.flags[flagId] || eventDef.repeatable) 
                       ) {
                        this.state.locationEvent = { ...eventDef, flagId: flagId }; 
                        this.log(`СОБЫТИЕ НА ЛОКАЦИИ: ${eventDef.text}`, "event-discovery");
                        this.displayLocationEventChoices();
                        return; 
                    }
                }
            }
            
            if (itemsFoundCount === 0 && !this.state.locationEvent && !specialItemFoundThisTurn) {
                this.log("Ничего ценного не найдено в этот раз.", "event-neutral");
            }
            if (!this.state.locationEvent) { 
                 this.nextDayForLocationAction(locDef.scoutTime || 1);
            }
        }
    },
    
    nextDayForLocationAction: function(daysSpent = 1) {
        this.log(`Исследование локации заняло ${daysSpent} дн.`, "event-neutral");
        for (let i = 0; i < daysSpent; i++) {
            if (this.state.gameOver) break;
            this.state.day++; 
            this.log(`--- Наступил День ${this.state.day} (после вылазки) ---`, "event-neutral");
            
            // Потребление ресурсов выжившими со склада (после вылазки)
            const foodNeed = this.state.survivors * 10;
            const waterNeed = this.state.survivors * 15;
            let foodConsumed = this.consumeResourceFromBase('food', foodNeed);
            let waterConsumed = this.consumeResourceFromBase('water', waterNeed);
            if (foodConsumed < foodNeed) this.log("Выжившие голодают после вылазки!", "event-negative");
            if (waterConsumed < waterNeed) this.log("Выжившие страдают от жажды после вылазки!", "event-negative");

            this.updateDisplay(); 
            this.triggerRandomEvent(); 
            if(this.state.gameOver) break; 
        }
        this.updateBuildActions(); 
        this.saveGame();
    },

    displayLocationEventChoices: function() {
        const eventContainer = this.dom.eventActionsContainer; 
        const eventTextEl = this.dom.eventTextDisplay;
        const eventButtonsEl = this.dom.eventActions;

        eventButtonsEl.innerHTML = ''; 
        if (!this.state.locationEvent) {
            eventContainer.style.display = 'none';
            this.updateExploreTabDisplay(); 
            return;
        }

        eventTextEl.textContent = this.state.locationEvent.text;
        eventContainer.style.display = 'block';
        this.dom.scoutCurrentLocationButton.disabled = true; 
        this.dom.discoverNewLocationButton.disabled = true;


        this.state.locationEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            if (typeof choice.action === 'function') { 
                 btn.onclick = () => {
                    if (this.state.locationEvent) {
                        choice.action(); 
                        this.state.locationEvent = null; 
                        this.finalizeEventUI();
                    }
                };
            } else if (choice.outcome) { 
                 btn.onclick = () => {
                    if (this.state.locationEvent) { 
                        const currentLocEvent = this.state.locationEvent; 
                        const outcome = choice.outcome;
                        if (outcome.log) this.log(outcome.log, outcome.type || "event-neutral");
                        if (outcome.addItems) {
                            outcome.addItems.forEach(item => this.addItemToInventory(this.state.inventory, item.itemId, item.quantity)); 
                        }
                        if (outcome.setFlag && currentLocEvent.flagId) this.state.flags[currentLocEvent.flagId] = true; 
                        
                        this.state.locationEvent = null; 
                        this.finalizeEventUI();
                    }
                };
            } else {
                console.error("Некорректное определение выбора в событии локации:", choice);
                btn.disabled = true;
            }
            eventButtonsEl.appendChild(btn);
        });
    },
    
    finalizeEventUI: function() { 
        this.dom.eventActions.innerHTML = ''; 
        this.dom.eventTextDisplay.textContent = '';
        this.dom.eventActionsContainer.style.display = 'none'; 
        this.updateDisplay(); 
        this.updateExploreTabDisplay(); 
        this.updateBuildActions(); 
        this.saveGame();
    },


    updateBuildActions: function() {
        this.dom.buildActions.innerHTML = ''; 
        for (const key in this.state.structures) {
            const definition = (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') ? BASE_STRUCTURE_DEFINITIONS[key] : null;
            const currentStructureState = this.state.structures[key];
            if (!definition) continue;

            const btn = document.createElement('button');
            btn.classList.add('tooltip-host'); 

            let costStringForTooltip = "";
            let canAffordAll = true;
            let atMaxLevel = currentStructureState.level >= definition.maxLevel;

            if (!atMaxLevel) {
                const costDef = getStructureUpgradeCost(key, currentStructureState.level);
                const costsForTooltip = [];
                for (const itemId in costDef) {
                    const required = costDef[itemId];
                    const has = this.countItemInInventory(this.state.baseInventory, itemId); 
                    costsForTooltip.push(`${ITEM_DEFINITIONS[itemId]? ITEM_DEFINITIONS[itemId].name : itemId}: ${has}/${required}`);
                    if (has < required) canAffordAll = false;
                }
                costStringForTooltip = costsForTooltip.length > 0 ? costsForTooltip.join('; ') : "";
            } else {
                costStringForTooltip = "Достигнут максимальный уровень.";
            }
            
            btn.innerHTML = `${definition.name} [${currentStructureState.level}]`; 
            
            const tooltipSpan = document.createElement('span');
            tooltipSpan.classList.add('tooltip-text');
            let tooltipContent = definition.description;
            if (!atMaxLevel && costStringForTooltip) {
                 tooltipContent += `<br>Стоимость (со склада): ${costStringForTooltip}`; 
            } else if (atMaxLevel) { 
                 tooltipContent += `<br>${costStringForTooltip}`;
            }

            tooltipSpan.innerHTML = tooltipContent;
            btn.appendChild(tooltipSpan);
            
            btn.onclick = () => this.build(key);
            btn.disabled = !canAffordAll || atMaxLevel || this.state.currentEvent !== null || this.state.locationEvent !== null || this.state.gameOver;
            this.dom.buildActions.appendChild(btn);
        }
    },
    build: function(structureKey) { 
        if (this.state.gameOver || this.state.currentEvent || this.state.locationEvent) return;
        const definition = (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') ? BASE_STRUCTURE_DEFINITIONS[structureKey] : null;
        const currentStructureState = this.state.structures[structureKey];
        if (!definition || !currentStructureState) return;
        if (currentStructureState.level >= definition.maxLevel) {
            this.log(`${definition.name} уже максимального уровня.`, "event-neutral");
            return;
        }

        const costDefinition = getStructureUpgradeCost(structureKey, currentStructureState.level);
        let canAfford = true;
        let missingResLog = [];

        for (const itemId in costDefinition) {
            const requiredQty = costDefinition[itemId];
            const currentQty = this.countItemInInventory(this.state.baseInventory, itemId); 
            if (currentQty < requiredQty) {
                canAfford = false;
                missingResLog.push(`${requiredQty - currentQty} ${ITEM_DEFINITIONS[itemId] ? ITEM_DEFINITIONS[itemId].name : itemId}`);
            }
        }

        if (canAfford) {
            for (const itemId in costDefinition) {
                this.removeItemFromInventory(this.state.baseInventory, itemId, costDefinition[itemId]); 
            }
            currentStructureState.level++;
            this.log(`${definition.name} улучшен до уровня ${currentStructureState.level}. Ресурсы взяты со склада.`, "event-positive");
            this.updateDisplay();
            this.updateBuildActions();
            this.saveGame();
        } else {
            this.log(`Недостаточно ресурсов на складе для ${definition.name}. Нужно еще: ${missingResLog.join(', ')}.`, "event-negative");
        }
    },

    possibleEvents: [
         {
            id: "found_survivor",
            condition: () => game.state.survivors < game.maxSurvivors && Math.random() < 0.08,
            text: "Вы слышите стук в ворота. Одинокий путник просит убежища.",
            choices: [
                { 
                    text: "Принять (+1 выживший)", 
                    action: function() { 
                        if (game.state.survivors < game.maxSurvivors) {
                            game.state.survivors++;
                            game.log("Новый выживший присоединился к вам.", "event-positive");
                        } else {
                            game.log("На базе нет места для нового выжившего.", "event-neutral");
                        }
                    }
                },
                { 
                    text: "Отказать", 
                    action: function() { game.log("Вы отказали путнику. Он ушел в неизвестность.", "event-neutral"); } 
                }
            ]
        },
        {
            id: "trader_visit",
            condition: () => Math.random() < 0.07,
            text: "К базе подошел торговец. Предлагает 3 'Стимулятора' за 15 'Металлолома' (с вашего личного инвентаря).",
            choices: [
                { 
                    text: "Обменять (Метал.-15, Стим.+3)", 
                    action: function() {
                        if (game.countItemInInventory(game.state.inventory, "scrap_metal") >= 15) {
                            game.removeItemFromInventory(game.state.inventory, "scrap_metal", 15);
                            game.addItemToInventory(game.state.inventory, "stimpack_fallout", 3); 
                            game.log("Сделка совершена. Вы получили стимуляторы.", "event-positive");
                        } else {
                            game.log("У вас недостаточно металлолома для обмена.", "event-negative");
                        }
                    }
                },
                { 
                    text: "Отказаться", 
                    action: function() { game.log("Торговец ушел, ворча себе под нос.", "event-neutral"); } 
                }
            ]
        },
        {
            id: "minor_horde_near_base",
            condition: () => Math.random() < 0.1 && game.state.day > 2, 
            text: "Небольшая группа зомби замечена неподалеку от базы! Они могут напасть.",
            choices: [
                { 
                    text: "Укрепить оборону (-5 дерева, -3 металла со склада)", 
                    action: function() {
                        if (game.countItemInInventory(game.state.baseInventory, "wood") >=5 && game.countItemInInventory(game.state.baseInventory, "scrap_metal") >=3){
                            game.removeItemFromInventory(game.state.baseInventory, "wood", 5);
                            game.removeItemFromInventory(game.state.baseInventory, "scrap_metal", 3);
                            game.log("Оборона усилена. Зомби не решились атаковать.", "event-positive");
                        } else {
                             game.log("Не хватило материалов на складе для укрепления! Зомби прорвались!", "event-negative");
                             if(!game.state.gameOver) game.takeDamage(10 * game.state.survivors, "атака зомби");
                             if(!game.state.gameOver && Math.random() < 0.2 * game.state.survivors && game.state.survivors > 0){
                                 game.state.survivors--;
                                 game.log("Один из выживших погиб во время атаки...", "event-negative");
                                 if(game.state.survivors <= 0 && !game.state.gameOver) game.gameOver("Все выжившие погибли.");
                             }
                        }
                    }
                },
                { 
                    text: "Рискнуть и ничего не делать", 
                    action: function() {
                         if (Math.random() < 0.6) { 
                            game.log("Зомби прошли мимо, не заметив базу.", "event-neutral");
                         } else {
                            game.log("Зомби атаковали неподготовленную базу!", "event-negative");
                            if(!game.state.gameOver) game.takeDamage(15 * game.state.survivors, "внезапная атака");
                             if(!game.state.gameOver && Math.random() < 0.3 * game.state.survivors && game.state.survivors > 0){
                                 game.state.survivors--;
                                 game.log("Потери среди выживших...", "event-negative");
                                 if(game.state.survivors <= 0 && !game.state.gameOver) game.gameOver("Все выжившие погибли.");
                             }
                         }
                    }
                }
            ]
        }
    ],
    triggerRandomEvent: function() { 
        if (this.state.currentEvent || this.state.locationEvent || this.state.gameOver) return; 

        const availableEvents = this.possibleEvents.filter(event => event.condition());
        if (availableEvents.length > 0) {
            this.state.currentEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            this.log(`СОБЫТИЕ: ${this.state.currentEvent.text}`, "event-discovery");
            this.displayEventChoices(); 
        } else {
            if (document.getElementById('main-tab').style.display === 'block') { 
                 this.dom.eventActionsContainer.style.display = 'none';
            }
        }
    },
    displayEventChoices: function() { 
        const eventContainer = this.dom.eventActionsContainer; 
        const eventTextEl = this.dom.eventTextDisplay;
        const eventButtonsEl = this.dom.eventActions;

        eventButtonsEl.innerHTML = ''; 
        if (!this.state.currentEvent) {
            eventContainer.style.display = 'none';
             this.updateExploreTabDisplay(); 
            return;
        }

        eventTextEl.textContent = this.state.currentEvent.text;
        eventContainer.style.display = 'block';

        this.dom.scoutCurrentLocationButton.disabled = true;
        this.dom.discoverNewLocationButton.disabled = true;

        this.state.currentEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            if (typeof choice.action === 'function') {
                btn.onclick = () => {
                    if (this.state.currentEvent) { 
                        choice.action(); 
                        this.state.currentEvent = null; 
                        this.finalizeEventUI();
                    }
                };
            } else {
                 console.error("Некорректное определение choice.action в глобальном событии:", choice);
                 btn.disabled = true;
            }
            eventButtonsEl.appendChild(btn);
        });
    },

    gameOver: function(message) {
        if(this.state.gameOver) return; 
        this.log(message, "event-negative");
        this.state.gameOver = true;
        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            const onclickAttr = button.getAttribute('onclick');
            // Проверяем, что это не кнопка сброса игры и не кнопка закрытия модального окна
            if(onclickAttr !== "game.resetGameConfirmation()" && onclickAttr !== "game.closeInventoryModal()") { 
                button.disabled = true;
            }
        });
        this.dom.eventActionsContainer.style.display = 'none'; 
    },
    
    resetGameConfirmation: function() {
        if (confirm("Вы уверены, что хотите начать игру заново? Весь прогресс будет потерян.")) {
            this.resetGame();
        }
    },

    resetGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.removeItem(`zombieSurvivalGame_v${major}.${minor}`);
        this.state.day = 1;
        this.state.survivors = 1;
        this.state.gameOver = false;
        this.state.currentEvent = null;
        this.state.locationEvent = null; 
        this.state.inventory = []; 
        this.state.baseInventory = []; 
        this.state.player = { 
            health: 100, maxHealth: 100,
            hunger: 100, maxHunger: 100,
            thirst: 100, maxThirst: 100,
            carryWeight: 0, maxCarryWeight: 25,
            condition: "В порядке",
        };
        const baseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5};
        this.state.currentLocationId = "base_surroundings"; 
        this.state.discoveredLocations = { 
            "base_surroundings": { 
                discovered: true, 
                name: baseLocDef.name,
                searchAttemptsLeft: baseLocDef.initialSearchAttempts,
                foundSpecialItems: {}
            } 
        }; 
        this.state.flags = {}; 
        this.state.logVisible = true; 
        
        this.initializeStructures();
        this.addInitialItemsToPlayer(); 
        this.addInitialItemsToBase();

        this.dom.logMessages.innerHTML = ''; 
        
        this.dom.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.applyLogVisibility();
        
        // Важно: Сначала обновить ExploreTab, чтобы кнопки стали активными (если не gameOver)
        // this.updateExploreTab(); // Вызывается внутри init -> updateDisplay -> updateExploreTabDisplay если вкладка открыта
        // this.updateDisplay(); // Вызывается в init
        // this.updateBuildActions(); // Вызывается в init

        // Вместо вызова init(), который может иметь побочные эффекты от loadGame,
        // просто переустанавливаем основные состояния и обновляем UI.
        this.updateDisplay(); 
        this.updateBuildActions();
        this.updateExploreTab();


        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            if(button.getAttribute('onclick') !== "game.resetGameConfirmation()" && button.getAttribute('onclick') !== "game.closeInventoryModal()") {
                 button.disabled = false;
            }
        });
        // После разблокировки, кнопки могут быть снова заблокированы, если не хватает ресурсов или есть событие
        this.updateBuildActions(); // Перепроверить доступность после разблокировки
        this.updateExploreTabDisplay(); // Перепроверить доступность после разблокировки


        const defaultNavLink = this.dom.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
        if (defaultNavLink) {
            this.openTab('main-tab', defaultNavLink);
        } else {
            this.openTab('main-tab', null); 
        }
        this.dom.eventActionsContainer.style.display = 'none'; 

        this.log("Новая игра начата.", "event-neutral");
        this.saveGame(); 
    }
};

window.onload = () => {
    // Проверка, что все внешние JS файлы загрузились (особенно LOCATION_DEFINITIONS и т.д.)
    if (typeof ITEM_DEFINITIONS !== 'undefined' && 
        typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined' &&
        typeof LOCATION_DEFINITIONS !== 'undefined') {
        game.init();
    } else {
        console.error("Один или несколько файлов определений (items, buildings, locations) не загружены!");
        // Можно показать сообщение об ошибке пользователю
        document.body.innerHTML = "<p style='color:red; font-size:18px; text-align:center; margin-top: 50px;'>Ошибка загрузки игровых данных. Пожалуйста, проверьте консоль и обновите страницу.</p>";
    }
};
