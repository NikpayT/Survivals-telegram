// js/scenes/scenes.js

// Объект, содержащий все сцены игры
const GameScenes = {
    abandoned_building_start: {
        name: "Заброшенное здание",
        description: "Вы приходите в себя в полуразрушенном здании. Вокруг тишина, лишь ветер свистит в разбитых окнах. Вы один. В углу виднеется тусклый силуэт, похожий на рюкзак.",
        options: [
            {
                text: "Подойти к рюкзаку",
                customAction: () => {
                    window.addGameLog("Вы подходите к рюкзаку и находите несколько полезных предметов.");
                    window.gameState.player.addItem('rag', 2);
                    window.gameState.player.addItem('water_bottle', 1);
                    window.loadScene('abandoned_building_after_backpack');
                }
            },
            {
                text: "Попытаться найти выход",
                customAction: () => {
                    window.addGameLog("Вы осматриваете выход и понимаете, что он завален. Нужно искать другой путь.");
                    window.loadScene('abandoned_building_start'); // Остаемся на этой же сцене
                }
            },
            {
                text: "Проверить карманы",
                customAction: () => {
                    window.addGameLog("Вы проверяете свои карманы. Там пусто, но вы вспоминаете о своих навыках.");
                    window.loadScene('abandoned_building_start');
                }
            },
            // НОВАЯ ОПЦИЯ: Исследовать (Начать день)
            {
                text: "Исследовать окрестности (Начать день)",
                customAction: () => {
                    // Переходим к следующему дню, который запускает логику исследования и ежедневные события
                    window.nextGameDay();
                }
            },
        ]
    },

    abandoned_building_after_backpack: {
        name: "Заброшенное здание (после рюкзака)",
        description: "Рюкзак теперь пуст. Вам нужно решить, что делать дальше в этом заброшенном здании.",
        options: [
            {
                text: "Оглядеться вокруг",
                customAction: () => {
                    window.addGameLog("Вы внимательно осматриваете помещение, но ничего нового не находите.");
                    window.loadScene('abandoned_building_after_backpack');
                }
            },
            {
                text: "Попытаться найти выход",
                customAction: () => {
                    window.addGameLog("Вы осматриваете выход и понимаете, что он завален. Нужно искать другой путь.");
                    window.loadScene('abandoned_building_after_backpack'); // Остаемся на этой же сцене
                }
            },
            // НОВАЯ ОПЦИЯ: Исследовать (Начать день)
            {
                text: "Исследовать окрестности (Начать день)",
                customAction: () => {
                    // Переходим к следующему дню, который запускает логику исследования и ежедневные события
                    window.nextGameDay();
                }
            },
            // Опция для перехода в следующий день (например, отдохнуть)
            {
                text: "Отдохнуть до следующего дня",
                customAction: () => {
                    window.addGameLog("Вы решили отдохнуть. Надеемся, ночь пройдет спокойно...");
                    window.nextGameDay();
                }
            }
        ]
    },

    // Пример других сцен, если они есть. Добавьте их сюда.

    // Сцена проигрыша
    player_death: {
        name: "Конец Игры",
        description: "Ваш путь окончен. В этом суровом мире вы не смогли выжить. Ваша история заканчивается здесь.",
        options: [
            {
                text: "Начать заново",
                action: () => {
                    // Просто перезагружаем страницу для начала новой игры
                    location.reload(); 
                }
            }
        ]
    },

    // Пример новой сцены, которую можно открыть при исследовании
    old_supermarket: {
        name: "Старый Супермаркет",
        description: "Вы нашли заброшенный супермаркет. Похоже, здесь давно никто не был, но внутри может быть что-то полезное.",
        options: [
            {
                text: "Искать припасы",
                customAction: () => {
                    window.addGameLog("Вы ищете припасы в супермаркете.");
                    const player = window.gameState.player;
                    const community = window.gameState.community;
                    if (player.useStamina(15)) {
                        community.addResourceOrItem('food', Math.floor(Math.random() * 10) + 5); // От 5 до 14 еды
                        community.addResourceOrItem('water', Math.floor(Math.random() * 8) + 3); // От 3 до 10 воды
                        window.addGameLog("Вы нашли немного еды и воды.");
                    } else {
                        window.addGameLog("У вас недостаточно выносливости для поиска.");
                    }
                    window.loadScene('old_supermarket', false);
                }
            },
            {
                text: "Установить ловушки",
                customAction: () => {
                    window.addGameLog("Вы устанавливаете простые ловушки вокруг супермаркета.");
                    const community = window.gameState.community;
                    if (community.hasResource('materials', 3)) {
                        community.removeResourceOrItem('materials', 3);
                        community.changeSafety(10);
                        window.addGameLog("Безопасность общины немного повысилась.");
                    } else {
                        window.addGameLog("Не хватает материалов для установки ловушек.");
                    }
                    window.loadScene('old_supermarket', false);
                }
            },
            {
                text: "Вернуться в убежище",
                nextScene: 'abandoned_building_after_backpack' // Вернуться на базовую сцену
            },
            {
                text: "Отдохнуть до следующего дня",
                customAction: () => {
                    window.addGameLog("Вы решили отдохнуть. Надеемся, ночь пройдет спокойно...");
                    window.nextGameDay();
                }
            }
        ]
    }
};
