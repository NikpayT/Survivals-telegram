// /js/uiManager.js
// Управление всем графическим интерфейсом пользователя

const UIManager = {
    gameTextElement: null,
    optionsContainerElement: null,
    playerHealthElement: null,
    playerHungerElement: null,
    playerThirstElement: null,
    playerFatigueElement: null,
    communitySurvivorsElement: null,
    communityMoraleElement: null,
    communitySecurityElement: null,
    communityFoodElement: null,
    communityWaterElement: null,

    // Секции главного контента
    exploreSection: null,
    inventorySection: null,
    craftingSection: null,
    communitySection: null,
    factionsSection: null,

    // Кнопки навигации
    navExploreButton: null,
    navInventoryButton: null,
    navCraftingButton: null,
    navCommunityButton: null,
    navFactionsButton: null,

    // Списки для инвентаря/крафта
    playerInventoryList: null,
    communityStorageList: null,
    craftingRecipesList: null,
    factionsList: null, // Для отображения фракций

    init() {
        // Получаем ссылки на элементы DOM
        this.gameTextElement = document.getElementById('game-text');
        this.optionsContainerElement = document.getElementById('options-container');

        // Элементы статуса игрока
        this.playerHealthElement = document.getElementById('player-health');
        this.playerHungerElement = document.getElementById('player-hunger');
        this.playerThirstElement = document.getElementById('player-thirst');
        this.playerFatigueElement = document.getElementById('player-fatigue');

        // Элементы статуса общины
        this.communitySurvivorsElement = document.getElementById('community-survivors');
        this.communityMoraleElement = document.getElementById('community-morale');
        this.communitySecurityElement = document.getElementById('community-security');
        this.communityFoodElement = document.getElementById('community-food');
        this.communityWaterElement = document.getElementById('community-water');

        // Секции
        this.exploreSection = document.getElementById('explore-section');
        this.inventorySection = document.getElementById('inventory-section');
        this.craftingSection = document.getElementById('crafting-section');
        this.communitySection = document.getElementById('community-section');
        this.factionsSection = document.getElementById('factions-section');

        // Кнопки навигации
        this.navExploreButton = document.getElementById('nav-explore');
        this.navInventoryButton = document.getElementById('nav-inventory');
        this.navCraftingButton = document.getElementById('nav-crafting');
        this.navCommunityButton = document.getElementById('nav-community');
        this.navFactionsButton = document.getElementById('nav-factions');

        // Списки
        this.playerInventoryList = document.getElementById('player-inventory-list');
        this.communityStorageList = document.getElementById('community-storage-list');
        this.craftingRecipesList = document.getElementById('crafting-recipes');
        this.factionsList = document.getElementById('factions-list');

        this.setupNavigation(); // Настраиваем обработчики для навигационных кнопок
        console.log('UIManager инициализирован.');
    },

    /**
     * Отображает текст в основном окне игры.
     * @param {string} text - Текст для отображения.
     */
    displayGameText(text) {
        this.gameTextElement.innerHTML = text;
    },

    /**
     * Отображает варианты действий в виде кнопок.
     * @param {Array<Object>} options - Массив объектов { text: string, action: Function }.
     */
    displayOptions(options) {
        this.optionsContainerElement.innerHTML = ''; // Очищаем предыдущие кнопки
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.classList.add('game-option-button');
            button.onclick = option.action;
            this.optionsContainerElement.appendChild(button);
        });
    },

    /**
     * Обновляет все элементы статуса (игрока и общины).
     */
    updateAllStatus() {
        this.updatePlayerStatus();
        this.updateCommunityStatus();
    },

    /**
     * Обновляет строку статуса игрока.
     */
    updatePlayerStatus() {
        const player = window.gameState.player;
        if (!player) return;

        this.playerHealthElement.textContent = player.health;
        this.playerHungerElement.textContent = player.hunger;
        this.playerThirstElement.textContent = player.thirst;
        this.playerFatigueElement.textContent = player.fatigue;

        // Можно добавить изменение цвета в зависимости от состояния
        this.playerHealthElement.style.color = player.health < 20 ? 'var(--color-danger)' : 'var(--color-primary)';
        this.playerHungerElement.style.color = player.hunger > 70 ? 'var(--color-danger)' : 'var(--color-text-light)';
        this.playerThirstElement.style.color = player.thirst > 70 ? 'var(--color-danger)' : 'var(--color-text-light)';
        this.playerFatigueElement.style.color = player.fatigue > 70 ? 'var(--color-danger)' : 'var(--color-text-light)';
    },

    /**
     * Обновляет строку статуса общины.
     */
    updateCommunityStatus() {
        const community = window.gameState.community;
        if (!community) return;

        this.communitySurvivorsElement.textContent = community.survivors;
        this.communityMoraleElement.textContent = community.morale;
        this.communitySecurityElement.textContent = community.security;
        this.communityFoodElement.textContent = community.resources.food;
        this.communityWaterElement.textContent = community.resources.water;

        this.communityMoraleElement.style.color = community.morale < 40 ? 'var(--color-danger)' : 'var(--color-text-light)';
        this.communitySecurityElement.style.color = community.security < 40 ? 'var(--color-danger)' : 'var(--color-text-light)';
        this.communityFoodElement.style.color = community.resources.food < (community.survivors * community.needsPerSurvivor.food * 2) ? 'var(--color-secondary)' : 'var(--color-text-light)';
        this.communityWaterElement.style.color = community.resources.water < (community.survivors * community.needsPerSurvivor.water * 2) ? 'var(--color-secondary)' : 'var(--color-text-light)';
    },

    /**
     * Настраивает обработчики событий для навигационных кнопок.
     */
    setupNavigation() {
        const navButtons = [
            this.navExploreButton,
            this.navInventoryButton,
            this.navCraftingButton,
            this.navCommunityButton,
            this.navFactionsButton
        ];

        const sections = {
            'explore-section': this.exploreSection,
            'inventory-section': this.inventorySection,
            'crafting-section': this.craftingSection,
            'community-section': this.communitySection,
            'factions-section': this.factionsSection
        };

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Убираем активный класс со всех кнопок
                navButtons.forEach(btn => btn.classList.remove('active'));
                // Добавляем активный класс к нажатой кнопке
                button.classList.add('active');

                // Скрываем все секции
                for (const sectionId in sections) {
                    sections[sectionId].classList.add('hidden');
                }

                // Отображаем нужную секцию
                const targetSectionId = button.id.replace('nav-', '') + '-section';
                if (sections[targetSectionId]) {
                    sections[targetSectionId].classList.remove('hidden');
                }

                // Обновляем содержимое секций при их открытии
                switch (targetSectionId) {
                    case 'inventory-section':
                        this.updatePlayerInventory();
                        this.updateCommunityStorage();
                        break;
                    case 'crafting-section':
                        this.updateCraftingRecipes();
                        break;
                    case 'community-section':
                        this.updateCommunityDetails();
                        break;
                    case 'factions-section':
                        this.updateFactionsList();
                        break;
                    case 'explore-section':
                        // При возврате на "Исследовать" восстанавливаем текущую сцену
                        window.loadScene(window.gameState.currentSceneId);
                        break;
                }
            });
        });
    },

    /**
     * Обновляет список предметов в инвентаре игрока.
     */
    updatePlayerInventory() {
        const player = window.gameState.player;
        const detailedInventory = InventoryManager.getDetailedInventory(player.inventory);
        this.playerInventoryList.innerHTML = '';

        if (detailedInventory.length === 0) {
            this.playerInventoryList.innerHTML = '<p>Ваш инвентарь пуст.</p>';
            return;
        }

        detailedInventory.forEach(itemEntry => {
            const item = itemEntry.item;
            const quantity = itemEntry.quantity;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item-list-item');
            itemDiv.innerHTML = `
                <span class="item-name">${item.name} x${quantity}</span>
                <span class="item-description">${item.description}</span>
            `;

            // Добавляем кнопки действий для предметов
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('item-actions');

            if (item.type === 'consumable') {
                const useButton = document.createElement('button');
                useButton.textContent = 'Использовать';
                useButton.onclick = () => {
                    if (player.useItem(item.id)) {
                        this.addMessageToLog(`Вы использовали ${item.name}.`);
                    } else {
                        this.addMessageToLog(`Не удалось использовать ${item.name}.`);
                    }
                };
                actionsDiv.appendChild(useButton);
            }

            if (item.type === 'weapon' && player.equipment.weapon !== item.id) {
                const equipButton = document.createElement('button');
                equipButton.textContent = 'Экипировать';
                equipButton.onclick = () => {
                    player.equipWeapon(item.id);
                    this.addMessageToLog(`Вы экипировали ${item.name}.`);
                    this.updatePlayerInventory(); // Обновить, чтобы кнопка исчезла
                };
                actionsDiv.appendChild(equipButton);
            } else if (item.type === 'weapon' && player.equipment.weapon === item.id) {
                const unequipButton = document.createElement('button');
                unequipButton.textContent = 'Снять';
                unequipButton.onclick = () => {
                    player.unequipWeapon();
                    this.addMessageToLog(`Вы сняли ${item.name}.`);
                    this.updatePlayerInventory(); // Обновить, чтобы кнопка появилась
                };
                actionsDiv.appendChild(unequipButton);
            }

            const transferToCommunityButton = document.createElement('button');
            transferToCommunityButton.textContent = 'На склад';
            transferToCommunityButton.onclick = () => {
                if (InventoryManager.transferItem(item.id, 1, 'player', 'community')) {
                    this.addMessageToLog(`Перемещено ${item.name} на склад.`);
                } else {
                    this.addMessageToLog(`Не удалось переместить ${item.name} на склад.`);
                }
            };
            actionsDiv.appendChild(transferToCommunityButton);

            itemDiv.appendChild(actionsDiv);
            this.playerInventoryList.appendChild(itemDiv);
        });
    },

    /**
     * Обновляет список предметов на складе общины.
     */
    updateCommunityStorage() {
        const community = window.gameState.community;
        const detailedResources = InventoryManager.getDetailedCommunityResources();
        this.communityStorageList.innerHTML = '';

        if (detailedResources.length === 0) {
            this.communityStorageList.innerHTML = '<p>Склад убежища пуст.</p>';
            return;
        }

        detailedResources.forEach(resEntry => {
            const resType = resEntry.type;
            const resName = resEntry.name; // Имя ресурса из getDetailedCommunityResources
            const quantity = resEntry.quantity;

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item-list-item');
            itemDiv.innerHTML = `
                <span class="item-name">${resName} x${quantity}</span>
                <span class="item-description">Находится на складе убежища.</span>
            `;

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('item-actions');

            const transferToPlayerButton = document.createElement('button');
            transferToPlayerButton.textContent = 'В инвентарь';
            // Нужно сопоставить resourceType обратно с itemId для InventoryManager.transferItem
            // Это требует расширения GameItems или создания отдельного mapping
            // Пока заглушка: допустим, itemId - это то же самое, что resType, если он есть в GameItems
            const itemIdForTransfer = Object.keys(GameItems).find(key => {
                const item = GameItems[key];
                // Простое сопоставление, которое нужно будет улучшить,
                // если itemId не всегда совпадает с resType
                if (key === 'canned_food' && resType === 'food') return true;
                if (key === 'water_bottle' && resType === 'water') return true;
                if (key === 'scraps_metal' && resType === 'materials_metal') return true;
                if (key === 'scraps_wood' && resType === 'materials_wood') return true;
                if (key === 'medkit_basic' && resType === 'medical_supplies') return true;
                if (key === 'bandages' && resType === 'medical_supplies') return true;
                if (key === 'pistol_ammo' && resType === 'ammunition') return true;
                if (key === 'fuel_can' && resType === 'fuel') return true;
                return false;
            });

            if (itemIdForTransfer) {
                 transferToPlayerButton.onclick = () => {
                    if (InventoryManager.transferItem(itemIdForTransfer, 1, 'community', 'player')) {
                        this.addMessageToLog(`Перемещено ${GameItems[itemIdForTransfer].name} в инвентарь.`);
                    } else {
                        this.addMessageToLog(`Не удалось переместить ${GameItems[itemIdForTransfer].name} в инвентарь.`);
                    }
                };
                actionsDiv.appendChild(transferToPlayerButton);
            } else {
                transferToPlayerButton.disabled = true; // Отключаем кнопку, если нет прямого соответствия
                transferToPlayerButton.textContent = 'Нельзя взять';
                actionsDiv.appendChild(transferToPlayerButton);
            }

            itemDiv.appendChild(actionsDiv);
            this.communityStorageList.appendChild(itemDiv);
        });
    },


    /**
     * Обновляет список доступных рецептов крафта.
     */
    updateCraftingRecipes() {
        this.craftingRecipesList.innerHTML = '';
        const player = window.gameState.player;
        const community = window.gameState.community;

        CraftingRecipes.forEach(recipe => {
            const canCraft = CraftingManager.canCraft(recipe.id);
            const recipeDiv = document.createElement('div');
            recipeDiv.classList.add('recipe-item');
            if (!canCraft.canCraft) {
                recipeDiv.classList.add('unavailable'); // Добавляем класс для недоступных рецептов
            }

            let ingredientsHtml = recipe.ingredients.map(ing => {
                const hasIngredient = player.hasItem(ing.itemId, ing.quantity);
                const ingredientName = GameItems[ing.itemId] ? GameItems[ing.itemId].name : ing.itemId;
                return `<span class="${hasIngredient ? 'has-ingredient' : 'missing-ingredient'}">${ingredientName} x${ing.quantity}</span>`;
            }).join(', ');

            let requirementsHtml = '';
            if (recipe.requiredStation && !community.facilities[`${recipe.requiredStation}_built`]) {
                requirementsHtml += `<span class="missing-requirement">Требуется: ${recipe.requiredStation_name || recipe.requiredStation}</span>`;
            }
            if (recipe.skillRequired) {
                for (const skill in recipe.skillRequired) {
                    if (player.skills[skill] < recipe.skillRequired[skill]) {
                        requirementsHtml += `<span class="missing-requirement">Требуется навык ${skill}: ${recipe.skillRequired[skill]} (Ваш: ${player.skills[skill]})</span>`;
                    }
                }
            }


            recipeDiv.innerHTML = `
                <span class="item-name">${recipe.name}</span>
                <span class="item-description">${recipe.description}</span>
                <p>Ингредиенты: ${ingredientsHtml}</p>
                ${requirementsHtml ? `<p>${requirementsHtml}</p>` : ''}
            `;

            const craftButton = document.createElement('button');
            craftButton.textContent = 'Создать';
            craftButton.disabled = !canCraft.canCraft; // Отключаем кнопку, если нельзя скрафтить
            craftButton.onclick = () => {
                if (CraftingManager.craftItem(recipe.id)) {
                    this.addMessageToLog(`Вы успешно создали: ${recipe.output.quantity} x ${GameItems[recipe.output.itemId].name}`);
                    this.updateCraftingRecipes(); // Обновить список после крафта
                    this.updatePlayerInventory(); // Обновить инвентарь, если что-то изменилось
                } else {
                    this.addMessageToLog(`Не удалось создать ${recipe.name}.`);
                }
            };
            recipeDiv.appendChild(craftButton);

            this.craftingRecipesList.appendChild(recipeDiv);
        });
    },

    /**
     * Обновляет детали общины.
     */
    updateCommunityDetails() {
        const community = window.gameState.community;
        this.communityDetails.innerHTML = `
            <h3>Состояние Убежища</h3>
            <p>Уровень убежища: ${community.facilities.shelter_level}</p>
            <p>Источник воды: Уровень ${community.facilities.water_source_level}</p>
            <p>Ферма: Уровень ${community.facilities.farm_level}</p>
            <p>Верстак: ${community.facilities.workbench_built ? 'Построен' : 'Нет'}</p>
            <p>Медпункт: ${community.facilities.medical_station_built ? 'Построен' : 'Нет'}</p>
            <button onclick="window.nextGameDay()">Завершить день (Развитие/Потребление)</button>
        `;
        // Здесь можно добавить более сложный UI для управления общиной,
        // найма выживших, назначения задач и т.д.
        // Пока простая кнопка "Завершить день" для демонстрации dailyConsumption.
    },

    /**
     * Обновляет список фракций и отношение к ним.
     */
    updateFactionsList() {
        this.factionsList.innerHTML = '';
        const playerFactions = window.gameState.player.factionsReputation || {}; // Репутация игрока
        // Добавим фракции по умолчанию, если их нет в player.factionsReputation
        for (const factionId in GameFactions) {
            if (playerFactions[factionId] === undefined) {
                playerFactions[factionId] = GameFactions[factionId].initialReputation;
            }
        }

        for (const factionId in playerFactions) {
            const faction = GameFactions[factionId];
            const reputation = playerFactions[factionId];
            const status = FactionManager.getReputationStatus(factionId, reputation);

            const factionDiv = document.createElement('div');
            factionDiv.classList.add('faction-item');
            factionDiv.innerHTML = `
                <span class="faction-name">${faction.name}</span>
                <span class="faction-description">${faction.description}</span>
                <p>Репутация: <span class="reputation-value reputation-${status.toLowerCase()}">${reputation} (${status})</span></p>
            `;
            // Добавим кнопки для взаимодействия с фракциями в будущем
            this.factionsList.appendChild(factionDiv);
        }
    },

    /**
     * Добавляет сообщение в игровой лог (пока просто в консоль).
     * В будущем можно отображать в отдельном UI-элементе.
     * @param {string} message - Сообщение для лога.
     */
    addMessageToLog(message) {
        console.log(`[LOG] ${message}`);
        // В будущем: обновить текстовое поле или отдельный лог
    }
};

// Делаем UIManager глобально доступным
window.uiManager = UIManager;
