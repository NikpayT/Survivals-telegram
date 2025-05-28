// cheats_manager.js

// Предполагается, что gameState, ITEM_DEFINITIONS, BASE_STRUCTURE_DEFINITIONS, LOCATION_DEFINITIONS,
// InventoryManager, LocationManager, EventManager, UIManager, game доступны глобально.

const Cheats = {
    logCheat: function(message) {
        if (typeof game !== 'undefined' && game.log) {
            game.log(`ЧИТ: ${message}`, "event-warning"); // Используем стиль предупреждения для читов
        }
        console.warn(`CHEAT USED: ${message}`);
    },

    // --- Ресурсы и Предметы ---
    addCommonResources: function() {
        this.logCheat("Добавление базовых ресурсов на склад.");
        if (typeof InventoryManager !== 'undefined') {
            const common = ["wood", "scrap_metal", "cloth", "components", "food_canned", "water_purified", "broken_electronics", "chemicals", "wires", "leather_scraps"];
            common.forEach(itemId => {
                if (ITEM_DEFINITIONS[itemId]) {
                    InventoryManager.addItemToInventory(gameState.baseInventory, itemId, 100);
                } else {
                    console.warn(`Cheat: Item ID "${itemId}" not found in ITEM_DEFINITIONS.`);
                }
            });
        }
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
    },

    addAllItemsToPlayer: function(quantity = 1) {
        this.logCheat(`Добавление всех предметов (x${quantity}) игроку.`);
        if (typeof InventoryManager !== 'undefined' && typeof ITEM_DEFINITIONS !== 'undefined') {
            for (const itemId in ITEM_DEFINITIONS) {
                InventoryManager.addItemToInventory(gameState.inventory, itemId, quantity);
            }
        }
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
    },

    addAllItemsToBase: function(quantity = 10) {
        this.logCheat(`Добавление всех предметов (x${quantity}) на склад.`);
        if (typeof InventoryManager !== 'undefined' && typeof ITEM_DEFINITIONS !== 'undefined') {
            for (const itemId in ITEM_DEFINITIONS) {
                InventoryManager.addItemToInventory(gameState.baseInventory, itemId, quantity);
            }
        }
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
    },

    clearPlayerInventory: function() {
        this.logCheat("Очистка инвентаря игрока.");
        gameState.inventory = [];
        gameState.player.carryWeight = 0;
        if (typeof InventoryManager !== 'undefined') InventoryManager.renderPlayerInventoryIfActive();
        if (typeof UIManager !== 'undefined') UIManager.updateInventoryWeightDisplay();
    },

    clearBaseInventory: function() {
        this.logCheat("Очистка склада базы.");
        gameState.baseInventory = [];
        if (typeof InventoryManager !== 'undefined') InventoryManager.renderBaseInventoryIfActive();
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Обновить счетчики на базе
    },

    // --- Статус Игрока и Базы ---
    healPlayerFull: function() {
        this.logCheat("Полное восстановление здоровья, сытости и жажды игрока.");
        gameState.player.health = gameState.player.maxHealth;
        gameState.player.hunger = gameState.player.maxHunger;
        gameState.player.thirst = gameState.player.maxThirst;
        gameState.player.condition = "В порядке";
        if (typeof UIManager !== 'undefined') UIManager.updatePlayerStatus();
    },

    setPlayerStat: function(stat, value) {
        value = parseInt(value, 10);
        if (isNaN(value)) {
            this.logCheat(`Ошибка: неверное значение для стата ${stat}: ${value}`);
            return;
        }
        this.logCheat(`Установка ${stat} игрока = ${value}.`);
        if (gameState.player.hasOwnProperty(stat)) {
            gameState.player[stat] = value;
            // Ограничения, если нужно (например, здоровье не больше макс. здоровья)
            if (stat === 'health') gameState.player.health = Math.min(value, gameState.player.maxHealth);
            if (stat === 'hunger') gameState.player.hunger = Math.min(value, gameState.player.maxHunger);
            if (stat === 'thirst') gameState.player.thirst = Math.min(value, gameState.player.maxThirst);
        } else {
            console.warn(`Cheat: Player stat "${stat}" not found.`);
        }
        if (typeof UIManager !== 'undefined') UIManager.updatePlayerStatus();
    },

    addSurvivor: function() {
        this.logCheat("Добавление выжившего.");
        if (typeof GameStateGetters !== 'undefined' && gameState.survivors < GameStateGetters.getMaxSurvivors()) {
            gameState.survivors++;
        } else {
            this.logCheat("Невозможно добавить выжившего: достигнут лимит или GameStateGetters не найден.");
        }
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
    },

    setDay: function(dayNumber) {
        dayNumber = parseInt(dayNumber, 10);
        if (isNaN(dayNumber) || dayNumber < 1) {
            this.logCheat(`Ошибка: неверный номер дня: ${dayNumber}`);
            return;
        }
        this.logCheat(`Установка дня: ${dayNumber}.`);
        gameState.day = dayNumber;
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
    },

    // --- Прогресс и Открытия ---
    maxAllStructures: function() {
        this.logCheat("Установка максимального уровня для всех построек.");
        if (typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') {
            for (const key in gameState.structures) {
                if (BASE_STRUCTURE_DEFINITIONS[key]) {
                    gameState.structures[key].level = BASE_STRUCTURE_DEFINITIONS[key].maxLevel;
                }
            }
        }
        if (typeof UIManager !== 'undefined') UIManager.updateBuildActions();
    },

    discoverAllLocations: function() {
        this.logCheat("Открытие всех локаций.");
        if (typeof LOCATION_DEFINITIONS !== 'undefined') {
            for (const locId in LOCATION_DEFINITIONS) {
                if (!gameState.discoveredLocations[locId] || !gameState.discoveredLocations[locId].discovered) {
                    const locDef = LOCATION_DEFINITIONS[locId];
                    gameState.discoveredLocations[locId] = {
                        discovered: true,
                        name: locDef.name,
                        searchAttemptsLeft: locDef.initialSearchAttempts,
                        foundSpecialItems: {}
                    };
                }
            }
        }
        if (typeof LocationManager !== 'undefined') LocationManager.updateExploreTab();
    },

    resetAllExploration: function() {
        this.logCheat("Сброс прогресса обыска всех открытых локаций.");
        if (typeof LOCATION_DEFINITIONS !== 'undefined') {
            for (const locId in gameState.discoveredLocations) {
                if (gameState.discoveredLocations[locId].discovered && LOCATION_DEFINITIONS[locId]) {
                    gameState.discoveredLocations[locId].searchAttemptsLeft = LOCATION_DEFINITIONS[locId].initialSearchAttempts;
                    gameState.discoveredLocations[locId].foundSpecialItems = {};
                }
            }
        }
        if (typeof LocationManager !== 'undefined') LocationManager.updateExploreTab();
    },

    resetEventFlags: function() {
        this.logCheat("Сброс всех флагов событий.");
        gameState.flags = {};
        // Может потребоваться дополнительная логика, если флаги влияют на UI немедленно
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
    },

    // --- События ---
    triggerSpecificEvent: function(eventId) {
        this.logCheat(`Попытка запуска события по ID: ${eventId}.`);
        if (typeof EventManager !== 'undefined' && EventManager.possibleEvents) {
            const eventToTrigger = EventManager.possibleEvents.find(event => event.id === eventId);
            if (eventToTrigger) {
                if (gameState.currentEvent || gameState.locationEvent) {
                    this.logCheat("Невозможно запустить событие, другое уже активно. Сбросьте текущие события сначала.");
                    return;
                }
                gameState.currentEvent = { ...eventToTrigger }; // Копируем, чтобы не менять оригинал
                if (typeof game !== 'undefined' && game.log) game.log(`ЧИТ: Запущено событие - ${gameState.currentEvent.text}`, "event-discovery");
                EventManager.displayEventChoices();
                if (typeof UIManager !== 'undefined' && document.getElementById('explore-tab')?.style.display !== 'block') {
                    UIManager.openTab('explore-tab', document.querySelector('#main-nav .nav-link[data-tab="explore-tab"]'));
                } else if (typeof UIManager !== 'undefined') {
                    UIManager.updateForTab('explore-tab'); // Обновить вкладку, если она уже открыта
                }

            } else {
                this.logCheat(`Событие с ID "${eventId}" не найдено в EventManager.possibleEvents.`);
            }
        } else {
            this.logCheat("EventManager или его список событий не определены.");
        }
    },

    clearCurrentEvents: function() {
        this.logCheat("Сброс текущих активных глобальных и локационных событий.");
        gameState.currentEvent = null;
        gameState.locationEvent = null;
        if (typeof UIManager !== 'undefined') {
            UIManager.finalizeEventUI(); // Это скроет UI событий и обновит кнопки
        }
    }
};
