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

        const activeTabLink = domElements.mainNav.querySelector('.nav-link.active');
        if (activeTabLink) {
            const activeTabName = activeTabLink.dataset.tab;
            this.updateForTab(activeTabName);
        } else {
             this.updateForTab('main-tab'); // По умолчанию, если вдруг нет активной
        }
        
        if (typeof InventoryManager !== 'undefined') {
            InventoryManager.renderPlayerInventoryIfActive();
        }
    },

    updatePlayerStatus: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof GameStateGetters === 'undefined' || !gameState.player) return;
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
        let hungerStatusText = "Сыт"; let hungerBarPercent = 100;
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
        let thirstStatusText = "Норма"; let thirstBarPercent = 100;
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

    updateOverviewTabStats: function() { // Эта функция теперь только для вкладки Обзор
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
        // Сначала скроем контейнер событий, если он не на вкладке "Разведка"
        if (tabName !== 'explore-tab' && domElements.eventActionsContainer) {
            domElements.eventActionsContainer.style.display = 'none';
        }

        if (tabName === 'main-tab') {
            this.updateOverviewTabStats();
        } else if (tabName === 'base-tab') {
            this.updateBuildActions();
        } else if (tabName === 'explore-tab') {
            if (typeof LocationManager !== 'undefined') {
                LocationManager.updateExploreTab(); // LocationManager обновляет свою вкладку
            }
            // Отображение событий теперь здесь
            if (domElements.eventActionsContainer && domElements.eventTextDisplay && domElements.eventActions) {
                if (gameState.currentEvent && typeof EventManager !== 'undefined') {
                    domElements.eventTextDisplay.textContent = gameState.currentEvent.text;
                    domElements.eventActionsContainer.style.display = 'block';
                    EventManager.displayEventChoices();
                } else if (gameState.locationEvent && typeof EventManager !== 'undefined') {
                    domElements.eventTextDisplay.textContent = gameState.locationEvent.text;
                    domElements.eventActionsContainer.style.display = 'block';
                    EventManager.displayLocationEventChoices();
                } else {
                    domElements.eventActionsContainer.style.display = 'none';
                    domElements.eventTextDisplay.textContent = '';
                    domElements.eventActions.innerHTML = '';
                }
            }
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

    updateExploreTabDisplay: function() {
        if (!domElements || typeof gameState === 'undefined' || typeof LOCATION_DEFINITIONS === 'undefined') return;
        const currentLocationId = gameState.currentLocationId;
        const currentLocationDef = LOCATION_DEFINITIONS[currentLocationId];
        const currentLocationState = gameState.discoveredLocations[currentLocationId];

        if (domElements.currentLocationNameDisplay && domElements.currentLocationDescriptionDisplay && domElements.currentLocationTimeDisplay && domElements.scoutCurrentLocationButton) {
            if (currentLocationDef && currentLocationState) {
                domElements.currentLocationNameDisplay.textContent = currentLocationDef.name;
                domElements.currentLocationDescriptionDisplay.textContent = `${currentLocationDef.description || ""} (Попыток обыска: ${currentLocationState.searchAttemptsLeft === undefined ? 'N/A' : currentLocationState.searchAttemptsLeft})`;
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

    renderDiscoveredLocations: function() {
        if (!domElements || !domElements.discoveredLocationsList || typeof gameState === 'undefined' || typeof LOCATION_DEFINITIONS === 'undefined') return;
        domElements.discoveredLocationsList.innerHTML = '';
        let hasDiscoveredOtherThanBase = false;
        for (const locId in gameState.discoveredLocations) {
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
        if (!domElements.locationInfoModal || !LOCATION_DEFINITIONS || !LOCATION_DEFINITIONS[locationId] ||
            !domElements.locationInfoName || !domElements.locationInfoDescription ||
            !domElements.locationInfoPreviewLoot || !domElements.locationInfoDanger ||
            !domElements.locationInfoTravelButton) {
            console.error("Cannot show location info modal: DOM elements or location definition missing.");
            if (typeof LocationManager !== 'undefined') LocationManager.moveToLocation(locationId); // Fallback
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
            if (domElements.buildActions) domElements.buildActions.innerHTML = '<p>Загрузка...</p>'; return;
        }
        domElements.buildActions.innerHTML = ''; let structuresAvailable = false;
        for (const key in gameState.structures) {
            const definition = BASE_STRUCTURE_DEFINITIONS[key]; const currentStructureState = gameState.structures[key];
            if (!definition) continue; structuresAvailable = true; const btn = document.createElement('button');
            btn.classList.add('tooltip-host', 'game-action-button');
            let costString = "", canAfford = true, atMax = currentStructureState.level >= definition.maxLevel;
            if (!atMax) {
                const costDef = (typeof getStructureUpgradeCost === 'function') ? getStructureUpgradeCost(key, currentStructureState.level) : {};
                const costsTooltip = [];
                for (const itemId in costDef) {
                    const req = costDef[itemId], has = InventoryManager.countItemInInventory(gameState.baseInventory, itemId);
                    costsTooltip.push(`${ITEM_DEFINITIONS[itemId]?ITEM_DEFINITIONS[itemId].name:itemId}: ${has}/${req}`);
                    if (has < req) canAfford = false;
                }
                costString = costsTooltip.length > 0 ? costsTooltip.join('; ') : "Бесплатно";
            } else costString = "Макс. уровень.";
            btn.innerHTML = `${definition.name} [${currentStructureState.level}]`;
            const tip = document.createElement('span'); tip.classList.add('tooltip-text');
            tip.innerHTML = `${definition.description}<br>${atMax ? costString : `Стоимость: ${costString}`}`;
            btn.appendChild(tip); btn.onclick = () => game.build(key);
            btn.disabled = !canAfford || atMax || gameState.currentEvent !== null || gameState.locationEvent !== null || gameState.gameOver;
            domElements.buildActions.appendChild(btn);
        }
        if (!structuresAvailable && domElements.buildActions) domElements.buildActions.innerHTML = '<p><em>Нет построек.</em></p>';
    },

    renderCraftingRecipes: function() {
        if (!domElements || !domElements.craftingRecipesList || typeof CRAFTING_RECIPES === 'undefined' || typeof InventoryManager === 'undefined') {
             if (domElements && domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p>Ошибка.</p>'; return;
        }
        if (typeof ITEM_DEFINITIONS === 'undefined') {
             if (domElements.craftingRecipesList) domElements.craftingRecipesList.innerHTML = '<p>Загрузка...</p>'; return;
        }
        const wsLvl = gameState.structures.workshop ? gameState.structures.workshop.level : 0;
        if (domElements.workshopLevelDisplay) domElements.workshopLevelDisplay.textContent = wsLvl;
        domElements.craftingRecipesList.innerHTML = ''; let recipesDisp = 0;
        for (const rId in CRAFTING_RECIPES) {
            const r = CRAFTING_RECIPES[rId]; if (wsLvl < (r.workshopLevelRequired || 0)) continue; recipesDisp++;
            const div = document.createElement('div'); div.className = 'crafting-recipe'; let ingHTML = '<ul>', canCraft = true;
            r.ingredients.forEach(ing => {
                const has = InventoryManager.countItemInInventory(gameState.baseInventory, ing.itemId);
                if (has < ing.quantity) canCraft = false;
                ingHTML += `<li class="${has>=ing.quantity?'has-enough':'not-enough'}">${ITEM_DEFINITIONS[ing.itemId]?ITEM_DEFINITIONS[ing.itemId].name:ing.itemId}: ${has}/${ing.quantity}</li>`;
            });
            ingHTML+='</ul>'; let toolsHTML='';
            if(r.toolsRequired&&r.toolsRequired.length>0){toolsHTML='<strong>Инструменты:</strong> <span class="recipe-tools">';let allTools=true;
            r.toolsRequired.forEach((tId,idx)=>{const hasT=InventoryManager.countItemInInventory(gameState.inventory,tId)>0;if(!hasT)allTools=false;
            toolsHTML+=`${ITEM_DEFINITIONS[tId]?ITEM_DEFINITIONS[tId].name:tId} ${hasT?'✔':'✘'}${idx<r.toolsRequired.length-1?', ':''}`;});
            if(!allTools)canCraft=false;toolsHTML=toolsHTML.replace('recipe-tools',`recipe-tools ${allTools?'':'missing-tool'}`);toolsHTML+='</span>';}
            let addResHTML='';if(r.additionalResults&&r.additionalResults.length>0){addResHTML='<strong>Доп. результат:</strong> <ul>';
            r.additionalResults.forEach(addR=>addResHTML+=`<li>${ITEM_DEFINITIONS[addR.itemId]?ITEM_DEFINITIONS[addR.itemId].name:addR.itemId} (x${Array.isArray(addR.quantity)?addR.quantity.join('-'):addR.quantity})</li>`);addResHTML+='</ul>';}
            const btn=document.createElement('button');btn.classList.add('game-action-button');btn.textContent='Создать';btn.onclick=()=>game.craftItem(rId);
            btn.disabled=!canCraft||gameState.gameOver||gameState.currentEvent!==null||gameState.locationEvent!==null;
            div.innerHTML=`<h4>${r.name}</h4><p class="r-desc">${r.description}</p><div class="r-details"><strong>Результат:</strong> ${ITEM_DEFINITIONS[r.resultItemId]?ITEM_DEFINITIONS[r.resultItemId].name:r.resultItemId} (x${r.resultQuantity})<br><strong>Ингредиенты:</strong> ${ingHTML}${toolsHTML?toolsHTML+'<br>':''}${addResHTML}${r.workshopLevelRequired>0?`<strong>Мастерская Ур:</strong> ${r.workshopLevelRequired}<br>`:''}</div>`;
            div.appendChild(btn);domElements.craftingRecipesList.appendChild(div);
        }
        if(recipesDisp===0 && domElements.craftingRecipesList)domElements.craftingRecipesList.innerHTML='<p><em>Нет рецептов.</em></p>';
    },

    finalizeEventUI: function() {
        if (!domElements || !domElements.eventActionsContainer) return;
        domElements.eventActions.innerHTML = '';
        if (domElements.eventTextDisplay) domElements.eventTextDisplay.textContent = '';
        domElements.eventActionsContainer.style.display = 'none';
        
        // Важно: убедиться, что кнопки действий снова активны, если событие завершилось
        // UIManager.updateDisplay() должен это косвенно обработать через обновление активной вкладки.
        this.updateAllUI();
        if (typeof game !== 'undefined' && typeof game.saveGame === 'function') {
            game.saveGame();
        }
    },

    updateAllUI: function() {
        this.updateDisplay();
    }
};
