// ui_manager.js

// Предполагается, что gameState, domElements, GameStateGetters, ITEM_DEFINITIONS,
// BASE_STRUCTURE_DEFINITIONS, LOCATION_DEFINITIONS, CRAFTING_RECIPES
// и game (для вызова game.build, game.craftItem и т.д. из кнопок, сгенерированных здесь) доступны глобально.
// Также InventoryManager, LocationManager, EventManager должны быть доступны.

const UIManager = {
    // --- Основные функции обновления UI ---
    updateDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined') {
            console.error("UIManager.updateDisplay: Critical objects not defined!");
            return;
        }
        domElements.day.textContent = gameState.day;
        domElements.survivors.textContent = gameState.survivors;
        domElements.maxSurvivors.textContent = GameStateGetters.getMaxSurvivors();

        this.updatePlayerStatus(); // Обновит и сайдбар, и, если нужно, инвентарь
        this.updateInventoryWeightDisplay();

        domElements.totalFoodValue.textContent = GameStateGetters.countBaseFoodItems();
        domElements.totalWaterValue.textContent = GameStateGetters.countBaseWaterItems();

        if (document.getElementById('main-tab').style.display === 'block') {
            this.updateOverviewTabStats();
        }

        if (domElements.inventoryModal.style.display === 'block' && typeof InventoryManager !== 'undefined') {
            const activeFilter = domElements.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            InventoryManager.renderPlayerInventory(activeFilter); // Делегируем InventoryManager
        }
        if (document.getElementById('explore-tab').style.display === 'block' && typeof LocationManager !== 'undefined') {
            LocationManager.updateExploreTabDisplay(); // Делегируем
        }
        if (document.getElementById('storage-tab')?.style.display === 'block' && typeof InventoryManager !== 'undefined') {
            const storageActiveFilter = domElements.baseInventoryFilters?.querySelector('button.active')?.dataset.filter || 'all';
            InventoryManager.renderBaseInventory(storageActiveFilter); // Делегируем
        }
        if (document.getElementById('craft-tab')?.style.display === 'block') {
            this.renderCraftingRecipes();
        }
        if (document.getElementById('base-tab')?.style.display === 'block') {
            this.updateBuildActions();
        }
    },

    updatePlayerStatus: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined') return;
        const player = gameState.player;

        // Здоровье
        const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
        domElements.healthBarInner.style.width = `${healthPercent}%`;
        domElements.healthBarText.textContent = `${player.health}/${player.maxHealth}`;
        domElements.healthBarInner.classList.remove('critical', 'low');
        if (healthPercent <= 25) domElements.healthBarInner.classList.add('critical');
        else if (healthPercent <= 50) domElements.healthBarInner.classList.add('low');

        // Сытость
        const hungerTh = GameStateGetters.getHungerThresholds();
        domElements.hungerBarInner.classList.remove('critical', 'low', 'normal'); // Сброс классов
        if (player.hunger <= 0) {
            domElements.hungerBarText.textContent = "Смерть";
            domElements.hungerBarInner.style.width = `0%`;
            domElements.hungerBarInner.classList.add('critical');
        } else if (player.hunger <= hungerTh.critical) {
            domElements.hungerBarText.textContent = "Истощение";
            domElements.hungerBarInner.style.width = `${(player.hunger / hungerTh.critical) * 25}%`; // Прогресс до 25%
            domElements.hungerBarInner.classList.add('critical');
        } else if (player.hunger <= hungerTh.low) {
            domElements.hungerBarText.textContent = "Голод";
            domElements.hungerBarInner.style.width = `${25 + ((player.hunger - hungerTh.critical) / (hungerTh.low - hungerTh.critical)) * 25}%`; // Прогресс от 25% до 50%
            domElements.hungerBarInner.classList.add('low');
        } else {
            domElements.hungerBarText.textContent = "Сыт";
            // Прогресс от 50% до 100% (предполагая, что player.maxHunger - это верхняя граница "Сыт")
            domElements.hungerBarInner.style.width = `${50 + ((player.hunger - hungerTh.low) / (player.maxHunger - hungerTh.low)) * 50}%`;
            domElements.hungerBarInner.classList.add('normal'); // Или можно не добавлять класс, если это стандартное состояние
        }
        // Ограничиваем ширину максимальным значением 100%
        domElements.hungerBarInner.style.width = `${Math.min(100, parseFloat(domElements.hungerBarInner.style.width))}%`;


        // Жажда
        const thirstTh = GameStateGetters.getThirstThresholds();
        domElements.thirstBarInner.classList.remove('critical', 'low', 'normal'); // Сброс классов
        if (player.thirst <= 0) {
            domElements.thirstBarText.textContent = "Смерть";
            domElements.thirstBarInner.style.width = `0%`;
            domElements.thirstBarInner.classList.add('critical');
        } else if (player.thirst <= thirstTh.critical) {
            domElements.thirstBarText.textContent = "Сильная жажда";
            domElements.thirstBarInner.style.width = `${(player.thirst / thirstTh.critical) * 25}%`;
            domElements.thirstBarInner.classList.add('critical');
        } else if (player.thirst <= thirstTh.low) {
            domElements.thirstBarText.textContent = "Жажда";
            domElements.thirstBarInner.style.width = `${25 + ((player.thirst - thirstTh.critical) / (thirstTh.low - thirstTh.critical)) * 25}%`;
            domElements.thirstBarInner.classList.add('low');
        } else {
            domElements.thirstBarText.textContent = "Норма";
            domElements.thirstBarInner.style.width = `${50 + ((player.thirst - thirstTh.low) / (player.maxThirst - thirstTh.low)) * 50}%`;
            domElements.thirstBarInner.classList.add('normal');
        }
        domElements.thirstBarInner.style.width = `${Math.min(100, parseFloat(domElements.thirstBarInner.style.width))}%`;


        domElements.playerCondition.textContent = gameState.player.condition;

        // Если модальное окно инвентаря открыто, обновляем его отображение через InventoryManager
        if (domElements.inventoryModal.style.display === 'block' && typeof InventoryManager !== 'undefined') {
            const activeFilter = domElements.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all';
            InventoryManager.renderPlayerInventory(activeFilter);
        }
    },

    updateInventoryWeightDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof gameState.player === 'undefined') return;
        domElements.inventoryWeight.textContent = gameState.player.carryWeight.toFixed(1);
        domElements.inventoryMaxWeight.textContent = gameState.player.maxCarryWeight;
    },

    updateOverviewTabStats: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined') return;
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

    // --- Управление вкладками и сайдбаром ---
    openTab: function(tabName, clickedLinkElement) {
        if (!domElements) return;
        domElements.tabContentArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = "none");
        domElements.mainNav.querySelectorAll('.nav-link').forEach(tl => tl.classList.remove("active"));

        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.style.display = "block";
        } else {
            console.error("Tab not found: " + tabName + ". Opening main-tab by default.");
            document.getElementById('main-tab').style.display = "block";
            const defaultLink = domElements.mainNav.querySelector('.nav-link[data-tab="main-tab"]');
            if (defaultLink) defaultLink.classList.add('active');
            // Вызываем обновление для вкладки по умолчанию, если целевая не найдена
            this.updateForTab('main-tab');
            return;
        }

        if (clickedLinkElement) {
            clickedLinkElement.classList.add("active");
        } else {
            const linkToActivate = domElements.mainNav.querySelector(`.nav-link[data-tab="${tabName}"]`);
            if (linkToActivate) linkToActivate.classList.add('active');
        }

        this.updateForTab(tabName); // Вызываем обновление для открытой вкладки
    },

    updateForTab: function(tabName) {
        // Обновляет содержимое в зависимости от активной вкладки
        if (tabName === 'main-tab') {
            this.updateOverviewTabStats();
            if (gameState.currentEvent && typeof EventManager !== 'undefined') {
                domElements.eventTextDisplay.textContent = gameState.currentEvent.text;
                domElements.eventActionsContainer.style.display = 'block';
                EventManager.displayEventChoices();
            } else if (gameState.locationEvent && typeof EventManager !== 'undefined') {
                 domElements.eventTextDisplay.textContent = gameState.locationEvent.text;
                 domElements.eventActionsContainer.style.display = 'block';
                 EventManager.displayLocationEventChoices();
            }
            else {
                domElements.eventTextDisplay.textContent = '';
                domElements.eventActionsContainer.style.display = 'none';
            }
        } else if (tabName === 'base-tab') {
            this.updateBuildActions();
        } else if (tabName === 'explore-tab' && typeof LocationManager !== 'undefined') {
            LocationManager.updateExploreTab();
        } else if (tabName === 'storage-tab' && typeof InventoryManager !== 'undefined') {
            const storageActiveFilter = domElements.baseInventoryFilters?.querySelector('button.active')?.dataset.filter || 'all';
            InventoryManager.renderBaseInventory(storageActiveFilter);
        } else if (tabName === 'craft-tab') {
            this.renderCraftingRecipes();
        }
    },

    toggleSidebar: function() {
        if (!domElements) return;
        domElements.sidebar.classList.toggle('open');
    },

    applyLogVisibility: function() {
        if (!domElements || !domElements.logMessages) return;
        if (gameState.logVisible) {
            domElements.logMessages.classList.remove('hidden');
            domElements.toggleLogButton.textContent = '-';
        } else {
            domElements.logMessages.classList.add('hidden');
            domElements.toggleLogButton.textContent = '+';
        }
    },

    // --- Рендеринг списков ---
    // renderPlayerInventory и renderBaseInventory теперь должны быть в InventoryManager.js
    // Если они остаются здесь, нужно раскомментировать и адаптировать код из предыдущей версии.
    // Для примера, я оставлю заглушки, предполагая, что они в InventoryManager.

    /*
    renderPlayerInventory: function(filterType = 'all') {
        console.warn("UIManager.renderPlayerInventory is deprecated. Use InventoryManager.renderPlayerInventory.");
        // Логика рендеринга инвентаря игрока (если не делегировано InventoryManager)
        // ... (код из старой версии UIManager.renderPlayerInventory) ...
        // this.updateInventoryWeightDisplay(); // Не забыть обновить вес
    },

    renderBaseInventory: function(filterType = 'all') {
        console.warn("UIManager.renderBaseInventory is deprecated. Use InventoryManager.renderBaseInventory.");
        // Логика рендеринга склада базы (если не делегировано InventoryManager)
        // ... (код из старой версии UIManager.renderBaseInventory) ...
    },
    */

    updateExploreTabDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof LOCATION_DEFINITIONS === 'undefined') return;
        const currentLocationId = gameState.currentLocationId;
        const currentLocationDef = LOCATION_DEFINITIONS[currentLocationId];
        const currentLocationState = gameState.discoveredLocations[currentLocationId];

        if (currentLocationDef && currentLocationState) {
            domElements.currentLocationNameDisplay.textContent = currentLocationDef.name;
            domElements.currentLocationDescriptionDisplay.textContent = `${currentLocationDef.description} (Попыток обыска: ${currentLocationState.searchAttemptsLeft || 0})`;
            domElements.currentLocationTimeDisplay.textContent = currentLocationDef.scoutTime || 1;

            const canSearch = (currentLocationState.searchAttemptsLeft || 0) > 0;
            // Предполагаем, что кнопка имеет класс 'game-action-button' для управления ее состоянием в game.js
            domElements.scoutCurrentLocationButton.disabled = !canSearch || gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null;
            domElements.scoutCurrentLocationButton.textContent = canSearch ? `Обыскать (${currentLocationDef.scoutTime || 1} д.)` : "Локация обыскана";

        } else {
            domElements.currentLocationNameDisplay.textContent = "Неизвестно";
            domElements.currentLocationDescriptionDisplay.textContent = "Ошибка: текущая локация не найдена.";
            domElements.scoutCurrentLocationButton.disabled = true;
            domElements.scoutCurrentLocationButton.textContent = "Обыскать";
        }
        // Предполагаем, что кнопка имеет класс 'game-action-button'
        domElements.discoverNewLocationButton.disabled = gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null;
    },

    renderDiscoveredLocations: function() {
        if (!domElements || !domElements.discoveredLocationsList || typeof gameState === 'undefined' || typeof LOCATION_DEFINITIONS === 'undefined') return;
        domElements.discoveredLocationsList.innerHTML = '';
        let hasDiscoveredOtherThanBase = false;

        for (const locId in gameState.discoveredLocations) {
            if (gameState.discoveredLocations[locId].discovered) {
                const locDef = LOCATION_DEFINITIONS[locId];
                if (!locDef) {
                    console.warn(`UIManager.renderDiscoveredLocations: Definition for location ${locId} not found.`);
                    continue;
                }
                if (locId !== "base_surroundings") hasDiscoveredOtherThanBase = true;

                const entryDiv = document.createElement('div');
                entryDiv.className = 'location-entry';
                if (locId === gameState.currentLocationId) {
                    entryDiv.classList.add('active-location');
                }

                entryDiv.onclick = () => (typeof LocationManager !== 'undefined' ? LocationManager.setCurrentLocation(locId) : console.error("LocationManager not defined for setCurrentLocation"));

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
        if (!hasDiscoveredOtherThanBase && Object.keys(gameState.discoveredLocations).filter(id => gameState.discoveredLocations[id].discovered && id !== "base_surroundings").length === 0) {
            domElements.discoveredLocationsList.innerHTML = '<p><em>Используйте "Разведать новые территории", чтобы найти новые места.</em></p>';
        }
    },

    updateBuildActions: function() {
        if (!domElements || !domElements.buildActions || typeof gameState === 'undefined' || typeof BASE_STRUCTURE_DEFINITIONS === 'undefined' || typeof InventoryManager === 'undefined') return;
        if (typeof ITEM_DEFINITIONS === 'undefined') {
            console.warn("UIManager.updateBuildActions: ITEM_DEFINITIONS not loaded yet.");
            domElements.buildActions.innerHTML = '<p>Загрузка определений предметов...</p>';
            return;
        }
        domElements.buildActions.innerHTML = '';
        for (const key in gameState.structures) {
            const definition = BASE_STRUCTURE_DEFINITIONS[key];
            const currentStructureState = gameState.structures[key];
            if (!definition) {
                console.warn(`UIManager.updateBuildActions: Definition for structure ${key} not found.`);
                continue;
            }

            const btn = document.createElement('button');
            btn.classList.add('tooltip-host');
            // Добавляем класс для управления блокировкой из game.js
            btn.classList.add('game-action-button');


            let costStringForTooltip = "";
            let canAffordAll = true;
            let atMaxLevel = currentStructureState.level >= definition.maxLevel;

            if (!atMaxLevel) {
                const costDef = (typeof getStructureUpgradeCost === 'function') ? getStructureUpgradeCost(key, currentStructureState.level) : {};
                const costsForTooltip = [];
                for (const itemId in costDef) {
                    const required = costDef[itemId];
                    const has = InventoryManager.countItemInInventory(gameState.baseInventory, itemId);
                    const itemName = ITEM_DEFINITIONS[itemId] ? ITEM_DEFINITIONS[itemId].name : itemId;
                    costsForTooltip.push(`${itemName}: ${has}/${required}`);
                    if (has < required) canAffordAll = false;
                }
                costStringForTooltip = costsForTooltip.length > 0 ? costsForTooltip.join('; ') : "Бесплатно";
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

            btn.onclick = () => game.build(key);
            btn.disabled = !canAffordAll || atMaxLevel || gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver;
            domElements.buildActions.appendChild(btn);
        }
        if (domElements.buildActions.children.length === 0) {
            domElements.buildActions.innerHTML = '<p><em>Нет доступных построек или определения не загружены.</em></p>';
        }
    },

    renderCraftingRecipes: function() {
        if (!domElements || !domElements.craftingRecipesList || typeof CRAFTING_RECIPES === 'undefined' || typeof InventoryManager === 'undefined') {
            if (domElements && domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p>Ошибка загрузки рецептов.</p>';
            return;
        }
        if (typeof ITEM_DEFINITIONS === 'undefined') {
            console.warn("UIManager.renderCraftingRecipes: ITEM_DEFINITIONS not loaded yet.");
            domElements.craftingRecipesList.innerHTML = '<p>Загрузка определений предметов...</p>';
            return;
        }

        const workshopLevel = gameState.structures.workshop ? gameState.structures.workshop.level : 0;
        if (domElements.workshopLevelDisplay) domElements.workshopLevelDisplay.textContent = workshopLevel;
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
                const has = InventoryManager.countItemInInventory(gameState.baseInventory, ing.itemId);
                const hasEnough = has >= ing.quantity;
                if (!hasEnough) canCraftThis = false;
                const itemName = ITEM_DEFINITIONS[ing.itemId] ? ITEM_DEFINITIONS[ing.itemId].name : ing.itemId;
                ingredientsHTML += `<li class="${hasEnough ? 'has-enough' : 'not-enough'}">${itemName}: ${has}/${ing.quantity}</li>`;
            });
            ingredientsHTML += '</ul>';

            let toolsHTML = '';
            if (recipe.toolsRequired && recipe.toolsRequired.length > 0) {
                toolsHTML = '<strong>Инструменты (в инвентаре игрока):</strong> <span class="recipe-tools">';
                let allToolsPresent = true;
                recipe.toolsRequired.forEach((toolId, index) => {
                    const hasTool = InventoryManager.countItemInInventory(gameState.inventory, toolId) > 0;
                    if (!hasTool) allToolsPresent = false;
                    const toolName = ITEM_DEFINITIONS[toolId] ? ITEM_DEFINITIONS[toolId].name : toolId;
                    toolsHTML += `${toolName} ${hasTool ? '✔' : '✘'}`;
                    if (index < recipe.toolsRequired.length - 1) toolsHTML += ', ';
                });
                if (!allToolsPresent) {
                    canCraftThis = false; // Если хотя бы одного инструмента нет, крафтить нельзя
                    toolsHTML = toolsHTML.replace('<span class="recipe-tools">', '<span class="recipe-tools missing-tool">');
                }
                toolsHTML += '</span>';
            }

            let additionalResultsHTML = '';
            if (recipe.additionalResults && recipe.additionalResults.length > 0) {
                additionalResultsHTML = '<strong>Доп. результат (игроку):</strong> <ul>';
                recipe.additionalResults.forEach(addRes => {
                     const addResName = ITEM_DEFINITIONS[addRes.itemId] ? ITEM_DEFINITIONS[addRes.itemId].name : addRes.itemId;
                     additionalResultsHTML += `<li>${addResName} (x${Array.isArray(addRes.quantity) ? addRes.quantity.join('-') : addRes.quantity})</li>`;
                });
                additionalResultsHTML += '</ul>';
            }

            const resultItemName = ITEM_DEFINITIONS[recipe.resultItemId] ? ITEM_DEFINITIONS[recipe.resultItemId].name : recipe.resultItemId;
            const craftButton = document.createElement('button');
            // Добавляем класс для управления блокировкой из game.js
            craftButton.classList.add('game-action-button');
            craftButton.textContent = 'Создать';
            craftButton.onclick = () => game.craftItem(recipeId);
            craftButton.disabled = !canCraftThis || gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null;


            recipeDiv.innerHTML = `
                <h4>${recipe.name}</h4>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-details">
                    <strong>Результат (игроку):</strong> ${resultItemName} (x${recipe.resultQuantity})<br>
                    <strong>Ингредиенты (со склада):</strong>
                    ${ingredientsHTML}
                    ${toolsHTML ? toolsHTML + '<br>' : ''}
                    ${additionalResultsHTML}
                    ${recipe.workshopLevelRequired > 0 ? `<strong>Требуется Мастерская Ур:</strong> ${recipe.workshopLevelRequired}<br>` : ''}
                </div>
            `;
            recipeDiv.appendChild(craftButton); // Добавляем кнопку
            domElements.craftingRecipesList.appendChild(recipeDiv);
        }

        if (recipesAvailableToDisplay === 0) {
            domElements.craftingRecipesList.innerHTML = '<p><em>Нет доступных рецептов или не выполнены условия. Улучшите Мастерскую или соберите больше ресурсов/инструментов.</em></p>';
        }
    },

    finalizeEventUI: function() {
        if (!domElements) return;
        domElements.eventActions.innerHTML = '';
        domElements.eventTextDisplay.textContent = '';
        domElements.eventActionsContainer.style.display = 'none';

        // Обновляем все затронутые части UI
        this.updateAllUI(); // Этот метод должен обновить все нужные вкладки

        if (typeof game !== 'undefined' && typeof game.saveGame === 'function') {
            game.saveGame();
        }
    },

    updateAllUI: function() {
        this.updateDisplay(); // Обновляет основное состояние, сайдбар, открытую вкладку "Обзор"
        // Обновляем специфичные для вкладок элементы, если они видимы или требуют обновления
        if (document.getElementById('base-tab')?.style.display === 'block') this.updateBuildActions();
        if (document.getElementById('explore-tab')?.style.display === 'block' && typeof LocationManager !== 'undefined') LocationManager.updateExploreTab(); // Обновит и список, и текущую локацию
        if (document.getElementById('craft-tab')?.style.display === 'block') this.renderCraftingRecipes();
        if (document.getElementById('storage-tab')?.style.display === 'block' && typeof InventoryManager !== 'undefined') {
            const storageActiveFilter = domElements.baseInventoryFilters?.querySelector('button.active')?.dataset.filter || 'all';
            InventoryManager.renderBaseInventory(storageActiveFilter);
        }
        // Модальное окно инвентаря игрока обновляется через updatePlayerStatus, если открыто
    }
};
