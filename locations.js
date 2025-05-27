// locations.js

const LOCATION_DEFINITIONS = {
    // --- Зона вокруг базы (стартовая) ---
    base_surroundings: {
        id: "base_surroundings",
        name: "Окрестности Базы",
        description: "Знакомые тропы вокруг вашего убежища. Относительно безопасно, но и добыча скудная.",
        type: "wasteland",
        dangerLevel: 1, // 1-5 (очень низкая - очень высокая)
        scoutTime: 1, // Дней на полную разведку/обыск (может быть дробным для частей дня)
        lootTable: [ // Вероятностная таблица лута
            { itemId: "food_scraps", quantity: [1, 2], chance: 0.4 }, // 40% шанс найти 1-2 объедков
            { itemId: "water_dirty", quantity: [1, 1], chance: 0.3 },
            { itemId: "wood", quantity: [1, 3], chance: 0.5 },
            { itemId: "scrap_metal", quantity: [1, 2], chance: 0.2 },
        ],
        discoverableLocations: [ // Какие локации можно обнаружить отсюда
            { locationId: "abandoned_road", chance: 0.3, condition: () => true }, // 30% шанс, без условий
            { locationId: "small_forest_edge", chance: 0.25, condition: () => true },
        ],
        specialEvents: [
            {
                id: "rustling_bushes",
                text: "Вы слышите шорох в кустах неподалеку...",
                chance: 0.1,
                choices: [
                    { text: "Осторожно проверить", outcome: { log: "Это был всего лишь кролик. Ложная тревога.", type:"neutral" } },
                    { text: "Игнорировать и продолжить", outcome: { log: "Вы решили не рисковать.", type:"neutral" } }
                ]
            }
        ]
    },

    // --- Новые обнаруживаемые локации ---
    abandoned_road: {
        id: "abandoned_road",
        name: "Заброшенная дорога",
        description: "Старое шоссе, заваленное брошенными автомобилями и мусором. Выглядит так, будто здесь можно найти что-то полезное... или опасное.",
        type: "urban_ruins",
        dangerLevel: 2,
        scoutTime: 1,
        lootTable: [
            { itemId: "scrap_metal", quantity: [2, 5], chance: 0.6 },
            { itemId: "components", quantity: [1, 2], chance: 0.25 },
            { itemId: "food_canned", quantity: [1, 1], chance: 0.15 },
            { itemId: "water_dirty", quantity: [1, 2], chance: 0.2 },
            { itemId: "cloth", quantity: [1, 3], chance: 0.3 },
            { itemId: "tool_hammer", quantity: [1,1], chance: 0.05} // Малый шанс найти инструмент
        ],
        discoverableLocations: [
            { locationId: "gas_station_ruins", chance: 0.2, condition: () => game.state.day > 3 }, // Можно найти только после 3-го дня
        ],
        specialEvents: [
             {
                id: "abandoned_car_trunk",
                text: "Вы замечаете автомобиль с приоткрытым багажником.",
                chance: 0.15,
                choices: [
                    { 
                        text: "Обыскать багажник", 
                        outcome: { 
                            log: "В багажнике вы нашли немного припасов!", 
                            type:"positive",
                            addItems: [{ itemId: "food_canned", quantity: 1 }, { itemId: "bandages_crude", quantity: 2}]
                        } 
                    },
                    { 
                        text: "Пройти мимо (риск ловушки)", 
                        outcome: { log: "Вы решили не рисковать с неизвестным багажником.", type:"neutral" } 
                    }
                ]
            },
            {
                id: "distant_howl",
                text: "Вдалеке раздается леденящий душу вой. Что-то большое и опасное бродит поблизости.",
                chance: 0.05,
                choices: [
                     { text: "Поспешить убраться", outcome: { log: "Вы решили не испытывать судьбу и поскорее покинули это место.", type:"neutral", effects: { morale_debuff: 5} } } // Мораль пока не реализована
                ]
            }
        ]
    },

    small_forest_edge: {
        id: "small_forest_edge",
        name: "Опушка небольшого леса",
        description: "Редкие деревья и густой подлесок. Здесь можно найти древесину и, возможно, какую-нибудь живность или травы.",
        type: "forest",
        dangerLevel: 2,
        scoutTime: 1,
        lootTable: [
            { itemId: "wood", quantity: [3, 6], chance: 0.7 },
            { itemId: "food_scraps", quantity: [1, 1], chance: 0.2 }, // Может, ягоды или грибы (пока объедки)
            { itemId: "cloth", quantity: [1, 2], chance: 0.15 }, // Старые тряпки
        ],
        discoverableLocations: [
            { locationId: "hunter_shack", chance: 0.15, condition: () => game.countItemInInventory("tool_hammer") > 0 } // Нужен молоток чтобы "понять" что это может быть стоянка
        ],
        specialEvents: [] // Пока без особых событий
    },
    
    // --- Более сложные локации для будущего ---
    gas_station_ruins: {
        id: "gas_station_ruins",
        name: "Развалины бензоколонки",
        description: "Ржавые колонки и полуразрушенное здание магазина. Здесь может быть топливо или другие полезные вещи, но такие места часто привлекают мародеров или мутантов.",
        type: "urban_ruins",
        dangerLevel: 3,
        scoutTime: 2, // Дольше обыскивать
        lootTable: [
            { itemId: "components", quantity: [2, 4], chance: 0.4 },
            { itemId: "scrap_metal", quantity: [3, 7], chance: 0.5 },
            // { itemId: "fuel_canister", quantity: [1,1], chance: 0.1 }, // Будущий предмет
            { itemId: "medicine_stimpack_fallout", quantity: [1,1], chance: 0.05}, // Малый шанс стимулятора
            { itemId: "food_canned", quantity: [1,2], chance: 0.2}
        ],
        discoverableLocations: [],
        specialEvents: [
             {
                id: "locked_safe",
                text: "В углу магазина вы видите небольшой, но прочный сейф. Он заперт.",
                chance: 0.1,
                condition: () => !game.state.flags || !game.state.flags.gas_station_safe_opened, // Если сейф еще не открыт
                choices: [
                     { 
                         text: "Попытаться взломать (нужны отмычки/инструменты)", 
                         // outcome: { ... логика взлома ... } // Потребует предметы или навык
                         outcome: {log: "У вас нет подходящих инструментов, чтобы вскрыть этот сейф.", type:"neutral"}
                     },
                     { text: "Оставить его в покое", outcome: { log: "Сейф выглядит слишком крепким.", type:"neutral" } }
                ]
            }
        ]
    },

    hunter_shack: {
        id: "hunter_shack",
        name: "Заброшенная охотничья хижина",
        description: "Маленькая, покосившаяся хижина в глубине леса. Возможно, предыдущий владелец оставил что-то ценное.",
        type: "shelter",
        dangerLevel: 2,
        scoutTime: 1,
        lootTable: [
            { itemId: "wood", quantity: [1,3], chance: 0.3 },
            { itemId: "food_canned", quantity: [1,2], chance: 0.25 },
            { itemId: "water_purified", quantity: [1,1], chance: 0.15 },
            // { itemId: "ammo_bullets", quantity: [5,10], chance: 0.1 }, // Будущий предмет
            { itemId: "diary_page", quantity: [1,1], chance: 0.1 } // Шанс найти страницу дневника
        ],
        discoverableLocations: [],
        specialEvents: []
    }
};

// Сделаем доступным глобально
window.LOCATION_DEFINITIONS = LOCATION_DEFINITIONS;
