// js/gameLogic/craftingManager.js

class CraftingManager {
    constructor() {
        if (window.uiManager && typeof window.uiManager.addGameLog === 'function') {
            window.uiManager.addGameLog('CraftingManager инициализирован.');
        } else {
            console.log('CraftingManager инициализирован (UI Manager недоступен).');
        }
        this.craftingRecipesElement = document.getElementById('crafting-recipes');
    }

    canCraft(recipeId) {
        const recipe = CraftingRecipes[recipeId];
        if (!recipe) {
            window.uiManager.addGameLog(`Рецепт "${recipeId}" не найден.`);
            return false;
        }

        // Проверка ресурсов игрока
        for (const itemId in recipe.playerIngredients) {
            if (!window.gameState.player.hasItem(itemId, recipe.playerIngredients[itemId])) {
                return false;
            }
        }

        // Проверка ресурсов общины
        for (const itemId in recipe.communityIngredients) {
            if (!window.gameState.community.hasResource(itemId, recipe.communityIngredients[itemId])) {
                return false;
            }
        }
        return true;
    }

    craft(recipeId) {
        if (!this.canCraft(recipeId)) {
            window.uiManager.addGameLog('Не хватает ресурсов для создания этого предмета.');
            return false;
        }

        const recipe = CraftingRecipes[recipeId];

        // Удаляем ресурсы игрока
        for (const itemId in recipe.playerIngredients) {
            window.gameState.player.removeItem(itemId, recipe.playerIngredients[itemId]);
        }

        // Удаляем ресурсы общины
        for (const itemId in recipe.communityIngredients) {
            window.gameState.community.removeResource(itemId, recipe.communityIngredients[itemId]);
        }

        // Добавляем созданный предмет
        if (recipe.output.to === 'player') {
            window.gameState.player.addItem(recipe.output.itemId, recipe.output.quantity);
            window.uiManager.addGameLog(`Вы создали ${recipe.output.quantity} ${GameItems[recipe.output.itemId].name}.`);
        } else if (recipe.output.to === 'community') {
            window.gameState.community.addResourceOrItem(recipe.output.itemId, recipe.output.quantity);
            window.uiManager.addGameLog(`Община создала ${recipe.output.quantity} ${GameItems[recipe.output.itemId].name}.`);
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
            const canCraft = this.canCraft(recipeId);
            const recipeDiv = document.createElement('div');
            recipeDiv.classList.add('crafting-recipe');
            if (!canCraft) {
                recipeDiv.classList.add('unavailable');
            }

            let ingredientsHtml = '';
            for (const itemId in recipe.playerIngredients) {
                ingredientsHtml += `<span>${GameItems[itemId].name} x${recipe.playerIngredients[itemId]} (ваши)</span>`;
            }
            for (const itemId in recipe.communityIngredients) {
                ingredientsHtml += `<span>${GameItems[itemId].name} x${recipe.communityIngredients[itemId]} (общины)</span>`;
            }

            recipeDiv.innerHTML = `
                <h4>${recipe.name}</h4>
                <p>Выход: ${GameItems[recipe.output.itemId].name} x${recipe.output.quantity} (${recipe.output.to === 'player' ? 'в ваш инвентарь' : 'на склад общины'})</p>
                <p>Ингредиенты: ${ingredientsHtml}</p>
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
