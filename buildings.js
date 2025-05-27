// buildings.js
const BASE_STRUCTURE_DEFINITIONS = {
    shelter: {
        name: "Убежище",
        baseCost: { wood: 20, scrap_metal: 10 }, 
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
        effect: (level) => ({ waterPerDay: 2 * level }) 
    },
    garden: {
        name: "Маленький огород",
        baseCost: { wood: 15, cloth: 5 }, 
        costMultiplier: 1.7,
        initialLevel: 0,
        maxLevel: 10,
        description: "Позволяет выращивать немного еды (механика производства пока не добавлена).",
        effect: (level) => ({ foodPerDay: 1 * level }) 
    },
    workshop: {
        name: "Мастерская",
        baseCost: { wood: 20, scrap_metal: 25, components: 5 },
        costMultiplier: 2.0,
        initialLevel: 0,
        maxLevel: 5,
        description: "Открывает доступ к крафту продвинутых предметов и улучшает эффективность сбора материалов.",
        effect: (level) => ({ materialBonus: 0.05 * level, craftingTier: level }) 
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
        baseCost: { cloth: 10, components: 8, antiseptic: 2 }, 
        costMultiplier: 1.9,
        initialLevel: 0,
        maxLevel: 5,
        description: "Улучшает лечение и снижает шанс осложнений.",
        effect: (level) => ({ medicineEfficiency: 0.05 * level, healingBonus: 5 * level })
    }
};

function getStructureUpgradeCost(structureKey, currentLevel) {
    const definition = BASE_STRUCTURE_DEFINITIONS[structureKey];
    if (!definition) return null;

    const cost = {};
    const effectiveLevelForMultiplier = currentLevel - definition.initialLevel;
    const multiplier = Math.pow(definition.costMultiplier, Math.max(0, effectiveLevelForMultiplier));

    for (const resourceItemId in definition.baseCost) {
        // Если это самое первое строительство (currentLevel совпадает с initialLevel), или initialLevel = 0 и currentLevel = 0,
        // то множитель должен быть фактически 1 для baseCost.
        // В остальных случаях (улучшение существующей постройки) применяется costMultiplier.
        let costValue = definition.baseCost[resourceItemId];
        if (currentLevel > definition.initialLevel || (definition.initialLevel === 0 && currentLevel > 0) ) {
            costValue *= multiplier;
        }
        cost[resourceItemId] = Math.ceil(costValue);
    }
    return cost;
}

window.BASE_STRUCTURE_DEFINITIONS = BASE_STRUCTURE_DEFINITIONS;
window.getStructureUpgradeCost = getStructureUpgradeCost;
