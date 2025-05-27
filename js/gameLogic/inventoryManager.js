// js/gameLogic/inventoryManager.js

class InventoryManager {
    constructor() {
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('InventoryManager инициализирован.');
        } else {
            console.log('InventoryManager инициализирован (UI Manager недоступен).');
        }
        // Ссылки на DOM-элементы для инвентаря
        this.playerInventoryList = document.getElementById('player-inventory-list');
        this.communityStorageList = document.getElementById('community-storage-list');
    }

    // Добавление предмета в инвентарь игрока
    addItemToPlayer(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.uiManager.addGameLog(`Ошибка: Предмет с ID "${itemId}" не найден.`);
            return false;
        }
        // Предполагаем, что у player есть метод addItem
        if (window.gameState.player && typeof window.gameState.player.addItem === 'function') {
            window.gameState.player.addItem(itemId, quantity);
            window.uiManager.addGameLog(`Вы получили ${quantity} ${itemData.name}.`);
            this.displayPlayerInventory(); // Обновляем UI
            return true;
        } else {
            window.uiManager.addGameLog(`Ошибка: Игрок не инициализирован или не имеет метода addItem.`);
            return false;
        }
    }

    // Добавление предмета на склад общины
    addItemToCommunity(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.uiManager.addGameLog(`Ошибка: Предмет с ID "${itemId}" не найден.`);
            return false;
        }
        // Предполагаем, что у community есть метод addResourceOrItem
        if (window.gameState.community && typeof window.gameState.community.addResourceOrItem === 'function') {
            window.gameState.community.addResourceOrItem(itemId, quantity);
            window.uiManager.addGameLog(`Община получила ${quantity} ${itemData.name}.`);
            this.displayCommunityStorage(); // Обновляем UI
            return true;
        } else {
            window.uiManager.addGameLog(`Ошибка: Община не инициализирована или не имеет метода addResourceOrItem.`);
            return false;
        }
    }

    // Удаление предмета из инвентаря игрока
    removeItemFromPlayer(itemId, quantity = 1) {
        if (window.gameState.player && typeof window.gameState.player.removeItem === 'function') {
            const success = window.gameState.player.removeItem(itemId, quantity);
            if (success) {
                window.uiManager.addGameLog(`Вы использовали ${quantity} ${GameItems[itemId].name}.`);
                this.displayPlayerInventory(); // Обновляем UI
            } else {
                window.uiManager.addGameLog(`Недостаточно ${GameItems[itemId].name} в вашем инвентаре.`);
            }
            return success;
        }
        return false;
    }

    // Удаление предмета со склада общины
    removeItemFromCommunity(itemId, quantity = 1) {
        if (window.gameState.community && typeof window.gameState.community.removeResourceOrItem === 'function') {
            const success = window.gameState.community.removeResourceOrItem(itemId, quantity);
            if (success) {
                window.uiManager.addGameLog(`Община использовала ${quantity} ${GameItems[itemId].name}.`);
                this.displayCommunityStorage(); // Обновляем UI
            } else {
                window.uiManager.addGameLog(`Недостаточно ${GameItems[itemId].name} на складе общины.`);
            }
            return success;
        }
        return false;
    }

    // Метод для отображения инвентаря игрока в UI
    displayPlayerInventory() {
        if (!this.playerInventoryList || !window.gameState.player) {
            console.warn("InventoryManager: Элемент инвентаря игрока или данные игрока не найдены.");
            return;
        }
        this.playerInventoryList.innerHTML = '';
        const playerInventory = window.gameState.player.inventory;
        if (Object.keys(playerInventory).length === 0) {
            this.playerInventoryList.innerHTML = '<p>Ваш инвентарь пуст.</p>';
            return;
        }
        for (const itemId in playerInventory) {
            const quantity = playerInventory[itemId];
            const itemData = GameItems[itemId];
            if (itemData) {
                const li = document.createElement('div');
                li.classList.add('item-entry');
                li.innerHTML = `<span>${itemData.name}</span><span class="item-quantity">x${quantity}</span>`;
                this.playerInventoryList.appendChild(li);
            }
        }
    }

    // Метод для отображения склада общины в UI
    displayCommunityStorage() {
        if (!this.communityStorageList || !window.gameState.community) {
            console.warn("InventoryManager: Элемент склада общины или данные общины не найдены.");
            return;
        }
        this.communityStorageList.innerHTML = '';
        const communityStorage = window.gameState.community.storage; // Предполагаем, что у community есть свойство 'storage'
        if (Object.keys(communityStorage).length === 0) {
            this.communityStorageList.innerHTML = '<p>Склад общины пуст.</p>';
            return;
        }
        for (const itemId in communityStorage) {
            const quantity = communityStorage[itemId];
            const itemData = GameItems[itemId];
            if (itemData) {
                const li = document.createElement('div');
                li.classList.add('item-entry');
                li.innerHTML = `<span>${itemData.name}</span><span class="item-quantity">x${quantity}</span>`;
                this.communityStorageList.appendChild(li);
            }
        }
    }
}
