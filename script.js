// script.js

const GAME_VERSION = "0.5.3"; // Версия: Завершение рефакторинга менеджеров

// Используем gameState, domElements, UIManager, InventoryManager, LocationManager, EventManager
// Предполагается, что эти файлы загружены РАНЬШЕ script.js в index.html

const game = {
    init: function() {
        domElements.gameVersionDisplay.textContent = `Версия: ${GAME_VERSION}`;
        this.initializeStructures();
        this.loadGame(); 
        
        const [major, minor] = GAME_VERSION.split('.').map(Number);
        const savedVersionKey = `zombieSurvivalGame_v${major}.${minor}`;

        // Инициализация состояния локаций, если его нет или оно неполное
        if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0) {
            gameState.discoveredLocations = {}; 
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
        if (!gameState.baseInventory) { 
            gameState.baseInventory = [];
        }


        if (!localStorage.getItem(savedVersionKey)) { 
            if (gameState.inventory.length === 0) this.addInitialItemsToPlayer(); 
            this.addInitialItemsToBase(); 
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

        this.log("Игра началась. Пустошь ждет.", "event-neutral");
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
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.addItemToInventory(gameState.inventory, "food_canned", 1); 
            InventoryManager.addItemToInventory(gameState.inventory, "water_purified", 1);
            InventoryManager.addItemToInventory(gameState.inventory, "bandages_crude", 1);
            InventoryManager.addItemToInventory(gameState.inventory, "tool_hammer", 1); 
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
        if(gameState.logVisible) domElements.logMessages.scrollTop = 0; 
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
            const loadedState = JSON.parse(savedGame);
            
            // Глубокое копирование с сохранением структуры initialGameState
            for (const key in initialGameState) { 
                if (loadedState.hasOwnProperty(key)) {
                    // Для объектов (кроме массивов, которые копируются целиком, если есть) делаем слияние
                    if (typeof initialGameState[key] === 'object' && initialGameState[key] !== null && !Array.isArray(initialGameState[key])) {
                         gameState[key] = { ...initialGameState[key], ...loadedState[key] };
                         // Особая обработка для discoveredLocations, чтобы сохранить searchAttemptsLeft и т.д.
                         if (key === 'discoveredLocations') {
                            for (const locId in loadedState.discoveredLocations) {
                                if (gameState.discoveredLocations[locId]) { // Если такая локация уже есть в gameState (например, из initialGameState)
                                    gameState.discoveredLocations[locId] = { ...gameState.discoveredLocations[locId], ...loadedState.discoveredLocations[locId] };
                                } else { // Если это новая локация из сохранения
                                    gameState.discoveredLocations[locId] = loadedState.discoveredLocations[locId];
                                }
                                // Убедимся, что у всех загруженных локаций есть нужные поля
                                const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
                                if (locDef && gameState.discoveredLocations[locId].searchAttemptsLeft === undefined) {
                                    gameState.discoveredLocations[locId].searchAttemptsLeft = locDef.initialSearchAttempts;
                                }
                                if (gameState.discoveredLocations[locId].foundSpecialItems === undefined) {
                                     gameState.discoveredLocations[locId].foundSpecialItems = {};
                                }
                            }
                        }
                    } else { // Для примитивов и массивов просто присваиваем значение из сохранения
                        gameState[key] = loadedState[key];
                    }
                } else { // Если в сохранении нет ключа, берем из дефолтного
                    gameState[key] = JSON.parse(JSON.stringify(initialGameState[key]));
                }
            }
            // Гарантируем наличие baseInventory
             if (!gameState.baseInventory) gameState.baseInventory = []; 

            // Проверка и установка currentLocationId и discoveredLocations, если они отсутствуют или некорректны
            if (!gameState.currentLocationId) gameState.currentLocationId = "base_surroundings";
            const baseLocDefDefault = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]) 
                                      ? LOCATION_DEFINITIONS["base_surroundings"] 
                                      : {name: "Окрестности Базы", initialSearchAttempts: 5, entryLoot: []}; // Fallback
            if (!gameState.discoveredLocations || Object.keys(gameState.discoveredLocations).length === 0 || !gameState.discoveredLocations["base_surroundings"]) {
                gameState.discoveredLocations = { 
                    "base_surroundings": { 
                        discovered: true, 
                        name: baseLocDefDefault.name, 
                        searchAttemptsLeft: baseLocDefDefault.initialSearchAttempts, 
                        foundSpecialItems: {} 
                    } 
                };
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

        let foodConsumedFromBase = 0;
        let waterConsumedFromBase = 0;
        if (typeof InventoryManager !== 'undefined') {
            foodConsumedFromBase = InventoryManager.consumeResourceFromBase('food', gameState.dailyFoodNeed);
            waterConsumedFromBase = InventoryManager.consumeResourceFromBase('water', gameState.dailyWaterNeed);
        }


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
        if (!definition || !currentStructureState) return;
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
        if (typeof InventoryManager !== 'undefined') {
            recipe.ingredients.forEach(ing => {
                InventoryManager.removeItemFromInventory(gameState.baseInventory, ing.itemId, ing.quantity);
            });

            InventoryManager.addItemToInventory(gameState.inventory, recipe.resultItemId, recipe.resultQuantity);
            this.log(`Создано: ${ITEM_DEFINITIONS[recipe.resultItemId].name} (x${recipe.resultQuantity})`, "event-positive");

            if (recipe.additionalResults) {
                recipe.additionalResults.forEach(addRes => {
                    const quantity = Array.isArray(addRes.quantity) ? 
                                     Math.floor(Math.random() * (addRes.quantity[1] - addRes.quantity[0] + 1)) + addRes.quantity[0] :
                                     addRes.quantity;
                    if (InventoryManager.addItemToInventory(gameState.inventory, addRes.itemId, quantity)) {
                        this.log(`Дополнительно получено: ${ITEM_DEFINITIONS[addRes.itemId].name} (x${quantity})`, "event-discovery");
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
        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            const onclickAttr = button.getAttribute('onclick');
            if(onclickAttr !== "game.resetGameConfirmation()" && onclickAttr !== "InventoryManager.closeInventoryModal()") { 
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
        
        if (typeof UIManager !== 'undefined') {
            UIManager.applyLogVisibility();
            UIManager.updateDisplay(); 
            UIManager.updateBuildActions();
        }
        if (typeof LocationManager !== 'undefined') LocationManager.updateExploreTab(); 


        document.querySelectorAll('#sidebar button, #main-content button').forEach(button => {
            if(button.getAttribute('onclick') !== "game.resetGameConfirmation()" && button.getAttribute('onclick') !== "InventoryManager.closeInventoryModal()") {
                 button.disabled = false;
            }
        });
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

        this.log("Новая игра начата.", "event-neutral");
        this.saveGame(); 
    }
};

window.onload = () => {
    // Убедимся, что все глобальные объекты (включая менеджеры) определены
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
        typeof EventManager !== 'undefined' 
        ) {
        game.init();
    } else {
        console.error("Один или несколько файлов определений или менеджеров не загружены или загружены не в том порядке! Проверьте консоль на наличие ошибок в этих файлах.");
        document.body.innerHTML = "<p style='color:red; font-size:18px; text-align:center; margin-top: 50px;'>Ошибка загрузки игровых данных. Пожалуйста, проверьте консоль (F12) и обновите страницу.</p>";
    }
};
