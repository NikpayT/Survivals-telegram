// script.js

const GAME_VERSION = "0.3.1"; // Обновляем версию

const game = {
    state: {
        day: 1,
        survivors: 1,
        gameOver: false,
        currentEvent: null,
        structures: {}, // Заполняется из buildings.js
        
        inventory: [], // Массив объектов { itemId: "id", quantity: N }
        player: {
            health: 100,
            maxHealth: 100,
            hunger: 100, 
            maxHunger: 100,
            thirst: 100, 
            maxThirst: 100,
            carryWeight: 0,
            maxCarryWeight: 25, // кг
            condition: "В порядке", 
        },
        discoveredLocations: {}, 
        logVisible: true, // Для скрытия/показа лога
    },

    // --- GETTERS для вычисляемых свойств ---
    get maxSurvivors() {
        let max = 0;
        if (this.state.structures.shelter && this.state.structures.shelter.level > 0) {
            max += BASE_STRUCTURE_DEFINITIONS.shelter.effect(this.state.structures.shelter.level).maxSurvivors;
        }
        return max || 1;
    },

    getHungerThresholds: function() { return { critical: 20, low: 40, normal: 100 }; },
    getThirstThresholds: function() { return { critical: 15, low: 35, normal: 100 }; },

    getTotalResourceValue: function(type) { // type: 'food', 'water_source' (для общего отображения)
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

    // --- DOM ELEMENTS ---
    dom: {
        gameVersionDisplay: document.getElementById('game-version'),
        day: document.getElementById('day'),
        survivors: document.getElementById('survivors'),
        maxSurvivors: document.getElementById('max-survivors'),
        
        hungerStatus: document.getElementById('hunger-status'),
        totalFoodValue: document.getElementById('total-food-value'),
        thirstStatus: document.getElementById('thirst-status'),
        totalWaterValue: document.getElementById('total-water-value'),
        healthStatus: document.getElementById('health-status'),
        playerCondition: document.getElementById('player-condition'), // В main-header

        logMessages: document.getElementById('log-messages'),
        buildActions: document.getElementById('build-actions'), // Вкладка База
        eventActionsContainer: document.getElementById('event-actions-container'), // На вкладке Обзор
        eventTextDisplay: document.getElementById('event-text-display'),
        eventActions: document.getElementById('event-actions'), 
        
        inventoryButton: document.getElementById('inventory-button'), // В сайдбаре
        inventoryModal: document.getElementById('inventory-modal'),
        inventoryItemsList: document.getElementById('inventory-items-list'),
        inventoryWeight: document.getElementById('inventory-weight'),
        inventoryMaxWeight: document.getElementById('inventory-max-weight'),
        inventoryFilters: document.querySelector('.inventory-filters'),

        discoveredLocationsContainer: document.getElementById('discovered-locations'), // Вкладка Разведка
        craftingRecipesContainer: document.getElementById('crafting-recipes'), // Вкладка Крафт
        
        sidebar: document.getElementById('sidebar'),
        mainNav: document.getElementById('main-nav'),
        mainContent: document.getElementById('main-content'),
        mainHeader: document.getElementById('main-header'),
        tabContentArea: document.getElementById('tab-content-area'),
        
        logPanel: document.getElementById('log-panel'),
        toggleLogButton: document.getElementById('toggle-log'),
    },

    // --- INITIALIZATION ---
    init: function() {
        this.dom.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.initializeStructures();
        this.loadGame(); 
        
        if (!localStorage.getItem(`zombieSurvivalGame_v${GAME_VERSION.split('.')[0]}.${GAME_VERSION.split('.')[1]}`)) { 
            this.addInitialItems();
        }
        
        this.updateDisplay(); // Важно вызвать после загрузки и добавления предметов
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
        this.openTab('main-tab', this.dom.mainNav.querySelector('.nav-link[data-tab="main-tab"]'));
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

    // --- TABS ---
    openTab: function(tabName, clickedLinkElement) {
        this.dom.tabContentArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = "none");
        this.dom.mainNav.querySelectorAll('.nav-link').forEach(tl => tl.classList.remove("active"));
        
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.style.display = "block";
        } else {
            console.error("Tab not found: " + tabName);
            // Открыть первую вкладку по умолчанию, если запрошенная не найдена
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
            } else {
                this.dom.eventTextDisplay.textContent = '';
                this.dom.eventActionsContainer.style.display = 'none';
            }
        }
    },
    
    // --- PLAYER STATUS & CONSUMPTION ---
    updatePlayerStatus: function() {
        const hungerTh = this.getHungerThresholds();
        if (this.state.player.hunger <= 0) {
            this.state.player.hunger = 0;
            this.dom.hungerStatus.textContent = "Смертельный голод";
            this.dom.hungerStatus.className = 'status-critical';
            this.takeDamage(5, "голод"); 
        } else if (this.state.player.hunger <= hungerTh.critical) {
            this.dom.hungerStatus.textContent = "Истощение";
            this.dom.hungerStatus.className = 'status-critical';
        } else if (this.state.player.hunger <= hungerTh.low) {
            this.dom.hungerStatus.textContent = "Голод";
            this.dom.hungerStatus.className = 'status-needed';
        } else {
            this.dom.hungerStatus.textContent = "Сыт";
            this.dom.hungerStatus.className = 'status-ok';
        }

        const thirstTh = this.getThirstThresholds();
        if (this.state.player.thirst <= 0) {
            this.state.player.thirst = 0;
            this.dom.thirstStatus.textContent = "Смертельная жажда";
            this.dom.thirstStatus.className = 'status-critical';
            this.takeDamage(10, "обезвоживание"); 
        } else if (this.state.player.thirst <= thirstTh.critical) {
            this.dom.thirstStatus.textContent = "Сильная жажда";
            this.dom.thirstStatus.className = 'status-critical';
        } else if (this.state.player.thirst <= thirstTh.low) {
            this.dom.thirstStatus.textContent = "Жажда";
            this.dom.thirstStatus.className = 'status-needed';
        } else {
            this.dom.thirstStatus.textContent = "Норма";
            this.dom.thirstStatus.className = 'status-ok';
        }
        
        this.dom.healthStatus.textContent = `${this.state.player.health} / ${this.state.player.maxHealth}`;
        this.dom.playerCondition.textContent = this.state.player.condition; // Обновление состояния в хедере

        if (this.dom.inventoryModal.style.display === 'block') {
            this.renderInventory();
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
        this.updateDisplay(); // Обновит все, включая PlayerStatus и вес в инвентаре
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

    // --- INVENTORY MANAGEMENT ---
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
        
        let SOmethingRendered = false;
        this.state.inventory.forEach((itemSlot, index) => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (!itemDef) return;

            if (filterType !== 'all' && itemDef.type !== filterType) {
                if (filterType === 'water_source' && itemDef.type !== 'water' && itemDef.type !== 'water_source') return; // Особый случай для воды
                else if (filterType !== 'water_source') return; 
            }
            SOmethingRendered = true;

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

        if(!SOmethingRendered && filterType !== 'all') {
             this.dom.inventoryItemsList.innerHTML = `<p>Нет предметов типа '${filterType}'.</p>`;
        }
        this.updateInventoryWeightDisplay();
    },
    
    updateInventoryWeightDisplay: function() {
        this.dom.inventoryWeight.textContent = this.state.player.carryWeight.toFixed(1);
        this.dom.inventoryMaxWeight.textContent = this.state.player.maxCarryWeight;
    },

    // --- GAME LOGIC (Next Day, Scavenge, Build) ---
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
        localStorage.setItem(`zombieSurvivalGame_v${GAME_VERSION.split('.')[0]}.${GAME_VERSION.split('.')[1]}`, JSON.stringify(this.state));
    },
    loadGame: function() {
        const savedGame = localStorage.getItem(`zombieSurvivalGame_v${GAME_VERSION.split('.')[0]}.${GAME_VERSION.split('.')[1]}`);
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
            // this.applyLogVisibility(); // Вызывается в init после loadGame

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

        this.state.player.hunger -= (15 + this.state.survivors * 3); // Уменьшил потребление на выжившего
        this.state.player.thirst -= (20 + this.state.survivors * 4); // Уменьшил потребление на выжившего
        this.state.player.hunger = Math.max(0, this.state.player.hunger);
        this.state.player.thirst = Math.max(0, this.state.player.thirst);
        
        this.triggerRandomEvent();
        
        if (!this.state.currentEvent) {
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
        
        if(!foundSomething && !(encounter < 0.7)) { // Если не нашли и не было опасности (т.е. просто "ничего")
            // Уже залогировано как "не принесла результатов"
        } else if (!foundSomething && encounter < 0.7) { // Если был шанс найти, но addItemToInventory вернул false (перевес)
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
            let costString = "";
            let canAffordAll = true;
            let atMaxLevel = currentStructureState.level >= definition.maxLevel;

            if (!atMaxLevel) {
                const costDef = getStructureUpgradeCost(key, currentStructureState.level);
                const costs = [];
                for (const itemId in costDef) {
                    const required = costDef[itemId];
                    const has = this.countItemInInventory(itemId);
                    costs.push(`${ITEM_DEFINITIONS[itemId]? ITEM_DEFINITIONS[itemId].name.substring(0,10) : itemId}: ${has}/${required}`);
                    if (has < required) canAffordAll = false;
                }
                costString = costs.length > 0 ? `(${costs.join('; ')})` : "";
            } else {
                costString = "(МАКС)";
            }
            
            btn.innerHTML = `${definition.name} [${currentStructureState.level}] <small>${costString}</small>`;
            if (definition.description) btn.title = definition.description;
            btn.onclick = () => this.build(key);
            btn.disabled = !canAffordAll || atMaxLevel || this.state.currentEvent !== null || this.state.gameOver;
            this.dom.buildActions.appendChild(btn);
        }
    },

    // --- EVENTS ---
    possibleEvents: [
         {
            id: "found_survivor",
            condition: () => game.state.survivors < game.maxSurvivors && Math.random() < 0.08, // Уменьшил шанс
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
                         game.takeDamage(10 * game.state.survivors, "атака зомби");
                         if(Math.random() < 0.2 * game.state.survivors && game.state.survivors > 0){
                             game.state.survivors--;
                             game.log("Один из выживших погиб во время атаки...", "event-negative");
                         }
                    }
                }},
                { text: "Рискнуть и ничего не делать", action: () => {
                     if (Math.random() < 0.6) { // 60% шанс, что пронесет
                        game.log("Зомби прошли мимо, не заметив базу.", "event-neutral");
                     } else {
                        game.log("Зомби атаковали неподготовленную базу!", "event-negative");
                        game.takeDamage(15 * game.state.survivors, "внезапная атака");
                         if(Math.random() < 0.3 * game.state.survivors && game.state.survivors > 0){
                             game.state.survivors--;
                             game.log("Потери среди выживших...", "event-negative");
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
            if (document.getElementById('main-tab').style.display === 'block') { // Только если активна главная вкладка
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
                choice.action();
                this.state.currentEvent = null;
                eventButtonsEl.innerHTML = ''; 
                eventTextEl.textContent = '';
                eventContainer.style.display = 'none'; 
                this.updateDisplay(); // Обновить всё после действия события
                this.saveGame();
            };
            eventButtonsEl.appendChild(btn);
        });
    },

    // --- GAME OVER & RESET ---
    gameOver: function(message) {
        if(this.state.gameOver) return; // Предотвратить многократный вызов
        this.log(message, "event-negative");
        this.state.gameOver = true;
        // Блокируем кнопки действий, кроме "Начать заново"
        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            if(button.textContent !== "Начать игру заново" && !button.closest('footer')) { // Не блокируем кнопку в футере
                button.disabled = true;
            }
        });
        this.dom.eventActionsContainer.style.display = 'none'; // Скрыть панель событий
        // localStorage.removeItem(`zombieSurvivalGame_v${GAME_VERSION.split('.')[0]}.${GAME_VERSION.split('.')[1]}`); // Спорный момент, удалять ли сразу
    },
    
    resetGameConfirmation: function() {
        if (confirm("Вы уверены, что хотите начать игру заново? Весь прогресс будет потерян.")) {
            this.resetGame();
        }
    },

    resetGame: function() {
        localStorage.removeItem(`zombieSurvivalGame_v${GAME_VERSION.split('.')[0]}.${GAME_VERSION.split('.')[1]}`);
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

        this.dom.logMessages.innerHTML = ''; // Очистить лог на экране
        this.init(); 
        
        // Разблокировать кнопки
         document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            button.disabled = false;
        });
        this.updateBuildActions(); // Обновить доступность кнопок строительства (могут быть задизейблены из-за ресурсов)

        this.log("Новая игра начата.", "event-neutral");
    }
};

window.onload = () => {
    game.init();
};
