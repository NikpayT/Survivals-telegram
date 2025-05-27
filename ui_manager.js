// ui_manager.js

// Предполагается, что gameState, domElements, GameStateGetters, ITEM_DEFINITIONS, 
// BASE_STRUCTURE_DEFINITIONS, LOCATION_DEFINITIONS, CRAFTING_RECIPES 
// и game (для вызова game.build, game.craftItem и т.д. из кнопок, сгенерированных здесь) доступны глобально.
// Также InventoryManager, LocationManager, EventManager должны быть доступны.

const UIManager = {
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
        } else if (tabName === 'explore-tab' && typeof LocationManager !== 'undefined') {
            LocationManager.updateExploreTab(); 
        } else if (tabName === 'storage-tab' && typeof InventoryManager !== 'undefined') {
            InventoryManager.filterBaseInventory('all'); 
        } else if (tabName === 'craft-tab') {
            this.renderCraftingRecipes();
        }
    },

    toggleSidebar: function() {
        domElements.sidebar.classList.toggle('open');
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

    updateInventoryWeightDisplay: function() {
        domElements.inventoryWeight.textContent = gameState.player.carryWeight.toFixed(1);
        domElements.inventoryMaxWeight.textContent = gameState.player.maxCarryWeight;
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

    applyLogVisibility: function() {
        if (gameState.logVisible) {
            domElements.logMessages.classList.remove('hidden');
            domElements.toggleLogButton.textContent = '-';
        } else {
            domElements.logMessages.classList.add('hidden');
            domElements.toggleLogButton.textContent = '+';
        }
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
                // Вызываем InventoryManager.consumeItem, предполагая, что game объект доступен InventoryManager
                itemActionsHTML += `<button onclick="InventoryManager.consumeItem('${itemSlot.itemId}', ${index}, gameState.inventory)">Использовать</button>`;
            }
            itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, gameState.inventory, gameState.baseInventory, 1)">На склад (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, gameState.inventory, gameState.baseInventory, ${itemSlot.quantity})">На склад (Все)</button>`;
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
            itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, gameState.baseInventory, gameState.inventory, 1)">Взять (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, gameState.baseInventory, gameState.inventory, ${itemSlot.quantity})">Взять (Все)</button>`;
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
                // ВАЖНО: Вызов должен быть game.LocationManager.setCurrentLocation, но LocationManager еще не полностью интегрирован в game
                // Пока оставляем вызов через глобальный LocationManager, если он существует, или game, если он там определен.
                entryDiv.onclick = () => (typeof LocationManager !== 'undefined' ? LocationManager.setCurrentLocation(locId) : game.setCurrentLocation(locId)); 

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
                const costDef = getStructureUpgradeCost(key, currentStructureState.level); // Глобальная функция
                const costsForTooltip = [];
                for (const itemId in costDef) {
                    const required = costDef[itemId];
                    const has = InventoryManager.countItemInInventory(gameState.baseInventory, itemId); 
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
            
            btn.onclick = () => game.build(key); 
            btn.disabled = !canAffordAll || atMaxLevel || gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver;
            domElements.buildActions.appendChild(btn);
        }
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
                const has = InventoryManager.countItemInInventory(gameState.baseInventory, ing.itemId); 
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
                    const hasTool = InventoryManager.countItemInInventory(gameState.inventory, toolId) > 0; 
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

    finalizeEventUI: function() { 
        domElements.eventActions.innerHTML = ''; 
        domElements.eventTextDisplay.textContent = '';
        domElements.eventActionsContainer.style.display = 'none'; 
        
        this.updateDisplay(); // Было UIManager.updateDisplay()
        this.updateBuildActions(); // Было UIManager.updateBuildActions()
        if (typeof LocationManager !== 'undefined') { // Проверка перед вызовом
             LocationManager.updateExploreTab(); // Обновляем, чтобы кнопки разблокировались
        } else {
            this.updateExploreTabDisplay(); // Альтернатива, если LocationManager еще не готов
            this.renderDiscoveredLocations();
        }
        game.saveGame(); // game.saveGame останется в основном файле
    },

    updateAllUI: function() { // Эту функцию можно будет вызывать из game объекта
        this.updateDisplay(); 
        this.updateBuildActions();
        if (typeof LocationManager !== 'undefined') LocationManager.updateExploreTab();
        if (document.getElementById('craft-tab')?.style.display === 'block') this.renderCraftingRecipes();
        if (document.getElementById('storage-tab')?.style.display === 'block') this.renderBaseInventory();
    }
};
