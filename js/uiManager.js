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
                // Выводим только имена переменных, чтобы избежать вывода всего DOM-элемента, если он большой
                console.log({
                    gameLogElement: !!gameLogElement,
                    gameTextElement: !!gameTextElement,
                    optionsContainer: !!optionsContainer,
                    playerStatusElement: !!playerStatusElement,
                    communityStatusElement: !!communityStatusElement,
                    playerInventoryList: !!playerInventoryList,
                    communityStorageList: !!communityStorageList,
                    craftingRecipesElement: !!craftingRecipesElement
                });
                // this.addGameLog('Система интерфейса инициализирована.'); // Закомментировано, чтобы избежать вызова до полной инициализации gameState
            },

            // Обновляет текстовое описание игры
            displayGameText: function(text) {
                if (gameTextElement) {
                    gameTextElement.innerHTML = `<p>${text || ''}</p>`; // Добавлена проверка на undefined text
                } else {
                    console.warn("displayGameText: Элемент #game-text не найден.");
                }
            },

            // Отображает доступные опции (кнопки)
            displayOptions: function(options) {
                if (optionsContainer) {
                    optionsContainer.innerHTML = ''; // Очищаем предыдущие опции
                    if (options && options.length > 0) {
                        options.forEach(option => {
                            const button = document.createElement('button');
                            button.textContent = option.text;
                            // Убедимся, что класс добавляется, как в твоем CSS, если есть (.option-button или .game-option-button)
                            button.classList.add('option-button'); // или 'game-option-button' в зависимости от твоего CSS
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
                         // Можно добавить сообщение, если опций нет, или оставить пустым
                        // optionsContainer.innerHTML = '<p>Нет доступных действий.</p>';
                    }
                } else {
                    console.warn("displayOptions: Элемент #options-container не найден.");
                }
            },

            // Добавляет сообщение в игровой лог
            addGameLog: function(message) {
                // Проверка на isGameOver, чтобы не добавлять логи после смерти
                // Логика определения "сообщений о смерти" и блокировки логов после Game Over
                // (A && B && C) || D || E - (window.gameState && window.gameState.isGameOver && message.includes('погибли')) || message.includes('здоровье иссякло') || message.includes('община погибла')
                if ((window.gameState && window.gameState.isGameOver && message && message.includes('погибли')) || (message && message.includes('здоровье иссякло')) || (message && message.includes('община погибла'))) {
                    if (gameLogElement) {
                        const entry = document.createElement('p');
                        entry.classList.add('game-log-entry', 'game-over-log'); // Класс для особых сообщений
                        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
                        gameLogElement.prepend(entry);
                        if (gameLogElement.children.length > 50) {
                            gameLogElement.removeChild(gameLogElement.lastChild);
                        }
                    }
                    return; 
                } else if (window.gameState && window.gameState.isGameOver) {
                    // Блокируем все остальные логи, если игра уже завершена
                    // console.log(`[LOG BLOCKED DUE TO GAME OVER] ${message}`); // для отладки
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
                    // Лог в консоль, если элемент не найден (может случиться при очень ранних ошибках)
                    console.warn(`addGameLog: Элемент #game-log не найден. Сообщение: [${new Date().toLocaleTimeString()}] ${message}`);
                }
            },

            // Обновляет всю информацию о статусе игрока и общины
            updateAllStatus: function() {
                this.updatePlayerStatus();
                this.updateCommunityStatus();
                
                // Обновление инвентаря и крафта, если менеджеры доступны
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
                    console.warn("updatePlayerStatus: Элемент статуса игрока (#player-status), gameState или gameState.player не найдены/не инициализированы.");
                    if(playerStatusElement) playerStatusElement.innerHTML = '<p>Данные игрока недоступны.</p>';
                    return;
                }
                const player = window.gameState.player;
                // Убедимся, что все свойства игрока существуют перед использованием
                const health = player.health !== undefined ? player.health : 'N/A';
                const maxHealth = player.maxHealth !== undefined ? player.maxHealth : 'N/A';
                const stamina = player.stamina !== undefined ? player.stamina : 'N/A';
                const maxStamina = player.maxStamina !== undefined ? player.maxStamina : 'N/A';
                const hungerPercent = (player.hunger !== undefined && player.maxHunger) ? Math.round((player.hunger / player.maxHunger) * 100) : 'N/A';
                const thirstPercent = (player.thirst !== undefined && player.maxThirst) ? Math.round((player.thirst / player.maxThirst) * 100) : 'N/A';
                const fatiguePercent = (player.fatigue !== undefined && player.maxFatigue) ? Math.round((player.fatigue / player.maxFatigue) * 100) : 'N/A';
                const weapon = player.weapon ? player.weapon.name : 'Нет'; // Предполагается, что оружие - объект с именем

                playerStatusElement.innerHTML = `
                    <p>Здоровье: ${health}/${maxHealth}</p>
                    <p>Выносливость: ${stamina}/${maxStamina}</p>
                    <p>Голод: ${hungerPercent}%</p>
                    <p>Жажда: ${thirstPercent}%</p>
                    <p>Усталость: ${fatiguePercent}%</p>
                    <p>Оружие: ${weapon}</p>
                    `;
            },

            // Обновляет статус общины (БЕЗ ИЗОБРАЖЕНИЙ)
            updateCommunityStatus: function() {
                if (!communityStatusElement || !window.gameState || !window.gameState.community) {
                    console.warn("updateCommunityStatus: Элемент статуса общины (#community-status), gameState или gameState.community не найдены/не инициализированы.");
                     if(communityStatusElement) communityStatusElement.innerHTML = '<p>Данные общины недоступны.</p>';
                    return;
                }
                const community = window.gameState.community;
                // Убедимся, что все свойства общины существуют
                const survivors = community.survivors !== undefined ? community.survivors : 'N/A';
                const morale = community.morale !== undefined ? community.morale : 'N/A';
                const maxMorale = community.maxMorale !== undefined ? community.maxMorale : 'N/A';
                const safetyPercent = (community.safety !== undefined && community.maxSafety) ? Math.round((community.safety / community.maxSafety) * 100) : 'N/A';
                const food = (community.resources && community.resources.food !== undefined) ? community.resources.food : 'N/A';
                const water = (community.resources && community.resources.water !== undefined) ? community.resources.water : 'N/A';
                const shelterLevel = (community.facilities && community.facilities.shelter_level !== undefined) ? community.facilities.shelter_level : 'N/A';
                const gameDay = window.gameState.gameDay !== undefined ? window.gameState.gameDay : 'N/A';


                // Обновление заголовка с днем игры
                const dayDisplayElement = document.getElementById('game-day-display');
                if (dayDisplayElement) {
                    dayDisplayElement.textContent = gameDay;
                }

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
    })(); // Самовыполняющаяся функция для создания синглтона
}
