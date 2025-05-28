// inventory_manager.js

// Предполагается, что gameState, domElements, ITEM_DEFINITIONS, UIManager, game
// доступны глобально.

// НОВЫЙ ОБЪЕКТ: Смайлики для типов предметов
const ITEM_TYPE_EMOJIS = {
    food: "🍎",
    water: "💧",
    water_source: "💧",
    medicine: "💊",
    material: "🧱",
    tool: "🛠️",
    weapon: "⚔️",
    armor: "🛡️",
    quest_item: "📜",
    ammo: "💣",
    junk: "🔩", // Для всякого хлама
    key: "🔑",  // Для ключей
    clothing: "👕",
    book: "📕",
    note: "📝",
    default: "📦" // Для неизвестных или общих типов
};


const InventoryManager = {
    addItemToInventory: function(targetInventory, itemId, quantity = 1) {
        if (typeof ITEM_DEFINITIONS === 'undefined' || !ITEM_DEFINITIONS[itemId]) { // ИСПРАВЛЕНО: Проверка существования ITEM_DEFINITIONS перед доступом
            console.error(`Попытка добавить несуществующий предмет: ${itemId}`);
            if (typeof game !== 'undefined' && game.log) game.log(`Системная ошибка: Попытка добавить несуществующий предмет ${itemId}. Проверьте определения локаций/событий.`, "event-negative");
            return false;
        }
        const itemDef = ITEM_DEFINITIONS[itemId];

        if (targetInventory === gameState.inventory) { 
            if ((gameState.player.carryWeight + (itemDef.weight * quantity) > gameState.player.maxCarryWeight)) {
                if (typeof game !== 'undefined' && game.log) game.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
                return false;
            }
        } else if (targetInventory === gameState.baseInventory) { 
            const usage = GameStateGetters.getBaseInventoryUsage();
            const isNewItemForBase = !targetInventory.some(slot => slot.itemId === itemId && itemDef.stackable);
            if (isNewItemForBase && usage.current >= usage.max) {
                 if (typeof game !== 'undefined' && game.log) game.log(`Склад базы заполнен! Невозможно добавить новый тип предмета: ${itemDef.name}.`, "event-warning");
                return false;
            }
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
             if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); 
        }
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
                if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); 
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
                itemActionsHTML += `<button onclick="InventoryManager.consumeItem('${itemSlot.itemId}', ${index})">Исп.</button>`;
            }
            itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'player', 'base', 1)">На склад (1)</button>`;
            if (itemSlot.quantity > 1) {
                 itemActionsHTML += `<button onclick="InventoryManager.transferItem('${itemSlot.itemId}', ${index}, 'player', 'base', ${itemSlot.quantity})">На склад (Все)</button>`;
            }
            
            const emoji = ITEM_TYPE_EMOJIS[itemDef.type] || ITEM_TYPE_EMOJIS.default; // Получаем смайлик

            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4><span class="item-emoji">${emoji}</span> ${itemDef.name} <span class="item-quantity">(x${itemSlot.quantity})</span></h4>
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

            const emoji = ITEM_TYPE_EMOJIS[itemDef.type] || ITEM_TYPE_EMOJIS.default; // Получаем смайлик

            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4><span class="item-emoji">${emoji}</span> ${itemDef.name} <span class="item-quantity">(x${itemSlot.quantity})</span></h4>
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
        if (typeof ITEM_DEFINITIONS === 'undefined') {
            console.error("ITEM_DEFINITIONS не определены в transferItem");
            return;
        }
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

        let itemRemovedSuccessfully = this.removeItemFromInventory(sourceInventory, itemId, actualQuantity, itemIndexInSource);
        if (itemRemovedSuccessfully) {
            let itemAddedSuccessfully = this.addItemToInventory(destinationInventory, itemId, actualQuantity);
            if (!itemAddedSuccessfully) {
                this.addItemToInventory(sourceInventory, itemId, actualQuantity); // Откат
                if (typeof game !== 'undefined' && game.log) game.log(`Ошибка при добавлении ${itemDef.name} в назначение. Операция отменена.`, "event-negative");
                // Перерисовка инвентарей после отката
                if (sourceInventory === gameState.inventory) this.renderPlayerInventoryIfActive();
                else if (sourceInventory === gameState.baseInventory) this.renderBaseInventoryIfActive();
                return;
            }
            if (typeof game !== 'undefined' && game.log) game.log(`Перемещено: ${itemDef.name} (x${actualQuantity}) ${sourceInventoryType === 'player' ? 'на склад' : 'в личный инвентарь'}.`, "event-neutral");
        } else {
            if (typeof game !== 'undefined' && game.log) game.log(`Ошибка при удалении ${itemDef.name} из источника.`, "event-negative");
            return;
        }
    },

    consumeItem: function(itemId, inventoryItemIndex) { 
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
        }

        if (consumed) {
            this.removeItemFromInventory(targetInventory, itemId, 1, inventoryItemIndex);
        }
        if (typeof UIManager !== 'undefined') {
            UIManager.updatePlayerStatus(); 
        }
    },

    consumeResourceFromBase: function(resourceType, amountNeeded) {
        let amountFulfilled = 0;
        if (!gameState.baseInventory || typeof ITEM_DEFINITIONS === 'undefined') return 0;
        const inventory = gameState.baseInventory;
        
        inventory.sort((aSlot, bSlot) => {
            const aDef = ITEM_DEFINITIONS[aSlot.itemId];
            const bDef = ITEM_DEFINITIONS[bSlot.itemId];
            let aValue = 0; let bValue = 0;

            if (!aDef || !bDef) return 0; // Если определения нет, не участвуем в сортировке

            if (resourceType === 'food') {
                aValue = (aDef.effect?.hunger || 0) * (aDef.effect?.sickness_chance || aDef.effect?.radiation ? 0.5 : 1);
                bValue = (bDef.effect?.hunger || 0) * (bDef.effect?.sickness_chance || bDef.effect?.radiation ? 0.5 : 1);
            } else if (resourceType === 'water') {
                aValue = (aDef.effect?.thirst || 0) * (aDef.effect?.sickness_chance ? 0.5 : 1);
                bValue = (bDef.effect?.thirst || 0) * (bDef.effect?.sickness_chance ? 0.5 : 1);
            }
            return aValue - bValue; 
        });

        for (let i = inventory.length - 1; i >= 0 && amountFulfilled < amountNeeded; i--) { 
            const slot = inventory[i]; 
            if (!slot) continue; 

            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (!itemDef) continue; // Пропускаем, если нет определения предмета

            let itemValue = 0;
            let isCorrectType = false;

            if (resourceType === 'food' && itemDef.type === 'food' && itemDef.effect?.hunger) {
                itemValue = itemDef.effect.hunger;
                isCorrectType = true;
                if (itemDef.effect?.radiation && Math.random() < 0.05 * gameState.survivors) { 
                    if (typeof game !== 'undefined' && game.log) game.log(`Кто-то получил дозу радиации от ${itemDef.name}.`, "event-warning");
                }
                 if (itemDef.effect?.sickness_chance && Math.random() < itemDef.effect.sickness_chance * 0.05 * gameState.survivors) { 
                    if (typeof game !== 'undefined' && game.log) game.log(`Кто-то из выживших почувствовал себя плохо от ${itemDef.name} со склада.`, "event-warning");
                }
            } else if (resourceType === 'water' && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect?.thirst) {
                itemValue = itemDef.effect.thirst;
                isCorrectType = true;
                 if (itemDef.effect?.sickness_chance && Math.random() < itemDef.effect.sickness_chance * 0.05 * gameState.survivors) { 
                    if (typeof game !== 'undefined' && game.log) game.log(`Кто-то из выживших заболел, выпив ${itemDef.name} со склада.`, "event-warning");
                }
            }

            if (isCorrectType && itemValue > 0) {
                const neededFromThisSlot = Math.ceil((amountNeeded - amountFulfilled) / itemValue);
                const canConsumeFromSlot = Math.min(slot.quantity, neededFromThisSlot);
                
                amountFulfilled += canConsumeFromSlot * itemValue;
                this.removeItemFromInventory(gameState.baseInventory, slot.itemId, canConsumeFromSlot, i); 
                // removeItemFromInventory уже вызовет renderBaseInventoryIfActive и UIManager.updateDisplay
            }
        }
        // if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Дополнительно, чтобы обновить общие счетчики в UI
        return Math.min(amountFulfilled, amountNeeded); 
    },

    sortInventory: function(targetInventory, sortBy = 'name') {
        if (!targetInventory || !Array.isArray(targetInventory) || typeof ITEM_DEFINITIONS === 'undefined') return;
        
        const logFunc = (typeof game !== 'undefined' && game.log) ? game.log : console.log;
        logFunc(`Сортировка инвентаря по: ${sortBy}`, "event-neutral");

        targetInventory.sort((a, b) => {
            const itemDefA = ITEM_DEFINITIONS[a.itemId];
            const itemDefB = ITEM_DEFINITIONS[b.itemId];

            if (!itemDefA && !itemDefB) return 0;
            if (!itemDefA) return 1; // Неопределенные предметы в конец
            if (!itemDefB) return -1; // Неопределенные предметы в конец

            switch (sortBy) {
                case 'type':
                    const typeA = itemDefA.type || 'zzzz'; // Неопределенные типы в конец
                    const typeB = itemDefB.type || 'zzzz';
                    const typeComparison = typeA.localeCompare(typeB);
                    if (typeComparison !== 0) return typeComparison;
                    return (itemDefA.name || '').localeCompare(itemDefB.name || ''); 
                case 'quantity':
                    const quantityComparison = b.quantity - a.quantity; 
                    if (quantityComparison !== 0) return quantityComparison;
                    return (itemDefA.name || '').localeCompare(itemDefB.name || '');
                case 'weight': 
                    const weightA = (itemDefA.weight || 0) * a.quantity;
                    const weightB = (itemDefB.weight || 0) * b.quantity;
                    const weightComparison = weightA - weightB; 
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
