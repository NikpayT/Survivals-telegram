// main.js - Основной файл для инициализации игры и управления глобальным состоянием

// Глобальный объект для хранения состояния игры
// Доступен по всему приложению через window.gameState
window.gameState = {
    player: null,    // Экземпляр класса Player
    community: null, // Экземпляр класса Community
    factions: {},    // Репутация с фракциями (будет заполнена FactionManager)
    currentSceneId: 'abandoned_building_start', // ID текущей сцены
    gameDay: 1,      // Текущий игровой день
    gameLog: [],     // Игровой лог для сообщений
    // Дополнительные игровые состояния, если нужны
};

// --- Основные функции игры ---

// !!! ВАЖНОЕ ИСПРАВЛЕНИЕ !!!
// Делаем функцию добавления в лог глобально доступной сразу.
// Теперь она будет вызывать метод uiManager.addGameLog, который уже настроен на работу с DOM и gameState.
// uiManager.js должен быть загружен в HTML до main.js для этого.
window.addGameLog = function(message) {
    // window.uiManager.addGameLog() сам управляет timestamp и сохранением в gameState.gameLog,
    // а также обновлением DOM.
    if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
        window.uiManager.addGameLog(message);
    } else {
        // Запасной вариант, если uiManager еще не инициализирован или не содержит addGameLog
        console.warn("UIManager.addGameLog еще не доступен. Сообщение: " + message);
        // Можно добавить сообщение в gameLog напрямую, но оно не будет отображено сразу
        if (window.gameState && window.gameState.gameLog) {
            const timestamp = new Date().toLocaleTimeString();
            window.gameState.gameLog.unshift(`[${timestamp}] ${message}`);
            if (window.gameState.gameLog.length > 50) {
                window.gameState.gameLog.pop();
            }
        }
    }
};


// Загружаем DOM перед инициализацией скриптов
document.addEventListener('DOMContentLoaded', () => {
    window.addGameLog('Игра загружена! Инициализация...'); // Используем новую глобальную функцию

    // Инициализируем игровые объекты
    window.gameState.player = new Player();
    window.gameState.community = new Community();

    // Инициализируем менеджеры
    window.craftingManager = new CraftingManager();
    window.factionManager = new FactionManager();
    window.combatManager = new CombatManager(); // Инициализируем CombatManager
    
    // Инициализируем UIManager (он будет отвечать за обновление HTML)
    // Важно: uiManager должен быть инициализирован после player и community
    // и после того, как все GameScenes, GameItems и т.д. загружены.
    // А также после определения window.addGameLog, если мы его используем как глобальную функцию.
    window.uiManager.init(); // Теперь uiManager.init() вызовется после того, как window.addGameLog существует

    // Инициализируем репутацию фракций
    window.factionManager.initFactions(); // Теперь эта функция сможет использовать window.addGameLog

    /**
     * Загружает и отображает новую сцену.
     * @param {string} sceneId - ID сцены для загрузки.
     * @param {boolean} triggerOnEnter - Вызывать ли onEnter для сцены. По умолчанию true.
     */
    window.loadScene = function(sceneId, triggerOnEnter = true) {
        const scene = GameScenes[sceneId];
        if (!scene) {
            window.addGameLog(`Ошибка: Сцена с ID "${sceneId}" не найдена!`);
            window.loadScene('player_death'); // Переход к сцене ошибки или game over
            return;
        }

        window.gameState.currentSceneId = sceneId;
        window.addGameLog(`Загружена сцена: "${scene.name}"`);

        // Выполняем действия, которые должны произойти при входе в сцену (если есть)
        if (triggerOnEnter && scene.onEnter) {
            scene.onEnter(window.gameState.player, window.gameState.community);
        }

        // Обновляем UI
        window.uiManager.displayGameText(scene.description);
        // Мапим опции для displayOptions, чтобы они вызывали loadScene
        window.uiManager.displayOptions(scene.options.map(option => ({
            text: option.text,
            action: () => {
                // Если опция ведет к новой сцене, просто загружаем её
                if (option.nextScene) {
                    window.loadScene(option.nextScene);
                } else if (option.customAction) {
                    // Если есть кастомное действие, выполняем его
                    option.customAction();
                    // После кастомного действия, возможно, нужно обновить текущую сцену
                    // или перейти к новой, если действие не привело к смене сцены
                    window.loadScene(window.gameState.currentSceneId, false); // Обновляем текущую сцену без вызова onEnter
                }
            }
        })));

        // Проверяем условия Game Over после загрузки сцены
        checkGameOverConditions();
        window.uiManager.updateAllStatus(); // Убеждаемся, что статус всегда актуален
    };

    /**
     * Проверяет условия завершения игры (Game Over).
     */
    function checkGameOverConditions() {
        const player = window.gameState.player;
        const community = window.gameState.community;

        if (player.health <= 0) {
            window.addGameLog('Ваше здоровье иссякло. Вы не смогли больше бороться. Это конец вашего пути.');
            window.loadScene('player_death', false); // Загружаем сцену смерти без повторного onEnter
            return true;
        }
        // Если выживших в общине нет (кроме самого игрока) И игрок не погиб
        // Добавлено условие, что убежище должно быть разрушено, иначе можно просто умереть от голода/жажды и община будет жива
        if (community.survivors <= 1 && player.health > 0 && community.facilities.shelter_level === 0) {
            window.addGameLog('Ваше убежище разрушено, а община погибла. Вы остались один, без надежды на восстановление.');
            window.loadScene('player_death', false); // Можно сделать отдельную сцену "Одинокий конец"
            return true;
        }
        return false;
    }

    /**
     * Функция для перехода к следующему игровому дню (ежедневный цикл).
     * Вызывается по триггеру (например, кнопка "Отдохнуть" или событие).
     */
    window.nextGameDay = function() {
        window.gameState.gameDay++;
        window.addGameLog(`Наступил день ${window.gameState.gameDay}.`);

        // Ежедневные действия игрока
        window.gameState.player.passDay();

        // Ежедневные действия общины
        window.gameState.community.passDay();

        // Обновляем UI
        window.uiManager.updateAllStatus();
        window.uiManager.addGameLog('Произошли ежедневные события.');

        // Загружаем текущую сцену заново, чтобы обновились опции
        // (например, если какие-то действия стали доступны/недоступны)
        window.loadScene(window.gameState.currentSceneId, false); // false, чтобы не вызывать onEnter снова

        // Проверяем условия Game Over после всех ежедневных событий
        checkGameOverConditions();
    };

    // Запускаем первую сцену после полной инициализации
    window.loadScene(window.gameState.currentSceneId);
});
