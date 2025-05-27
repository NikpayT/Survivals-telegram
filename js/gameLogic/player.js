// /js/gameLogic/player.js
// Объект, управляющий состоянием и действиями игрока

class Player {
    constructor() {
        this.health = 100; // Здоровье (0-100)
        this.hunger = 0;   // Голод (0-100, 0 - не голоден, 100 - очень голоден)
        this.thirst = 0;   // Жажда (0-100, 0 - не испытывает жажды, 100 - очень хочет пить)
        this.fatigue = 0;  // Усталость (0-100, 0 - бодр, 100 - очень устал)
        this.currentLocation = 'abandoned_building_start'; // Текущая локация игрока
        this.inventory = {}; // Инвентарь игрока: { itemId: quantity }
        this.skills = {      // Навыки игрока
            survival: 1,
            crafting: 1,
            combat: 1,
            scavenging: 1,
            charisma: 1,
            science: 1,
            strength: 1
        };
        this.equipment = {   // Экипировка
            weapon: null,
            armor: null
        };
        this.statusEffects = []; // Активные статусные эффекты (например, "ранен", "болен")
    }

    /**
     * Изменяет здоровье игрока.
     * @param {number} amount - Количество, на которое изменяется здоровье (положительное для восстановления, отрицательное для урона).
     */
    adjustHealth(amount) {
        this.health += amount;
        if (this.health > 100) this.health = 100;
        if (this.health < 0) this.health = 0; // Игрок мертв, если health <= 0
        window.addGameLog(`Здоровье изменено на ${amount}. Текущее: ${this.health}`);
        window.uiManager.updatePlayerStatus();
    }

    /**
     * Изменяет уровень голода игрока.
     * @param {number} amount - Количество, на которое изменяется голод (положительное для увеличения, отрицательное для утоления).
     */
    adjustHunger(amount) {
        this.hunger += amount;
        if (this.hunger > 100) this.hunger = 100;
        if (this.hunger < 0) this.hunger = 0;
        window.uiManager.updatePlayerStatus();
    }

    /**
     * Изменяет уровень жажды игрока.
     * @param {number} amount - Количество, на которое изменяется жажда (положительное для увеличения, отрицательное для утоления).
     */
    adjustThirst(amount) {
        this.thirst += amount;
        if (this.thirst > 100) this.thirst = 100;
        if (this.thirst < 0) this.thirst = 0;
        window.uiManager.updatePlayerStatus();
    }

    /**
     * Изменяет уровень усталости игрока.
     * @param {number} amount - Количество, на которое изменяется усталость.
     */
    adjustFatigue(amount) {
        this.fatigue += amount;
        if (this.fatigue > 100) this.fatigue = 100;
        if (this.fatigue < 0) this.fatigue = 0;
        window.uiManager.updatePlayerStatus();
    }

    /**
     * Добавляет предмет в инвентарь игрока.
     * @param {string} itemId - ID предмета.
     * @param {number} quantity - Количество.
     */
    addItem(itemId, quantity = 1) {
        if (this.inventory[itemId]) {
            this.inventory[itemId] += quantity;
        } else {
            this.inventory[itemId] = quantity;
        }
        window.addGameLog(`Найден предмет: ${GameItems[itemId].name} x${quantity}`);
        window.uiManager.updatePlayerInventory();
    }

    /**
     * Удаляет предмет из инвентаря игрока.
     * @param {string} itemId - ID предмета.
     * @param {number} quantity - Количество для удаления.
     * @returns {boolean} - true, если удаление успешно, false иначе.
     */
    removeItem(itemId, quantity = 1) {
        if (this.inventory[itemId] && this.inventory[itemId] >= quantity) {
            this.inventory[itemId] -= quantity;
            if (this.inventory[itemId] <= 0) {
                delete this.inventory[itemId];
            }
            window.uiManager.updatePlayerInventory();
            return true;
        }
        window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Недостаточно ${GameItems[itemId] ? GameItems[itemId].name : itemId} в инвентаре.`);
        return false;
    }

    /**
     * Проверяет наличие предмета и его количество в инвентаре.
     * @param {string} itemId - ID предмета.
     * @param {number} quantity - Требуемое количество.
     * @returns {boolean} - true, если предмет в нужном количестве есть, false иначе.
     */
    hasItem(itemId, quantity = 1) {
        return this.inventory[itemId] && this.inventory[itemId] >= quantity;
    }

    /**
     * Использует расходуемый предмет.
     * @param {string} itemId - ID расходуемого предмета.
     */
    useItem(itemId) {
        const item = GameItems[itemId];
        if (!item || item.type !== 'consumable') {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Предмет ${itemId} не является расходуемым или не существует.`);
            return false;
        }
        if (!this.hasItem(itemId, 1)) {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] У вас нет ${item.name}.`);
            return false;
        }

        if (this.removeItem(itemId, 1)) {
            if (item.effect) {
                for (const effectType in item.effect) {
                    switch (effectType) {
                        case 'health':
                            this.adjustHealth(item.effect[effectType]);
                            break;
                        case 'hunger':
                            this.adjustHunger(item.effect[effectType]);
                            break;
                        case 'thirst':
                            this.adjustThirst(item.effect[effectType]);
                            break;
                        case 'fatigue':
                            this.adjustFatigue(item.effect[effectType]);
                            break;
                        case 'waterPurity':
                            // Пока заглушка для эффекта очистки воды
                            window.addGameLog(`Вода очищена!`);
                            break;
                        // Добавляем новые эффекты здесь по мере необходимости
                    }
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Вычисляет эффективный урон игрока.
     * @returns {number} - Общий урон.
     */
    getEffectiveDamage() {
        let baseDamage = 5; // Базовый урон игрока
        if (this.equipment.weapon) {
            baseDamage += GameItems[this.equipment.weapon].damage || 0;
        }
        // Добавляем влияние навыка боя
        baseDamage += Math.floor(this.skills.combat / 5); // Каждые 5 очков навыка +1 урон
        return baseDamage;
    }

    /**
     * Экипирует оружие.
     * @param {string} itemId - ID оружия.
     */
    equipWeapon(itemId) {
        const item = GameItems[itemId];
        if (!item || item.type !== 'weapon') {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Предмет ${itemId} не является оружием.`);
            return false;
        }
        if (!this.hasItem(itemId, 1)) {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] У вас нет ${item.name} для экипировки.`);
            return false;
        }

        // Если уже есть оружие, сначала снять его
        if (this.equipment.weapon) {
            this.addItem(this.equipment.weapon, 1);
        }
        this.equipment.weapon = itemId;
        this.removeItem(itemId, 1); // Удаляем из инвентаря, оно теперь экипировано
        window.uiManager.updatePlayerStatus(); // Обновляем статус, чтобы показать оружие
        window.uiManager.updatePlayerInventory(); // Обновляем инвентарь для отображения
        return true;
    }

    /**
     * Снимает оружие.
     */
    unequipWeapon() {
        if (this.equipment.weapon) {
            const weaponId = this.equipment.weapon;
            this.addItem(weaponId, 1); // Возвращаем в инвентарь
            this.equipment.weapon = null;
            window.uiManager.updatePlayerStatus(); // Обновляем статус
            window.uiManager.updatePlayerInventory();
        }
    }

    /**
     * Экипирует броню (пример).
     * @param {string} itemId - ID брони.
     */
    equipArmor(itemId) {
        const item = GameItems[itemId];
        if (!item || item.type !== 'armor') {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Предмет ${itemId} не является броней.`);
            return false;
        }
        if (!this.hasItem(itemId, 1)) {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] У вас нет ${item.name} для экипировки.`);
            return false;
        }
        if (this.equipment.armor) {
            this.addItem(this.equipment.armor, 1);
        }
        this.equipment.armor = itemId;
        this.removeItem(itemId, 1);
        window.uiManager.updatePlayerStatus();
        window.uiManager.updatePlayerInventory();
        return true;
    }

    /**
     * Снимает броню.
     */
    unequipArmor() {
        if (this.equipment.armor) {
            const armorId = this.equipment.armor;
            this.addItem(armorId, 1);
            this.equipment.armor = null;
            window.uiManager.updatePlayerStatus();
            window.uiManager.updatePlayerInventory();
        }
    }


    /**
     * Проверяет, жив ли игрок.
     * @returns {boolean}
     */
    isAlive() {
        return this.health > 0;
    }

    /**
     * Повышает уровень навыка.
     * @param {string} skillName - Название навыка.
     * @param {number} amount - Количество очков для добавления.
     */
    gainSkillExp(skillName, amount = 1) {
        if (this.skills[skillName] !== undefined) {
            this.skills[skillName] += amount;
            window.addGameLog(`Навык "${skillName}" повышен до ${this.skills[skillName]}`);
            window.uiManager.updatePlayerStatus(); // Обновляем UI, если есть отображение навыков
        } else {
            window.addGameLog(`[ПРЕДУПРЕЖДЕНИЕ] Попытка повысить несуществующий навык: ${skillName}`);
        }
    }

    /**
     * Проверяет, достаточно ли у игрока навыка для действия.
     * @param {Object} requiredSkills - Объект { skillName: requiredLevel }.
     * @returns {boolean}
     */
    checkSkills(requiredSkills) {
        for (const skill in requiredSkills) {
            if (this.skills[skill] === undefined || this.skills[skill] < requiredSkills[skill]) {
                return false;
            }
        }
        return true;
    }
}
