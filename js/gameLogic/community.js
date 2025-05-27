// /js/gameLogic/community.js
// Объект, управляющий состоянием и развитием общины/убежища игрока

class Community {
    constructor() {
        this.survivors = 1; // Начальное количество выживших (сам игрок)
        this.morale = 100; // Мораль общины (0-100)
        this.security = 50; // Безопасность убежища (0-100)
        this.resources = { // Ресурсы на складе общины
            food: 0,
            water: 0,
            materials_metal: 0,
            materials_wood: 0,
            medical_supplies: 0,
            ammunition: 0,
            fuel: 0
        };
        this.facilities = { // Постройки и улучшения в убежище
            shelter_level: 1,
            water_source_level: 0, // Например, очистка воды
            farm_level: 0,        // Производство еды
            workbench_built: false, // Наличие верстака для крафта
            medical_station_built: false
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
        console.log(`К общине присоединилось ${count} выживших. Всего: ${this.survivors}`);
        window.uiManager.updateCommunityStatus();
    }

    /**
     * Удаляет выживших из общины.
     * @param {number} count - Количество удаляемых выживших.
     */
    removeSurvivors(count) {
        this.survivors -= count;
        if (this.survivors < 1) { // Если выживших меньше 1, игра может закончиться
            this.survivors = 1; // Игрок всегда считается выжившим
            // Можно добавить логику Game Over
        }
        console.log(`Общину покинуло ${count} выживших. Всего: ${this.survivors}`);
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
        console.log(`Мораль общины: ${this.morale}`);
        window.uiManager.updateCommunityStatus();
        // Можно добавить эффекты от низкой/высокой морали
    }

    /**
     * Изменяет безопасность убежища.
     * @param {number} amount - Количество, на которое изменяется безопасность.
     */
    adjustSecurity(amount) {
        this.security += amount;
        if (this.security > 100) this.security = 100;
        if (this.security < 0) this.security = 0;
        console.log(`Безопасность убежища: ${this.security}`);
        window.uiManager.updateCommunityStatus();
    }

    /**
     * Добавляет ресурс на склад общины.
     * @param {string} resourceType - Тип ресурса (например, 'food', 'water').
     * @param {number} quantity - Количество.
     */
    addResource(resourceType, quantity) {
        if (this.resources[resourceType] !== undefined) {
            this.resources[resourceType] += quantity;
            console.log(`На склад добавлено: ${resourceType} x${quantity}`);
            window.uiManager.updateCommunityStatus(); // Обновляем UI
        } else {
            console.warn(`Неизвестный тип ресурса: ${resourceType}`);
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
            console.log(`Со склада удалено: ${resourceType} x${quantity}`);
            window.uiManager.updateCommunityStatus();
            return true;
        }
        console.warn(`Недостаточно ${resourceType} на складе.`);
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
                console.log(`Построен объект: ${facilityType}`);
            } else {
                this.facilities[facilityType] += levelIncrease;
                console.log(`Объект ${facilityType} улучшен до уровня ${this.facilities[facilityType]}`);
            }
            window.uiManager.updateCommunityStatus(); // Обновляем UI
            // Добавляем эффекты от постройки (например, увеличение лимита ресурсов, новые возможности крафта)
        } else {
            console.warn(`Неизвестный тип объекта: ${facilityType}`);
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
            this.removeSurvivors(Math.ceil((requiredFood - foodConsumed) / 5)); // Выжившие могут уйти или умереть
            console.warn('Недостаточно еды! Мораль падает, выжившие страдают.');
        }

        let waterConsumed = 0;
        if (this.resources.water >= requiredWater) {
            this.removeResource('water', requiredWater);
            waterConsumed = requiredWater;
        } else {
            waterConsumed = this.resources.water;
            this.removeResource('water', this.resources.water); // Используем все что есть
            this.adjustMorale(-15); // Снижаем мораль еще сильнее из-за нехватки воды
            this.removeSurvivors(Math.ceil((requiredWater - waterConsumed) / 3)); // Выжившие могут уйти или умереть
            console.warn('Недостаточно воды! Мораль падает, выжившие страдают.');
        }
        console.log(`Ежедневное потребление: ${foodConsumed} еды, ${waterConsumed} воды.`);
        // Здесь можно добавить другие эффекты от голода/жажды на выживших
        window.uiManager.updateCommunityStatus();
    }
}
