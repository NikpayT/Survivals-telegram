// js/gameLogic/factionManager.js

class FactionManager {
    constructor() {
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('FactionManager инициализирован.');
        } else {
            console.log('FactionManager инициализирован (UI Manager недоступен).');
        }
        this.factionsListElement = document.getElementById('factions-list');
        if (!this.factionsListElement) console.warn("FactionManager: Элемент #factions-list не найден.");
    }

    initFactions() {
        if (!GameFactions) {
            console.error("FactionManager: Объект GameFactions не определен.");
            return;
        }
        // Инициализируем репутацию для каждой фракции из GameFactions
        for (const factionId in GameFactions) {
            // Устанавливаем начальную репутацию, если её нет
            if (window.gameState.factions[factionId] === undefined) {
                window.gameState.factions[factionId] = GameFactions[factionId].initialReputation;
            }
        }
        window.addGameLog('Репутация фракций инициализирована.');
        this.displayFactions(); // Отображаем фракции сразу после инициализации
    }

    // Изменение репутации с фракцией
    changeReputation(factionId, amount) {
        if (!window.gameState || !window.gameState.factions) {
            console.warn("FactionManager: gameState.factions не инициализирован.");
            return;
        }
        if (window.gameState.factions.hasOwnProperty(factionId) && GameFactions[factionId]) {
            window.gameState.factions[factionId] += amount;
            // Ограничиваем репутацию от -100 до 100 (или другим диапазоном)
            window.gameState.factions[factionId] = Math.max(-100, Math.min(100, window.gameState.factions[factionId]));
            window.addGameLog(`Ваша репутация с фракцией "${GameFactions[factionId].name}" изменилась на ${amount}. Текущая: ${window.gameState.factions[factionId]}.`);
            this.displayFactions(); // Обновляем UI
        } else {
            window.addGameLog(`Ошибка: Фракция "${factionId}" не найдена или не имеет данных.`);
        }
    }

    getReputation(factionId) {
        if (window.gameState && window.gameState.factions && window.gameState.factions.hasOwnProperty(factionId)) {
            return window.gameState.factions[factionId];
        }
        return 0; // Возвращаем 0, если фракция не найдена
    }

    // Метод для отображения списка фракций и их репутации в UI
    displayFactions() {
        if (!this.factionsListElement) {
            console.warn("FactionManager: Элемент #factions-list не найден.");
            return;
        }
        this.factionsListElement.innerHTML = '<h3>Ваша репутация с фракциями:</h3>';

        if (!window.gameState || !window.gameState.factions || Object.keys(window.gameState.factions).length === 0) {
            this.factionsListElement.innerHTML += '<p>Список фракций пуст.</p>';
            return;
        }

        for (const factionId in window.gameState.factions) {
            const reputation = window.gameState.factions[factionId];
            const factionData = GameFactions[factionId];

            if (factionData) {
                let repStatus = 'Неизвестно';
                if (reputation > 50) repStatus = 'Союзники';
                else if (reputation > 10) repStatus = 'Дружелюбные';
                else if (reputation > -10) repStatus = 'Нейтральные';
                else if (reputation > -50) repStatus = 'Недружелюбные';
                else repStatus = 'Враги';

                const factionDiv = document.createElement('div');
                factionDiv.classList.add('faction-entry');
                factionDiv.innerHTML = `
                    <h4>${factionData.name}</h4>
                    <p>Репутация: ${reputation} (${repStatus})</p>
                    <p>${factionData.description}</p>
                    `;
                this.factionsListElement.appendChild(factionDiv);
            } else {
                console.warn(`FactionManager: Данные для фракции "${factionId}" не найдены в GameFactions. Возможно, ошибка в gameData/factions.js.`);
            }
        }
    }
}
