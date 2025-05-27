// location_manager.js

// Предполагается, что gameState, domElements, ITEM_DEFINITIONS, LOCATION_DEFINITIONS, 
// UIManager, InventoryManager, EventManager (для вызова displayLocationEventChoices) 
// и game (для game.log, game.nextDayForLocationAction) доступны глобально.

const LocationManager = {
    updateExploreTab: function() { 
        UIManager.updateExploreTabDisplay(); // UI обновление остается в UIManager
        UIManager.renderDiscoveredLocations(); // UI обновление остается в UIManager
    },

    setCurrentLocation: function(locationId) {
        if ((typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS[locationId]) && gameState.discoveredLocations[locationId]?.discovered) {
            if (gameState.locationEvent || gameState.currentEvent) { 
                game.log("Сначала завершите текущее событие.", "event-warning");
                return;
            }
            gameState.currentLocationId = locationId;
            game.log(`Вы переместились в локацию: ${LOCATION_DEFINITIONS[locationId].name}.`, "event-neutral");
            
            const locDef = LOCATION_DEFINITIONS[locationId];
            if (locDef.entryLoot && locDef.entryLoot.length > 0) {
                let entryLootGained = false;
                locDef.entryLoot.forEach(loot => {
                    if (Math.random() < loot.chance) {
                        const quantity = Array.isArray(loot.quantity) ? 
                                         Math.floor(Math.random() * (loot.quantity[1] - loot.quantity[0] + 1)) + loot.quantity[0] :
                                         loot.quantity;
                        if (InventoryManager.addItemToInventory(gameState.inventory, loot.itemId, quantity)) {
                            game.log(`Прибыв в ${locDef.name}, вы нашли: ${ITEM_DEFINITIONS[loot.itemId].name} (x${quantity}).`, "event-discovery");
                            entryLootGained = true;
                        }
                    }
                });
                if (entryLootGained) UIManager.updateDisplay(); // Обновляем UI, если что-то получено
            }
            this.updateExploreTab(); // Обновляем информацию о локации на вкладке
        } else {
            game.log("Невозможно переместиться в эту локацию.", "event-negative");
        }
    },

    discoverNewLocationAction: function() { 
        if (gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null) return;
        game.log("Вы отправляетесь на разведку неизведанных территорий...", "event-neutral");

        const currentLocationDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[gameState.currentLocationId] : null;
        let newLocationFound = false;

        if (currentLocationDef && currentLocationDef.discoverableLocations) {
            for (const discoverable of currentLocationDef.discoverableLocations) {
                if (!gameState.discoveredLocations[discoverable.locationId]?.discovered && 
                    Math.random() < discoverable.chance &&
                    (typeof discoverable.condition === 'function' ? discoverable.condition() : true)) {
                    
                    const newLocDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[discoverable.locationId] : null;
                    if (newLocDef) {
                        gameState.discoveredLocations[discoverable.locationId] = { 
                            discovered: true, 
                            name: newLocDef.name,
                            searchAttemptsLeft: newLocDef.initialSearchAttempts, 
                            foundSpecialItems: {} 
                        };
                        game.log(`ОБНАРУЖЕНО! Новая локация: ${newLocDef.name}.`, "event-discovery");
                        newLocationFound = true;
                        UIManager.renderDiscoveredLocations(); // Обновить список сразу через UIManager
                        break; 
                    }
                }
            }
        }

        if (!newLocationFound) {
            game.log("Разведка не принесла новых открытий на этот раз.", "event-neutral");
        }
        this.nextDayForLocationAction(1); 
    },

    exploreCurrentLocationAction: function(actionType) { 
        if (gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null) return;

        const locId = gameState.currentLocationId;
        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
        const locState = gameState.discoveredLocations[locId];

        if (!locDef || !locState) {
            game.log("Ошибка: текущая локация не определена.", "event-negative");
            return;
        }

        if (actionType === 'search') {
            if (locState.searchAttemptsLeft <= 0) {
                game.log(`Локация ${locDef.name} уже полностью обыскана.`, "event-neutral");
                UIManager.updateExploreTabDisplay(); 
                return;
            }

            game.log(`Вы начинаете обыскивать локацию: ${locDef.name}...`, "event-neutral");
            let itemsFoundCount = 0;
            let specialItemFoundThisTurn = false;

            if (locDef.specialFinds && locDef.specialFinds.length > 0) {
                for (const special of locDef.specialFinds) {
                    const flagId = special.oneTimeFlag || `${locId}_${special.itemId}_found`; 
                    if (!gameState.flags[flagId] && (!locState.foundSpecialItems || !locState.foundSpecialItems[special.itemId])) { 
                        if (Math.random() < (special.findChance || 0.1)) { 
                            if (InventoryManager.addItemToInventory(gameState.inventory, special.itemId, special.quantity || 1)) { 
                                game.log(special.descriptionLog || `ОСОБАЯ НАХОДКА: ${ITEM_DEFINITIONS[special.itemId].name}!`, "event-discovery");
                                itemsFoundCount++;
                                specialItemFoundThisTurn = true;
                                gameState.flags[flagId] = true; 
                                if (!locState.foundSpecialItems) locState.foundSpecialItems = {};
                                locState.foundSpecialItems[special.itemId] = true; 
                                break; 
                            } else {
                                game.log(`Нашли ${ITEM_DEFINITIONS[special.itemId].name}, но не смогли унести!`, "event-warning");
                            }
                        }
                    }
                }
            }

            if (!specialItemFoundThisTurn || (locDef.specialFindsContinueSearch)) { 
                if (locDef.lootTable) {
                    locDef.lootTable.forEach(lootEntry => {
                        if (Math.random() < lootEntry.chance) {
                            const quantity = Math.floor(Math.random() * (lootEntry.quantity[1] - lootEntry.quantity[0] + 1)) + lootEntry.quantity[0];
                            if (InventoryManager.addItemToInventory(gameState.inventory, lootEntry.itemId, quantity)) { 
                                game.log(`Найдено: ${ITEM_DEFINITIONS[lootEntry.itemId].name} (x${quantity})`, "event-positive");
                                itemsFoundCount++;
                            } else {
                                game.log(`Нашли ${ITEM_DEFINITIONS[lootEntry.itemId].name} (x${quantity}), но не смогли унести (перевес!).`, "event-warning");
                            }
                        }
                    });
                }
            }
            
            locState.searchAttemptsLeft = Math.max(0, locState.searchAttemptsLeft - 1);
            UIManager.updateExploreTabDisplay(); 

            if (locDef.specialEvents && locDef.specialEvents.length > 0 && !gameState.locationEvent) { 
                for (const eventDef of locDef.specialEvents) {
                    const flagId = eventDef.id + "_" + locId; 
                    if (Math.random() < eventDef.chance &&
                        (typeof eventDef.condition === 'function' ? eventDef.condition() : true) &&
                        (!gameState.flags[flagId] || eventDef.repeatable) 
                       ) {
                        gameState.locationEvent = { ...eventDef, flagId: flagId }; 
                        game.log(`СОБЫТИЕ НА ЛОКАЦИИ: ${eventDef.text}`, "event-discovery");
                        EventManager.displayLocationEventChoices(); // Вызываем через EventManager
                        return; 
                    }
                }
            }
            
            if (itemsFoundCount === 0 && !gameState.locationEvent && !specialItemFoundThisTurn) {
                game.log("Ничего ценного не найдено в этот раз.", "event-neutral");
            }
            if (!gameState.locationEvent) { 
                 this.nextDayForLocationAction(locDef.scoutTime || 1);
            }
        }
    },
    
    nextDayForLocationAction: function(daysSpent = 1) {
        game.log(`Исследование локации заняло ${daysSpent} дн.`, "event-neutral");
        for (let i = 0; i < daysSpent; i++) {
            if (gameState.gameOver) break;
            gameState.day++; 
            game.log(`--- Наступил День ${gameState.day} (после вылазки) ---`, "event-neutral");
            
            const foodNeed = gameState.survivors * 10;
            const waterNeed = gameState.survivors * 15;
            let foodConsumed = InventoryManager.consumeResourceFromBase('food', foodNeed);
            let waterConsumed = InventoryManager.consumeResourceFromBase('water', waterNeed);

            if (foodConsumed < foodNeed && !gameState.gameOver) { 
                game.log("Выжившие голодают после вылазки!", "event-negative");
                 if (Math.random() < 0.2 * gameState.survivors) { 
                    if (gameState.survivors > 0) {
                        gameState.survivors--;
                        game.log("Один из выживших умер от голода!", "event-negative");
                        if (gameState.survivors <= 0 && !gameState.gameOver) { game.gameOver("Все выжившие погибли от голода."); break; }
                    }
                }
            }
            if (waterConsumed < waterNeed && !gameState.gameOver) { 
                game.log("Выжившие страдают от жажды после вылазки!", "event-negative");
                 if (Math.random() < 0.25 * gameState.survivors) { 
                    if (gameState.survivors > 0) {
                        gameState.survivors--;
                        game.log("Один из выживших умер от обезвоживания!", "event-negative");
                        if (gameState.survivors <= 0 && !gameState.gameOver) { game.gameOver("Все выжившие погибли от жажды."); break; }
                    }
                }
            }

            UIManager.updateDisplay(); 
            EventManager.triggerRandomEvent(); 
            if(gameState.gameOver) break; 
        }
        UIManager.updateBuildActions(); 
        game.saveGame(); // game.saveGame останется в основном файле
    }
};
