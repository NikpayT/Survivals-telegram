// js/entities/community.js

class Community {
    constructor() {
        this.name = "Наша Община";
        this.survivors = 5; // Изначально 5 выживших
        this.morale = 70; // Мораль общины
        this.maxMorale = 100;
        
        // НОВАЯ ХАРАКТЕРИСТИКА: Безопасность
        this.safety = 50; // Начальный уровень безопасности
        this.maxSafety = 100; // Максимальный уровень безопасности

        this.resources = {
            food: 10,   // Еда
            water: 10,  // Вода
            materials: 5, // Материалы для строительства и ремонта
            medicine: 2, // Медикаменты
            // Дополнительные ресурсы
        };
        this.storage = {}; // Отдельное хранилище для предметов
        this.facilities = {
            shelter_level: 1, // Уровень убежища, 0 = разрушено, 1 = базовое, и т.д.
            // Дополнительные постройки
        };
        window.addGameLog('Община инициализированa.');
    }

    // Добавление ресурсов или предметов на склад общины
    addResourceOrItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.addGameLog(`Неизвестный ресурс/предмет для общины: ${itemId}`);
            return false;
        }

        if (itemData.type === 'resource') {
            if (this.resources[itemId]) {
                this.resources[itemId] += quantity;
            } else {
                this.resources[itemId] = quantity;
            }
            window.addGameLog(`Община получила ${quantity} ${itemData.name}.`);
        } else {
            // Это обычный предмет, добавляем на склад
            if (this.storage[itemId]) {
                this.storage[itemId] += quantity;
            } else {
                this.storage[itemId] = quantity;
            }
            window.addGameLog(`Община получила ${quantity} ${itemData.name} на склад.`);
        }
        window.uiManager.updateCommunityStatus();
        window.uiManager.updateCommunityStorage();
        return true;
    }

    // Удаление ресурсов или предметов со склада общины
    removeResourceOrItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.addGameLog(`Неизвестный ресурс/предмет для общины: ${itemId}`);
            return false;
        }

        if (itemData.type === 'resource') {
            if (this.resources[itemId] && this.resources[itemId] >= quantity) {
                this.resources[itemId] -= quantity;
                window.addGameLog(`Община использовала ${quantity} ${itemData.name}.`);
                window.uiManager.updateCommunityStatus();
                return true;
            } else {
                window.addGameLog(`У общины нет ${quantity} ${itemData.name}.`);
                return false;
            }
        } else {
            // Это обычный предмет со склада
            if (this.storage[itemId] && this.storage[itemId] >= quantity) {
                this.storage[itemId] -= quantity;
                if (this.storage[itemId] <= 0) {
                    delete this.storage[itemId];
                }
                window.addGameLog(`Община использовала ${quantity} ${itemData.name} со склада.`);
                window.uiManager.updateCommunityStatus();
                window.uiManager.updateCommunityStorage();
                return true;
            } else {
                window.addGameLog(`На складе общины нет ${quantity} ${itemData.name}.`);
                return false;
            }
        }
    }

    // Проверка наличия ресурса
    hasResource(resourceId, quantity = 1) {
        return (this.resources[resourceId] || 0) >= quantity;
    }

    // Проверка наличия предмета на складе
    hasItem(itemId, quantity = 1) {
        return (this.storage[itemId] || 0) >= quantity;
    }

    // Добавление/удаление выживших
    addSurvivors(count) {
        this.survivors += count;
        window.addGameLog(`К общине присоединилось ${count} выживших. Всего: ${this.survivors}`);
        window.uiManager.updateCommunityStatus();
    }

    removeSurvivors(count) {
        this.survivors -= count;
        if (this.survivors < 0) {
            this.survivors = 0;
        }
        window.addGameLog(`Община потеряла ${count} выживших. Осталось: ${this.survivors}`);
        window.uiManager.updateCommunityStatus();
    }

    // Изменение морали
    changeMorale(amount) {
        this.morale += amount;
        if (this.morale > this.maxMorale) {
            this.morale = this.maxMorale;
        } else if (this.morale < 0) {
            this.morale = 0;
        }
        window.addGameLog(`Мораль общины изменилась на ${amount}. Текущая мораль: ${this.morale}/${this.maxMorale}`);
        window.uiManager.updateCommunityStatus();
    }

    // НОВОЕ: Изменение безопасности
    changeSafety(amount) {
        this.safety += amount;
        if (this.safety > this.maxSafety) {
            this.safety = this.maxSafety;
        } else if (this.safety < 0) {
            this.safety = 0;
        }
        window.addGameLog(`Безопасность общины изменилась на ${amount}. Текущая безопасность: ${this.safety}/${this.maxSafety}`);
        window.uiManager.updateCommunityStatus();
    }

    // Действия, происходящие в конце дня для общины
    passDay() {
        // Ежедневное потребление еды и воды
        // Теперь выжившие (помимо игрока) потребляют еду
        const dailyFoodConsumption = this.survivors; 
        const dailyWaterConsumption = this.survivors;

        if (this.resources.food >= dailyFoodConsumption) {
            this.resources.food -= dailyFoodConsumption;
            window.addGameLog(`Община потребила ${dailyFoodConsumption} еды.`);
        } else {
            const foodDeficit = dailyFoodConsumption - this.resources.food;
            this.resources.food = 0;
            this.changeMorale(-5);
            const deaths = Math.floor(foodDeficit / 2); 
            if (deaths > 0) {
                this.removeSurvivors(deaths);
                window.addGameLog(`Из-за голода ${deaths} выживших погибли!`);
            } else {
                window.addGameLog('Общине не хватило еды, но никто не погиб.');
            }
        }

        if (this.resources.water >= dailyWaterConsumption) {
            this.resources.water -= dailyWaterConsumption;
            window.addGameLog(`Община потребила ${dailyWaterConsumption} воды.`);
        } else {
            const waterDeficit = dailyWaterConsumption - this.resources.water;
            this.resources.water = 0;
            this.changeMorale(-7);
            const deaths = Math.floor(waterDeficit / 1);
            if (deaths > 0) {
                this.removeSurvivors(deaths);
                window.addGameLog(`Из-за жажды ${deaths} выживших погибли!`);
            } else {
                window.addGameLog('Общине не хватило воды, но никто не погиб.');
            }
        }

        // Влияние морали на выживших (уход)
        if (this.morale < 30 && this.survivors > 0) { // Проверка, что выжившие > 0
            const fleeChance = (30 - this.morale) / 10;
            if (Math.random() < fleeChance) {
                if (this.survivors > 0) { // Убедимся, что есть кому уходить
                    this.removeSurvivors(1);
                    this.changeMorale(-5);
                    window.addGameLog('Из-за низкой морали один выживший покинул общину.');
                }
            }
        }
        
        // Влияние безопасности (может быть негативным или позитивным событием)
        if (this.safety < 30) {
            if (Math.random() < 0.1) { // 10% шанс негативного события при низкой безопасности
                window.addGameLog('Из-за низкой безопасности община подверглась нападению!');
                this.removeSurvivors(1); // Пример: потеря 1 выжившего
                this.changeMorale(-10); // Падение морали
                this.changeSafety(-5); // Падение безопасности
            }
        } else if (this.safety > 70) {
            if (Math.random() < 0.05) { // 5% шанс позитивного события при высокой безопасности
                window.addGameLog('Благодаря высокой безопасности, ночь прошла спокойно и безопасно.');
                this.changeMorale(2); // Небольшое повышение морали
            }
        }


        // Обновление состояния UI
        window.uiManager.updateCommunityStatus();
        window.uiManager.updateCommunityStorage();
    }
}
