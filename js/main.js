// main.js - Основной файл для инициализации игры

document.addEventListener('DOMContentLoaded', () => {
    console.log('Игра загружена! Добро пожаловать в постапокалиптический мир.');

    // Получаем ссылки на основные элементы интерфейса
    const gameTextElement = document.getElementById('game-text');
    const optionsContainerElement = document.getElementById('options-container');
    const statusBarElement = document.getElementById('status-bar');

    // --- Функции для обновления интерфейса ---

    /**
     * Отображает текст в основном окне игры.
     * @param {string} text - Текст для отображения.
     */
    function displayGameText(text) {
        gameTextElement.innerHTML = text; // Используем innerHTML для поддержки базового форматирования, если потребуется
    }

    /**
     * Отображает варианты действий в виде кнопок.
     * @param {Array<Object>} options - Массив объектов { text: string, action: Function }.
     */
    function displayOptions(options) {
        optionsContainerElement.innerHTML = ''; // Очищаем предыдущие кнопки
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.classList.add('game-option-button'); // Добавляем класс для стилизации
            button.onclick = option.action;
            optionsContainerElement.appendChild(button);
        });
    }

    /**
     * Обновляет строку статуса игрока.
     * @param {Object} playerStatus - Объект с данными о статусе игрока (например, { health: 100, hunger: 50 }).
     */
    function updateStatusBar(playerStatus) {
        // Пример: Обновление строки статуса
        // Это базовая заглушка, мы доработаем её позже, когда определимся с параметрами игрока
        statusBarElement.innerHTML = `
            Здоровье: ${playerStatus.health || 100}% | Голод: ${playerStatus.hunger || 0}% | Жажда: ${playerStatus.thirst || 0}%
            `;
    }

    // --- Начальная инициализация игры ---

    // Предположим, что у нас есть некая начальная сцена или вопрос
    const initialScene = {
        text: 'Вы приходите в себя в полуразрушенном здании. Вокруг тишина, лишь ветер свистит в разбитых окнах. Вы один.',
        options: [
            { text: 'Осмотреться вокруг', action: () => handleAction('look_around') },
            { text: 'Попытаться найти выход', action: () => handleAction('find_exit') }
        ]
    };

    // Глобальный объект для хранения состояния игры (пока простой, но будет расширяться)
    window.gameState = {
        player: {
            health: 100,
            hunger: 0,
            thirst: 0,
            inventory: [],
            location: 'abandoned_building'
        },
        currentScene: null // Будет хранить текущую сцену
    };

    /**
     * Основная функция для обработки действий игрока.
     * Здесь будет основная логика игры: переход между сценами, обработка выборов.
     * @param {string} actionType - Тип действия, выбранного игроком.
     */
    function handleAction(actionType) {
        console.log(`Игрок выбрал действие: ${actionType}`);
        // Здесь будет логика для обработки выбранного действия
        // Например, переход к новой сцене или изменение состояния игрока
        switch (actionType) {
            case 'look_around':
                displayGameText('Вы осматриваетесь. Пыль, обломки. В углу виднеется тусклый силуэт, похожий на рюкзак.');
                displayOptions([
                    { text: 'Подойти к рюкзаку', action: () => handleAction('approach_backpack') },
                    { text: 'Игнорировать и искать выход', action: () => handleAction('find_exit') }
                ]);
                break;
            case 'find_exit':
                displayGameText('Вы продвигаетесь к ближайшему выходу. Дверь завалена обломками. Нужно другое место.');
                displayOptions([
                    { text: 'Искать другой выход', action: () => handleAction('search_another_exit') },
                    { text: 'Попробовать расчистить завал', action: () => handleAction('clear_debris') }
                ]);
                break;
            case 'approach_backpack':
                displayGameText('В старом рюкзаке вы находите почти пустую бутылку воды и потрёпанный нож. Инвентарь обновлён.');
                window.gameState.player.inventory.push('water_bottle', 'old_knife');
                window.gameState.player.thirst -= 10; // Небольшое снижение жажды от находки
                updateStatusBar(window.gameState.player);
                displayOptions([
                    { text: 'Искать другой выход', action: () => handleAction('search_another_exit') }
                ]);
                break;
            default:
                displayGameText('Действие не распознано. Что делать?');
                displayOptions(initialScene.options);
                break;
        }
    }


    // --- Запуск игры ---
    displayGameText(initialScene.text);
    displayOptions(initialScene.options);
    updateStatusBar(window.gameState.player); // Инициализация статуса
});
