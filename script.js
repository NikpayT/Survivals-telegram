// script.js

const GAME_VERSION = "0.5.0"; // Версия: Крафтинг, Статистика на Обзоре, EntryLoot

// Используем gameState и domElements, определенные в game_state.js и dom_elements.js
// Предполагается, что эти файлы загружены РАНЬШЕ script.js в index.html

const game = {
    init: function() {
        domElements.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.initializeStructures();
        this.loadGame(); 
        
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedVersionKey = `zombieSurvivalGame_v${major}.${minor}`;

        if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0) {
            gameState.discoveredLocations = {}; 
        }
        const baseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]) ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []};
        if (!gameState.discoveredLocations["base_surroundings"] || 
            gameState.discoveredLocations["base_surroundings"].searchAttemptsLeft === undefined) {
            gameState.discoveredLocations["base_surroundings"] = { 
                discovered: true, 
                name: baseLocDef.name,
                searchAttemptsLeft: baseLocDef.initialSearchAttempts,
                foundSpecialItems: {}
            };
        }
        if (!gameState.currentLocationId) {
             gameState.currentLocationId = "base_surroundings";
        }
        if (!gameState.baseInventory) { 
            gameState.baseInventory = [];
        }


        if (!localStorage.getItem(savedVersionKey)) { 
            if (gameState.inventory.length === 0) this.addInitialItemsToPlayer(); 
            this.addInitialItemsToBase(); 
        }
        
        this.updateDisplay(); 
        this.updateBuildActions();
        this.updateExploreTab(); 
        
        domElements.inventoryButton.onclick = () => this.openInventoryModal();
        if(domElements.inventoryFilters) {
            domElements.inventoryFilters.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', (e) => this.filterPlayerInventory(e.target.dataset.filter));
            });
        }
        
        if (domElements.baseInventoryFilters) { 
            domElements.baseInventoryFilters.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', (e) => this.filterBaseInventory(e.target.dataset.filter));
            });
        }


        domElements.mainNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                this.openTab(e.target.dataset.tab, e.target);
                if (window.innerWidth <= 768 && domElements.sidebar.classList.contains('open')) { 
                    this.toggleSidebar();
                }
            });
        });
        
        domElements.toggleLogButton.addEventListener('click', () => this.toggleLogVisibility());
        this.applyLogVisibility();

        domElements.burgerMenuButton.onclick = () => this.toggleSidebar();


        this.log("Игра началась. Пустошь ждет.", "event-neutral");
        const defaultNavLink = domElements.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
        if (defaultNavLink) {
            this.openTab('main-tab', defaultNavLink);
        } else {
             this.openTab('main-tab', null);
        }
    },

    toggleSidebar: function() {
        domElements.sidebar.classList.toggle('open');
    },

    initializeStructures: function() {
        gameState.structures = {}; 
        if (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') {
            for (const key in BASE_STRUCTURE_DEFINITIONS) {
                const def = BASE_STRUCTURE_DEFINITIONS[key];
                gameState.structures[key] = {
                    level: def.initialLevel || 0,
                };
            }
        }
    },

    addInitialItemsToPlayer: function() { 
        this.addItemToInventory(gameState.inventory, "food_canned", 1); 
        this.addItemToInventory(gameState.inventory, "water_purified", 1);
        this.addItemToInventory(gameState.inventory, "bandages_crude", 1);
        this.addItemToInventory(gameState.inventory, "tool_hammer", 1); 
    },
    addInitialItemsToBase: function() {
        this.addItemToInventory(gameState.baseInventory, "food_canned", 5);
        this.addItemToInventory(gameState.baseInventory, "water_purified", 5);
        this.addItemToInventory(gameState.baseInventory, "scrap_metal", 10);
        this.addItemToInventory(gameState.baseInventory, "wood", 10);
        this.addItemToInventory(gameState.baseInventory, "cloth", 5);
        this.addItemToInventory(gameState.baseInventory, "broken_electronics", 2);
    },

    openTab: function(tabName, clickedLinkElement) {
        domElements.tabContentArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = "none");
        domElements.mainNav.querySelectorAll('.nav-link').forEach(tl => tl.classList.remove("active"));
        
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.style.display = "block";
        } else {
            console.error("Tab not found: " + tabName);
            document.getElementById('main-tab').style.display = "block"; 
            const defaultLink = domElements.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
            if (defaultLink) defaultLink.classList.add('active');
            return;
        }

        if (clickedLinkElement) {
            clickedLinkElement.classList.add("active");
        } else { 
            const linkToActivate = domElements.mainNav.querySelector(`.nav-link[data-tab="${tabName}"]`);
            if (linkToActivate) linkToActivate.classList.add('active');
        }
        
        if (tabName === 'main-tab') {
            this.updateOverviewTabStats(); 
            if (gameState.currentEvent) { 
                domElements.eventTextDisplay.textContent = gameState.currentEvent.text;
                domElements.eventActionsContainer.style.display = 'block';
                this.displayEventChoices(); 
            } else if (gameState.locationEvent) { 
                 domElements.eventTextDisplay.textContent = gameState.locationEvent.text;
                 domElements.eventActionsContainer.style.display = 'block';
                 this.displayLocationEventChoices(); 
            }
            else {
                domElements.eventTextDisplay.textContent = '';
                domElements.eventActionsContainer.style.display = 'none';
            }
        } else if (tabName === 'explore-tab') {
            this.updateExploreTab(); 
        } else if (tabName === 'storage-tab') {
            this.filterBaseInventory('all'); 
        } else if (tabName === 'craft-tab') {
            this.renderCraftingRecipes();
        }
    },
    
    updatePlayerStatus: function() {
        const player = gameState.player;

        const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
        domElements.healthBarInner.style.width = `${healthPercent}%`;
        domElements.healthBarText.textContent = `${player.health}/${player.maxHealth}`;
        domElements.healthBarInner.classList.remove('critical', 'low');
        if (healthPercent <= 25) domElements.healthBarInner.classList.add('critical');
        else if (healthPercent <= 50) domElements.healthBarInner.classList.add('low');

        domElements.hungerBarText.textContent = "Норма"; 
        domElements.hungerBarInner.style.width = `100%`; 
        domElements.thirstBarText.textContent = "Норма"; 
        domElements.thirstBarInner.style.width = `100%`; 
        
        domElements.playerCondition.textContent = gameState.player.condition;

        if (domElements.inventoryModal.style.display === 'block') {
            const activeFilter = domElements.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            this.renderPlayerInventory(activeFilter); 
        }
    },

    consumeItem: function(itemId, inventoryItemIndex, targetInventory = gameState.inventory) { 
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef || !itemDef.effect) {
            this.log(`Предмет '${itemDef.name}' не является употребляемым.`, "event-neutral");
            return;
        }

        let consumed = false;
        if (itemDef.type === "food" && itemDef.effect.hunger) {
            gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + itemDef.effect.hunger);
            this.log(`Вы съели: ${itemDef.name}. Сытость игрока +${itemDef.effect.hunger}.`, "event-positive");
            consumed = true;
        } else if ((itemDef.type === "water" || itemDef.type === "water_source") && itemDef.effect.thirst) {
            if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance) {
                this.log(`Вы выпили ${itemDef.name}, но почувствовали себя хуже. Возможно, отравление.`, "event-negative");
                gameState.player.condition = "Подташнивает"; 
            } else {
                gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + itemDef.effect.thirst);
                this.log(`Вы выпили: ${itemDef.name}. Жажда игрока утолена на +${itemDef.effect.thirst}.`, "event-positive");
            }
            consumed = true;
        } else if (itemDef.type === "medicine" && itemDef.effect.healing) {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + itemDef.effect.healing);
             this.log(`Вы использовали ${itemDef.name}. Здоровье игрока +${itemDef.effect.healing}.`, "event-positive");
            consumed = true;
        }

        if (consumed) {
            this.removeItemFromInventory(targetInventory, itemId, 1, inventoryItemIndex); 
        }
        this.updateDisplay(); 
    },

    takeDamage: function(amount, source) {
        if (gameState.gameOver) return;
        gameState.player.health -= amount;
        this.log(`Вы получили ${amount} урона (${source}).`, "event-negative");
        if (gameState.player.health <= 0) {
            gameState.player.health = 0;
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
        
        if (targetInventory === gameState.inventory && 
            (gameState.player.carryWeight + (itemDef.weight * quantity) > gameState.player.maxCarryWeight)) {
            this.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
            return false; 
        }

        const existingItemIndex = targetInventory.findIndex(slot => slot.itemId === itemId && itemDef.stackable);
        if (existingItemIndex > -1) {
            targetInventory[existingItemIndex].quantity += quantity;
        } else {
            targetInventory.push({ itemId: itemId, quantity: quantity });
        }
        
        if (targetInventory === gameState.inventory) { 
            gameState.player.carryWeight += itemDef.weight * quantity;
            gameState.player.carryWeight = parseFloat(gameState.player.carryWeight.toFixed(2)); 
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
            if (targetInventory === gameState.inventory) { 
                gameState.player.carryWeight -= itemDef.weight * removedQuantity;
                gameState.player.carryWeight = Math.max(0, parseFloat(gameState.player.carryWeight.toFixed(2)));
            }
            this.updateDisplay();
            return true;
        }
        return false; 
    },
    
    countItemInInventory: function(targetInventory, itemId) {
        let count = 0;
        if (!targetInventory || !Array.isArray(targetInventory)) return 0; 
        targetInventory.forEach(slot => {
            if (slot.itemId === itemId) {
                count += slot.quantity;
            }
        });
        return count;
    },

    openInventoryModal: function() {
        domElements.inventoryModal.style.display = 'block';
        this.filterPlayerInventory('all'); 
    },
    closeInventoryModal: function() {
        domElements.inventoryModal.style.display = 'none';
    },
    filterPlayerInventory: function(filterType) {
        if (domElements.inventoryFilters) {
            domElements.inventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            const activeButton = domElements.inventoryFilters.querySelector(`button[data-filter="${filterType}"]`);
            if (activeButton) activeButton.classList.add('active');
        }
        this.renderPlayerInventory(filterType);
    },
    renderPlayerInventory: function(filterType = 'all') { 
        domElements.inventoryItemsList.innerHTML = '';
        const inventoryToDisplay = gameState.inventory; 

        if (inventoryToDisplay.length === 0) {
            domElements.inventoryItemsList.innerHTML = '<p>Ваш инвентарь пуст.</p>';
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
                itemActionsHTML += `<button onclick="game.consumeItem('${itemSlot.itemId}', ${index}, gameState.inventory)">Использовать</button>`;
            }
            itemActionsHTML += `<button onclick="game.transferItem('${itemSlot.itemId}', ${index}, gameState.inventory, gameState.baseInventory, 1)">На склад (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="game.transferItem('${itemSlot.itemId}', ${index}, gameState.inventory, gameState.baseInventory, ${itemSlot.quantity})">На склад (Все)</button>`;
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
            domElements.inventoryItemsList.appendChild(itemDiv);
        });

        if(!somethingRendered && filterType !== 'all') {
             domElements.inventoryItemsList.innerHTML = `<p>Нет предметов типа '${filterType}'.</p>`;
        }
        this.updateInventoryWeightDisplay();
    },
    
    updateInventoryWeightDisplay: function() {
        domElements.inventoryWeight.textContent = gameState.player.carryWeight.toFixed(1);
        domElements.inventoryMaxWeight.textContent = gameState.player.maxCarryWeight;
    },

    transferItem: function(itemId, itemIndexInSource, sourceInventory, destinationInventory, quantity) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) return;

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

        if (destinationInventory === gameState.inventory) {
            if (gameState.player.carryWeight + (itemDef.weight * actualQuantity) > gameState.player.maxCarryWeight) {
                this.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${actualQuantity}).`, "event-warning");
                return;
            }
        }
        
        this.addItemToInventory(destinationInventory, itemId, actualQuantity); 
        this.removeItemFromInventory(sourceInventory, itemId, actualQuantity, itemIndexInSource); 

        this.log(`Перемещено: ${itemDef.name} (x${actualQuantity}) ${sourceInventory === gameState.inventory ? 'на склад' : 'в личный инвентарь'}.`, "event-neutral");

        if (domElements.inventoryModal.style.display === 'block') {
            if (sourceInventory === gameState.inventory || destinationInventory === gameState.inventory) {
                 this.renderPlayerInventory(domElements.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all');
            }
        }
        if (document.getElementById('storage-tab')?.style.display === 'block') { 
            this.renderBaseInventory(domElements.baseInventoryFilters?.querySelector('button.active')?.dataset.filter || 'all');
        }
        this.updateDisplay(); 
    },

    filterBaseInventory: function(filterType) {
        if (domElements.baseInventoryFilters) {
            domElements.baseInventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            const activeButton = domElements.baseInventoryFilters.querySelector(`button[data-filter="${filterType}"]`);
            if (activeButton) activeButton.classList.add('active');
        }
        this.renderBaseInventory(filterType);
    },

    renderBaseInventory: function(filterType = 'all') {
        if (!domElements.baseInventoryList) return; 
        domElements.baseInventoryList.innerHTML = '';
        const inventoryToDisplay = gameState.baseInventory;

        if (inventoryToDisplay.length === 0) {
            domElements.baseInventoryList.innerHTML = '<p>Склад базы пуст.</p>';
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
            itemActionsHTML += `<button onclick="game.transferItem('${itemSlot.itemId}', ${index}, gameState.baseInventory, gameState.inventory, 1)">Взять (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="game.transferItem('${itemSlot.itemId}', ${index}, gameState.baseInventory, gameState.inventory, ${itemSlot.quantity})">Взять (Все)</button>`;
            }
            
            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4>${itemDef.name} <span class="item-quantity">(x${itemSlot.quantity})</span></h4>
                    <p>${itemDef.description}</p> 
                </div>
                <div class="item-actions">
                    ${itemActionsHTML}
                </div>
            `;
            domElements.baseInventoryList.appendChild(itemDiv);
        });
        if(!somethingRendered && filterType !== 'all') {
             domElements.baseInventoryList.innerHTML = `<p>На складе нет предметов типа '${filterType}'.</p>`;
        }
    },


    updateDisplay: function() {
        domElements.day.textContent = gameState.day;
        domElements.survivors.textContent = gameState.survivors;
        domElements.maxSurvivors.textContent = GameStateGetters.getMaxSurvivors(); 
        
        this.updatePlayerStatus(); 
        this.updateInventoryWeightDisplay(); 

        domElements.totalFoodValue.textContent = GameStateGetters.countBaseFoodItems(); 
        domElements.totalWaterValue.textContent = GameStateGetters.countBaseWaterItems(); 

        if (document.getElementById('main-tab').style.display === 'block') {
            this.updateOverviewTabStats();
        }


        if (domElements.inventoryModal.style.display === 'block') {
            const activeFilter = domElements.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            this.renderPlayerInventory(activeFilter);
        }
        if (document.getElementById('explore-tab').style.display === 'block') {
            this.updateExploreTabDisplay();
        }
        if (document.getElementById('storage-tab')?.style.display === 'block') {
            const storageActiveFilter = domElements.baseInventoryFilters?.querySelector('button.active')?.dataset.filter || 'all';
            this.renderBaseInventory(storageActiveFilter);
        }
        if (document.getElementById('craft-tab')?.style.display === 'block') {
            this.renderCraftingRecipes();
        }
    },

    updateOverviewTabStats: function() {
        domElements.overviewHealth.textContent = `${gameState.player.health}/${gameState.player.maxHealth}`;
        const hungerTh = GameStateGetters.getHungerThresholds(); 
        if (gameState.player.hunger <= 0) domElements.overviewHunger.textContent = "Смертельный голод";
        else if (gameState.player.hunger <= hungerTh.critical) domElements.overviewHunger.textContent = "Истощение";
        else if (gameState.player.hunger <= hungerTh.low) domElements.overviewHunger.textContent = "Голод";
        else domElements.overviewHunger.textContent = "Сыт";

        const thirstTh = GameStateGetters.getThirstThresholds(); 
        if (gameState.player.thirst <= 0) domElements.overviewThirst.textContent = "Смертельная жажда";
        else if (gameState.player.thirst <= thirstTh.critical) domElements.overviewThirst.textContent = "Сильная жажда";
        else if (gameState.player.thirst <= thirstTh.low) domElements.overviewThirst.textContent = "Жажда";
        else domElements.overviewThirst.textContent = "Норма";
        
        domElements.overviewCondition.textContent = gameState.player.condition;
        domElements.overviewDay.textContent = gameState.day;
        domElements.overviewSurvivors.textContent = `${gameState.survivors}/${GameStateGetters.getMaxSurvivors()}`;
        domElements.overviewBaseFood.textContent = GameStateGetters.countBaseFoodItems();
        domElements.overviewBaseWater.textContent = GameStateGetters.countBaseWaterItems();
    },


    log: function(message, type = "event-neutral") {
        const p = document.createElement('p');
        p.innerHTML = `[Д:${gameState.day}] ${message}`; 
        p.className = type;
        domElements.logMessages.prepend(p);
        if (domElements.logMessages.children.length > 30) {
            domElements.logMessages.removeChild(domElements.logMessages.lastChild);
        }
        if(gameState.logVisible) domElements.logMessages.scrollTop = 0; 
    },

    toggleLogVisibility: function() {
        gameState.logVisible = !gameState.logVisible;
        this.applyLogVisibility();
        this.saveGame(); 
    },

    applyLogVisibility: function() {
        if (gameState.logVisible) {
            domElements.logMessages.classList.remove('hidden');
            domElements.toggleLogButton.textContent = '-';
        } else {
            domElements.logMessages.classList.add('hidden');
            domElements.toggleLogButton.textContent = '+';
        }
    },

    saveGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.setItem(`zombieSurvivalGame_v${major}.${minor}`, JSON.stringify(gameState));
    },
    loadGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedGame = localStorage.getItem(`zombieSurvivalGame_v${major}.${minor}`);
        if (savedGame) {
            const loadedState = JSON.parse(savedGame);
            
            for (const key in initialGameState) { 
                if (loadedState.hasOwnProperty(key)) {
                    if (typeof initialGameState[key] === 'object' && initialGameState[key] !== null && !Array.isArray(initialGameState[key])) {
                         gameState[key] = { ...initialGameState[key], ...loadedState[key] };
                         if (key === 'discoveredLocations') {
                            for (const locId in loadedState.discoveredLocations) {
                                if (gameState.discoveredLocations[locId]) {
                                    gameState.discoveredLocations[locId] = { ...gameState.discoveredLocations[locId], ...loadedState.discoveredLocations[locId] };
                                } else {
                                    gameState.discoveredLocations[locId] = loadedState.discoveredLocations[locId];
                                }
                                const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                                if (locDef && gameState.discoveredLocations[locId].searchAttemptsLeft === undefined) {
                                    gameState.discoveredLocations[locId].searchAttemptsLeft = locDef.initialSearchAttempts;
                                }
                                if (gameState.discoveredLocations[locId].foundSpecialItems === undefined) {
                                     gameState.discoveredLocations[locId].foundSpecialItems = {};
                                }
                            }
                        }
                    } else {
                        gameState[key] = loadedState[key];
                    }
                } else { 
                    gameState[key] = JSON.parse(JSON.stringify(initialGameState[key]));
                }
            }
             if (!gameState.baseInventory) gameState.baseInventory = []; 

            if (!gameState.currentLocationId) gameState.currentLocationId = "base_surroundings";
            const baseLocDefDefault = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]) ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []};
            if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0) {
                gameState.discoveredLocations = { "base_surroundings": { discovered: true, name: baseLocDefDefault.name, searchAttemptsLeft: baseLocDefDefault.initialSearchAttempts, foundSpecialItems: {} } };
            } else { 
                 for (const locId in gameState.discoveredLocations) {
                     if (gameState.discoveredLocations[locId].discovered) {
                         const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                         if (locDef && gameState.discoveredLocations[locId].searchAttemptsLeft === undefined) {
                             gameState.discoveredLocations[locId].searchAttemptsLeft = locDef.initialSearchAttempts;
                         }
                          if (gameState.discoveredLocations[locId].foundSpecialItems === undefined) {
                             gameState.discoveredLocations[locId].foundSpecialItems = {};
                         }
                     }
                 }
            }

            if (gameState.flags === undefined) gameState.flags = {};
            const defaultStructureKeys = (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') ? Object.keys(BASE_STRUCTURE_DEFINITIONS) : [];
            defaultStructureKeys.forEach(key => {
                if (!gameState.structures[key]) { 
                    gameState.structures[key] = { level: BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0 };
                }
            });

            if (gameState.logVisible === undefined) gameState.logVisible = true; 
            this.log("Сохраненная игра загружена.", "event-discovery");
        } else {
             this.log("Сохраненная игра не найдена, начинаем новую.", "event-neutral");
        }
    },

    nextDay: function() {
        if (gameState.gameOver) return;
        if (gameState.currentEvent || gameState.locationEvent) { 
            this.log("Завершите текущее событие.", "event-warning");
            return;
        }

        gameState.day++;
        this.log(`--- Наступил День ${gameState.day} ---`, "event-neutral");

        gameState.dailyFoodNeed = gameState.survivors * 10; 
        gameState.dailyWaterNeed = gameState.survivors * 15; 

        let foodConsumedFromBase = this.consumeResourceFromBase('food', gameState.dailyFoodNeed);
        let waterConsumedFromBase = this.consumeResourceFromBase('water', gameState.dailyWaterNeed);

        if (foodConsumedFromBase < gameState.dailyFoodNeed) {
            this.log(`На складе не хватило еды для всех выживших! Потреблено ${foodConsumedFromBase} из ${gameState.dailyFoodNeed} необходимых. Выжившие голодают!`, "event-negative");
            if (Math.random() < 0.2 * gameState.survivors) { 
                if (gameState.survivors > 0) {
                    gameState.survivors--;
                    this.log("Один из выживших умер от голода!", "event-negative");
                    if (gameState.survivors <= 0 && !gameState.gameOver) { this.gameOver("Все выжившие погибли от голода."); return; }
                }
            }
        } else {
            this.log(`Выжившие поели. Со склада потрачено ${foodConsumedFromBase} ед. сытости.`, "event-neutral");
        }

        if (waterConsumedFromBase < gameState.dailyWaterNeed) {
            this.log(`На складе не хватило воды для всех выживших! Потреблено ${waterConsumedFromBase} из ${gameState.dailyWaterNeed} необходимых. Выжившие страдают от жажды!`, "event-negative");
             if (Math.random() < 0.25 * gameState.survivors) { 
                if (gameState.survivors > 0) {
                    gameState.survivors--;
                    this.log("Один из выживших умер от обезвоживания!", "event-negative");
                    if (gameState.survivors <= 0 && !gameState.gameOver) { this.gameOver("Все выжившие погибли от жажды."); return; }
                }
            }
        } else {
             this.log(`Выжившие попили. Со склада потрачено ${waterConsumedFromBase} ед. утоления жажды.`, "event-neutral");
        }
        
        this.triggerRandomEvent(); 
        
        if (!gameState.currentEvent && !gameState.locationEvent && document.getElementById('main-tab').style.display === 'block') {
             domElements.eventActionsContainer.style.display = 'none';
             domElements.eventTextDisplay.textContent = '';
             domElements.eventActions.innerHTML = '';
        }

        this.updateDisplay();
        this.updateBuildActions();
        this.saveGame();
    },
    
    consumeResourceFromBase: function(resourceType, amountNeeded) {
        let amountFulfilled = 0;
        const inventory = gameState.baseInventory;
        
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

        for (let i = 0; i < inventory.length && amountFulfilled < amountNeeded; ) { 
            const slot = inventory[i]; 
            if (!slot) { i++; continue; } 

            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            let itemValue = 0;
            let isCorrectType = false;

            if (resourceType === 'food' && itemDef.type === 'food' && itemDef.effect?.hunger) {
                itemValue = itemDef.effect.hunger;
                isCorrectType = true;
                if (itemDef.effect?.radiation && Math.random() < 0.1 * gameState.survivors) { 
                    this.log(`Кто-то получил дозу радиации от ${itemDef.name}.`, "event-warning");
                }
            } else if (resourceType === 'water' && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect?.thirst) {
                itemValue = itemDef.effect.thirst;
                isCorrectType = true;
                 if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance * gameState.survivors * 0.05) { 
                    this.log(`Кто-то из выживших заболел, выпив ${itemDef.name} со склада.`, "event-warning");
                }
            }

            if (isCorrectType && itemValue > 0) {
                const neededFromThisSlot = Math.ceil((amountNeeded - amountFulfilled) / itemValue);
                const canConsumeFromSlot = Math.min(slot.quantity, neededFromThisSlot);
                
                amountFulfilled += canConsumeFromSlot * itemValue;
                
                const originalLength = inventory.length;
                const originalItemId = slot.itemId; 
                this.removeItemFromInventory(gameState.baseInventory, slot.itemId, canConsumeFromSlot, i);
                
                if (inventory.length < originalLength || (inventory[i] && inventory[i].itemId !== originalItemId)) {
                } else {
                    i++;
                }
            } else {
                 i++; 
            }
        }
        return Math.min(amountFulfilled, amountNeeded); 
    },

    updateExploreTab: function() { 
        this.updateExploreTabDisplay();
        this.renderDiscoveredLocations();
    },

    updateExploreTabDisplay: function() { 
        const currentLocationId = gameState.currentLocationId;
        const currentLocationDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[currentLocationId] : null;
        const currentLocationState = gameState.discoveredLocations[currentLocationId];

        if (currentLocationDef && currentLocationState) {
            domElements.currentLocationNameDisplay.textContent = currentLocationDef.name;
            domElements.currentLocationDescriptionDisplay.textContent = `${currentLocationDef.description} (Попыток обыска: ${currentLocationState.searchAttemptsLeft || 0})`;
            domElements.currentLocationTimeDisplay.textContent = currentLocationDef.scoutTime || 1;
            
            const canSearch = (currentLocationState.searchAttemptsLeft || 0) > 0;
            domElements.scoutCurrentLocationButton.disabled = !canSearch || gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null;
            domElements.scoutCurrentLocationButton.textContent = canSearch ? `Обыскать (${currentLocationDef.scoutTime || 1} д.)` : "Локация обыскана";

        } else {
            domElements.currentLocationNameDisplay.textContent = "Неизвестно";
            domElements.currentLocationDescriptionDisplay.textContent = "Ошибка: текущая локация не найдена.";
            domElements.scoutCurrentLocationButton.disabled = true;
            domElements.scoutCurrentLocationButton.textContent = "Обыскать";
        }
        domElements.discoverNewLocationButton.disabled = gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null;
    },

    renderDiscoveredLocations: function() {
        domElements.discoveredLocationsList.innerHTML = '';
        let hasDiscoveredOtherThanBase = false;
        for (const locId in gameState.discoveredLocations) {
            if (gameState.discoveredLocations[locId].discovered) {
                const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                if (!locDef) continue;
                if (locId !== "base_surroundings") hasDiscoveredOtherThanBase = true;

                const entryDiv = document.createElement('div');
                entryDiv.className = 'location-entry';
                if (locId === gameState.currentLocationId) {
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
                domElements.discoveredLocationsList.appendChild(entryDiv);
            }
        }
        if (!hasDiscoveredOtherThanBase && Object.keys(gameState.discoveredLocations).length <= 1) {
            domElements.discoveredLocationsList.innerHTML = '<p><em>Используйте "Разведать новые территории", чтобы найти новые места.</em></p>';
        }
    },

    setCurrentLocation: function(locationId) {
        if ((typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS[locationId]) && gameState.discoveredLocations[locationId]?.discovered) {
            if (gameState.locationEvent || gameState.currentEvent) { 
                this.log("Сначала завершите текущее событие.", "event-warning");
                return;
            }
            gameState.currentLocationId = locationId;
            this.log(`Вы переместились в локацию: ${LOCATION_DEFINITIONS[locationId].name}.`, "event-neutral");
            
            const locDef = LOCATION_DEFINITIONS[locationId];
            if (locDef.entryLoot && locDef.entryLoot.length > 0) {
                let entryLootGained = false;
                locDef.entryLoot.forEach(loot => {
                    if (Math.random() < loot.chance) {
                        const quantity = Array.isArray(loot.quantity) ? 
                                         Math.floor(Math.random() * (loot.quantity[1] - loot.quantity[0] + 1)) + loot.quantity[0] :
                                         loot.quantity;
                        if (this.addItemToInventory(gameState.inventory, loot.itemId, quantity)) {
                            this.log(`Прибыв в ${locDef.name}, вы нашли: ${ITEM_DEFINITIONS[loot.itemId].name} (x${quantity}).`, "event-discovery");
                            entryLootGained = true;
                        }
                    }
                });
                if (entryLootGained) this.updateDisplay();
            }
            this.updateExploreTab();
        } else {
            this.log("Невозможно переместиться в эту локацию.", "event-negative");
        }
    },

    discoverNewLocationAction: function() { 
        if (gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null) return;
        this.log("Вы отправляетесь на разведку неизведанных территорий...", "event-neutral");

        const currentLocationDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[gameState.currentLocationId] : null;
        let newLocationFound = false;

        if (currentLocationDef && currentLocationDef.discoverableLocations) {
            for (const discoverable of currentLocationDef.discoverableLocations) {
                if (!gameState.discoveredLocations[discoverable.locationId]?.discovered && 
                    Math.random() < discoverable.chance &&
                    (typeof discoverable.condition === 'function' ? discoverable.condition() : true)) {
                    
                    const newLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[discoverable.locationId] : null;
                    if (newLocDef) {
                        gameState.discoveredLocations[discoverable.locationId] = { 
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
        if (gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null) return;

        const locId = gameState.currentLocationId;
        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
        const locState = gameState.discoveredLocations[locId];

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
                    if (!gameState.flags[flagId] && (!locState.foundSpecialItems || !locState.foundSpecialItems[special.itemId])) { 
                        if (Math.random() < (special.findChance || 0.1)) { 
                            if (this.addItemToInventory(gameState.inventory, special.itemId, special.quantity || 1)) { 
                                this.log(special.descriptionLog || `ОСОБАЯ НАХОДКА: ${ITEM_DEFINITIONS[special.itemId].name}!`, "event-discovery");
                                itemsFoundCount++;
                                specialItemFoundThisTurn = true;
                                gameState.flags[flagId] = true; 
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
                            if (this.addItemToInventory(gameState.inventory, lootEntry.itemId, quantity)) { 
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

            if (locDef.specialEvents && locDef.specialEvents.length > 0 && !gameState.locationEvent) { 
                for (const eventDef of locDef.specialEvents) {
                    const flagId = eventDef.id + "_" + locId; 
                    if (Math.random() < eventDef.chance &&
                        (typeof eventDef.condition === 'function' ? eventDef.condition() : true) &&
                        (!gameState.flags[flagId] || eventDef.repeatable) 
                       ) {
                        gameState.locationEvent = { ...eventDef, flagId: flagId }; 
                        this.log(`СОБЫТИЕ НА ЛОКАЦИИ: ${eventDef.text}`, "event-discovery");
                        this.displayLocationEventChoices();
                        return; 
                    }
                }
            }
            
            if (itemsFoundCount === 0 && !gameState.locationEvent && !specialItemFoundThisTurn) {
                this.log("Ничего ценного не найдено в этот раз.", "event-neutral");
            }
            if (!gameState.locationEvent) { 
                 this.nextDayForLocationAction(locDef.scoutTime || 1);
            }
        }
    },
    
    nextDayForLocationAction: function(daysSpent = 1) {
        this.log(`Исследование локации заняло ${daysSpent} дн.`, "event-neutral");
        for (let i = 0; i < daysSpent; i++) {
            if (gameState.gameOver) break;
            gameState.day++; 
            this.log(`--- Наступил День ${gameState.day} (после вылазки) ---`, "event-neutral");
            
            const foodNeed = gameState.survivors * 10;
            const waterNeed = gameState.survivors * 15;
            let foodConsumed = this.consumeResourceFromBase('food', foodNeed);
            let waterConsumed = this.consumeResourceFromBase('water', waterNeed);

            if (foodConsumed < foodNeed && !gameState.gameOver) { 
                this.log("Выжившие голодают после вылазки!", "event-negative");
                 if (Math.random() < 0.2 * gameState.survivors) { 
                    if (gameState.survivors > 0) {
                        gameState.survivors--;
                        this.log("Один из выживших умер от голода!", "event-negative");
                        if (gameState.survivors <= 0 && !gameState.gameOver) { this.gameOver("Все выжившие погибли от голода."); break; }
                    }
                }
            }
            if (waterConsumed < waterNeed && !gameState.gameOver) { 
                this.log("Выжившие страдают от жажды после вылазки!", "event-negative");
                 if (Math.random() < 0.25 * gameState.survivors) { 
                    if (gameState.survivors > 0) {
                        gameState.survivors--;
                        this.log("Один из выживших умер от обезвоживания!", "event-negative");
                        if (gameState.survivors <= 0 && !gameState.gameOver) { this.gameOver("Все выжившие погибли от жажды."); break; }
                    }
                }
            }

            this.updateDisplay(); 
            this.triggerRandomEvent(); 
            if(gameState.gameOver) break; 
        }
        this.updateBuildActions(); 
        this.saveGame();
    },

    displayLocationEventChoices: function() {
        const eventContainer = domElements.eventActionsContainer; 
        const eventTextEl = domElements.eventTextDisplay;
        const eventButtonsEl = domElements.eventActions;

        eventButtonsEl.innerHTML = ''; 
        if (!gameState.locationEvent) {
            eventContainer.style.display = 'none';
            this.updateExploreTabDisplay(); 
            return;
        }

        eventTextEl.textContent = gameState.locationEvent.text;
        eventContainer.style.display = 'block';
        domElements.scoutCurrentLocationButton.disabled = true; 
        domElements.discoverNewLocationButton.disabled = true;


        gameState.locationEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            if (typeof choice.action === 'function') { 
                 btn.onclick = () => {
                    if (gameState.locationEvent) {
                        choice.action(); 
                        gameState.locationEvent = null; 
                        this.finalizeEventUI();
                    }
                };
            } else if (choice.outcome) { 
                 btn.onclick = () => {
                    if (gameState.locationEvent) { 
                        const currentLocEvent = gameState.locationEvent; 
                        const outcome = choice.outcome;
                        if (outcome.log) this.log(outcome.log, outcome.type || "event-neutral");
                        if (outcome.addItems) {
                            outcome.addItems.forEach(item => this.addItemToInventory(gameState.inventory, item.itemId, item.quantity)); 
                        }
                        if (outcome.setFlag && currentLocEvent.flagId) gameState.flags[currentLocEvent.flagId] = true; 
                        
                        gameState.locationEvent = null; 
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
        domElements.eventActions.innerHTML = ''; 
        domElements.eventTextDisplay.textContent = '';
        domElements.eventActionsContainer.style.display = 'none'; 
        this.updateDisplay(); 
        this.updateExploreTabDisplay(); 
        this.updateBuildActions(); 
        this.saveGame();
    },


    updateBuildActions: function() {
        domElements.buildActions.innerHTML = ''; 
        for (const key in gameState.structures) {
            const definition = (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') ? BASE_STRUCTURE_DEFINITIONS[key] : null;
            const currentStructureState = gameState.structures[key];
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
                    const has = this.countItemInInventory(gameState.baseInventory, itemId); 
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
            btn.disabled = !canAffordAll || atMaxLevel || gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver;
            domElements.buildActions.appendChild(btn);
        }
    },
    build: function(structureKey) { 
        if (gameState.gameOver || gameState.currentEvent || gameState.locationEvent) return;
        const definition = (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') ? BASE_STRUCTURE_DEFINITIONS[structureKey] : null;
        const currentStructureState = gameState.structures[structureKey];
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
            const currentQty = this.countItemInInventory(gameState.baseInventory, itemId); 
            if (currentQty < requiredQty) {
                canAfford = false;
                missingResLog.push(`${requiredQty - currentQty} ${ITEM_DEFINITIONS[itemId] ? ITEM_DEFINITIONS[itemId].name : itemId}`);
            }
        }

        if (canAfford) {
            for (const itemId in costDefinition) {
                this.removeItemFromInventory(gameState.baseInventory, itemId, costDefinition[itemId]); 
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
            condition: () => gameState.survivors < GameStateGetters.getMaxSurvivors() && Math.random() < 0.08,
            text: "Вы слышите стук в ворота. Одинокий путник просит убежища.",
            choices: [
                { 
                    text: "Принять (+1 выживший)", 
                    action: function() { 
                        if (gameState.survivors < GameStateGetters.getMaxSurvivors()) {
                            gameState.survivors++;
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
                        if (game.countItemInInventory(gameState.inventory, "scrap_metal") >= 15) {
                            game.removeItemFromInventory(gameState.inventory, "scrap_metal", 15);
                            game.addItemToInventory(gameState.inventory, "stimpack_fallout", 3); 
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
            condition: () => Math.random() < 0.1 && gameState.day > 2, 
            text: "Небольшая группа зомби замечена неподалеку от базы! Они могут напасть.",
            choices: [
                { 
                    text: "Укрепить оборону (-5 дерева, -3 металла со склада)", 
                    action: function() { 
                        if (game.countItemInInventory(gameState.baseInventory, "wood") >=5 && game.countItemInInventory(gameState.baseInventory, "scrap_metal") >=3){
                            game.removeItemFromInventory(gameState.baseInventory, "wood", 5);
                            game.removeItemFromInventory(gameState.baseInventory, "scrap_metal", 3);
                            game.log("Оборона усилена. Зомби не решились атаковать.", "event-positive");
                        } else {
                             game.log("Не хватило материалов на складе для укрепления! Зомби прорвались!", "event-negative");
                             if(!gameState.gameOver) game.takeDamage(10 * gameState.survivors, "атака зомби");
                             if(!gameState.gameOver && Math.random() < 0.2 * gameState.survivors && gameState.survivors > 0){
                                 gameState.survivors--;
                                 game.log("Один из выживших погиб во время атаки...", "event-negative");
                                 if(gameState.survivors <= 0 && !gameState.gameOver) game.gameOver("Все выжившие погибли.");
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
                            if(!gameState.gameOver) game.takeDamage(15 * gameState.survivors, "внезапная атака");
                             if(!gameState.gameOver && Math.random() < 0.3 * gameState.survivors && gameState.survivors > 0){
                                 gameState.survivors--;
                                 game.log("Потери среди выживших...", "event-negative");
                                 if(gameState.survivors <= 0 && !gameState.gameOver) game.gameOver("Все выжившие погибли.");
                             }
                         }
                    }
                }
            ]
        }
    ],
    triggerRandomEvent: function() { 
        if (gameState.currentEvent || gameState.locationEvent || gameState.gameOver) return; 

        const availableEvents = this.possibleEvents.filter(event => event.condition());
        if (availableEvents.length > 0) {
            gameState.currentEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            this.log(`СОБЫТИЕ: ${gameState.currentEvent.text}`, "event-discovery");
            this.displayEventChoices(); 
        } else {
            if (document.getElementById('main-tab').style.display === 'block') { 
                 domElements.eventActionsContainer.style.display = 'none';
            }
        }
    },
    displayEventChoices: function() { 
        const eventContainer = domElements.eventActionsContainer; 
        const eventTextEl = domElements.eventTextDisplay;
        const eventButtonsEl = domElements.eventActions;

        eventButtonsEl.innerHTML = ''; 
        if (!gameState.currentEvent) {
            eventContainer.style.display = 'none';
             this.updateExploreTabDisplay(); 
            return;
        }

        eventTextEl.textContent = gameState.currentEvent.text;
        eventContainer.style.display = 'block';

        domElements.scoutCurrentLocationButton.disabled = true;
        domElements.discoverNewLocationButton.disabled = true;

        gameState.currentEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            if (typeof choice.action === 'function') {
                btn.onclick = () => {
                    if (gameState.currentEvent) { 
                        choice.action(); 
                        gameState.currentEvent = null; 
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

    renderCraftingRecipes: function() {
        if (!domElements.craftingRecipesList || typeof CRAFTING_RECIPES === 'undefined') {
            if (domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p>Ошибка загрузки рецептов.</p>';
            return;
        }
        
        const workshopLevel = gameState.structures.workshop ? gameState.structures.workshop.level : 0;
        domElements.workshopLevelDisplay.textContent = workshopLevel;
        domElements.craftingRecipesList.innerHTML = '';
        let recipesAvailableToDisplay = 0;

        for (const recipeId in CRAFTING_RECIPES) {
            const recipe = CRAFTING_RECIPES[recipeId];
            if (workshopLevel < (recipe.workshopLevelRequired || 0)) {
                continue; 
            }

            recipesAvailableToDisplay++;
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'crafting-recipe';

            let ingredientsHTML = '<ul>';
            let canCraftThis = true;
            recipe.ingredients.forEach(ing => {
                const has = this.countItemInInventory(gameState.baseInventory, ing.itemId); 
                const hasEnough = has >= ing.quantity;
                if (!hasEnough) canCraftThis = false;
                ingredientsHTML += `<li class="${hasEnough ? 'has-enough' : 'not-enough'}">${ITEM_DEFINITIONS[ing.itemId].name}: ${has}/${ing.quantity}</li>`;
            });
            ingredientsHTML += '</ul>';

            let toolsHTML = '';
            if (recipe.toolsRequired && recipe.toolsRequired.length > 0) {
                toolsHTML = '<strong>Инструменты:</strong> <span class="recipe-tools">';
                let allToolsPresent = true;
                recipe.toolsRequired.forEach((toolId, index) => {
                    const hasTool = this.countItemInInventory(gameState.inventory, toolId) > 0; 
                    if (!hasTool) allToolsPresent = false;
                    toolsHTML += `${ITEM_DEFINITIONS[toolId].name} ${hasTool ? '✔' : '✘'}`;
                    if (index < recipe.toolsRequired.length - 1) toolsHTML += ', ';
                });
                if (!allToolsPresent) {
                    canCraftThis = false;
                    toolsHTML = toolsHTML.replace('<span class="recipe-tools">', '<span class="recipe-tools missing-tool">');
                }
                toolsHTML += '</span>';
            }
            
            let additionalResultsHTML = '';
            if (recipe.additionalResults && recipe.additionalResults.length > 0) {
                additionalResultsHTML = '<strong>Доп. результат:</strong> <ul>';
                recipe.additionalResults.forEach(addRes => {
                     additionalResultsHTML += `<li>${ITEM_DEFINITIONS[addRes.itemId].name} (x${Array.isArray(addRes.quantity) ? addRes.quantity.join('-') : addRes.quantity})</li>`;
                });
                additionalResultsHTML += '</ul>';
            }


            recipeDiv.innerHTML = `
                <h4>${recipe.name}</h4>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-details">
                    <strong>Результат:</strong> ${ITEM_DEFINITIONS[recipe.resultItemId].name} (x${recipe.resultQuantity})<br>
                    <strong>Ингредиенты (со склада):</strong>
                    ${ingredientsHTML}
                    ${toolsHTML ? toolsHTML + '<br>' : ''}
                    ${additionalResultsHTML}
                    ${recipe.workshopLevelRequired > 0 ? `<strong>Требуется Мастерская Ур:</strong> ${recipe.workshopLevelRequired}<br>` : ''}
                </div>
                <button onclick="game.craftItem('${recipeId}')" ${!canCraftThis ? 'disabled' : ''}>Создать</button>
            `;
            domElements.craftingRecipesList.appendChild(recipeDiv);
        }

        if (recipesAvailableToDisplay === 0) {
            domElements.craftingRecipesList.innerHTML = '<p><em>Нет доступных рецептов или не выполнены условия. Улучшите Мастерскую или соберите больше ресурсов/инструментов.</em></p>';
        }
    },

    canCraft: function(recipeId) {
        const recipe = CRAFTING_RECIPES[recipeId];
        if (!recipe) return false;

        const workshopLevel = gameState.structures.workshop ? gameState.structures.workshop.level : 0;
        if (workshopLevel < (recipe.workshopLevelRequired || 0)) {
            return false;
        }

        for (const ing of recipe.ingredients) {
            if (this.countItemInInventory(gameState.baseInventory, ing.itemId) < ing.quantity) {
                return false;
            }
        }
        if (recipe.toolsRequired && recipe.toolsRequired.length > 0) {
            for (const toolId of recipe.toolsRequired) {
                if (this.countItemInInventory(gameState.inventory, toolId) === 0) {
                    return false;
                }
            }
        }
        return true;
    },

    craftItem: function(recipeId) {
        if (!this.canCraft(recipeId)) {
            this.log("Невозможно создать предмет: не хватает ресурсов, инструментов или не тот уровень мастерской.", "event-negative");
            this.renderCraftingRecipes(); 
            return;
        }

        const recipe = CRAFTING_RECIPES[recipeId];

        recipe.ingredients.forEach(ing => {
            this.removeItemFromInventory(gameState.baseInventory, ing.itemId, ing.quantity);
        });

        this.addItemToInventory(gameState.inventory, recipe.resultItemId, recipe.resultQuantity);
        this.log(`Создано: ${ITEM_DEFINITIONS[recipe.resultItemId].name} (x${recipe.resultQuantity})`, "event-positive");

        if (recipe.additionalResults) {
            recipe.additionalResults.forEach(addRes => {
                const quantity = Array.isArray(addRes.quantity) ? 
                                 Math.floor(Math.random() * (addRes.quantity[1] - addRes.quantity[0] + 1)) + addRes.quantity[0] :
                                 addRes.quantity;
                if (this.addItemToInventory(gameState.inventory, addRes.itemId, quantity)) {
                    this.log(`Дополнительно получено: ${ITEM_DEFINITIONS[addRes.itemId].name} (x${quantity})`, "event-discovery");
                }
            });
        }
        
        this.updateDisplay(); 
        this.renderCraftingRecipes(); 
        this.saveGame();
    },


    gameOver: function(message) {
        if(gameState.gameOver) return; 
        this.log(message, "event-negative");
        gameState.gameOver = true;
        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            const onclickAttr = button.getAttribute('onclick');
            if(onclickAttr !== "game.resetGameConfirmation()" && onclickAttr !== "game.closeInventoryModal()") { 
                button.disabled = true;
            }
        });
        domElements.eventActionsContainer.style.display = 'none'; 
    },
    
    resetGameConfirmation: function() {
        if (confirm("Вы уверены, что хотите начать игру заново? Весь прогресс будет потерян.")) {
            this.resetGame();
        }
    },

    resetGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.removeItem(`zombieSurvivalGame_v${major}.${minor}`);
        
        gameState = JSON.parse(JSON.stringify(initialGameState));
        const baseLocDefDefault = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]) ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []};
        gameState.discoveredLocations = { 
            "base_surroundings": { 
                discovered: true, 
                name: baseLocDefDefault.name,
                searchAttemptsLeft: baseLocDefDefault.initialSearchAttempts,
                foundSpecialItems: {}
            } 
        };
        
        this.initializeStructures(); 
        this.addInitialItemsToPlayer(); 
        this.addInitialItemsToBase();

        domElements.logMessages.innerHTML = ''; 
        
        domElements.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.applyLogVisibility();
        
        this.updateDisplay(); 
        this.updateBuildActions();
        this.updateExploreTab(); 


        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            if(button.getAttribute('onclick') !== "game.resetGameConfirmation()" && button.getAttribute('onclick') !== "game.closeInventoryModal()") {
                 button.disabled = false;
            }
        });
        this.updateBuildActions();
        this.updateExploreTabDisplay(); 

        const defaultNavLink = domElements.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
        if (defaultNavLink) {
            this.openTab('main-tab', defaultNavLink);
        } else {
            this.openTab('main-tab', null); 
        }
        domElements.eventActionsContainer.style.display = 'none'; 

        this.log("Новая игра начата.", "event-neutral");
        this.saveGame(); 
    }
};

window.onload = () => {
    if (typeof ITEM_DEFINITIONS !== 'undefined' && 
        typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined' &&
        typeof LOCATION_DEFINITIONS !== 'undefined' &&
        typeof CRAFTING_RECIPES !== 'undefined' && 
        typeof gameState !== 'undefined' && 
        typeof domElements !== 'undefined' &&
        typeof GameStateGetters !== 'undefined' // Добавил проверку GameStateGetters
        ) {
        game.init();
    } else {
        console.error("Один или несколько файлов определений (items, buildings, locations, recipes, game_state, dom_elements) не загружены или загружены не в том порядке!");
        document.body.innerHTML = "<p style='color:red; font-size:18px; text-align:center; margin-top: 50px;'>Ошибка загрузки игровых данных. Пожалуйста, проверьте консоль (F12) и обновите страницу.</p>";
    }
};
