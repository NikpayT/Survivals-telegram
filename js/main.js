// js/main.js - Основной файл для инициализации игры и управления глобальным состоянием

// Глобальная переменная для версии игры
const GAME_VERSION = "0.0.2"; // Устанавливаем текущую версию игры

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
        // Если uiManager еще не полностью инициализирован, логируем напрямую в консоль
        console.warn(`[FALLBACK LOG] ${message}`);
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
        window.addGameLog(`Ошибка: Сцена с ID "${sceneId}" не найдена! Переход к сцене смерти.`);
        window.loadScene('player_death', false); // Переход к сцене ошибки или game over
        return;
    }

    window.gameState.currentSceneId = sceneId;
    window.addGameLog(`Загружена сцена: "${scene.name}"`);

    // Выполняем действия, которые должны произойти при входе в сцену (если есть)
    if (triggerOnEnter && scene.onEnter && typeof scene.onEnter === 'function') {
        try {
            scene.onEnter(window.gameState.player, window.gameState.community);
        } catch (e) {
            console.error(`Ошибка при выполнении onEnter для сцены ${sceneId}:`, e);
            window.addGameLog(`Произошла ошибка в сцене "${scene.name}".`);
        }
    }

    // Обновляем UI
    window.uiManager.displayGameText(scene.description);
    // Мапим опции для displayOptions, чтобы они вызывали loadScene
    const displayableOptions = scene.options.map(option => ({
        text: option.text,
        action: () => {
            // Если опция ведет к новой сцене, просто загружаем её
            if (option.nextScene) {
                window.loadScene(option.nextScene);
            } else if (option.customAction && typeof option.customAction === 'function') {
                // Если есть кастомное действие, выполняем его
                try {
                    option.customAction();
                } catch (e) {
                    console.error(`Ошибка при выполнении customAction для опции:`, e);
                    window.addGameLog(`Произошла ошибка при выполнении действия.`);
                }
                // После кастомного действия, возможно, нужно обновить текущую сцену
                // или перейти к новой, если действие не привело к смене сцены
                window.loadScene(window.gameState.currentSceneId, false); // Обновляем текущую сцену без вызова onEnter
            } else {
                console.warn("Опция не имеет nextScene и customAction или customAction не является функцией.");
            }
        }
    }));
    window.uiManager.displayOptions(displayableOptions);

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

    if (!player || !community) {
        console.warn("checkGameOverConditions: player или community не инициализированы.");
        return false;
    }

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
    if (window.gameState.player && typeof window.gameState.player.passDay === 'function') {
        window.gameState.player.passDay();
    } else {
        console.error("Player.passDay не найден или не является функцией.");
    }

    // Ежедневные действия общины
    if (window.gameState.community && typeof window.gameState.community.passDay === 'function') {
        window.gameState.community.passDay();
    } else {
        console.error("Community.passDay не найден или не является функцией.");
    }

    // Обновляем UI
    if (window.uiManager && typeof window.uiManager.updateAllStatus === 'function') {
        window.uiManager.updateAllStatus();
    } else {
        console.error("UIManager.updateAllStatus не найден или не является функцией.");
    }

    // Загружаем текущую сцену заново, чтобы обновились опции
    // (например, если какие-то действия стали доступны/недоступны)
    window.loadScene(window.gameState.currentSceneId, false); // false, чтобы не вызывать onEnter снова

    // Проверяем условия Game Over после всех ежедневных событий
    checkGameOverConditions();
};


// Загружаем DOM перед инициализацией скриптов
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем UIManager первым делом!
    // Его методы используются другими менеджерами и функциями
    if (typeof UIManager !== 'undefined') { // Проверка, что UIManager объект загружен
        window.uiManager.init(); 
        window.addGameLog('Игра загружена! Инициализация...');
    } else {
        console.error("UIManager не загружен. Убедитесь, что uiManager.js подключен до main.js.");
        return; // Прекращаем выполнение, если UI Manager не доступен
    }

    // Обновляем отображение версии игры
    const gameVersionElement = document.getElementById('game-version');
    if (gameVersionElement) {
        gameVersionElement.textContent = `Версия: ${GAME_VERSION}`;
    } else {
        console.warn("Элемент 'game-version' не найден для отображения версии игры.");
    }

    // Инициализируем игровые объекты
    // Убедимся, что классы Player и Community определены
    if (typeof Player !== 'undefined') {
        window.gameState.player = new Player();
    } else {
        console.error("Класс Player не определен. Убедитесь, что player.js подключен.");
        return;
    }
    if (typeof Community !== 'undefined') {
        window.gameState.community = new Community();
    } else {
        console.error("Класс Community не определен. Убедитесь, что community.js подключен.");
        return;
    }

    // Инициализируем менеджеры
    // Эти менеджеры используют window.addGameLog, который теперь работает через uiManager.
    // Важно: Порядок инициализации менеджеров может иметь значение, если они зависят друг от друга.
    if (typeof CraftingManager !== 'undefined') {
        window.craftingManager = new CraftingManager();
    } else {
        console.error("Класс CraftingManager не определен. Убедитесь, что craftingManager.js подключен.");
    }

    if (typeof FactionManager !== 'undefined') {
        window.factionManager = new FactionManager();
        window.factionManager.initFactions(); // Инициализируем репутацию фракций
    } else {
        console.error("Класс FactionManager не определен. Убедитесь, что factionManager.js подключен.");
    }

    if (typeof CombatManager !== 'undefined') {
        window.combatManager = new CombatManager();
    } else {
        console.error("Класс CombatManager не определен. Убедитесь, что combatManager.js подключен.");
    }
    
    // Инициализация InventoryManager - он должен быть последним, чтобы Player и Community были готовы
    if (typeof InventoryManager !== 'undefined') {
        window.inventoryManager = new InventoryManager();
    } else {
        console.error("Класс InventoryManager не определен. Убедитесь, что inventoryManager.js подключен.");
    }

    // Запускаем первую сцену после полной инициализации
    // Проверяем, что GameScenes доступны
    if (typeof GameScenes !== 'undefined') {
        window.loadScene(window.gameState.currentSceneId);
    } else {
        console.error("Объект GameScenes не определен. Убедитесь, что scenes.js подключен.");
    }
});
