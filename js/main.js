// main.js - Основной файл для инициализации игры и управления глобальным состоянием

// Глобальный объект для хранения состояния игры
// Доступен по всему приложению через window.gameState
window.gameState = {
    player: null,    // Экземпляр класса Player
    community: null, // Экземпляр класса Community
    currentSceneId: 'abandoned_building_start', // ID текущей сцены
    // Здесь можно добавить другие глобальные состояния, например, игровой день
    gameDay: 1
};

// Загружаем DOM перед инициализацией скриптов
document.addEventListener('DOMContentLoaded', () => {
    console.log('Игра загружена! Инициализация...');

    // Инициализируем игровые объекты
    window.gameState.player = new Player();
    window.gameState.community = new Community();

    // Запускаем UIManager (он будет отвечать за обновление HTML)
    // Важно: uiManager должен быть инициализирован после player и community
    // и после того, как все GameScenes, GameItems и т.д. загружены.
    // Его определение будет в файле uiManager.js
    window.uiManager.init();

    // --- Основные функции игры ---

    /**
     * Загружает и отображает новую сцену.
     * @param {string} sceneId - ID сцены для загрузки.
     */
    window.loadScene = function(sceneId) {
        const scene = GameScenes[sceneId];
        if (!scene) {
            console.error(`Сцена с ID "${sceneId}" не найдена!`);
            // Переход к сцене ошибки или game over
            window.loadScene('player_death');
            return;
        }

        window.gameState.currentSceneId = sceneId;
        console.log(`Загружена сцена: ${scene.name} (ID: ${sceneId})`);

        // Выполняем действия, которые должны произойти при входе в сцену (если есть)
        if (scene.onEnter) {
            scene.onEnter(window.gameState.player, window.gameState.community);
        }

        // Обновляем UI
        window.uiManager.displayGameText(scene.description);
        window.uiManager.displayOptions(scene.options.map(option => ({
            text: option.text,
            // Действие кнопки - загрузить следующую сцену
            action: () => window.loadScene(option.nextScene)
        })));

        // Проверяем условия Game Over после загрузки сцены (например, если здоровье упало до 0)
        checkGameOverConditions();
    };

    /**
     * Проверяет условия завершения игры (Game Over).
     */
    function checkGameOverConditions() {
        if (window.gameState.player.health <= 0) {
            window.uiManager.displayGameText('Ваше здоровье иссякло. Вы не смогли больше бороться. Это конец вашего пути.');
            window.uiManager.displayOptions([{ text: 'Начать новую игру', action: () => window.loadScene('game_start_new') }]);
            // Дополнительная логика для Game Over
            console.log('GAME OVER: Игрок погиб.');
        }
        // Можно добавить другие условия Game Over, например, если сообщество уничтожено
        if (window.gameState.community.survivors <= 0 && window.gameState.player.health > 0) {
            window.uiManager.displayGameText('Ваше убежище разрушено, а община погибла. Вы остались один, без надежды на восстановление.');
            window.uiManager.displayOptions([{ text: 'Начать новую игру', action: () => window.loadScene('game_start_new') }]);
            console.log('GAME OVER: Община уничтожена.');
        }
    }

    /**
     * Функция для перехода к следующему игровому дню (ежедневный цикл).
     * Будет вызываться по триггеру (например, кнопка "Отдохнуть" или событие).
     */
    window.nextGameDay = function() {
        window.gameState.gameDay++;
        console.log(`Начался день ${window.gameState.gameDay}`);

        // Ежедневное потребление ресурсов общиной
        window.gameState.community.dailyConsumption();

        // Ежедневные потребности игрока (голод, жажда, усталость увеличиваются)
        window.gameState.player.adjustHunger(10);
        window.gameState.player.adjustThirst(15);
        window.gameState.player.adjustFatigue(20);

        // Проверка на последствия голода/жажды для игрока
        if (window.gameState.player.hunger >= 90) {
            window.gameState.player.adjustHealth(-5); // Начинаем терять здоровье от сильного голода
            window.uiManager.addMessageToLog('Вы очень голодны и чувствуете слабость.');
        }
        if (window.gameState.player.thirst >= 90) {
            window.gameState.player.adjustHealth(-10); // Теряем больше здоровья от сильной жажды
            window.uiManager.addMessageToLog('Вас мучает жажда, силы покидают вас.');
        }
        if (window.gameState.player.fatigue >= 100) {
            window.gameState.player.adjustHealth(-3); // Теряем здоровье от крайней усталости
            window.uiManager.addMessageToLog('Вы измотаны. Вам срочно нужен отдых.');
        }

        // Обновляем UI
        window.uiManager.updateAllStatus();
        window.uiManager.displayGameText(`Наступил день ${window.gameState.gameDay}. Ваши основные потребности усилились.`);

        // В будущем здесь можно добавить случайные события для нового дня
        // currentSceneId не меняем, игрок остается на той же локации, если не выбрал действие.
    };


    // --- Инициализация интерфейса и загрузка первой сцены ---
    // Убедимся, что все элементы UI доступны перед первой загрузкой сцены
    window.uiManager.updateAllStatus(); // Обновляем статус-бар при старте
    window.loadScene(window.gameState.currentSceneId); // Загружаем начальную сцену
});
