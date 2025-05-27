// js/entities/player.js

class Player {
    constructor() {
        this.name = "Выживший";
        this.health = 100;
        this.stamina = 100;
        this.maxHealth = 100;
        this.maxStamina = 100;
        
        // НОВЫЕ ХАРАКТЕРИСТИКИ для UI
        this.hunger = 0; // Начинаем без голода
        this.thirst = 0; // Начинаем без жажды
        this.fatigue = 0; // Начинаем без усталости

        // Максимальные значения для голода, жажды, усталости (для расчета %)
        this.maxHunger = 100; 
        this.maxThirst = 100;
        this.maxFatigue = 100;

        this.inventory = {}; // Инвентарь игрока
        this.skills = {
            scavenging: 1,
            crafting: 1,
            combat: 1
        };
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

    // НОВОЕ: Методы для управления голодом, жаждой, усталостью
    gainHunger(amount) {
        this.hunger += amount;
        if (this.hunger > this.maxHunger) {
            this.hunger = this.maxHunger;
        }
        window.uiManager.updatePlayerStatus();
    }

    reduceHunger(amount) {
        this.hunger -= amount;
        if (this.hunger < 0) {
            this.hunger = 0;
        }
        window.uiManager.updatePlayerStatus();
    }

    gainThirst(amount) {
        this.thirst += amount;
        if (this.thirst > this.maxThirst) {
            this.thirst = this.maxThirst;
        }
        window.uiManager.updatePlayerStatus();
    }

    reduceThirst(amount) {
        this.thirst -= amount;
        if (this.thirst < 0) {
            this.thirst = 0;
        }
        window.uiManager.updatePlayerStatus();
    }

    gainFatigue(amount) {
        this.fatigue += amount;
        if (this.fatigue > this.maxFatigue) {
            this.fatigue = this.maxFatigue;
        }
        window.uiManager.updatePlayerStatus();
    }

    reduceFatigue(amount) {
        this.fatigue -= amount;
        if (this.fatigue < 0) {
            this.fatigue = 0;
        }
        window.uiManager.updatePlayerStatus();
    }

    // Действия, происходящие в конце дня для игрока
    passDay() {
        // Восстанавливаем выносливость каждый день
        this.restoreStamina(20);

        // НОВОЕ: Увеличиваем голод, жажду, усталость ежедневно
        this.gainHunger(15); 
        this.gainThirst(20);
        this.gainFatigue(10);

        // Применяем эффекты от голода/жажды/усталости, если они слишком высоки
        if (this.hunger >= this.maxHunger * 0.8) { // Если голод > 80%
            this.takeDamage(5); // Теряем здоровье
            window.addGameLog("Вы очень голодны и теряете здоровье!");
        } else if (this.hunger > 0) {
            window.addGameLog("Вы чувствуете голод.");
        }

        if (this.thirst >= this.maxThirst * 0.8) { // Если жажда > 80%
            this.takeDamage(10); // Теряем больше здоровья
            window.addGameLog("Вы испытываете сильную жажду и теряете здоровье!");
        } else if (this.thirst > 0) {
            window.addGameLog("Вы чувствуете жажду.");
        }

        if (this.fatigue >= this.maxFatigue * 0.9) { // Если усталость > 90%
            this.takeDamage(3); // Теряем немного здоровья
            window.addGameLog("Вы крайне истощены и это сказывается на вашем здоровье!");
        } else if (this.fatigue > 0) {
            window.addGameLog("Вы чувствуете усталость.");
        }

        // Возможно, небольшая регенерация здоровья, если есть еда
        if (window.gameState.community && window.gameState.community.resources.food > 0) {
            // У игрока может быть своя еда или он берет из общины.
            // Пока что предполагаем, что он берет из общины.
            // Этот механизм лучше будет продумать в будущем.
            // heal(5) убрано отсюда, чтобы не было путаницы с потреблением еды общиной
            // и чтобы голод регулировался через reduceHunger при приеме пищи.
        } else {
            // Если нет еды в общине (и у игрока), то игрок голодает.
            // Эта логика уже в gainHunger и проверке hunger выше.
        }
        
        window.uiManager.updatePlayerStatus();
    }
}
