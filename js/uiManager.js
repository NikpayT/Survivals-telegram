// js/uiManager.js

// Использование единого объекта для UIManager
// Это гарантирует, что у нас всегда будет один и тот же экземпляр
// и другие части кода могут обращаться к нему через window.uiManager
if (typeof window.uiManager === 'undefined') {
    window.uiManager = (function() {
        // Приватные переменные и методы
        let gameLogElement;
        let gameTextElement;
        let optionsContainer;
        let playerStatusElement;
        let communityStatusElement;
        let playerInventoryList;
        let communityStorageList;
        let craftingRecipesElement; // Добавлен для CraftingManager

        // Приватные методы для инициализации
        function initializeElements() {
            gameLogElement = document.getElementById('game-log');
            gameTextElement = document.getElementById('game-text');
            optionsContainer = document.getElementById('options-container');
            playerStatusElement = document.getElementById('player-status');
            communityStatusElement = document.getElementById('community-status');
            playerInventoryList = document.getElementById('player-inventory-list');
            communityStorageList = document.getElementById('community-storage-list');
            craftingRecipesElement = document.getElementById('crafting-recipes'); // Инициализация

            // Проверки на существование элементов
            if (!gameLogElement) console.warn("UIManager: Элемент #game-log не найден.");
            if (!gameTextElement) console.warn("UIManager: Элемент #game-text не найден.");
            if (!optionsContainer) console.warn("UIManager: Элемент #options-container не найден.");
            if (!playerStatusElement) console.warn("UIManager: Элемент #player-status не найден.");
            if (!communityStatusElement) console.warn("UIManager: Элемент #community-status не найден.");
            if (!playerInventoryList) console.warn("UIManager: Элемент #player-inventory-list не найден.");
            if (!communityStorageList) console.warn("UIManager: Элемент #community-storage-list не найден.");
            if (!craftingRecipesElement) console.warn("UIManager: Элемент #crafting-recipes не найден.");
        }

        // Публичные методы
        return {
            init: function() {
                console.log('UIManager: Инициализация...');
                initializeElements();
                console.log('UIManager: Инициализация завершена. Проверенные элементы:');
                console.log({ gameLogElement, gameTextElement, optionsContainer, playerStatusElement, communityStatusElement, playerInventoryList, communityStorageList, craftingRecipesElement });
                this.addGameLog('Система интерфейса инициализирована.');
            },

            // Обновляет текстовое описание игры
            displayGameText: function(text) {
                if (gameTextElement) {
                    gameTextElement.innerHTML = `<p>${text}</p>`;
                } else {
                    console.warn("displayGameText: Элемент #game-text не найден.");
                }
            },

            // Отображает доступные опции (кнопки)
            displayOptions: function(options) {
                if (optionsContainer) {
                    optionsContainer.innerHTML = ''; // Очищаем предыдущие опции
                    options.forEach(option => {
                        const button = document.createElement('button');
                        button.textContent = option.text;
                        button.classList.add('game-option-button');
                        button.addEventListener('click', () => {
                            // Отключаем все кнопки, чтобы предотвратить множественные клики
                            Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);
                            if (option.action && typeof option.action === 'function') {
                                option.action();
                            }
                        });
                        optionsContainer.appendChild(button);
                    });
                } else {
                    console.warn("displayOptions: Элемент #options-container не найден.");
                }
            },

            // Добавляет сообщение в игровой лог
            addGameLog: function(message) {
                // НОВОЕ: Проверка на isGameOver, чтобы не добавлять логи после смерти
                if (window.gameState && window.gameState.isGameOver && message.includes('погибли') || message.includes('здоровье иссякло') || message.includes('община погибла')) {
                    // Это сообщение о Game Over, его можно добавить, но не после этого
                    if (gameLogElement) {
                         const entry = document.createElement('p');
                         entry.classList.add('game-log-entry', 'game-over-log');
                         entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
                         gameLogElement.prepend(entry); // Добавляем в начало
                         if (gameLogElement.children.length > 50) { // Ограничиваем количество записей
                             gameLogElement.removeChild(gameLogElement.lastChild);
                         }
                     }
                    return; // Не добавляем другие логи, если игра окончена
                } else if (window.gameState && window.gameState.isGameOver) {
                    return; // Блокируем все логи, кроме сообщений Game Over, после Game Over
                }


                if (gameLogElement) {
                    const entry = document.createElement('p');
                    entry.classList.add('game-log-entry');
                    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
                    gameLogElement.prepend(entry); // Добавляем в начало
                    // Ограничиваем количество записей в логе
                    if (gameLogElement.children.length > 50) { // Например, 50 последних записей
                        gameLogElement.removeChild(gameLogElement.lastChild);
                    }
                } else {
                    console.warn("addGameLog: Элемент #game-log не найден. Сообщение: " + message);
                }
            },

            // Обновляет всю информацию о статусе игрока и общины
            updateAllStatus: function() {
                this.updatePlayerStatus();
                this.updateCommunityStatus();
                if (window.inventoryManager) {
                    window.inventoryManager.displayPlayerInventory();
                    window.inventoryManager.displayCommunityStorage();
                } else {
                    console.warn("updateAllStatus: InventoryManager не инициализирован.");
                }
                if (window.craftingManager) {
                    window.craftingManager.displayCraftingRecipes();
                } else {
                     console.warn("updateAllStatus: CraftingManager не инициализирован.");
                }
            },

            // Обновляет статус игрока
            updatePlayerStatus: function() {
                if (!playerStatusElement || !window.gameState.player) {
                    console.warn("updatePlayerStatus: Элемент статуса игрока или данные игрока не найдены.");
                    return;
                }
                const player = window.gameState.player;
                playerStatusElement.innerHTML = `
                    <p><img src="assets/icons/heart.png" alt="Здоровье" class="status-icon"> Здоровье:${player.health}/${player.maxHealth}</p>
                    <p><img src="assets/icons/stamina.png" alt="Выносливость" class="status-icon"> Выносливость:${player.stamina}/${player.maxStamina}</p>
                    <p><img src="assets/icons/hunger.png" alt="Голод" class="status-icon"> Голод:${Math.round((player.hunger / player.maxHunger) * 100)}%</p>
                    <p><img src="assets/icons/thirst.png" alt="Жажда" class="status-icon"> Жажда:${Math.round((player.thirst / player.maxThirst) * 100)}%</p>
                    <p><img src="assets/icons/fatigue.png" alt="Усталость" class="status-icon"> Усталость:${Math.round((player.fatigue / player.maxFatigue) * 100)}%</p>
                    <p><img src="assets/icons/weapon.png" alt="Оружие" class="status-icon"> Оружие:Нет</p>
                    `;
            },

            // Обновляет статус общины
            updateCommunityStatus: function() {
                if (!communityStatusElement || !window.gameState.community) {
                    console.warn("updateCommunityStatus: Элемент статуса общины или данные общины не найдены.");
                    return;
                }
                const community = window.gameState.community;
                communityStatusElement.innerHTML = `
                    <p><img src="assets/icons/survivor.png" alt="Выжившие" class="status-icon"> Выживших:${community.survivors}</p>
                    <p><img src="assets/icons/morale.png" alt="Мораль" class="status-icon"> Мораль:${community.morale}/${community.maxMorale}</p>
                    <p><img src="assets/icons/safety.png" alt="Безопасность" class="status-icon"> Безопасность:${Math.round((community.safety / community.maxSafety) * 100)}%</p>
                    <p><img src="assets/icons/food.png" alt="Еда" class="status-icon"> Еда:${community.resources.food}</p>
                    <p><img src="assets/icons/water.png" alt="Вода" class="status-icon"> Вода:${community.resources.water}</p>
                    <p><img src="assets/icons/shelter.png" alt="Убежище" class="status-icon"> Убежище:Уровень ${community.facilities.shelter_level}</p>
                    `;
            },
        };
    })(); // Самовыполняющаяся функция для создания синглтона
}
