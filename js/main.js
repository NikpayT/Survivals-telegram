// js/main.js - Основной файл для инициализации игры и управления глобальным состоянием

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
    isGameOver: false, // Флаг для отслеживания состояния Game Over
    // Дополнительные игровые состояния, если нужны
};

// --- Основные глобальные функции игры ---

/**
 * Добавляет сообщение в игровой лог. Это обертка вокруг window.uiManager.addGameLog.
 * Используйте эту функцию во всех игровых файлах для логирования.
 * @param {string} message - Сообщение для добавления.
 */
window.addGameLog = function(message) {
    // Если игра уже закончилась, не добавляем новые логи, чтобы избежать спама
    // Исключаем сообщения о самой смерти, чтобы они попали в лог
    if (window.gameState.isGameOver && !message.includes('погибли') && !message.includes('здоровье иссякло') && !message.includes('община погибла')) {
        // Можно добавить консольный лог для отладки, если нужно видеть, что логи блокируются
        // console.log(`[GAME OVER LOG BLOCKED] ${message}`);
        return;
    }
    // Проверяем, что uiManager и его метод addGameLog доступны
    if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
        window.uiManager.addGameLog(message);
    } else {
        // Если uiManager еще не полностью инициализирован, логируем напрямую в консоль
        console.warn(`[FALLBACK LOG] UIManager or addGameLog not ready. Message: ${message}`);
    }
};

/**
 * Загружает и отображает новую сцену.
 * @param {string} sceneId - ID сцены для загрузки.
 * @param {boolean} triggerOnEnter - Вызывать ли onEnter для сцены. По умолчанию true.
 */
window.loadScene = function(sceneId, triggerOnEnter = true) {
    // Если игра уже закончилась, не загружаем новые сцены (кроме сцены смерти)
    if (window.gameState.isGameOver && sceneId !== 'player_death') {
        console.warn(`loadScene: Попытка загрузить сцену "${sceneId}" после Game Over. Игнорируется.`);
        return;
    }

    // Проверка доступности GameScenes
    if (typeof GameScenes === 'undefined' || !GameScenes) {
        console.error("GameScenes не определен! Невозможно загрузить сцену.");
        window.addGameLog("Критическая ошибка: Файл сцен не загружен.");
        // Можно добавить обработку критической ошибки, например, остановку игры
        return;
    }
    
    const scene = GameScenes[sceneId];
    if (!scene) {
        window.addGameLog(`Ошибка: Сцена с ID "${sceneId}" не найдена! Переход к сцене смерти.`);
        // Загружаем сцену смерти, если запрошенной сцены нет
        if (!window.gameState.isGameOver) { // Чтобы не вызывать бесконечную рекурсию
            window.gameState.isGameOver = true;
            window.loadScene('player_death', false); 
        }
        return;
    }

    window.gameState.currentSceneId = sceneId;
    window.addGameLog(`Загружена сцена: "${scene.name || sceneId}"`); // Используем scene.name, если есть

    // Выполняем действия, которые должны произойти при входе в сцену (если есть)
    if (triggerOnEnter && scene.onEnter && typeof scene.onEnter === 'function') {
        try {
            scene.onEnter(window.gameState.player, window.gameState.community);
        } catch (e) {
            console.error(`Ошибка при выполнении onEnter для сцены ${sceneId}:`, e);
            window.addGameLog(`Произошла ошибка в сцене "${scene.name || sceneId}".`);
        }
    }

    // Обновляем UI, убедившись, что uiManager доступен
    if (window.uiManager && typeof window.uiManager.displayGameText === 'function') {
        window.uiManager.displayGameText(scene.description);
    } else {
        console.error("uiManager.displayGameText не доступен для отображения описания сцены.");
    }

    if (window.uiManager && typeof window.uiManager.displayOptions === 'function') {
        const displayableOptions = scene.options.map(option => ({
            text: option.text,
            action: () => {
                if (window.gameState.isGameOver && sceneId !== 'player_death' && sceneId !== 'game_over_placeholder') { // Добавил плейсхолдер для общей сцены конца игры
                    return;
                }

                if (option.nextScene) {
                    window.loadScene(option.nextScene);
                } else if (option.customAction && typeof option.customAction === 'function') {
                    try {
                        option.customAction();
                    } catch (e) {
                        console.error(`Ошибка при выполнении customAction для опции:`, e);
                        window.addGameLog(`Произошла ошибка при выполнении действия.`);
                    }
                    // Обновление текущей сцены (или новой, если customAction изменил gameState.currentSceneId)
                    // false, чтобы не вызывать onEnter повторно, если это не нужно.
                    window.loadScene(window.gameState.currentSceneId, false); 
                } else {
                    console.warn("Опция не имеет nextScene и customAction или customAction не является функцией.");
                }
            }
        }));
        window.uiManager.displayOptions(displayableOptions);
    } else {
        console.error("uiManager.displayOptions не доступен для отображения опций.");
    }
    
    if (window.uiManager && typeof window.uiManager.updateAllStatus === 'function') {
        window.uiManager.updateAllStatus();
    } else {
        console.error("uiManager.updateAllStatus не доступен.");
    }

    // Проверяем условия Game Over после загрузки сцены
    if (checkGameOverConditions() && !window.gameState.isGameOver) {
        window.gameState.isGameOver = true;
        window.loadScene('player_death', false); 
    }
};

/**
 * Проверяет условия завершения игры (Game Over).
 * Возвращает true, если игра должна закончиться.
 */
function checkGameOverConditions() {
    const player = window.gameState.player;
    const community = window.gameState.community;

    if (!player || !community) {
        console.warn("checkGameOverConditions: player или community не инициализированы.");
        return false; 
    }

    // Логирование для отладки
    // console.log(`[DEBUG] checkGameOverConditions: Player Health: ${player.health}, Community Survivors: ${community.survivors}, Shelter Level: ${community.facilities.shelter_level}`);

    if (player.health <= 0) {
        window.addGameLog('Ваше здоровье иссякло. Вы не смогли больше бороться. Это конец вашего пути.');
        return true; 
    }
    
    if (community.survivors <= 0) { // Если все в общине погибли (включая игрока, если он считается частью survivors)
        window.addGameLog('Ваша община полностью истреблена. Вы остались в одиночестве.');
        return true;
    }
    // Другие условия, например, если убежище разрушено и нет выживших (кроме игрока)
    // if (community.survivors <= 1 && community.facilities.shelter_level === 0) { 
    // window.addGameLog('Ваше убежище разрушено, а община погибла. Вы остались один, без надежды на восстановление.');
    // return true; 
    // }

    return false;
}

/**
 * Функция для перехода к следующему игровому дню (ежедневный цикл).
 */
window.nextGameDay = function() {
    if (window.gameState.isGameOver) {
        window.addGameLog('Игра окончена. Нельзя перейти к следующему дню.');
        return;
    }

    window.gameState.gameDay++;
    window.addGameLog(`Наступил день ${window.gameState.gameDay}.`);

    if (window.gameState.player && typeof window.gameState.player.passDay === 'function') {
        window.gameState.player.passDay();
    } else {
        console.error("Player.passDay не найден или не является функцией.");
    }

    if (window.gameState.community && typeof window.gameState.community.passDay === 'function') {
        window.gameState.community.passDay();
    } else {
        console.error("Community.passDay не найден или не является функцией.");
    }

    if (window.explorationManager && typeof window.explorationManager.explore === 'function') {
        // window.explorationManager.explore(window.gameState.currentSceneId); // Реши, когда это вызывать
    } else {
        // console.error("ExplorationManager не инициализирован или не имеет метода explore.");
    }

    if (window.uiManager && typeof window.uiManager.updateAllStatus === 'function') {
        window.uiManager.updateAllStatus();
    } else {
        console.error("UIManager.updateAllStatus не найден или не является функцией.");
    }

    if (checkGameOverConditions() && !window.gameState.isGameOver) {
        window.gameState.isGameOver = true;
        window.loadScene('player_death', false); 
        return; 
    }
    
    // Обычно после nextGameDay следует загрузка какой-то "домашней" или базовой сцены,
    // или обновление текущей, если логика игры это подразумевает.
    // Например, вернуться в убежище:
    // window.loadScene('shelter_scene_id', false); 
    // Или просто обновить текущую сцену, если nextGameDay не меняет локацию:
    window.loadScene(window.gameState.currentSceneId, false);
};


// Загружаем DOM перед инициализацией скриптов
document.addEventListener('DOMContentLoaded', () => {
    // ИСПРАВЛЕННАЯ ПРОВЕРКА UIManager
    if (typeof window.uiManager !== 'undefined' && typeof window.uiManager.init === 'function') {
        window.uiManager.init(); 
        window.addGameLog('Игра загружена! UIManager инициализирован.'); // Изменено сообщение для ясности
    } else {
        console.error("window.uiManager не загружен, не определен или не имеет метода init. Убедитесь, что uiManager.js подключен корректно и до main.js, и что он определяет window.uiManager с методом init.");
        // Попытка инициализировать лог напрямую, если uiManager не работает, чтобы видеть ошибки
        const logEl = document.getElementById('game-log');
        if (logEl) {
            const p = document.createElement('p');
            p.textContent = "КРИТИЧЕСКАЯ ОШИБКА: UIManager не удалось инициализировать!";
            p.style.color = "red";
            logEl.prepend(p);
        }
        return; // Прекращаем выполнение, если UI Manager не доступен
    }

    const gameVersionElement = document.getElementById('game-version');
    if (gameVersionElement) {
        gameVersionElement.textContent = `Версия: ${GAME_VERSION}`;
    } else {
        console.warn("Элемент 'game-version' не найден для отображения версии игры.");
    }

    // Инициализируем игровые объекты
    if (typeof Player !== 'undefined') {
        window.gameState.player = new Player();
        console.log("[DEBUG] Player initialized:", window.gameState.player);
    } else {
        console.error("Класс Player не определен. Убедитесь, что player.js подключен и определяет Player.");
        window.addGameLog("Ошибка: Не удалось инициализировать игрока.");
        return;
    }
    if (typeof Community !== 'undefined') {
        window.gameState.community = new Community();
        console.log("[DEBUG] Community initialized:", window.gameState.community);
    } else {
        console.error("Класс Community не определен. Убедитесь, что community.js подключен и определяет Community.");
        window.addGameLog("Ошибка: Не удалось инициализировать общину.");
        return;
    }

    // Инициализируем менеджеры
    if (typeof CraftingManager !== 'undefined') {
        window.craftingManager = new CraftingManager();
    } else {
        console.error("Класс CraftingManager не определен. Убедитесь, что craftingManager.js подключен.");
    }

    if (typeof FactionManager !== 'undefined') {
        window.factionManager = new FactionManager();
        if (typeof window.factionManager.initFactions === 'function') {
            window.factionManager.initFactions();
        } else {
            console.error("Метод FactionManager.initFactions не найден.");
        }
    } else {
        console.error("Класс FactionManager не определен. Убедитесь, что factionManager.js подключен.");
    }

    if (typeof CombatManager !== 'undefined') {
        window.combatManager = new CombatManager();
    } else {
        console.error("Класс CombatManager не определен. Убедитесь, что combatManager.js подключен.");
    }
    
    if (typeof ExplorationManager !== 'undefined') {
        window.explorationManager = new ExplorationManager();
    } else {
        console.error("Класс ExplorationManager не определен. Убедитесь, что explorationManager.js подключен.");
    }

    if (typeof InventoryManager !== 'undefined') {
        window.inventoryManager = new InventoryManager();
        // inventoryManager может потребовать uiManager для обновления UI сразу после инициализации
        // или gameState.player / gameState.community
    } else {
        console.error("Класс InventoryManager не определен. Убедитесь, что inventoryManager.js подключен.");
    }

    // Запускаем первую сцену после полной инициализации
    if (typeof GameScenes !== 'undefined') {
        window.loadScene(window.gameState.currentSceneId);
    } else {
        console.error("Объект GameScenes не определен. Убедитесь, что scenes.js подключен и определяет GameScenes.");
        window.addGameLog("Критическая ошибка: Сцены игры не загружены. Невозможно начать игру.");
    }
});
