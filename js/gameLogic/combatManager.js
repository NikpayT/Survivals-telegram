// /js/gameLogic/combatManager.js
// Управление боевыми столкновениями

class CombatManager {
    constructor() {
        console.log('CombatManager инициализирован.');
        this.currentEnemy = null;
        this.onCombatEnd = null; // Callback-функция, вызываемая после боя
    }

    /**
     * Начинает бой с указанным противником.
     * @param {Object} enemy - Объект противника (например, { name: 'Мутант', health: 50, damage: 15 }).
     * @param {Function} onCombatEndCallback - Функция, вызываемая по завершении боя, принимает результат ('win'|'lose'|'flee').
     */
    startCombat(enemy, onCombatEndCallback) {
        this.currentEnemy = { ...enemy, currentHealth: enemy.health }; // Клонируем врага, чтобы не менять исходные данные
        this.onCombatEnd = onCombatEndCallback;
        window.addGameLog(`Начинается бой с "${this.currentEnemy.name}" (Здоровье: ${this.currentEnemy.currentHealth})`);
        this.displayCombatOptions();
    }

    /**
     * Отображает боевые опции в UI.
     */
    displayCombatOptions() {
        const player = window.gameState.player;

        let combatText = `Вы сражаетесь с **${this.currentEnemy.name}** (Здоровье: ${this.currentEnemy.currentHealth}).\n`;
        combatText += `Ваше здоровье: ${player.health}. Ваше оружие: ${player.equipment.weapon ? GameItems[player.equipment.weapon].name : 'Кулаки'} (Урон: ${player.getEffectiveDamage()}).\n`;

        const options = [
            {
                text: `Атаковать ${this.currentEnemy.name}`,
                customAction: () => this.playerAttack()
            },
            {
                text: 'Попробовать отступить',
                customAction: () => this.attemptFlee()
            }
        ];

        window.uiManager.displayGameText(combatText);
        window.uiManager.displayOptions(options);
    }

    /**
     * Ход игрока: атака.
     */
    playerAttack() {
        const player = window.gameState.player;
        const enemy = this.currentEnemy;

        const playerDamage = player.getEffectiveDamage() + Math.floor(Math.random() * 5) - 2; // Небольшая рандомизация
        enemy.currentHealth -= playerDamage;
        window.addGameLog(`Вы атаковали ${enemy.name} и нанесли ${playerDamage} урона.`);

        if (enemy.currentHealth <= 0) {
            window.addGameLog(`${enemy.name} повержен!`);
            player.gainSkillExp('combat', 3); // Опыт за победу
            player.adjustHealth(5); // Небольшое восстановление за победу
            this.endCombat('win');
            return;
        }

        // Ход противника
        this.enemyAttack();

        if (player.health <= 0) {
            this.endCombat('lose');
            return;
        }

        this.displayCombatOptions(); // Обновляем UI после хода
    }

    /**
     * Ход противника: атака.
     */
    enemyAttack() {
        const player = window.gameState.player;
        const enemy = this.currentEnemy;

        const enemyDamage = enemy.damage + Math.floor(Math.random() * 5) - 2; // Рандомизация урона противника
        player.adjustHealth(-enemyDamage);
        window.addGameLog(`${enemy.name} атаковал вас и нанес ${enemyDamage} урона.`);
    }

    /**
     * Попытка отступления от боя.
     */
    attemptFlee() {
        const player = window.gameState.player;
        player.adjustFatigue(10); // Отступление утомляет
        const fleeChance = 60 + player.skills.survival * 2; // Шанс зависит от навыка выживания

        if (Math.random() * 100 < fleeChance) {
            window.addGameLog(`Вам удалось успешно отступить от ${this.currentEnemy.name}.`);
            player.gainSkillExp('survival', 1);
            this.endCombat('flee');
        } else {
            window.addGameLog(`Не удалось отступить! ${this.currentEnemy.name} настигает вас.`);
            this.enemyAttack(); // Враг атакует за неудачную попытку
            if (player.health <= 0) {
                this.endCombat('lose');
            } else {
                this.displayCombatOptions();
            }
        }
    }

    /**
     * Завершает текущий бой.
     * @param {'win' | 'lose' | 'flee'} result - Результат боя.
     */
    endCombat(result) {
        window.addGameLog(`Бой завершен. Результат: ${result}.`);
        this.currentEnemy = null;
        if (this.onCombatEnd) {
            this.onCombatEnd(result); // Вызываем callback с результатом
            this.onCombatEnd = null; // Очищаем callback
        }
        // После боя, обычно возвращаемся в предыдущую сцену или переходим в новую
        // Это будет управляться в callback-функции, переданной при startCombat
    }
}
