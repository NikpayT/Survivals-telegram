// items.js

const ITEM_DEFINITIONS = {
    // --- ЕДА ---
    food_canned: {
        id: "food_canned",
        name: "Консервы",
        description: "Банка тушенки или чего-то похожего. Сытно.",
        type: "food",
        effect: { hunger: 25 }, 
        weight: 0.5,
        stackable: true,
    },
    food_scraps: {
        id: "food_scraps",
        name: "Объедки",
        description: "Не первой свежести, но лучше, чем ничего.",
        type: "food",
        effect: { hunger: 10, morale_debuff: 1 },
        weight: 0.2,
        stackable: true,
    },
    mutated_fruit: {
        id: "mutated_fruit",
        name: "Мутировавший фрукт",
        description: "Странного вида фрукт, возможно, съедобный. Слегка фонит.",
        type: "food",
        effect: { hunger: 15, radiation: 5 }, 
        weight: 0.3,
        stackable: true,
        locationSpecific: ["small_forest_edge", "irradiated_zone"] 
    },

    // --- ВОДА ---
    water_dirty: {
        id: "water_dirty",
        name: "Грязная вода",
        description: "Мутная жижа. Лучше очистить перед употреблением.",
        type: "water_source", 
        effect: { thirst: 15, sickness_chance: 0.3 }, 
        weight: 1.0,
        stackable: true,
    },
    water_purified: {
        id: "water_purified",
        name: "Чистая вода",
        description: "Безопасна для питья.",
        type: "water",
        effect: { thirst: 30 },
        weight: 1.0,
        stackable: true,
    },

    // --- МАТЕРИАЛЫ ---
    scrap_metal: {
        id: "scrap_metal",
        name: "Металлолом",
        description: "Ржавые куски металла. Пригодятся для строительства и крафта.",
        type: "material",
        weight: 0.3,
        stackable: true,
    },
    wood: {
        id: "wood",
        name: "Древесина",
        description: "Доски, ветки. Основной строительный материал.",
        type: "material",
        weight: 0.4,
        stackable: true,
    },
    components: {
        id: "components",
        name: "Компоненты",
        description: "Электроника, провода, мелкие детали. Для сложных устройств.",
        type: "material",
        weight: 0.1,
        stackable: true,
    },
    cloth: {
        id: "cloth",
        name: "Ткань",
        description: "Лохмотья, куски старой одежды. Для бинтов и простой одежды.",
        type: "material",
        weight: 0.1,
        stackable: true,
    },
    chemicals: {
        id: "chemicals",
        name: "Химикаты",
        description: "Различные химические вещества в сомнительных контейнерах. Могут быть полезны для крафта или опасны.",
        type: "material",
        weight: 0.2,
        stackable: true,
        locationSpecific: ["gas_station_ruins", "old_lab"] 
    },
    leather_scraps: {
        id: "leather_scraps",
        name: "Обрывки кожи",
        description: "Куски старой, потрескавшейся кожи. Можно использовать для ремонта или создания простой брони.",
        type: "material",
        weight: 0.15,
        stackable: true,
        locationSpecific: ["abandoned_road", "hunter_shack"]
    },
    wires: {
        id: "wires",
        name: "Провода",
        description: "Моток тонких проводов, выдранных из старой техники.",
        type: "material", 
        weight: 0.05,
        stackable: true,
        locationSpecific: ["urban_ruins", "gas_station_ruins"]
    },
    broken_electronics: {
        id: "broken_electronics",
        name: "Сломанная электроника",
        description: "Нерабочий электронный прибор. Можно разобрать на компоненты или провода.",
        type: "material", 
        weight: 0.8,
        stackable: true,
        locationSpecific: ["urban_ruins", "abandoned_road"]
    },
    healing_herbs: {
        id: "healing_herbs",
        name: "Целебные травы",
        description: "Пучок высушенных трав с легким лекарственным запахом. Можно использовать для приготовления отваров.",
        type: "material", 
        weight: 0.05,
        stackable: true,
        locationSpecific: ["small_forest_edge", " overgrown_park"]
    },


    // --- МЕДИКАМЕНТЫ ---
    bandages_crude: {
        id: "bandages_crude",
        name: "Грубые бинты",
        description: "Сделаны из грязной ткани. Лучше, чем ничего.",
        type: "medicine",
        effect: { healing: 10, infection_chance: 0.1 }, 
        weight: 0.1,
        stackable: true,
    },
    // НОВЫЙ ПРЕДМЕТ
    bandages_clean: {
        id: "bandages_clean",
        name: "Чистые бинты",
        description: "Аккуратно сделанные бинты из чистой ткани с антисептиком. Снижают риск инфекции.",
        type: "medicine",
        effect: { healing: 20, infection_chance: 0.01 }, // Лечат лучше, шанс инфекции минимален
        weight: 0.1,
        stackable: true,
    },
    antiseptic: {
        id: "antiseptic",
        name: "Антисептик",
        description: "Для обработки ран и предотвращения инфекций.",
        type: "medicine",
        effect: { prevent_infection: true }, // Можно использовать для улучшения бинтов или отдельно
        weight: 0.2,
        stackable: true,
    },
    stimpack_fallout: { 
        id: "stimpack_fallout",
        name: "Стимулятор",
        description: "Быстрое восстановление здоровья. Классика Пустошей.",
        type: "medicine",
        effect: { healing: 50 },
        weight: 0.1,
        stackable: false, 
    },
    
    // --- ИНСТРУМЕНТЫ ---
    tool_hammer: {
        id: "tool_hammer",
        name: "Молоток",
        description: "Простой, но надежный молоток.",
        type: "tool",
        weight: 1.0,
        stackable: false,
    },
    
    // --- ОСОБЫЕ/КВЕСТОВЫЕ ---
    diary_page: {
        id: "diary_page",
        name: "Вырванная страница дневника",
        description: "Кажется, здесь есть какая-то информация...",
        type: "quest_item",
        weight: 0.01,
        stackable: false,
    }
};

window.ITEM_DEFINITIONS = ITEM_DEFINITIONS;
