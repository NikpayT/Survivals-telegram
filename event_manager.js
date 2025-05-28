// event_manager.js

// Предполагается, что gameState, domElements, UIManager, InventoryManager, LocationManager, GameStateGetters
// и game (для game.log, game.gameOver, game.takeDamage) доступны глобально.

const EventManager = {
    possibleEvents: [ // Глобальные события, происходящие на базе или в мире
         {
            id: "found_survivor",
            condition: () => typeof GameStateGetters !== 'undefined' && gameState.survivors < GameStateGetters.getMaxSurvivors() && Math.random() < 0.08 && gameState.day > 1,
            text: "Вы слышите стук в ворота. Одинокий путник просит убежища.",
            choices: [
                {
                    text: "Принять (+1 выживший)",
                    action: function() {
                        if (typeof GameStateGetters !== 'undefined' && gameState.survivors < GameStateGetters.getMaxSurvivors()) {
                            gameState.survivors++;
                            if (typeof game !== 'undefined' && game.log) game.log("Новый выживший присоединился к вам.", "event-positive");
                        } else {
                            if (typeof game !== 'undefined' && game.log) game.log("На базе нет места для нового выжившего.", "event-neutral");
                        }
                    }
                },
                {
                    text: "Отказать",
                    action: function() { if (typeof game !== 'undefined' && game.log) game.log("Вы отказали путнику. Он ушел в неизвестность.", "event-neutral"); }
                }
            ]
        },
        {
            id: "trader_visit",
            condition: () => Math.random() < 0.07 && gameState.day > 2,
            text: "К базе подошел торговец. Предлагает 3 'Стимулятора' за 15 'Металлолома' (с вашего личного инвентаря).",
            choices: [
                {
                    text: "Обменять (Метал.-15, Стим.+3)",
                    action: function() { 
                        if (typeof InventoryManager !== 'undefined' && InventoryManager.countItemInInventory(gameState.inventory, "scrap_metal") >= 15) {
                            InventoryManager.removeItemFromInventory(gameState.inventory, "scrap_metal", 15);
                            InventoryManager.addItemToInventory(gameState.inventory, "stimpack_fallout", 3); // Убедись, что "stimpack_fallout" есть в items.js
                            if (typeof game !== 'undefined' && game.log) game.log("Сделка совершена. Вы получили стимуляторы.", "event-positive");
                        } else {
                            if (typeof game !== 'undefined' && game.log) game.log("У вас недостаточно металлолома для обмена.", "event-negative");
                        }
                    }
                },
                {
                    text: "Отказаться",
                    action: function() { 
                        if (typeof game !== 'undefined' && game.log) game.log("Торговец ушел, ворча себе под нос.", "event-neutral");
                    }
                }
            ]
        },
        {
            id: "minor_horde_near_base",
            condition: () => Math.random() < 0.1 && gameState.day > 3,
            text: "Небольшая группа зомби замечена неподалеку от базы! Они могут напасть.",
            choices: [
                {
                    text: "Укрепить оборону (-5 дерева, -3 металла со склада)",
                    action: function() {
                        if (typeof InventoryManager !== 'undefined' && InventoryManager.countItemInInventory(gameState.baseInventory, "wood") >=5 && InventoryManager.countItemInInventory(gameState.baseInventory, "scrap_metal") >=3){
                            InventoryManager.removeItemFromInventory(gameState.baseInventory, "wood", 5);
                            InventoryManager.removeItemFromInventory(gameState.baseInventory, "scrap_metal", 3);
                            if (typeof game !== 'undefined' && game.log) game.log("Оборона усилена. Зомби не решились атаковать.", "event-positive");
                        } else {
                             if (typeof game !== 'undefined' && game.log) game.log("Не хватило материалов на складе для укрепления! Зомби прорвались!", "event-negative");
                             if(!gameState.gameOver && typeof game !== 'undefined' && game.takeDamage) game.takeDamage(10 + Math.floor(gameState.day / 2), "атака зомби на базу");
                             
                             let diedInHordeAttack = 0;
                             for (let i = 0; i < gameState.survivors; i++) {
                                 if (Math.random() < 0.15) { 
                                     diedInHordeAttack++;
                                 }
                             }
                             if (diedInHordeAttack > 0 && !gameState.gameOver) {
                                 const actualDeaths = Math.min(diedInHordeAttack, gameState.survivors);
                                 if (actualDeaths > 0) { // Доп. проверка, что есть кого убивать
                                     gameState.survivors -= actualDeaths;
                                     if (typeof game !== 'undefined' && game.log) game.log(`${actualDeaths} выживших погибло во время атаки зомби...`, "event-negative");
                                     if(gameState.survivors <= 0 && !gameState.gameOver && typeof game !== 'undefined') game.gameOver("Все выжившие погибли при атаке на базу.");
                                 }
                             }
                        }
                    }
                },
                {
                    text: "Рискнуть и ничего не делать",
                    action: function() {
                         if (Math.random() < 0.6) {
                            if (typeof game !== 'undefined' && game.log) game.log("Зомби прошли мимо, не заметив базу.", "event-neutral");
                         } else {
                            if (typeof game !== 'undefined' && game.log) game.log("Зомби атаковали неподготовленную базу!", "event-negative");
                            if(!gameState.gameOver && typeof game !== 'undefined' && game.takeDamage) game.takeDamage(15 + gameState.day, "внезапная атака на базу");

                            let diedInSuddenAttack = 0;
                            for (let i = 0; i < gameState.survivors; i++) {
                                if (Math.random() < 0.25) { 
                                    diedInSuddenAttack++;
                                }
                            }
                            if (diedInSuddenAttack > 0 && !gameState.gameOver) {
                                const actualDeaths = Math.min(diedInSuddenAttack, gameState.survivors);
                                if (actualDeaths > 0) { // Доп. проверка
                                    gameState.survivors -= actualDeaths;
                                    if (typeof game !== 'undefined' && game.log) game.log(`Потери среди выживших в результате внезапной атаки: ${actualDeaths}.`, "event-negative");
                                    if(gameState.survivors <= 0 && !gameState.gameOver && typeof game !== 'undefined') game.gameOver("Все выжившие погибли при внезапной атаке.");
                                }
                            }
                         }
                    }
                }
            ]
        }
    ],

    triggerRandomEvent: function() {
        if (gameState.currentEvent || gameState.locationEvent || gameState.gameOver) return;

        const availableEvents = this.possibleEvents.filter(event => {
            try {
                return typeof event.condition === 'function' ? event.condition() : true;
            } catch (e) {
                console.error(`Error in event condition for ${event.id}:`, e);
                return false;
            }
        });

        if (availableEvents.length > 0) {
            gameState.currentEvent = { ...availableEvents[Math.floor(Math.random() * availableEvents.length)] };
            if (typeof game !== 'undefined' && game.log) game.log(`СОБЫТИЕ: ${gameState.currentEvent.text}`, "event-discovery");
            this.displayEventChoices();
        } else {
            const exploreTabActive = document.getElementById('explore-tab')?.style.display === 'block';
            if (exploreTabActive && domElements.eventActionsContainer && !gameState.locationEvent) { // Убедимся, что domElements существует
                 domElements.eventActionsContainer.style.display = 'none';
            }
        }
    },

    displayEventChoices: function() {
        if (!domElements.eventActionsContainer || !domElements.eventTextDisplay || !domElements.eventActions) {
            console.error("EventManager: DOM elements for events not found!");
            return;
        }

        domElements.eventActions.innerHTML = '';
        if (!gameState.currentEvent) {
            domElements.eventActionsContainer.style.display = 'none';
            return;
        }

        domElements.eventTextDisplay.textContent = gameState.currentEvent.text;
        domElements.eventActionsContainer.style.display = 'block';

        if (domElements.scoutCurrentLocationButton) domElements.scoutCurrentLocationButton.disabled = true;
        if (domElements.discoverNewLocationButton) domElements.discoverNewLocationButton.disabled = true;
        const passDayBaseButton = document.getElementById('pass-day-base-button');
        if (passDayBaseButton) passDayBaseButton.disabled = true;


        gameState.currentEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            let choiceIsAvailable = true;
            if (typeof choice.condition === 'function') {
                try {
                    choiceIsAvailable = choice.condition();
                } catch (e) {
                    console.error(`Error in event choice condition for event ${gameState.currentEvent.id}, choice "${choice.text}":`, e);
                    choiceIsAvailable = false;
                }
            }
            btn.disabled = !choiceIsAvailable;

            if (typeof choice.action === 'function') {
                btn.onclick = () => {
                    if (gameState.currentEvent && choiceIsAvailable) {
                        try {
                            choice.action();
                        } catch (e) {
                            console.error(`Error executing action for event ${gameState.currentEvent.id}, choice "${choice.text}":`, e);
                            if (typeof game !== 'undefined' && game.log) game.log("Произошла ошибка при выполнении действия события.", "event-negative");
                        }
                        gameState.currentEvent = null;
                        if (typeof UIManager !== 'undefined') UIManager.finalizeEventUI();
                    }
                };
            } else {
                 console.error(`Некорректное определение choice.action в глобальном событии: ${gameState.currentEvent.id}`, choice);
                 btn.disabled = true;
            }
            domElements.eventActions.appendChild(btn);
        });
    },

    displayLocationEventChoices: function() {
        if (!domElements.eventActionsContainer || !domElements.eventTextDisplay || !domElements.eventActions) {
            console.error("EventManager: DOM elements for events not found!");
            return;
        }

        domElements.eventActions.innerHTML = '';
        if (!gameState.locationEvent) {
            domElements.eventActionsContainer.style.display = 'none';
            return;
        }

        domElements.eventTextDisplay.textContent = gameState.locationEvent.text;
        domElements.eventActionsContainer.style.display = 'block';

        if (domElements.scoutCurrentLocationButton) domElements.scoutCurrentLocationButton.disabled = true;
        if (domElements.discoverNewLocationButton) domElements.discoverNewLocationButton.disabled = true;
        const passDayBaseButton = document.getElementById('pass-day-base-button');
        if (passDayBaseButton) passDayBaseButton.disabled = true;

        gameState.locationEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            let choiceIsAvailable = true;
            if (typeof choice.condition === 'function') {
                 try {
                    choiceIsAvailable = choice.condition();
                } catch (e) {
                    console.error(`Error in location event choice condition for event ${gameState.locationEvent.id}, choice "${choice.text}":`, e);
                    choiceIsAvailable = false;
                }
            }
            btn.disabled = !choiceIsAvailable;

            const handleChoice = () => {
                if (gameState.locationEvent && choiceIsAvailable) { // Перепроверяем, что событие все еще активно и выбор доступен
                    const currentLocEvent = { ...gameState.locationEvent };
                    gameState.locationEvent = null; 

                    try {
                        if (typeof choice.action === 'function') {
                            choice.action();
                        } else if (choice.outcome) {
                            const outcome = choice.outcome;
                            if (outcome.log && typeof game !== 'undefined' && game.log) game.log(outcome.log, outcome.type || "event-neutral");
                            if (outcome.addItems && typeof InventoryManager !== 'undefined') {
                                outcome.addItems.forEach(item => {
                                    // Убедимся, что quantity определено корректно
                                    let qty = item.quantity;
                                    if (Array.isArray(qty)) { // Если диапазон [min, max]
                                        qty = Math.floor(Math.random() * (qty[1] - qty[0] + 1)) + qty[0];
                                    }
                                    InventoryManager.addItemToInventory(gameState.inventory, item.itemId, qty);
                                });
                            }
                            if (outcome.setFlag && currentLocEvent.flagId) gameState.flags[currentLocEvent.flagId] = true;
                        }
                    } catch (e) {
                         console.error(`Error executing action/outcome for location event ${currentLocEvent.id}, choice "${choice.text}":`, e);
                         if (typeof game !== 'undefined' && game.log) game.log("Произошла ошибка при выполнении действия события локации.", "event-negative");
                    }
                    
                    if (typeof UIManager !== 'undefined') UIManager.finalizeEventUI();
                }
            };
            btn.onclick = handleChoice;
            domElements.eventActions.appendChild(btn);
        });
    }
};
