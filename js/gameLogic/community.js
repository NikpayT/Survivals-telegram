// js/gameLogic/community.js

class Community {
    constructor() {
        this.survivors = 1; // Игрок считается как 1 выживший
        this.morale = 100;
        this.security = 50;
        this.resources = {
            food: 0,
            water: 0,
            materials: 0,
            medicine: 0
        };
        this.storage = {}; // Отдельное хранилище для предметов (не ресурсов), например, оружия, инструментов
        this.facilities = {
            shelter_level: 0, // Уровень убежища
            water_source_level: 0,
            farm_level: 0,
            workshop_level: 0,
            watchtower_level: 0
        };
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('Община инициализирована.');
        } else {
            console.log('Община инициализирована (UI Manager недоступен).');
        }
    }

    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type) && typeof amount === 'number' && amount > 0) {
            this.resources[type] += amount;
            window.addGameLog(`Община получила ${amount} ед. ${type}.`);
            window.uiManager.updateAllStatus();
            return true;
        } else {
            console.warn(`Community: Попытка добавить некорректный ресурс ${type} или количество ${amount}.`);
            return false;
        }
    }

    removeResource(type, amount) {
        if (this.resources.hasOwnProperty(type) && typeof amount === 'number' && amount > 0) {
            if (this.resources[type] >= amount) {
                this.resources[type] -= amount;
                window.addGameLog(`Община использовала ${amount} ед. ${type}.`);
                window.uiManager.updateAllStatus();
                return true;
            } else {
                window.addGameLog(`Недостаточно ${type} у общины. Требуется: ${amount}, в наличии: ${this.resources[type]}.`);
                return false;
            }
        } else {
            console.warn(`Community: Попытка удалить некорректный ресурс ${type} или количество ${amount}.`);
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
            console.warn(`Community: Предмет с ID "${itemId}" не найден.`);
            return false;
        }

        // Предположим, что ресурсы имеют тип в GameItems. Или можно проверить по ключам this.resources
        if (this.resources.hasOwnProperty(itemId)) { // Если это ресурс, который отслеживается в `resources`
            return this.addResource(itemId, quantity);
        } else {
            // Если это обычный предмет, добавляем на склад (storage)
            this.storage[itemId] = (this.storage[itemId] || 0) + quantity;
            window.addGameLog(`Община получила ${quantity} ${itemData.name} на склад.`);
            window.uiManager.updateAllStatus(); // Обновляем UI
            return true;
        }
    }

    // Метод для удаления или ресурса, или предмета со склада общины
    removeResourceOrItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            console.warn(`Community: Предмет с ID "${itemId}" не найден.`);
            return false;
        }

        if (this.resources.hasOwnProperty(itemId)) { // Если это ресурс
            return this.removeResource(itemId, quantity);
        } else {
            // Если это обычный предмет со склада (storage)
            if (this.storage[itemId] && this.storage[itemId] >= quantity) {
                this.storage[itemId] -= quantity;
                if (this.storage[itemId] <= 0) {
                    delete this.storage[itemId];
                }
                window.addGameLog(`Община использовала ${quantity} ${itemData.name} со склада.`);
                window.uiManager.updateAllStatus(); // Обновляем UI
                return true;
            } else {
                window.addGameLog(`Недостаточно ${itemData.name} на складе общины.`);
                return false;
            }
        }
    }

    // Ежедневные события для общины
    passDay() {
        window.addGameLog('Прошел один день для общины.');

        // Потребление еды и воды всеми выжившими
        const totalSurvivors = this.survivors + (window.gameState.player ? 1 : 0); // Учитываем игрока
        const foodNeeded = totalSurvivors * 2; // Пример: 2 ед. еды на выжившего в день
        const waterNeeded = totalSurvivors * 3; // Пример: 3 ед. воды на выжившего в день

        let foodConsumed = 0;
        let waterConsumed = 0;

        // Потребление еды
        if (this.resources.food >= foodNeeded) {
            this.resources.food -= foodNeeded;
            foodConsumed = foodNeeded;
            window.addGameLog(`Община потребила ${foodConsumed} ед. еды.`);
        } else {
            foodConsumed = this.resources.food;
            const missingFood = foodNeeded - foodConsumed;
            this.resources.food = 0;
            this.morale -= missingFood * 2; // Уменьшение морали за голод
            window.addGameLog(`Община голодает! Не хватает ${missingFood} ед. еды. Мораль падает на ${missingFood * 2}.`);
        }

        // Потребление воды
        if (this.resources.water >= waterNeeded) {
            this.resources.water -= waterNeeded;
            waterConsumed = waterNeeded;
            window.addGameLog(`Община потребила ${waterConsumed} ед. воды.`);
        } else {
            waterConsumed = this.resources.water;
            const missingWater = waterNeeded - waterConsumed;
            this.resources.water = 0;
            this.morale -= missingWater * 3; // Уменьшение морали за жажду
            window.addGameLog(`Община испытывает жажду! Не хватает ${missingWater} ед. воды. Мораль падает на ${missingWater * 3}.`);
        }

        // Мораль не может быть ниже 0 или выше 100
        this.morale = Math.max(0, Math.min(100, this.morale));

        // Выжившие могут умереть от низкой морали и отсутствия безопасности
        if (this.morale < 30 && this.survivors > 0) { // Если мораль очень низкая
            if (Math.random() < 0.05 + (50 - this.security) / 100) { // Шанс потери выжившего зависит от морали и безопасности
                this.survivors--;
                window.addGameLog('Один из выживших покинул общину или погиб из-за низкой морали/безопасности.');
                if (this.survivors <= 0) {
                    window.addGameLog('В общине не осталось выживших (кроме вас).');
                }
            }
        }
        
        // Автоматическое производство ресурсов (если есть постройки)
        if (this.facilities.farm_level > 0) {
            const foodGained = this.facilities.farm_level * 10; // Пример: +10 еды за уровень фермы
            this.addResource('food', foodGained);
            window.addGameLog(`Ферма произвела ${foodGained} ед. еды.`);
        }
        if (this.facilities.water_source_level > 0) {
            const waterGained = this.facilities.water_source_level * 15; // Пример: +15 воды за уровень источника
            this.addResource('water', waterGained);
            window.addGameLog(`Источник воды произвел ${waterGained} ед. воды.`);
        }

        window.uiManager.updateAllStatus(); // Обновляем UI
    }

    // Метод для отображения деталей общины (для вкладки "Община")
    displayCommunityDetails() {
        const communityDetailsElement = document.getElementById('community-details');
        if (!communityDetailsElement) {
            console.warn("Community: Элемент #community-details не найден.");
            return;
        }

        let storageHtml = '';
        if (Object.keys(this.storage).length > 0) {
            storageHtml += '<h4>Предметы на складе:</h4><ul>';
            for (const itemId in this.storage) {
                const quantity = this.storage[itemId];
                const itemData = GameItems[itemId];
                if (itemData) {
                    storageHtml += `<li>${itemData.name} x${quantity}</li>`;
                }
            }
            storageHtml += '</ul>';
        } else {
            storageHtml = '<p>Склад общины пуст.</p>';
        }

        communityDetailsElement.innerHTML = `
            <h3>Состояние общины</h3>
            <p>Выживших: <span id="community-survivors-detail">${this.survivors}</span></p>
            <p>Мораль: <span id="community-morale-detail">${this.morale}</span>%</p>
            <p>Безопасность: <span id="community-security-detail">${this.security}</span>%</p>
            
            <h3>Ресурсы</h3>
            <ul>
                <li>Еда: <span id="community-food-detail">${this.resources.food}</span></li>
                <li>Вода: <span id="community-water-detail">${this.resources.water}</span></li>
                <li>Материалы: <span id="community-materials-detail">${this.resources.materials}</span></li>
                <li>Медикаменты: <span id="community-medicine-detail">${this.resources.medicine}</span></li>
            </ul>

            ${storageHtml}

            <h3>Постройки</h3>
            <ul>
                <li>Убежище: Уровень ${this.facilities.shelter_level} 
                    <button onclick="window.gameState.community.upgradeFacility('shelter')">Улучшить</button>
                </li>
                <li>Источник воды: Уровень ${this.facilities.water_source_level}
                    <button onclick="window.gameState.community.upgradeFacility('water_source')">Улучшить</button>
                </li>
                <li>Ферма: Уровень ${this.facilities.farm_level}
                    <button onclick="window.gameState.community.upgradeFacility('farm')">Улучшить</button>
                </li>
                <li>Мастерская: Уровень ${this.facilities.workshop_level}
                    <button onclick="window.gameState.community.upgradeFacility('workshop')">Улучшить</button>
                </li>
                <li>Сторожевая вышка: Уровень ${this.facilities.watchtower_level}
                    <button onclick="window.gameState.community.upgradeFacility('watchtower')">Улучшить</button>
                </li>
            </ul>
            
            <h3>Действия общины</h3>
            <button onclick="window.gameState.community.exploreForSurvivors()">Искать выживших</button>
            <button onclick="window.gameState.community.scavengeForResources()">Собирать ресурсы</button>
            `;
        // Обновляем статусы, чтобы убедиться, что они синхронизированы с основным статус-баром
        window.uiManager.updateAllStatus(); 
    }

    // Пример метода для улучшения постройки
    upgradeFacility(facilityType) {
        // Заглушка для логики улучшения
        // В реальной игре здесь будет проверка ресурсов, увеличение уровня, изменение характеристик общины
        const upgradeCosts = {
            shelter: { materials: 50, food: 20 },
            water_source: { materials: 30, water: 10 },
            farm: { materials: 40, food: 15 },
            workshop: { materials: 60 },
            watchtower: { materials: 70 }
        };

        const currentLevel = this.facilities[`${facilityType}_level`];
        if (currentLevel >= 3) { // Пример: максимум 3 уровня
            window.addGameLog(`"${facilityType}" уже на максимальном уровне.`);
            return false;
        }

        const costs = upgradeCosts[facilityType];
        if (!costs) {
            window.addGameLog(`Неизвестный тип постройки: ${facilityType}.`);
            return false;
        }

        let canAfford = true;
        for (const resourceType in costs) {
            if (!this.hasResource(resourceType, costs[resourceType])) {
                window.addGameLog(`Не хватает ${costs[resourceType]} ${resourceType} для улучшения ${facilityType}.`);
                canAfford = false;
                break;
            }
        }

        if (canAfford) {
            for (const resourceType in costs) {
                this.removeResource(resourceType, costs[resourceType]);
            }
            this.facilities[`${facilityType}_level`]++;
            window.addGameLog(`Община улучшила ${facilityType} до уровня ${this.facilities[`${facilityType}_level`]}.`);
            // Повышение безопасности, морали или производства в зависимости от постройки
            if (facilityType === 'shelter') this.morale += 5;
            if (facilityType === 'watchtower') this.security += 10;

        } else {
            window.addGameLog(`Недостаточно ресурсов для улучшения ${facilityType}.`);
        }

        this.displayCommunityDetails(); // Обновляем UI после попытки улучшения
        window.uiManager.updateAllStatus(); // Обновляем главный статус-бар
        return canAfford;
    }

    // Пример метода для поиска выживших
    exploreForSurvivors() {
        window.addGameLog(`Община отправляет разведчиков искать выживших...`);
        // Простая заглушка: 30% шанс найти нового выжившего
        setTimeout(() => {
            if (Math.random() < 0.3) {
                this.survivors++;
                window.addGameLog('Разведчики нашли нового выжившего! Теперь нас ' + this.survivors + '.');
                this.morale += 5; // Улучшение морали от нового члена
            } else {
                window.addGameLog('Разведчики вернулись ни с чем.');
                this.morale -= 2; // Небольшое снижение морали
            }
            this.displayCommunityDetails(); // Обновляем UI
            window.uiManager.updateAllStatus();
        }, 1000); // Имитация времени
    }

    // Пример метода для сбора ресурсов
    scavengeForResources() {
        window.addGameLog(`Община отправляется на поиски ресурсов...`);
        setTimeout(() => {
            const foundMaterials = Math.floor(Math.random() * 20) + 5; // От 5 до 24 материалов
            const foundFood = Math.floor(Math.random() * 15) + 3; // От 3 до 17 еды
            this.addResource('materials', foundMaterials);
            this.addResource('food', foundFood);
            window.addGameLog(`Община нашла ${foundMaterials} материалов и ${foundFood} еды.`);
            this.displayCommunityDetails();
            window.uiManager.updateAllStatus();
        }, 1000);
    }
}
