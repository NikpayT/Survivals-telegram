// /js/gameLogic/factionManager.js
// Управление репутацией игрока с различными фракциями

class FactionManager {
    constructor() {
        console.log('FactionManager инициализирован.');
    }

    /**
     * Инициализирует репутацию игрока со всеми фракциями.
     * Вызывается один раз при старте игры.
     */
    initFactions() {
        for (const factionId in GameFactions) {
            window.gameState.factions[factionId] = GameFactions[factionId].initialReputation;
        }
        window.addGameLog('Репутация фракций инициализирована.');
    }

    /**
     * Изменяет репутацию игрока с фракцией.
     * @param {string} factionId - ID фракции.
     * @param {number} amount - Количество, на которое изменяется репутация (положительное для улучшения, отрицательное для ухудшения).
     */
    adjustReputation(factionId, amount) {
        if (window.gameState.factions[factionId] === undefined) {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Фракция с ID "${factionId}" не найдена.`);
            return;
        }

        window.gameState.factions[factionId] += amount;
        // Ограничиваем репутацию от 0 до 100
        if (window.gameState.factions[factionId] > 100) window.gameState.factions[factionId] = 100;
        if (window.gameState.factions[factionId] < 0) window.gameState.factions[factionId] = 0;

        window.addGameLog(`Репутация с "${GameFactions[factionId].name}" изменилась на ${amount}. Текущая: ${window.gameState.factions[factionId]}.`);
        window.uiManager.updateFactionsList(); // Обновляем UI
    }

    /**
     * Возвращает статус репутации (Враждебный, Нейтральный и т.д.).
     * @param {string} factionId - ID фракции.
     * @param {number} reputation - Текущее значение репутации.
     * @returns {string} - Статус репутации.
     */
    getReputationStatus(factionId, reputation) {
        const thresholds = GameFactions[factionId].reputationThresholds;

        if (reputation <= thresholds.hostile) return 'Враждебный';
        if (reputation <= thresholds.unfriendly) return 'Недружелюбный';
        if (reputation <= thresholds.neutral) return 'Нейтральный';
        if (reputation <= thresholds.friendly) return 'Дружелюбный';
        return 'Союзный'; // Если репутация выше friendly
    }

    /**
     * Проверяет, является ли репутация с фракцией достаточной для действия.
     * @param {string} factionId - ID фракции.
     * @param {string} requiredStatus - Требуемый статус ('Hostile', 'Unfriendly', etc.).
     * @returns {boolean}
     */
    checkReputation(factionId, requiredStatus) {
        if (window.gameState.factions[factionId] === undefined) {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Фракция с ID "${factionId}" не найдена.`);
            return false;
        }

        const currentReputation = window.gameState.factions[factionId];
        const currentStatus = this.getReputationStatus(factionId, currentReputation);

        const statusOrder = ['Враждебный', 'Недружелюбный', 'Нейтральный', 'Дружелюбный', 'Союзный'];
        const requiredIndex = statusOrder.indexOf(requiredStatus);
        const currentIndex = statusOrder.indexOf(currentStatus);

        return currentIndex >= requiredIndex;
    }

    // Здесь можно добавить функции для выполнения квестов фракций, торговли и т.д.
}
