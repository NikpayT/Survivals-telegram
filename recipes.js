// recipes.js

const CRAFTING_RECIPES = {
    purify_water_crude: {
        id: "purify_water_crude",
        name: "Очистить грязную воду (примитивно)",
        description: "Прокипятить грязную воду на костре. Не идеально, но лучше, чем ничего.",
        resultItemId: "water_purified",
        resultQuantity: 1,
        ingredients: [
            { itemId: "water_dirty", quantity: 1 },
            { itemId: "wood", quantity: 1 } // Дрова для костра
        ],
        toolsRequired: [], // Например, ["pot"] если бы был котелок
        workshopLevelRequired: 0, // Не требует мастерской
        timeToCraft: 0.1 // Доля дня (пока не используется, но для будущего)
    },
    make_bandages_clean: {
        id: "make_bandages_clean",
        name: "Сделать чистые бинты",
        description: "Используя ткань и антисептик, можно сделать более надежные бинты.",
        resultItemId: "bandages_clean", // Новый предмет, нужно добавить в items.js
        resultQuantity: 2,
        ingredients: [
            { itemId: "cloth", quantity: 2 },
            { itemId: "antiseptic", quantity: 1 }
        ],
        toolsRequired: [],
        workshopLevelRequired: 0, 
        timeToCraft: 0.1
    },
    dismantle_electronics: {
        id: "dismantle_electronics",
        name: "Разобрать сломанную электронику",
        description: "Можно попытаться извлечь полезные компоненты и провода.",
        resultItemId: "components", // Дает компоненты...
        resultQuantity: 1,         // ...и провода (реализуем через multiple results или отдельные рецепты)
        ingredients: [
            { itemId: "broken_electronics", quantity: 1 }
        ],
        toolsRequired: ["tool_hammer"], // Нужен хотя бы молоток для разборки
        workshopLevelRequired: 1, // Требует Мастерскую 1-го уровня
        timeToCraft: 0.2,
        // Дополнительный результат:
        additionalResults: [
            { itemId: "wires", quantity: [1, 3] } // от 1 до 3 проводов случайным образом
        ]
    },
    craft_stimpack_simple: {
        id: "craft_stimpack_simple",
        name: "Создать простой стимулятор",
        description: "Смесь из целебных трав и химикатов для быстрого заживления.",
        resultItemId: "stimpack_fallout", // Используем существующий стимулятор
        resultQuantity: 1,
        ingredients: [
            { itemId: "healing_herbs", quantity: 3 },
            { itemId: "chemicals", quantity: 1 },
            { itemId: "bandages_crude", quantity: 1} // Для основы
        ],
        toolsRequired: [],
        workshopLevelRequired: 2, // Требует Мастерскую 2-го уровня и Медпункт (пока только мастерскую)
        timeToCraft: 0.3
    },
    upgrade_scrap_metal: {
        id: "upgrade_scrap_metal",
        name: "Обработать металлолом",
        description: "Очистить и подготовить металлолом, превратив его в более качественные компоненты.",
        resultItemId: "components",
        resultQuantity: 2,
        ingredients: [
            { itemId: "scrap_metal", quantity: 5 },
            { itemId: "wood", quantity: 2 } // Для огня/обработки
        ],
        toolsRequired: ["tool_hammer"],
        workshopLevelRequired: 1,
        timeToCraft: 0.25
    }
    // Добавить больше рецептов:
    // - Еда: вяленое мясо, консервированные овощи
    // - Оружие: заточка, простой лук, копье
    // - Броня: кожаные накладки
    // - Инструменты: отмычки
};

// Для доступа из других файлов (если не используем модули)
window.CRAFTING_RECIPES = CRAFTING_RECIPES;
