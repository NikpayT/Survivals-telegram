// buildings.js

// Базовые определения структур.
// game.state.structures будет создаваться как глубокая копия этого объекта,
// чтобы уровни и другие изменяемые параметры хранились в состоянии игры,
// а не модифицировали этот исходный шаблон.

const BASE_STRUCTURE_DEFINITIONS = {
    shelter: {
        name: "Убежище",
        baseCost: { materials: 20, food: 0 }, // Базовая стоимость для уровня 1 -> 2
        costMultiplier: 1.8, // На сколько умножается базовая стоимость за каждый след. уровень
        initialLevel: 1, // Убежище всегда начинается с 1-го уровня
        maxLevel: 5,
        description: "Увеличивает максимальное количество выживших.",
        effect: (level) => ({ maxSurvivors: 2 * level }) // Эффект зависит от уровня
    },
    waterCollector: {
        name: "Сборщик воды",
        baseCost: { materials: 15 },
        costMultiplier: 1.7,
        initialLevel: 0,
        maxLevel: 10,
        description: "Производит воду каждый день.",
        effect: (level) => ({ waterPerDay: 3 * level })
    },
    garden: {
        name: "Маленький огород",
        baseCost: { materials: 25, water: 5 },
        costMultiplier: 1.7,
        initialLevel: 0,
        maxLevel: 10,
        description: "Производит еду каждый день.",
        effect: (level) => ({ foodPerDay: 2 * level }) // Немного уменьшил для баланса с ручным кормлением
    },
    workshop: {
        name: "Мастерская",
        baseCost: { materials: 30 },
        costMultiplier: 2.0,
        initialLevel: 0,
        maxLevel: 5,
        description: "Увеличивает количество материалов, получаемых при вылазках.",
        effect: (level) => ({ materialBonus: 0.1 * level }) // 10% бонус за уровень
    },
    radioTower: {
        name: "Радиовышка",
        baseCost: { materials: 50, food: 10 }, // Добавим немного еды для реализма
        costMultiplier: 2.2,
        initialLevel: 0,
        maxLevel: 3,
        description: "Увеличивает шанс привлечь новых выживших.",
        effect: (level) => ({ survivorChance: 0.05 * level }) // 5% шанс за уровень
    },
    medBay: {
        name: "Медпункт",
        baseCost: { materials: 40, medicine: 5 },
        costMultiplier: 1.9,
        initialLevel: 0,
        maxLevel: 5,
        description: "Снижает шанс потерь от ранений и болезней, ускоряет выздоровление (пока не реализовано). Уменьшает потребность в медикаментах при ранениях на вылазках.",
        effect: (level) => ({ medicineEfficiency: 0.1 * level }) // 10% шанс сэкономить медикаменты при ранении
    }
};

// Функция для получения текущей стоимости улучшения здания
function getStructureUpgradeCost(structureKey, currentLevel) {
    const definition = BASE_STRUCTURE_DEFINITIONS[structureKey];
    if (!definition) return null;

    const cost = {};
    const multiplier = Math.pow(definition.costMultiplier, currentLevel - definition.initialLevel); // currentLevel уже для *следующего* уровня, если initialLevel=0, то для 1го уровня currentLevel=0.
                                                                                                 // если initialLevel=1 (shelter), то для улучшения до 2го уровня currentLevel=1.
                                                                                                 // поэтому currentLevel - definition.initialLevel

    for (const resource in definition.baseCost) {
        // Для первого уровня (когда currentLevel === definition.initialLevel), множитель должен быть 1 для baseCost
        // Для shelter (initialLevel 1), когда currentLevel = 1, мы строим уровень 2, множитель Math.pow(def.costMultiplier, 1-1) = 1. Правильно.
        // Для garden (initialLevel 0), когда currentLevel = 0, мы строим уровень 1, множитель Math.pow(def.costMultiplier, 0-0) = 1. Правильно.
        cost[resource] = Math.ceil(definition.baseCost[resource] * (currentLevel === definition.initialLevel && definition.initialLevel > 0 ? 1 : (currentLevel === 0 && definition.initialLevel === 0 ? 1 : multiplier) ) );
        if (currentLevel > definition.initialLevel) { // Если это не первое строительство, а улучшение
             cost[resource] = Math.ceil(definition.baseCost[resource] * multiplier);
        } else if (definition.initialLevel === 0 && currentLevel === 0) { // Первое строительство здания с initialLevel 0
             cost[resource] = Math.ceil(definition.baseCost[resource]); // Просто базовая стоимость
        }
    }
    return cost;
}


// Сделаем доступным глобально, если script.js не будет использовать import/export
window.BASE_STRUCTURE_DEFINITIONS = BASE_STRUCTURE_DEFINITIONS;
window.getStructureUpgradeCost = getStructureUpgradeCost;
