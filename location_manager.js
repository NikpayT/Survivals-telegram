// location_manager.js

// Предполагается, что gameState, domElements, ITEM_DEFINITIONS, LOCATION_DEFINITIONS,
// UIManager, InventoryManager, EventManager
// и game (для game.log, game.nextDayForLocationAction) доступны глобально.

const LocationManager = {
    // Этот метод должен быть основным для обновления всей вкладки "Разведка"
    updateExploreTab: function() {
        if (typeof UIManager !== 'undefined') {
            // UIManager отвечает за рендеринг DOM-элементов вкладки
            UIManager.updateExploreTabDisplay(); // Обновляет детали текущей локации (имя, описание, кнопки)
            UIManager.renderDiscoveredLocations(); // Обновляет список известных локаций
        } else {
            console.error("LocationManager.updateExploreTab: UIManager is not defined!");
        }
    },

    setCurrentLocation: function(locationId) {
        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locationId] : null;

        if (locDef && gameState.discoveredLocations[locationId]?.discovered) {
            if (gameState.locationEvent || gameState.currentEvent) {
                if (typeof game !== 'undefined' && game.log) game.log("Сначала завершите текущее событие.", "event-warning");
                return;
            }

            // Если кликнули не по текущей локации, показываем информационное окно
            if (gameState.currentLocationId !== locationId) {
                if (typeof UIManager !== 'undefined') {
                    UIManager.showLocationInfoModal(locationId); // Новый метод в UIManager
                } else {
                    console.error("LocationManager.setCurrentLocation: UIManager not defined to show location info modal.");
                    // Как fallback, просто перемещаем, если UIManager недоступен
                    this.moveToLocation(locationId);
                }
            } else {
                // Если кликнули по уже текущей локации, просто обновляем вкладку (на всякий случай)
                this.updateExploreTab();
            }
        } else {
            if (typeof game !== 'undefined' && game.log) game.log("Невозможно получить информацию об этой локации или она не открыта.", "event-negative");
        }
    },

    // Новая функция для фактического перемещения, вызывается из модального окна или напрямую
    moveToLocation: function(locationId) {
        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locationId] : null;
        if (!locDef || !gameState.discoveredLocations[locationId]?.discovered) {
            if (typeof game !== 'undefined' && game.log) game.log("Ошибка перемещения: локация не найдена или не открыта.", "event-negative");
            return;
        }
        if (gameState.locationEvent || gameState.currentEvent) {
            if (typeof game !== 'undefined' && game.log) game.log("Сначала завершите текущее событие, чтобы переместиться.", "event-warning");
            return;
        }

        gameState.currentLocationId = locationId;
        if (typeof game !== 'undefined' && game.log) game.log(`Вы переместились в локацию: ${locDef.name}.`, "event-neutral");

        if (locDef.entryLoot && locDef.entryLoot.length > 0 && typeof InventoryManager !== 'undefined' && typeof ITEM_DEFINITIONS !== 'undefined') {
            let entryLootGained = false;
            locDef.entryLoot.forEach(loot => {
                if (Math.random() < loot.chance) {
                    const quantity = Array.isArray(loot.quantity) ?
                                     Math.floor(Math.random() * (loot.quantity[1] - loot.quantity[0] + 1)) + loot.quantity[0] :
                                     loot.quantity;
                    if (InventoryManager.addItemToInventory(gameState.inventory, loot.itemId, quantity)) {
                        if (typeof game !== 'undefined' && game.log) game.log(`Прибыв в ${locDef.name}, вы нашли: ${ITEM_DEFINITIONS[loot.itemId].name} (x${quantity}).`, "event-discovery");
                        entryLootGained = true;
                    }
                }
            });
            // addItemToInventory в InventoryManager теперь сам вызывает UIManager.updateDisplay()
        }
        this.updateExploreTab(); // Обновляем информацию о локации на вкладке
        if (typeof UIManager !== 'undefined') UIManager.closeLocationInfoModal(); // Закрываем модалку, если она была открыта
    },

    discoverNewLocationAction: function() {
        if (gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null) return;
        if (typeof game !== 'undefined' && game.log) game.log("Вы отправляетесь на разведку неизведанных территорий...", "event-neutral");

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
                        if (typeof game !== 'undefined' && game.log) game.log(`ОБНАРУЖЕНО! Новая локация: ${newLocDef.name}.`, "event-discovery");
                        newLocationFound = true;
                        if (typeof UIManager !== 'undefined') UIManager.renderDiscoveredLocations(); // Обновить список сразу
                        break;
                    }
                }
            }
        }

        if (!newLocationFound && typeof game !== 'undefined' && game.log) {
            game.log("Разведка не принесла новых открытий на этот раз.", "event-neutral");
        }
        // nextDayForLocationAction вызывается здесь, т.к. это действие занимает день
        this.nextDayForLocationAction(1, "Разведка новых территорий");
    },

    exploreCurrentLocationAction: function(actionType) {
        if (gameState.gameOver || gameState.currentEvent !== null || gameState.locationEvent !== null) return;

        const locId = gameState.currentLocationId;
        const locDef = (typeof LOCATION_DEFINITIONS !== 'undefined') ? LOCATION_DEFINITIONS[locId] : null;
        const locState = gameState.discoveredLocations[locId];

        if (!locDef || !locState) {
            if (typeof game !== 'undefined' && game.log) game.log("Ошибка: текущая локация не определена.", "event-negative");
            return;
        }

        if (actionType === 'search') {
            if (locState.searchAttemptsLeft <= 0) {
                if (typeof game !== 'undefined' && game.log) game.log(`Локация ${locDef.name} уже полностью обыскана.`, "event-neutral");
                this.updateExploreTab(); // Просто обновить UI, чтобы кнопка была правильно задизейблена
                return;
            }

            if (typeof game !== 'undefined' && game.log) game.log(`Вы начинаете обыскивать локацию: ${locDef.name}...`, "event-neutral");
            let itemsFoundCount = 0;
            let specialItemFoundThisTurn = false;

            if (typeof InventoryManager !== 'undefined' && typeof ITEM_DEFINITIONS !== 'undefined') {
                if (locDef.specialFinds && locDef.specialFinds.length > 0) {
                    for (const special of locDef.specialFinds) {
                        const flagId = special.oneTimeFlag || `${locId}_${special.itemId}_found`;
                        if (!gameState.flags[flagId] && (!locState.foundSpecialItems || !locState.foundSpecialItems[special.itemId])) {
                            if (Math.random() < (special.findChance || 0.1)) {
                                if (InventoryManager.addItemToInventory(gameState.inventory, special.itemId, special.quantity || 1)) {
                                    if (typeof game !== 'undefined' && game.log) game.log(special.descriptionLog || `ОСОБАЯ НАХОДКА: ${ITEM_DEFINITIONS[special.itemId].name}!`, "event-discovery");
                                    itemsFoundCount++;
                                    specialItemFoundThisTurn = true;
                                    gameState.flags[flagId] = true;
                                    if (!locState.foundSpecialItems) locState.foundSpecialItems = {};
                                    locState.foundSpecialItems[special.itemId] = true;
                                    break; // Нашли особый предмет, заканчиваем этот поиск (или можно убрать break)
                                } else {
                                     if (typeof game !== 'undefined' && game.log) game.log(`Нашли ${ITEM_DEFINITIONS[special.itemId].name}, но не смогли унести!`, "event-warning");
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
                                    if (typeof game !== 'undefined' && game.log) game.log(`Найдено: ${ITEM_DEFINITIONS[lootEntry.itemId].name} (x${quantity})`, "event-positive");
                                    itemsFoundCount++;
                                } else {
                                     if (typeof game !== 'undefined' && game.log) game.log(`Нашли ${ITEM_DEFINITIONS[lootEntry.itemId].name} (x${quantity}), но не смогли унести (перевес!).`, "event-warning");
                                }
                            }
                        });
                    }
                }
            } // Конец блока if InventoryManager

            locState.searchAttemptsLeft = Math.max(0, locState.searchAttemptsLeft - 1);
            // this.updateExploreTab() будет вызван после nextDayForLocationAction или обработки события

            let eventTriggered = false;
            if (locDef.specialEvents && locDef.specialEvents.length > 0 && !gameState.locationEvent && typeof EventManager !== 'undefined') {
                for (const eventDef of locDef.specialEvents) {
                    const flagId = eventDef.id + "_" + locId;
                    if (Math.random() < eventDef.chance &&
                        (typeof eventDef.condition === 'function' ? eventDef.condition() : true) &&
                        (!gameState.flags[flagId] || eventDef.repeatable)
                       ) {
                        gameState.locationEvent = { ...eventDef, flagId: flagId };
                        if (typeof game !== 'undefined' && game.log) game.log(`СОБЫТИЕ НА ЛОКАЦИИ: ${gameState.locationEvent.text}`, "event-discovery");
                        EventManager.displayLocationEventChoices();
                        eventTriggered = true;
                        break; // Только одно событие локации за раз
                    }
                }
            }

            if (!eventTriggered) {
                if (itemsFoundCount === 0 && !specialItemFoundThisTurn && typeof game !== 'undefined' && game.log) {
                    game.log("Ничего ценного не найдено в этот раз.", "event-neutral");
                }
                this.nextDayForLocationAction(locDef.scoutTime || 1, `Обыск локации: ${locDef.name}`);
            } else {
                // Если событие сработало, nextDay не вызываем здесь, он будет после завершения события, если нужно.
                // Но UI вкладки нужно обновить, чтобы кнопки заблокировались
                this.updateExploreTab();
            }
        }
    },

    nextDayForLocationAction: function(daysSpent = 1, actionName = "Действие на локации") {
        if (typeof game !== 'undefined' && game.log) game.log(`${actionName} заняло ${daysSpent} дн.`, "event-neutral");

        for (let i = 0; i < daysSpent; i++) {
            if (gameState.gameOver) break;
            gameState.day++;
             if (typeof game !== 'undefined' && game.log) game.log(`--- Наступил День ${gameState.day} (после вылазки) ---`, "event-neutral");

            // Потребление ресурсов выжившими (упрощенная версия из game.nextDay)
            const foodNeed = gameState.survivors * 10; // Должно быть согласовано с game.js
            const waterNeed = gameState.survivors * 15; // Должно быть согласовано с game.js
            let foodConsumed = 0;
            let waterConsumed = 0;
            if (typeof InventoryManager !== 'undefined') {
                foodConsumed = InventoryManager.consumeResourceFromBase('food', foodNeed);
                waterConsumed = InventoryManager.consumeResourceFromBase('water', waterNeed);
            }

            if (foodConsumed < foodNeed && !gameState.gameOver) {
                 if (typeof game !== 'undefined' && game.log) game.log("Выжившие голодают на базе во время вашей вылазки!", "event-negative");
                // Логика смерти от голода (упрощенная, лучше вынести в общую функцию)
                let diedFromHunger = 0;
                for (let s = 0; s < gameState.survivors; s++) { if (Math.random() < 0.20) diedFromHunger++; }
                if (diedFromHunger > 0) {
                    const actualDeaths = Math.min(diedFromHunger, gameState.survivors);
                    gameState.survivors -= actualDeaths;
                    if (typeof game !== 'undefined' && game.log) game.log(`${actualDeaths} выживших умерло от голода на базе!`, "event-negative");
                    if (gameState.survivors <= 0 && !gameState.gameOver && typeof game !== 'undefined') { game.gameOver("Все выжившие на базе погибли от голода."); break; }
                }
            }
            if (waterConsumed < waterNeed && !gameState.gameOver) {
                if (typeof game !== 'undefined' && game.log) game.log("Выжившие страдают от жажды на базе во время вашей вылазки!", "event-negative");
                // Логика смерти от жажды
                let diedFromThirst = 0;
                for (let s = 0; s < gameState.survivors; s++) { if (Math.random() < 0.25) diedFromThirst++; }
                if (diedFromThirst > 0) {
                    const actualDeaths = Math.min(diedFromThirst, gameState.survivors);
                    gameState.survivors -= actualDeaths;
                     if (typeof game !== 'undefined' && game.log) game.log(`${actualDeaths} выживших умерло от обезвоживания на базе!`, "event-negative");
                    if (gameState.survivors <= 0 && !gameState.gameOver && typeof game !== 'undefined') { game.gameOver("Все выжившие на базе погибли от жажды."); break; }
                }
            }
            // Глобальное событие может произойти и во время вылазки
            if (typeof EventManager !== 'undefined' && !gameState.currentEvent && !gameState.locationEvent) {
                 EventManager.triggerRandomEvent();
            }
            if (gameState.currentEvent || gameState.locationEvent) {
                if (typeof game !== 'undefined' && game.log) game.log(`Во время вашего отсутствия на базе произошло событие! Разберитесь с ним по возвращении.`, "event-warning");
                // Не прерываем цикл дней, но событие будет ждать
            }

            if(gameState.gameOver) break;
        }
        // Обновляем UI после всех дней и возможных событий
        if (typeof UIManager !== 'undefined') {
            UIManager.updateDisplay(); // Общий апдейт
            UIManager.updateBuildActions(); // Обновить доступность построек
        }
        this.updateExploreTab(); // Обновить вкладку разведки (например, счетчик попыток)

        if (typeof game !== 'undefined' && typeof game.saveGame === 'function') {
            game.saveGame();
        }
    }
};
