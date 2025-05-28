// ui_manager.js

// Предполагается, что gameState, domElements, GameStateGetters, ITEM_DEFINITIONS,
// BASE_STRUCTURE_DEFINITIONS, LOCATION_DEFINITIONS, InventoryManager,
// LocationManager, EventManager и game доступны глобально.

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

        this.updatePlayerStatus();
        this.updateInventoryWeightDisplay();

        domElements.totalFoodValue.textContent = GameStateGetters.countBaseFoodItems();
        domElements.totalWaterValue.textContent = GameStateGetters.countBaseWaterItems();

        // Обновление содержимого активных вкладок
        const activeTabLink = domElements.mainNav.querySelector('.nav-link.active');
        if (activeTabLink) {
            const activeTabName = activeTabLink.dataset.tab;
            this.updateForTab(activeTabName); // Обновляем текущую активную вкладку
        } else { // Если нет активной, по умолчанию главная
             this.updateForTab('main-tab');
        }
        
        // Если инвентари открыты, их рендеринг вызывается через InventoryManager
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.renderPlayerInventoryIfActive();
            // InventoryManager.renderBaseInventoryIfActive(); // Обновляется при открытии вкладки 'storage-tab'
        }
    },

    updatePlayerStatus: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined') return;
        const player = gameState.player;

        // Здоровье
        const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
        domElements.healthBarInner.style.width = `${healthPercent}%`;
        domElements.healthBarText.textContent = `${player.health}/${player.maxHealth}`;
        domElements.healthBarInner.classList.remove('critical', 'low', 'normal');
        if (healthPercent <= 25) domElements.healthBarInner.classList.add('critical');
        else if (healthPercent <= 50) domElements.healthBarInner.classList.add('low');
        else domElements.healthBarInner.classList.add('normal');

        // Сытость
        const hungerTh = GameStateGetters.getHungerThresholds();
        let hungerStatusText = "Сыт";
        let hungerBarPercent = 100;
        domElements.hungerBarInner.classList.remove('critical', 'low', 'normal');
        if (player.hunger <= 0) {
            hungerStatusText = "Смерть"; hungerBarPercent = 0; domElements.hungerBarInner.classList.add('critical');
        } else if (player.hunger <= hungerTh.critical) {
            hungerStatusText = "Истощение"; hungerBarPercent = (player.hunger / hungerTh.critical) * 25; domElements.hungerBarInner.classList.add('critical');
        } else if (player.hunger <= hungerTh.low) {
            hungerStatusText = "Голод"; hungerBarPercent = 25 + ((player.hunger - hungerTh.critical) / (hungerTh.low - hungerTh.critical)) * 25; domElements.hungerBarInner.classList.add('low');
        } else {
            hungerStatusText = "Сыт"; hungerBarPercent = 50 + Math.min(50, ((player.hunger - hungerTh.low) / (player.maxHunger - hungerTh.low)) * 50); domElements.hungerBarInner.classList.add('normal');
        }
        domElements.hungerBarText.textContent = hungerStatusText;
        domElements.hungerBarInner.style.width = `${Math.max(0, Math.min(100, hungerBarPercent))}%`;

        // Жажда
        const thirstTh = GameStateGetters.getThirstThresholds();
        let thirstStatusText = "Норма";
        let thirstBarPercent = 100;
        domElements.thirstBarInner.classList.remove('critical', 'low', 'normal');
        if (player.thirst <= 0) {
            thirstStatusText = "Смерть"; thirstBarPercent = 0; domElements.thirstBarInner.classList.add('critical');
        } else if (player.thirst <= thirstTh.critical) {
            thirstStatusText = "Сильная жажда"; thirstBarPercent = (player.thirst / thirstTh.critical) * 25; domElements.thirstBarInner.classList.add('critical');
        } else if (player.thirst <= thirstTh.low) {
            thirstStatusText = "Жажда"; thirstBarPercent = 25 + ((player.thirst - thirstTh.critical) / (thirstTh.low - thirstTh.critical)) * 25; domElements.thirstBarInner.classList.add('low');
        } else {
            thirstStatusText = "Норма"; thirstBarPercent = 50 + Math.min(50, ((player.thirst - thirstTh.low) / (player.maxThirst - thirstTh.low)) * 50); domElements.thirstBarInner.classList.add('normal');
        }
        domElements.thirstBarText.textContent = thirstStatusText;
        domElements.thirstBarInner.style.width = `${Math.max(0, Math.min(100, thirstBarPercent))}%`;

        domElements.playerCondition.textContent = gameState.player.condition;
        
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.renderPlayerInventoryIfActive();
        }
    },

    updateInventoryWeightDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || !gameState.player) return;
        domElements.inventoryWeight.textContent = gameState.player.carryWeight.toFixed(1);
        domElements.inventoryMaxWeight.textContent = gameState.player.maxCarryWeight;
    },

    updateOverviewTabStats: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined' || !gameState.player) return;
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

    openTab: function(tabName, clickedLinkElement) {
        if (!domElements || !domElements.mainNav) return;
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
            this.updateForTab('main-tab');
            return;
        }

        if (clickedLinkElement) {
            clickedLinkElement.classList.add("active");
        } else {
            const linkToActivate = domElements.mainNav.querySelector(`.nav-link[data-tab="${tabName}"]`);
            if (linkToActivate) linkToActivate.classList.add('active');
        }
        this.updateForTab(tabName);
    },

    updateForTab: function(tabName) {
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
            } else {
                if (domElements.eventTextDisplay) domElements.eventTextDisplay.textContent = '';
                if (domElements.eventActionsContainer) domElements.eventActionsContainer.style.display = 'none';
            }
        } else if (tabName === 'base-tab') {
            this.updateBuildActions();
        } else if (tabName === 'explore-tab' && typeof LocationManager !== 'undefined') {
            LocationManager.updateExploreTab(); // LocationManager сам обновляет свою вкладку
        } else if (tabName === 'storage-tab' && typeof InventoryManager !== 'undefined') {
            InventoryManager.filterBaseInventory('all');
        } else if (tabName === 'craft-tab') {
            this.renderCraftingRecipes();
        }
    },

    toggleSidebar: function() {
        if (!domElements || !domElements.sidebar) return;
        domElements.sidebar.classList.toggle('open');
    },

    applyLogVisibility: function() {
        if (!domElements || !domElements.logMessages) return;
        if (gameState.logVisible) {
            domElements.logMessages.classList.remove('hidden');
            if (domElements.toggleLogButton) domElements.toggleLogButton.textContent = '-';
        } else {
            domElements.logMessages.classList.add('hidden');
            if (domElements.toggleLogButton) domElements.toggleLogButton.textContent = '+';
        }
    },

    // Этот метод обновляет DOM-элементы текущей локации, вызывается из LocationManager.updateExploreTab
    updateExploreTabDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof LOCATION_DEFINITIONS === 'undefined') return;
        const currentLocationId = gameState.currentLocationId;
        const currentLocationDef = LOCATION_DEFINITIONS[currentLocationId];
        const currentLocationState = gameState.discoveredLocations[currentLocationId];

        if (domElements.currentLocationNameDisplay && domElements.currentLocationDescriptionDisplay && domElements.currentLocationTimeDisplay && domElements.scoutCurrentLocationButton) {
            if (currentLocationDef && currentLocationState) {
                domElements.currentLocationNameDisplay.textContent = currentLocationDef.name;
                domElements.currentLocationDescriptionDisplay.textContent = `${currentLocationDef.description || ""} (Попыток обыска: ${currentLocationState.searchAttemptsLeft || 0})`;
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
        }
        if (domElements.discoverNewLocationButton) {
            domElements.discoverNewLocationButton.disabled = gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null;
        }
    },

    // Этот метод обновляет список известных локаций, вызывается из LocationManager.updateExploreTab
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
                // Теперь LocationManager.setCurrentLocation решает, показать модалку или переместить
                entryDiv.onclick = () => (typeof LocationManager !== 'undefined' ? LocationManager.setCurrentLocation(locId) : console.error("LocationManager not defined"));

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

    showLocationInfoModal: function(locationId) {
        if (!domElements.locationInfoModal || !LOCATION_DEFINITIONS || !LOCATION_DEFINITIONS[locationId]) {
            console.error("Cannot show location info modal: elements or location definition missing.");
            // Если модалки нет, или нет определения, просто перемещаем игрока
            if (typeof LocationManager !== 'undefined') LocationManager.moveToLocation(locationId);
            return;
        }
        const locDef = LOCATION_DEFINITIONS[locationId];

        domElements.locationInfoName.textContent = locDef.name;
        domElements.locationInfoDescription.textContent = locDef.description || "Описание отсутствует.";
        
        // Отображение "Что можно найти" (предполагаем поле previewLootText в locDef)
        domElements.locationInfoPreviewLoot.innerHTML = ''; // Очищаем предыдущее содержимое
        const previewTitle = document.createElement('strong');
        previewTitle.textContent = 'Возможная добыча: ';
        domElements.locationInfoPreviewLoot.appendChild(previewTitle);
        domElements.locationInfoPreviewLoot.append(document.createTextNode(locDef.previewLootText || "Информация о добыче скрыта..."));


        let dangerText = "Низкая";
        if (locDef.dangerLevel === 2) dangerText = "Средняя";
        else if (locDef.dangerLevel === 3) dangerText = "Высокая";
        else if (locDef.dangerLevel >= 4) dangerText = "Очень высокая";
        domElements.locationInfoDanger.textContent = dangerText;

        domElements.locationInfoTravelButton.onclick = () => {
            if (typeof LocationManager !== 'undefined') LocationManager.moveToLocation(locationId);
        };
        // Блокируем кнопку перехода, если есть активные события
        domElements.locationInfoTravelButton.disabled = gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver;


        domElements.locationInfoModal.style.display = 'block';
    },

    closeLocationInfoModal: function() {
        if (domElements.locationInfoModal) {
            domElements.locationInfoModal.style.display = 'none';
        }
    },

    updateBuildActions: function() {
        if (!domElements || !domElements.buildActions || typeof gameState === 'undefined' || typeof BASE_STRUCTURE_DEFINITIONS === 'undefined' || typeof InventoryManager === 'undefined') return;
        if (typeof ITEM_DEFINITIONS === 'undefined') {
            console.warn("UIManager.updateBuildActions: ITEM_DEFINITIONS not loaded yet.");
            if (domElements.buildActions) domElements.buildActions.innerHTML = '<p>Загрузка определений предметов...</p>';
            return;
        }
        domElements.buildActions.innerHTML = '';
        let structuresAvailable = false;
        for (const key in gameState.structures) {
            const definition = BASE_STRUCTURE_DEFINITIONS[key];
            const currentStructureState = gameState.structures[key];
            if (!definition) continue;
            structuresAvailable = true;
            const btn = document.createElement('button');
            btn.classList.add('tooltip-host', 'game-action-button');
            let costStringForTooltip = "", canAffordAll = true, atMaxLevel = currentStructureState.level >= definition.maxLevel;
            if (!atMaxLevel) {
                const costDef = (typeof getStructureUpgradeCost === 'function') ? getStructureUpgradeCost(key, currentStructureState.level) : {};
                const costsForTooltip = [];
                for (const itemId in costDef) {
                    const required = costDef[itemId], has = InventoryManager.countItemInInventory(gameState.baseInventory, itemId);
                    costsForTooltip.push(`${ITEM_DEFINITIONS[itemId] ? ITEM_DEFINITIONS[itemId].name : itemId}: ${has}/${required}`);
                    if (has < required) canAffordAll = false;
                }
                costStringForTooltip = costsForTooltip.length > 0 ? costsForTooltip.join('; ') : "Бесплатно";
            } else costStringForTooltip = "Достигнут максимальный уровень.";
            btn.innerHTML = `${definition.name} [${currentStructureState.level}]`;
            const tooltipSpan = document.createElement('span');
            tooltipSpan.classList.add('tooltip-text');
            tooltipSpan.innerHTML = `${definition.description}<br>${atMaxLevel ? costStringForTooltip : `Стоимость (со склада): ${costStringForTooltip}`}`;
            btn.appendChild(tooltipSpan);
            btn.onclick = () => game.build(key);
            btn.disabled = !canAffordAll || atMaxLevel || gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver;
            domElements.buildActions.appendChild(btn);
        }
        if (!structuresAvailable && domElements.buildActions) domElements.buildActions.innerHTML = '<p><em>Нет доступных построек или определения не загружены.</em></p>';
    },

    renderCraftingRecipes: function() {
        if (!domElements || !domElements.craftingRecipesList || typeof CRAFTING_RECIPES === 'undefined' || typeof InventoryManager === 'undefined') {
            if (domElements && domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p>Ошибка загрузки рецептов.</p>';
            return;
        }
        if (typeof ITEM_DEFINITIONS === 'undefined') {
            console.warn("UIManager.renderCraftingRecipes: ITEM_DEFINITIONS not loaded yet.");
            if (domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p>Загрузка определений предметов...</p>';
            return;
        }
        const workshopLevel = gameState.structures.workshop ? gameState.structures.workshop.level : 0;
        if (domElements.workshopLevelDisplay) domElements.workshopLevelDisplay.textContent = workshopLevel;
        domElements.craftingRecipesList.innerHTML = '';
        let recipesAvailableToDisplay = 0;
        for (const recipeId in CRAFTING_RECIPES) {
            const recipe = CRAFTING_RECIPES[recipeId];
            if (workshopLevel < (recipe.workshopLevelRequired || 0)) continue;
            recipesAvailableToDisplay++;
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'crafting-recipe';
            let ingredientsHTML = '<ul>', canCraftThis = true;
            recipe.ingredients.forEach(ing => {
                const has = InventoryManager.countItemInInventory(gameState.baseInventory, ing.itemId);
                if (has < ing.quantity) canCraftThis = false;
                ingredientsHTML += `<li class="${has >= ing.quantity ? 'has-enough' : 'not-enough'}">${ITEM_DEFINITIONS[ing.itemId]?ITEM_DEFINITIONS[ing.itemId].name:ing.itemId}: ${has}/${ing.quantity}</li>`;
            });
            ingredientsHTML += '</ul>';
            let toolsHTML = '';
            if (recipe.toolsRequired && recipe.toolsRequired.length > 0) {
                toolsHTML = '<strong>Инструменты (в инвентаре игрока):</strong> <span class="recipe-tools">';
                let allToolsPresent = true;
                recipe.toolsRequired.forEach((toolId, index) => {
                    const hasTool = InventoryManager.countItemInInventory(gameState.inventory, toolId) > 0;
                    if (!hasTool) allToolsPresent = false;
                    toolsHTML += `${ITEM_DEFINITIONS[toolId]?ITEM_DEFINITIONS[toolId].name:toolId} ${hasTool ? '✔' : '✘'}${index < recipe.toolsRequired.length - 1 ? ', ' : ''}`;
                });
                if(!allToolsPresent) canCraftThis = false;
                toolsHTML = toolsHTML.replace('<span class="recipe-tools">', `<span class="recipe-tools ${allToolsPresent ? '' : 'missing-tool'}">`);
                toolsHTML += '</span>';
            }
            let additionalResultsHTML = '';
            if (recipe.additionalResults && recipe.additionalResults.length > 0) {
                additionalResultsHTML = '<strong>Доп. результат (игроку):</strong> <ul>';
                recipe.additionalResults.forEach(addRes => additionalResultsHTML += `<li>${ITEM_DEFINITIONS[addRes.itemId]?ITEM_DEFINITIONS[addRes.itemId].name:addRes.itemId} (x${Array.isArray(addRes.quantity) ? addRes.quantity.join('-') : addRes.quantity})</li>`);
                additionalResultsHTML += '</ul>';
            }
            const craftButton = document.createElement('button');
            craftButton.classList.add('game-action-button'); craftButton.textContent = 'Создать';
            craftButton.onclick = () => game.craftItem(recipeId);
            craftButton.disabled = !canCraftThis || gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null;
            recipeDiv.innerHTML = `<h4>${recipe.name}</h4><p class="recipe-description">${recipe.description}</p><div class="recipe-details"><strong>Результат (игроку):</strong> ${ITEM_DEFINITIONS[recipe.resultItemId]?ITEM_DEFINITIONS[recipe.resultItemId].name:recipe.resultItemId} (x${recipe.resultQuantity})<br><strong>Ингредиенты (со склада):</strong> ${ingredientsHTML}${toolsHTML ? toolsHTML + '<br>' : ''}${additionalResultsHTML}${recipe.workshopLevelRequired > 0 ? `<strong>Требуется Мастерская Ур:</strong> ${recipe.workshopLevelRequired}<br>` : ''}</div>`;
            recipeDiv.appendChild(craftButton);
            domElements.craftingRecipesList.appendChild(recipeDiv);
        }
        if (recipesAvailableToDisplay === 0 && domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p><em>Нет доступных рецептов или не выполнены условия. Улучшите Мастерскую или соберите больше ресурсов/инструментов.</em></p>';
    },

    finalizeEventUI: function() {
        if (!domElements || !domElements.eventActionsContainer) return;
        domElements.eventActions.innerHTML = '';
        domElements.eventTextDisplay.textContent = '';
        domElements.eventActionsContainer.style.display = 'none';
        this.updateAllUI(); // Обновляем весь UI, так как событие могло повлиять на многое
        if (typeof game !== 'undefined' && typeof game.saveGame === 'function') {
            game.saveGame();
        }
    },

    updateAllUI: function() { // Этот метод должен быть точкой входа для общего обновления UI
        this.updateDisplay();
        // Другие специфичные обновления можно вызывать здесь или в updateDisplay, если они всегда нужны
        // Например, this.updateBuildActions() вызывается из updateForTab, когда активна 'base-tab'
    }
};
