// script.js

const GAME_VERSION = "0.5.3"; // Версия: Завершение рефакторинга менеджеров

// Используем gameState, domElements, UIManager, InventoryManager, LocationManager, EventManager
// Предполагается, что эти файлы загружены РАНЬШЕ script.js в index.html

// Вспомогательная функция для глубокого слияния объектов состояния
function deepMergeStates(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                    target[key] = {}; // Инициализируем, если target[key] не объект или не существует
                }
                deepMergeStates(target[key], source[key]);
            } else if (source[key] !== undefined) { // Копируем примитивы, массивы и null
                target[key] = source[key];
            }
        }
    }
    // Добавляем ключи из target, которых нет в source (для новых полей в initialGameState)
    for (const key in target) {
        if (target.hasOwnProperty(key) && !source.hasOwnProperty(key)) {
            // Это означает, что в loadedState нет этого ключа, он останется из initialGameState
        }
    }
    return target;
}


const game = {
    init: function() {
        domElements.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        // gameState уже инициализирован копией initialGameState
        // this.initializeStructures(); // Вызывается внутри loadGame или если нет сохранения

        this.loadGame(); // Загрузка игры теперь также обрабатывает инициализацию структур, если нужно

        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedVersionKey = `zombieSurvivalGame_v${major}.${minor}`;

        // Инициализация состояния локаций (перепроверка после loadGame)
        if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0) {
            gameState.discoveredLocations = JSON.parse(JSON.stringify(initialGameState.discoveredLocations));
        }
        const baseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"])
                           ? LOCATION_DEFINITIONS["base_surroundings"]
                           : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []}; // Fallback

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
        // baseInventory должен быть инициализирован в loadGame или initialGameState
        if (!gameState.baseInventory) {
            gameState.baseInventory = [];
        }


        if (!localStorage.getItem(savedVersionKey)) {
            // Если это самый первый запуск этой версии и нет сохранения
            if (InventoryManager.countItemInInventory(gameState.inventory, "food_canned") === 0) { // Проверяем наличие ключевого предмета
                 this.addInitialItemsToPlayer();
            }
            if (InventoryManager.countItemInInventory(gameState.baseInventory, "scrap_metal") === 0) { // Проверяем наличие ключевого предмета
                this.addInitialItemsToBase();
            }
        }

        // Первоначальное обновление UI через UIManager
        if (typeof UIManager !== 'undefined') {
            UIManager.updateDisplay();
            UIManager.updateBuildActions();
        }
        if (typeof LocationManager !== 'undefined') {
            LocationManager.updateExploreTab();
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
                    if (window.innerWidth <= 768 && domElements.sidebar.classList.contains('open')) {
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

        // this.log("Игра началась. Пустошь ждет.", "event-neutral"); // Лог из loadGame будет более уместен
        const defaultNavLink = domElements.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
        if (typeof UIManager !== 'undefined') {
            if (defaultNavLink) {
                UIManager.openTab('main-tab', defaultNavLink);
            } else {
                 UIManager.openTab('main-tab', null);
            }
        }
    },

    initializeStructures: function() {
        // Эта функция теперь в основном для новой игры или если структуры не загрузились
        gameState.structures = JSON.parse(JSON.stringify(initialGameState.structures)); // Сброс к начальным
        if (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') {
            for (const key in BASE_STRUCTURE_DEFINITIONS) {
                if (!gameState.structures[key]) { // Добавляем, если еще не существует
                    const def = BASE_STRUCTURE_DEFINITIONS[key];
                    gameState.structures[key] = {
                        level: def.initialLevel || 0,
                    };
                }
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
        if (!domElements || !domElements.logMessages) return; // Защита, если DOM еще не готов
        const p = document.createElement('p');
        p.innerHTML = `[Д:${gameState.day}] ${message}`;
        p.className = type;
        domElements.logMessages.prepend(p);
        if (domElements.logMessages.children.length > 30) {
            domElements.logMessages.removeChild(domElements.logMessages.lastChild);
        }
        domElements.logMessages.scrollTop = 0; // Всегда прокручивать лог
    },

    toggleLogVisibility: function() {
        gameState.logVisible = !gameState.logVisible;
        if (typeof UIManager !== 'undefined') UIManager.applyLogVisibility();
        this.saveGame();
    },

    saveGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.setItem(`zombieSurvivalGame_v${major}.${minor}`, JSON.stringify(gameState));
        // console.log("Game Saved:", gameState); // Для отладки
    },

    loadGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedGame = localStorage.getItem(`zombieSurvivalGame_v${major}.${minor}`);

        if (savedGame) {
            try {
                const loadedState = JSON.parse(savedGame);
                // Создаем новый объект gameState, начиная с initialGameState, и сливаем с ним loadedState
                // Это гарантирует, что все поля из initialGameState будут присутствовать,
                // и если в loadedState есть новые/измененные поля, они перезапишут начальные.
                // А если в initialGameState появились новые поля (обновление игры), они останутся.
                gameState = JSON.parse(JSON.stringify(initialGameState)); // Начинаем с чистой копии initial
                deepMergeStates(gameState, loadedState); // Глубоко сливаем загруженное состояние

                // Дополнительные проверки и инициализации после слияния
                if (!gameState.baseInventory) gameState.baseInventory = [];
                if (!gameState.inventory) gameState.inventory = [];
                if (!gameState.flags) gameState.flags = {};
                if (gameState.logVisible === undefined) gameState.logVisible = true;

                // Инициализация/проверка структур
                const initialStructures = JSON.parse(JSON.stringify(initialGameState.structures));
                gameState.structures = gameState.structures || {};
                if (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') {
                    for (const key in BASE_STRUCTURE_DEFINITIONS) {
                        if (!gameState.structures[key]) {
                             gameState.structures[key] = initialStructures[key] || { level: BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0 };
                        } else if (gameState.structures[key].level === undefined) {
                            gameState.structures[key].level = BASE_STRUCTURE_DEFINITIONS[key].initialLevel || 0;
                        }
                    }
                }


                // Проверка и установка currentLocationId и discoveredLocations
                if (!gameState.currentLocationId || !LOCATION_DEFINITIONS[gameState.currentLocationId]) {
                    gameState.currentLocationId = "base_surroundings";
                }

                const defaultBaseLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"])
                                          ? LOCATION_DEFINITIONS["base_surroundings"]
                                          : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []};

                if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0) {
                    gameState.discoveredLocations = {
                        "base_surroundings": {
                            discovered: true,
                            name: defaultBaseLocDef.name,
                            searchAttemptsLeft: defaultBaseLocDef.initialSearchAttempts,
                            foundSpecialItems: {}
                        }
                    };
                } else {
                    // Убедимся, что базовая локация всегда есть
                    if (!gameState.discoveredLocations["base_surroundings"]) {
                        gameState.discoveredLocations["base_surroundings"] = {
                            discovered: true,
                            name: defaultBaseLocDef.name,
                            searchAttemptsLeft: defaultBaseLocDef.initialSearchAttempts,
                            foundSpecialItems: {}
                        };
                    }
                    // Проверка остальных загруженных локаций
                    for (const locId in gameState.discoveredLocations) {
                        const locState = gameState.discoveredLocations[locId];
                        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                        if (locDef) {
                            if (locState.searchAttemptsLeft === undefined) {
                                locState.searchAttemptsLeft = locDef.initialSearchAttempts;
                            }
                            if (locState.foundSpecialItems === undefined) {
                                locState.foundSpecialItems = {};
                            }
                            if (locState.name === undefined) { // Если имя не сохранилось
                                locState.name = locDef.name;
                            }
                        } else if (locId !== "base_surroundings") { // Если определение локации удалено из игры
                            delete gameState.discoveredLocations[locId];
                            this.log(`Удалена информация о несуществующей локации: ${locId}`, "event-neutral");
                        }
                    }
                }
                // Убедимся, что player содержит все поля из initialGameState.player
                gameState.player = { ...initialGameState.player, ...gameState.player };


                this.log("Сохраненная игра загружена.", "event-discovery");
            } catch (error) {
                console.error("Ошибка загрузки сохранения:", error);
                this.log("Ошибка при загрузке сохранения. Начинаем новую игру.", "event-negative");
                this.resetGameInternals(false); // Сброс без удаления из localStorage, чтобы не зациклиться
            }
        } else {
            this.log("Сохраненная игра не найдена, начинаем новую.", "event-neutral");
            this.initializeStructures(); // Инициализируем структуры для новой игры
            // Начальные предметы будут добавлены в game.init()
        }
    },

    nextDay: function() {
        if (gameState.gameOver) return;
        if (gameState.currentEvent || gameState.locationEvent) {
            this.log("Завершите текущее событие, чтобы перейти к следующему дню.", "event-warning");
            return;
        }

        gameState.day++;
        this.log(`--- Наступил День ${gameState.day} ---`, "event-neutral");

        gameState.dailyFoodNeed = gameState.survivors * 10; // Примерное значение, можно вынести в константы
        gameState.dailyWaterNeed = gameState.survivors * 15; // Примерное значение

        let foodConsumedFromBase = 0;
        let waterConsumedFromBase = 0;
        if (typeof InventoryManager !== 'undefined') {
            foodConsumedFromBase = InventoryManager.consumeResourceFromBase('food', gameState.dailyFoodNeed);
            waterConsumedFromBase = InventoryManager.consumeResourceFromBase('water', gameState.dailyWaterNeed);
        }

        const foodShortage = gameState.dailyFoodNeed - foodConsumedFromBase;
        const waterShortage = gameState.dailyWaterNeed - waterConsumedFromBase;

        let survivorsDiedThisDay = 0;

        if (foodShortage > 0) {
            this.log(`На складе не хватило еды для ${Math.ceil(foodShortage / 10)} выживш. Потреблено ${foodConsumedFromBase} из ${gameState.dailyFoodNeed}. Выжившие голодают!`, "event-negative");
            let diedFromHunger = 0;
            for (let i = 0; i < gameState.survivors; i++) { // Проверяем для каждого выжившего
                if (Math.random() < 0.20) { // 20% шанс умереть от голода, если есть нехватка
                    diedFromHunger++;
                }
            }
            if (diedFromHunger > 0) {
                const actualDeaths = Math.min(diedFromHunger, gameState.survivors - survivorsDiedThisDay); // Нельзя умереть больше, чем есть
                if (actualDeaths > 0) {
                    gameState.survivors -= actualDeaths;
                    survivorsDiedThisDay += actualDeaths;
                    this.log(`${actualDeaths} выживших умерло от голода!`, "event-negative");
                }
            }
        } else {
            this.log(`Выжившие поели. Со склада потрачено ${foodConsumedFromBase} ед. сытости.`, "event-neutral");
        }

        if (gameState.survivors <= 0 && !gameState.gameOver) { this.gameOver("Все выжившие погибли от голода."); return; }


        if (waterShortage > 0) {
            this.log(`На складе не хватило воды для ${Math.ceil(waterShortage / 15)} выживш. Потреблено ${waterConsumedFromBase} из ${gameState.dailyWaterNeed}. Выжившие страдают от жажды!`, "event-negative");
            let diedFromThirst = 0;
            for (let i = 0; i < gameState.survivors; i++) { // Проверяем для каждого выжившего (кто еще жив)
                if (Math.random() < 0.25) { // 25% шанс умереть от жажды
                    diedFromThirst++;
                }
            }
            if (diedFromThirst > 0) {
                const actualDeaths = Math.min(diedFromThirst, gameState.survivors - survivorsDiedThisDay);
                if (actualDeaths > 0) {
                    gameState.survivors -= actualDeaths;
                    // survivorsDiedThisDay += actualDeaths; // Обновлять не нужно, т.к. gameState.survivors уже уменьшен
                    this.log(`${actualDeaths} выживших умерло от обезвоживания!`, "event-negative");
                }
            }
        } else {
             this.log(`Выжившие попили. Со склада потрачено ${waterConsumedFromBase} ед. утоления жажды.`, "event-neutral");
        }

        if (gameState.survivors <= 0 && !gameState.gameOver) { this.gameOver("Все выжившие погибли от жажды или голода."); return; }


        if (typeof EventManager !== 'undefined') EventManager.triggerRandomEvent();

        if (!gameState.currentEvent && !gameState.locationEvent && document.getElementById('main-tab').style.display === 'block') {
             domElements.eventActionsContainer.style.display = 'none';
             domElements.eventTextDisplay.textContent = '';
             domElements.eventActions.innerHTML = '';
        }
        if (typeof UIManager !== 'undefined') {
            UIManager.updateDisplay();
            UIManager.updateBuildActions();
        }
        this.saveGame();
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

        const costDefinition = getStructureUpgradeCost(structureKey, currentStructureState.level);
        let canAfford = true;
        let missingResLog = [];

        if (typeof InventoryManager !== 'undefined') {
            for (const itemId in costDefinition) {
                const requiredQty = costDefinition[itemId];
                const currentQty = InventoryManager.countItemInInventory(gameState.baseInventory, itemId);
                if (currentQty < requiredQty) {
                    canAfford = false;
                    missingResLog.push(`${requiredQty - currentQty} ${ITEM_DEFINITIONS[itemId] ? ITEM_DEFINITIONS[itemId].name : itemId}`);
                }
            }

            if (canAfford) {
                for (const itemId in costDefinition) {
                    InventoryManager.removeItemFromInventory(gameState.baseInventory, itemId, costDefinition[itemId]);
                }
                currentStructureState.level++;
                this.log(`${definition.name} улучшен до уровня ${currentStructureState.level}. Ресурсы взяты со склада.`, "event-positive");
                if (typeof UIManager !== 'undefined') {
                    UIManager.updateDisplay();
                    UIManager.updateBuildActions();
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
                    if (InventoryManager.countItemInInventory(gameState.inventory, toolId) === 0) { // Инструменты проверяем в инвентаре игрока
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
        if (typeof InventoryManager !== 'undefined') {
            recipe.ingredients.forEach(ing => {
                InventoryManager.removeItemFromInventory(gameState.baseInventory, ing.itemId, ing.quantity);
            });

            InventoryManager.addItemToInventory(gameState.inventory, recipe.resultItemId, recipe.resultQuantity); // Результат крафта - игроку
            this.log(`Создано: ${ITEM_DEFINITIONS[recipe.resultItemId].name} (x${recipe.resultQuantity}) и добавлено в инвентарь игрока.`, "event-positive");

            if (recipe.additionalResults) {
                recipe.additionalResults.forEach(addRes => {
                    const quantity = Array.isArray(addRes.quantity) ?
                                     Math.floor(Math.random() * (addRes.quantity[1] - addRes.quantity[0] + 1)) + addRes.quantity[0] :
                                     addRes.quantity;
                    if (InventoryManager.addItemToInventory(gameState.inventory, addRes.itemId, quantity)) { // Доп. результат - игроку
                        this.log(`Дополнительно получено в инвентарь: ${ITEM_DEFINITIONS[addRes.itemId].name} (x${quantity})`, "event-discovery");
                    }
                });
            }
        }

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
        // Предполагается, что кнопки действий имеют класс "game-action-button"
        document.querySelectorAll('.game-action-button').forEach(button => {
             button.disabled = true;
        });
        // Кнопки, которые должны оставаться активными, не должны иметь класс game-action-button
        // или нужно будет добавить им исключение здесь.
        // Например, кнопка "Начать игру заново" и "Закрыть инвентарь"
        // Их лучше не помечать классом game-action-button.

        domElements.eventActionsContainer.style.display = 'none';
    },

    resetGameConfirmation: function() {
        if (confirm("Вы уверены, что хотите начать игру заново? Весь прогресс будет потерян.")) {
            this.resetGame();
        }
    },

    resetGameInternals: function(logMessage = true) {
        gameState = JSON.parse(JSON.stringify(initialGameState)); // Восстанавливаем изначальное состояние

        // Дополнительная инициализация, которая может потребоваться
        const baseLocDefDefault = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]) ? LOCATION_DEFINITIONS["base_surroundings"] : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []};
        gameState.discoveredLocations = {
            "base_surroundings": {
                discovered: true,
                name: baseLocDefDefault.name,
                searchAttemptsLeft: baseLocDefDefault.initialSearchAttempts,
                foundSpecialItems: {}
            }
        };
        gameState.currentLocationId = "base_surroundings";

        this.initializeStructures(); // Инициализируем структуры заново
        this.addInitialItemsToPlayer(); // Выдаем начальные предметы игроку
        this.addInitialItemsToBase();   // Выдаем начальные предметы на базу

        domElements.logMessages.innerHTML = '';
        domElements.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;

        if (typeof UIManager !== 'undefined') {
            UIManager.applyLogVisibility();
            UIManager.updateDisplay();
            UIManager.updateBuildActions();
        }
        if (typeof LocationManager !== 'undefined') LocationManager.updateExploreTab();

        // Включаем кнопки обратно (если они были помечены классом game-action-button)
        document.querySelectorAll('.game-action-button').forEach(button => {
            button.disabled = false;
        });
        // Если какие-то кнопки должны оставаться выключенными, их нужно будет обработать отдельно.

        if (typeof UIManager !== 'undefined') {
            UIManager.updateBuildActions(); // Перепроверить кнопки строительства
            UIManager.updateExploreTabDisplay(); // Перепроверить кнопки разведки
        }

        const defaultNavLink = domElements.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
        if (typeof UIManager !== 'undefined') {
            if (defaultNavLink) {
                UIManager.openTab('main-tab', defaultNavLink);
            } else {
                UIManager.openTab('main-tab', null);
            }
        }
        domElements.eventActionsContainer.style.display = 'none';

        if (logMessage) this.log("Новая игра начата.", "event-neutral");
    },

    resetGame: function() {
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        localStorage.removeItem(`zombieSurvivalGame_v${major}.${minor}`); // Удаляем сохранение

        this.resetGameInternals(true); // Выполняем сброс состояния
        this.saveGame(); // Сохраняем "чистое" начальное состояние
    }
};

window.onload = () => {
    if (typeof ITEM_DEFINITIONS !== 'undefined' &&
        typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined' &&
        typeof LOCATION_DEFINITIONS !== 'undefined' &&
        typeof CRAFTING_RECIPES !== 'undefined' &&
        typeof gameState !== 'undefined' && // gameState уже определен глобально
        typeof domElements !== 'undefined' &&
        typeof GameStateGetters !== 'undefined' && // GameStateGetters теперь часть game_state.js
        typeof UIManager !== 'undefined' &&
        typeof InventoryManager !== 'undefined' &&
        typeof LocationManager !== 'undefined' &&
        typeof EventManager !== 'undefined'
        ) {
        game.init();
    } else {
        console.error("Один или несколько файлов определений или менеджеров не загружены или загружены не в том порядке! Проверьте консоль на наличие ошибок в этих файлах.");
        let errorMsg = "Ошибка загрузки игровых данных. Пожалуйста, проверьте консоль (F12) и обновите страницу. Возможные проблемы:\n";
        if (typeof ITEM_DEFINITIONS === 'undefined') errorMsg += "- ITEM_DEFINITIONS не определен (items.js?)\n";
        if (typeof BASE_STRUCTURE_DEFINITIONS === 'undefined') errorMsg += "- BASE_STRUCTURE_DEFINITIONS не определен (buildings.js?)\n";
        // ... и так далее для всех зависимостей
        document.body.innerHTML = `<p style='color:red; font-size:18px; text-align:center; margin-top: 50px;'>${errorMsg.replace(/\n/g, "<br>")}</p>`;
    }
};
