// js/gameLogic/factionManager.js

class FactionManager {
    constructor() {
        // Уведомление UI Manager'у об инициализации, если он доступен
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('FactionManager инициализирован.');
        } else {
            console.log('FactionManager инициализирован (UI Manager недоступен).');
        }
        this.factionsListElement = document.getElementById('factions-list');
    }

    initFactions() {
        // Инициализируем репутацию для каждой фракции из GameFactions
        for (const factionId in GameFactions) {
            // Устанавливаем начальную репутацию, если её нет
            if (window.gameState.factions[factionId] === undefined) {
                window.gameState.factions[factionId] = GameFactions[factionId].initialReputation;
            }
        }
        window.uiManager.addGameLog('Репутация фракций инициализирована.');
        this.displayFactions(); // Отображаем фракции сразу после инициализации
    }

    // Изменение репутации с фракцией
    changeReputation(factionId, amount) {
        if (window.gameState.factions.hasOwnProperty(factionId)) {
            window.gameState.factions[factionId] += amount;
            // Ограничиваем репутацию от -100 до 100 (или другим диапазоном)
            window.gameState.factions[factionId] = Math.max(-100, Math.min(100, window.gameState.factions[factionId]));
            window.uiManager.addGameLog(`Ваша репутация с фракцией "${GameFactions[factionId].name}" изменилась на ${amount}. Текущая: ${window.gameState.factions[factionId]}.`);
            this.displayFactions(); // Обновляем UI
        } else {
            window.uiManager.addGameLog(`Ошибка: Фракция "${factionId}" не найдена.`);
        }
    }

    getReputation(factionId) {
        return window.gameState.factions[factionId] || 0;
    }

    // Метод для отображения списка фракций и их репутации в UI
    displayFactions() {
        if (!this.factionsListElement) {
            console.warn("FactionManager: Элемент #factions-list не найден.");
            return;
        }
        this.factionsListElement.innerHTML = '<h3>Ваша репутация с фракциями:</h3>';

        for (const factionId in window.gameState.factions) {
            const reputation = window.gameState.factions[factionId];
            const factionData = GameFactions[factionId];

            if (factionData) {
                const repStatus = reputation > 50 ? 'Союзники' :
                                  reputation > 10 ? 'Дружелюбные' :
                                  reputation > -10 ? 'Нейтральные' :
                                  reputation > -50 ? 'Недружелюбные' : 'Враги';

                const factionDiv = document.createElement('div');
                factionDiv.classList.add('faction-entry');
                factionDiv.innerHTML = `
                    <h4>${factionData.name}</h4>
                    <p>Репутация: ${reputation} (${repStatus})</p>
                    <p>${factionData.description}</p>
                    `;
                this.factionsListElement.appendChild(factionDiv);
            } else {
                console.warn(`FactionManager: Данные для фракции "${factionId}" не найдены в GameFactions.`);
            }
        }
    }
}
