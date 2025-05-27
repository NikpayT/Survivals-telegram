// event_manager.js

// Предполагается, что gameState, domElements, UIManager, InventoryManager, LocationManager
// и game (для game.log, game.gameOver) доступны глобально.

const EventManager = {
    possibleEvents: [ // Глобальные события
         {
            id: "found_survivor",
            condition: () => gameState.survivors < GameStateGetters.getMaxSurvivors() && Math.random() < 0.08,
            text: "Вы слышите стук в ворота. Одинокий путник просит убежища.",
            choices: [
                { 
                    text: "Принять (+1 выживший)", 
                    action: function() { 
                        if (gameState.survivors < GameStateGetters.getMaxSurvivors()) {
                            gameState.survivors++;
                            game.log("Новый выживший присоединился к вам.", "event-positive");
                        } else {
                            game.log("На базе нет места для нового выжившего.", "event-neutral");
                        }
                    }
                },
                { 
                    text: "Отказать", 
                    action: function() { game.log("Вы отказали путнику. Он ушел в неизвестность.", "event-neutral"); } 
                }
            ]
        },
        {
            id: "trader_visit",
            condition: () => Math.random() < 0.07,
            text: "К базе подошел торговец. Предлагает 3 'Стимулятора' за 15 'Металлолома' (с вашего личного инвентаря).",
            choices: [
                { 
                    text: "Обменять (Метал.-15, Стим.+3)", 
                    action: function() {
                        if (InventoryManager.countItemInInventory(gameState.inventory, "scrap_metal") >= 15) {
                            InventoryManager.removeItemFromInventory(gameState.inventory, "scrap_metal", 15);
                            InventoryManager.addItemToInventory(gameState.inventory, "stimpack_fallout", 3); 
                            game.log("Сделка совершена. Вы получили стимуляторы.", "event-positive");
                        } else {
                            game.log("У вас недостаточно металлолома для обмена.", "event-negative");
                        }
                    }
                },
                { 
                    text: "Отказаться", 
                    action: function() { game.log("Торговец ушел, ворча себе под нос.", "event-neutral"); } 
                }
            ]
        },
        {
            id: "minor_horde_near_base",
            condition: () => Math.random() < 0.1 && gameState.day > 2, 
            text: "Небольшая группа зомби замечена неподалеку от базы! Они могут напасть.",
            choices: [
                { 
                    text: "Укрепить оборону (-5 дерева, -3 металла со склада)", 
                    action: function() { 
                        if (InventoryManager.countItemInInventory(gameState.baseInventory, "wood") >=5 && InventoryManager.countItemInInventory(gameState.baseInventory, "scrap_metal") >=3){
                            InventoryManager.removeItemFromInventory(gameState.baseInventory, "wood", 5);
                            InventoryManager.removeItemFromInventory(gameState.baseInventory, "scrap_metal", 3);
                            game.log("Оборона усилена. Зомби не решились атаковать.", "event-positive");
                        } else {
                             game.log("Не хватило материалов на складе для укрепления! Зомби прорвались!", "event-negative");
                             if(!gameState.gameOver) game.takeDamage(10 * gameState.survivors, "атака зомби");
                             if(!gameState.gameOver && Math.random() < 0.2 * gameState.survivors && gameState.survivors > 0){
                                 gameState.survivors--;
                                 game.log("Один из выживших погиб во время атаки...", "event-negative");
                                 if(gameState.survivors <= 0 && !gameState.gameOver) game.gameOver("Все выжившие погибли.");
                             }
                        }
                    }
                },
                { 
                    text: "Рискнуть и ничего не делать", 
                    action: function() {
                         if (Math.random() < 0.6) { 
                            game.log("Зомби прошли мимо, не заметив базу.", "event-neutral");
                         } else {
                            game.log("Зомби атаковали неподготовленную базу!", "event-negative");
                            if(!gameState.gameOver) game.takeDamage(15 * gameState.survivors, "внезапная атака");
                             if(!gameState.gameOver && Math.random() < 0.3 * gameState.survivors && gameState.survivors > 0){
                                 gameState.survivors--;
                                 game.log("Потери среди выживших...", "event-negative");
                                 if(gameState.survivors <= 0 && !gameState.gameOver) game.gameOver("Все выжившие погибли.");
                             }
                         }
                    }
                }
            ]
        }
    ],

    triggerRandomEvent: function() { 
        if (gameState.currentEvent || gameState.locationEvent || gameState.gameOver) return; 

        const availableEvents = this.possibleEvents.filter(event => event.condition());
        if (availableEvents.length > 0) {
            gameState.currentEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            game.log(`СОБЫТИЕ: ${gameState.currentEvent.text}`, "event-discovery");
            this.displayEventChoices(); 
        } else {
            if (document.getElementById('main-tab').style.display === 'block') { 
                 domElements.eventActionsContainer.style.display = 'none';
            }
        }
    },

    displayEventChoices: function() { 
        const eventContainer = domElements.eventActionsContainer; 
        const eventTextEl = domElements.eventTextDisplay;
        const eventButtonsEl = domElements.eventActions;

        eventButtonsEl.innerHTML = ''; 
        if (!gameState.currentEvent) {
            eventContainer.style.display = 'none';
            UIManager.updateExploreTabDisplay(); 
            return;
        }

        eventTextEl.textContent = gameState.currentEvent.text;
        eventContainer.style.display = 'block';

        domElements.scoutCurrentLocationButton.disabled = true;
        domElements.discoverNewLocationButton.disabled = true;

        gameState.currentEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            if (typeof choice.action === 'function') {
                btn.onclick = () => {
                    if (gameState.currentEvent) { 
                        choice.action(); 
                        gameState.currentEvent = null; 
                        UIManager.finalizeEventUI(); // UI обновление через UIManager
                    }
                };
            } else {
                 console.error("Некорректное определение choice.action в глобальном событии:", choice);
                 btn.disabled = true;
            }
            eventButtonsEl.appendChild(btn);
        });
    },

    displayLocationEventChoices: function() {
        const eventContainer = domElements.eventActionsContainer; 
        const eventTextEl = domElements.eventTextDisplay;
        const eventButtonsEl = domElements.eventActions;

        eventButtonsEl.innerHTML = ''; 
        if (!gameState.locationEvent) {
            eventContainer.style.display = 'none';
            UIManager.updateExploreTabDisplay(); 
            return;
        }

        eventTextEl.textContent = gameState.locationEvent.text;
        eventContainer.style.display = 'block';
        domElements.scoutCurrentLocationButton.disabled = true; 
        domElements.discoverNewLocationButton.disabled = true;


        gameState.locationEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            if (typeof choice.action === 'function') { 
                 btn.onclick = () => {
                    if (gameState.locationEvent) {
                        choice.action(); 
                        gameState.locationEvent = null; 
                        UIManager.finalizeEventUI(); // UI обновление через UIManager
                    }
                };
            } else if (choice.outcome) { 
                 btn.onclick = () => {
                    if (gameState.locationEvent) { 
                        const currentLocEvent = gameState.locationEvent; 
                        const outcome = choice.outcome;
                        if (outcome.log) game.log(outcome.log, outcome.type || "event-neutral");
                        if (outcome.addItems) {
                            outcome.addItems.forEach(item => InventoryManager.addItemToInventory(gameState.inventory, item.itemId, item.quantity)); 
                        }
                        if (outcome.setFlag && currentLocEvent.flagId) gameState.flags[currentLocEvent.flagId] = true; 
                        
                        gameState.locationEvent = null; 
                        UIManager.finalizeEventUI(); // UI обновление через UIManager
                    }
                };
            } else {
                console.error("Некорректное определение выбора в событии локации:", choice);
                btn.disabled = true;
            }
            eventButtonsEl.appendChild(btn);
        });
    }
};
