// inventory_manager.js

// Предполагается, что gameState, domElements, ITEM_DEFINITIONS, UIManager, game
// доступны глобально.

const InventoryManager = {
    addItemToInventory: function(targetInventory, itemId, quantity = 1) {
        if (typeof ITEM_DEFINITIONS === 'undefined' || !ITEM_DEFINITIONS[itemId]) {
            console.error(`Попытка добавить несуществующий предмет: ${itemId}`);
            if (typeof game !== 'undefined' && game.log) game.log(`Системная ошибка: Попытка добавить несуществующий предмет ${itemId}`, "event-negative");
            return false;
        }
        const itemDef = ITEM_DEFINITIONS[itemId];

        if (targetInventory === gameState.inventory) { // Проверка веса для инвентаря игрока
            if ((gameState.player.carryWeight + (itemDef.weight * quantity) > gameState.player.maxCarryWeight)) {
                if (typeof game !== 'undefined' && game.log) game.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
                return false;
            }
        } else if (targetInventory === gameState.baseInventory) { // Проверка вместимости для склада базы
            const usage = GameStateGetters.getBaseInventoryUsage();
            // Проверяем по слотам: если предмет новый И склад полон по слотам
            const isNewItemForBase = !targetInventory.some(slot => slot.itemId === itemId && itemDef.stackable);
            if (isNewItemForBase && usage.current >= usage.max) {
                 if (typeof game !== 'undefined' && game.log) game.log(`Склад базы заполнен! Невозможно добавить новый тип предмета: ${itemDef.name}.`, "event-warning");
                return false;
            }
            // Если будем считать по общему количеству предметов, то проверка будет другая. Пока по слотам.
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
             if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Обновить счетчики склада в UI
        }
        
        // UIManager.updateDisplay(); // Вызывается более специфично выше
        return true;
    },

    removeItemFromInventory: function(targetInventory, itemId, quantity = 1, specificIndex = -1) {
        if (typeof ITEM_DEFINITIONS === 'undefined') {
            console.error("ITEM_DEFINITIONS не определены в removeItemFromInventory");
            return false;
        }
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
                if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Обновить счетчики склада в UI
            }
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
        this.filterPlayerInventory('all'); 
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
            const activeFilterButton = domElements.inventoryFilters?.querySelector('button.active');
            const activeFilter = activeFilterButton ? activeFilterButton.dataset.filter : 'all';
            this.renderPlayerInventory(activeFilter);
        }
    },

    renderBaseInventoryIfActive: function() {
        const storageTab = document.getElementById('storage-tab');
        if (storageTab && storageTab.style.display === 'block') {
            const activeFilterButton = domElements.baseInventoryFilters?.querySelector('button.active');
            const activeFilter = activeFilterButton ? activeFilterButton.dataset.filter : 'all';
            this.renderBaseInventory(activeFilter);
        }
    },

    renderPlayerInventory: function(filterType = 'all') {
        if (!domElements || !domElements.inventoryItemsList || typeof ITEM_DEFINITIONS === 'undefined') return;
        domElements.inventoryItemsList.innerHTML = '';
        const inventoryToDisplay = gameState.inventory;

        if (inventoryToDisplay.length === 0) {
            domElements.inventoryItemsList.innerHTML = '<p>Ваш инвентарь пуст.</p>';
            if (typeof UIManager !== 'undefined') UIManager.updateInventoryWeightDisplay();
            return;
        }

        let somethingRendered = false;
        // Сортировка перед отображением (если нужна дефолтная, иначе будет от кнопок)
        // inventoryToDisplay.sort((a,b) => (ITEM_DEFINITIONS[a.itemId]?.name || '').localeCompare(ITEM_DEFINITIONS[b.itemId]?.name || ''));

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
                itemActionsHTML += `<button onclick="InventoryManager.consumeItem('${itemSlot.itemId}', ${index})">Исп.</button>`; // Сокращено
            }
            itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'player', 'base', 1)">На склад (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'player', 'base', ${itemSlot.quantity})">На склад (Все)</button>`; // Кнопка "Переместить все"
            }

            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4>${itemDef.name} <span class="item-quantity">(x${itemSlot.quantity})</span></h4>
                    <p>${itemDef.description} (Вес: ${(itemDef.weight * itemSlot.quantity).toFixed(1)} кг / ${itemDef.weight.toFixed(1)} кг/шт)</p>
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
        if (!domElements || !domElements.baseInventoryList || typeof ITEM_DEFINITIONS === 'undefined') return;
        domElements.baseInventoryList.innerHTML = '';
        const inventoryToDisplay = gameState.baseInventory;

        if (inventoryToDisplay.length === 0) {
            domElements.baseInventoryList.innerHTML = '<p>Склад базы пуст.</p>';
            return;
        }

        let somethingRendered = false;
        // Сортировка перед отображением (если нужна дефолтная)
        // inventoryToDisplay.sort((a,b) => (ITEM_DEFINITIONS[a.itemId]?.name || '').localeCompare(ITEM_DEFINITIONS[b.itemId]?.name || ''));


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
                 itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'base', 'player', ${itemSlot.quantity})">Взять (Все)</button>`; // Кнопка "Переместить все"
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
        if (typeof ITEM_DEFINITIONS === 'undefined') return;
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

        // Проверяем, можно ли добавить в целевой инвентарь, ПЕРЕД удалением из источника
        if (destinationInventory === gameState.inventory) {
            if (gameState.player.carryWeight + (itemDef.weight * actualQuantity) > gameState.player.maxCarryWeight) {
                if (typeof game !== 'undefined' && game.log) game.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${actualQuantity}).`, "event-warning");
                return;
            }
        } else if (destinationInventory === gameState.baseInventory) {
            const usage = GameStateGetters.getBaseInventoryUsage();
            const isNewItemForDestBase = !destinationInventory.some(slot => slot.itemId === itemId && itemDef.stackable);
            if (isNewItemForDestBase && usage.current >= usage.max) {
                if (typeof game !== 'undefined' && game.log) game.log(`Склад базы заполнен! Невозможно добавить новый тип предмета: ${itemDef.name}.`, "event-warning");
                return;
            }
        }


        // Сначала удаляем из источника, затем добавляем в назначение
        // Это важно, если источник и назначение - один и тот же инвентарь (хотя здесь это не так)
        // но для консистентности лучше.
        let itemRemoved = this.removeItemFromInventory(sourceInventory, itemId, actualQuantity, itemIndexInSource);
        if (itemRemoved) {
            let itemAdded = this.addItemToInventory(destinationInventory, itemId, actualQuantity);
            if (!itemAdded) {
                // Если не удалось добавить, возвращаем предмет в источник (пытаемся)
                this.addItemToInventory(sourceInventory, itemId, actualQuantity); // Откат
                if (typeof game !== 'undefined' && game.log) game.log(`Ошибка при добавлении ${itemDef.name} в назначение. Операция отменена.`, "event-negative");
                return; // Важно! Обновление UI уже произошло в addItemToInventory и removeItemFromInventory
            }
            if (typeof game !== 'undefined' && game.log) game.log(`Перемещено: ${itemDef.name} (x${actualQuantity}) ${sourceInventoryType === 'player' ? 'на склад' : 'в личный инвентарь'}.`, "event-neutral");
        } else {
            if (typeof game !== 'undefined' && game.log) game.log(`Ошибка при удалении ${itemDef.name} из источника.`, "event-negative");
            return;
        }
        
        // UIManager.updateDisplay() не нужен здесь, т.к. addItem и removeItem уже его вызывают при необходимости.
    },

    consumeItem: function(itemId, inventoryItemIndex) { // Потребление всегда из инвентаря игрока
        if (typeof ITEM_DEFINITIONS === 'undefined') return;
        const targetInventory = gameState.inventory;
        const itemDef = ITEM_DEFINITIONS[itemId];

        if (!itemDef || !itemDef.effect) {
            if (typeof game !== 'undefined' && game.log) game.log(`Предмет '${itemDef ? itemDef.name : itemId}' не является употребляемым.`, "event-neutral");
            return;
        }

        let consumed = false;
        if (itemDef.type === "food" && typeof itemDef.effect.hunger === 'number') {
            gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + itemDef.effect.hunger);
            if (typeof game !== 'undefined' && game.log) game.log(`Вы съели: ${itemDef.name}. Сытость +${itemDef.effect.hunger}.`, "event-positive");
            consumed = true;
        } else if ((itemDef.type === "water" || itemDef.type === "water_source") && typeof itemDef.effect.thirst === 'number') {
            if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance) {
                if (typeof game !== 'undefined' && game.log) game.log(`Вы выпили ${itemDef.name}, но почувствовали себя хуже. Возможно, отравление.`, "event-negative");
                gameState.player.condition = "Подташнивает"; 
            } else {
                gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + itemDef.effect.thirst);
                if (typeof game !== 'undefined' && game.log) game.log(`Вы выпили: ${itemDef.name}. Жажда утолена на +${itemDef.effect.thirst}.`, "event-positive");
            }
            consumed = true;
        } else if (itemDef.type === "medicine" && typeof itemDef.effect.healing === 'number') {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + itemDef.effect.healing);
            if (typeof game !== 'undefined' && game.log) game.log(`Вы использовали ${itemDef.name}. Здоровье +${itemDef.effect.healing}.`, "event-positive");
            consumed = true;
        } // Добавить другие типы потребляемых предметов, если нужно

        if (consumed) {
            this.removeItemFromInventory(targetInventory, itemId, 1, inventoryItemIndex);
        }
        if (typeof UIManager !== 'undefined') {
            UIManager.updatePlayerStatus(); 
            // UIManager.updateDisplay(); // removeItemFromInventory уже вызовет updateDisplay, если нужно
        }
    },

    consumeResourceFromBase: function(resourceType, amountNeeded) { /* ... без изменений ... */ },

    // НОВАЯ ФУНКЦИЯ СОРТИРОВКИ
    sortInventory: function(targetInventory, sortBy = 'name') {
        if (!targetInventory || !Array.isArray(targetInventory) || typeof ITEM_DEFINITIONS === 'undefined') return;
        this.logCheat = this.logCheat || ((msg) => console.warn(`CHEAT: ${msg}`)); // Заглушка, если Cheats не загружен

        this.logCheat(`Сортировка инвентаря по: ${sortBy}`);

        targetInventory.sort((a, b) => {
            const itemDefA = ITEM_DEFINITIONS[a.itemId];
            const itemDefB = ITEM_DEFINITIONS[b.itemId];

            if (!itemDefA || !itemDefB) return 0; // Если нет определения, не двигаем

            switch (sortBy) {
                case 'type':
                    const typeComparison = (itemDefA.type || '').localeCompare(itemDefB.type || '');
                    if (typeComparison !== 0) return typeComparison;
                    return (itemDefA.name || '').localeCompare(itemDefB.name || ''); // Вторичная по имени
                case 'quantity':
                    const quantityComparison = b.quantity - a.quantity; // От большего к меньшему
                    if (quantityComparison !== 0) return quantityComparison;
                    return (itemDefA.name || '').localeCompare(itemDefB.name || '');
                case 'weight': // Сортируем по общему весу стака
                    const weightA = (itemDefA.weight || 0) * a.quantity;
                    const weightB = (itemDefB.weight || 0) * b.quantity;
                    const weightComparison = weightA - weightB; // От меньшего к большему
                    if (weightComparison !== 0) return weightComparison;
                    return (itemDefA.name || '').localeCompare(itemDefB.name || '');
                case 'name':
                default:
                    return (itemDefA.name || '').localeCompare(itemDefB.name || '');
            }
        });

        if (targetInventory === gameState.inventory) {
            this.renderPlayerInventoryIfActive();
        } else if (targetInventory === gameState.baseInventory) {
            this.renderBaseInventoryIfActive();
        }
    }
};
