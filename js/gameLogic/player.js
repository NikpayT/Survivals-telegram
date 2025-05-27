// js/gameLogic/player.js

class Player {
    constructor() {
        this.health = 100;
        this.hunger = 0; // 0 = сыт, 100 = голоден (увеличивается со временем)
        this.thirst = 0; // 0 = нет жажды, 100 = сильная жажда (увеличивается со временем)
        this.fatigue = 0; // 0 = бодр, 100 = истощен (увеличивается со временем)
        this.currentWeapon = null; // Текущее экипированное оружие (объект предмета)
        this.inventory = {}; // Инвентарь игрока: {itemId: quantity}

        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('Игрок инициализирован.');
        } else {
            console.log('Игрок инициализирован (UI Manager недоступен).');
        }
    }

    // Метод для добавления предмета в инвентарь игрока
    addItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            console.warn(`Player: Предмет с ID "${itemId}" не существует.`);
            return false;
        }
        this.inventory[itemId] = (this.inventory[itemId] || 0) + quantity;
        window.addGameLog(`Вы получили ${quantity} ${itemData.name}.`);
        window.uiManager.updateAllStatus(); // Обновляем UI
        return true;
    }

    // Метод для удаления предмета из инвентаря игрока
    removeItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            console.warn(`Player: Предмет с ID "${itemId}" не существует.`);
            return false;
        }
        if (!this.inventory[itemId] || this.inventory[itemId] < quantity) {
            window.addGameLog(`У вас недостаточно ${itemData.name}.`);
            return false;
        }
        this.inventory[itemId] -= quantity;
        if (this.inventory[itemId] <= 0) { // Используем <= 0, чтобы гарантировать удаление
            delete this.inventory[itemId];
        }
        window.addGameLog(`Вы использовали ${quantity} ${itemData.name}.`);
        window.uiManager.updateAllStatus(); // Обновляем UI
        return true;
    }

    // Метод для проверки наличия предмета в инвентаре игрока
    hasItem(itemId, quantity = 1) {
        return (this.inventory[itemId] || 0) >= quantity;
    }

    // Метод для получения урона
    takeDamage(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            console.warn("takeDamage: Некорректное значение урона.");
            return;
        }
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        window.addGameLog(`Вы получили ${amount} урона. Здоровье: ${this.health}%`);
        window.uiManager.updateAllStatus();
    }

    // Метод для лечения
    heal(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            console.warn("heal: Некорректное значение лечения.");
            return;
        }
        this.health += amount;
        if (this.health > 100) this.health = 100;
        window.addGameLog(`Вы восстановили ${amount} здоровья. Здоровье: ${this.health}%`);
        window.uiManager.updateAllStatus();
    }

    // Ежедневные события для игрока
    passDay() {
        window.addGameLog('Прошел один день для игрока.');

        // Увеличение голода, жажды, усталости
        this.hunger += 15; // Увеличивается на 15% в день
        this.thirst += 20; // Увеличивается на 20% в день
        this.fatigue += 10; // Увеличивается на 10% в день

        // Нормализация значений (не более 100)
        this.hunger = Math.min(100, this.hunger);
        this.thirst = Math.min(100, this.thirst);
        this.fatigue = Math.min(100, this.fatigue);

        // Потребление ресурсов и последствия
        let ate = false;
        let drank = false;

        // Попытка съесть пайку из инвентаря
        if (this.hasItem('food_ration', 1)) {
            this.removeItem('food_ration', 1);
            this.hunger = Math.max(0, this.hunger - 40); // Значительно уменьшаем голод
            window.addGameLog('Вы съели пайку. Голод уменьшился.');
            ate = true;
        } else if (window.gameState.community && window.gameState.community.hasResource('food', 5)) { // Если нет пайки, но есть еда у общины
            window.gameState.community.removeResource('food', 5); // Потребляем больше сыпучей еды
            this.hunger = Math.max(0, this.hunger - 25);
            window.addGameLog('Вы поели из запасов общины. Голод уменьшился.');
            ate = true;
        }

        // Попытка выпить воду из инвентаря
        if (this.hasItem('water_bottle', 1)) {
            this.removeItem('water_bottle', 1);
            this.thirst = Math.max(0, this.thirst - 50); // Значительно уменьшаем жажду
            window.addGameLog('Вы выпили воды из бутылки. Жажда уменьшилась.');
            drank = true;
        } else if (window.gameState.community && window.gameState.community.hasResource('water', 5)) { // Если нет бутылки, но есть вода у общины
            window.gameState.community.removeResource('water', 5);
            this.thirst = Math.max(0, this.thirst - 30);
            window.addGameLog('Вы выпили из запасов общины. Жажда уменьшилась.');
            drank = true;
        }

        // Последствия голода и жажды
        if (!ate && this.hunger >= 80) { // Сильный голод
            const damage = Math.round(this.hunger / 15);
            this.takeDamage(damage);
            window.addGameLog(`Вы голодаете! Ваше здоровье падает на ${damage}.`);
        } else if (!ate && this.hunger > 50) { // Средний голод
             window.addGameLog('Вы чувствуете голод. Найдите еду!');
        }


        if (!drank && this.thirst >= 80) { // Сильная жажда
            const damage = Math.round(this.thirst / 10);
            this.takeDamage(damage);
            window.addGameLog(`Вы испытываете жажду! Ваше здоровье падает на ${damage}.`);
        } else if (!drank && this.thirst > 50) { // Средняя жажда
            window.addGameLog('Вы очень хотите пить. Найдите воду!');
        }

        // Сон (снижение усталости)
        this.fatigue = Math.max(0, this.fatigue - 50); // Уменьшение усталости после "сна"

        // Здоровье не может быть ниже 0
        this.health = Math.max(0, this.health); 

        window.uiManager.updateAllStatus(); // Обновляем UI после всех изменений
    }
}
