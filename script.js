// script.js

const GAME_VERSION = "0.5.3"; // Версия: Завершение рефакторинга менеджеров

// Используем gameState, domElements, UIManager, InventoryManager, LocationManager, EventManager, Cheats
// Предполагается, что эти файлы загружены РАНЬШЕ script.js в index.html

// Вспомогательная функция для глубокого слияния объектов состояния
function deepMergeStates(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                    target[key] = {}; 
                }
                deepMergeStates(target[key], source[key]);
            } else if (source[key] !== undefined) { 
                target[key] = source[key];
            }
        }
    }
    // Добавляем ключи из target, которых нет в source (для новых полей в initialGameState)
    // Это гарантирует, что если в initialGameState добавлены новые поля, они не будут потеряны при загрузке старого сейва.
    for (const key in target) { 
        if (target.hasOwnProperty(key) && !source.hasOwnProperty(key)) {
            // Это означает, что в loadedState нет этого ключа, он останется из initialGameState,
            // так как мы начинаем с копии initialGameState и сливаем в нее.
        }
    }
    return target;
}


const game = {
    isPassingDay: false, // Флаг, чтобы предотвратить двойное нажатие кнопки "пропустить день"

    init: function() {
        domElements.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        
        this.loadGame(); 
        
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedVersionKey = `zombieSurvivalGame_v${major}.${minor}`;

        // Перепроверка и инициализация ключевых структур после loadGame, если они все еще отсутствуют
        if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0) {
            gameState.discoveredLocations = JSON.parse(JSON.stringify(initialGameState.discoveredLocations));
        }
        const baseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"])
                           ? LOCATION_DEFINITIONS["base_surroundings"]
                           : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []}; 

        if (!gameState.discoveredLocations["base_surroundings"] ||
            gameState.discoveredLocations["base_surroundings"].searchAttemptsLeft === undefined) {
            gameState.discoveredLocations["base_surroundings"] = { 
                discovered: true, 
                name: baseLocDef.name,
                searchAttemptsLeft: baseLocDef.initialSearchAttempts, 
                foundSpecialItems: {}
            };
        }
        if (!gameState.currentLocationId || !LOCATION_DEFINITIONS[gameState.currentLocationId]) {
             gameState.currentLocationId = "base_surroundings";
        }
        if (!gameState.baseInventory) { 
            gameState.baseInventory = [];
        }
        if (!gameState.inventory) {
            gameState.inventory = [];
        }
        if (!gameState.structures) {
            this.initializeStructures(); // Если структуры не загрузились, инициализируем
        }


        if (!localStorage.getItem(savedVersionKey)) { 
            // Если это самый первый запуск этой версии и нет сохранения,
            // или если loadGame не смог загрузить и сбросил до initialGameState
            if (InventoryManager.countItemInInventory(gameState.inventory, "food_canned") === 0 && 
                InventoryManager.countItemInInventory(gameState.inventory, "water_purified") === 0) {
                 this.addInitialItemsToPlayer();
            }
            if (InventoryManager.countItemInInventory(gameState.baseInventory, "scrap_metal") === 0 &&
                InventoryManager.countItemInInventory(gameState.baseInventory, "wood") === 0) {
                this.addInitialItemsToBase();
            }
        }
        
        if (typeof UIManager !== 'undefined') {
            UIManager.updateDisplay(); 
        }
        // Первоначальное открытие вкладки "Обзор"
        const defaultNavLink = domElements.mainNav?.querySelector('.nav-link[data-tab="main-tab"]');
        if (typeof UIManager !== 'undefined') {
            if (defaultNavLink) UIManager.openTab('main-tab', defaultNavLink); 
            else UIManager.openTab('main-tab', null); 
        }

        // Навешивание событий на статические элементы DOM
        if (domElements.inventoryButton && typeof InventoryManager !== 'undefined') {
            domElements.inventoryButton.onclick = () => InventoryManager.openInventoryModal();
        }
        if(domElements.inventoryFilters && typeof InventoryManager !== 'undefined') {
            domElements.inventoryFilters.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', (e) => InventoryManager.filterPlayerInventory(e.target.dataset.filter));
            });
        }
        if (domElements.baseInventoryFilters && typeof InventoryManager !== 'undefined') { 
            domElements.baseInventoryFilters.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', (e) => InventoryManager.filterBaseInventory(e.target.dataset.filter));
            });
        }
        if (domElements.mainNav && typeof UIManager !== 'undefined') {
            domElements.mainNav.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    UIManager.openTab(e.target.dataset.tab, e.target); 
                    if (window.innerWidth <= 768 && domElements.sidebar?.classList.contains('open')) { 
                        UIManager.toggleSidebar(); 
                    }
                });
            });
        }
        if (domElements.toggleLogButton) {
            domElements.toggleLogButton.addEventListener('click', () => this.toggleLogVisibility()); 
        }
        if (typeof UIManager !== 'undefined') UIManager.applyLogVisibility(); 
        if (domElements.burgerMenuButton && typeof UIManager !== 'undefined') {
            domElements.burgerMenuButton.onclick = () => UIManager.toggleSidebar(); 
        }
        if (domElements.locationInfoCloseButton && typeof UIManager !== 'undefined') { // Для новой модалки
            domElements.locationInfoCloseButton.onclick = () => UIManager.closeLocationInfoModal();
        }
    },

    initializeStructures: function() {
        gameState.structures = {}; // Очищаем текущие
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
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.addItemToInventory(gameState.inventory, "food_canned", 1); 
            InventoryManager.addItemToInventory(gameState.inventory, "water_purified", 1);
            InventoryManager.addItemToInventory(gameState.inventory, "bandages_crude", 1);
            InventoryManager.addItemToInventory(gameState.inventory, "tool_hammer", 1); 
            this.log("Игроку выданы начальные предметы.", "event-discovery");
        }
    },
    addInitialItemsToBase: function() {
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.addItemToInventory(gameState.baseInventory, "food_canned", 5);
            InventoryManager.addItemToInventory(gameState.baseInventory, "water_purified", 5);
            InventoryManager.addItemToInventory(gameState.baseInventory, "scrap_metal", 10);
            InventoryManager.addItemToInventory(gameState.baseInventory, "wood", 10);
            InventoryManager.addItemToInventory(gameState.baseInventory, "cloth", 5);
            InventoryManager.addItemToInventory(gameState.baseInventory, "broken_electronics", 2);
            this.log("На склад базы добавлены начальные ресурсы.", "event-discovery");
        }
    },
    
    takeDamage: function(amount, source) {
        if (gameState.gameOver) return;
        gameState.player.health -= amount;
        this.log(`Вы получили ${amount} урона (${source}).`, "event-negative");
        if (gameState.player.health <= 0) {
            gameState.player.health = 0;
            this.gameOver(`Вы погибли от ${source}. Пустошь беспощадна.`);
        }
        if (typeof UIManager !== 'undefined') UIManager.updatePlayerStatus(); 
    },

    log: function(message, type = "event-neutral") {
        if (!domElements || !domElements.logMessages) return; 
        const p = document.createElement('p');
        p.innerHTML = `[Д:${gameState.day}] ${message}`; 
        p.className = type;
        domElements.logMessages.prepend(p);
        if (domElements.logMessages.children.length > 30) {
            domElements.logMessages.removeChild(domElements.logMessages.lastChild);
        }
        domElements.logMessages.scrollTop = 0; 
    },

    toggleLogVisibility: function() { 
        gameState.logVisible = !gameState.logVisible;
        if (typeof UIManager !== 'undefined') UIManager.applyLogVisibility();
        this.saveGame(); 
    },

    saveGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.setItem(`zombieSurvivalGame_v${major}.${minor}`, JSON.stringify(gameState));
    },

    loadGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedGame = localStorage.getItem(`zombieSurvivalGame_v${major}.${minor}`);

        if (savedGame) {
            try {
                const loadedState = JSON.parse(savedGame);
                gameState = JSON.parse(JSON.stringify(initialGameState)); 
                deepMergeStates(gameState, loadedState); 

                if (!gameState.baseInventory) gameState.baseInventory = [];
                if (!gameState.inventory) gameState.inventory = [];
                if (!gameState.flags) gameState.flags = {};
                if (gameState.logVisible === undefined) gameState.logVisible = true;

                const initialStructures = JSON.parse(JSON.stringify(initialGameState.structures));
                gameState.structures = gameState.structures || {};
                if (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') {
                    for (const key in BASE_STRUCTURE_DEFINITIONS) {
                        if (!gameState.structures[key]) {
                             gameState.structures[key] = initialStructures[key] || { level: BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0 };
                        } else if (gameState.structures[key].level === undefined) { // Если уровень не был сохранен
                            gameState.structures[key].level = BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0;
                        }
                    }
                     // Удаляем структуры из gameState, которых нет в BASE_STRUCTURE_DEFINITIONS
                    for (const keyInState in gameState.structures) {
                        if (!BASE_STRUCTURE_DEFINITIONS[keyInState]) {
                            delete gameState.structures[keyInState];
                        }
                    }
                } else { // Если нет определений, но есть структуры в сейве, лучше сбросить
                    this.initializeStructures();
                }


                if (!gameState.currentLocationId || !LOCATION_DEFINITIONS[gameState.currentLocationId]) {
                    gameState.currentLocationId = "base_surroundings";
                }

                const defaultBaseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"])
                                          ? LOCATION_DEFINITIONS["base_surroundings"]
                                          : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []};

                if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0) {
                    gameState.discoveredLocations = {
                        "base_surroundings": {
                            discovered: true, name: defaultBaseLocDef.name,
                            searchAttemptsLeft: defaultBaseLocDef.initialSearchAttempts, foundSpecialItems: {}
                        }
                    };
                } else {
                    if (!gameState.discoveredLocations["base_surroundings"]) {
                        gameState.discoveredLocations["base_surroundings"] = {
                            discovered: true, name: defaultBaseLocDef.name,
                            searchAttemptsLeft: defaultBaseLocDef.initialSearchAttempts, foundSpecialItems: {}
                        };
                    }
                    for (const locId in gameState.discoveredLocations) {
                        const locState = gameState.discoveredLocations[locId];
                        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                        if (locDef) {
                            if (locState.searchAttemptsLeft === undefined) locState.searchAttemptsLeft = locDef.initialSearchAttempts;
                            if (locState.foundSpecialItems === undefined) locState.foundSpecialItems = {};
                            if (locState.name === undefined) locState.name = locDef.name;
                        } else if (locId !== "base_surroundings") {
                            delete gameState.discoveredLocations[locId];
                            this.log(`Удалена информация о несуществующей локации: ${locId}`, "event-neutral");
                        }
                    }
                }
                gameState.player = { ...initialGameState.player, ...gameState.player }; // Гарантируем все поля игрока

                this.log("Сохраненная игра загружена.", "event-discovery");
            } catch (error) {
                console.error("Ошибка загрузки сохранения:", error);
                this.log("Ошибка при загрузке сохранения. Начинаем новую игру.", "event-negative");
                this.resetGameInternals(false); 
            }
        } else {
            this.log("Сохраненная игра не найдена, начинаем новую.", "event-neutral");
            this.initializeStructures(); 
            // Начальные предметы будут добавлены в game.init() если это необходимо
        }
    },

    _processEndOfDay: function(logActionName = "День завершился") {
        this.log(`--- ${logActionName}. Наступает День ${gameState.day + 1} ---`, "event-neutral");
        gameState.day++;

        gameState.dailyFoodNeed = gameState.survivors * 10; 
        gameState.dailyWaterNeed = gameState.survivors * 15; 

        let foodConsumedFromBase = 0;
        let waterConsumedFromBase = 0;
        if (typeof InventoryManager !== 'undefined') {
            foodConsumedFromBase = InventoryManager.consumeResourceFromBase('food', gameState.dailyFoodNeed);
            waterConsumedFromBase = InventoryManager.consumeResourceFromBase('water', gameState.dailyWaterNeed);
        }

        const foodShortage = gameState.dailyFoodNeed - foodConsumedFromBase;
        const waterShortage = gameState.dailyWaterNeed - waterConsumedFromBase;
        
        if (foodShortage > 0) {
            this.log(`На складе не хватило еды для ~${Math.ceil(foodShortage / 10)} выживш. Потреблено ${foodConsumedFromBase}/${gameState.dailyFoodNeed}. Выжившие голодают!`, "event-negative");
            let diedFromHunger = 0;
            for (let i = 0; i < gameState.survivors; i++) {
                if (Math.random() < 0.20) diedFromHunger++;
            }
            if (diedFromHunger > 0 && !gameState.gameOver) {
                const actualDeaths = Math.min(diedFromHunger, gameState.survivors);
                 if (actualDeaths > 0) {
                    gameState.survivors -= actualDeaths;
                    this.log(`${actualDeaths} выживших умерло от голода!`, "event-negative");
                    if (gameState.survivors <= 0) { this.gameOver("Все выжившие погибли от голода."); return; }
                }
            }
        } else {
            this.log(`Выжившие поели. Со склада потрачено ${foodConsumedFromBase} ед. сытости.`, "event-neutral");
        }
        if (gameState.gameOver) return;

        if (waterShortage > 0) {
            this.log(`На складе не хватило воды для ~${Math.ceil(waterShortage / 15)} выживш. Потреблено ${waterConsumedFromBase}/${gameState.dailyWaterNeed}. Выжившие страдают от жажды!`, "event-negative");
            let diedFromThirst = 0;
            for (let i = 0; i < gameState.survivors; i++) {
                if (Math.random() < 0.25) diedFromThirst++;
            }
            if (diedFromThirst > 0 && !gameState.gameOver) {
                const actualDeaths = Math.min(diedFromThirst, gameState.survivors);
                if (actualDeaths > 0) {
                    gameState.survivors -= actualDeaths;
                    this.log(`${actualDeaths} выживших умерло от обезвоживания!`, "event-negative");
                    if (gameState.survivors <= 0) { this.gameOver("Все выжившие погибли от жажды."); return; }
                }
            }
        } else {
             this.log(`Выжившие попили. Со склада потрачено ${waterConsumedFromBase} ед. утоления жажды.`, "event-neutral");
        }
        if (gameState.gameOver) return;
        
        if (typeof EventManager !== 'undefined') EventManager.triggerRandomEvent(); 
        
        if (document.getElementById('explore-tab')?.style.display === 'block' && 
            !gameState.currentEvent && !gameState.locationEvent && domElements.eventActionsContainer) {
             domElements.eventActionsContainer.style.display = 'none';
             if (domElements.eventTextDisplay) domElements.eventTextDisplay.textContent = '';
             if (domElements.eventActions) domElements.eventActions.innerHTML = '';
        }
    },

    passDayAtBase: async function() {
        if (gameState.gameOver || this.isPassingDay) return;
        if (gameState.currentEvent || gameState.locationEvent) { 
            this.log("Завершите текущее событие, прежде чем отдыхать.", "event-warning");
            return;
        }
        this.isPassingDay = true;
        if(domElements.passDayAtBaseButton) domElements.passDayAtBaseButton.disabled = true;
        // Также блокируем другие основные действия
        if(domElements.scoutCurrentLocationButton) domElements.scoutCurrentLocationButton.disabled = true;
        if(domElements.discoverNewLocationButton) domElements.discoverNewLocationButton.disabled = true;


        if (domElements.passDayProgressBarContainer && domElements.passDayProgressBarInner && domElements.passDayProgressBarText) {
            domElements.passDayProgressBarContainer.style.display = 'block';
            domElements.passDayProgressBarInner.style.width = '0%';
            domElements.passDayProgressBarText.textContent = 'Отдых... 0%';

            for (let i = 0; i <= 100; i += 25) { 
                await new Promise(resolve => setTimeout(resolve, 150)); 
                if(domElements.passDayProgressBarInner) domElements.passDayProgressBarInner.style.width = `${i}%`;
                if(domElements.passDayProgressBarText) domElements.passDayProgressBarText.textContent = i < 100 ? `Отдых... ${i}%` : 'День завершен!';
            }
            await new Promise(resolve => setTimeout(resolve, 200)); 
        }

        this._processEndOfDay("Отдых на базе"); 

        if (domElements.passDayProgressBarContainer) domElements.passDayProgressBarContainer.style.display = 'none';
        
        if (typeof UIManager !== 'undefined') {
            UIManager.updateDisplay(); 
        }
        this.saveGame();
        this.isPassingDay = false;
        
        // Обновление состояния кнопок после завершения отдыха
        if (typeof UIManager !== 'undefined') { // UIManager обновит кнопки через updateForTab
            const activeTabLink = domElements.mainNav?.querySelector('.nav-link.active');
            if (activeTabLink) UIManager.updateForTab(activeTabLink.dataset.tab);
        }
    },

    build: function(structureKey) { 
        if (gameState.gameOver || gameState.currentEvent || gameState.locationEvent) return;
        const definition = (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') ? BASE_STRUCTURE_DEFINITIONS[structureKey] : null;
        const currentStructureState = gameState.structures[structureKey];
        if (!definition || !currentStructureState) {
            this.log(`Ошибка: определение или состояние постройки ${structureKey} не найдено.`, "event-negative");
            return;
        }
        if (currentStructureState.level >= definition.maxLevel) {
            this.log(`${definition.name} уже максимального уровня.`, "event-neutral");
            return;
        }

        const costDefinition = (typeof getStructureUpgradeCost === 'function') ? getStructureUpgradeCost(structureKey, currentStructureState.level) : null; 
        if (!costDefinition) {
            this.log(`Ошибка: не удалось получить стоимость улучшения для ${definition.name}.`, "event-negative");
            return;
        }

        let canAfford = true;
        let missingResLog = [];

        if (typeof InventoryManager !== 'undefined' && typeof ITEM_DEFINITIONS !== 'undefined') {
            for (const itemId in costDefinition) {
                const requiredQty = costDefinition[itemId];
                const currentQty = InventoryManager.countItemInInventory(gameState.baseInventory, itemId); 
                if (currentQty < requiredQty) {
                    canAfford = false;
                    const itemDef = ITEM_DEFINITIONS[itemId];
                    missingResLog.push(`${requiredQty - currentQty} ${itemDef ? itemDef.name : itemId}`);
                }
            }

            if (canAfford) {
                for (const itemId in costDefinition) {
                    InventoryManager.removeItemFromInventory(gameState.baseInventory, itemId, costDefinition[itemId]); 
                }
                currentStructureState.level++;
                this.log(`${definition.name} улучшен до уровня ${currentStructureState.level}. Ресурсы взяты со склада.`, "event-positive");
                
                // Предполагаем, что постройка мгновенная. Если занимает время, здесь будет другая логика.

                if (typeof UIManager !== 'undefined') {
                    UIManager.updateDisplay(); // Обновит все, включая обзор построек и кнопки на вкладке База
                }
                this.saveGame();
            } else {
                this.log(`Недостаточно ресурсов на складе для ${definition.name}. Нужно еще: ${missingResLog.join(', ')}.`, "event-negative");
            }
        }
    },

    canCraft: function(recipeId) {
        const recipe = (typeof CRAFTING_RECIPES !== 'undefined') ? CRAFTING_RECIPES[recipeId] : null;
        if (!recipe) return false;

        const workshopLevel = gameState.structures.workshop ? gameState.structures.workshop.level : 0;
        if (workshopLevel < (recipe.workshopLevelRequired || 0)) {
            return false;
        }
        if (typeof InventoryManager !== 'undefined') {
            for (const ing of recipe.ingredients) {
                if (InventoryManager.countItemInInventory(gameState.baseInventory, ing.itemId) < ing.quantity) {
                    return false;
                }
            }
            if (recipe.toolsRequired && recipe.toolsRequired.length > 0) {
                for (const toolId of recipe.toolsRequired) {
                    if (InventoryManager.countItemInInventory(gameState.inventory, toolId) === 0) { 
                        return false;
                    }
                }
            }
        } else { return false; } 
        return true;
    },

    craftItem: function(recipeId) {
        if (!this.canCraft(recipeId)) {
            this.log("Невозможно создать предмет: не хватает ресурсов, инструментов или не тот уровень мастерской.", "event-negative");
            if (typeof UIManager !== 'undefined') UIManager.renderCraftingRecipes(); 
            return;
        }

        const recipe = CRAFTING_RECIPES[recipeId];
        if (typeof InventoryManager !== 'undefined' && typeof ITEM_DEFINITIONS !== 'undefined') {
            recipe.ingredients.forEach(ing => {
                InventoryManager.removeItemFromInventory(gameState.baseInventory, ing.itemId, ing.quantity);
            });

            InventoryManager.addItemToInventory(gameState.inventory, recipe.resultItemId, recipe.resultQuantity); 
            this.log(`Создано: ${ITEM_DEFINITIONS[recipe.resultItemId].name} (x${recipe.resultQuantity}) и добавлено в инвентарь игрока.`, "event-positive");

            if (recipe.additionalResults) {
                recipe.additionalResults.forEach(addRes => {
                    const quantity = Array.isArray(addRes.quantity) ? 
                                     Math.floor(Math.random() * (addRes.quantity[1] - addRes.quantity[0] + 1)) + addRes.quantity[0] :
                                     addRes.quantity;
                    if (InventoryManager.addItemToInventory(gameState.inventory, addRes.itemId, quantity)) { 
                        this.log(`Дополнительно получено в инвентарь: ${ITEM_DEFINITIONS[addRes.itemId].name} (x${quantity})`, "event-discovery");
                    }
                });
            }
        }
        // Предполагаем, что крафт мгновенный. Если занимает время, здесь будет другая логика.
        if (typeof UIManager !== 'undefined') {
            UIManager.updateDisplay(); 
            UIManager.renderCraftingRecipes(); 
        }
        this.saveGame();
    },

    gameOver: function(message) {
        if(gameState.gameOver) return; 
        this.log(message, "event-negative");
        gameState.gameOver = true;
        document.querySelectorAll('.game-action-button').forEach(button => {
             button.disabled = true;
             button.classList.remove('action-available'); // Убираем подсветку доступности
        });
        if(domElements.eventActionsContainer) domElements.eventActionsContainer.style.display = 'none'; 
    },
    
    resetGameConfirmation: function() {
        if (confirm("Вы уверены, что хотите начать игру заново? Весь прогресс будет потерян.")) {
            this.resetGame();
        }
    },

    resetGameInternals: function(logMessage = true) {
        gameState = JSON.parse(JSON.stringify(initialGameState)); 
        const baseLocDefDefault = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]) ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []};
        gameState.discoveredLocations = { 
            "base_surroundings": { 
                discovered: true, name: baseLocDefDefault.name,
                searchAttemptsLeft: baseLocDefDefault.initialSearchAttempts, foundSpecialItems: {}
            } 
        };
        gameState.currentLocationId = "base_surroundings";
        this.isPassingDay = false; // Сбрасываем флаг пропуска дня
        
        this.initializeStructures(); 
        this.addInitialItemsToPlayer(); 
        this.addInitialItemsToBase();

        if(domElements.logMessages) domElements.logMessages.innerHTML = ''; 
        if(domElements.gameVersionDisplay) domElements.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        
        if (typeof UIManager !== 'undefined') {
            UIManager.applyLogVisibility();
            UIManager.updateDisplay(); 
        }

        document.querySelectorAll('.game-action-button').forEach(button => {
            button.disabled = false; 
            // UIManager.updateDisplay() должен будет корректно обновить класс .action-available
        });

        const defaultNavLink = domElements.mainNav?.querySelector('.nav-link[data-tab="main-tab"]');
        if (typeof UIManager !== 'undefined') {
            if (defaultNavLink) UIManager.openTab('main-tab', defaultNavLink);
            else UIManager.openTab('main-tab', null); 
        }
        if(domElements.eventActionsContainer) domElements.eventActionsContainer.style.display = 'none'; 

        if (logMessage) this.log("Новая игра начата.", "event-neutral");
    },

    resetGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.removeItem(`zombieSurvivalGame_v${major}.${minor}`);
        this.resetGameInternals(true); 
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
        typeof GameStateGetters !== 'undefined' && 
        typeof UIManager !== 'undefined' && 
        typeof InventoryManager !== 'undefined' &&
        typeof LocationManager !== 'undefined' && 
        typeof EventManager !== 'undefined' &&
        (typeof Cheats !== 'undefined' || console.log("Cheats module not loaded, but optional.")) // Cheats опционален
        ) {
        game.init();
    } else {
        console.error("Один или несколько файлов определений или менеджеров не загружены или загружены не в том порядке! Проверьте консоль на наличие ошибок в этих файлах.");
        let errorMsg = "Ошибка загрузки игровых данных. Пожалуйста, проверьте консоль (F12) и обновите страницу. Возможные проблемы:\n";
        if (typeof ITEM_DEFINITIONS === 'undefined') errorMsg += "- ITEM_DEFINITIONS (items.js)\n";
        if (typeof BASE_STRUCTURE_DEFINITIONS === 'undefined') errorMsg += "- BASE_STRUCTURE_DEFINITIONS (buildings.js)\n";
        if (typeof LOCATION_DEFINITIONS === 'undefined') errorMsg += "- LOCATION_DEFINITIONS (locations.js)\n";
        if (typeof CRAFTING_RECIPES === 'undefined') errorMsg += "- CRAFTING_RECIPES (recipes.js)\n";
        if (typeof gameState === 'undefined') errorMsg += "- gameState (game_state.js)\n";
        if (typeof domElements === 'undefined') errorMsg += "- domElements (dom_elements.js)\n";
        if (typeof GameStateGetters === 'undefined') errorMsg += "- GameStateGetters (game_state.js)\n";
        if (typeof UIManager === 'undefined') errorMsg += "- UIManager (ui_manager.js)\n";
        if (typeof InventoryManager === 'undefined') errorMsg += "- InventoryManager (inventory_manager.js)\n";
        if (typeof LocationManager === 'undefined') errorMsg += "- LocationManager (location_manager.js)\n";
        if (typeof EventManager === 'undefined') errorMsg += "- EventManager (event_manager.js)\n";
        
        document.body.innerHTML = `<p style='color:red; font-size:18px; text-align:center; margin-top: 50px;'>${errorMsg.replace(/\n/g, "<br>")}</p>`;
    }
};
