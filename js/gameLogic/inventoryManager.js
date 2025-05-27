// /js/gameLogic/inventoryManager.js
// Функции для управления инвентарем игрока и складом общины

const InventoryManager = {

    /**
     * Перемещает предмет между инвентарем игрока и складом общины.
     * @param {string} itemId - ID предмета.
     * @param {number} quantity - Количество.
     * @param {string} from - 'player' или 'community'.
     * @param {string} to - 'player' или 'community'.
     * @returns {boolean} - true, если перемещение успешно, false иначе.
     */
    transferItem(itemId, quantity, from, to) {
        if (quantity <= 0) return false;

        const item = GameItems[itemId];
        if (!item) {
            console.warn(`Предмет с ID ${itemId} не найден.`);
            return false;
        }

        let source, destination;
        let sourceRemoveFunc, destinationAddFunc;

        // Определяем источник
        if (from === 'player') {
            source = window.gameState.player.inventory;
            sourceRemoveFunc = (id, qty) => window.gameState.player.removeItem(id, qty);
        } else if (from === 'community') {
            // Для ресурсов общины используем специфичные типы, например 'food', 'water'
            // Нужно будет сопоставить itemId с resourceType
            const resourceMap = {
                'canned_food': 'food',
                'water_bottle': 'water',
                'scraps_metal': 'materials_metal',
                'scraps_wood': 'materials_wood',
                'medkit_basic': 'medical_supplies',
                'bandages': 'medical_supplies',
                'pistol_ammo': 'ammunition',
                'fuel_can': 'fuel'
                // Добавьте больше сопоставлений по мере необходимости
            };
            const resourceType = resourceMap[itemId];
            if (!resourceType) {
                console.warn(`Предмет ${itemId} не может быть передан на склад общины.`);
                return false;
            }
            source = window.gameState.community.resources;
            sourceRemoveFunc = (id, qty) => window.gameState.community.removeResource(resourceType, qty);
        } else {
            console.warn('Неверный источник для перемещения.');
            return false;
        }

        // Определяем назначение
        if (to === 'player') {
            destination = window.gameState.player.inventory;
            destinationAddFunc = (id, qty) => window.gameState.player.addItem(id, qty);
        } else if (to === 'community') {
            const resourceMap = {
                'canned_food': 'food',
                'water_bottle': 'water',
                'scraps_metal': 'materials_metal',
                'scraps_wood': 'materials_wood',
                'medkit_basic': 'medical_supplies',
                'bandages': 'medical_supplies',
                'pistol_ammo': 'ammunition',
                'fuel_can': 'fuel'
            };
            const resourceType = resourceMap[itemId];
            if (!resourceType) {
                console.warn(`Предмет ${itemId} не может быть принят складом общины.`);
                return false;
            }
            destination = window.gameState.community.resources;
            destinationAddFunc = (id, qty) => window.gameState.community.addResource(resourceType, qty);
        } else {
            console.warn('Неверное назначение для перемещения.');
            return false;
        }

        // Проверяем, есть ли достаточно предметов у источника
        if (from === 'player' && !window.gameState.player.hasItem(itemId, quantity)) {
            console.warn(`Недостаточно ${item.name} в инвентаре игрока.`);
            return false;
        } else if (from === 'community') {
            const resourceType = resourceMap[itemId];
            if (!window.gameState.community.hasResource(resourceType, quantity)) {
                console.warn(`Недостаточно ${item.name} на складе общины.`);
                return false;
            }
        }


        // Выполняем перемещение
        if (sourceRemoveFunc(itemId, quantity)) { // Удаляем из источника
            destinationAddFunc(itemId, quantity); // Добавляем в назначение
            console.log(`Перемещено ${item.name} x${quantity} из ${from} в ${to}.`);
            window.uiManager.updatePlayerInventory(); // Обновляем UI
            window.uiManager.updateCommunityStatus(); // Обновляем UI
            return true;
        }
        return false;
    },

    /**
     * Получает список предметов в инвентаре или на складе с их деталями.
     * @param {Object} inventoryData - Объект инвентаря ({ itemId: quantity }).
     * @returns {Array<Object>} - Массив объектов { item: GameItemObject, quantity: number }.
     */
    getDetailedInventory(inventoryData) {
        const detailedList = [];
        for (const itemId in inventoryData) {
            const quantity = inventoryData[itemId];
            if (quantity > 0 && GameItems[itemId]) {
                detailedList.push({
                    item: GameItems[itemId],
                    quantity: quantity
                });
            }
        }
        return detailedList;
    },

    /**
     * Получает список ресурсов на складе общины с их деталями.
     * @returns {Array<Object>} - Массив объектов { resourceType: string, quantity: number }.
     */
    getDetailedCommunityResources() {
        const detailedList = [];
        for (const resourceType in window.gameState.community.resources) {
            const quantity = window.gameState.community.resources[resourceType];
            // Здесь можно добавить более красивые названия ресурсов
            const displayName = resourceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // "materials_metal" -> "Materials Metal"
            detailedList.push({
                type: resourceType,
                name: displayName,
                quantity: quantity
            });
        }
        return detailedList;
    }
};
