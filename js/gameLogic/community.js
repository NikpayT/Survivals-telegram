// js/gameLogic/community.js

class Community {
    constructor() {
        this.survivors = 1;
        this.morale = 100;
        this.security = 50;
        this.resources = {
            food: 0,
            water: 0,
            materials: 0,
            medicine: 0
        };
        this.storage = {}; // Отдельное хранилище для предметов (не ресурсов)
        this.facilities = {
            shelter_level: 0, // Уровень убежища
            water_source_level: 0,
            farm_level: 0,
            workshop_level: 0,
            watchtower_level: 0
        };
        // Уведомление UI Manager'у об инициализации, если он доступен
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('Community инициализирована.');
        } else {
            console.log('Community инициализирована (UI Manager недоступен).');
        }
    }

    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] += amount;
            window.uiManager.addGameLog(`Община получила ${amount} ед. ${type}.`);
        } else {
            window.uiManager.addGameLog(`Ошибка: Неизвестный тип ресурса: ${type}.`);
        }
    }

    removeResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            if (this.resources[type] >= amount) {
                this.resources[type] -= amount;
                window.uiManager.addGameLog(`Община использовала ${amount} ед. ${type}.`);
                return true;
            } else {
                window.uiManager.addGameLog(`Недостаточно ${type} у общины.`);
                return false;
            }
        } else {
            window.uiManager.addGameLog(`Ошибка: Неизвестный тип ресурса: ${type}.`);
            return false;
        }
    }

    hasResource(type, amount) {
        return this.resources.hasOwnProperty(type) && this.resources[type] >= amount;
    }

    // Метод для добавления или ресурса, или предмета на склад общины
    addResourceOrItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            console.warn(`Предмет с ID "${itemId}" не найден.`);
            return;
        }

        if (itemData.isResource) { // Предполагаем, что GameItems может иметь флаг isResource
            this.addResource(itemId, quantity); // Если это ресурс, используем addResource
        } else {
            // Если это обычный предмет, добавляем на склад (storage)
            this.storage[itemId] = (this.storage[itemId] || 0) + quantity;
            window.uiManager.addGameLog(`Община получила ${quantity} ${itemData.name}.`);
        }
    }

    // Метод для удаления или ресурса, или предмета со склада общины
    removeResourceOrItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            console.warn(`Предмет с ID "${itemId}" не найден.`);
            return false;
        }

        if (itemData.isResource) {
            return this.removeResource(itemId, quantity);
        } else {
            if (this.storage[itemId] && this.storage[itemId] >= quantity) {
                this.storage[itemId] -= quantity;
                if (this.storage[itemId] === 0) {
                    delete this.storage[itemId];
                }
                window.uiManager.addGameLog(`Община использовала ${quantity} ${itemData.name}.`);
                return true;
            } else {
                window.uiManager.addGameLog(`Недостаточно ${itemData.name} на складе общины.`);
                return false;
            }
        }
    }

    // Ежедневные события для общины
    passDay() {
        // Уменьшение ресурсов (еда, вода) в зависимости от количества выживших
        const foodNeeded = this.survivors * 2; // Пример: 2 ед. еды на выжившего в день
        const waterNeeded = this.survivors * 3; // Пример: 3 ед. воды на выжившего в день

        if (this.resources.food < foodNeeded) {
            const missingFood = foodNeeded - this.resources.food;
            this.resources.food = 0;
            this.morale -= missingFood * 2; // Уменьшение морали за голод
            window.uiManager.addGameLog(`Община голодает! Мораль падает на ${missingFood * 2}.`);
        } else {
            this.resources.food -= foodNeeded;
        }

        if (this.resources.water < waterNeeded) {
            const missingWater = waterNeeded - this.resources.water;
            this.resources.water = 0;
            this.morale -= missingWater * 3; // Уменьшение морали за жажду
            window.uiManager.addGameLog(`Община испытывает жажду! Мораль падает на ${missingWater * 3}.`);
        } else {
            this.resources.water -= waterNeeded;
        }

        // Мораль не может быть ниже 0 или выше 100
        this.morale = Math.max(0, Math.min(100, this.morale));

        // Выжившие могут умереть от низкой морали
        if (this.morale < 20 && this.survivors > 1) { // Если мораль очень низкая
            if (Math.random() < 0.1) { // 10% шанс потери выжившего
                this.survivors--;
                window.uiManager.addGameLog('Один из выживших покинул общину из-за низкой морали.');
            }
        }

        // Обновление UI
        window.uiManager.updateAllStatus();
        window.uiManager.addGameLog('Община пережила еще один день.');
    }

    // Метод для отображения деталей общины (для вкладки "Община")
    displayCommunityDetails() {
        const communityDetailsElement = document.getElementById('community-details');
        if (!communityDetailsElement) {
            console.warn("Community: Элемент #community-details не найден.");
            return;
        }

        communityDetailsElement.innerHTML = `
            <h3>Состояние общины</h3>
            <p>Выживших: ${this.survivors}</p>
            <p>Мораль: ${this.morale}%</p>
            <p>Безопасность: ${this.security}%</p>
            
            <h3>Ресурсы</h3>
            <ul>
                <li>Еда: ${this.resources.food}</li>
                <li>Вода: ${this.resources.water}</li>
                <li>Материалы: ${this.resources.materials}</li>
                <li>Медикаменты: ${this.resources.medicine}</li>
            </ul>

            <h3>Постройки</h3>
            <ul>
                <li>Убежище: Уровень ${this.facilities.shelter_level}</li>
                <li>Источник воды: Уровень ${this.facilities.water_source_level}</li>
                <li>Ферма: Уровень ${this.facilities.farm_level}</li>
                <li>Мастерская: Уровень ${this.facilities.workshop_level}</li>
                <li>Сторожевая вышка: Уровень ${this.facilities.watchtower_level}</li>
            </ul>
            
            <h3>Действия общины</h3>
            <button onclick="window.community.upgradeFacility('shelter')">Улучшить Убежище</button>
            <button onclick="window.community.exploreForSurvivors()">Искать выживших</button>
            `;
    }

    // Пример метода для улучшения постройки
    upgradeFacility(facilityType) {
        // Здесь будет логика улучшения: проверка ресурсов, увеличение уровня, изменение характеристик общины
        window.uiManager.addGameLog(`Попытка улучшить ${facilityType}. (Функция еще не реализована полностью)`);
        // После улучшения, нужно обновить UI
        this.displayCommunityDetails();
        window.uiManager.updateAllStatus();
    }

    // Пример метода для поиска выживших
    exploreForSurvivors() {
        window.uiManager.addGameLog(`Община ищет выживших. (Функция еще не реализована)`);
        // ... логика поиска ...
        // После завершения, обновить UI
        this.displayCommunityDetails();
        window.uiManager.updateAllStatus();
    }
}
