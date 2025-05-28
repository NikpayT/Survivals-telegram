// inventory_manager.js

// Предполагается, что gameState, domElements, ITEM_DEFINITIONS, UIManager, game
// доступны глобально.

const InventoryManager = {
    addItemToInventory: function(targetInventory, itemId, quantity = 1) {
        if (!ITEM_DEFINITIONS[itemId]) {
            console.error(`Попытка добавить несуществующий предмет: ${itemId}`);
            if (typeof game !== 'undefined' && game.log) game.log(`Системная ошибка: Попытка добавить несуществующий предмет ${itemId}`, "event-negative");
            return false;
        }
        const itemDef = ITEM_DEFINITIONS[itemId];

        if (targetInventory === gameState.inventory &&
            (gameState.player.carryWeight + (itemDef.weight * quantity) > gameState.player.maxCarryWeight)) {
            if (typeof game !== 'undefined' && game.log) game.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
            return false;
        }

        const existingItemIndex = targetInventory.findIndex(slot => slot.itemId === itemId && itemDef.stackable);
        if (existingItemIndex > -1) {
            targetInventory[existingItemIndex].quantity += quantity;
        } else {
            targetInventory.push({ itemId: itemId, quantity: quantity });
        }

        if (targetInventory === gameState.inventory) {
            gameState.player.carryWeight += itemDef.weight * quantity;
            gameState.player.carryWeight = parseFloat(gameState.player.carryWeight.toFixed(2));
            if (typeof UIManager !== 'undefined') UIManager.updateInventoryWeightDisplay();
            this.renderPlayerInventoryIfActive();
        } else if (targetInventory === gameState.baseInventory) {
            this.renderBaseInventoryIfActive();
        }
        
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Обновить общие показатели на UI
        return true;
    },

    removeItemFromInventory: function(targetInventory, itemId, quantity = 1, specificIndex = -1) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) {
            console.error(`Попытка удалить несуществующий предмет: ${itemId}`);
            return false;
        }

        let itemIndex;
        if (specificIndex > -1 && targetInventory[specificIndex] && targetInventory[specificIndex].itemId === itemId) {
            itemIndex = specificIndex;
        } else {
            itemIndex = targetInventory.findIndex(slot => slot.itemId === itemId);
        }

        if (itemIndex > -1) {
            const itemSlot = targetInventory[itemIndex];
            let removedQuantity = 0;
            if (itemSlot.quantity > quantity) {
                itemSlot.quantity -= quantity;
                removedQuantity = quantity;
            } else {
                removedQuantity = itemSlot.quantity;
                targetInventory.splice(itemIndex, 1);
            }
            if (targetInventory === gameState.inventory) {
                gameState.player.carryWeight -= itemDef.weight * removedQuantity;
                gameState.player.carryWeight = Math.max(0, parseFloat(gameState.player.carryWeight.toFixed(2)));
                if (typeof UIManager !== 'undefined') UIManager.updateInventoryWeightDisplay();
                this.renderPlayerInventoryIfActive();
            } else if (targetInventory === gameState.baseInventory) {
                this.renderBaseInventoryIfActive();
            }
            
            if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Обновить общие показатели на UI
            return true;
        }
        return false;
    },

    countItemInInventory: function(targetInventory, itemId) {
        let count = 0;
        if (!targetInventory || !Array.isArray(targetInventory)) return 0;
        targetInventory.forEach(slot => {
            if (slot.itemId === itemId) {
                count += slot.quantity;
            }
        });
        return count;
    },

    openInventoryModal: function() {
        if (!domElements || !domElements.inventoryModal) return;
        domElements.inventoryModal.style.display = 'block';
        this.filterPlayerInventory('all'); // При открытии применяем фильтр "все" и рендерим
    },

    closeInventoryModal: function() {
        if (!domElements || !domElements.inventoryModal) return;
        domElements.inventoryModal.style.display = 'none';
    },

    filterPlayerInventory: function(filterType) {
        if (domElements.inventoryFilters) {
            domElements.inventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            const activeButton = domElements.inventoryFilters.querySelector(`button[data-filter="${filterType}"]`);
            if (activeButton) activeButton.classList.add('active');
        }
        this.renderPlayerInventory(filterType);
    },

    filterBaseInventory: function(filterType) {
        if (domElements.baseInventoryFilters) {
            domElements.baseInventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            const activeButton = domElements.baseInventoryFilters.querySelector(`button[data-filter="${filterType}"]`);
            if (activeButton) activeButton.classList.add('active');
        }
        this.renderBaseInventory(filterType);
    },

    renderPlayerInventoryIfActive: function() {
        if (domElements.inventoryModal && domElements.inventoryModal.style.display === 'block') {
            const activeFilter = domElements.inventoryFilters?.querySelector('button.active')?.dataset.filter || 'all';
            this.renderPlayerInventory(activeFilter);
        }
    },

    renderBaseInventoryIfActive: function() {
        if (document.getElementById('storage-tab')?.style.display === 'block') {
            const activeFilter = domElements.baseInventoryFilters?.querySelector('button.active')?.dataset.filter || 'all';
            this.renderBaseInventory(activeFilter);
        }
    },

    renderPlayerInventory: function(filterType = 'all') {
        if (!domElements || !domElements.inventoryItemsList || !ITEM_DEFINITIONS) return;
        domElements.inventoryItemsList.innerHTML = '';
        const inventoryToDisplay = gameState.inventory;

        if (inventoryToDisplay.length === 0) {
            domElements.inventoryItemsList.innerHTML = '<p>Ваш инвентарь пуст.</p>';
            if (typeof UIManager !== 'undefined') UIManager.updateInventoryWeightDisplay();
            return;
        }

        let somethingRendered = false;
        inventoryToDisplay.forEach((itemSlot, index) => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (!itemDef) {
                console.warn(`InventoryManager.renderPlayerInventory: Definition for item ${itemSlot.itemId} not found.`);
                return;
            }

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
                itemActionsHTML += `<button onclick="InventoryManager.consumeItem('${itemSlot.itemId}', ${index})">Использовать</button>`;
            }
            // Кнопки перемещения теперь будут вызывать InventoryManager.transferItem
            itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'player', 'base', 1)">На склад (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'player', 'base', ${itemSlot.quantity})">На склад (Все)</button>`;
            }

            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4>${itemDef.name} <span class="item-quantity">(x${itemSlot.quantity})</span></h4>
                    <p>${itemDef.description} (Вес: ${itemDef.weight.toFixed(1)} кг/шт)</p>
                </div>
                <div class="item-actions">
                    ${itemActionsHTML}
                </div>
            `;
            domElements.inventoryItemsList.appendChild(itemDiv);
        });

        if (!somethingRendered && filterType !== 'all') {
             domElements.inventoryItemsList.innerHTML = `<p>Нет предметов типа '${filterType}'.</p>`;
        }
        if (typeof UIManager !== 'undefined') UIManager.updateInventoryWeightDisplay();
    },

    renderBaseInventory: function(filterType = 'all') {
        if (!domElements || !domElements.baseInventoryList || !ITEM_DEFINITIONS) return;
        domElements.baseInventoryList.innerHTML = '';
        const inventoryToDisplay = gameState.baseInventory;

        if (inventoryToDisplay.length === 0) {
            domElements.baseInventoryList.innerHTML = '<p>Склад базы пуст.</p>';
            return;
        }

        let somethingRendered = false;
        inventoryToDisplay.forEach((itemSlot, index) => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (!itemDef) {
                console.warn(`InventoryManager.renderBaseInventory: Definition for item ${itemSlot.itemId} not found.`);
                return;
            }

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
            itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'base', 'player', 1)">Взять (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'base', 'player', ${itemSlot.quantity})">Взять (Все)</button>`;
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

    transferItem: function(itemId, itemIndexInSource, sourceInventoryType, destinationInventoryType, quantity) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) return;

        const sourceInventory = sourceInventoryType === 'player' ? gameState.inventory : gameState.baseInventory;
        const destinationInventory = destinationInventoryType === 'player' ? gameState.inventory : gameState.baseInventory;

        if (!Array.isArray(sourceInventory) || !Array.isArray(destinationInventory)) {
            console.error("Ошибка: инвентарь источника или назначения не является массивом.");
            return;
        }

        const sourceSlot = sourceInventory[itemIndexInSource];
        if (!sourceSlot || sourceSlot.itemId !== itemId) {
            console.error("Ошибка: предмет не найден в исходном слоте для перемещения.", itemId, itemIndexInSource, sourceInventory);
            return;
        }

        const actualQuantity = Math.min(quantity, sourceSlot.quantity);

        if (destinationInventory === gameState.inventory) { // Проверяем вес только при перемещении К ИГРОКУ
            if (gameState.player.carryWeight + (itemDef.weight * actualQuantity) > gameState.player.maxCarryWeight) {
                if (typeof game !== 'undefined' && game.log) game.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${actualQuantity}).`, "event-warning");
                return;
            }
        }

        // Сначала добавляем, потом удаляем, чтобы избежать проблем с индексами, если это один и тот же инвентарь (хотя тут разные)
        // Но для консистентности лучше сохранить такой порядок.
        // Важно: addItemToInventory и removeItemFromInventory сами обновят UI для своего инвентаря, если он активен
        // и вызовут UIManager.updateInventoryWeightDisplay при необходимости.

        let itemAdded = this.addItemToInventory(destinationInventory, itemId, actualQuantity);
        if (itemAdded) {
            let itemRemoved = this.removeItemFromInventory(sourceInventory, itemId, actualQuantity, itemIndexInSource);
            if (!itemRemoved) {
                // Если не удалось удалить (что странно, если добавление удалось), откатываем добавление.
                this.removeItemFromInventory(destinationInventory, itemId, actualQuantity); // Попытка отката
                 if (typeof game !== 'undefined' && game.log) game.log(`Ошибка при удалении ${itemDef.name} из источника после перемещения. Операция отменена.`, "event-negative");
                return;
            }
            if (typeof game !== 'undefined' && game.log) game.log(`Перемещено: ${itemDef.name} (x${actualQuantity}) ${sourceInventoryType === 'player' ? 'на склад' : 'в личный инвентарь'}.`, "event-neutral");
        } else {
            // Если не удалось добавить, ничего не делаем с исходным инвентарем. Сообщение об ошибке уже было в addItemToInventory.
            return;
        }
        
        // Общий UIManager.updateDisplay() может быть полезен для обновления счетчиков на базе и т.д.
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
    },

    consumeItem: function(itemId, inventoryItemIndex, targetInventoryType = 'player') {
        // targetInventoryType добавлен для ясности, но по факту consumeItem в UI вызывается только для инвентаря игрока
        const targetInventory = gameState.inventory; // Потребляем всегда из инвентаря игрока
        const itemDef = ITEM_DEFINITIONS[itemId];

        if (!itemDef || !itemDef.effect) {
            if (typeof game !== 'undefined' && game.log) game.log(`Предмет '${itemDef ? itemDef.name : itemId}' не является употребляемым.`, "event-neutral");
            return;
        }

        let consumed = false;
        if (itemDef.type === "food" && itemDef.effect.hunger) {
            gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + itemDef.effect.hunger);
            if (typeof game !== 'undefined' && game.log) game.log(`Вы съели: ${itemDef.name}. Сытость +${itemDef.effect.hunger}.`, "event-positive");
            consumed = true;
        } else if ((itemDef.type === "water" || itemDef.type === "water_source") && itemDef.effect.thirst) {
            if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance) {
                if (typeof game !== 'undefined' && game.log) game.log(`Вы выпили ${itemDef.name}, но почувствовали себя хуже. Возможно, отравление.`, "event-negative");
                gameState.player.condition = "Подташнивает"; // Пример состояния
            } else {
                gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + itemDef.effect.thirst);
                if (typeof game !== 'undefined' && game.log) game.log(`Вы выпили: ${itemDef.name}. Жажда утолена на +${itemDef.effect.thirst}.`, "event-positive");
            }
            consumed = true;
        } else if (itemDef.type === "medicine" && itemDef.effect.healing) {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + itemDef.effect.healing);
            if (typeof game !== 'undefined' && game.log) game.log(`Вы использовали ${itemDef.name}. Здоровье +${itemDef.effect.healing}.`, "event-positive");
            consumed = true;
        }

        if (consumed) {
            this.removeItemFromInventory(targetInventory, itemId, 1, inventoryItemIndex);
            // removeItemFromInventory уже вызовет renderPlayerInventoryIfActive и updateInventoryWeightDisplay
        }
        if (typeof UIManager !== 'undefined') {
            UIManager.updatePlayerStatus(); // Обновить все статы игрока в UI
            UIManager.updateDisplay();      // Обновить общие показатели
        }
    },

    consumeResourceFromBase: function(resourceType, amountNeeded) {
        let amountFulfilled = 0;
        const inventory = gameState.baseInventory;

        // Сортируем предметы: сначала менее ценные / более опасные (с sickness_chance или radiation)
        // Это примерная логика, ее можно усложнить.
        inventory.sort((aSlot, bSlot) => {
            const aDef = ITEM_DEFINITIONS[aSlot.itemId];
            const bDef = ITEM_DEFINITIONS[bSlot.itemId];
            let aScore = 0; let bScore = 0;

            if (resourceType === 'food') {
                aScore = (aDef.effect?.hunger || 0);
                if (aDef.effect?.sickness_chance || aDef.effect?.radiation) aScore *= 0.5; // Менее предпочтительно
                bScore = (bDef.effect?.hunger || 0);
                if (bDef.effect?.sickness_chance || bDef.effect?.radiation) bScore *= 0.5;
            } else if (resourceType === 'water') {
                aScore = (aDef.effect?.thirst || 0);
                if (aDef.effect?.sickness_chance) aScore *= 0.5;
                bScore = (bDef.effect?.thirst || 0);
                if (bDef.effect?.sickness_chance) bScore *= 0.5;
            }
            return aScore - bScore; // Сортируем от худшего к лучшему (меньший score первым)
        });

        // Итерируем с конца, чтобы удаление не влияло на текущие индексы
        for (let i = inventory.length - 1; i >= 0 && amountFulfilled < amountNeeded; i--) {
            const slot = inventory[i];
            if (!slot) continue; // На всякий случай

            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            let itemValue = 0;
            let isCorrectType = false;
            let sideEffectLogged = false;

            if (resourceType === 'food' && itemDef.type === 'food' && itemDef.effect?.hunger) {
                itemValue = itemDef.effect.hunger;
                isCorrectType = true;
                if (itemDef.effect?.radiation && Math.random() < 0.05 * gameState.survivors) { // Шанс на каждого выжившего ниже
                    if (typeof game !== 'undefined' && game.log) game.log(`Кто-то получил дозу радиации от ${itemDef.name} со склада.`, "event-warning");
                    sideEffectLogged = true;
                }
                 if (itemDef.effect?.sickness_chance && Math.random() < itemDef.effect.sickness_chance * 0.05 * gameState.survivors) {
                    if (typeof game !== 'undefined' && game.log) game.log(`Кто-то из выживших почувствовал себя плохо от ${itemDef.name} со склада.`, "event-warning");
                    sideEffectLogged = true;
                }
            } else if (resourceType === 'water' && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect?.thirst) {
                itemValue = itemDef.effect.thirst;
                isCorrectType = true;
                 if (itemDef.effect?.sickness_chance && Math.random() < itemDef.effect.sickness_chance * 0.05 * gameState.survivors) {
                    if (typeof game !== 'undefined' && game.log) game.log(`Кто-то из выживших заболел, выпив ${itemDef.name} со склада.`, "event-warning");
                    sideEffectLogged = true;
                }
            }

            if (isCorrectType && itemValue > 0) {
                const neededFromThisSlot = Math.ceil((amountNeeded - amountFulfilled) / itemValue);
                const canConsumeFromSlot = Math.min(slot.quantity, neededFromThisSlot);

                amountFulfilled += canConsumeFromSlot * itemValue;
                this.removeItemFromInventory(gameState.baseInventory, slot.itemId, canConsumeFromSlot, i);
                // removeItemFromInventory сам обновит UI склада, если он активен
            }
        }
        // После цикла, если что-то было потреблено, UIManager.updateDisplay обновит общие счетчики.
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay();
        return Math.min(amountFulfilled, amountNeeded);
    }
};
