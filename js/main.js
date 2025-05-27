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
    
    // Новые свойства для хранения ссылок на кнопки и секции
    navButtons: {}, // Объект для хранения ссылок на навигационные кнопки
    gameSections: {}, // Объект для хранения ссылок на игровые секции

    /**
     * Инициализирует все DOM-элементы и обработчики событий.
     * Вызывается один раз при загрузке игры.
     */
    init() {
        console.log('UIManager: Инициализация...');

        // 1. Получаем ссылки на основные элементы DOM
        this.gameTextElement = document.getElementById('game-text');
        this.optionsContainer = document.getElementById('options-container');
        this.gameLogElement = document.getElementById('game-log');

        // 2. Получаем ссылки на элементы статуса игрока
        this.playerHealthElement = document.getElementById('player-health');
        this.playerHungerElement = document.getElementById('player-hunger');
        this.playerThirstElement = document.getElementById('player-thirst');
        this.playerFatigueElement = document.getElementById('player-fatigue');
        this.currentWeaponElement = document.getElementById('current-weapon');

        // 3. Получаем ссылки на элементы статуса общины
        this.communitySurvivorsElement = document.getElementById('community-survivors');
        this.communityMoraleElement = document.getElementById('community-morale');
        this.communitySecurityElement = document.getElementById('community-security');
        this.communityFoodElement = document.getElementById('community-food');
        this.communityWaterElement = document.getElementById('community-water');

        // 4. Инициализация навигационных кнопок и игровых секций
        const navButtonMap = {
            'nav-explore': 'explore-section',
            'nav-inventory': 'inventory-section',
            'nav-crafting': 'crafting-section',
            'nav-community': 'community-section',
            'nav-factions': 'factions-section'
        };

        for (const navId in navButtonMap) {
            const sectionId = navButtonMap[navId];
            const button = document.getElementById(navId);
            const section = document.getElementById(sectionId);

            if (button) {
                this.navButtons[navId] = button;
                button.addEventListener('click', () => {
                    this.showSection(sectionId);
                    console.log(`UIManager: Нажата кнопка "${navId}", показана секция "${sectionId}"`);
                });
            } else {
                console.warn(`UIManager: Кнопка навигации с ID "${navId}" не найдена.`);
            }

            if (section) {
                this.gameSections[sectionId] = section;
            } else {
                console.warn(`UIManager: Секция с ID "${sectionId}" не найдена.`);
            }
        }

        // 5. Проверяем, что все ключевые элементы найдены
        if (!this.gameLogElement) console.error("UIManager ОШИБКА: Элемент #game-log не найден! Игровой лог не будет отображаться.");
        if (!this.gameTextElement) console.error("UIManager ОШИБКА: Элемент #game-text не найден!");
        if (!this.optionsContainer) console.error("UIManager ОШИБКА: Элемент #options-container не найден!");

        // 6. Инициализация первой секции (обычно "Исследовать")
        // Убедимся, что секция "explore-section" существует, прежде чем пытаться её показать
        if (this.gameSections['explore-section']) {
            this.showSection('explore-section'); // Показываем секцию "Исследовать" по умолчанию
        } else {
            console.error("UIManager ОШИБКА: Секция 'explore-section' не найдена при инициализации!");
        }
        
        console.log('UIManager: Инициализация завершена. Проверенные элементы:');
        console.log('gameSections:', this.gameSections);
        console.log('navButtons:', this.navButtons);
    },

    /**
     * Отображает указанную секцию игры и активирует соответствующую навигационную кнопку.
     * @param {string} sectionId - ID секции для отображения (например, 'explore-section').
     */
    showSection(sectionId) {
        console.log(`UIManager: Попытка показать секцию: ${sectionId}`);

        // Скрываем все секции и деактивируем все кнопки
        for (const id in this.gameSections) {
            const section = this.gameSections[id];
            if (section) {
                section.classList.add('hidden');
                section.classList.remove('active');
            }
        }
        for (const id in this.navButtons) {
            const button = this.navButtons[id];
            if (button) {
                button.classList.remove('active');
            }
        }

        // Показываем нужную секцию
        const targetSection = this.gameSections[sectionId];
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            console.log(`UIManager: Секция "${sectionId}" успешно показана.`);
        } else {
            console.warn(`UIManager: Секция с ID "${sectionId}" не найдена в gameSections.`);
        }

        // Активируем соответствующую кнопку навигации
        const navButtonId = Object.keys(navButtonMap).find(key => navButtonMap[key] === sectionId);
        if (navButtonId && this.navButtons[navButtonId]) {
            this.navButtons[navButtonId].classList.add('active');
            console.log(`UIManager: Кнопка "${navButtonId}" активирована.`);
        } else {
            console.warn(`UIManager: Не удалось найти навигационную кнопку для секции "${sectionId}".`);
        }

        // Специальная логика для обновления контента при переключении секций
        // Здесь важно убедиться, что соответствующие менеджеры инициализированы
        // и имеют нужные методы.
        switch (sectionId) {
            case 'inventory-section':
                if (window.inventoryManager && typeof window.inventoryManager.displayPlayerInventory === 'function' && typeof window.inventoryManager.displayCommunityStorage === 'function') {
                    window.inventoryManager.displayPlayerInventory();
                    window.inventoryManager.displayCommunityStorage();
                } else {
                    console.warn("UIManager: inventoryManager или его методы displayPlayerInventory/displayCommunityStorage не инициализированы.");
                }
                break;
            case 'crafting-section':
                if (window.craftingManager && typeof window.craftingManager.displayCraftingRecipes === 'function') {
                    window.craftingManager.displayCraftingRecipes();
                } else {
                    console.warn("UIManager: craftingManager или его метод displayCraftingRecipes не инициализированы.");
                }
                break;
            case 'community-section':
                // Предполагаем, что window.community (экземпляр Community) имеет метод displayCommunityDetails
                if (window.gameState.community && typeof window.gameState.community.displayCommunityDetails === 'function') {
                    window.gameState.community.displayCommunityDetails(); // <--- ИСПРАВЛЕНИЕ ЗДЕСЬ
                } else {
                    console.warn("UIManager: window.gameState.community или его метод displayCommunityDetails не найден.");
                }
                break;
            case 'factions-section':
                if (window.factionManager && typeof window.factionManager.displayFactions === 'function') {
                    window.factionManager.displayFactions();
                } else {
                    console.warn("UIManager: factionManager или его метод displayFactions не найден.");
                }
                break;
            // explore-section обновляется через loadScene
            default:
                // Для explore-section или других, которые не требуют немедленного обновления при переключении вкладки
                break;
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
            console.log(`[GAME LOG] ${message}`); // Всегда логируем в консоль, даже если элемент не найден
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
            // Если gameLog не массив, все равно отобразим текущее сообщение напрямую в DOM
            const p = document.createElement('p');
            p.textContent = fullMessage;
            this.gameLogElement.prepend(p); // Добавляем в начало
            // Ограничить количество P-тегов вручную, если gameLog недоступен
            while (this.gameLogElement.children.length > 50) {
                this.gameLogElement.removeChild(this.gameLogElement.lastChild);
            }
        }
        // Дополнительный console.log для всех сообщений лога, полезно для отладки
        console.log(`[GAME LOG] ${fullMessage}`);
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
