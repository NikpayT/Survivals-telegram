// script.js

const GAME_VERSION = "0.3.2"; // Версия: Прогресс-бары и Тултипы CSS

const game = {
    state: {
        day: 1,
        survivors: 1,
        gameOver: false,
        currentEvent: null,
        structures: {}, 
        
        inventory: [], 
        player: {
            health: 100,
            maxHealth: 100,
            hunger: 100, 
            maxHunger: 100,
            thirst: 100, 
            maxThirst: 100,
            carryWeight: 0,
            maxCarryWeight: 25, 
            condition: "В порядке", 
        },
        discoveredLocations: {}, 
        logVisible: true, 
    },

    get maxSurvivors() {
        let max = 0;
        if (this.state.structures.shelter && this.state.structures.shelter.level > 0) {
            max += BASE_STRUCTURE_DEFINITIONS.shelter.effect(this.state.structures.shelter.level).maxSurvivors;
        }
        return max || 1;
    },

    getHungerThresholds: function() { return { critical: 20, low: 40, normal: 100 }; },
    getThirstThresholds: function() { return { critical: 15, low: 35, normal: 100 }; },

    getTotalResourceValue: function(type) { 
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

    dom: {
        gameVersionDisplay: document.getElementById('game-version'),
        day: document.getElementById('day'),
        survivors: document.getElementById('survivors'),
        maxSurvivors: document.getElementById('max-survivors'),
        
        totalFoodValue: document.getElementById('total-food-value'),
        totalWaterValue: document.getElementById('total-water-value'),
        playerCondition: document.getElementById('player-condition'),

        healthBarOuter: document.getElementById('health-bar-outer'),
        healthBarInner: document.getElementById('health-bar-inner'),
        healthBarText: document.getElementById('health-bar-text'),
        hungerBarOuter: document.getElementById('hunger-bar-outer'),
        hungerBarInner: document.getElementById('hunger-bar-inner'),
        hungerBarText: document.getElementById('hunger-bar-text'),
        thirstBarOuter: document.getElementById('thirst-bar-outer'),
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

        discoveredLocationsContainer: document.getElementById('discovered-locations'), 
        craftingRecipesContainer: document.getElementById('crafting-recipes'), 
        
        sidebar: document.getElementById('sidebar'),
        mainNav: document.getElementById('main-nav'),
        mainContent: document.getElementById('main-content'),
        mainHeader: document.getElementById('main-header'),
        tabContentArea: document.getElementById('tab-content-area'),
        
        logPanel: document.getElementById('log-panel'),
        toggleLogButton: document.getElementById('toggle-log'),
    },

    init: function() {
        this.dom.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.initializeStructures();
        this.loadGame(); 
        
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedVersionKey = `zombieSurvivalGame_v${major}.${minor}`;

        if (!localStorage.getItem(savedVersionKey)) { 
            this.addInitialItems();
        }
        
        this.updateDisplay(); 
        this.updateBuildActions();
        
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
             console.error("Default nav link for main-tab not found during init.");
             // Fallback if somehow the default link is not found
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

    addInitialItems: function() {
        this.addItemToInventory("food_canned", 3);
        this.addItemToInventory("water_purified", 3);
        this.addItemToInventory("scrap_metal", 10);
        this.addItemToInventory("bandages_crude", 2);
        this.addItemToInventory("wood", 5);
    },

    openTab: function(tabName, clickedLinkElement) {
        this.dom.tabContentArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = "none");
        this.dom.mainNav.querySelectorAll('.nav-link').forEach(tl => tl.classList.remove("active"));
        
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.style.display = "block";
        } else {
            console.error("Tab not found: " + tabName);
            document.getElementById('main-tab').style.display = "block"; // Fallback to main tab
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
            } else {
                this.dom.eventTextDisplay.textContent = '';
                this.dom.eventActionsContainer.style.display = 'none';
            }
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

        const hungerTh = this.getHungerThresholds();
        const hungerPercent = Math.max(0, (player.hunger / player.maxHunger) * 100);
        this.dom.hungerBarInner.style.width = `${hungerPercent}%`;
        this.dom.hungerBarInner.classList.remove('critical', 'low');
        let hungerText = "Сыт";
        if (player.hunger <= 0) {
            hungerText = "Истощение!";
            this.dom.hungerBarInner.classList.add('critical');
            if (!this.state.gameOver) this.takeDamage(5, "голод"); 
        } else if (player.hunger <= hungerTh.critical) {
            hungerText = "Истощение";
            this.dom.hungerBarInner.classList.add('critical');
        } else if (player.hunger <= hungerTh.low) {
            hungerText = "Голод";
            this.dom.hungerBarInner.classList.add('low');
        }
        this.dom.hungerBarText.textContent = hungerText;

        const thirstTh = this.getThirstThresholds();
        const thirstPercent = Math.max(0, (player.thirst / player.maxThirst) * 100);
        this.dom.thirstBarInner.style.width = `${thirstPercent}%`;
        this.dom.thirstBarInner.classList.remove('critical', 'low');
        let thirstText = "Норма";
        if (player.thirst <= 0) {
            thirstText = "Обезвожен!";
            this.dom.thirstBarInner.classList.add('critical');
            if (!this.state.gameOver) this.takeDamage(10, "обезвоживание"); 
        } else if (player.thirst <= thirstTh.critical) {
            thirstText = "Сильная жажда";
            this.dom.thirstBarInner.classList.add('critical');
        } else if (player.thirst <= thirstTh.low) {
            thirstText = "Жажда";
            this.dom.thirstBarInner.classList.add('low');
        }
        this.dom.thirstBarText.textContent = thirstText;
        
        this.dom.playerCondition.textContent = this.state.player.condition;

        if (this.dom.inventoryModal.style.display === 'block') {
            const activeFilter = this.dom.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            this.renderInventory(activeFilter);
        }
    },

    consumeItem: function(itemId, inventoryItemIndex) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef || !itemDef.effect) {
            this.log(`Предмет '${itemDef.name}' не является употребляемым.`, "event-neutral");
            return;
        }

        let consumed = false;
        if (itemDef.type === "food" && itemDef.effect.hunger) {
            this.state.player.hunger = Math.min(this.state.player.maxHunger, this.state.player.hunger + itemDef.effect.hunger);
            this.log(`Вы съели: ${itemDef.name}. Сытость +${itemDef.effect.hunger}.`, "event-positive");
            consumed = true;
        } else if ((itemDef.type === "water" || itemDef.type === "water_source") && itemDef.effect.thirst) {
            if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance) {
                this.log(`Вы выпили ${itemDef.name}, но почувствовали себя хуже. Возможно, отравление.`, "event-negative");
                this.state.player.condition = "Подташнивает"; 
            } else {
                this.state.player.thirst = Math.min(this.state.player.maxThirst, this.state.player.thirst + itemDef.effect.thirst);
                this.log(`Вы выпили: ${itemDef.name}. Жажда утолена на +${itemDef.effect.thirst}.`, "event-positive");
            }
            consumed = true;
        } else if (itemDef.type === "medicine" && itemDef.effect.healing) {
            this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + itemDef.effect.healing);
             this.log(`Вы использовали ${itemDef.name}. Здоровье +${itemDef.effect.healing}.`, "event-positive");
            consumed = true;
        }

        if (consumed) {
            this.removeItemFromInventory(itemId, 1, inventoryItemIndex); 
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
        this.updatePlayerStatus(); // Обновит бары и текст
    },

    addItemToInventory: function(itemId, quantity = 1) {
        if (!ITEM_DEFINITIONS[itemId]) {
            console.error(`Попытка добавить несуществующий предмет: ${itemId}`);
            return false;
        }
        const itemDef = ITEM_DEFINITIONS[itemId];
        
        if (this.state.player.carryWeight + (itemDef.weight * quantity) > this.state.player.maxCarryWeight) {
            this.log(`Недостаточно места в инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
            return false; 
        }

        const existingItemIndex = this.state.inventory.findIndex(slot => slot.itemId === itemId && itemDef.stackable);
        if (existingItemIndex > -1) {
            this.state.inventory[existingItemIndex].quantity += quantity;
        } else {
            this.state.inventory.push({ itemId: itemId, quantity: quantity });
        }
        this.state.player.carryWeight += itemDef.weight * quantity;
        this.state.player.carryWeight = parseFloat(this.state.player.carryWeight.toFixed(2)); 
        
        this.updateDisplay(); 
        return true; 
    },

    removeItemFromInventory: function(itemId, quantity = 1, specificIndex = -1) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) return false;

        let itemIndex;
        if (specificIndex > -1 && this.state.inventory[specificIndex] && this.state.inventory[specificIndex].itemId === itemId) {
            itemIndex = specificIndex;
        } else {
            itemIndex = this.state.inventory.findIndex(slot => slot.itemId === itemId);
        }

        if (itemIndex > -1) {
            const itemSlot = this.state.inventory[itemIndex];
            if (itemSlot.quantity > quantity) {
                itemSlot.quantity -= quantity;
            } else {
                quantity = itemSlot.quantity; 
                this.state.inventory.splice(itemIndex, 1);
            }
            this.state.player.carryWeight -= itemDef.weight * quantity;
            this.state.player.carryWeight = Math.max(0, parseFloat(this.state.player.carryWeight.toFixed(2)));
            this.updateDisplay();
            return true;
        }
        return false; 
    },
    
    countItemInInventory: function(itemId) {
        let count = 0;
        this.state.inventory.forEach(slot => {
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
        if (this.state.inventory.length === 0) {
            this.dom.inventoryItemsList.innerHTML = '<p>Инвентарь пуст.</p>';
            this.updateInventoryWeightDisplay();
            return;
        }
        
        let somethingRendered = false;
        this.state.inventory.forEach((itemSlot, index) => {
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
                itemActionsHTML += `<button onclick="game.consumeItem('${itemSlot.itemId}', ${index})">Использовать</button>`;
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

    updateDisplay: function() {
        this.dom.day.textContent = this.state.day;
        this.dom.survivors.textContent = this.state.survivors;
        this.dom.maxSurvivors.textContent = this.maxSurvivors;
        
        this.updatePlayerStatus(); 
        this.updateInventoryWeightDisplay(); 

        this.dom.totalFoodValue.textContent = this.getTotalResourceValue('food');
        this.dom.totalWaterValue.textContent = this.getTotalResourceValue('water_source');

        if (this.dom.inventoryModal.style.display === 'block') {
            const activeFilter = this.dom.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            this.renderInventory(activeFilter);
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
                    if (typeof this.state[key] === 'object' && this.state[key] !== null && !Array.isArray(this.state[key])) {
                        this.state[key] = { ...this.state[key], ...loadedState[key] };
                    } else {
                        this.state[key] = loadedState[key];
                    }
                }
            }
            
            const defaultStructureKeys = Object.keys(BASE_STRUCTURE_DEFINITIONS);
            defaultStructureKeys.forEach(key => {
                if (!this.state.structures[key]) {
                    this.state.structures[key] = { level: BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0 };
                }
            });

            if (loadedState.logVisible !== undefined) {
                this.state.logVisible = loadedState.logVisible;
            } else {
                this.state.logVisible = true; 
            }
            // applyLogVisibility будет вызван в init после loadGame

            this.log("Сохраненная игра загружена.", "event-discovery");
        } else {
             this.log("Сохраненная игра не найдена, начинаем новую.", "event-neutral");
        }
    },

    nextDay: function() {
        if (this.state.gameOver) return;
        if (this.state.currentEvent) {
            this.log("Завершите текущее событие.", "event-warning");
            return;
        }

        this.state.day++;
        this.log(`--- Наступил День ${this.state.day} ---`, "event-neutral");

        this.state.player.hunger -= (15 + this.state.survivors * 3); 
        this.state.player.thirst -= (20 + this.state.survivors * 4); 
        this.state.player.hunger = Math.max(0, this.state.player.hunger);
        this.state.player.thirst = Math.max(0, this.state.player.thirst);
        
        this.triggerRandomEvent();
        
        if (!this.state.currentEvent && document.getElementById('main-tab').style.display === 'block') {
             this.dom.eventActionsContainer.style.display = 'none';
             this.dom.eventTextDisplay.textContent = '';
             this.dom.eventActions.innerHTML = '';
        }

        this.updateDisplay();
        this.updateBuildActions();
        this.saveGame();
    },

    scoutArea: function() { 
        if (this.state.gameOver || this.state.currentEvent) return;
        this.log("Вы отправляетесь на разведку окрестностей...", "event-neutral");
        
        let encounter = Math.random();
        let foundSomething = false;

        if (encounter < 0.7) { 
            const lootRoll = Math.random();
            let itemFoundId = null;
            let quantityFound = 0;

            if (lootRoll < 0.3) { itemFoundId = "food_scraps"; quantityFound = Math.floor(Math.random() * 3) + 1; }
            else if (lootRoll < 0.5) { itemFoundId = "water_dirty"; quantityFound = Math.floor(Math.random() * 2) + 1; }
            else if (lootRoll < 0.75) { itemFoundId = "scrap_metal"; quantityFound = Math.floor(Math.random() * 4) + 1; }
            else if (lootRoll < 0.9) { itemFoundId = "wood"; quantityFound = Math.floor(Math.random() * 5) + 2; }
            else { itemFoundId = "cloth"; quantityFound = Math.floor(Math.random() * 3) + 1; }
            
            if (itemFoundId && this.addItemToInventory(itemFoundId, quantityFound)) {
                 this.log(`Найдено: ${ITEM_DEFINITIONS[itemFoundId].name} (x${quantityFound}).`, "event-positive");
                 foundSomething = true;
            }

            if (Math.random() < 0.15) { 
                if (this.addItemToInventory("components", 1)) {
                    this.log("Удалось найти редкие компоненты!", "event-discovery");
                    foundSomething = true;
                }
            }

        } else if (encounter < 0.9) { 
            this.log("Разведка оказалась опасной. Вы едва унесли ноги.", "event-negative");
            this.takeDamage(Math.floor(Math.random() * 10) + 5, "засада");
        } else { 
             this.log("Разведка не принесла результатов.", "event-neutral");
        }
        
        if(!foundSomething && !(encounter < 0.7)) { 
        } else if (!foundSomething && encounter < 0.7) { 
             this.log("Что-то нашли, но не смогли унести.", "event-warning");
        }

        this.nextDay(); 
    },

    build: function(structureKey) {
        if (this.state.gameOver || this.state.currentEvent) return;
        const definition = BASE_STRUCTURE_DEFINITIONS[structureKey];
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
            const currentQty = this.countItemInInventory(itemId);
            if (currentQty < requiredQty) {
                canAfford = false;
                missingResLog.push(`${requiredQty - currentQty} ${ITEM_DEFINITIONS[itemId] ? ITEM_DEFINITIONS[itemId].name : itemId}`);
            }
        }

        if (canAfford) {
            for (const itemId in costDefinition) {
                this.removeItemFromInventory(itemId, costDefinition[itemId]);
            }
            currentStructureState.level++;
            this.log(`${definition.name} улучшен до уровня ${currentStructureState.level}.`, "event-positive");
            this.updateDisplay();
            this.updateBuildActions();
            this.saveGame();
        } else {
            this.log(`Недостаточно ресурсов для ${definition.name}. Нужно еще: ${missingResLog.join(', ')}.`, "event-negative");
        }
    },
    
    updateBuildActions: function() {
        this.dom.buildActions.innerHTML = ''; 
        for (const key in this.state.structures) {
            const definition = BASE_STRUCTURE_DEFINITIONS[key];
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
                    const has = this.countItemInInventory(itemId);
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
                 tooltipContent += `<br>Стоимость: ${costStringForTooltip}`; 
            } else if (atMaxLevel && costStringForTooltip !== "Достигнут максимальный уровень.") { // Если макс уровень, но costStringForTooltip все равно был сформирован (ошибка логики)
                tooltipContent += `<br>${costStringForTooltip}`;
            } else if (atMaxLevel) {
                 // Уже учтено в costStringForTooltip
            }

            tooltipSpan.innerHTML = tooltipContent;
            btn.appendChild(tooltipSpan);
            
            btn.onclick = () => this.build(key);
            btn.disabled = !canAffordAll || atMaxLevel || this.state.currentEvent !== null || this.state.gameOver;
            this.dom.buildActions.appendChild(btn);
        }
    },

    possibleEvents: [
         {
            id: "found_survivor",
            condition: () => game.state.survivors < game.maxSurvivors && Math.random() < 0.08,
            text: "Вы слышите стук в ворота. Одинокий путник просит убежища.",
            choices: [
                { text: "Принять (+1 выживший)", action: () => {
                    if (game.state.survivors < game.maxSurvivors) {
                        game.state.survivors++;
                        game.log("Новый выживший присоединился к вам.", "event-positive");
                    } else {
                        game.log("На базе нет места для нового выжившего.", "event-neutral");
                    }
                }},
                { text: "Отказать", action: () => game.log("Вы отказали путнику. Он ушел в неизвестность.", "event-neutral") }
            ]
        },
        {
            id: "trader_visit",
            condition: () => Math.random() < 0.07,
            text: "К базе подошел торговец. Предлагает 3 'Стимулятора' за 15 'Металлолома'.",
            choices: [
                { text: "Обменять (Метал.-15, Стим.+3)", action: () => {
                    if (game.countItemInInventory("scrap_metal") >= 15) {
                        game.removeItemFromInventory("scrap_metal", 15);
                        game.addItemToInventory("stimpack_fallout", 3);
                        game.log("Сделка совершена. Вы получили стимуляторы.", "event-positive");
                    } else {
                        game.log("Недостаточно металлолома для обмена.", "event-negative");
                    }
                }},
                { text: "Отказаться", action: () => game.log("Торговец ушел, ворча себе под нос.", "event-neutral") }
            ]
        },
        {
            id: "minor_horde_near_base",
            condition: () => Math.random() < 0.1,
            text: "Небольшая группа зомби замечена неподалеку от базы! Они могут напасть.",
            choices: [
                { text: "Укрепить оборону (-5 дерева, -3 металла)", action: () => {
                    if (game.countItemInInventory("wood") >=5 && game.countItemInInventory("scrap_metal") >=3){
                        game.removeItemFromInventory("wood", 5);
                        game.removeItemFromInventory("scrap_metal", 3);
                        game.log("Оборона усилена. Зомби не решились атаковать.", "event-positive");
                    } else {
                         game.log("Не хватило материалов для укрепления! Зомби прорвались!", "event-negative");
                         if(!game.state.gameOver) game.takeDamage(10 * game.state.survivors, "атака зомби");
                         if(!game.state.gameOver && Math.random() < 0.2 * game.state.survivors && game.state.survivors > 0){
                             game.state.survivors--;
                             game.log("Один из выживших погиб во время атаки...", "event-negative");
                             if(game.state.survivors <= 0 && !game.state.gameOver) game.gameOver("Все выжившие погибли.");
                         }
                    }
                }},
                { text: "Рискнуть и ничего не делать", action: () => {
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
                }}
            ]
        }
    ],
    triggerRandomEvent: function() {
        if (this.state.currentEvent || this.state.gameOver) return;

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
            return;
        }

        eventTextEl.textContent = this.state.currentEvent.text;
        eventContainer.style.display = 'block';

        this.state.currentEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.onclick = () => {
                if (this.state.currentEvent) { // Доп. проверка, чтобы избежать двойного срабатывания
                    choice.action();
                    this.state.currentEvent = null; // Сбрасываем событие сразу
                    eventButtonsEl.innerHTML = ''; 
                    eventTextEl.textContent = '';
                    eventContainer.style.display = 'none'; 
                    this.updateDisplay(); 
                    this.saveGame();
                }
            };
            eventButtonsEl.appendChild(btn);
        });
    },

    gameOver: function(message) {
        if(this.state.gameOver) return; 
        this.log(message, "event-negative");
        this.state.gameOver = true;
        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            if(!button.closest('footer') && button.onclick !== game.resetGameConfirmation) { 
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
        this.state.inventory = []; 
        this.state.player = { 
            health: 100, maxHealth: 100,
            hunger: 100, maxHunger: 100,
            thirst: 100, maxThirst: 100,
            carryWeight: 0, maxCarryWeight: 25,
            condition: "В порядке",
        };
        this.state.discoveredLocations = {};
        this.state.logVisible = true; 
        
        this.initializeStructures();
        this.addInitialItems(); 

        this.dom.logMessages.innerHTML = ''; 
        // this.init(); // Не вызываем полный init, чтобы не было двойной загрузки и т.д.
        
        // Восстанавливаем DOM и обработчики, которые могли быть изменены/удалены в init или gameOver
        this.dom.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.applyLogVisibility();
        this.updateDisplay();
        this.updateBuildActions();

        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            button.disabled = false;
        });
        const defaultNavLink = this.dom.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
        if (defaultNavLink) {
            this.openTab('main-tab', defaultNavLink);
        }
        this.dom.eventActionsContainer.style.display = 'none'; 

        this.log("Новая игра начата.", "event-neutral");
        this.saveGame(); // Сохраняем чистое состояние новой игры
    }
};

window.onload = () => {
    game.init();
};
