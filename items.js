// items.js

const ITEM_DEFINITIONS = {
    // --- ЕДА ---
    food_canned: {
        id: "food_canned",
        name: "Консервы",
        description: "Банка тушенки или чего-то похожего. Сытно.",
        type: "food",
        effect: { hunger: 25 }, // Восстанавливает 25 ед. сытости
        weight: 0.5,
        stackable: true,
    },
    food_scraps: {
        id: "food_scraps",
        name: "Объедки",
        description: "Не первой свежести, но лучше, чем ничего.",
        type: "food",
        effect: { hunger: 10, morale_debuff: 1 }, // Небольшой штраф к морали (пока не реализовано)
        weight: 0.2,
        stackable: true,
    },
    // --- ВОДА ---
    water_dirty: {
        id: "water_dirty",
        name: "Грязная вода",
        description: "Мутная жижа. Лучше очистить перед употреблением.",
        type: "water_source", // Можно пить, но с риском, или использовать для очистки
        effect: { thirst: 15, sickness_chance: 0.3 }, // Восстанавливает жажду, но есть шанс заболеть
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
    // --- МЕДИКАМЕНТЫ ---
    bandages_crude: {
        id: "bandages_crude",
        name: "Грубые бинты",
        description: "Сделаны из грязной ткани. Лучше, чем ничего.",
        type: "medicine",
        effect: { healing: 10, infection_chance: 0.1 }, // Лечит немного, но может вызвать инфекцию
        weight: 0.1,
        stackable: true,
    },
    antiseptic: {
        id: "antiseptic",
        name: "Антисептик",
        description: "Для обработки ран и предотвращения инфекций.",
        type: "medicine",
        effect: { prevent_infection: true },
        weight: 0.2,
        stackable: true,
    },
    stimpack_fallout: { // Явное указание на Fallout для примера
        id: "stimpack_fallout",
        name: "Стимулятор",
        description: "Быстрое восстановление здоровья. Классика Пустошей.",
        type: "medicine",
        effect: { healing: 50 },
        weight: 0.1,
        stackable: false, // Стимуляторы обычно не стакаются в одном слоте (каждый - отдельный предмет)
    },
    // --- ИНСТРУМЕНТЫ (пока без особой механики, просто для наличия) ---
    tool_hammer: {
        id: "tool_hammer",
        name: "Молоток",
        description: "Простой, но надежный молоток.",
        type: "tool",
        weight: 1.0,
        stackable: false,
    },
    // --- ОСОБЫЕ/КВЕСТОВЫЕ (пример) ---
    diary_page: {
        id: "diary_page",
        name: "Вырванная страница дневника",
        description: "Кажется, здесь есть какая-то информация...",
        type: "quest_item",
        weight: 0.01,
        stackable: false,
    }
};

// Сделаем доступным глобально
window.ITEM_DEFINITIONS = ITEM_DEFINITIONS;
