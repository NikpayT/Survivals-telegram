// /js/gameData/scenes.js
// Определение всех игровых сцен (локаций, событий)

const GameScenes = {
    'abandoned_building_start': {
        id: 'abandoned_building_start',
        name: 'Разрушенное здание',
        type: 'location',
        description: 'Вы приходите в себя в полуразрушенном здании. Вокруг тишина, лишь ветер свистит в разбитых окнах. Вы один. В углу виднеется тусклый силуэт, похожий на рюкзак.',
        options: [
            { text: 'Подойти к рюкзаку', nextScene: 'approach_backpack' },
            { text: 'Попытаться найти выход', nextScene: 'search_building_exit' },
            { text: 'Проверить карманы', nextScene: 'check_pockets' }
        ],
        onEnter: (player, community) => {
            // Действия при входе в сцену (например, проверка состояния)
            // console.log('Вошли в разрушенное здание.');
        }
    },
    'approach_backpack': {
        id: 'approach_backpack',
        name: 'Рюкзак',
        type: 'event',
        description: 'В старом, потрепанном рюкзаке вы находите почти пустую бутылку воды, потрёпанный нож и несколько бинтов.',
        onEnter: (player, community) => {
            // Добавляем предметы в инвентарь игрока
            player.addItem('water_bottle', 1);
            player.addItem('old_knife', 1);
            player.addItem('bandages', 2);
            // Изменяем состояние игрока
            player.adjustThirst(-10); // Немного снижает жажду от воды
            // Обновляем статус-бар (это будет делать uiManager)
        },
        options: [
            { text: 'Осмотреть здание еще раз', nextScene: 'abandoned_building_explored' },
            { text: 'Искать выход', nextScene: 'search_building_exit' }
        ]
    },
    'check_pockets': {
        id: 'check_pockets',
        name: 'Проверка карманов',
        type: 'event',
        description: 'В ваших карманах вы находите лишь пыль и старую, помятую монету. Ничего полезного.',
        options: [
            { text: 'Осмотреться вокруг', nextScene: 'abandoned_building_start' }, // Возвращаемся к начальной сцене
            { text: 'Искать выход', nextScene: 'search_building_exit' }
        ]
    },
    'abandoned_building_explored': {
        id: 'abandoned_building_explored',
        name: 'Разрушенное здание (Осмотрено)',
        type: 'location',
        description: 'Вы уже осмотрели это место. Похоже, здесь больше ничего нет, кроме пыли и обломков. Нужно искать выход.',
        options: [
            { text: 'Искать выход', nextScene: 'search_building_exit' }
        ]
    },
    'search_building_exit': {
        id: 'search_building_exit',
        name: 'Поиск выхода',
        type: 'event',
        description: 'Вы продвигаетесь к ближайшему выходу. Дверь завалена обломками, но, кажется, есть проход через узкую щель в стене.',
        options: [
            { text: 'Попробовать пролезть через щель', nextScene: 'outside_area_entrance' },
            { text: 'Попробовать расчистить завал (требует усилий)', nextScene: 'clear_debris_attempt' } // Новая сцена с проверкой
        ]
    },
    'clear_debris_attempt': {
        id: 'clear_debris_attempt',
        name: 'Расчистка завала',
        type: 'event',
        description: 'Вы пытаетесь расчистить завал. Это тяжело и отнимает много сил...',
        onEnter: (player) => {
            player.adjustFatigue(15); // Увеличиваем усталость
            player.adjustHunger(5); // Увеличиваем голод
            player.adjustThirst(5); // Увеличиваем жажду
            // Добавим проверку на успех/неудачу
            const successChance = player.skills.strength > 10 ? 80 : 40; // Шанс зависит от силы
            if (Math.random() * 100 < successChance) {
                GameScenes.clear_debris_attempt.description += '\nВам удалось немного расчистить проход! Теперь можно выбраться.';
                GameScenes.clear_debris_attempt.options = [
                    { text: 'Выбраться наружу', nextScene: 'outside_area_entrance' }
                ];
            } else {
                GameScenes.clear_debris_attempt.description += '\nЗавал слишком велик. Вы только устали и ничего не добились.';
                GameScenes.clear_debris_attempt.options = [
                    { text: 'Искать другой выход', nextScene: 'search_building_exit' }
                ];
            }
        }
    },
    'outside_area_entrance': {
        id: 'outside_area_entrance',
        name: 'Окраина разрушенного города',
        type: 'location',
        description: 'Вы выбрались наружу. Перед вами простираются руины некогда большого города. Повсюду обломки и пыль. Вдали виднеется силуэт обвалившегося моста.',
        options: [
            { text: 'Идти к мосту', nextScene: 'collapsed_bridge' },
            { text: 'Осмотреться на окраине', nextScene: 'explore_city_outskirts' },
            { text: 'Искать ресурсы поблизости', nextScene: 'scavenge_nearby' }
        ],
        onEnter: (player) => {
            player.currentLocation = 'outside_area_entrance';
        }
    },
    'collapsed_bridge': {
        id: 'collapsed_bridge',
        name: 'Обвалившийся мост',
        type: 'location',
        description: 'Мост обвалился, пересечь реку здесь невозможно. Вокруг много обломков и мусора. Кажется, кто-то здесь недавно проходил.',
        options: [
            { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' },
            { text: 'Обыскать завалы моста', nextScene: 'search_bridge_rubble' }
        ],
        onEnter: (player) => {
            player.currentLocation = 'collapsed_bridge';
        }
    },
    'search_bridge_rubble': {
        id: 'search_bridge_rubble',
        name: 'Обыск завалов моста',
        type: 'event',
        description: 'Вы пробираетесь сквозь обломки. Среди арматуры и бетона находите несколько металлических обломков и ржавую банку консервов. Внезапно, вы слышите странные звуки из-за угла... Что это?',
        onEnter: (player) => {
            player.addItem('scraps_metal', 3);
            player.addItem('canned_food', 1);
            player.adjustHunger(-15); // Еда немного утоляет голод
            player.adjustFatigue(10); // Обыск утомляет
            // Возможность столкновения с мутантом
            if (Math.random() < 0.3) { // 30% шанс на столкновение
                GameScenes.search_bridge_rubble.options = [
                    { text: 'Приготовиться к бою', nextScene: 'combat_mutant_bridge' },
                    { text: 'Попробовать скрыться', nextScene: 'flee_mutant_bridge' }
                ];
                GameScenes.search_bridge_rubble.description += '\n\n**Опасность! Вы замечаете движущийся силуэт!**';
            } else {
                GameScenes.search_bridge_rubble.options = [
                    { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
                ];
            }
        }
    },
    'combat_mutant_bridge': {
        id: 'combat_mutant_bridge',
        name: 'Бой с мутантом',
        type: 'combat',
        description: 'Из-за груды мусора выскакивает мерзкий, быстро движущийся мутант! Он бросается на вас!',
        // Здесь должна быть логика боя, пока заглушка
        onEnter: (player) => {
            let playerDamage = player.getEffectiveDamage();
            let mutantHealth = 50; // Пример здоровья мутанта
            let combatLog = [];

            combatLog.push(`Вы атаковали мутанта! Нанесли ${playerDamage} урона.`);
            mutantHealth -= playerDamage;

            if (mutantHealth <= 0) {
                combatLog.push('Мутант повержен!');
                player.adjustHealth(5); // Небольшое восстановление за победу
                GameScenes.combat_mutant_bridge.options = [
                    { text: 'Обыскать мутанта (мало что найдете)', nextScene: 'search_mutant_corpse' },
                    { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
                ];
            } else {
                let mutantDamage = 15; // Урон от мутанта
                player.adjustHealth(-mutantDamage);
                combatLog.push(`Мутант атаковал вас! Получено ${mutantDamage} урона. Ваше здоровье: ${player.health}`);

                if (player.health <= 0) {
                    combatLog.push('Вы пали в бою. Это конец...');
                    GameScenes.combat_mutant_bridge.options = [{ text: 'Начать заново', nextScene: 'game_over' }];
                } else {
                    combatLog.push('Продолжаете бой...');
                    GameScenes.combat_mutant_bridge.options = [
                        { text: 'Снова атаковать', nextScene: 'combat_mutant_bridge' },
                        { text: 'Попробовать отступить', nextScene: 'flee_mutant_bridge' }
                    ];
                }
            }
            GameScenes.combat_mutant_bridge.description = `\n${combatLog.join('\n')}\n`;
        }
    },
    'flee_mutant_bridge': {
        id: 'flee_mutant_bridge',
        name: 'Попытка бегства',
        type: 'event',
        description: 'Вы пытаетесь оторваться от мутанта...',
        onEnter: (player) => {
            player.adjustFatigue(10);
            if (Math.random() < 0.6) { // 60% шанс на успех
                GameScenes.flee_mutant_bridge.description += 'Вам удалось оторваться! Вы тяжело дышите, но целы.';
                GameScenes.flee_mutant_bridge.options = [
                    { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
                ];
            } else {
                GameScenes.flee_mutant_bridge.description += 'Мутант настигает вас! Вы не смогли убежать.';
                player.adjustHealth(-20); // Урон при неудачной попытке
                GameScenes.flee_mutant_bridge.options = [
                    { text: 'Приготовиться к бою', nextScene: 'combat_mutant_bridge' }
                ];
            }
        }
    },
    'search_mutant_corpse': {
        id: 'search_mutant_corpse',
        name: 'Обыск мутанта',
        type: 'event',
        description: 'Вы осматриваете останки мутанта. Мерзкое зрелище. Ничего ценного, кроме нескольких кусочков "мяса". Возможно, пригодится...',
        onEnter: (player) => {
            player.addItem('mutant_meat', 1); // Предполагаем, что есть такой предмет
        },
        options: [
            { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
        ]
    },
    'explore_city_outskirts': {
        id: 'explore_city_outskirts',
        name: 'Исследование окраины',
        type: 'location',
        description: 'Вы исследуете ближайшие к выходу из здания улицы. Повсюду развалины магазинов и жилых домов. Можно попробовать обыскать их.',
        options: [
            { text: 'Обыскать ближайший магазин', nextScene: 'scavenge_shop' },
            { text: 'Осмотреть жилые дома', nextScene: 'scavenge_houses' },
            { text: 'Вернуться к выходу из здания', nextScene: 'outside_area_entrance' }
        ],
        onEnter: (player) => {
            player.currentLocation = 'explore_city_outskirts';
        }
    },
    'scavenge_nearby': {
        id: 'scavenge_nearby',
        name: 'Поиск ресурсов поблизости',
        type: 'event',
        description: 'Вы уделяете время тщательному обыску ближайшей местности. Чаще всего находите лишь мусор, но иногда попадается и что-то полезное.',
        onEnter: (player) => {
            player.adjustFatigue(10);
            player.adjustHunger(5);
            player.adjustThirst(5);

            let foundItems = [];
            if (Math.random() < 0.4) { // 40% шанс найти что-то
                let randomItem = ['scraps_metal', 'scraps_wood', 'cloth_scraps', 'canned_food', 'water_bottle'][Math.floor(Math.random() * 5)];
                let quantity = Math.floor(Math.random() * 3) + 1;
                player.addItem(randomItem, quantity);
                foundItems.push(`${GameItems[randomItem].name} (x${quantity})`);
            }

            if (foundItems.length > 0) {
                GameScenes.scavenge_nearby.description = `Вы нашли: ${foundItems.join(', ')}.`;
            } else {
                GameScenes.scavenge_nearby.description = 'К сожалению, ничего ценного найти не удалось, лишь мусор. Зря потратили время.';
            }
        },
        options: [
            { text: 'Продолжить поиск в этой зоне', nextScene: 'scavenge_nearby' },
            { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
        ]
    },

    // --- Место для будущих локаций и событий ---
    'player_death': {
        id: 'player_death',
        name: 'Смерть',
        type: 'game_over',
        description: 'Ваш путь окончен. Вы не смогли выжить в этом суровом мире. Возможно, в следующий раз удача будет на вашей стороне.',
        options: [
            { text: 'Начать новую игру', nextScene: 'game_start_new' }
        ]
    },
    'game_start_new': {
        id: 'game_start_new',
        name: 'Новая игра',
        type: 'system',
        description: 'Начинается новый день в постапокалиптическом мире...',
        onEnter: (player, community) => {
            // Перезагрузка страницы или сброс состояния игры
            location.reload();
        },
        options: []
    }
    // ... другие сцены
};
