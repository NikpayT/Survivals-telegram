// inventory_manager.js

// Предполагается, что gameState, domElements, ITEM_DEFINITIONS, UIManager, game (для game.log, game.updateDisplay)
// доступны глобально.

const InventoryManager = {
    addItemToInventory: function(targetInventory, itemId, quantity = 1) {
        if (!ITEM_DEFINITIONS[itemId]) {
            console.error(`Попытка добавить несуществующий предмет: ${itemId}`);
            return false;
        }
        const itemDef = ITEM_DEFINITIONS[itemId];
        
        if (targetInventory === gameState.inventory && 
            (gameState.player.carryWeight + (itemDef.weight * quantity) > gameState.player.maxCarryWeight)) {
            game.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${quantity}).`, "event-warning");
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
        }
        
        // game.updateDisplay(); // Обновление дисплея будет вызываться из основной логики или UIManager
        return true; 
    },

    removeItemFromInventory: function(targetInventory, itemId, quantity = 1, specificIndex = -1) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) return false;

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
            }
            // game.updateDisplay(); // Обновление дисплея будет вызываться из основной логики или UIManager
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

    openInventoryModal: function() { // UI функция, возможно, лучше в UIManager, но пока здесь для группировки
        domElements.inventoryModal.style.display = 'block';
        this.filterPlayerInventory('all'); 
    },
    closeInventoryModal: function() { // UI функция
        domElements.inventoryModal.style.display = 'none';
    },
    filterPlayerInventory: function(filterType) { // UI функция
        if (domElements.inventoryFilters) {
            domElements.inventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            const activeButton = domElements.inventoryFilters.querySelector(`button[data-filter="${filterType}"]`);
            if (activeButton) activeButton.classList.add('active');
        }
        UIManager.renderPlayerInventory(filterType); // Вызываем рендер из UIManager
    },
    filterBaseInventory: function(filterType) { // UI функция
        if (domElements.baseInventoryFilters) {
            domElements.baseInventoryFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            const activeButton = domElements.baseInventoryFilters.querySelector(`button[data-filter="${filterType}"]`);
            if (activeButton) activeButton.classList.add('active');
        }
        UIManager.renderBaseInventory(filterType); // Вызываем рендер из UIManager
    },

    transferItem: function(itemId, itemIndexInSource, sourceInventory, destinationInventory, quantity) {
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef) return;

        if (!Array.isArray(sourceInventory) || !Array.isArray(destinationInventory)) {
            console.error("Ошибка: инвентарь источника или назначения не является массивом.", sourceInventory, destinationInventory);
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
                game.log(`Недостаточно места в личном инвентаре для ${itemDef.name} (x${actualQuantity}).`, "event-warning");
                return;
            }
        }
        
        // Используем уже существующие addItemToInventory и removeItemFromInventory из этого же менеджера
        this.addItemToInventory(destinationInventory, itemId, actualQuantity); 
        this.removeItemFromInventory(sourceInventory, itemId, actualQuantity, itemIndexInSource); 

        game.log(`Перемещено: ${itemDef.name} (x${actualQuantity}) ${sourceInventory === gameState.inventory ? 'на склад' : 'в личный инвентарь'}.`, "event-neutral");

        // Обновление UI через UIManager
        if (domElements.inventoryModal.style.display === 'block') {
            if (sourceInventory === gameState.inventory || destinationInventory === gameState.inventory) {
                 UIManager.renderPlayerInventory(domElements.inventoryFilters.querySelector('button.active')?.dataset.filter || 'all');
            }
        }
        if (document.getElementById('storage-tab')?.style.display === 'block') { 
            UIManager.renderBaseInventory(domElements.baseInventoryFilters?.querySelector('button.active')?.dataset.filter || 'all');
        }
        UIManager.updateDisplay(); // Общий апдейт для статистики и т.д. в UIManager
    },

    consumeItem: function(itemId, inventoryItemIndex, targetInventory = gameState.inventory) { 
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (!itemDef || !itemDef.effect) {
            game.log(`Предмет '${itemDef.name}' не является употребляемым.`, "event-neutral");
            return;
        }

        let consumed = false;
        if (itemDef.type === "food" && itemDef.effect.hunger) {
            gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + itemDef.effect.hunger);
            game.log(`Вы съели: ${itemDef.name}. Сытость игрока +${itemDef.effect.hunger}.`, "event-positive");
            consumed = true;
        } else if ((itemDef.type === "water" || itemDef.type === "water_source") && itemDef.effect.thirst) {
            if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance) {
                game.log(`Вы выпили ${itemDef.name}, но почувствовали себя хуже. Возможно, отравление.`, "event-negative");
                gameState.player.condition = "Подташнивает"; 
            } else {
                gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + itemDef.effect.thirst);
                game.log(`Вы выпили: ${itemDef.name}. Жажда игрока утолена на +${itemDef.effect.thirst}.`, "event-positive");
            }
            consumed = true;
        } else if (itemDef.type === "medicine" && itemDef.effect.healing) {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + itemDef.effect.healing);
            game.log(`Вы использовали ${itemDef.name}. Здоровье игрока +${itemDef.effect.healing}.`, "event-positive");
            consumed = true;
        }

        if (consumed) {
            this.removeItemFromInventory(targetInventory, itemId, 1, inventoryItemIndex); 
        }
        UIManager.updateDisplay(); // Обновление через UIManager
    },

    consumeResourceFromBase: function(resourceType, amountNeeded) {
        let amountFulfilled = 0;
        const inventory = gameState.baseInventory;
        
        inventory.sort((aSlot, bSlot) => {
            const aDef = ITEM_DEFINITIONS[aSlot.itemId];
            const bDef = ITEM_DEFINITIONS[bSlot.itemId];
            let aValue = 0; let bValue = 0;

            if (resourceType === 'food') {
                aValue = (aDef.effect?.hunger || 0) * (aDef.effect?.sickness_chance || aDef.effect?.radiation ? 0.5 : 1);
                bValue = (bDef.effect?.hunger || 0) * (bDef.effect?.sickness_chance || bDef.effect?.radiation ? 0.5 : 1);
            } else if (resourceType === 'water') {
                aValue = (aDef.effect?.thirst || 0) * (aDef.effect?.sickness_chance ? 0.5 : 1);
                bValue = (bDef.effect?.thirst || 0) * (bDef.effect?.sickness_chance ? 0.5 : 1);
            }
            return aValue - bValue; 
        });

        for (let i = 0; i < inventory.length && amountFulfilled < amountNeeded; ) { 
            const slot = inventory[i]; 
            if (!slot) { i++; continue; } 

            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            let itemValue = 0;
            let isCorrectType = false;

            if (resourceType === 'food' && itemDef.type === 'food' && itemDef.effect?.hunger) {
                itemValue = itemDef.effect.hunger;
                isCorrectType = true;
                if (itemDef.effect?.radiation && Math.random() < 0.1 * gameState.survivors) { 
                    game.log(`Кто-то получил дозу радиации от ${itemDef.name}.`, "event-warning");
                }
            } else if (resourceType === 'water' && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect?.thirst) {
                itemValue = itemDef.effect.thirst;
                isCorrectType = true;
                 if (itemDef.effect.sickness_chance && Math.random() < itemDef.effect.sickness_chance * gameState.survivors * 0.05) { 
                    game.log(`Кто-то из выживших заболел, выпив ${itemDef.name} со склада.`, "event-warning");
                }
            }

            if (isCorrectType && itemValue > 0) {
                const neededFromThisSlot = Math.ceil((amountNeeded - amountFulfilled) / itemValue);
                const canConsumeFromSlot = Math.min(slot.quantity, neededFromThisSlot);
                
                amountFulfilled += canConsumeFromSlot * itemValue;
                
                const originalLength = inventory.length;
                const originalItemId = slot.itemId; 
                this.removeItemFromInventory(gameState.baseInventory, slot.itemId, canConsumeFromSlot, i);
                
                if (inventory.length < originalLength || (inventory[i] && inventory[i].itemId !== originalItemId)) {
                } else {
                    i++;
                }
            } else {
                 i++; 
            }
        }
        return Math.min(amountFulfilled, amountNeeded); 
    }
};
