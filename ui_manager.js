// ui_manager.js

// Предполагается, что gameState, domElements, GameStateGetters, ITEM_DEFINITIONS,
// BASE_STRUCTURE_DEFINITIONS, LOCATION_DEFINITIONS, InventoryManager,
// LocationManager, EventManager, game (для game.build), getStructureUpgradeCost (глобальная функция)
// и NewYearEvent (для сезонного события) доступны.

const UIManager = {
    updateDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined') {
            console.error("UIManager.updateDisplay: Critical objects not defined!");
            return;
        }
        if (domElements.day) domElements.day.textContent = gameState.day;
        if (domElements.survivors) domElements.survivors.textContent = gameState.survivors;
        if (domElements.maxSurvivors) domElements.maxSurvivors.textContent = GameStateGetters.getMaxSurvivors();

        this.updatePlayerStatus();
        this.updateInventoryWeightDisplay();

        if (domElements.totalFoodValue && typeof GameStateGetters !== 'undefined') {
            domElements.totalFoodValue.textContent = GameStateGetters.countBaseFoodItems();
            domElements.totalFoodValue.title = GameStateGetters.getBaseFoodBreakdown(); 
        }
        if (domElements.totalWaterValue && typeof GameStateGetters !== 'undefined') {
            domElements.totalWaterValue.textContent = GameStateGetters.countBaseWaterItems();
            domElements.totalWaterValue.title = GameStateGetters.getBaseWaterBreakdown(); 
        }
        if (domElements.sidebarBaseCapacityUsage && typeof GameStateGetters !== 'undefined') { 
            const usage = GameStateGetters.getBaseInventoryUsage();
            domElements.sidebarBaseCapacityUsage.textContent = `${usage.current}/${usage.max}`;
            domElements.sidebarBaseCapacityUsage.title = `Заполнено слотов: ${usage.percentage.toFixed(0)}%`;
        }
        
        const activeTabLink = domElements.mainNav?.querySelector('.nav-link.active');
        if (activeTabLink) {
            const activeTabName = activeTabLink.dataset.tab;
            this.updateForTab(activeTabName);
        } else {
            const mainTabNavLink = domElements.mainNav?.querySelector('.nav-link[data-tab="main-tab"]');
            this.openTab('main-tab', mainTabNavLink); 
        }
        
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.renderPlayerInventoryIfActive();
        }
    },

    updatePlayerStatus: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined' || !gameState.player) {
             console.warn("UIManager.updatePlayerStatus: Missing critical elements (dom, gameState, getters, or player).");
             return;
        }
        const player = gameState.player;
        const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
        if (domElements.healthBarInner) domElements.healthBarInner.style.width = `${healthPercent}%`;
        if (domElements.healthBarText) domElements.healthBarText.textContent = `${player.health}/${player.maxHealth}`;
        if (domElements.healthBarInner) {
            domElements.healthBarInner.classList.remove('critical', 'low', 'normal');
            if (healthPercent <= 25) domElements.healthBarInner.classList.add('critical');
            else if (healthPercent <= 50) domElements.healthBarInner.classList.add('low');
            else domElements.healthBarInner.classList.add('normal');
        }
        const hungerTh = GameStateGetters.getHungerThresholds();
        let hungerStatusText = "Сыт"; let hungerBarPercent = 100;
        if(domElements.hungerBarInner) domElements.hungerBarInner.classList.remove('critical', 'low', 'normal');
        if (player.hunger <= 0) {
            hungerStatusText = "Смерть"; hungerBarPercent = 0; if(domElements.hungerBarInner) domElements.hungerBarInner.classList.add('critical');
        } else if (player.hunger <= hungerTh.critical) {
            hungerStatusText = "Истощение"; hungerBarPercent = (player.hunger / hungerTh.critical) * 25; if(domElements.hungerBarInner) domElements.hungerBarInner.classList.add('critical');
        } else if (player.hunger <= hungerTh.low) {
            hungerStatusText = "Голод"; hungerBarPercent = 25 + ((player.hunger - hungerTh.critical) / (hungerTh.low - hungerTh.critical)) * 25; if(domElements.hungerBarInner) domElements.hungerBarInner.classList.add('low');
        } else {
            hungerStatusText = "Сыт"; hungerBarPercent = 50 + Math.min(50, ((player.hunger - hungerTh.low) / (player.maxHunger - hungerTh.low)) * 50); if(domElements.hungerBarInner) domElements.hungerBarInner.classList.add('normal');
        }
        if (domElements.hungerBarText) domElements.hungerBarText.textContent = hungerStatusText;
        if (domElements.hungerBarInner) domElements.hungerBarInner.style.width = `${Math.max(0, Math.min(100, hungerBarPercent))}%`;
        const thirstTh = GameStateGetters.getThirstThresholds();
        let thirstStatusText = "Норма"; let thirstBarPercent = 100;
        if(domElements.thirstBarInner) domElements.thirstBarInner.classList.remove('critical', 'low', 'normal');
        if (player.thirst <= 0) {
            thirstStatusText = "Смерть"; thirstBarPercent = 0; if(domElements.thirstBarInner) domElements.thirstBarInner.classList.add('critical');
        } else if (player.thirst <= thirstTh.critical) {
            thirstStatusText = "Сильная жажда"; thirstBarPercent = (player.thirst / thirstTh.critical) * 25; if(domElements.thirstBarInner) domElements.thirstBarInner.classList.add('critical');
        } else if (player.thirst <= thirstTh.low) {
            thirstStatusText = "Жажда"; thirstBarPercent = 25 + ((player.thirst - thirstTh.critical) / (thirstTh.low - thirstTh.critical)) * 25; if(domElements.thirstBarInner) domElements.thirstBarInner.classList.add('low');
        } else {
            thirstStatusText = "Норма"; thirstBarPercent = 50 + Math.min(50, ((player.thirst - thirstTh.low) / (player.maxThirst - thirstTh.low)) * 50); if(domElements.thirstBarInner) domElements.thirstBarInner.classList.add('normal');
        }
        if (domElements.thirstBarText) domElements.thirstBarText.textContent = thirstStatusText;
        if (domElements.thirstBarInner) domElements.thirstBarInner.style.width = `${Math.max(0, Math.min(100, thirstBarPercent))}%`;
        if (domElements.playerCondition) domElements.playerCondition.textContent = player.condition;
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.renderPlayerInventoryIfActive();
        }
    },

    updateInventoryWeightDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || !gameState.player || !domElements.inventoryWeight || !domElements.inventoryMaxWeight) return;
        domElements.inventoryWeight.textContent = gameState.player.carryWeight.toFixed(1);
        domElements.inventoryMaxWeight.textContent = gameState.player.maxCarryWeight;
    },

    updateOverviewTabStats: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined' || !gameState.player) return;
        if(domElements.overviewHealth) domElements.overviewHealth.textContent = `${gameState.player.health}/${gameState.player.maxHealth}`;
        const hungerTh = GameStateGetters.getHungerThresholds();
        if(domElements.overviewHunger) {
            if (gameState.player.hunger <= 0) domElements.overviewHunger.textContent = "Смертельный голод";
            else if (gameState.player.hunger <= hungerTh.critical) domElements.overviewHunger.textContent = "Истощение";
            else if (gameState.player.hunger <= hungerTh.low) domElements.overviewHunger.textContent = "Голод";
            else domElements.overviewHunger.textContent = "Сыт";
        }
        const thirstTh = GameStateGetters.getThirstThresholds();
        if(domElements.overviewThirst) {
            if (gameState.player.thirst <= 0) domElements.overviewThirst.textContent = "Смертельная жажда";
            else if (gameState.player.thirst <= thirstTh.critical) domElements.overviewThirst.textContent = "Сильная жажда";
            else if (gameState.player.thirst <= thirstTh.low) domElements.overviewThirst.textContent = "Жажда";
            else domElements.overviewThirst.textContent = "Норма";
        }
        if(domElements.overviewCondition) domElements.overviewCondition.textContent = gameState.player.condition;
        if(domElements.overviewDay) domElements.overviewDay.textContent = gameState.day;
        if(domElements.overviewSurvivors) domElements.overviewSurvivors.textContent = `${gameState.survivors}/${GameStateGetters.getMaxSurvivors()}`;
        if(domElements.overviewBaseFood && typeof GameStateGetters !== 'undefined') {
            domElements.overviewBaseFood.textContent = GameStateGetters.countBaseFoodItems();
            domElements.overviewBaseFood.title = GameStateGetters.getBaseFoodBreakdown(); 
        }
        if(domElements.overviewBaseWater && typeof GameStateGetters !== 'undefined') {
            domElements.overviewBaseWater.textContent = GameStateGetters.countBaseWaterItems();
            domElements.overviewBaseWater.title = GameStateGetters.getBaseWaterBreakdown(); 
        }
        if(domElements.overviewBaseCapacityUsage && typeof GameStateGetters !== 'undefined') { 
            const usage = GameStateGetters.getBaseInventoryUsage();
            domElements.overviewBaseCapacityUsage.textContent = `${usage.current}/${usage.max}`;
            domElements.overviewBaseCapacityUsage.title = `Заполнено слотов: ${usage.percentage.toFixed(0)}%`;
        }
        this.renderBaseStructuresOverview(); 
    },

    openTab: function(tabName, clickedLinkElement) {
        if (!domElements || !domElements.mainNav || !domElements.tabContentArea) {
             console.error("UIManager.openTab: Critical DOM elements (mainNav or tabContentArea) not found.");
             return;
        }
        domElements.tabContentArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = "none");
        domElements.mainNav.querySelectorAll('.nav-link').forEach(tl => tl.classList.remove("active"));
        const tabElement = document.getElementById(tabName);
        if (tabElement) {
            tabElement.style.display = "block";
        } else {
            console.error("Tab not found: " + tabName + ". Opening main-tab by default.");
            const mainTabEl = document.getElementById('main-tab');
            if(mainTabEl) mainTabEl.style.display = "block";
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
        // Скрываем обычный контейнер событий, если активна не вкладка "Разведка"
        if (tabName !== 'explore-tab' && domElements.eventActionsContainer) {
            domElements.eventActionsContainer.style.display = 'none';
        }
        // Скрываем модальное окно сезонного события при переключении вкладок, если оно не должно быть поверх всего
        // this.closeSeasonalEventModal(); // Раскомментировать, если нужно принудительно закрывать

        if (tabName === 'main-tab') {
            this.updateOverviewTabStats();
        } else if (tabName === 'base-tab') {
            this.updateBuildActions();
        } else if (tabName === 'explore-tab') {
            if (typeof LocationManager !== 'undefined') LocationManager.updateExploreTab();
            // Отображение обычных событий на вкладке "Разведка"
            if (domElements.eventActionsContainer && domElements.eventTextDisplay && domElements.eventActions) {
                if (gameState.currentEvent && typeof EventManager !== 'undefined' && !gameState.seasonalEvents?.newYear?.isActive) { // Показываем, только если не активно сезонное
                    domElements.eventTextDisplay.textContent = gameState.currentEvent.text;
                    domElements.eventActionsContainer.style.display = 'block';
                    EventManager.displayEventChoices();
                } else if (gameState.locationEvent && typeof EventManager !== 'undefined' && !gameState.seasonalEvents?.newYear?.isActive) {
                    domElements.eventTextDisplay.textContent = gameState.locationEvent.text;
                    domElements.eventActionsContainer.style.display = 'block';
                    EventManager.displayLocationEventChoices();
                } else if (!gameState.seasonalEvents?.newYear?.isActive) { // Скрываем, только если не активно сезонное
                    domElements.eventActionsContainer.style.display = 'none';
                    if (domElements.eventTextDisplay) domElements.eventTextDisplay.textContent = '';
                    if (domElements.eventActions) domElements.eventActions.innerHTML = '';
                }
            }
        } else if (tabName === 'storage-tab' && typeof InventoryManager !== 'undefined') {
            InventoryManager.filterBaseInventory('all'); 
            if (domElements.storageTabBaseCapacityUsage && typeof GameStateGetters !== 'undefined') { 
                const usage = GameStateGetters.getBaseInventoryUsage();
                domElements.storageTabBaseCapacityUsage.textContent = `${usage.current}/${usage.max}`;
                domElements.storageTabBaseCapacityUsage.title = `Заполнено слотов: ${usage.percentage.toFixed(0)}%`;
            }
        } else if (tabName === 'craft-tab') {
            this.renderCraftingRecipes();
        } else if (tabName === 'cheats-tab') {
            // No specific update
        }
    },

    toggleSidebar: function() {
        if (!domElements || !domElements.sidebar) return;
        domElements.sidebar.classList.toggle('open');
    },

    applyLogVisibility: function() {
        if (!domElements || !domElements.logMessages || !domElements.toggleLogButton) return;
        if (gameState.logVisible) {
            domElements.logMessages.classList.remove('hidden');
            domElements.toggleLogButton.textContent = '-';
        } else {
            domElements.logMessages.classList.add('hidden');
            domElements.toggleLogButton.textContent = '+';
        }
    },

    updateExploreTabDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof LOCATION_DEFINITIONS === 'undefined' ||
            !domElements.currentLocationNameDisplay || !domElements.currentLocationDescriptionDisplay ||
            !domElements.scoutCurrentLocationButton || !domElements.discoverNewLocationButton) {
            console.warn("UIManager.updateExploreTabDisplay: Missing critical DOM elements for explore tab.");
            return;
        }
        const currentLocationId = gameState.currentLocationId;
        const currentLocationDef = LOCATION_DEFINITIONS[currentLocationId];
        const currentLocationState = gameState.discoveredLocations[currentLocationId];

        if (currentLocationDef && currentLocationState) {
            domElements.currentLocationNameDisplay.textContent = currentLocationDef.name;
            domElements.currentLocationDescriptionDisplay.textContent = `${currentLocationDef.description || ""} (Попыток обыска: ${currentLocationState.searchAttemptsLeft === undefined ? 'N/A' : currentLocationState.searchAttemptsLeft})`;
            
            let scoutButtonHTML = `Обыскать`; 
            const scoutTime = currentLocationDef.scoutTime || 1;
            if (scoutTime > 0) {
                scoutButtonHTML += ` <span class="action-time-indicator">⏱️${scoutTime}д.</span>`;
            }
            
            const canSearch = (currentLocationState.searchAttemptsLeft || 0) > 0;
            const scoutDisabled = !canSearch || gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null || game.isPassingDay || gameState.seasonalEvents?.newYear?.isActive;
            domElements.scoutCurrentLocationButton.disabled = scoutDisabled;
            domElements.scoutCurrentLocationButton.innerHTML = canSearch ? scoutButtonHTML : "Локация обыскана";
            domElements.scoutCurrentLocationButton.classList.toggle('action-available', canSearch && !scoutDisabled);

        } else {
            domElements.currentLocationNameDisplay.textContent = "Неизвестно";
            domElements.currentLocationDescriptionDisplay.textContent = "Ошибка: текущая локация не найдена.";
            domElements.scoutCurrentLocationButton.disabled = true;
            domElements.scoutCurrentLocationButton.innerHTML = "Обыскать"; 
            domElements.scoutCurrentLocationButton.classList.remove('action-available');
        }
        
        const discoverTime = 1; 
        const discoverDisabled = gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null || game.isPassingDay || gameState.seasonalEvents?.newYear?.isActive;
        domElements.discoverNewLocationButton.disabled = discoverDisabled;
        domElements.discoverNewLocationButton.innerHTML = `Разведать новые территории <span class="action-time-indicator">⏱️${discoverTime}д.</span>`;
        domElements.discoverNewLocationButton.classList.toggle('action-available', !discoverDisabled);
    },

    renderDiscoveredLocations: function() {
        if (!domElements || !domElements.discoveredLocationsList || typeof gameState === 'undefined' || typeof LOCATION_DEFINITIONS === 'undefined') return;
        domElements.discoveredLocationsList.innerHTML = '';
        let hasDiscoveredOtherThanBase = false;
        for (const locId in gameState.discoveredLocations) {
            if( !gameState.discoveredLocations.hasOwnProperty(locId) ) continue;
            if (gameState.discoveredLocations[locId].discovered) {
                const locDef = LOCATION_DEFINITIONS[locId];
                if (!locDef) { console.warn(`UIManager.rDL: Def for ${locId} not found.`); continue; }
                if (locId !== "base_surroundings") hasDiscoveredOtherThanBase = true;
                const entryDiv = document.createElement('div');
                entryDiv.className = 'location-entry';
                if (locId === gameState.currentLocationId) entryDiv.classList.add('active-location');
                entryDiv.onclick = () => (typeof LocationManager !== 'undefined' ? LocationManager.setCurrentLocation(locId) : console.error("LM not defined"));
                let dangerText = "Низкая", dangerClass = "low";
                if (locDef.dangerLevel === 2) { dangerText = "Средняя"; dangerClass = "medium"; }
                else if (locDef.dangerLevel === 3) { dangerText = "Высокая"; dangerClass = "high"; }
                else if (locDef.dangerLevel >= 4) { dangerText = "Очень высокая"; dangerClass = "very-high"; }
                entryDiv.innerHTML = `<h4>${locDef.name}</h4><p>Тип: ${locDef.type || "Н/Д"}, Опасность: <span class="location-danger ${dangerClass}">${dangerText}</span></p>`;
                domElements.discoveredLocationsList.appendChild(entryDiv);
            }
        }
        if (!hasDiscoveredOtherThanBase && Object.keys(gameState.discoveredLocations).filter(id => gameState.discoveredLocations[id].discovered && id !== "base_surroundings").length === 0) {
            domElements.discoveredLocationsList.innerHTML = '<p><em>Используйте "Разведать новые территории", чтобы найти новые места.</em></p>';
        }
    },

    showLocationInfoModal: function(locationId) {
        if (!domElements.locationInfoModal || typeof LOCATION_DEFINITIONS === 'undefined' || !LOCATION_DEFINITIONS[locationId] ||
            !domElements.locationInfoName || !domElements.locationInfoDescription ||
            !domElements.locationInfoPreviewLoot || !domElements.locationInfoDanger ||
            !domElements.locationInfoTravelButton) {
            console.error("Cannot show location info modal: DOM elements or location definition missing.");
            if (typeof LocationManager !== 'undefined') LocationManager.moveToLocation(locationId);
            return;
        }
        const locDef = LOCATION_DEFINITIONS[locationId];
        domElements.locationInfoName.textContent = locDef.name;
        domElements.locationInfoDescription.textContent = locDef.description || "Описание отсутствует.";
        domElements.locationInfoPreviewLoot.innerHTML = '';
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
        const travelDisabled = gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver || game.isPassingDay || gameState.seasonalEvents?.newYear?.isActive;
        domElements.locationInfoTravelButton.disabled = travelDisabled;
        domElements.locationInfoTravelButton.classList.toggle('action-available', !travelDisabled);

        domElements.locationInfoModal.style.display = 'block';
    },

    closeLocationInfoModal: function() {
        if (domElements.locationInfoModal) {
            domElements.locationInfoModal.style.display = 'none';
        }
    },
    
    renderBaseStructuresOverview: function() {
        if (!domElements.baseStructuresOverviewList || typeof gameState === 'undefined' || typeof BASE_STRUCTURE_DEFINITIONS === 'undefined' || typeof InventoryManager === 'undefined' || typeof ITEM_DEFINITIONS === 'undefined' || typeof getStructureUpgradeCost !== 'function') {
            if (domElements.baseStructuresOverviewList) domElements.baseStructuresOverviewList.innerHTML = '<p><em>Ошибка загрузки информации о строениях. Проверьте консоль.</em></p>';
            return;
        }
        domElements.baseStructuresOverviewList.innerHTML = '';
        let hasStructures = false;

        for (const key in BASE_STRUCTURE_DEFINITIONS) { 
            if (!BASE_STRUCTURE_DEFINITIONS.hasOwnProperty(key)) continue;

            const structureDef = BASE_STRUCTURE_DEFINITIONS[key];
            const currentStructureState = gameState.structures[key] || { level: structureDef.initialLevel || 0 };
             if (!gameState.structures[key]) gameState.structures[key] = currentStructureState; 

            hasStructures = true;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'structure-overview-item';

            let effectText = "Эффект отсутствует или не описан.";
            if (currentStructureState.level > 0 && typeof structureDef.effect === 'function') {
                try {
                    const currentEffect = structureDef.effect(currentStructureState.level);
                    effectText = Object.entries(currentEffect)
                                   .map(([effKey, effValue]) => `${effKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${effValue}`)
                                   .join(', ') || "Нет активных эффектов на этом уровне.";
                } catch (e) { console.error(`Error getting effect for ${key} at level ${currentStructureState.level}:`, e); }
            } else if (currentStructureState.level === 0 && (structureDef.initialLevel === undefined || structureDef.initialLevel === 0)) {
                 effectText = "Не построено";
            } else if (structureDef.effectDescription) { 
                effectText = structureDef.effectDescription.replace("{level}", currentStructureState.level);
            }

            let upgradeCostHTML = `<p class="max-level">Достигнут максимальный уровень.</p>`;
            if (currentStructureState.level < structureDef.maxLevel) {
                const costDef = getStructureUpgradeCost(key, currentStructureState.level);
                if (costDef && Object.keys(costDef).length > 0) {
                    upgradeCostHTML = '<strong>Стоимость улучшения:</strong><ul>';
                    let canAffordAllForThis = true;
                    for (const itemId in costDef) {
                        const required = costDef[itemId];
                        const has = InventoryManager.countItemInInventory(gameState.baseInventory, itemId);
                        const itemName = ITEM_DEFINITIONS[itemId] ? ITEM_DEFINITIONS[itemId].name : itemId;
                        const hasEnoughClass = has >= required ? 'has-enough' : 'not-enough';
                        upgradeCostHTML += `<li class="${hasEnoughClass}">${itemName}: ${has}/${required}</li>`;
                        if (has < required) canAffordAllForThis = false;
                    }
                    upgradeCostHTML += '</ul>';
                    if (!canAffordAllForThis) upgradeCostHTML += '<p style="font-size:0.8em; color: #aa7777;">(Недостаточно ресурсов на складе для след. уровня)</p>';
                } else {
                    upgradeCostHTML = '<p><strong>Стоимость улучшения:</strong> Бесплатно или не определена.</p>';
                }
            }

            itemDiv.innerHTML = `
                <h4>${structureDef.name} [Ур. ${currentStructureState.level}]</h4>
                <p>${structureDef.description}</p>
                <p class="current-effect"><strong>Текущий эффект:</strong> ${effectText}</p>
                <div class="upgrade-cost">${upgradeCostHTML}</div>
            `;
            domElements.baseStructuresOverviewList.appendChild(itemDiv);
        }

        if (!hasStructures && domElements.baseStructuresOverviewList) {
            domElements.baseStructuresOverviewList.innerHTML = '<p><em>Определения построек не загружены или их нет.</em></p>';
        }
    },

    updateBuildActions: function() {
        if (!domElements.buildActions || typeof gameState === 'undefined' || typeof BASE_STRUCTURE_DEFINITIONS === 'undefined' || typeof InventoryManager === 'undefined' || typeof ITEM_DEFINITIONS === 'undefined' || typeof getStructureUpgradeCost !== 'function') {
            if (domElements.buildActions) domElements.buildActions.innerHTML = '<p><em>Загрузка данных...</em></p>';
            return;
        }
        domElements.buildActions.innerHTML = '';
        let structuresAvailableForBuild = false;
        for (const key in BASE_STRUCTURE_DEFINITIONS) { 
            if (!BASE_STRUCTURE_DEFINITIONS.hasOwnProperty(key)) continue;

            const definition = BASE_STRUCTURE_DEFINITIONS[key];
            if (!gameState.structures[key]) {
                gameState.structures[key] = { level: definition.initialLevel || 0 };
            }
            const currentStructureState = gameState.structures[key];
            structuresAvailableForBuild = true;

            const btn = document.createElement('button');
            btn.classList.add('tooltip-host', 'game-action-button');
            let costStringForTooltip = "";
            let canAffordAll = true;
            let atMaxLevel = currentStructureState.level >= definition.maxLevel;
            
            let buttonHTML = `${definition.name} [${currentStructureState.level}]`; 

            if (!atMaxLevel) {
                const costDef = getStructureUpgradeCost(key, currentStructureState.level);
                const costsForTooltip = [];
                for (const itemId in costDef) {
                    const required = costDef[itemId];
                    const has = InventoryManager.countItemInInventory(gameState.baseInventory, itemId);
                    costsForTooltip.push(`${ITEM_DEFINITIONS[itemId]? ITEM_DEFINITIONS[itemId].name : itemId}: ${has}/${required}`);
                    if (has < required) canAffordAll = false;
                }
                costStringForTooltip = costsForTooltip.length > 0 ? costsForTooltip.join('; ') : "Бесплатно";
            } else {
                costStringForTooltip = "Достигнут максимальный уровень.";
            }
            
            btn.innerHTML = buttonHTML;
            const tooltipSpan = document.createElement('span');
            tooltipSpan.classList.add('tooltip-text');
            tooltipSpan.innerHTML = `${definition.description}<br>${atMaxLevel ? costStringForTooltip : `Стоимость улучшения: ${costStringForTooltip}`}`;
            btn.appendChild(tooltipSpan);
            
            btn.onclick = () => game.build(key);
            const isActionAvailable = canAffordAll && !atMaxLevel && !gameState.currentEvent && !gameState.locationEvent && !gameState.gameOver && !game.isPassingDay && !gameState.seasonalEvents?.newYear?.isActive;
            btn.disabled = !isActionAvailable;
            btn.classList.toggle('action-available', isActionAvailable);
            
            domElements.buildActions.appendChild(btn);
        }

        if (domElements.passDayAtBaseButton) { 
            const passDayDisabled = gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver || game.isPassingDay || gameState.seasonalEvents?.newYear?.isActive;
            domElements.passDayAtBaseButton.disabled = passDayDisabled;
            domElements.passDayAtBaseButton.classList.toggle('action-available', !passDayDisabled);
        }

        if (!structuresAvailableForBuild && domElements.buildActions) {
            domElements.buildActions.innerHTML = '<p><em>Нет доступных для строительства объектов или определения не загружены.</em></p>';
        }
    },

    renderCraftingRecipes: function() {
        if (!domElements.craftingRecipesList || typeof gameState === 'undefined' || typeof CRAFTING_RECIPES === 'undefined' || typeof InventoryManager === 'undefined' || typeof ITEM_DEFINITIONS === 'undefined') {
             if (domElements && domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p>Ошибка загрузки рецептов.</p>'; return;
        }
        const workshopLevel = gameState.structures.workshop ? gameState.structures.workshop.level : 0;
        if (domElements.workshopLevelDisplay) domElements.workshopLevelDisplay.textContent = workshopLevel;
        domElements.craftingRecipesList.innerHTML = ''; let recipesAvailableToDisplay = 0;
        for (const recipeId in CRAFTING_RECIPES) {
            if (!CRAFTING_RECIPES.hasOwnProperty(recipeId)) continue;
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
            
            let buttonHTML = `Создать`; 
            const craftButton = document.createElement('button');
            craftButton.classList.add('game-action-button'); 
            craftButton.innerHTML = buttonHTML; 
            craftButton.onclick = () => game.craftItem(recipeId);
            const isActionAvailable = canCraftThis && !gameState.gameOver && !gameState.currentEvent && !gameState.locationEvent && !game.isPassingDay && !gameState.seasonalEvents?.newYear?.isActive;
            craftButton.disabled = !isActionAvailable;
            craftButton.classList.toggle('action-available', isActionAvailable);

            recipeDiv.innerHTML = `<h4>${recipe.name}</h4><p class="recipe-description">${recipe.description}</p><div class="recipe-details"><strong>Результат (игроку):</strong> ${ITEM_DEFINITIONS[recipe.resultItemId]?ITEM_DEFINITIONS[recipe.resultItemId].name:recipe.resultItemId} (x${recipe.resultQuantity})<br><strong>Ингредиенты (со склада):</strong> ${ingredientsHTML}${toolsHTML ? toolsHTML + '<br>' : ''}${additionalResultsHTML}${recipe.workshopLevelRequired > 0 ? `<strong>Требуется Мастерская Ур:</strong> ${recipe.workshopLevelRequired}<br>` : ''}</div>`;
            recipeDiv.appendChild(craftButton);
            domElements.craftingRecipesList.appendChild(recipeDiv);
        }
        if (recipesAvailableToDisplay === 0 && domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p><em>Нет доступных рецептов или не выполнены условия. Улучшите Мастерскую или соберите больше ресурсов/инструментов.</em></p>';
    },

    finalizeEventUI: function() { // Для обычных событий
        if (!domElements || !domElements.eventActionsContainer || !domElements.eventTextDisplay || !domElements.eventActions) return;
        domElements.eventActions.innerHTML = '';
        domElements.eventTextDisplay.textContent = '';
        domElements.eventActionsContainer.style.display = 'none';
        // Кнопки действий на вкладках (разведка, база и т.д.) должны разблокироваться через updateAllUI -> updateForTab -> ...
        this.updateAllUI(); 
        if (typeof game !== 'undefined' && typeof game.saveGame === 'function') {
            game.saveGame();
        }
    },

    // --- Новые функции для сезонного события ---
    showSeasonalEventModal: function() {
        if (domElements.seasonalEventModal) {
            // Блокируем основной интерфейс игры (делаем его полупрозрачным и некликабельным)
            if (domElements.gameWrapper) domElements.gameWrapper.classList.add('blurred-background');
            domElements.seasonalEventModal.style.display = 'block';
        } else {
            console.error("Seasonal event modal DOM element not found!");
        }
    },

    closeSeasonalEventModal: function() {
        if (domElements.seasonalEventModal) {
            domElements.seasonalEventModal.style.display = 'none';
            if (domElements.gameWrapper) domElements.gameWrapper.classList.remove('blurred-background');
        }
    },

    renderSeasonalEventStage: function() {
        if (!domElements.seasonalEventModal || !domElements.seasonalEventText || !domElements.seasonalEventChoices ||
            typeof NewYearEvent === 'undefined' || !gameState.seasonalEvents?.newYear?.isActive) {
            this.closeSeasonalEventModal(); // Если что-то не так, просто закрываем
            return;
        }

        const stageData = NewYearEvent.getCurrentStageData();
        if (!stageData) {
            console.error("Could not get current seasonal event stage data.");
            NewYearEvent.endEvent(false); // Завершаем событие, если нет данных об этапе
            return;
        }

        domElements.seasonalEventText.innerHTML = typeof stageData.text === 'function' ? stageData.text() : stageData.text;
        domElements.seasonalEventChoices.innerHTML = ''; // Очищаем старые выборы

        stageData.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.innerHTML = typeof choice.text === 'function' ? choice.text() : choice.text; // Текст кнопки может быть функцией

            let choiceIsAvailable = true;
            if (typeof choice.condition === 'function') {
                try {
                    choiceIsAvailable = choice.condition();
                } catch (e) {
                    console.error(`Error in seasonal event choice condition for stage ${gameState.seasonalEvents.newYear.currentStage}, choice "${choice.text}":`, e);
                    choiceIsAvailable = false;
                }
            }
            btn.disabled = !choiceIsAvailable;
            btn.classList.toggle('action-available', choiceIsAvailable); // Можно использовать тот же класс

            btn.onclick = () => NewYearEvent.processChoice(index);
            domElements.seasonalEventChoices.appendChild(btn);
        });
    },
    // --- Конец новых функций для сезонного события ---

    updateAllUI: function() { // Основной метод обновления всего UI
        this.updateDisplay(); // Обновляет все основные элементы и активную вкладку
    }
};
