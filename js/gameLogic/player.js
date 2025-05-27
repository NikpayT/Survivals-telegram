// js/entities/player.js

class Player {
    constructor() {
        this.name = "Выживший";
        this.health = 100; // Убедимся, что начальное здоровье > 0
        this.stamina = 100;
        this.maxHealth = 100;
        this.maxStamina = 100;
        this.inventory = {}; // Инвентарь игрока
        this.skills = {
            scavenging: 1,
            crafting: 1,
            combat: 1
        };
        // Дополнительные характеристики или состояние игрока
        window.addGameLog('Игрок инициализирован.');
    }

    addItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.addGameLog(`Неизвестный предмет: ${itemId}`);
            return false;
        }
        if (this.inventory[itemId]) {
            this.inventory[itemId] += quantity;
        } else {
            this.inventory[itemId] = quantity;
        }
        window.addGameLog(`Вы получили ${quantity} ${itemData.name}.`);
        window.uiManager.updatePlayerStatus();
        window.uiManager.updatePlayerInventory();
        return true;
    }

    removeItem(itemId, quantity = 1) {
        const itemData = GameItems[itemId];
        if (!itemData) {
            window.addGameLog(`Неизвестный предмет: ${itemId}`);
            return false;
        }
        if (this.inventory[itemId] && this.inventory[itemId] >= quantity) {
            this.inventory[itemId] -= quantity;
            if (this.inventory[itemId] <= 0) {
                delete this.inventory[itemId];
            }
            window.addGameLog(`Вы использовали ${quantity} ${itemData.name}.`);
            window.uiManager.updatePlayerStatus();
            window.uiManager.updatePlayerInventory();
            return true;
        } else {
            window.addGameLog(`У вас нет ${quantity} ${itemData.name}.`);
            return false;
        }
    }

    hasItem(itemId, quantity = 1) {
        return (this.inventory[itemId] || 0) >= quantity;
    }

    // Применение урона
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
        window.addGameLog(`Вы получили ${amount} урона. Здоровье: ${this.health}/${this.maxHealth}`);
        window.uiManager.updatePlayerStatus();
        // Условие Game Over будет проверено в main.js после каждого действия
    }

    // Восстановление здоровья
    heal(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
        window.addGameLog(`Вы восстановили ${amount} здоровья. Здоровье: ${this.health}/${this.maxHealth}`);
        window.uiManager.updatePlayerStatus();
    }

    // Трата выносливости
    useStamina(amount) {
        if (this.stamina >= amount) {
            this.stamina -= amount;
            window.addGameLog(`Вы потратили ${amount} выносливости. Выносливость: ${this.stamina}/${this.maxStamina}`);
            window.uiManager.updatePlayerStatus();
            return true;
        } else {
            window.addGameLog('Недостаточно выносливости.');
            return false;
        }
    }

    // Восстановление выносливости (например, при отдыхе)
    restoreStamina(amount) {
        this.stamina += amount;
        if (this.stamina > this.maxStamina) {
            this.stamina = this.maxStamina;
        }
        window.addGameLog(`Вы восстановили ${amount} выносливости. Выносливость: ${this.stamina}/${this.maxStamina}`);
        window.uiManager.updatePlayerStatus();
    }

    // Действия, происходящие в конце дня для игрока
    passDay() {
        // Восстанавливаем выносливость каждый день
        this.restoreStamina(20); // Пример: 20 выносливости в день
        // Возможно, небольшая регенерация здоровья, если есть еда
        if (window.gameState.community && window.gameState.community.resources.food > 0) {
            this.heal(5); // Пример: 5 здоровья, если есть еда
            window.gameState.community.removeResourceOrItem('food', 1); // Тратим 1 ед. еды на игрока
        } else {
            // Если нет еды, возможно, потеря здоровья
            this.takeDamage(2); // Пример: 2 урона, если нет еды
            window.addGameLog("Вы голодаете! У вас нет еды.");
        }
    }
}
