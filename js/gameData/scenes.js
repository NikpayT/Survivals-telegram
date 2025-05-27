// js/scenes/scenes.js

// Объект, содержащий все сцены игры
const GameScenes = {
    // --- Начальные сцены ---
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
                    // Остаемся на этой же сцене, но обновляем ее состояние (если onEnter есть)
                    window.loadScene('abandoned_building_start', false); 
                }
            },
            {
                text: "Проверить карманы",
                customAction: () => {
                    window.addGameLog("Вы проверяете свои карманы. Там пусто, но вы вспоминаете о своих навыках.");
                    window.loadScene('abandoned_building_start', false);
                }
            },
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
        description: "Рюкзак теперь пуст. Вам нужно решить, что делать дальше в этом заброшенном здании. Это место может послужить временным убежищем.",
        options: [
            {
                text: "Оглядеться вокруг",
                customAction: () => {
                    window.addGameLog("Вы внимательно осматриваете помещение, но ничего нового не находите.");
                    window.loadScene('abandoned_building_after_backpack', false);
                }
            },
            {
                text: "Попытаться укрепить убежище",
                customAction: () => {
                    const community = window.gameState.community;
                    if (community.hasResource('materials', 2)) {
                        community.removeResourceOrItem('materials', 2);
                        community.facilities.shelter_level = Math.min(5, community.facilities.shelter_level + 1); // Увеличиваем уровень убежища до макс 5
                        community.changeMorale(5);
                        community.changeSafety(5);
                        window.addGameLog(`Вы улучшили убежище до уровня ${community.facilities.shelter_level}.`);
                    } else {
                        window.addGameLog("Недостаточно материалов для укрепления убежища (нужно 2 ед. материалов).");
                    }
                    window.loadScene('abandoned_building_after_backpack', false);
                }
            },
            {
                text: "Создать что-нибудь",
                customAction: () => {
                    window.addGameLog("Вы открываете меню крафта.");
                    // Возможно, здесь мы переходим в другую часть UI или всплывающее окно
                    // Пока что просто логируем и остаемся на сцене
                    window.loadScene('abandoned_building_after_backpack', false); 
                }
            },
            {
                text: "Исследовать окрестности (Начать день)",
                customAction: () => {
                    window.addGameLog("Вы отправляетесь на поиски ресурсов и новых мест...");
                    window.nextGameDay(); // Переходим к следующему дню и запускаем логику исследования
                }
            },
            {
                text: "Отдохнуть до следующего дня",
                customAction: () => {
                    window.addGameLog("Вы решили отдохнуть. Надеемся, ночь пройдет спокойно...");
                    window.nextGameDay();
                }
            }
        ]
    },

    // --- Сцены исследования / локации ---
    old_supermarket: {
        name: "Старый Супермаркет",
        description: "Вы нашли заброшенный супермаркет. Похоже, здесь давно никто не был, но внутри может быть что-то полезное. Запах гниения витает в воздухе.",
        options: [
            {
                text: "Искать припасы",
                customAction: () => {
                    window.addGameLog("Вы тщательно обыскиваете полки супермаркета.");
                    const player = window.gameState.player;
                    const community = window.gameState.community;
                    if (player.useStamina(15)) {
                        const foundFood = Math.floor(Math.random() * 10) + 5; // От 5 до 14 еды
                        const foundWater = Math.floor(Math.random() * 8) + 3; // От 3 до 10 воды
                        community.addResourceOrItem('food', foundFood);
                        community.addResourceOrItem('water', foundWater);
                        window.addGameLog(`Вы нашли ${foundFood} ед. еды и ${foundWater} ед. воды.`);
                        community.changeMorale(3);
                    } else {
                        window.addGameLog("У вас недостаточно выносливости для поиска.");
                    }
                    window.loadScene('old_supermarket', false); // Остаемся здесь
                }
            },
            {
                text: "Установить ловушки",
                customAction: () => {
                    window.addGameLog("Вы устанавливаете простые ловушки вокруг супермаркета, чтобы обезопасить его.");
                    const community = window.gameState.community;
                    if (community.hasResource('materials', 3)) {
                        community.removeResourceOrItem('materials', 3);
                        community.changeSafety(10);
                        window.addGameLog("Безопасность общины немного повысилась благодаря ловушкам.");
                    } else {
                        window.addGameLog("Не хватает материалов для установки ловушек (нужно 3 ед.).");
                    }
                    window.loadScene('old_supermarket', false);
                }
            },
            {
                text: "Отправиться на поиски других выживших",
                customAction: () => {
                    window.addGameLog("Вы решаете поискать других людей в районе супермаркета.");
                    const roll = Math.random();
                    if (roll < 0.3) { // 30% шанс найти кого-то
                        window.addGameLog("Вы встретили одинокого выжившего! Он кажется дружелюбным.");
                        community.addSurvivors(1);
                        community.changeMorale(10);
                    } else if (roll < 0.6) { // 30% шанс столкнуться с опасностью
                        window.addGameLog("Вы столкнулись с небольшой группой мародеров! Пришлось отступить.");
                        window.gameState.player.takeDamage(15);
                        community.changeMorale(-5);
                        community.changeSafety(-5);
                    } else {
                        window.addGameLog("Никого не нашли. Окрестности пусты.");
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
    },

    abandoned_hospital: {
        name: "Заброшенная Больница",
        description: "Вы нашли старую, заброшенную больницу. Здесь может быть много медикаментов, но и опасность заражения или других угроз высока.",
        onEnter: (player, community) => {
            window.addGameLog("Заходя в больницу, вы чувствуете запах лекарств и затхлости.");
            // Может быть, небольшой шанс негативного события при первом входе
            if (Math.random() < 0.1) {
                player.takeDamage(5);
                window.addGameLog("Вы наступили на что-то острое и поранились.");
            }
        },
        options: [
            {
                text: "Искать медикаменты",
                customAction: () => {
                    window.addGameLog("Вы начинаете осторожно обыскивать палаты и кабинеты.");
                    const player = window.gameState.player;
                    const community = window.gameState.community;
                    if (player.useStamina(25)) {
                        const roll = Math.random();
                        if (roll < 0.6) { // 60% шанс найти медикаменты
                            const foundMed = Math.floor(Math.random() * 5) + 1; // От 1 до 5 медикаментов
                            community.addResourceOrItem('medicine', foundMed);
                            window.addGameLog(`Вы нашли ${foundMed} ед. медикаментов.`);
                            community.changeMorale(5);
                        } else {
                            window.addGameLog("Ничего ценного не найдено, только старые бинты.");
                        }
                    } else {
                        window.addGameLog("Недостаточно выносливости для тщательного поиска.");
                    }
                    window.loadScene('abandoned_hospital', false);
                }
            },
            {
                text: "Поискать инструменты",
                customAction: () => {
                    window.addGameLog("Вы ищете хирургические инструменты и оборудование.");
                    const player = window.gameState.player;
                    const community = window.gameState.community;
                    if (player.useStamina(20)) {
                        const roll = Math.random();
                        if (roll < 0.4) { // 40% шанс найти материалы
                            const foundMat = Math.floor(Math.random() * 4) + 1;
                            community.addResourceOrItem('materials', foundMat);
                            window.addGameLog(`Вы нашли ${foundMat} ед. материалов.`);
                        } else {
                            window.addGameLog("Инструменты слишком испорчены, чтобы их использовать.");
                        }
                    } else {
                        window.addGameLog("Недостаточно выносливости.");
                    }
                    window.loadScene('abandoned_hospital', false);
                }
            },
            {
                text: "Покинуть больницу",
                nextScene: 'abandoned_building_after_backpack'
            },
            {
                text: "Отдохнуть до следующего дня",
                customAction: () => {
                    window.addGameLog("Вы решили отдохнуть. Надеемся, ночь пройдет спокойно...");
                    window.nextGameDay();
                }
            }
        ]
    },

    // --- Сцена проигрыша ---
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

    // Добавьте больше сцен здесь по мере развития игры
    // Например: ruined_city, forest_camp, military_checkpoint и т.д.
};
