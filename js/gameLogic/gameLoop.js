// /js/gameLogic/gameLoop.js
// Управление игровым циклом (например, смена дня, случайные события)

class GameLoop {
    constructor() {
        console.log('GameLoop инициализирован.');
        // Пока не используем setInterval для автоматической смены дня,
        // день будет меняться по кнопке "Завершить день"
    }

    /**
     * Запускает ежедневные события (в будущем).
     * @param {Function} onDailyEventsComplete - Callback-функция, которая будет вызвана после обработки всех ежедневных событий.
     */
    triggerDailyEvents(onDailyEventsComplete) {
        window.addGameLog(`Начинаются ежедневные события для дня ${window.gameState.gameDay}...`);

        // 1. Проверка на набеги (зависит от безопасности убежища и репутации с фракциями)
        this._checkRaids();

        // 2. Генерация ресурсов (зависит от уровня фермы, источника воды и т.д.)
        this._generateDailyResources();

        // 3. Возможность присоединения новых выживших
        this._checkNewSurvivors();

        // 4. Случайные события (погода, болезни, встречи и т.д.)
        this._triggerRandomEvent();

        window.addGameLog(`Ежедневные события для дня ${window.gameState.gameDay} завершены.`);

        // Если есть callback, вызываем его
        if (onDailyEventsComplete) {
            onDailyEventsComplete();
        }
    }

    _checkRaids() {
        const community = window.gameState.community;
        const player = window.gameState.player;
        const securityRoll = Math.random() * 100; // Случайное число для проверки безопасности
        let raidChance = 30; // Базовый шанс набега

        // Чем ниже безопасность, тем выше шанс набега
        raidChance += (100 - community.security) / 2;

        // Если какая-либо фракция враждебна, шанс набега увеличивается
        for (const factionId in window.gameState.factions) {
            const reputation = window.gameState.factions[factionId];
            if (window.factionManager.getReputationStatus(factionId, reputation) === 'Враждебный') {
                raidChance += 15; // Увеличение шанса набега за каждую враждебную фракцию
            }
        }

        if (securityRoll < raidChance) {
            window.addGameLog('**ОПАСНОСТЬ! На ваше убежище совершается нападение!**');
            // Здесь должна быть логика боя или других последствий набега
            // Пока просто уменьшим ресурсы и мораль
            community.adjustMorale(-20);
            community.removeResource('food', Math.floor(community.resources.food * 0.1)); // Теряем 10% еды
            community.removeResource('water', Math.floor(community.resources.water * 0.1)); // Теряем 10% воды
            window.addGameLog('Нападающие разграбили часть ваших припасов и подорвали мораль общины.');
            // Можно добавить ранения выживших или самого игрока
            player.adjustHealth(-Math.floor(Math.random() * 10)); // Игрок может получить урон
        } else {
            window.addGameLog('Убежище пережило ночь без происшествий.');
        }
    }

    _generateDailyResources() {
        const community = window.gameState.community;
        // Генерация воды
        if (community.facilities.water_source_level > 0) {
            const waterGenerated = community.facilities.water_source_level * (Math.floor(Math.random() * 5) + 5); // 5-10 воды за уровень
            community.addResource('water', waterGenerated);
            window.addGameLog(`Источник воды произвел ${waterGenerated} ед. чистой воды.`);
        }
        // Генерация еды
        if (community.facilities.farm_level > 0) {
            const foodGenerated = community.facilities.farm_level * (Math.floor(Math.random() * 8) + 8); // 8-15 еды за уровень
            community.addResource('food', foodGenerated);
            window.addGameLog(`Ферма произвела ${foodGenerated} ед. еды.`);
        }
        // В будущем можно добавить генерацию других ресурсов в зависимости от построек
    }

    _checkNewSurvivors() {
        const community = window.gameState.community;
        const player = window.gameState.player;
        let recruitChance = 0;

        // Шанс привлечения зависит от морали, безопасности и харизмы игрока
        recruitChance += community.morale / 10;
        recruitChance += community.security / 20;
        recruitChance += player.skills.charisma / 5;

        if (Math.random() * 100 < recruitChance && community.survivors < 10) { // Лимит на выживших
            const newSurvivors = Math.floor(Math.random() * 2) + 1; // 1-2 новых выживших
            community.addSurvivors(newSurvivors);
            community.adjustMorale(5);
            window.addGameLog(`К вам присоединилось ${newSurvivors} новых выживших!`);
        }
    }

    _triggerRandomEvent() {
        const random = Math.random();
        if (random < 0.1) { // 10% шанс на негативное событие
            window.addGameLog('**Случайное событие:** Погода ухудшилась, ресурсы будут добываться сложнее.');
            // Здесь можно добавить временный дебафф на сбор ресурсов
        } else if (random < 0.2) { // 10% шанс на позитивное событие
            window.addGameLog('**Случайное событие:** Обнаружен небольшой тайник с припасами неподалеку!');
            window.gameState.community.addResource('food', 5);
            window.gameState.community.addResource('water', 5);
        }
        // Больше случайных событий будет добавлено позже
    }
}
