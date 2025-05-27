// script.js
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
            hunger: 100, // Текущая сытость, от 0 до 100 (или больше, если есть бонусы)
            maxHunger: 100,
            thirst: 100, // Текущая жажда
            maxThirst: 100,
            carryWeight: 0,
            maxCarryWeight: 25, // кг
            condition: "В порядке", // "Ранен", "Болен", "Голоден", "Истощен" и т.д.
            // Можно добавить SPECIAL или другие атрибуты позже
        },
        discoveredLocations: {}, // Объекты вида { locationId: { name: "...", ...} }
        // fedToday, wateredToday больше не нужны в таком виде
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

    getTotalResourceValue: function(type) { // type: 'food', 'water'
        let totalValue = 0;
        this.state.inventory.forEach(itemSlot => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (itemDef && itemDef.type === type && itemDef.effect) {
                if (type === 'food' && itemDef.effect.hunger) {
                    totalValue += itemDef.effect.hunger * itemSlot.quantity;
                }
            } else if (itemDef && itemDef.type === 'water_source' && type === 'water' && itemDef.effect) { // Для грязной воды, если считаем ее ценность
                 if (itemDef.effect.thirst) {
                    totalValue += itemDef.effect.thirst * itemSlot.quantity;
                }
            }
        });
        return totalValue;
    },


    // --- DOM ELEMENTS ---
    dom: {
        day: document.getElementById('day'),
        survivors: document.getElementById('survivors'),
        maxSurvivors: document.getElementById('max-survivors'),
        
        hungerStatus: document.getElementById('hunger-status'),
        totalFoodValue: document.getElementById('total-food-value'),
        thirstStatus: document.getElementById('thirst-status'),
        totalWaterValue: document.getElementById('total-water-value'),
        healthStatus: document.getElementById('health-status'),
        playerCondition: document.getElementById('player-condition'),

        logMessages: document.getElementById('log-messages'),
        // mainActions: document.getElementById('main-actions'), // Теперь внутри вкладок
        buildActions: document.getElementById('build-actions'),
        eventActions: document.getElementById('event-actions'),
        
        inventoryButton: document.getElementById('inventory-button'),
        inventoryModal: document.getElementById('inventory-modal'),
        inventoryItemsList: document.getElementById('inventory-items-list'),
        inventoryWeight: document.getElementById('inventory-weight'),
        inventoryMaxWeight: document.getElementById('inventory-max-weight'),
        inventoryFilters: document.querySelector('.inventory-filters'),

        discoveredLocationsContainer: document.getElementById('discovered-locations'),
        craftingRecipesContainer: document.getElementById('crafting-recipes'),

        // Вкладки
        tabLinks: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content')
    },

    // --- INITIALIZATION ---
    init: function() {
        this.initializeStructures();
        this.loadGame(); // Загрузка после инициализации структур, но до добавления начальных предметов
        
        if (!localStorage.getItem('zombieSurvivalGame_v3')) { // Только для новой игры
            this.addInitialItems();
        }
        
        this.updateDisplay();
        this.updateBuildActions();
        // this.updateFeedDrinkStatus(); // Заменено на updatePlayerStatus
        
        this.dom.inventoryButton.onclick = () => this.openInventoryModal();
        this.dom.inventoryFilters.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => this.filterInventory(e.target.dataset.filter));
        });
        
        this.log("Игра началась. Пустошь ждет.", "event-neutral");
        this.openTab(null, 'main-tab'); // Открыть первую вкладку по умолчанию
    },

    initializeStructures: function() { /* ... осталась без изменений ... */ },

    addInitialItems: function() {
        this.addItemToInventory("food_canned", 3);
        this.addItemToInventory("water_purified", 3);
        this.addItemToInventory("scrap_metal", 10);
        this.addItemToInventory("bandages_crude", 2);
        this.addItemToInventory("wood", 5);
    },

    // --- TABS ---
    openTab: function(event, tabName) {
        this.dom.tabContents.forEach(tc => tc.style.display = "none");
        this.dom.tabLinks.forEach(tl => tl.classList.remove("active"));
        document.getElementById(tabName).style.display = "block";
        if (event) event.currentTarget.classList.add("active");
        else { // Если вызвано программно, найти и активировать нужную кнопку
            this.dom.tabLinks.forEach(tl => {
                if (tl.getAttribute('onclick').includes(tabName)) {
                    tl.classList.add('active');
                }
            });
        }
    },
    
    // --- PLAYER STATUS & CONSUMPTION ---
    updatePlayerStatus: function() {
        const hungerTh = this.getHungerThresholds();
        if (this.state.player.hunger <= 0) {
            this.state.player.hunger = 0;
            this.dom.hungerStatus.textContent = "Смертельный голод";
            this.dom.hungerStatus.className = 'status-critical';
            this.takeDamage(5, "голод"); // Урон от голода каждый ход при 0
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
            this.takeDamage(10, "обезвоживание"); // Урон от жажды
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
        
        this.dom.totalFoodValue.textContent = this.getTotalResourceValue('food');
        this.dom.totalWaterValue.textContent = this.getTotalResourceValue('water_source'); // Показываем общее количество воды, включая грязную

        this.dom.healthStatus.textContent = `${this.state.player.health} / ${this.state.player.maxHealth}`;
        this.dom.playerCondition.textContent = this.state.player.condition;

        // Обновление доступности действий в инвентаре, если он открыт
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
                this.state.player.condition = "Подташнивает"; // Добавить механику болезней
                // this.takeDamage(5, "отравление");
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
        // Добавить другие типы эффектов (баффы и т.д.)

        if (consumed) {
            this.removeItemFromInventory(itemId, 1, inventoryItemIndex); // Удаляем именно из этого слота
        }
        this.updatePlayerStatus();
        this.updateDisplay(); // Обновит вес в инвентаре, если он открыт
    },

    takeDamage: function(amount, source) {
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
            return;
        }
        const itemDef = ITEM_DEFINITIONS[itemId];
        
        // Проверка веса
        if (this.state.player.carryWeight + (itemDef.weight * quantity) > this.state.player.maxCarryWeight) {
            this.log(`Недостаточно места в инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
            // Можно добавить механику выбрасывания части предметов, если не влезает все
            return false; // Не удалось добавить
        }

        const existingItemIndex = this.state.inventory.findIndex(slot => slot.itemId === itemId && itemDef.stackable);
        if (existingItemIndex > -1) {
            this.state.inventory[existingItemIndex].quantity += quantity;
        } else {
            this.state.inventory.push({ itemId: itemId, quantity: quantity });
        }
        this.state.player.carryWeight += itemDef.weight * quantity;
        this.state.player.carryWeight = parseFloat(this.state.player.carryWeight.toFixed(2)); // Округление
        
        // this.log(`Добавлено в инвентарь: ${itemDef.name} (x${quantity})`, "event-discovery"); // Часто слишком много логов
        this.updateDisplay(); // Обновит вес и т.д.
        return true; // Успешно добавлено
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
                quantity = itemSlot.quantity; // Убираем ровно столько, сколько есть
                this.state.inventory.splice(itemIndex, 1);
            }
            this.state.player.carryWeight -= itemDef.weight * quantity;
            this.state.player.carryWeight = Math.max(0, parseFloat(this.state.player.carryWeight.toFixed(2)));
            this.updateDisplay();
            return true;
        }
        return false; // Предмет не найден или недостаточно
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
        this.filterInventory('all'); // Показать все при открытии
    },

    closeInventoryModal: function() {
        this.dom.inventoryModal.style.display = 'none';
    },

    filterInventory: function(filterType) {
        this.dom.inventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        this.dom.inventoryFilters.querySelector(`button[data-filter="${filterType}"]`).classList.add('active');
        this.renderInventory(filterType);
    },

    renderInventory: function(filterType = 'all') {
        this.dom.inventoryItemsList.innerHTML = '';
        if (this.state.inventory.length === 0) {
            this.dom.inventoryItemsList.innerHTML = '<p>Инвентарь пуст.</p>';
            return;
        }

        this.state.inventory.forEach((itemSlot, index) => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (!itemDef) return;

            if (filterType !== 'all' && itemDef.type !== filterType) {
                return; // Пропускаем, если не соответствует фильтру
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';

            let itemActionsHTML = '';
            // Кнопка "Использовать" для еды, воды, медикаментов
            if (itemDef.type === 'food' || itemDef.type === 'water' || itemDef.type === 'water_source' || itemDef.type === 'medicine') {
                itemActionsHTML += `<button onclick="game.consumeItem('${itemSlot.itemId}', ${index})">Использовать</button>`;
            }
            // Кнопка "Выбросить" (пока не делаем, чтобы не усложнять)
            // itemActionsHTML += `<button onclick="game.dropItem('${itemSlot.itemId}', ${index}, 1)">Выбросить 1</button>`;


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
        if(this.dom.inventoryItemsList.children.length === 0 && filterType !== 'all') {
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
        
        this.updatePlayerStatus(); // Обновляет голод, жажду, здоровье, состояние
        this.updateInventoryWeightDisplay(); // Обновляет вес в шапке инвентаря

        // Если инвентарь открыт, перерисовать его, т.к. могли измениться количества
        if (this.dom.inventoryModal.style.display === 'block') {
            const activeFilter = this.dom.inventoryFilters.querySelector('button.active').dataset.filter;
            this.renderInventory(activeFilter);
        }
    },

    log: function(message, type = "event-neutral") { /* ... осталась без изменений ... */ },
    saveGame: function() { localStorage.setItem('zombieSurvivalGame_v3', JSON.stringify(this.state)); },
    loadGame: function() {
        const savedGame = localStorage.getItem('zombieSurvivalGame_v3');
        if (savedGame) {
            const loadedState = JSON.parse(savedGame);
            
            // Слияние состояния, сохраняя новые поля из дефолтного state, если их нет в savedGame
            for (const key in this.state) {
                if (loadedState.hasOwnProperty(key)) {
                    if (typeof this.state[key] === 'object' && this.state[key] !== null && !Array.isArray(this.state[key])) {
                        // Глубокое слияние для объектов (например, player, structures)
                        this.state[key] = { ...this.state[key], ...loadedState[key] };
                    } else {
                        this.state[key] = loadedState[key];
                    }
                }
            }
            // Убедимся, что все структуры определены, если сохранение старое или неполное
            const defaultStructureKeys = Object.keys(BASE_STRUCTURE_DEFINITIONS);
            defaultStructureKeys.forEach(key => {
                if (!this.state.structures[key]) {
                    this.state.structures[key] = { level: BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0 };
                }
            });


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

        // Естественное уменьшение голода и жажды
        this.state.player.hunger -= (15 + this.state.survivors * 5); // Базовое + за каждого выжившего (они тоже едят абстрактно)
        this.state.player.thirst -= (20 + this.state.survivors * 5);
        this.state.player.hunger = Math.max(0, this.state.player.hunger);
        this.state.player.thirst = Math.max(0, this.state.player.thirst);
        
        // Проверка накормленности и напоенности (уже делается в updatePlayerStatus с уроном)
        // Здесь можно добавить более мягкие дебаффы, если не критично, но голод/жажда есть

        // Производство ресурсов от структур (пока не реализовано через инвентарь)
        // const foodProduced = this.foodPerDayFromStructures;
        // if (foodProduced > 0) { this.addItemToInventory("food_garden_produce", foodProduced); ... }
        // const waterProduced = this.waterPerDayFromStructures;
        // if (waterProduced > 0) { this.addItemToInventory("water_purified", waterProduced); ... }
        
        // Шанс найти нового выжившего с радиовышкой
        // ... (логика осталась прежней, но нужно проверить, что maxSurvivors работает)

        this.triggerRandomEvent();
        this.updateDisplay();
        this.updateBuildActions();
        this.saveGame();
    },

    scoutArea: function() { // Заменяет старый scavenge
        if (this.state.gameOver || this.state.currentEvent) return;
        this.log("Вы отправляетесь на разведку окрестностей...", "event-neutral");

        // TODO: Реализовать механику нахождения новых локаций или случайных находок/событий в "окрестностях"
        // Пока просто имитация старого scavenge с новыми предметами
        
        let encounter = Math.random();
        let foundSomething = false;

        if (encounter < 0.7) { // 70% шанс что-то найти
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

            if (Math.random() < 0.15) { // Малый шанс найти что-то получше
                if (this.addItemToInventory("components", 1)) {
                    this.log("Удалось найти редкие компоненты!", "event-discovery");
                    foundSomething = true;
                }
            }

        } else if (encounter < 0.9) { // 20% шанс на неприятности
            this.log("Разведка оказалась опасной. Вы едва унесли ноги.", "event-negative");
            this.takeDamage(Math.floor(Math.random() * 10) + 5, "засада");
        } else { // 10% ничего
             this.log("Разведка не принесла результатов.", "event-neutral");
        }
        
        if(!foundSomething && encounter >= 0.7 && encounter < 0.9) {} // Если была только опасность, без находок
        else if (!foundSomething) {
            this.log("Ничего ценного не найдено.", "event-neutral");
        }


        this.nextDay(); // Разведка занимает день
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
        this.dom.buildActions.innerHTML = ''; // Убрали заголовок, т.к. он уже есть во вкладке
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
    possibleEvents: [ /* ... можно оставить или адаптировать награды под предметы ... */ ],
    triggerRandomEvent: function() { /* ... осталась без изменений, но действия в событиях могут давать предметы ... */ },
    displayEventChoices: function() { /* ... осталась без изменений ... */ },

    // --- GAME OVER & RESET ---
    gameOver: function(message) { /* ... осталась без изменений ... */ },
    resetGameConfirmation: function() { /* ... осталась без изменений ... */ },
    resetGame: function() {
        localStorage.removeItem('zombieSurvivalGame_v3');
        this.state.day = 1;
        this.state.survivors = 1;
        this.state.gameOver = false;
        this.state.currentEvent = null;
        this.state.inventory = []; // Очищаем инвентарь
        this.state.player = { // Сброс состояния игрока
            health: 100, maxHealth: 100,
            hunger: 100, maxHunger: 100,
            thirst: 100, maxThirst: 100,
            carryWeight: 0, maxCarryWeight: 25,
            condition: "В порядке",
        };
        this.state.discoveredLocations = {};
        
        this.initializeStructures();
        this.addInitialItems(); // Добавляем стартовые предметы

        this.dom.mainActions.innerHTML = `<button onclick="game.nextDay()">Следующий день</button>`; // Восстанавливаем, если gameOver менял
        this.dom.logMessages.innerHTML = '';
        this.init(); // Переинициализация
        this.log("Новая игра начата.", "event-neutral");
    }
};

window.onload = () => {
    game.init();
};

// Вспомогательная функция для getStructureUpgradeCost в buildings.js, если она там нужна глобально
// window.getStructureUpgradeCost = getStructureUpgradeCost;
