// main.js - Основной файл для инициализации игры и управления глобальным состоянием

// Глобальная переменная для версии игры
const GAME_VERSION = "0.0.1"; // Устанавливаем текущую версию игры

// Глобальный объект для хранения состояния игры
// Доступен по всему приложению через window.gameState
window.gameState = {
    player: null,    // Экземпляр класса Player
    community: null, // Экземпляр класса Community
    factions: {},    // Репутация с фракциями (будет заполнена FactionManager)
    currentSceneId: 'abandoned_building_start', // ID текущей сцены
    gameDay: 1,      // Текущий игровой день
    gameLog: [],     // Игровой лог для сообщений (будет заполняться UIManager)
    // Дополнительные игровые состояния, если нужны
};

// --- Основные глобальные функции игры ---

/**
 * Добавляет сообщение в игровой лог. Это обертка вокруг window.uiManager.addGameLog.
 * Используйте эту функцию во всех игровых файлах для логирования.
 * @param {string} message - Сообщение для добавления.
 */
window.addGameLog = function(message) {
    // Проверяем, что uiManager и его метод addGameLog доступны
    if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
        window.uiManager.addGameLog(message);
    } else {
        // Запасной вариант, если uiManager еще не полностью инициализирован (хотя не должен срабатывать при правильном порядке)
        console.warn("window.uiManager.addGameLog еще не доступен. Сообщение: " + message);
        // Если лог совсем не работает, выводим напрямую в консоль
        console.log(`[FALLBACK LOG] ${message}`);
    }
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
        window.loadScene('player_death', false); // Переход к сцене ошибки или game over
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
    // uiManager.addGameLog('Произошли ежедневные события.'); // Это уже делается в passDay() или loadScene()

    // Загружаем текущую сцену заново, чтобы обновились опции
    // (например, если какие-то действия стали доступны/недоступны)
    window.loadScene(window.gameState.currentSceneId, false); // false, чтобы не вызывать onEnter снова

    // Проверяем условия Game Over после всех ежедневных событий
    checkGameOverConditions();
};


// Загружаем DOM перед инициализацией скриптов
document.addEventListener('DOMContentLoaded', () => {
    // !!! ВАЖНО: uiManager.init() должен быть вызван как можно раньше,
    // после того как DOM гарантированно загружен и элемент #game-log существует.
    // Если он вызывает document.getElementById, то DOM должен быть готов.
    window.uiManager.init(); // Инициализируем UIManager первым делом!

    // Теперь, когда uiManager инициализирован и gameLogElement найден,
    // можно безопасно использовать window.addGameLog
    window.addGameLog('Игра загружена! Инициализация...');

    // Обновляем отображение версии игры
    const gameVersionElement = document.getElementById('game-version');
    if (gameVersionElement) {
        gameVersionElement.textContent = `Версия: ${GAME_VERSION}`;
    } else {
        console.warn("Элемент 'game-version' не найден для отображения версии игры.");
    }


    // Инициализируем игровые объекты
    window.gameState.player = new Player();
    window.gameState.community = new Community();

    // Инициализируем менеджеры
    // Эти менеджеры могут использовать window.addGameLog, который теперь работает через uiManager.
    window.craftingManager = new CraftingManager();
    window.factionManager = new FactionManager();
    window.combatManager = new CombatManager(); // Инициализируем CombatManager
    window.inventoryManager = new InventoryManager(); // УБЕДИТЕСЬ, ЧТО InventoryManager ИНИЦИАЛИЗИРУЕТСЯ ЗДЕСЬ!
    
    // Инициализируем репутацию фракций
    // Здесь factionManager будет вызывать window.addGameLog, который уже настроен.
    window.factionManager.initFactions();

    // Запускаем первую сцену после полной инициализации
    window.loadScene(window.gameState.currentSceneId);
});
