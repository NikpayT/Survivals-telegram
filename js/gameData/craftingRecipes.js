// /js/gameData/craftingRecipes.js
// Определение рецептов крафта

const CraftingRecipes = [
    {
        id: 'craft_bandages',
        name: 'Сделать бинты',
        description: 'Из тряпок можно сделать полезные бинты.',
        output: { itemId: 'bandages', quantity: 3 },
        ingredients: [
            { itemId: 'cloth_scraps', quantity: 1 }
        ],
        requiredStation: null, // Не требует специальной станции
        skillRequired: { survival: 5 } // Требует навык выживания 5
    },
    {
        id: 'craft_pistol_ammo',
        name: 'Собрать патроны',
        description: 'Из пороха и металла можно собрать несколько патронов для пистолета.',
        output: { itemId: 'pistol_ammo', quantity: 5 },
        ingredients: [
            { itemId: 'gunpowder', quantity: 1 },
            { itemId: 'scraps_metal', quantity: 1 }
        ],
        requiredStation: 'workbench', // Требует верстак
        skillRequired: { crafting: 10 } // Требует навык крафта 10
    },
    {
        id: 'craft_pipe_pistol',
        name: 'Создать самодельный пистолет',
        description: 'Грубое, но функциональное огнестрельное оружие из подручных материалов.',
        output: { itemId: 'pipe_pistol', quantity: 1 },
        ingredients: [
            { itemId: 'scraps_metal', quantity: 5 },
            { itemId: 'scraps_wood', quantity: 2 }
        ],
        requiredStation: 'workbench',
        skillRequired: { crafting: 20 }
    },
    {
        id: 'craft_purification_tablets',
        name: 'Сделать таблетки для очистки воды',
        description: 'Из простых компонентов можно создать таблетки для очистки воды.',
        output: { itemId: 'purification_tablets', quantity: 2 },
        ingredients: [
            { itemId: 'components_electronic', quantity: 1 }, // Пример использования электроники
            { itemId: 'cloth_scraps', quantity: 1 }
        ],
        requiredStation: 'chemistry_station', // Пример новой станции
        skillRequired: { science: 15 } // Требует навык науки
    }
    // Здесь будут добавляться новые рецепты
];
