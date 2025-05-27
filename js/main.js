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
    if (window.gameState.isGameOver && !message.includes('погибли') && !message.includes('здоровье иссякло') && !message.includes('община погибла')) {
        // Можно добавить консольный лог для отладки
        // console.log(`[GAME OVER LOG BLOCKED] ${message}`);
        return;
    }
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
    // Если игра уже закончилась, не загружаем новые сцены (кроме сцены смерти)
    if (window.gameState.isGameOver && sceneId !== 'player_death') {
        console.warn(`loadScene: Попытка загрузить сцену "${sceneId}" после Game Over. Игнорируется.`);
        return;
    }

    const scene = GameScenes[sceneId];
    if (!scene) {
        window.addGameLog(`Ошибка: Сцена с ID "${sceneId}" не найдена! Переход к сцене смерти.`);
        // Загружаем сцену смерти, если запрошенной сцены нет
        if (!window.gameState.isGameOver) { 
            window.gameState.isGameOver = true;
            window.loadScene('player_death', false); 
        }
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
            // Если игра окончена, кнопки опций не должны работать, кроме тех, что на сцене Game Over
            if (window.gameState.isGameOver && sceneId !== 'player_death') {
                return;
            }

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

    window.uiManager.updateAllStatus(); // Убеждаемся, что статус всегда актуален

    // Проверяем условия Game Over после загрузки сцены
    // Если Game Over, устанавливаем флаг и загружаем сцену смерти один раз
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

    // Добавим логирование начальных значений для отладки
    console.log(`[DEBUG] checkGameOverConditions: Player Health: ${player.health}, Community Survivors: ${community.survivors}, Shelter Level: ${community.facilities.shelter_level}`);


    if (player.health <= 0) {
        window.addGameLog('Ваше здоровье иссякло. Вы не смогли больше бороться. Это конец вашего пути.');
        return true; 
    }
    
    // Если выживших в общине нет (кроме самого игрока) И убежище разрушено
    // community.survivors <= 1 подразумевает, что выживших 0 или 1 (сам игрок)
    // shelter_level === 0 подразумевает, что убежище разрушено
    if (community.survivors <= 1 && community.facilities.shelter_level === 0) { 
        window.addGameLog('Ваше убежище разрушено, а община погибла. Вы остались один, без надежды на восстановление.');
        return true; 
    }
    
    // Если община полностью уничтожена (нет никого, даже игрока)
    // Это условие, по сути, перекрывается первым, если игрок тоже погиб.
    // Если игрок еще жив, но община (кроме него) погибла и убежища нет.
    if (community.survivors <= 0 && community.facilities.shelter_level === 0) {
        window.addGameLog('Ваша община полностью истреблена. Вы остались в одиночестве.');
        return true;
    }


    // Если игра еще не закончилась
    return false;
}

/**
 * Функция для перехода к следующему игровому дню (ежедневный цикл).
 * Вызывается по триггеру (например, кнопка "Отдохнуть" или событие).
 */
window.nextGameDay = function() {
    // Если игра уже закончилась, не переходим к следующему дню
    if (window.gameState.isGameOver) {
        window.addGameLog('Игра окончена. Нельзя перейти к следующему дню.');
        return;
    }

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

    // Проверяем условия Game Over после всех ежедневных событий
    if (checkGameOverConditions() && !window.gameState.isGameOver) {
        window.gameState.isGameOver = true;
        window.loadScene('player_death', false); 
        return; 
    }

    // Загружаем текущую сцену заново, чтобы обновились опции
    window.loadScene(window.gameState.currentSceneId, false); // false, чтобы не вызывать onEnter снова
};


// Загружаем DOM перед инициализацией скриптов
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем UIManager первым делом!
    if (typeof UIManager !== 'undefined' && typeof window.uiManager !== 'undefined') { 
        window.uiManager.init(); 
        window.addGameLog('Игра загружена! Инициализация...');
    } else {
        console.error("UIManager не загружен или не доступен. Убедитесь, что uiManager.js подключен до main.js.");
        return; 
    }

    // Обновляем отображение версии игры
    const gameVersionElement = document.getElementById('game-version');
    if (gameVersionElement) {
        gameVersionElement.textContent = `Версия: ${GAME_VERSION}`;
    } else {
        console.warn("Элемент 'game-version' не найден для отображения версии игры.");
    }

    // Инициализируем игровые объекты
    if (typeof Player !== 'undefined') {
        window.gameState.player = new Player();
        console.log("[DEBUG] Player initialized:", window.gameState.player); // Отладочный лог
    } else {
        console.error("Класс Player не определен. Убедитесь, что player.js подключен.");
        return;
    }
    if (typeof Community !== 'undefined') {
        window.gameState.community = new Community();
        console.log("[DEBUG] Community initialized:", window.gameState.community); // Отладочный лог
    } else {
        console.error("Класс Community не определен. Убедитесь, что community.js подключен.");
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
        window.factionManager.initFactions(); 
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
    if (typeof GameScenes !== 'undefined') {
        window.loadScene(window.gameState.currentSceneId);
    } else {
        console.error("Объект GameScenes не определен. Убедитесь, что scenes.js подключен.");
    }
});
