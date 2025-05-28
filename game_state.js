// game_state.js

const baseSurroundingsInitialAttempts = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]?.initialSearchAttempts) || 5;
const baseSurroundingsName = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]?.name) || "Окрестности Базы";

const initialGameState = {
    day: 1,
    survivors: 1,
    gameOver: false,
    currentEvent: null,
    structures: {}, 
    inventory: [], 
    baseInventory: [],
    baseMaxCapacity: 100, 
    
    player: {
        health: 100, maxHealth: 100,
        hunger: 100, maxHunger: 100,
        thirst: 100, maxThirst: 100,
        carryWeight: 0, maxCarryWeight: 25,
        condition: "В порядке",
    },
    dailyFoodNeed: 0,
    dailyWaterNeed: 0,
    currentLocationId: "base_surroundings",
    discoveredLocations: {
        "base_surroundings": {
            discovered: true, name: baseSurroundingsName,
            searchAttemptsLeft: baseSurroundingsInitialAttempts, foundSpecialItems: {}
        }
    },
    locationEvent: null,
    logVisible: true,
    flags: {},
    // НОВОЕ ПОЛЕ для состояния сезонных событий
    seasonalEvents: {
        // Пример для новогоднего события
        // newYear: {
        //     isActive: false,
        //     currentStage: null, // ID текущего этапа
        //     flags: {} // Флаги, специфичные для текущего прохождения события (например, найдена ли елка)
        // }
    }
};

let gameState = JSON.parse(JSON.stringify(initialGameState));

const GameStateGetters = {
    getMaxSurvivors: function() {
        let max = 0;
        if (gameState.structures.shelter && gameState.structures.shelter.level > 0 && 
            typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined' && BASE_STRUCTURE_DEFINITIONS.shelter &&
            typeof BASE_STRUCTURE_DEFINITIONS.shelter.effect === 'function') {
            try {
                max += BASE_STRUCTURE_DEFINITIONS.shelter.effect(gameState.structures.shelter.level).maxSurvivors || 0;
            } catch (e) {
                console.error("Error getting maxSurvivors from shelter effect:", e);
            }
        }
        return max || 1;
    },

    getHungerThresholds: function() { return { critical: 20, low: 40, normal: 100 }; },
    getThirstThresholds: function() { return { critical: 15, low: 35, normal: 100 }; },
    
    getTotalPlayerResourceValue: function(type) { 
        let totalValue = 0;
        if (typeof ITEM_DEFINITIONS === 'undefined' || !gameState.inventory) return 0;
        gameState.inventory.forEach(itemSlot => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (itemDef && itemDef.effect) {
                if (type === 'food' && itemDef.type === 'food' && typeof itemDef.effect.hunger === 'number') {
                    totalValue += itemDef.effect.hunger * itemSlot.quantity;
                } else if (type === 'water_source' && (itemDef.type === 'water' || itemDef.type === 'water_source') && typeof itemDef.effect.thirst === 'number') {
                    totalValue += itemDef.effect.thirst * itemSlot.quantity;
                }
            }
        });
        return totalValue;
    },

    countBaseFoodItems: function() { 
        let count = 0;
        if (typeof ITEM_DEFINITIONS === 'undefined' || !gameState.baseInventory) return 0;
        gameState.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && itemDef.type === 'food' && itemDef.effect?.hunger) {
                count += slot.quantity * (itemDef.effect.hunger || 0); 
            }
        });
        return count;
    },

    countBaseWaterItems: function() { 
        let count = 0;
        if (typeof ITEM_DEFINITIONS === 'undefined' || !gameState.baseInventory) return 0;
        gameState.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect?.thirst) {
                 count += slot.quantity * (itemDef.effect.thirst || 0); 
            }
        });
        return count;
    },

    getBaseFoodBreakdown: function() {
        if (typeof ITEM_DEFINITIONS === 'undefined' || !gameState.baseInventory) return "Нет данных о еде.";
        const foodMap = new Map(); 
        let totalOverallValue = 0;
        gameState.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && itemDef.type === 'food' && itemDef.effect?.hunger) {
                const valuePerItem = itemDef.effect.hunger || 0;
                totalOverallValue += slot.quantity * valuePerItem;
                const itemIdForMap = itemDef.id || slot.itemId;
                if (foodMap.has(itemIdForMap)) {
                    const existing = foodMap.get(itemIdForMap);
                    existing.totalValue += slot.quantity * valuePerItem;
                    existing.quantity += slot.quantity;
                } else {
                    foodMap.set(itemIdForMap, {
                        name: itemDef.name,
                        totalValue: slot.quantity * valuePerItem,
                        quantity: slot.quantity
                    });
                }
            }
        });
        if (foodMap.size === 0) return "Еды нет на складе.";
        let breakdownString = `Всего еды: ${totalOverallValue} сытости.\nДетализация:\n`;
        foodMap.forEach(food => {
            breakdownString += `• ${food.name} (x${food.quantity}): ${food.totalValue} сыт.\n`;
        });
        return breakdownString.trim().replace(/\n/g, '\r\n');
    },

    getBaseWaterBreakdown: function() {
        if (typeof ITEM_DEFINITIONS === 'undefined' || !gameState.baseInventory) return "Нет данных о воде.";
        const waterMap = new Map();
        let totalOverallValue = 0;
        gameState.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect?.thirst) {
                const valuePerItem = itemDef.effect.thirst || 0;
                totalOverallValue += slot.quantity * valuePerItem;
                const itemIdForMap = itemDef.id || slot.itemId;
                 if (waterMap.has(itemIdForMap)) {
                    const existing = waterMap.get(itemIdForMap);
                    existing.totalValue += slot.quantity * valuePerItem;
                    existing.quantity += slot.quantity;
                } else {
                    waterMap.set(itemIdForMap, {
                        name: itemDef.name,
                        totalValue: slot.quantity * valuePerItem,
                        quantity: slot.quantity
                    });
                }
            }
        });
        if (waterMap.size === 0) return "Воды нет на складе.";
        let breakdownString = `Всего воды: ${totalOverallValue} жажды.\nДетализация:\n`;
        waterMap.forEach(water => {
            breakdownString += `• ${water.name} (x${water.quantity}): ${water.totalValue} жажд.\n`;
        });
        return breakdownString.trim().replace(/\n/g, '\r\n');
    },

    getBaseInventoryUsage: function() {
        if (!gameState.baseInventory) {
            return { current: 0, max: gameState.baseMaxCapacity || 0, percentage: 0 };
        }
        const currentUsage = gameState.baseInventory.length;
        const maxCapacity = gameState.baseMaxCapacity || 100; 
        const percentage = maxCapacity > 0 ? (currentUsage / maxCapacity) * 100 : 0;
        return { current: currentUsage, max: maxCapacity, percentage: Math.min(100, percentage) };
    }
};
