// /js/gameLogic/inventoryManager.js
// Функции для управления инвентарем игрока и складом общины

const InventoryManager = {

    // Вспомогательная функция для определения типа ресурса склада по itemId
    _getResourceTypeFromItemId(itemId) {
        const item = GameItems[itemId];
        if (!item) return null;

        switch (item.type) {
            case 'consumable':
                if (item.id === 'canned_food') return 'food';
                if (item.id === 'water_bottle') return 'water';
                if (item.id === 'medkit_basic' || item.id === 'bandages') return 'medical_supplies';
                break;
            case 'material':
                if (item.id === 'scraps_metal') return 'materials_metal';
                if (item.id === 'scraps_wood') return 'materials_wood';
                if (item.id === 'fuel_can') return 'fuel';
                break;
            case 'ammo':
                return 'ammunition'; // Все патроны идут в "ammunition"
            // Добавьте другие типы, если они будут храниться на складе
        }
        return null;
    },

    /**
     * Перемещает предмет между инвентарем игрока и складом общины.
     * @param {string} itemId - ID предмета.
     * @param {number} quantity - Количество.
     * @param {'player' | 'community'} from - Откуда перемещать.
     * @param {'player' | 'community'} to - Куда перемещать.
     * @returns {boolean} - true, если перемещение успешно, false иначе.
     */
    transferItem(itemId, quantity, from, to) {
        if (quantity <= 0) {
            window.addGameLog('[ПРЕДУПРЕЖДЕНИЕ] Количество для перемещения должно быть больше 0.');
            return false;
        }

        const item = GameItems[itemId];
        if (!item) {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Предмет с ID ${itemId} не найден.`);
            return false;
        }

        let sourceHasItem = false;
        let sourceRemoveFunc;
        let destinationAddFunc;

        // Определяем, откуда берем
        if (from === 'player') {
            sourceHasItem = window.gameState.player.hasItem(itemId, quantity);
            sourceRemoveFunc = (id, qty) => window.gameState.player.removeItem(id, qty);
        } else if (from === 'community') {
            const resourceType = this._getResourceTypeFromItemId(itemId);
            if (!resourceType) {
                window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Предмет "${item.name}" не может быть взят со склада общины (не соответствует типу ресурса).`);
                return false;
            }
            sourceHasItem = window.gameState.community.hasResource(resourceType, quantity);
            sourceRemoveFunc = (id, qty) => window.gameState.community.removeResource(resourceType, qty);
        } else {
            window.addGameLog('[ПРЕДУПРЕЖДЕНИЕ] Неверный источник для перемещения.');
            return false;
        }

        if (!sourceHasItem) {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Недостаточно ${item.name} у источника (${from}).`);
            return false;
        }

        // Определяем, куда кладем
        if (to === 'player') {
            destinationAddFunc = (id, qty) => window.gameState.player.addItem(id, qty);
        } else if (to === 'community') {
            const resourceType = this._getResourceTypeFromItemId(itemId);
            if (!resourceType) {
                window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Предмет "${item.name}" не может быть помещен на склад общины (не соответствует типу ресурса).`);
                return false;
            }
            destinationAddFunc = (id, qty) => window.gameState.community.addResource(resourceType, qty);
        } else {
            window.addGameLog('[ПРЕДУПРЕЖДЕНИЕ] Неверное назначение для перемещения.');
            return false;
        }

        // Выполняем перемещение
        if (sourceRemoveFunc(itemId, quantity)) { // Удаляем из источника
            destinationAddFunc(itemId, quantity); // Добавляем в назначение
            window.addGameLog(`Перемещено ${item.name} x${quantity} из ${from} в ${to}.`);
            window.uiManager.updatePlayerInventory(); // Обновляем UI
            window.uiManager.updateCommunityStorage(); // Обновляем UI
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
        // Более читабельные названия для ресурсов склада
        const resourceDisplayNames = {
            food: 'Еда',
            water: 'Вода',
            materials_metal: 'Металлический лом',
            materials_wood: 'Деревянные обломки',
            medical_supplies: 'Медикаменты',
            ammunition: 'Боеприпасы',
            fuel: 'Топливо'
        };

        for (const resourceType in window.gameState.community.resources) {
            const quantity = window.gameState.community.resources[resourceType];
            const displayName = resourceDisplayNames[resourceType] || resourceType;
            detailedList.push({
                type: resourceType,
                name: displayName,
                quantity: quantity
            });
        }
        return detailedList;
    },

    /**
     * Проверяет наличие необходимых ресурсов на складе общины.
     * @param {Array<Object>} resourceCosts - Массив объектов { id: itemId, qty: number }.
     * @returns {boolean} - true, если все ресурсы есть, false иначе.
     */
    checkCommunityResources(resourceCosts) {
        const community = window.gameState.community;
        for (const cost of resourceCosts) {
            const resourceType = this._getResourceTypeFromItemId(cost.id);
            if (!resourceType || !community.hasResource(resourceType, cost.qty)) {
                return false;
            }
        }
        return true;
    },

    /**
     * Удаляет необходимые ресурсы со склада общины.
     * @param {Array<Object>} resourceCosts - Массив объектов { id: itemId, qty: number }.
     * @returns {boolean} - true, если все ресурсы удалены, false иначе.
     */
    removeCommunityResources(resourceCosts) {
        const community = window.gameState.community;
        // Сначала убедимся, что все ресурсы есть
        if (!this.checkCommunityResources(resourceCosts)) {
            window.addGameLog('[ПРЕДУПРЕЖДЕНИЕ] Недостаточно ресурсов на складе общины для выполнения действия.');
            return false;
        }
        // Затем удаляем
        for (const cost of resourceCosts) {
            const resourceType = this._getResourceTypeFromItemId(cost.id);
            if (!community.removeResource(resourceType, cost.qty)) {
                // Это не должно произойти, если checkCommunityResources был успешным,
                // но на всякий случай
                window.addGameLog(`[ОШИБКА] Не удалось удалить ${cost.qty} ${cost.id} со склада.`);
                return false;
            }
        }
        return true;
    }
};
