// js/gameLogic/craftingManager.js

class CraftingManager {
    constructor() {
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('CraftingManager инициализирован.');
        } else {
            console.log('CraftingManager инициализирован (UI Manager недоступен).');
        }
        this.craftingRecipesElement = document.getElementById('crafting-recipes');
        if (!this.craftingRecipesElement) console.warn("CraftingManager: Элемент #crafting-recipes не найден.");
    }

    canCraft(recipeId) {
        const recipe = CraftingRecipes[recipeId];
        if (!recipe) {
            window.addGameLog(`Рецепт "${recipeId}" не найден.`);
            return false;
        }

        const player = window.gameState.player;
        const community = window.gameState.community;

        if (!player || !community) {
            console.warn("CraftingManager: Игрок или община не инициализированы.");
            return false;
        }

        // Проверка ресурсов игрока
        for (const itemId in recipe.playerIngredients) {
            if (!player.hasItem(itemId, recipe.playerIngredients[itemId])) {
                return false;
            }
        }

        // Проверка ресурсов общины
        for (const itemId in recipe.communityIngredients) {
            // Используем hasResourceOrItem для универсальности
            if (!community.removeResourceOrItem(itemId, recipe.communityIngredients[itemId], true)) { // true для проверки без удаления
                return false;
            }
        }
        return true;
    }

    craft(recipeId) {
        if (!this.canCraft(recipeId)) {
            window.addGameLog('Не хватает ресурсов для создания этого предмета.');
            return false;
        }

        const recipe = CraftingRecipes[recipeId];
        const player = window.gameState.player;
        const community = window.gameState.community;

        // Удаляем ресурсы игрока
        for (const itemId in recipe.playerIngredients) {
            player.removeItem(itemId, recipe.playerIngredients[itemId]);
        }

        // Удаляем ресурсы общины
        for (const itemId in recipe.communityIngredients) {
            community.removeResourceOrItem(itemId, recipe.communityIngredients[itemId]);
        }

        // Добавляем созданный предмет
        const outputItemData = GameItems[recipe.output.itemId];
        if (!outputItemData) {
            console.error(`CraftingManager: Выходной предмет "${recipe.output.itemId}" не найден.`);
            window.addGameLog(`Ошибка при создании предмета: ${recipe.output.itemId}`);
            return false;
        }

        if (recipe.output.to === 'player') {
            player.addItem(recipe.output.itemId, recipe.output.quantity);
            window.addGameLog(`Вы создали ${recipe.output.quantity} ${outputItemData.name}.`);
        } else if (recipe.output.to === 'community') {
            community.addResourceOrItem(recipe.output.itemId, recipe.output.quantity);
            window.addGameLog(`Община создала ${recipe.output.quantity} ${outputItemData.name}.`);
        } else {
            console.warn(`CraftingManager: Неизвестное место назначения для созданного предмета: ${recipe.output.to}`);
        }

        window.uiManager.updateAllStatus(); // Обновляем статус после крафта
        this.displayCraftingRecipes(); // Обновляем список рецептов
        return true;
    }

    // Метод для отображения рецептов крафта в UI
    displayCraftingRecipes() {
        if (!this.craftingRecipesElement) {
            console.warn("CraftingManager: Элемент для рецептов крафта не найден.");
            return;
        }
        this.craftingRecipesElement.innerHTML = ''; // Очищаем старые рецепты

        for (const recipeId in CraftingRecipes) {
            const recipe = CraftingRecipes[recipeId];
            const canCraft = this.canCraft(recipeId); // Проверяем возможность создания для каждого рецепта
            const recipeDiv = document.createElement('div');
            recipeDiv.classList.add('crafting-recipe');
            if (!canCraft) {
                recipeDiv.classList.add('unavailable');
            }

            let ingredientsHtml = '';
            // Ингредиенты игрока
            for (const itemId in recipe.playerIngredients) {
                const itemData = GameItems[itemId];
                if (itemData) {
                    ingredientsHtml += `<span>${itemData.name} x${recipe.playerIngredients[itemId]} (ваши)</span>`;
                } else {
                    console.warn(`CraftingManager: Неизвестный ингредиент игрока в рецепте "${recipe.name}": ${itemId}`);
                }
            }
            // Ингредиенты общины
            for (const itemId in recipe.communityIngredients) {
                const itemData = GameItems[itemId];
                if (itemData) {
                    ingredientsHtml += `<span>${itemData.name} x${recipe.communityIngredients[itemId]} (общины)</span>`;
                } else {
                    console.warn(`CraftingManager: Неизвестный ингредиент общины в рецепте "${recipe.name}": ${itemId}`);
                }
            }

            const outputItemName = GameItems[recipe.output.itemId] ? GameItems[recipe.output.itemId].name : 'Неизвестный предмет';

            recipeDiv.innerHTML = `
                <h4>${recipe.name}</h4>
                <p>Выход: ${outputItemName} x${recipe.output.quantity} (${recipe.output.to === 'player' ? 'в ваш инвентарь' : 'на склад общины'})</p>
                <p>Ингредиенты: ${ingredientsHtml || 'Нет'}</p>
                <button class="craft-button" ${canCraft ? '' : 'disabled'}>Создать</button>
            `;

            const craftButton = recipeDiv.querySelector('.craft-button');
            if (craftButton) {
                craftButton.addEventListener('click', () => this.craft(recipeId));
            }
            this.craftingRecipesElement.appendChild(recipeDiv);
        }
    }
}
