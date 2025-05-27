// /js/gameLogic/community.js
// Объект, управляющий состоянием и развитием общины/убежища игрока

class Community {
    constructor() {
        this.survivors = 1; // Начальное количество выживших (сам игрок)
        this.morale = 100; // Мораль общины (0-100)
        this.security = 50; // Безопасность убежища (0-100)
        this.resources = { // Ресурсы на складе общины
            food: 0, // Количество еды (единиц)
            water: 0, // Количество воды (единиц)
            materials_metal: 0, // Металл
            materials_wood: 0, // Дерево
            medical_supplies: 0, // Медикаменты
            ammunition: 0, // Боеприпасы
            fuel: 0 // Топливо
        };
        this.facilities = { // Постройки и улучшения в убежище
            shelter_level: 1, // Уровень убежища
            water_source_level: 0, // Например, очистка воды
            farm_level: 0,        // Производство еды
            workbench_built: false, // Наличие верстака для крафта
            medical_station_built: false, // Наличие медпункта
            // Добавим другие станции по мере необходимости
            chemistry_station_built: false // Для примера крафта таблеток очистки
        };
        this.needsPerSurvivor = { // Потребности каждого выжившего в день
            food: 1,
            water: 1
        };
        this.events = []; // Очередь событий, влияющих на общину
    }

    /**
     * Добавляет выживших в общину.
     * @param {number} count - Количество добавляемых выживших.
     */
    addSurvivors(count) {
        this.survivors += count;
        window.addGameLog(`К общине присоединилось ${count} выживших. Всего: ${this.survivors}`);
        window.uiManager.updateCommunityStatus();
    }

    /**
     * Удаляет выживших из общины.
     * @param {number} count - Количество удаляемых выживших.
     */
    removeSurvivors(count) {
        this.survivors -= count;
        if (this.survivors < 1) {
            this.survivors = 0; // Теперь может быть 0, если игрок не в общине
            // Если игрок был единственным выжившим, это Game Over.
            // Проверка на Game Over будет в main.js
        }
        window.addGameLog(`Общину покинуло ${count} выживших. Всего: ${this.survivors}`);
        window.uiManager.updateCommunityStatus();
    }

    /**
     * Изменяет мораль общины.
     * @param {number} amount - Количество, на которое изменяется мораль.
     */
    adjustMorale(amount) {
        this.morale += amount;
        if (this.morale > 100) this.morale = 100;
        if (this.morale < 0) this.morale = 0;
        window.uiManager.updateCommunityStatus();
        if (amount < 0) {
             window.addGameLog(`Мораль общины понизилась на ${Math.abs(amount)}. Текущая: ${this.morale}`);
        } else if (amount > 0) {
             window.addGameLog(`Мораль общины повысилась на ${amount}. Текущая: ${this.morale}`);
        }
    }

    /**
     * Изменяет безопасность убежища.
     * @param {number} amount - Количество, на которое изменяется безопасность.
     */
    adjustSecurity(amount) {
        this.security += amount;
        if (this.security > 100) this.security = 100;
        if (this.security < 0) this.security = 0;
        window.uiManager.updateCommunityStatus();
        if (amount < 0) {
            window.addGameLog(`Безопасность убежища понизилась на ${Math.abs(amount)}. Текущая: ${this.security}`);
        } else if (amount > 0) {
            window.addGameLog(`Безопасность убежища повысилась на ${amount}. Текущая: ${this.security}`);
        }
    }

    /**
     * Добавляет ресурс на склад общины.
     * @param {string} resourceType - Тип ресурса (например, 'food', 'water').
     * @param {number} quantity - Количество.
     */
    addResource(resourceType, quantity) {
        if (this.resources[resourceType] !== undefined) {
            this.resources[resourceType] += quantity;
            window.addGameLog(`На склад добавлено: ${resourceType} x${quantity}`);
            window.uiManager.updateCommunityStatus(); // Обновляем UI
        } else {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Неизвестный тип ресурса для добавления на склад: ${resourceType}`);
        }
    }

    /**
     * Удаляет ресурс со склада общины.
     * @param {string} resourceType - Тип ресурса.
     * @param {number} quantity - Количество для удаления.
     * @returns {boolean} - true, если удаление успешно, false иначе.
     */
    removeResource(resourceType, quantity) {
        if (this.resources[resourceType] !== undefined && this.resources[resourceType] >= quantity) {
            this.resources[resourceType] -= quantity;
            window.addGameLog(`Со склада удалено: ${resourceType} x${quantity}`);
            window.uiManager.updateCommunityStatus();
            return true;
        }
        window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Недостаточно ${resourceType} на складе.`);
        return false;
    }

    /**
     * Проверяет наличие ресурса на складе.
     * @param {string} resourceType - Тип ресурса.
     * @param {number} quantity - Требуемое количество.
     * @returns {boolean}
     */
    hasResource(resourceType, quantity) {
        return this.resources[resourceType] !== undefined && this.resources[resourceType] >= quantity;
    }

    /**
     * Строит или улучшает объект в убежище.
     * @param {string} facilityType - Тип объекта (например, 'workbench_built', 'shelter_level').
     * @param {number} levelIncrease - На сколько уровней увеличить (для многоуровневых).
     */
    buildFacility(facilityType, levelIncrease = 1) {
        if (this.facilities[facilityType] !== undefined) {
            if (typeof this.facilities[facilityType] === 'boolean') {
                this.facilities[facilityType] = true;
                window.addGameLog(`Построен объект: ${facilityType}`);
            } else {
                this.facilities[facilityType] += levelIncrease;
                window.addGameLog(`Объект ${facilityType} улучшен до уровня ${this.facilities[facilityType]}`);
            }
            window.uiManager.updateCommunityStatus(); // Обновляем UI
        } else {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Неизвестный тип объекта для постройки: ${facilityType}`);
        }
    }

    /**
     * Ежедневное потребление ресурсов общиной.
     * Вызывается каждый "день" игрового цикла.
     */
    dailyConsumption() {
        const requiredFood = this.survivors * this.needsPerSurvivor.food;
        const requiredWater = this.survivors * this.needsPerSurvivor.water;

        let foodConsumed = 0;
        if (this.resources.food >= requiredFood) {
            this.removeResource('food', requiredFood);
            foodConsumed = requiredFood;
        } else {
            foodConsumed = this.resources.food;
            this.removeResource('food', this.resources.food); // Используем все что есть
            this.adjustMorale(-10); // Снижаем мораль из-за нехватки еды
            const potentialCasualties = Math.ceil((requiredFood - foodConsumed) / 5); // 1 смерть на 5 единиц нехватки еды
            if (potentialCasualties > 0 && this.survivors > 1) { // Игрок всегда считается выжившим
                const actualCasualties = Math.min(potentialCasualties, this.survivors -1); // Не убиваем игрока
                this.removeSurvivors(actualCasualties);
                window.addGameLog(`Недостаточно еды! ${actualCasualties} выживших покинули общину или погибли.`);
            } else {
                 window.addGameLog('Недостаточно еды! Мораль падает.');
            }
        }

        let waterConsumed = 0;
        if (this.resources.water >= requiredWater) {
            this.removeResource('water', requiredWater);
            waterConsumed = requiredWater;
        } else {
            waterConsumed = this.resources.water;
            this.removeResource('water', this.resources.water); // Используем все что есть
            this.adjustMorale(-15); // Снижаем мораль еще сильнее из-за нехватки воды
            const potentialCasualties = Math.ceil((requiredWater - waterConsumed) / 3); // 1 смерть на 3 единицы нехватки воды
             if (potentialCasualties > 0 && this.survivors > 1) {
                const actualCasualties = Math.min(potentialCasualties, this.survivors - 1);
                this.removeSurvivors(actualCasualties);
                window.addGameLog(`Недостаточно воды! ${actualCasualties} выживших покинули общину или погибли.`);
            } else {
                window.addGameLog('Недостаточно воды! Мораль падает.');
            }
        }
        window.addGameLog(`Ежедневное потребление: ${foodConsumed} еды, ${waterConsumed} воды.`);
        window.uiManager.updateCommunityStatus();
    }
}
