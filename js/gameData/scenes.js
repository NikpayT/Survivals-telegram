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
        }
    },
    'approach_backpack': {
        id: 'approach_backpack',
        name: 'Рюкзак',
        type: 'event',
        description: 'В старом, потрепанном рюкзаке вы находите почти пустую бутылку воды, потрёпанный нож и несколько бинтов. Также вы находите старые рваные штаны и грязную куртку (снаряжение).',
        onEnter: (player, community) => {
            player.addItem('water_bottle', 1);
            player.addItem('old_knife', 1);
            player.addItem('bandages', 2);
            player.addItem('ragged_clothes', 1); // Добавим рваную одежду как предмет брони
            player.adjustThirst(-10);
            window.addGameLog('Вы нашли: Бутылка воды, Старый нож, Бинты, Рваная одежда.');
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
            { text: 'Осмотреться вокруг', nextScene: 'abandoned_building_start' },
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
            { text: 'Попробовать расчистить завал (требует усилий)', nextScene: 'clear_debris_attempt' }
        ]
    },
    'clear_debris_attempt': {
        id: 'clear_debris_attempt',
        name: 'Расчистка завала',
        type: 'event',
        description: 'Вы пытаетесь расчистить завал. Это тяжело и отнимает много сил...',
        onEnter: (player) => {
            player.adjustFatigue(15);
            player.adjustHunger(5);
            player.adjustThirst(5);
            player.gainSkillExp('strength', 1); // Повышаем навык силы

            const successChance = player.skills.strength * 5; // Шанс зависит от силы
            if (Math.random() * 100 < successChance) {
                GameScenes.clear_debris_attempt.description += '\nВам удалось немного расчистить проход! Теперь можно выбраться.';
                GameScenes.clear_debris_attempt.options = [
                    { text: 'Выбраться наружу', nextScene: 'outside_area_entrance' }
                ];
                window.addGameLog('Вы успешно расчистили завал.');
            } else {
                GameScenes.clear_debris_attempt.description += '\nЗавал слишком велик. Вы только устали и ничего не добились.';
                GameScenes.clear_debris_attempt.options = [
                    { text: 'Искать другой выход', nextScene: 'search_building_exit' }
                ];
                window.addGameLog('Не удалось расчистить завал. Вы устали.');
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
            { text: 'Искать ресурсы поблизости', nextScene: 'scavenge_nearby' },
            { text: 'Попытаться найти безопасное место для ночлега', nextScene: 'find_shelter_area' } // Новая опция
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
        description: 'Вы пробираетесь сквозь обломки. Среди арматуры и бетона находите несколько металлических обломков и ржавую банку консервов.',
        onEnter: (player) => {
            player.addItem('scraps_metal', 3);
            player.addItem('canned_food', 1);
            player.adjustHunger(-15);
            player.adjustFatigue(10);
            player.gainSkillExp('scavenging', 1); // Опыт за поиск

            // Возможность столкновения с мутантом
            if (Math.random() < 0.3) { // 30% шанс на столкновение
                window.addGameLog('**ОПАСНОСТЬ! Вы замечаете движущийся силуэт!**');
                GameScenes.search_bridge_rubble.description += '\n\nИз-за груды мусора выскакивает мерзкий, быстро движущийся мутант! Он бросается на вас!';
                GameScenes.search_bridge_rubble.options = [
                    { text: 'Приготовиться к бою', customAction: () => {
                        window.combatManager.startCombat(
                            { name: 'Мелкий мутант', health: 40, damage: 10 },
                            (result) => {
                                if (result === 'win') {
                                    window.loadScene('mutant_defeated_bridge');
                                } else if (result === 'flee') {
                                    window.loadScene('flee_successful_bridge');
                                } else {
                                    window.loadScene('player_death'); // Если проиграли
                                }
                            }
                        );
                    }},
                    { text: 'Попробовать скрыться', customAction: () => {
                        window.combatManager.attemptFlee(
                            { name: 'Мелкий мутант', health: 40, damage: 10 }, // Передаем врага для логики урона при неудаче
                            (result) => {
                                if (result === 'flee') {
                                    window.loadScene('flee_successful_bridge');
                                } else if (result === 'lose') {
                                    window.loadScene('player_death');
                                } else { // Если не удалось сбежать и пришлось драться
                                    window.loadScene('combat_mutant_bridge');
                                }
                            }
                        );
                    }}
                ];
            } else {
                window.addGameLog('Обыск прошел без происшествий.');
                GameScenes.search_bridge_rubble.options = [
                    { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
                ];
            }
        },
        options: [
            // Опции будут динамически изменяться в onEnter
        ]
    },
    'mutant_defeated_bridge': {
        id: 'mutant_defeated_bridge',
        name: 'Мутант повержен',
        type: 'event',
        description: 'Вы одолели мутанта. Теперь здесь безопасно.',
        onEnter: (player) => {
            player.addItem('mutant_meat', 1); // Добавляем мясо мутанта
            window.addGameLog('Вы обыскали останки мутанта и нашли немного мяса.');
        },
        options: [
            { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
        ]
    },
    'flee_successful_bridge': {
        id: 'flee_successful_bridge',
        name: 'Успешное бегство',
        type: 'event',
        description: 'Вам удалось оторваться от мутанта. Вы тяжело дышите, но целы.',
        options: [
            { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
        ]
    },
    'combat_mutant_bridge': { // Сцена для продолжения боя после неудачной попытки сбежать
        id: 'combat_mutant_bridge',
        name: 'Продолжение боя',
        type: 'combat',
        description: 'Бой продолжается...',
        onEnter: (player) => {
            // CombatManager сам будет управлять логикой и отображением опций
            // Просто убедимся, что он активен и продолжает бой
            if (window.combatManager.currentEnemy) {
                window.combatManager.displayCombatOptions();
            } else {
                // Если сюда попали без активного боя (например, перезагрузка)
                window.addGameLog('[ПРЕДУПРЕЖДЕНИЕ] Попытка продолжить бой без активного противника. Возврат на окраину.');
                window.loadScene('outside_area_entrance');
            }
        },
        options: [] // Опции будут генерироваться CombatManager
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
            player.gainSkillExp('scavenging', 1);

            let foundItems = [];
            if (Math.random() < 0.4) { // 40% шанс найти что-то
                const possibleItems = ['scraps_metal', 'scraps_wood', 'cloth_scraps', 'canned_food', 'water_bottle'];
                const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                player.addItem(randomItem, quantity);
                foundItems.push(`${GameItems[randomItem].name} (x${quantity})`);
            }

            if (foundItems.length > 0) {
                GameScenes.scavenge_nearby.description = `Вы нашли: ${foundItems.join(', ')}.`;
                window.addGameLog(`Обнаружены ресурсы: ${foundItems.join(', ')}.`);
            } else {
                GameScenes.scavenge_nearby.description = 'К сожалению, ничего ценного найти не удалось, лишь мусор. Зря потратили время.';
                window.addGameLog('Поиск не дал результатов.');
            }
        },
        options: [
            { text: 'Продолжить поиск в этой зоне', nextScene: 'scavenge_nearby' },
            { text: 'Вернуться на окраину', nextScene: 'outside_area_entrance' }
        ]
    },
    'find_shelter_area': {
        id: 'find_shelter_area',
        name: 'Поиск места для убежища',
        type: 'quest',
        description: 'Вы бродите по окраинам, ища подходящее место для создания постоянного убежища. Вдалеке вы видите здание, похожее на старый склад, которое кажется относительно целым.',
        options: [
            { text: 'Идти к старому складу', nextScene: 'old_warehouse_entrance' },
            { text: 'Продолжить поиски более безопасного места', nextScene: 'outside_area_entrance' } // Возвращаемся
        ],
        onEnter: (player) => {
            player.currentLocation = 'find_shelter_area';
        }
    },
    'old_warehouse_entrance': {
        id: 'old_warehouse_entrance',
        name: 'Вход в старый склад',
        type: 'location',
        description: 'Вы подошли к старому складу. Его ворота слегка приоткрыты, а внутри царит мрак. Кажется, место заброшено, но в нем может быть что-то ценное... или опасное.',
        options: [
            { text: 'Войти внутрь склада', customAction: () => {
                // Пример: Вход на склад, который станет убежищем
                window.gameState.community.buildFacility('shelter_level', 1); // Увеличиваем уровень убежища
                window.gameState.community.addSurvivors(0); // Игрок теперь "в общине"
                window.addGameLog('Вы нашли подходящее место для убежища!');
                window.loadScene('warehouse_interior');
            }},
            { text: 'Отойти от склада', nextScene: 'find_shelter_area' }
        ],
        onEnter: (player, community) => {
            player.currentLocation = 'old_warehouse_entrance';
            // Если убежище уже построено, изменить опции
            if (community.facilities.shelter_level > 0) {
                GameScenes.old_warehouse_entrance.description = 'Вы у входа в свое убежище - старый склад.';
                GameScenes.old_warehouse_entrance.options = [
                    { text: 'Войти в убежище', nextScene: 'warehouse_interior' }
                ];
            }
        }
    },
    'warehouse_interior': {
        id: 'warehouse_interior',
        name: 'Внутри убежища (Склад)',
        type: 'community_hub',
        description: 'Вы внутри старого склада, который теперь является вашим убежищем. Здесь относительно безопасно. Вы можете начать обустраиваться.',
        options: [
            { text: 'Осмотреть склад', nextScene: 'warehouse_scavenge' },
            { text: 'Завершить день (перейти к следующему дню)', customAction: () => {
                window.nextGameDay();
                window.loadScene('warehouse_interior', false); // После дня остаемся здесь
            }},
            { text: 'Покинуть убежище (вернуться на окраину)', nextScene: 'outside_area_entrance' }
        ],
        onEnter: (player) => {
            player.currentLocation = 'warehouse_interior';
            window.addGameLog('Добро пожаловать в ваше убежище!');
        }
    },
    'warehouse_scavenge': {
        id: 'warehouse_scavenge',
        name: 'Обыск убежища',
        type: 'event',
        description: 'Вы тщательно обыскиваете склад в поисках полезных вещей. Старые ящики, паллеты, пыльные углы...',
        onEnter: (player, community) => {
            player.adjustFatigue(5);
            player.gainSkillExp('scavenging', 1);

            let found = false;
            // Шанс найти ресурсы для склада, а не только для игрока
            if (Math.random() < 0.6) { // 60% шанс найти что-то на склад
                const resourceTypes = ['materials_metal', 'materials_wood', 'food', 'water'];
                const randomResType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
                const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 единиц
                community.addResource(randomResType, quantity);
                window.addGameLog(`На складе найдено: ${quantity} ед. ${randomResType}.`);
                found = true;
            }
            if (Math.random() < 0.3) { // 30% шанс найти предмет для игрока
                const playerItems = ['pistol_ammo', 'bandages', 'fuel_can'];
                const randomPlayerItem = playerItems[Math.floor(Math.random() * playerItems.length)];
                player.addItem(randomPlayerItem, 1);
                window.addGameLog(`Вы нашли: ${GameItems[randomPlayerItem].name}.`);
                found = true;
            }

            if (!found) {
                GameScenes.warehouse_scavenge.description = 'После тщательного обыска вы ничего ценного не нашли. Только пыль и паутина.';
                window.addGameLog('Обыск склада не принес результатов.');
            } else {
                GameScenes.warehouse_scavenge.description = 'Вам удалось найти кое-что полезное во время обыска склада.';
            }
        },
        options: [
            { text: 'Продолжить обыск', nextScene: 'warehouse_scavenge' },
            { text: 'Вернуться в убежище', nextScene: 'warehouse_interior' }
        ]
    },


    // --- Сцены завершения игры ---
    'player_death': {
        id: 'player_death',
        name: 'Смерть',
        type: 'game_over',
        description: 'Ваш путь окончен. Вы не смогли выжить в этом суровом мире. Возможно, в следующий раз удача будет на вашей стороне.',
        options: [
            { text: 'Начать новую игру', customAction: () => location.reload() } // Просто перезагружаем страницу
        ]
    }
};
