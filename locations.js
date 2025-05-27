// locations.js

const LOCATION_DEFINITIONS = {
    base_surroundings: {
        id: "base_surroundings",
        name: "Окрестности Базы",
        description: "Знакомые тропы вокруг вашего убежища. Относительно безопасно, но и добыча скудная.",
        type: "wasteland",
        dangerLevel: 1,
        scoutTime: 1,
        initialSearchAttempts: 10, 
        entryLoot: [ 
            { itemId: "wood", quantity: [1, 1], chance: 0.1 }
        ],
        lootTable: [ 
            { itemId: "food_scraps", quantity: [1, 2], chance: 0.35 },
            { itemId: "water_dirty", quantity: [1, 1], chance: 0.3 },
            { itemId: "wood", quantity: [1, 3], chance: 0.5 },
            { itemId: "scrap_metal", quantity: [1, 2], chance: 0.15 }, 
        ],
        discoverableLocations: [ 
            { locationId: "abandoned_road", chance: 0.3, condition: () => true }, 
            { locationId: "small_forest_edge", chance: 0.25, condition: () => true },
        ],
        specialEvents: [
            {
                id: "rustling_bushes_base", // Уникальный ID для события
                text: "Вы слышите шорох в кустах неподалеку...",
                chance: 0.1,
                choices: [
                    { text: "Осторожно проверить", outcome: { log: "Это был всего лишь кролик. Ложная тревога.", type:"neutral" } },
                    { text: "Игнорировать и продолжить", outcome: { log: "Вы решили не рисковать.", type:"neutral" } }
                ]
            }
        ]
    },

    abandoned_road: {
        id: "abandoned_road",
        name: "Заброшенная дорога",
        description: "Старое шоссе, заваленное брошенными автомобилями и мусором.",
        type: "urban_ruins",
        dangerLevel: 2,
        scoutTime: 1,
        initialSearchAttempts: 8,
        entryLoot: [ 
            { itemId: "scrap_metal", quantity: [1, 2], chance: 0.15 },
            { itemId: "cloth", quantity: [1, 1], chance: 0.1 },
        ],
        lootTable: [
            { itemId: "scrap_metal", quantity: [2, 4], chance: 0.5 },
            { itemId: "components", quantity: [1, 1], chance: 0.2 },
            { itemId: "food_canned", quantity: [1, 1], chance: 0.1 },
            { itemId: "cloth", quantity: [1, 2], chance: 0.25 },
            { itemId: "broken_electronics", quantity: [1, 1], chance: 0.35 }, 
            { itemId: "leather_scraps", quantity: [1, 2], chance: 0.3 },  
        ],
        specialFinds: [
            { 
                itemId: "tool_hammer", quantity: 1, findChance: 0.1, oneTimeFlag: "hammer_found_road", 
                descriptionLog: "Среди хлама вы наткнулись на вполне приличный молоток!"
            }
        ],
        discoverableLocations: [
            { locationId: "gas_station_ruins", chance: 0.2, condition: () => gameState.day > 2 }, 
        ],
        specialEvents: [
             {
                id: "abandoned_car_trunk_road", // Уникальный ID
                text: "Вы замечаете автомобиль с приоткрытым багажником.",
                chance: 0.15,
                choices: [
                    { 
                        text: "Обыскать багажник", 
                        action: function() { // Используем action для добавления предметов
                            game.log("В багажнике вы нашли немного припасов!", "positive");
                            game.addItemToInventory(gameState.inventory, "food_canned", 1);
                            game.addItemToInventory(gameState.inventory, "bandages_crude", 2);
                            gameState.flags["searched_car_trunk_road"] = true; // Устанавливаем флаг
                        },
                        condition: () => !gameState.flags["searched_car_trunk_road"] // Условие для показа этого выбора
                    },
                    { 
                        text: "Пройти мимо (риск ловушки)", 
                        outcome: { log: "Вы решили не рисковать с неизвестным багажником.", type:"neutral" } 
                    }
                ]
            },
            {
                id: "distant_howl_road", // Уникальный ID
                text: "Вдалеке раздается леденящий душу вой. Что-то большое и опасное бродит поблизости.",
                chance: 0.05,
                choices: [
                     { text: "Поспешить убраться", outcome: { log: "Вы решили не испытывать судьбу и поскорее покинули это место.", type:"neutral"} }
                ]
            }
        ]
    },

    small_forest_edge: {
        id: "small_forest_edge",
        name: "Опушка небольшого леса",
        description: "Редкие деревья и густой подлесок.",
        type: "forest",
        dangerLevel: 2,
        scoutTime: 1,
        initialSearchAttempts: 12,
        entryLoot: [ 
            { itemId: "wood", quantity: [1, 2], chance: 0.3 },
            { itemId: "healing_herbs", quantity: [1, 1], chance: 0.1 },
        ],
        lootTable: [
            { itemId: "wood", quantity: [2, 5], chance: 0.7 },
            { itemId: "food_scraps", quantity: [1, 1], chance: 0.15 },
            { itemId: "healing_herbs", quantity: [1, 3], chance: 0.4 }, 
            { itemId: "mutated_fruit", quantity: [1, 2], chance: 0.25 }, 
        ],
        specialFinds: [],
        discoverableLocations: [
            { locationId: "hunter_shack", chance: 0.15, condition: () => game.countItemInInventory(gameState.inventory, "tool_hammer") > 0 }
        ],
        specialEvents: []
    },
    
    gas_station_ruins: {
        id: "gas_station_ruins",
        name: "Развалины бензоколонки",
        description: "Ржавые колонки и полуразрушенное здание магазина.",
        type: "urban_ruins",
        dangerLevel: 3,
        scoutTime: 2, 
        initialSearchAttempts: 6, 
        entryLoot: [ 
            { itemId: "components", quantity: [1, 1], chance: 0.2 },
            { itemId: "chemicals", quantity: [1, 1], chance: 0.1 }
        ],
        lootTable: [
            { itemId: "components", quantity: [1, 3], chance: 0.35 },
            { itemId: "scrap_metal", quantity: [2, 6], chance: 0.4 },
            { itemId: "stimpack_fallout", quantity: [1,1], chance: 0.03}, 
            { itemId: "food_canned", quantity: [1,1], chance: 0.15},
            { itemId: "chemicals", quantity: [1, 2], chance: 0.3 },     
            { itemId: "wires", quantity: [2, 5], chance: 0.4 },         
        ],
        specialFinds: [
             { 
                itemId: "antiseptic", quantity: 2, findChance: 0.15, oneTimeFlag: "antiseptic_gas_station", 
                descriptionLog: "В аптечке за прилавком нашлось немного антисептика."
            }
        ],
        discoverableLocations: [],
        specialEvents: [
             {
                id: "locked_safe_gs", 
                text: "В углу магазина вы видите небольшой, но прочный сейф. Он заперт.",
                chance: 0.1,
                condition: () => !gameState.flags || !gameState.flags.gas_station_safe_opened_gs, 
                choices: [
                     { 
                         text: "Попытаться взломать (пока нет инструментов)", 
                         outcome: {log: "У вас нет подходящих инструментов, чтобы вскрыть этот сейф.", type:"neutral"}
                     },
                     { text: "Оставить его в покое", outcome: { log: "Сейф выглядит слишком крепким.", type:"neutral" } }
                ],
            }
        ]
    },

    hunter_shack: {
        id: "hunter_shack",
        name: "Заброшенная охотничья хижина",
        description: "Маленькая, покосившаяся хижина в глубине леса.",
        type: "shelter",
        dangerLevel: 2,
        scoutTime: 1,
        initialSearchAttempts: 5, 
        entryLoot: [], 
        lootTable: [
            { itemId: "wood", quantity: [1,2], chance: 0.2 },
            { itemId: "food_canned", quantity: [1,1], chance: 0.2 },
            { itemId: "water_purified", quantity: [1,1], chance: 0.1 },
            { itemId: "leather_scraps", quantity: [2,4], chance: 0.35 }, 
            { itemId: "healing_herbs", quantity: [1,2], chance: 0.25 },  
        ],
        specialFinds: [
            { 
                itemId: "diary_page", quantity: 1, findChance: 0.2, oneTimeFlag: "diary_page_hunter_shack", 
                descriptionLog: "Под старым матрасом вы нашли вырванную страницу чьего-то дневника."
            }
        ],
        discoverableLocations: [],
        specialEvents: []
    }
};

window.LOCATION_DEFINITIONS = LOCATION_DEFINITIONS;
