// game_state.js

// Убедимся, что внешние определения загружены, прежде чем использовать их
const baseSurroundingsInitialAttempts = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]?.initialSearchAttempts) || 5;
const baseSurroundingsName = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]?.name) || "Окрестности Базы";


const initialGameState = {
    day: 1,
    survivors: 1,
    gameOver: false,
    currentEvent: null, 
    structures: {}, // Будет инициализировано из BASE_STRUCTURE_DEFINITIONS
    
    inventory: [], // Личный инвентарь игрока
    baseInventory: [], // Склад базы (общаг)

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
            discovered: true, 
            name: baseSurroundingsName,
            searchAttemptsLeft: baseSurroundingsInitialAttempts,
            foundSpecialItems: {} 
        } 
    },
    locationEvent: null, 
    logVisible: true, 
    flags: {}, 
};

// Глобальный объект состояния, который будет модифицироваться игрой
// Мы делаем глубокую копию, чтобы изменения в gameState не затрагивали initialGameState
let gameState = JSON.parse(JSON.stringify(initialGameState));


// Геттеры, которые будут работать с gameState
const GameStateGetters = {
    getMaxSurvivors: function() {
        let max = 0;
        if (gameState.structures.shelter && gameState.structures.shelter.level > 0 && typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined') {
            max += BASE_STRUCTURE_DEFINITIONS.shelter.effect(gameState.structures.shelter.level).maxSurvivors;
        }
        return max || 1;
    },
    getHungerThresholds: function() { return { critical: 20, low: 40, normal: 100 }; },
    getThirstThresholds: function() { return { critical: 15, low: 35, normal: 100 }; },
    
    getTotalPlayerResourceValue: function(type) { 
        let totalValue = 0;
        gameState.inventory.forEach(itemSlot => {
            const itemDef = ITEM_DEFINITIONS[itemSlot.itemId];
            if (itemDef && itemDef.effect) {
                if (type === 'food' && itemDef.type === 'food' && itemDef.effect.hunger) {
                    totalValue += itemDef.effect.hunger * itemSlot.quantity;
                } else if (type === 'water_source' && (itemDef.type === 'water' || itemDef.type === 'water_source') && itemDef.effect.thirst) {
                    totalValue += itemDef.effect.thirst * itemSlot.quantity;
                }
            }
        });
        return totalValue;
    },
    countBaseFoodItems: function() {
        let count = 0;
        gameState.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && itemDef.type === 'food') {
                count += slot.quantity * (itemDef.effect?.hunger || 0); 
            }
        });
        return count;
    },
    countBaseWaterItems: function() {
        let count = 0;
        gameState.baseInventory.forEach(slot => {
            const itemDef = ITEM_DEFINITIONS[slot.itemId];
            if (itemDef && (itemDef.type === 'water' || itemDef.type === 'water_source')) {
                 count += slot.quantity * (itemDef.effect?.thirst || 0); 
            }
        });
        return count;
    }
};
