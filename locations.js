// locations.js

const LOCATION_DEFINITIONS = {
    base_surroundings: {
        id: "base_surroundings",
        name: "Окрестности Базы",
        description: "Знакомые тропы вокруг вашего убежища. Относительно безопасно, но и добыча скудная.",
        type: "wasteland",
        dangerLevel: 1, // 1: низкая, 2: средняя, 3: высокая, 4: очень высокая
        scoutTime: 1, // Дней на обыск одной "попытки"
        initialSearchAttempts: 12, // Сколько раз можно обыскивать до истощения
        previewLootText: "Немного древесины, обрывки материалов, грязная вода.",
        entryLoot: [
            { itemId: "wood", quantity: [1, 2], chance: 0.15 }
        ],
        lootTable: [
            { itemId: "food_scraps", quantity: [1, 3], chance: 0.4 },
            { itemId: "water_dirty", quantity: [1, 2], chance: 0.35 },
            { itemId: "wood", quantity: [2, 4], chance: 0.6 },
            { itemId: "scrap_metal", quantity: [1, 3], chance: 0.20 },
            { itemId: "cloth", quantity: [1, 2], chance: 0.25 },
        ],
        discoverableLocations: [
            { locationId: "abandoned_road", chance: 0.35, condition: () => true },
            { locationId: "small_forest_edge", chance: 0.3, condition: () => true },
            { locationId: "old_farmstead", chance: 0.15, condition: () => gameState.day > 2 } // Новая локация
        ],
        specialEvents: [
            {
                id: "rustling_bushes_base",
                text: "Вы слышите шорох в кустах неподалеку...",
                chance: 0.1,
                repeatable: true,
                choices: [
                    { text: "Осторожно проверить", outcome: { log: "Это был всего лишь радиоактивный кролик. Ложная тревога.", type:"neutral" } },
                    { text: "Игнорировать и продолжить", outcome: { log: "Вы решили не рисковать.", type:"neutral" } }
                ]
            }
        ]
    },

    abandoned_road: {
        id: "abandoned_road",
        name: "Заброшенная дорога",
        description: "Старое шоссе, заваленное брошенными автомобилями и мусором. Можно найти полезные детали.",
        type: "urban_ruins",
        dangerLevel: 2,
        scoutTime: 1,
        initialSearchAttempts: 10,
        previewLootText: "Металлолом, компоненты, иногда консервы или электроника.",
        entryLoot: [
            { itemId: "scrap_metal", quantity: [2, 3], chance: 0.2 },
            { itemId: "cloth", quantity: [1, 2], chance: 0.15 },
        ],
        lootTable: [
            { itemId: "scrap_metal", quantity: [3, 6], chance: 0.55 },
            { itemId: "components", quantity: [1, 2], chance: 0.25 },
            { itemId: "food_canned", quantity: [1, 1], chance: 0.15 },
            { itemId: "cloth", quantity: [2, 3], chance: 0.3 },
            { itemId: "broken_electronics", quantity: [1, 2], chance: 0.4 },
            { itemId: "leather_scraps", quantity: [1, 3], chance: 0.35 },
            { itemId: "wires", quantity: [1, 3], chance: 0.25 },
        ],
        specialFinds: [
            {
                itemId: "tool_hammer", quantity: 1, findChance: 0.12, oneTimeFlag: "hammer_found_road",
                descriptionLog: "Среди хлама вы наткнулись на вполне приличный молоток!"
            },
            {
                itemId: "car_battery", quantity: 1, findChance: 0.08, oneTimeFlag: "car_battery_road",
                descriptionLog: "В одной из машин нашёлся целый автомобильный аккумулятор!"
            }
        ],
        discoverableLocations: [
            { locationId: "gas_station_ruins", chance: 0.25, condition: () => gameState.day > 3 },
            { locationId: "radio_tower_outskirts", chance: 0.1, condition: () => gameState.flags?.car_battery_road } // Новая локация, требует находки
        ],
        specialEvents: [
             {
                id: "abandoned_car_trunk_road",
                text: "Вы замечаете автомобиль с приоткрытым багажником.",
                chance: 0.15,
                condition: () => !gameState.flags["searched_car_trunk_road"], // Не повторяется, если флаг установлен
                choices: [
                    {
                        text: "Обыскать багажник",
                        action: function() {
                            if (typeof game !== 'undefined' && game.log) game.log("В багажнике вы нашли немного припасов!", "event-positive");
                            if (typeof InventoryManager !== 'undefined') {
                                InventoryManager.addItemToInventory(gameState.inventory, "food_canned", 1);
                                InventoryManager.addItemToInventory(gameState.inventory, "bandages_crude", 2);
                            }
                            gameState.flags["searched_car_trunk_road"] = true;
                        }
                    },
                    {
                        text: "Пройти мимо (риск ловушки)",
                        outcome: { log: "Вы решили не рисковать с неизвестным багажником.", type:"neutral" }
                    }
                ]
            },
            {
                id: "distant_howl_road",
                text: "Вдалеке раздается леденящий душу вой. Что-то большое и опасное бродит поблизости.",
                chance: 0.08,
                repeatable: true,
                choices: [
                     { text: "Поспешить убраться", outcome: { log: "Вы решили не испытывать судьбу и поскорее покинули это место.", type:"neutral"} }
                ]
            }
        ]
    },

    small_forest_edge: {
        id: "small_forest_edge",
        name: "Опушка небольшого леса",
        description: "Редкие деревья и густой подлесок. Источник древесины и целебных трав.",
        type: "forest",
        dangerLevel: 2,
        scoutTime: 1,
        initialSearchAttempts: 15,
        previewLootText: "Много древесины, целебные травы, иногда съедобные мутировавшие фрукты.",
        entryLoot: [
            { itemId: "wood", quantity: [2, 3], chance: 0.35 },
            { itemId: "healing_herbs", quantity: [1, 2], chance: 0.15 },
        ],
        lootTable: [
            { itemId: "wood", quantity: [3, 7], chance: 0.75 },
            { itemId: "food_scraps", quantity: [1, 2], chance: 0.20 },
            { itemId: "healing_herbs", quantity: [2, 4], chance: 0.45 },
            { itemId: "mutated_fruit", quantity: [1, 3], chance: 0.30 },
            { itemId: "rope_makeshift", quantity: [1,1], chance: 0.1},
        ],
        specialFinds: [
            {
                itemId: "rare_mushroom", quantity: 1, findChance: 0.05, oneTimeFlag: "rare_mushroom_forest",
                descriptionLog: "Под корнями старого дерева вы нашли необычный светящийся гриб!"
            }
        ],
        discoverableLocations: [
            { locationId: "hunter_shack", chance: 0.2, condition: () => (typeof InventoryManager !== 'undefined' && (InventoryManager.countItemInInventory(gameState.inventory, "tool_axe") > 0 || InventoryManager.countItemInInventory(gameState.baseInventory, "tool_axe") > 0)) }
        ],
        specialEvents: [
            {
                id: "hidden_cache_forest",
                text: "Вы замечаете приметный камень. Кажется, под ним что-то спрятано.",
                chance: 0.1,
                condition: () => !gameState.flags["found_hidden_cache_forest"],
                choices: [
                    {
                        text: "Попробовать сдвинуть камень",
                        action: function() {
                            if (Math.random() < 0.7) {
                                if (typeof game !== 'undefined' && game.log) game.log("Под камнем вы нашли небольшой тайник с припасами!", "event-discovery");
                                if (typeof InventoryManager !== 'undefined') {
                                    InventoryManager.addItemToInventory(gameState.inventory, "water_purified", 2);
                                    InventoryManager.addItemToInventory(gameState.inventory, "components", 1);
                                }
                            } else {
                                if (typeof game !== 'undefined' && game.log) game.log("Камень оказался слишком тяжелым, или под ним ничего не было.", "event-neutral");
                            }
                            gameState.flags["found_hidden_cache_forest"] = true;
                        }
                    },
                    { text: "Оставить как есть", outcome: { log: "Лучше не трогать неизвестные тайники.", type:"neutral" } }
                ]
            }
        ]
    },

    gas_station_ruins: {
        id: "gas_station_ruins",
        name: "Развалины бензоколонки",
        description: "Ржавые колонки и полуразрушенное здание магазина. Пахнет топливом и запустением.",
        type: "urban_ruins",
        dangerLevel: 3,
        scoutTime: 2,
        initialSearchAttempts: 8,
        previewLootText: "Компоненты, металлолом, химикаты, иногда консервы или медикаменты.",
        entryLoot: [
            { itemId: "components", quantity: [1, 2], chance: 0.25 },
            { itemId: "chemicals", quantity: [1, 1], chance: 0.15 }
        ],
        lootTable: [
            { itemId: "components", quantity: [2, 4], chance: 0.40 },
            { itemId: "scrap_metal", quantity: [3, 7], chance: 0.45 },
            { itemId: "stimpack_fallout", quantity: [1,1], chance: 0.05},
            { itemId: "food_canned", quantity: [1,2], chance: 0.20},
            { itemId: "chemicals", quantity: [1, 3], chance: 0.35 },
            { itemId: "wires", quantity: [2, 6], chance: 0.45 },
            { itemId: "fuel_canister_empty", quantity: [1,1], chance: 0.1},
        ],
        specialFinds: [
             {
                itemId: "antiseptic", quantity: 2, findChance: 0.18, oneTimeFlag: "antiseptic_gas_station",
                descriptionLog: "В аптечке за прилавком нашлось немного антисептика."
            },
            {
                itemId: "tool_wrench", quantity: 1, findChance: 0.1, oneTimeFlag: "wrench_gas_station",
                descriptionLog: "В ящике с инструментами вы обнаружили исправный разводной ключ!"
            }
        ],
        discoverableLocations: [],
        specialEvents: [
             {
                id: "locked_safe_gs",
                text: "В углу магазина вы видите небольшой, но прочный сейф. Он заперт.",
                chance: 0.12,
                condition: () => !gameState.flags?.gas_station_safe_opened_gs,
                choices: [
                     {
                         text: "Попытаться взломать (если есть отмычки)",
                         condition: () => (typeof InventoryManager !== 'undefined' && InventoryManager.countItemInInventory(gameState.inventory, "lockpicks_crude") > 0),
                         action: function() {
                             if (typeof InventoryManager !== 'undefined') InventoryManager.removeItemFromInventory(gameState.inventory, "lockpicks_crude", 1);
                             if (Math.random() < 0.5) {
                                 if (typeof game !== 'undefined' && game.log) game.log("Вам удалось вскрыть сейф!", "event-discovery");
                                 if (typeof InventoryManager !== 'undefined') {
                                     InventoryManager.addItemToInventory(gameState.inventory, "ammo_pistol", [5, 10]);
                                     InventoryManager.addItemToInventory(gameState.inventory, "money_caps", [20, 50]);
                                 }
                                 gameState.flags.gas_station_safe_opened_gs = true;
                             } else {
                                 if (typeof game !== 'undefined' && game.log) game.log("Отмычка сломалась, а сейф так и не поддался.", "event-negative");
                             }
                         }
                     },
                     { text: "Оставить его в покое", outcome: { log: "Сейф выглядит слишком крепким, лучше не тратить время.", type:"neutral" } }
                ],
            }
        ]
    },

    hunter_shack: {
        id: "hunter_shack",
        name: "Заброшенная охотничья хижина",
        description: "Маленькая, покосившаяся хижина в глубине леса. Кто-то жил здесь до Катастрофы.",
        type: "shelter",
        dangerLevel: 2,
        scoutTime: 1,
        initialSearchAttempts: 7,
        previewLootText: "Консервы, вода, кожаные обрывки, возможно, что-то из старых записей или старое оружие.",
        entryLoot: [
            {itemId: "leather_scraps", quantity: [1,2], chance: 0.2}
        ],
        lootTable: [
            { itemId: "wood", quantity: [1,3], chance: 0.25 },
            { itemId: "food_canned", quantity: [1,2], chance: 0.25 },
            { itemId: "water_purified", quantity: [1,1], chance: 0.15 },
            { itemId: "leather_scraps", quantity: [2,5], chance: 0.40 },
            { itemId: "healing_herbs", quantity: [1,3], chance: 0.30 },
            { itemId: "ammo_rifle_crude", quantity: [2,5], chance: 0.05},
        ],
        specialFinds: [
            {
                itemId: "diary_page", quantity: 1, findChance: 0.25, oneTimeFlag: "diary_page_hunter_shack",
                descriptionLog: "Под старым матрасом вы нашли вырванную страницу чьего-то дневника."
            },
            {
                itemId: "hunting_rifle_old", quantity: 1, findChance: 0.03, oneTimeFlag: "old_rifle_hunter_shack",
                descriptionLog: "За печкой, прислонённая к стене, стояла старая охотничья винтовка. Выглядит рабочей!"
            }
        ],
        discoverableLocations: [],
        specialEvents: []
    },

    // --- НОВЫЕ ЛОКАЦИИ ---
    old_farmstead: {
        id: "old_farmstead",
        name: "Старая ферма",
        description: "Заброшенные поля и полуразрушенный фермерский дом. Когда-то здесь кипела жизнь, а теперь лишь ветер гуляет среди сорняков.",
        type: "rural",
        dangerLevel: 2,
        scoutTime: 2, // Обыск занимает больше времени
        initialSearchAttempts: 10,
        previewLootText: "Остатки урожая (возможно, мутировавшие), сельхоз инструменты, материалы для починки.",
        entryLoot: [
            { itemId: "mutated_vegetables", quantity: [1, 3], chance: 0.2 }
        ],
        lootTable: [
            { itemId: "food_scraps", quantity: [2, 4], chance: 0.3 },
            { itemId: "mutated_vegetables", quantity: [2, 5], chance: 0.4 }, // Увеличен шанс и количество
            { itemId: "wood", quantity: [3, 6], chance: 0.5 },
            { itemId: "cloth", quantity: [2, 4], chance: 0.3 },
            { itemId: "components", quantity: [1, 2], chance: 0.15 },
            { itemId: "seeds_unknown", quantity: [1, 3], chance: 0.1 },
        ],
        specialFinds: [
            {
                itemId: "tool_shovel", quantity: 1, findChance: 0.1, oneTimeFlag: "shovel_farmstead",
                descriptionLog: "В сарае вы нашли крепкую лопату! Ей можно что-нибудь копать."
            }
        ],
        discoverableLocations: [
            // Можно добавить сюда, например, "Погреб", если найдена лопата или по событию
        ],
        specialEvents: [
            {
                id: "scarecrow_event_farm",
                text: "Посреди поля стоит жутковатое пугало. Его глаза будто следят за вами.",
                chance: 0.1,
                repeatable: false, // Событие одноразовое
                condition: () => !gameState.flags["scarecrow_searched_farm"],
                choices: [
                    { text: "Обыскать пугало",
                      action: function() {
                          if (Math.random() < 0.4) {
                              if (typeof game !== 'undefined' && game.log) game.log("В карманах старой куртки пугала вы нашли немного патронов.", "event-discovery");
                              if (typeof InventoryManager !== 'undefined') InventoryManager.addItemToInventory(gameState.inventory, "ammo_pistol", [3,6]);
                          } else {
                              if (typeof game !== 'undefined' && game.log) game.log("Пугало оказалось пустым, если не считать гнезда радиоактивных пауков. Вы быстро ретировались.", "event-neutral");
                          }
                          gameState.flags["scarecrow_searched_farm"] = true;
                      }
                    },
                    { text: "Не подходить к нему", outcome: { log: "Вы решили не связываться с этим пугалом.", type:"neutral" } }
                ]
            }
        ]
    },

    radio_tower_outskirts: {
        id: "radio_tower_outskirts",
        name: "Подножие радиовышки",
        description: "Высокая ржавая конструкция уходит в небо. Вокруг разбросаны остатки оборудования и ощущается слабое статическое электричество.",
        type: "industrial",
        dangerLevel: 3, // Опаснее из-за возможной охраны или мутантов
        scoutTime: 2,
        initialSearchAttempts: 8,
        previewLootText: "Электроника, провода, компоненты, возможно, ценные технические детали или топливо.",
        entryLoot: [
            { itemId: "wires", quantity: [2, 4], chance: 0.25 }
        ],
        lootTable: [
            { itemId: "broken_electronics", quantity: [2, 5], chance: 0.5 },
            { itemId: "scrap_metal", quantity: [3, 6], chance: 0.4 },
            { itemId: "wires", quantity: [3, 7], chance: 0.6 },
            { itemId: "components", quantity: [1, 3], chance: 0.3 },
            { itemId: "chemicals", quantity: [1, 2], chance: 0.15 },
            { itemId: "fuel_canister_empty", quantity: [1,2], chance: 0.15}, // Шанс найти канистру
        ],
        specialFinds: [
            {
                itemId: "radio_parts", quantity: 1, findChance: 0.15, oneTimeFlag: "radio_parts_tower",
                descriptionLog: "Вы нашли блок с исправными радиодеталями! Возможно, их удастся применить."
            },
            {
                itemId: "military_radio_broken", quantity: 1, findChance: 0.05, oneTimeFlag: "broken_military_radio_tower",
                descriptionLog: "Среди обломков лежит поврежденная военная рация. Починить ее будет непросто."
            }
        ],
        discoverableLocations: [
            // Можно добавить "Технический бункер" или что-то подобное, если удастся запустить вышку
        ],
        specialEvents: [
            {
                id: "power_up_tower_event",
                text: "Кажется, на радиовышке есть щиток управления питанием. Если подать энергию, что-то может заработать.",
                chance: 0.2,
                condition: () => (typeof InventoryManager !== 'undefined' && InventoryManager.countItemInInventory(gameState.inventory, "car_battery") > 0) && !gameState.flags["radio_tower_powered"],
                choices: [
                    { text: "Подключить аккумулятор (-1 автомобильный аккумулятор)",
                      action: function() {
                          if (typeof InventoryManager !== 'undefined') InventoryManager.removeItemFromInventory(gameState.inventory, "car_battery", 1);
                          gameState.flags["radio_tower_powered"] = true;
                          if (Math.random() < 0.6) {
                              if (typeof game !== 'undefined' && game.log) game.log("Вышка ожила! Слабый сигнал пробивается сквозь помехи... Вы уловили сигнал бедствия и координаты!", "event-discovery");
                              // Пример добавления новой локации "Секретный Бункер"
                              const bunkerId = "secret_bunker"; // Убедитесь, что такая локация определена ниже или в другом месте
                              const bunkerDef = LOCATION_DEFINITIONS[bunkerId];
                              if (bunkerDef && !gameState.discoveredLocations[bunkerId]?.discovered) {
                                  gameState.discoveredLocations[bunkerId] = {
                                      discovered: true,
                                      name: bunkerDef.name,
                                      searchAttemptsLeft: bunkerDef.initialSearchAttempts,
                                      foundSpecialItems: {}
                                  };
                                   if (typeof UIManager !== 'undefined') UIManager.renderDiscoveredLocations();
                                   game.log(`Новая локация открыта: ${bunkerDef.name}!`, "event-discovery");
                              } else if (gameState.discoveredLocations[bunkerId]?.discovered) {
                                  game.log("Сигнал указывает на уже известное вам место.", "event-neutral");
                              } else {
                                  game.log("Сигнал был, но вы не смогли расшифровать координаты конкретного места.", "event-neutral");
                              }
                          } else {
                              if (typeof game !== 'undefined' && game.log) game.log("Вы подключили аккумулятор, но ничего не произошло. Возможно, оборудование слишком повреждено или нужен более мощный источник.", "event-negative");
                          }
                      }
                    },
                    { text: "Не рисковать аккумулятором", outcome: { log: "Вы решили пока не тратить ценный аккумулятор.", type:"neutral" } }
                ]
            }
        ]
    },

    // Определение для secret_bunker (пример, чтобы событие выше сработало)
    secret_bunker: {
        id: "secret_bunker",
        name: "Секретный бункер",
        description: "Тяжелая стальная дверь ведет вглубь земли. Отсюда веет холодом и тайной.",
        type: "bunker",
        dangerLevel: 4, // Очень опасно
        scoutTime: 3,
        initialSearchAttempts: 5, // Мало попыток, но ценный лут
        previewLootText: "Высокотехнологичные компоненты, медикаменты, оружие, консервы длительного хранения.",
        entryLoot: [], // Вход может быть защищен
        lootTable: [
            { itemId: "components_adv", quantity: [1, 2], chance: 0.3 }, // Продвинутые компоненты (новый предмет?)
            { itemId: "stimpack_fallout", quantity: [1, 3], chance: 0.25 },
            { itemId: "ammo_rifle", quantity: [5, 15], chance: 0.2 }, // Патроны для винтовки (новый предмет?)
            { itemId: "food_military_ration", quantity: [2, 4], chance: 0.4 }, // Военный паек (новый предмет?)
            { itemId: "weapon_combat_shotgun", quantity: [1,1], chance: 0.02} // Очень редкий шанс на хорошее оружие
        ],
        specialFinds: [
            {
                itemId: "bunker_access_card_level2", quantity: 1, findChance: 0.1, oneTimeFlag: "bunker_card_lvl2", // Ключ-карта (новый предмет?)
                descriptionLog: "В одном из терминалов вы нашли ключ-карту второго уровня доступа!"
            }
        ],
        discoverableLocations: [],
        specialEvents: []
    }
};

// Добавляем в глобальную область видимости, если это основной файл определений локаций
if (typeof window !== 'undefined') {
    window.LOCATION_DEFINITIONS = LOCATION_DEFINITIONS;
}
