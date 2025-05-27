// /js/gameLogic/craftingManager.js
// Управление системой крафта

class CraftingManager {
    constructor() {
        console.log('CraftingManager инициализирован.');
    }

    /**
     * Проверяет, может ли игрок скрафтить данный рецепт.
     * @param {string} recipeId - ID рецепта.
     * @returns {Object} - { canCraft: boolean, reason?: string }.
     */
    canCraft(recipeId) {
        const player = window.gameState.player;
        const community = window.gameState.community;
        const recipe = CraftingRecipes.find(r => r.id === recipeId);

        if (!recipe) {
            return { canCraft: false, reason: 'Рецепт не найден.' };
        }

        // Проверка наличия ресурсов
        for (const ingredient of recipe.ingredients) {
            if (!player.hasItem(ingredient.itemId, ingredient.quantity)) {
                return { canCraft: false, reason: `Недостаточно ингредиента: ${GameItems[ingredient.itemId].name}` };
            }
        }

        // Проверка наличия требуемой станции
        if (recipe.requiredStation) {
            const stationBuilt = community.facilities[`${recipe.requiredStation}_built`];
            if (!stationBuilt) {
                // Добавляем более читабельное название станции для сообщения
                let stationName = recipe.requiredStation;
                switch (recipe.requiredStation) {
                    case 'workbench': stationName = 'Верстак'; break;
                    case 'chemistry_station': stationName = 'Химическая станция'; break;
                    // Добавьте другие станции
                }
                return { canCraft: false, reason: `Требуется постройка: ${stationName}` };
            }
        }

        // Проверка навыков
        if (recipe.skillRequired) {
            for (const skill in recipe.skillRequired) {
                if (!player.checkSkills({ [skill]: recipe.skillRequired[skill] })) {
                    return { canCraft: false, reason: `Недостаточен навык "${skill}" (Требуется: ${recipe.skillRequired[skill]}, Ваш: ${player.skills[skill]})` };
                }
            }
        }

        return { canCraft: true };
    }

    /**
     * Выполняет крафт предмета.
     * @param {string} recipeId - ID рецепта.
     * @returns {boolean} - true, если крафт успешен, false иначе.
     */
    craftItem(recipeId) {
        const player = window.gameState.player;
        const recipe = CraftingRecipes.find(r => r.id === recipeId);

        if (!recipe) {
            window.addGameLog(`[ОШИБКА КРАФТА] Рецепт "${recipeId}" не найден.`);
            return false;
        }

        const check = this.canCraft(recipeId);
        if (!check.canCraft) {
            window.addGameLog(`[КРАФТ НЕВОЗМОЖЕН] ${check.reason}`);
            return false;
        }

        // Удаляем ингредиенты
        for (const ingredient of recipe.ingredients) {
            player.removeItem(ingredient.itemId, ingredient.quantity);
        }

        // Добавляем результат
        player.addItem(recipe.output.itemId, recipe.output.quantity);

        // Повышаем навык крафта
        player.gainSkillExp('crafting', Math.floor(Math.random() * 2) + 1); // +1-2 к навыку крафта

        window.addGameLog(`Вы успешно создали ${recipe.output.quantity} ед. "${GameItems[recipe.output.itemId].name}"!`);
        return true;
    }
}
