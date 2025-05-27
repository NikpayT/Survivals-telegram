// js/uiManager.js

// Использование единого объекта для UIManager через IIFE (Immediately Invoked Function Expression)
// Это гарантирует, что у нас всегда будет один и тот же экземпляр, доступный через window.uiManager
if (typeof window.uiManager === 'undefined') {
    window.uiManager = (function() {
        // Приватные переменные модуля
        let gameLogElement;
        let gameTextElement;
        let optionsContainer;
        let playerStatusElement;
        let communityStatusElement;
        let playerInventoryList;
        let communityStorageList;
        let craftingRecipesElement;
        let gameDayDisplayElement;

        // Приватный метод для инициализации ссылок на DOM-элементы
        function initializeElements() {
            gameLogElement = document.getElementById('game-log');
            gameTextElement = document.getElementById('game-text');
            optionsContainer = document.getElementById('options-container');
            playerStatusElement = document.getElementById('player-status');
            communityStatusElement = document.getElementById('community-status');
            playerInventoryList = document.getElementById('player-inventory-list');
            communityStorageList = document.getElementById('community-storage-list');
            craftingRecipesElement = document.getElementById('crafting-recipes');
            gameDayDisplayElement = document.getElementById('game-day-display');

            // Консольные предупреждения, если элементы не найдены (полезно для отладки)
            if (!gameLogElement) console.warn("UIManager: Элемент #game-log не найден.");
            if (!gameTextElement) console.warn("UIManager: Элемент #game-text не найден.");
            if (!optionsContainer) console.warn("UIManager: Элемент #options-container не найден.");
            if (!playerStatusElement) console.warn("UIManager: Элемент #player-status не найден.");
            if (!communityStatusElement) console.warn("UIManager: Элемент #community-status не найден.");
            if (!playerInventoryList) console.warn("UIManager: Элемент #player-inventory-list не найден.");
            if (!communityStorageList) console.warn("UIManager: Элемент #community-storage-list не найден.");
            if (!craftingRecipesElement) console.warn("UIManager: Элемент #crafting-recipes не найден.");
            if (!gameDayDisplayElement) console.warn("UIManager: Элемент #game-day-display не найден.");
        }

        // Публичные методы, возвращаемые из IIFE
        return {
            init: function() {
                console.log('UIManager: Инициализация...');
                initializeElements();
                console.log('UIManager: Инициализация DOM-элементов завершена. Статус (true - найден, false - не найден):');
                console.log({
                    gameLogElement: !!gameLogElement,
                    gameTextElement: !!gameTextElement,
                    optionsContainer: !!optionsContainer,
                    playerStatusElement: !!playerStatusElement,
                    communityStatusElement: !!communityStatusElement,
                    playerInventoryList: !!playerInventoryList,
                    communityStorageList: !!communityStorageList,
                    craftingRecipesElement: !!craftingRecipesElement,
                    gameDayDisplayElement: !!gameDayDisplayElement
                });
                // Сообщение о инициализации UI теперь выводится из main.js после успешного вызова uiManager.init()
                // this.addGameLog('Система интерфейса инициализирована.');
            },

            displayGameText: function(text) {
                if (gameTextElement) {
                    gameTextElement.innerHTML = `<p>${text || 'Описание отсутствует.'}</p>`; // Добавил текст по умолчанию
                } else {
                    console.warn("displayGameText: Элемент #game-text не найден для отображения текста.");
                }
            },

            displayOptions: function(options) {
                if (optionsContainer) {
                    optionsContainer.innerHTML = ''; // Очищаем предыдущие опции
                    if (options && options.length > 0) {
                        options.forEach(option => {
                            const button = document.createElement('button');
                            button.textContent = option.text;
                            button.classList.add('option-button'); // Убедитесь, что класс 'option-button' определен в CSS
                            button.addEventListener('click', () => {
                                // Блокируем все кнопки после нажатия, чтобы избежать двойных кликов
                                Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);
                                if (option.action && typeof option.action === 'function') {
                                    try {
                                        option.action();
                                    } catch (e) {
                                        console.error("Ошибка при выполнении option.action:", e);
                                        // Можно добавить window.addGameLog для информирования игрока об ошибке
                                        if (window.addGameLog) window.addGameLog("Произошла ошибка при выполнении выбранного действия.");
                                    }
                                }
                            });
                            optionsContainer.appendChild(button);
                        });
                    } else {
                        optionsContainer.innerHTML = '<p>Нет доступных действий.</p>';
                    }
                } else {
                    console.warn("displayOptions: Элемент #options-container не найден для отображения опций.");
                }
            },

            addGameLog: function(message) {
                // window.addGameLog (обертка в main.js) уже фильтрует большинство сообщений при gameState.isGameOver.
                // Эта функция теперь в основном отвечает за отображение и стилизацию.
                const isDeathMessage = message && (message.includes('погибли') || message.includes('здоровье иссякло') || message.includes('община погибла'));

                if (gameLogElement) {
                    const entry = document.createElement('p');
                    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
                    
                    entry.classList.add('game-log-entry');
                    if (isDeathMessage) { // Добавляем специальный класс для сообщений о конце игры
                        entry.classList.add('game-over-log');
                    }
                    
                    gameLogElement.prepend(entry); // Новые сообщения сверху
                    // Ограничиваем количество сообщений в логе
                    if (gameLogElement.children.length > 50) { 
                        gameLogElement.removeChild(gameLogElement.lastChild);
                    }
                } else {
                    // Этот console.warn будет виден, если gameLogElement не найден при инициализации
                    // но на всякий случай, если сообщение пытается добавиться до или во время сбоя init.
                    console.warn(`addGameLog: Элемент #game-log не найден. Сообщение: [${new Date().toLocaleTimeString()}] ${message}`);
                }
            },

            updateAllStatus: function() {
                this.updatePlayerStatus();
                this.updateCommunityStatus(); // Обновляет статус общины и игровой день

                // Обновление инвентаря через InventoryManager
                if (window.inventoryManager && typeof window.inventoryManager.displayPlayerInventory === 'function') {
                    window.inventoryManager.displayPlayerInventory();
                } else {
                     console.warn("updateAllStatus: window.inventoryManager.displayPlayerInventory не доступен или не функция.");
                }
                if (window.inventoryManager && typeof window.inventoryManager.displayCommunityStorage === 'function') {
                    window.inventoryManager.displayCommunityStorage();
                } else {
                    console.warn("updateAllStatus: window.inventoryManager.displayCommunityStorage не доступен или не функция.");
                }

                // Обновление рецептов крафта через CraftingManager
                if (window.craftingManager && typeof window.craftingManager.displayCraftingRecipes === 'function') {
                    window.craftingManager.displayCraftingRecipes();
                } else {
                     console.warn("updateAllStatus: window.craftingManager.displayCraftingRecipes не доступен или не функция.");
                }
            },

            updatePlayerStatus: function() {
                if (!playerStatusElement) {
                     // console.warn уже был в init, здесь можно просто не выполнять
                    return;
                }
                if (!window.gameState || !window.gameState.player) {
                    console.warn("updatePlayerStatus: gameState или gameState.player не инициализированы.");
                    playerStatusElement.innerHTML = '<p>Данные игрока недоступны.</p>';
                    return;
                }
                const player = window.gameState.player;
                const health = player.health !== undefined ? player.health : 'N/A';
                const maxHealth = player.maxHealth !== undefined ? player.maxHealth : 'N/A';
                const stamina = player.stamina !== undefined ? player.stamina : 'N/A';
                const maxStamina = player.maxStamina !== undefined ? player.maxStamina : 'N/A';
                const hungerPercent = (player.hunger !== undefined && player.maxHunger) ? Math.max(0, Math.round((player.hunger / player.maxHunger) * 100)) : 'N/A'; // Голод отображаем как % сытости или наоборот? Сейчас чем больше, тем хуже.
                const thirstPercent = (player.thirst !== undefined && player.maxThirst) ? Math.max(0, Math.round((player.thirst / player.maxThirst) * 100)) : 'N/A'; // Аналогично
                const fatiguePercent = (player.fatigue !== undefined && player.maxFatigue) ? Math.max(0, Math.round((player.fatigue / player.maxFatigue) * 100)) : 'N/A'; // Аналогично
                const weaponName = (player.weapon && player.weapon.name) ? player.weapon.name : 'Нет';

                playerStatusElement.innerHTML = `
                    <p>Здоровье: ${health}/${maxHealth}</p>
                    <p>Выносливость: ${stamina}/${maxStamina}</p>
                    <p>Голод: ${hungerPercent}%</p>
                    <p>Жажда: ${thirstPercent}%</p>
                    <p>Усталость: ${fatiguePercent}%</p>
                    <p>Оружие: ${weaponName}</p>
                    `;
            },

            updateCommunityStatus: function() {
                // Обновление игрового дня
                if (gameDayDisplayElement) {
                    if (window.gameState && window.gameState.gameDay !== undefined) {
                        gameDayDisplayElement.textContent = window.gameState.gameDay;
                    } else {
                        gameDayDisplayElement.textContent = 'N/A';
                    }
                }
                // Обновление статуса общины
                if (!communityStatusElement) {
                    return;
                }
                if (!window.gameState || !window.gameState.community) {
                    console.warn("updateCommunityStatus: gameState или gameState.community не инициализированы.");
                    communityStatusElement.innerHTML = '<p>Данные общины недоступны.</p>';
                    return;
                }
                const community = window.gameState.community;
                const survivors = community.survivors !== undefined ? community.survivors : 'N/A';
                const morale = community.morale !== undefined ? community.morale : 'N/A';
                const maxMorale = community.maxMorale !== undefined ? community.maxMorale : 'N/A';
                const safetyPercent = (community.safety !== undefined && community.maxSafety) ? Math.round((community.safety / community.maxSafety) * 100) : 'N/A';
                const food = (community.resources && community.resources.food !== undefined) ? community.resources.food : 'N/A';
                const water = (community.resources && community.resources.water !== undefined) ? community.resources.water : 'N/A';
                const shelterLevel = (community.facilities && community.facilities.shelter_level !== undefined) ? community.facilities.shelter_level : 'N/A';

                communityStatusElement.innerHTML = `
                    <p>Выживших: ${survivors}</p>
                    <p>Мораль: ${morale}/${maxMorale}</p>
                    <p>Безопасность: ${safetyPercent}%</p>
                    <p>Еда: ${food}</p>
                    <p>Вода: ${water}</p>
                    <p>Убежище: Уровень ${shelterLevel}</p>
                    `;
            },
        };
    })();
}
