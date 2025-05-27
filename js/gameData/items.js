// /js/gameData/items.js
// Определение всех предметов и ресурсов в игре

const GameItems = {
    // Ресурсы для выживания
    'water_bottle': {
        id: 'water_bottle',
        name: 'Бутылка воды',
        description: 'Обычная пластиковая бутылка с чистой водой. Жизненно необходима.',
        type: 'consumable',
        effect: { thirst: -20 }, // Снижает жажду на 20%
        rarity: 'common',
        stackable: true
    },
    'canned_food': {
        id: 'canned_food',
        name: 'Консервы',
        description: 'Старые, но всё ещё съедобные консервы. Спасут от голода.',
        type: 'consumable',
        effect: { hunger: -30 }, // Снижает голод на 30%
        rarity: 'common',
        stackable: true
    },
    'medkit_basic': {
        id: 'medkit_basic',
        name: 'Базовый медкомплект',
        description: 'Содержит бинты и антисептик. Для лечения небольших ран.',
        type: 'consumable',
        effect: { health: +25 }, // Восстанавливает здоровье на 25
        rarity: 'uncommon',
        stackable: true
    },
    'scraps_metal': {
        id: 'scraps_metal',
        name: 'Металлический лом',
        description: 'Куски покорёженного металла. Пригодятся для крафта и ремонта.',
        type: 'material',
        rarity: 'common',
        stackable: true
    },
    'scraps_wood': {
        id: 'scraps_wood',
        name: 'Деревянные обломки',
        description: 'Фрагменты дерева от разрушенных строений. Пригодятся в хозяйстве.',
        type: 'material',
        rarity: 'common',
        stackable: true
    },
    'cloth_scraps': {
        id: 'cloth_scraps',
        name: 'Тряпки',
        description: 'Обрывки ткани, пригодные для перевязки или починки.',
        type: 'material',
        rarity: 'common',
        stackable: true
    },
    'gunpowder': {
        id: 'gunpowder',
        name: 'Порох',
        description: 'Легковоспламеняющийся порошок. Основа для боеприпасов.',
        type: 'material',
        rarity: 'rare',
        stackable: true
    },
    'components_electronic': {
        id: 'components_electronic',
        name: 'Электронные компоненты',
        description: 'Различные платы и провода. Ценны для продвинутого крафта.',
        type: 'material',
        rarity: 'rare',
        stackable: true
    },
    'fuel_can': {
        id: 'fuel_can',
        name: 'Канистра с топливом',
        description: 'Старая канистра с остатками горючего. Для генераторов или транспорта.',
        type: 'material',
        rarity: 'uncommon',
        stackable: true
    },

    // Оружие
    'old_knife': {
        id: 'old_knife',
        name: 'Старый нож',
        description: 'Тусклый и зазубренный нож. Подойдет для самозащиты.',
        type: 'weapon',
        damage: 10,
        durability: 50,
        rarity: 'common',
        stackable: false
    },
    'pipe_pistol': {
        id: 'pipe_pistol',
        name: 'Самодельный пистолет',
        description: 'Грубый пистолет, сделанный из водопроводных труб. Ненадежный, но стреляет.',
        type: 'weapon',
        damage: 25,
        durability: 30,
        ammoType: 'pistol_ammo',
        rarity: 'uncommon',
        stackable: false
    },

    // Боеприпасы
    'pistol_ammo': {
        id: 'pistol_ammo',
        name: 'Патроны для пистолета',
        description: 'Несколько патронов для малокалиберного пистолета.',
        type: 'ammo',
        ammoFor: 'pipe_pistol', // Указываем, для какого оружия
        rarity: 'uncommon',
        stackable: true
    },

    // Предметы для квестов (пример)
    'old_map': {
        id: 'old_map',
        name: 'Старая карта',
        description: 'Выцветшая карта довоенного города с пометками.',
        type: 'quest_item',
        rarity: 'unique',
        stackable: false
    },

    // Дополнительные предметы (будут расширяться)
    'bandages': {
        id: 'bandages',
        name: 'Бинты',
        description: 'Простые бинты для перевязки мелких ран.',
        type: 'consumable',
        effect: { health: +10 },
        rarity: 'common',
        stackable: true
    },
    'purification_tablets': {
        id: 'purification_tablets',
        name: 'Таблетки для очистки воды',
        description: 'Несколько таблеток, позволяющих очистить грязную воду.',
        type: 'consumable',
        effect: { waterPurity: +50 }, // Пример нового эффекта
        rarity: 'uncommon',
        stackable: true
    }
};
