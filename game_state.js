// game_state.js

// Убедимся, что внешние определения загружены, прежде чем использовать их
const baseSurroundingsInitialAttempts = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]?.initialSearchAttempts) || 5;
const baseSurroundingsName = (typeof LOCATION_DEFINITIONS !== 'undefined' && LOCATION_DEFINITIONS["base_surroundings"]?.name) || "Окрестности Базы";


const initialGameState = {
    day: 1,
    survivors: 1,
    gameOver: false,
    currentEvent: null, 
    structures: {}, // Будет инициализировано из BASE_STRUCTURE_DEFINITIONS в game.initializeStructures
    
    inventory: [], // Личный инвентарь игрока
    baseInventory: [], // Склад базы (общаг)

    player: {
        health: 100, maxHealth: 100,
        hunger: 100, maxHunger: 100, 
        thirst: 100, maxThirst: 100, 
        carryWeight: 0, maxCarryWeight: 25, 
        condition: "В порядке", 
    },
    dailyFoodNeed: 0, // Будет рассчитываться в начале дня
    dailyWaterNeed: 0, // Будет рассчитываться в начале дня

    currentLocationId: "base_surroundings", 
    discoveredLocations: { 
        "base_surroundings": { 
            discovered: true, 
            name: baseSurroundingsName,
            searchAttemptsLeft: baseSurroundingsInitialAttempts,
            foundSpecialItems: {} // Для отслеживания уникальных находок в локации
        } 
    },
    locationEvent: null, // Событие, специфичное для текущей локации
    logVisible: true, // Видимость панели лога
    flags: {}, // Для отслеживания глобальных флагов/состояний игры
};

// Глобальный объект состояния, который будет модифицироваться игрой
// Мы делаем глубокую копию, чтобы изменения в gameState не затрагивали initialGameState
let gameState = JSON.parse(JSON.stringify(initialGameState));


// Геттеры, которые будут работать с gameState
const GameStateGetters = {
    getMaxSurvivors: function() {
        let max = 0;
        // Предполагается, что BASE_STRUCTURE_DEFINITIONS.shelter.effect(level) возвращает объект с полем maxSurvivors
        if (gameState.structures.shelter && gameState.structures.shelter.level > 0 && 
            typeof BASE_STRUCTURE_DEFINITIONS !== 'undefined' && BASE_STRUCTURE_DEFINITIONS.shelter &&
            typeof BASE_STRUCTURE_DEFINITIONS.shelter.effect === 'function') {
            try {
                max += BASE_STRUCTURE_DEFINITIONS.shelter.effect(gameState.structures.shelter.level).maxSurvivors || 0;
            } catch (e) {
                console.error("Error getting maxSurvivors from shelter effect:", e);
            }
        }
        return max || 1; // Минимум 1 место для игрока
    },

    getHungerThresholds: function() { return { critical: 20, low: 40, normal: 100 }; }, // normal здесь как бы "сыт до этого значения"
    getThirstThresholds: function() { return { critical: 15, low: 35, normal: 100 }; }, // Аналогично
    
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

    countBaseFoodItems: function() { // Считает общую "сытость" еды на складе
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

    countBaseWaterItems: function() { // Считает общее "утоление жажды" воды на складе
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
                const itemIdForMap = itemDef.id || slot.itemId; // Используем itemDef.id если есть, иначе itemId из слота

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
        return breakdownString.trim().replace(/\n/g, '\r\n'); // Для корректного переноса строк в title атрибуте
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
    }
};
