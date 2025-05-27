// js/uiManager.js - Управление всем графическим интерфейсом пользователя

const UIManager = {
    // DOM-элементы, которые мы будем часто использовать
    gameTextElement: null,
    optionsContainer: null,
    gameLogElement: null,
    playerHealthElement: null,
    playerHungerElement: null,
    playerThirstElement: null,
    playerFatigueElement: null,
    currentWeaponElement: null,
    communitySurvivorsElement: null,
    communityMoraleElement: null,
    communitySecurityElement: null,
    communityFoodElement: null,
    communityWaterElement: null,
    // Навигационные кнопки
    navButtons: {},
    gameSections: {},

    /**
     * Инициализирует все DOM-элементы и обработчики событий.
     * Вызывается один раз при загрузке игры.
     */
    init() {
        console.log('UIManager: Инициализация...');
        // Получаем ссылки на основные элементы DOM
        this.gameTextElement = document.getElementById('game-text');
        this.optionsContainer = document.getElementById('options-container');
        this.gameLogElement = document.getElementById('game-log'); // Ключевой элемент для твоей ошибки

        // Статус игрока
        this.playerHealthElement = document.getElementById('player-health');
        this.playerHungerElement = document.getElementById('player-hunger');
        this.playerThirstElement = document.getElementById('player-thirst');
        this.playerFatigueElement = document.getElementById('player-fatigue');
        this.currentWeaponElement = document.getElementById('current-weapon');

        // Статус общины
        this.communitySurvivorsElement = document.getElementById('community-survivors');
        this.communityMoraleElement = document.getElementById('community-morale');
        this.communitySecurityElement = document.getElementById('community-security');
        this.communityFoodElement = document.getElementById('community-food');
        this.communityWaterElement = document.getElementById('community-water');

        // Навигационные кнопки и секции
        const navButtonIds = ['nav-explore', 'nav-inventory', 'nav-crafting', 'nav-community', 'nav-factions'];
        const sectionIds = ['explore-section', 'inventory-section', 'crafting-section', 'community-section', 'factions-section'];

        navButtonIds.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                this.navButtons[id] = button;
                button.addEventListener('click', () => this.showSection(id.replace('nav-', '') + '-section'));
            } else {
                console.warn(`UIManager: Кнопка навигации с ID "${id}" не найдена.`);
            }
        });

        sectionIds.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                this.gameSections[id] = section;
            } else {
                console.warn(`UIManager: Секция с ID "${id}" не найдена.`);
            }
        });

        // Проверяем, что все ключевые элементы найдены
        if (!this.gameLogElement) {
            console.error("UIManager ОШИБКА: Элемент #game-log не найден! Игровой лог не будет отображаться.");
        } else {
            console.log("UIManager: Элемент #game-log найден.");
        }
        if (!this.gameTextElement) console.error("UIManager ОШИБКА: Элемент #game-text не найден!");
        if (!this.optionsContainer) console.error("UIManager ОШИБКА: Элемент #options-container не найден!");

        // Инициализация первой секции (обычно "Исследовать")
        this.showSection('explore-section');
        console.log('UIManager: Инициализация завершена.');
    },

    /**
     * Отображает указанную секцию игры и активирует соответствующую навигационную кнопку.
     * @param {string} sectionId - ID секции для отображения (например, 'explore-section').
     */
    showSection(sectionId) {
        // Скрываем все секции
        for (const id in this.gameSections) {
            if (this.gameSections[id]) {
                this.gameSections[id].classList.add('hidden');
                this.gameSections[id].classList.remove('active');
            }
        }
        // Деактивируем все кнопки навигации
        for (const id in this.navButtons) {
            if (this.navButtons[id]) {
                this.navButtons[id].classList.remove('active');
            }
        }

        // Показываем нужную секцию
        const targetSection = this.gameSections[sectionId];
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        } else {
            console.warn(`UIManager: Секция с ID "${sectionId}" не найдена.`);
        }

        // Активируем соответствующую кнопку навигации
        const navButtonId = sectionId.replace('-section', ''); // 'explore' из 'explore-section'
        const targetButton = this.navButtons['nav-' + navButtonId];
        if (targetButton) {
            targetButton.classList.add('active');
        } else {
            console.warn(`UIManager: Кнопка навигации для секции "${sectionId}" не найдена.`);
        }

        // Специальная логика для обновления контента при переключении секций
        switch (sectionId) {
            case 'inventory-section':
                window.inventoryManager.displayPlayerInventory();
                window.inventoryManager.displayCommunityStorage();
                break;
            case 'crafting-section':
                window.craftingManager.displayCraftingRecipes();
                break;
            case 'community-section':
                window.community.displayCommunityDetails(); // Предполагаем, что у Community есть такой метод
                break;
            case 'factions-section':
                window.factionManager.displayFactions(); // Предполагаем, что у FactionManager есть такой метод
                break;
            // explore-section обновляется через loadScene
        }
    },


    /**
     * Обновляет все элементы статуса игрока и общины.
     */
    updateAllStatus() {
        if (!window.gameState || !window.gameState.player || !window.gameState.community) {
            console.warn("UIManager: Невозможно обновить статус, gameState, player или community не инициализированы.");
            return;
        }

        const player = window.gameState.player;
        const community = window.gameState.community;

        // Обновляем статус игрока
        if (this.playerHealthElement) this.playerHealthElement.textContent = Math.max(0, player.health);
        if (this.playerHungerElement) this.playerHungerElement.textContent = Math.round(player.hunger);
        if (this.playerThirstElement) this.playerThirstElement.textContent = Math.round(player.thirst);
        if (this.playerFatigueElement) this.playerFatigueElement.textContent = Math.round(player.fatigue);
        if (this.currentWeaponElement) this.currentWeaponElement.textContent = player.currentWeapon ? player.currentWeapon.name : 'Нет';

        // Обновляем статус общины
        if (this.communitySurvivorsElement) this.communitySurvivorsElement.textContent = community.survivors;
        if (this.communityMoraleElement) this.communityMoraleElement.textContent = Math.round(community.morale);
        if (this.communitySecurityElement) this.communitySecurityElement.textContent = Math.round(community.security);
        if (this.communityFoodElement) this.communityFoodElement.textContent = Math.round(community.resources.food);
        if (this.communityWaterElement) this.communityWaterElement.textContent = Math.round(community.resources.water);
    },

    /**
     * Отображает основной текст игровой сцены.
     * @param {string} text - Текст для отображения.
     */
    displayGameText(text) {
        if (this.gameTextElement) {
            this.gameTextElement.innerHTML = text;
        } else {
            console.warn("UIManager: Элемент #game-text не найден для отображения текста.");
        }
    },

    /**
     * Отображает кнопки опций для текущей сцены.
     * @param {Array<Object>} options - Массив объектов опций ({ text: string, action: Function }).
     */
    displayOptions(options) {
        if (!this.optionsContainer) {
            console.warn("UIManager: Элемент #options-container не найден для отображения опций.");
            return;
        }
        this.optionsContainer.innerHTML = ''; // Очищаем старые опции

        options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = option.text;
            button.addEventListener('click', () => {
                // Перед выполнением действия, обновим состояние кнопок, если необходимо
                // Например, чтобы предотвратить двойное нажатие
                // Можно добавить сюда логику деактивации/активации
                option.action(); // Выполняем действие опции
            });
            this.optionsContainer.appendChild(button);
        });
    },

    /**
     * Добавляет сообщение в игровой лог и обновляет его отображение.
     * @param {string} message - Сообщение для лога.
     */
    addGameLog(message) {
        // Проверка, что gameLogElement уже найден и инициализирован
        if (!this.gameLogElement) {
            console.warn("UIManager: gameLogElement не найден. Лог не будет обновлен.");
            // В этом случае просто логируем в консоль, чтобы не потерять сообщение
            console.log(`[GAME LOG] ${message}`);
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const fullMessage = `[${timestamp}] ${message}`;

        // Убедимся, что gameState и gameLog существуют
        if (window.gameState && Array.isArray(window.gameState.gameLog)) {
            window.gameState.gameLog.unshift(fullMessage); // Добавляем в начало
            if (window.gameState.gameLog.length > 50) { // Ограничиваем размер лога
                window.gameState.gameLog.pop(); // Удаляем самый старый элемент
            }
            this.updateGameLogDisplay(); // Обновляем отображение лога
        } else {
            console.warn("UIManager: window.gameState.gameLog не инициализирован как массив. Сообщения лога не будут сохранены.");
            // Если gameLog не массив, все равно отобразим текущее сообщение
            const p = document.createElement('p');
            p.textContent = fullMessage;
            this.gameLogElement.prepend(p); // Добавляем в начало
            // Ограничить количество P-тегов вручную, если gameLog недоступен
            while (this.gameLogElement.children.length > 50) {
                this.gameLogElement.removeChild(this.gameLogElement.lastChild);
            }
        }
        console.log(`[GAME LOG] ${fullMessage}`); // Всегда логируем в консоль
    },

    /**
     * Обновляет HTML-отображение игрового лога из window.gameState.gameLog.
     */
    updateGameLogDisplay() {
        if (!this.gameLogElement) {
            console.warn("UIManager: gameLogElement не найден. Невозможно обновить отображение лога.");
            return;
        }
        if (window.gameState && Array.isArray(window.gameState.gameLog)) {
            this.gameLogElement.innerHTML = window.gameState.gameLog.map(msg => `<p>${msg}</p>`).join('');
            // Прокручиваем вниз, чтобы видеть новые сообщения
            this.gameLogElement.scrollTop = this.gameLogElement.scrollHeight;
        } else {
            console.warn("UIManager: Невозможно обновить отображение лога, window.gameState.gameLog не массив.");
        }
    }
};

// Делаем UIManager глобально доступным
window.uiManager = UIManager;
