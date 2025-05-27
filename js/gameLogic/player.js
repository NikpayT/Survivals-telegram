// js/gameLogic/player.js

class Player {
    constructor() {
        this.health = 100;
        this.hunger = 0; // 0 = сыт, 100 = голоден
        this.thirst = 0; // 0 = нет жажды, 100 = сильная жажда
        this.fatigue = 0; // 0 = бодр, 100 = истощен
        this.currentWeapon = null; // Текущее экипированное оружие
        this.inventory = {}; // Инвентарь игрока: {itemId: quantity}

        // Уведомление UI Manager'у об инициализации, если он доступен
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('Игрок инициализирован.');
        } else {
            console.log('Игрок инициализирован (UI Manager недоступен).');
        }
    }

    // Метод для добавления предмета в инвентарь игрока
    addItem(itemId, quantity = 1) {
        if (!GameItems[itemId]) {
            console.warn(`Player: Предмет с ID "${itemId}" не существует.`);
            return false;
        }
        this.inventory[itemId] = (this.inventory[itemId] || 0) + quantity;
        window.uiManager.addGameLog(`Вы получили ${quantity} ${GameItems[itemId].name}.`);
        window.uiManager.updateAllStatus(); // Обновляем UI
        return true;
    }

    // Метод для удаления предмета из инвентаря игрока
    removeItem(itemId, quantity = 1) {
        if (!this.inventory[itemId] || this.inventory[itemId] < quantity) {
            window.uiManager.addGameLog(`У вас недостаточно ${GameItems[itemId].name}.`);
            return false;
        }
        this.inventory[itemId] -= quantity;
        if (this.inventory[itemId] === 0) {
            delete this.inventory[itemId];
        }
        window.uiManager.addGameLog(`Вы использовали ${quantity} ${GameItems[itemId].name}.`);
        window.uiManager.updateAllStatus(); // Обновляем UI
        return true;
    }

    // Метод для проверки наличия предмета в инвентаре игрока
    hasItem(itemId, quantity = 1) {
        return (this.inventory[itemId] || 0) >= quantity;
    }

    // Метод для получения урона
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        window.uiManager.addGameLog(`Вы получили ${amount} урона. Здоровье: ${this.health}%`);
        window.uiManager.updateAllStatus();
    }

    // Метод для лечения
    heal(amount) {
        this.health += amount;
        if (this.health > 100) this.health = 100;
        window.uiManager.addGameLog(`Вы восстановили ${amount} здоровья. Здоровье: ${this.health}%`);
        window.uiManager.updateAllStatus();
    }

    // Ежедневные события для игрока
    passDay() {
        // Увеличение голода, жажды, усталости
        this.hunger += 10; // Увеличивается на 10% в день
        this.thirst += 15; // Увеличивается на 15% в день
        this.fatigue += 10; // Увеличивается на 10% в день

        // Потребление ресурсов
        // Проверка наличия еды и воды в инвентаре игрока
        if (this.hasItem('food_ration')) { // Пример: если есть пайка
            this.removeItem('food_ration', 1);
            this.hunger = Math.max(0, this.hunger - 30); // Уменьшаем голод
            window.uiManager.addGameLog('Вы съели пайку. Голод уменьшился.');
        } else if (window.gameState.community.hasResource('food', 1)) {
            // Если у игрока нет, но есть у общины
            window.gameState.community.removeResource('food', 1);
            this.hunger = Math.max(0, this.hunger - 10); // Меньше эффект от сыпучей еды
            window.uiManager.addGameLog('Вы поели из запасов общины. Голод уменьшился.');
        } else {
            // Нет еды
            this.health -= Math.round(this.hunger / 10); // Урон от голода
            window.uiManager.addGameLog('Вы голодаете! Ваше здоровье падает.');
        }

        if (this.hasItem('water_bottle')) { // Пример: если есть бутылка воды
            this.removeItem('water_bottle', 1);
            this.thirst = Math.max(0, this.thirst - 40); // Уменьшаем жажду
            window.uiManager.addGameLog('Вы выпили воды. Жажда уменьшилась.');
        } else if (window.gameState.community.hasResource('water', 1)) {
            // Если у игрока нет, но есть у общины
            window.gameState.community.removeResource('water', 1);
            this.thirst = Math.max(0, this.thirst - 15); // Меньше эффект от сыпучей воды
            window.uiManager.addGameLog('Вы выпили из запасов общины. Жажда уменьшилась.');
        } else {
            // Нет воды
            this.health -= Math.round(this.thirst / 10); // Урон от жажды
            window.uiManager.addGameLog('Вы испытываете жажду! Ваше здоровье падает.');
        }


        // Сон (снижение усталости)
        this.fatigue = Math.max(0, this.fatigue - 50); // Уменьшение усталости после сна

        // Граничные значения
        this.hunger = Math.min(100, this.hunger);
        this.thirst = Math.min(100, this.thirst);
        this.fatigue = Math.min(100, this.fatigue);
        this.health = Math.max(0, this.health); // Здоровье не может быть ниже 0

        window.uiManager.addGameLog('Вы пережили еще один день.');
        window.uiManager.updateAllStatus(); // Обновляем UI после всех изменений
    }
}
