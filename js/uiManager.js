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
        let craftingRecipesElement;
        let gameDayDisplayElement; // Для отображения дня

        // Приватные методы для инициализации
        function initializeElements() {
            gameLogElement = document.getElementById('game-log');
            gameTextElement = document.getElementById('game-text');
            optionsContainer = document.getElementById('options-container');
            playerStatusElement = document.getElementById('player-status');
            communityStatusElement = document.getElementById('community-status');
            playerInventoryList = document.getElementById('player-inventory-list');
            communityStorageList = document.getElementById('community-storage-list');
            craftingRecipesElement = document.getElementById('crafting-recipes');
            gameDayDisplayElement = document.getElementById('game-day-display'); // Находим элемент для дня

            // Проверки на существование элементов
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

        // Публичные методы
        return {
            init: function() {
                console.log('UIManager: Инициализация...');
                initializeElements();
                console.log('UIManager: Инициализация завершена. Проверенные элементы (true - найден, false - не найден):');
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
                // this.addGameLog('Система интерфейса инициализирована.'); // Можно раскомментировать после полной загрузки gameState
            },

            displayGameText: function(text) {
                if (gameTextElement) {
                    gameTextElement.innerHTML = `<p>${text || ''}</p>`;
                } else {
                    console.warn("displayGameText: Элемент #game-text не найден.");
                }
            },

            displayOptions: function(options) {
                if (optionsContainer) {
                    optionsContainer.innerHTML = '';
                    if (options && options.length > 0) {
                        options.forEach(option => {
                            const button = document.createElement('button');
                            button.textContent = option.text;
                            button.classList.add('option-button'); // Убедись, что класс соответствует твоему CSS
                            button.addEventListener('click', () => {
                                Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);
                                if (option.action && typeof option.action === 'function') {
                                    option.action();
                                }
                            });
                            optionsContainer.appendChild(button);
                        });
                    }
                } else {
                    console.warn("displayOptions: Элемент #options-container не найден.");
                }
            },

            addGameLog: function(message) {
                if ((window.gameState && window.gameState.isGameOver && message && message.includes('погибли')) || (message && message.includes('здоровье иссякло')) || (message && message.includes('община погибла'))) {
                    if (gameLogElement) {
                        const entry = document.createElement('p');
                        entry.classList.add('game-log-entry', 'game-over-log');
                        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
                        gameLogElement.prepend(entry);
                        if (gameLogElement.children.length > 50) {
                            gameLogElement.removeChild(gameLogElement.lastChild);
                        }
                    }
                    return;
                } else if (window.gameState && window.gameState.isGameOver) {
                    return;
                }

                if (gameLogElement) {
                    const entry = document.createElement('p');
                    entry.classList.add('game-log-entry');
                    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
                    gameLogElement.prepend(entry);
                    if (gameLogElement.children.length > 50) {
                        gameLogElement.removeChild(gameLogElement.lastChild);
                    }
                } else {
                    console.warn(`addGameLog: Элемент #game-log не найден. Сообщение: [${new Date().toLocaleTimeString()}] ${message}`);
                }
            },

            updateAllStatus: function() {
                this.updatePlayerStatus();
                this.updateCommunityStatus(); // Также обновит день игры

                if (window.inventoryManager && typeof window.inventoryManager.displayPlayerInventory === 'function') {
                    window.inventoryManager.displayPlayerInventory();
                } else {
                     console.warn("updateAllStatus: window.inventoryManager.displayPlayerInventory не доступен.");
                }
                if (window.inventoryManager && typeof window.inventoryManager.displayCommunityStorage === 'function') {
                    window.inventoryManager.displayCommunityStorage();
                } else {
                    console.warn("updateAllStatus: window.inventoryManager.displayCommunityStorage не доступен.");
                }

                if (window.craftingManager && typeof window.craftingManager.displayCraftingRecipes === 'function') {
                    window.craftingManager.displayCraftingRecipes();
                } else {
                     console.warn("updateAllStatus: window.craftingManager.displayCraftingRecipes не доступен.");
                }
            },

            // Обновляет статус игрока (БЕЗ ИЗОБРАЖЕНИЙ)
            updatePlayerStatus: function() {
                if (!playerStatusElement || !window.gameState || !window.gameState.player) {
                    console.warn("updatePlayerStatus: Элемент #player-status, gameState или gameState.player не найдены/не инициализированы.");
                    if(playerStatusElement) playerStatusElement.innerHTML = '<p>Данные игрока недоступны.</p>';
                    return;
                }
                const player = window.gameState.player;
                const health = player.health !== undefined ? player.health : 'N/A';
                const maxHealth = player.maxHealth !== undefined ? player.maxHealth : 'N/A';
                const stamina = player.stamina !== undefined ? player.stamina : 'N/A';
                const maxStamina = player.maxStamina !== undefined ? player.maxStamina : 'N/A';
                const hungerPercent = (player.hunger !== undefined && player.maxHunger) ? Math.round((player.hunger / player.maxHunger) * 100) : 'N/A';
                const thirstPercent = (player.thirst !== undefined && player.maxThirst) ? Math.round((player.thirst / player.maxThirst) * 100) : 'N/A';
                const fatiguePercent = (player.fatigue !== undefined && player.maxFatigue) ? Math.round((player.fatigue / player.maxFatigue) * 100) : 'N/A';
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

            // Обновляет статус общины (БЕЗ ИЗОБРАЖЕНИЙ) и день игры
            updateCommunityStatus: function() {
                if (gameDayDisplayElement && window.gameState && window.gameState.gameDay !== undefined) {
                    gameDayDisplayElement.textContent = window.gameState.gameDay;
                } else if (gameDayDisplayElement) {
                    gameDayDisplayElement.textContent = 'N/A';
                }


                if (!communityStatusElement || !window.gameState || !window.gameState.community) {
                    console.warn("updateCommunityStatus: Элемент #community-status, gameState или gameState.community не найдены/не инициализированы.");
                     if(communityStatusElement) communityStatusElement.innerHTML = '<p>Данные общины недоступны.</p>';
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
