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

// Загружаем DOM перед инициализацией скриптов
document.addEventListener('DOMContentLoaded', () => {
    console.log('Игра загружена! Инициализация...');

    // Инициализируем игровые объекты
    window.gameState.player = new Player();
    window.gameState.community = new Community();

    // Инициализируем менеджеры
    window.craftingManager = new CraftingManager();
    window.factionManager = new FactionManager();
    window.combatManager = new CombatManager(); // Инициализируем CombatManager
    // Инициализируем репутацию фракций
    window.factionManager.initFactions();

    // Запускаем UIManager (он будет отвечать за обновление HTML)
    // Важно: uiManager должен быть инициализирован после player и community
    // и после того, как все GameScenes, GameItems и т.д. загружены.
    window.uiManager.init();

    // --- Основные функции игры ---

    /**
     * Добавляет сообщение в игровой лог.
     * @param {string} message - Сообщение для добавления.
     */
    window.addGameLog = function(message) {
        const timestamp = new Date().toLocaleTimeString();
        window.gameState.gameLog.push(`[${timestamp}] ${message}`);
        if (window.gameState.gameLog.length > 50) { // Ограничиваем размер лога
            window.gameState.gameLog.shift();
        }
        window.uiManager.updateGameLog(); // Обновляем UI-элемент лога, если такой есть
        console.log(`[GAME LOG] ${message}`); // Также выводим в консоль
    };

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
        if (community.survivors <= 1 && player.health > 0 && community.facilities.shelter_level === 0) { // Добавим условие, что убежище разрушено
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

        // Ежедневное потребление ресурсов общиной
        window.gameState.community.dailyConsumption();

        // Ежедневные потребности игрока
        window.gameState.player.adjustHunger(Math.floor(Math.random() * 10) + 10); // 10-20
        window.gameState.player.adjustThirst(Math.floor(Math.random() * 15) + 15); // 15-30
        window.gameState.player.adjustFatigue(Math.floor(Math.random() * 20) + 20); // 20-40

        // Проверка на последствия голода/жажды/усталости для игрока
        if (window.gameState.player.hunger >= 90) {
            window.gameState.player.adjustHealth(-5);
            window.addGameLog('Вы очень голодны и чувствуете слабость. Ваше здоровье ухудшается.');
        } else if (window.gameState.player.hunger >= 70) {
            window.addGameLog('Вы начинаете сильно голодать.');
        }

        if (window.gameState.player.thirst >= 90) {
            window.gameState.player.adjustHealth(-10);
            window.addGameLog('Вас мучает невыносимая жажда, силы покидают вас. Здоровье критически падает.');
        } else if (window.gameState.player.thirst >= 70) {
            window.addGameLog('Вы испытываете сильную жажду.');
        }

        if (window.gameState.player.fatigue >= 100) {
            window.gameState.player.adjustHealth(-3);
            window.addGameLog('Вы измотаны до предела. Вам срочно нужен отдых.');
        } else if (window.gameState.player.fatigue >= 80) {
            window.addGameLog('Вы очень устали и нуждаетесь в отдыхе.');
        }

        // Обновляем UI
        window.uiManager.updateAllStatus();
        // Перезагружаем текущую сцену, чтобы отобразить новые опции/текст, если изменился
        window.loadScene(window.gameState.currentSceneId, false); // false, чтобы не вызывать onEnter снова
        checkGameOverConditions();

        // Здесь будут вызываться случайные события дня
        // window.gameLoop.triggerDailyEvents();
    };

    // --- Инициализация интерфейса и загрузка первой сцены ---
    // Убедимся, что все элементы UI доступны перед первой загрузкой сцены
    window.uiManager.updateAllStatus(); // Обновляем статус-бар при старте
    window.loadScene(window.gameState.currentSceneId); // Загружаем начальную сцену
});
