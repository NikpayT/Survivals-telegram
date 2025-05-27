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

        // Проверка, что элементы найдены
        if (!this.playerInventoryList) console.warn("InventoryManager: Элемент #player-inventory-list не найден.");
        if (!this.communityStorageList) console.warn("InventoryManager: Элемент #community-storage-list не найден.");
    }

    // Добавление предмета в инвентарь игрока
    addItemToPlayer(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.addGameLog(`Ошибка: Предмет с ID "${itemId}" не найден.`);
            return false;
        }
        if (window.gameState.player && typeof window.gameState.player.addItem === 'function') {
            return window.gameState.player.addItem(itemId, quantity); // Player.addItem уже логирует и обновляет UI
        } else {
            window.addGameLog(`Ошибка: Игрок не инициализирован или не имеет метода addItem.`);
            return false;
        }
    }

    // Добавление предмета на склад общины
    addItemToCommunity(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.addGameLog(`Ошибка: Предмет с ID "${itemId}" не найден.`);
            return false;
        }
        if (window.gameState.community && typeof window.gameState.community.addResourceOrItem === 'function') {
            return window.gameState.community.addResourceOrItem(itemId, quantity); // Community.addResourceOrItem уже логирует и обновляет UI
        } else {
            window.addGameLog(`Ошибка: Община не инициализирована или не имеет метода addResourceOrItem.`);
            return false;
        }
    }

    // Удаление предмета из инвентаря игрока
    removeItemFromPlayer(itemId, quantity = 1) {
        if (window.gameState.player && typeof window.gameState.player.removeItem === 'function') {
            return window.gameState.player.removeItem(itemId, quantity); // Player.removeItem уже логирует и обновляет UI
        }
        return false;
    }

    // Удаление предмета со склада общины
    removeItemFromCommunity(itemId, quantity = 1) {
        if (window.gameState.community && typeof window.gameState.community.removeResourceOrItem === 'function') {
            return window.gameState.community.removeResourceOrItem(itemId, quantity); // Community.removeResourceOrItem уже логирует и обновляет UI
        }
        return false;
    }

    // Метод для отображения инвентаря игрока в UI
    displayPlayerInventory() {
        if (!this.playerInventoryList || !window.gameState.player) {
            console.warn("InventoryManager: Элемент инвентаря игрока или данные игрока не найдены.");
            return;
        }
        this.playerInventoryList.innerHTML = ''; // Очищаем список
        const playerInventory = window.gameState.player.inventory;
        if (Object.keys(playerInventory).length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Ваш инвентарь пуст.';
            this.playerInventoryList.appendChild(li);
            return;
        }
        for (const itemId in playerInventory) {
            const quantity = playerInventory[itemId];
            const itemData = GameItems[itemId];
            if (itemData) {
                const li = document.createElement('li');
                li.classList.add('item-entry');
                li.innerHTML = `<span>${itemData.name}</span><span class="item-quantity">x${quantity}</span>`;
                this.playerInventoryList.appendChild(li);
            } else {
                console.warn(`InventoryManager: Неизвестный предмет в инвентаре игрока: ${itemId}`);
            }
        }
    }

    // Метод для отображения склада общины в UI
    displayCommunityStorage() {
        if (!this.communityStorageList || !window.gameState.community) {
            console.warn("InventoryManager: Элемент склада общины или данные общины не найдены.");
            return;
        }
        this.communityStorageList.innerHTML = ''; // Очищаем список
        const communityStorage = window.gameState.community.storage; 
        const communityResources = window.gameState.community.resources;

        // Сначала отобразим ресурсы общины
        const resourceLi = document.createElement('li');
        resourceLi.classList.add('item-entry');
        resourceLi.innerHTML = `<span>Еда</span><span class="item-quantity">x${communityResources.food}</span>`;
        this.communityStorageList.appendChild(resourceLi);
        const resourceLi2 = document.createElement('li');
        resourceLi2.classList.add('item-entry');
        resourceLi2.innerHTML = `<span>Вода</span><span class="item-quantity">x${communityResources.water}</span>`;
        this.communityStorageList.appendChild(resourceLi2);
        const resourceLi3 = document.createElement('li');
        resourceLi3.classList.add('item-entry');
        resourceLi3.innerHTML = `<span>Материалы</span><span class="item-quantity">x${communityResources.materials}</span>`;
        this.communityStorageList.appendChild(resourceLi3);
        const resourceLi4 = document.createElement('li');
        resourceLi4.classList.add('item-entry');
        resourceLi4.innerHTML = `<span>Медикаменты</span><span class="item-quantity">x${communityResources.medicine}</span>`;
        this.communityStorageList.appendChild(resourceLi4);

        // Затем отобразим обычные предметы
        if (Object.keys(communityStorage).length === 0 && 
            communityResources.food === 0 && communityResources.water === 0 && 
            communityResources.materials === 0 && communityResources.medicine === 0) 
        {
            const li = document.createElement('li');
            li.textContent = 'Склад общины пуст.';
            this.communityStorageList.appendChild(li);
            return;
        }

        for (const itemId in communityStorage) {
            const quantity = communityStorage[itemId];
            const itemData = GameItems[itemId];
            if (itemData) {
                const li = document.createElement('li');
                li.classList.add('item-entry');
                li.innerHTML = `<span>${itemData.name}</span><span class="item-quantity">x${quantity}</span>`;
                this.communityStorageList.appendChild(li);
            } else {
                console.warn(`InventoryManager: Неизвестный предмет на складе общины: ${itemId}`);
            }
        }
    }
}

// Делаем InventoryManager доступным глобально, чтобы main.js мог его инициализировать
// window.inventoryManager = new InventoryManager(); // Это будет делаться в main.js
