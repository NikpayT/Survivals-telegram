// buildings.js
const BASE_STRUCTURE_DEFINITIONS = {
    shelter: {
        name: "Убежище",
        baseCost: { wood: 20, scrap_metal: 10 }, // Используем itemId
        costMultiplier: 1.8,
        initialLevel: 1,
        maxLevel: 5,
        description: "Увеличивает максимальное количество выживших.",
        effect: (level) => ({ maxSurvivors: 2 * level })
    },
    waterCollector: {
        name: "Сборщик воды",
        baseCost: { scrap_metal: 15, components: 2 },
        costMultiplier: 1.7,
        initialLevel: 0,
        maxLevel: 10,
        description: "Производит немного грязной воды каждый день (механика производства пока не добавлена в nextDay).",
        effect: (level) => ({ waterPerDay: 2 * level }) // Предположим, производит water_dirty
    },
    garden: {
        name: "Маленький огород",
        baseCost: { wood: 15, cloth: 5 }, // Ткань для мешков с землей или укрытия
        costMultiplier: 1.7,
        initialLevel: 0,
        maxLevel: 10,
        description: "Позволяет выращивать немного еды (механика производства пока не добавлена).",
        effect: (level) => ({ foodPerDay: 1 * level }) // Например, food_scraps или новый предмет "овощи"
    },
    workshop: {
        name: "Мастерская",
        baseCost: { wood: 20, scrap_metal: 25, components: 5 },
        costMultiplier: 2.0,
        initialLevel: 0,
        maxLevel: 5,
        description: "Открывает доступ к крафту продвинутых предметов и улучшает эффективность сбора материалов.",
        effect: (level) => ({ materialBonus: 0.05 * level, craftingTier: level }) // 5% бонус и уровень крафта
    },
    radioTower: {
        name: "Радиовышка",
        baseCost: { scrap_metal: 30, components: 10 },
        costMultiplier: 2.2,
        initialLevel: 0,
        maxLevel: 3,
        description: "Увеличивает шанс привлечь новых выживших.",
        effect: (level) => ({ survivorChance: 0.05 * level })
    },
    medBay: {
        name: "Медпункт",
        baseCost: { cloth: 10, components: 8, antiseptic: 2 }, // Требует антисептик для стерильности
        costMultiplier: 1.9,
        initialLevel: 0,
        maxLevel: 5,
        description: "Улучшает лечение и снижает шанс осложнений.",
        effect: (level) => ({ medicineEfficiency: 0.05 * level, healingBonus: 5 * level })
    }
};

// Функция для получения текущей стоимости улучшения здания
// getStructureUpgradeCost осталась без изменений, т.к. она уже работает с ключами объекта baseCost
function getStructureUpgradeCost(structureKey, currentLevel) {
    const definition = BASE_STRUCTURE_DEFINITIONS[structureKey];
    if (!definition) return null;

    const cost = {};
    // Расчет множителя: для первого уровня (currentLevel = initialLevel) множитель 1.
    // Для последующих currentLevel будет на 1 больше, чем реальный текущий уровень при расчете.
    // Пример: shelter initialLevel 1. Улучшаем до 2. currentLevel = 1. (1 - 1) = 0. mult^0 = 1.
    // garden initialLevel 0. Строим 1. currentLevel = 0. (0 - 0) = 0. mult^0 = 1.
    // garden level 1. Улучшаем до 2. currentLevel = 1. (1 - 0) = 1. mult^1.
    const effectiveLevelForMultiplier = currentLevel - definition.initialLevel;

    const multiplier = Math.pow(definition.costMultiplier, Math.max(0, effectiveLevelForMultiplier));

    for (const resourceItemId in definition.baseCost) {
        cost[resourceItemId] = Math.ceil(definition.baseCost[resourceItemId] * multiplier);
    }
    return cost;
}

window.BASE_STRUCTURE_DEFINITIONS = BASE_STRUCTURE_DEFINITIONS;
window.getStructureUpgradeCost = getStructureUpgradeCost;
