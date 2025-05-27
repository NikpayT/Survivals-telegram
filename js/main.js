// js/main.js - Основной файл для инициализации игры и управления глобальным состоянием

// Глобальная переменная для версии игры
const GAME_VERSION = "0.0.2"; // Пример инкремента версии после правок

// Глобальный объект для хранения состояния игры
// Доступен по всему приложению через window.gameState
window.gameState = {
    player: null,    // Экземпляр класса Player
    community: null, // Экземпляр класса Community
    factions: {},    // Репутация с фракциями (будет заполнена FactionManager)
    currentSceneId: 'abandoned_building_start', // ID начальной сцены
    gameDay: 1,      // Текущий игровой день
    gameLog: [],     // Игровой лог (в основном управляется UIManager)
    isGameOver: false, // Флаг для отслеживания состояния Game Over
};

// --- Основные глобальные функции игры ---

/**
 * Добавляет сообщение в игровой лог. Обертка вокруг window.uiManager.addGameLog.
 * @param {string} message - Сообщение для добавления.
 */
window.addGameLog = function(message) {
    // Проверяем gameState на существование перед доступом к isGameOver
    if (window.gameState && window.gameState.isGameOver) {
        // Если игра окончена, разрешаем только "смертельные" сообщения
        const isDeathMessage = message && (message.includes('погибли') || message.includes('здоровье иссякло') || message.includes('община погибла'));
        if (!isDeathMessage) {
            // console.log(`[GAME OVER LOG BLOCKED] ${message}`); // Для отладки
            return;
        }
    }

    if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
        window.uiManager.addGameLog(message);
    } else {
        console.warn(`[FALLBACK LOG] UIManager или его метод addGameLog не готовы. Сообщение: ${message}`);
        // Можно добавить вывод в какой-нибудь простой DOM элемент, если лог критичен на ранних этапах
    }
};

/**
 * Загружает и отображает новую сцену.
 * @param {string} sceneId - ID сцены для загрузки.
 * @param {boolean} triggerOnEnter - Вызывать ли onEnter для сцены. По умолчанию true.
 */
window.loadScene = function(sceneId, triggerOnEnter = true) {
    if (window.gameState.isGameOver && sceneId !== 'player_death' && sceneId !== 'game_over_placeholder') { // Убедитесь, что 'game_over_placeholder' существует, если используется
        console.warn(`loadScene: Попытка загрузить сцену "${sceneId}" после Game Over. Игнорируется.`);
        return;
    }

    if (typeof GameScenes === 'undefined' || !GameScenes) {
        console.error("GameScenes не определен! Невозможно загрузить сцену.");
        window.addGameLog("Критическая ошибка: Файл сцен не загружен. Игра не может продолжаться.");
        // Здесь можно предпринять действия для полной остановки игры или отображения критической ошибки
        window.gameState.isGameOver = true; // Предотвращаем дальнейшие действия
        return;
    }
    
    const scene = GameScenes[sceneId];
    if (!scene) {
        window.addGameLog(`Ошибка: Сцена с ID "${sceneId}" не найдена! Переход к стандартной сцене Game Over.`);
        if (!window.gameState.isGameOver) { 
            window.gameState.isGameOver = true;
            // Убедитесь, что сцена 'player_death' всегда существует, чтобы избежать бесконечного цикла, если и она не найдена
            if (GameScenes['player_death']) {
                window.loadScene('player_death', false); 
            } else {
                console.error("Критическая ошибка: Сцена 'player_death' не найдена! Невозможно корректно завершить игру.");
                if (window.uiManager) window.uiManager.displayGameText("Критическая ошибка: Файлы игры повреждены. Сцена завершения игры не найдена.");
            }
        } else if (sceneId !== 'player_death' && GameScenes['player_death']){
             // Если уже game over и пытаемся загрузить что-то, кроме существующей сцены смерти
             console.warn(`loadScene: Уже Game Over, и сцена "${sceneId}" не найдена. Загрузка 'player_death'.`);
             window.loadScene('player_death', false);
        }
        return;
    }

    window.gameState.currentSceneId = sceneId;
    window.addGameLog(`Загружена сцена: "${scene.name || sceneId}"`);

    if (triggerOnEnter && scene.onEnter && typeof scene.onEnter === 'function') {
        try {
            scene.onEnter(window.gameState.player, window.gameState.community);
        } catch (e) {
            console.error(`Ошибка при выполнении onEnter для сцены ${sceneId}:`, e);
            window.addGameLog(`Произошла внутренняя ошибка в сцене "${scene.name || sceneId}".`);
        }
    }

    if (window.uiManager && typeof window.uiManager.displayGameText === 'function') {
        window.uiManager.displayGameText(scene.description);
    } else {
        console.error("uiManager.displayGameText не доступен для отображения описания сцены.");
    }

    if (window.uiManager && typeof window.uiManager.displayOptions === 'function') {
        // Проверяем, есть ли опции, или это терминальная сцена
        const availableOptions = (scene.options && scene.options.length > 0) ? scene.options : [];
        
        const displayableOptions = availableOptions.map(option => ({
            text: option.text,
            action: () => {
                // Дополнительная проверка на game over перед выполнением действия, если сцена не является сценой конца игры
                if (window.gameState.isGameOver && sceneId !== 'player_death' && sceneId !== 'game_over_placeholder') {
                    window.addGameLog("Действие отменено: игра окончена.");
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
                    // Обновляем текущую сцену (или новую, если customAction изменил gameState.currentSceneId)
                    // false, чтобы не вызывать onEnter повторно, если это не специальное намерение.
                    window.loadScene(window.gameState.currentSceneId, false); 
                } else {
                    console.warn("Опция не имеет nextScene и customAction, или customAction не является функцией.");
                    // Можно обновить текущую сцену, если это подразумевается (например, опция "Осмотреться")
                    // window.loadScene(window.gameState.currentSceneId, false); 
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

    // Проверяем условия Game Over после загрузки сцены и выполнения onEnter
    // Делаем это здесь, чтобы onEnter мог привести к game over
    if (checkGameOverConditions() && !window.gameState.isGameOver) {
        window.gameState.isGameOver = true; // Устанавливаем флаг
        window.addGameLog("Условия Game Over выполнены."); // Логируем причину до перехода на сцену смерти
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

    // Если игрок или община еще не инициализированы, игра не может быть окончена по их состоянию
    if (!player || !community) {
        // console.warn("checkGameOverConditions: player или community не инициализированы на момент проверки.");
        return false; 
    }

    if (player.health <= 0) {
        window.addGameLog('Ваше здоровье иссякло. Вы не смогли больше бороться. Это конец вашего пути.');
        return true; 
    }
    
    if (community.survivors <= 0) {
        window.addGameLog('Ваша община полностью истреблена. Вы остались в одиночестве.');
        return true;
    }
    // Добавьте другие условия завершения игры здесь
    // Например:
    // if (community.facilities.shelter_level === 0 && community.survivors <= 1) { 
    //    window.addGameLog('Убежище разрушено, и вы остались последним выжившим без надежды на восстановление.');
    //    return true; 
    // }

    return false;
}

/**
 * Функция для перехода к следующему игровому дню.
 */
window.nextGameDay = function() {
    if (window.gameState.isGameOver) {
        window.addGameLog('Игра окончена. Нельзя перейти к следующему дню.');
        return;
    }

    window.gameState.gameDay++;
    window.addGameLog(`Наступил день ${window.gameState.gameDay}.`);

    // Обработка событий конца дня для игрока
    if (window.gameState.player && typeof window.gameState.player.passDay === 'function') {
        window.gameState.player.passDay();
    } else {
        console.error("Player.passDay не найден или не является функцией.");
    }

    // Обработка событий конца дня для общины
    if (window.gameState.community && typeof window.gameState.community.passDay === 'function') {
        window.gameState.community.passDay();
    } else {
        console.error("Community.passDay не найден или не является функцией.");
    }

    // Пример вызова логики исследования, если это происходит в конце дня
    // if (window.explorationManager && typeof window.explorationManager.dailyUpdate === 'function') {
    //     window.explorationManager.dailyUpdate(); 
    // }

    // Обновление всего UI
    if (window.uiManager && typeof window.uiManager.updateAllStatus === 'function') {
        window.uiManager.updateAllStatus();
    } else {
        console.error("UIManager.updateAllStatus не найден или не является функцией.");
    }

    // Проверка Game Over после событий нового дня
    if (checkGameOverConditions() && !window.gameState.isGameOver) {
        window.gameState.isGameOver = true;
        window.loadScene('player_death', false); 
        return; 
    }
    
    // Перезагрузка текущей сцены (или базовой сцены, например, убежища)
    // Это важно, чтобы отразить изменения состояния (например, если день влияет на описание сцены или опции)
    // Используем false, чтобы не вызывать onEnter, если это не нужно (onEnter для смены дня нетипичен)
    // Если у вас есть "домашняя" сцена, куда игрок возвращается, используйте ее ID.
    window.loadScene(window.gameState.currentSceneId, false); 
};


// Инициализация игры после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация UIManager (критически важен для логирования и отображения)
    if (typeof window.uiManager !== 'undefined' && typeof window.uiManager.init === 'function') {
        try {
            window.uiManager.init(); 
             // window.addGameLog теперь будет работать корректно
            window.addGameLog('Игра загружена! UIManager инициализирован.');
        } catch (e) {
            console.error("Критическая ошибка при инициализации UIManager:", e);
            alert("Критическая ошибка: Не удалось инициализировать интерфейс игры. Проверьте консоль.");
            return; // Прекращаем выполнение, если UI Manager не работает
        }
    } else {
        console.error("window.uiManager не загружен, не определен или не имеет метода init. Убедитесь, что uiManager.js подключен корректно и ДО main.js.");
        alert("Критическая ошибка: Файл uiManager.js не загружен. Игра не может запуститься.");
        return; 
    }

    // Отображение версии игры
    const gameVersionElement = document.getElementById('game-version');
    if (gameVersionElement) {
        gameVersionElement.textContent = `Версия: ${GAME_VERSION}`;
    } else {
        console.warn("Элемент #game-version не найден для отображения версии игры.");
    }

    // 2. Инициализация игровых сущностей (Player, Community)
    try {
        if (typeof Player !== 'undefined') {
            window.gameState.player = new Player();
            console.log("[INIT] Player initialized:", window.gameState.player);
        } else {
            throw new Error("Класс Player не определен. Убедитесь, что player.js подключен.");
        }
        if (typeof Community !== 'undefined') {
            window.gameState.community = new Community();
            console.log("[INIT] Community initialized:", window.gameState.community);
        } else {
            throw new Error("Класс Community не определен. Убедитесь, что community.js подключен.");
        }
    } catch (e) {
        console.error("Ошибка инициализации игровых сущностей:", e);
        window.addGameLog(`Критическая ошибка: ${e.message} Не удалось инициализировать основные компоненты игры.`);
        return;
    }
    

    // 3. Инициализация игровых менеджеров
    // Каждый менеджер оборачиваем в try-catch для изоляции возможных ошибок при инициализации
    try {
        if (typeof CraftingManager !== 'undefined') {
            window.craftingManager = new CraftingManager();
            console.log("[INIT] CraftingManager initialized.");
        } else console.warn("Класс CraftingManager не определен.");
    } catch (e) { console.error("Ошибка инициализации CraftingManager:", e); }

    try {
        if (typeof FactionManager !== 'undefined') {
            window.factionManager = new FactionManager();
            if (typeof window.factionManager.initFactions === 'function') {
                window.factionManager.initFactions();
            } else {
                 console.warn("Метод FactionManager.initFactions не найден, если он необходим.");
            }
            console.log("[INIT] FactionManager initialized.");
        } else console.warn("Класс FactionManager не определен.");
    } catch (e) { console.error("Ошибка инициализации FactionManager:", e); }

    try {
        if (typeof CombatManager !== 'undefined') {
            window.combatManager = new CombatManager();
            console.log("[INIT] CombatManager initialized.");
        } else console.warn("Класс CombatManager не определен.");
    } catch (e) { console.error("Ошибка инициализации CombatManager:", e); }
    
    try {
        if (typeof ExplorationManager !== 'undefined') {
            window.explorationManager = new ExplorationManager();
            console.log("[INIT] ExplorationManager initialized.");
        } else console.warn("Класс ExplorationManager не определен.");
    } catch (e) { console.error("Ошибка инициализации ExplorationManager:", e); }

    try {
        if (typeof InventoryManager !== 'undefined') {
            window.inventoryManager = new InventoryManager();
            console.log("[INIT] InventoryManager initialized.");
            // inventoryManager может потребовать uiManager для обновления UI сразу после инициализации
            // или gameState.player / gameState.community. Это будет сделано при первой загрузке сцены.
        } else console.warn("Класс InventoryManager не определен.");
    } catch (e) { console.error("Ошибка инициализации InventoryManager:", e); }

    // 4. Запуск первой сцены после полной инициализации всего остального
    if (typeof GameScenes !== 'undefined' && GameScenes[window.gameState.currentSceneId]) {
        window.addGameLog("Все системы инициализированы. Загрузка начальной сцены...");
        window.loadScene(window.gameState.currentSceneId);
    } else {
        console.error("Объект GameScenes не определен или начальная сцена не найдена. Убедитесь, что scenes.js подключен и определяет GameScenes, и что gameState.currentSceneId корректен.");
        window.addGameLog("Критическая ошибка: Сцены игры не загружены или начальная сцена не найдена. Невозможно начать игру.");
        if(window.uiManager) window.uiManager.displayGameText("Критическая ошибка: Файлы игры повреждены или отсутствуют. Невозможно начать игру.");
    }
});
