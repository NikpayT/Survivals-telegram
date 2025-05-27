// /js/uiManager.js
// Управление всем графическим интерфейсом пользователя

const UIManager = {
    gameTextElement: null,
    optionsContainerElement: null,
    playerHealthElement: null,
    playerHungerElement: null,
    playerThirstElement: null,
    playerFatigueElement: null,
    currentWeaponElement: null, // Добавляем элемент для текущего оружия
    communitySurvivorsElement: null,
    communityMoraleElement: null,
    communitySecurityElement: null,
    communityFoodElement: null,
    communityWaterElement: null,
    gameLogElement: null,

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
    communityDetails: null,
    factionsList: null,

    init() {
        // Получаем ссылки на элементы DOM
        this.gameTextElement = document.getElementById('game-text');
        this.optionsContainerElement = document.getElementById('options-container');

        // Элементы статуса игрока
        this.playerHealthElement = document.getElementById('player-health');
        this.playerHungerElement = document.getElementById('player-hunger');
        this.playerThirstElement = document.getElementById('player-thirst');
        this.playerFatigueElement = document.getElementById('player-fatigue');
        this.currentWeaponElement = document.getElementById('current-weapon'); // Инициализируем элемент оружия

        // Элементы статуса общины
        this.communitySurvivorsElement = document.getElementById('community-survivors');
        this.communityMoraleElement = document.getElementById('community-morale');
        this.communitySecurityElement = document.getElementById('community-security');
        this.communityFoodElement = document.getElementById('community-food');
        this.communityWaterElement = document.getElementById('community-water');

        // Элементы лога
        this.gameLogElement = document.getElementById('game-log');

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

        // Списки и детали
        this.playerInventoryList = document.getElementById('player-inventory-list');
        this.communityStorageList = document.getElementById('community-storage-list');
        this.craftingRecipesList = document.getElementById('crafting-recipes');
        this.communityDetails = document.getElementById('community-details');
        this.factionsList = document.getElementById('factions-list');

        this.setupNavigation();
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
        this.optionsContainerElement.innerHTML = '';
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
        this.currentWeaponElement.textContent = player.equipment.weapon ? GameItems[player.equipment.weapon].name : 'Нет'; // Обновление оружия

        // Можно добавить изменение цвета в зависимости от состояния
        this.playerHealthElement.style.color = player.health < 20 ? 'var(--color-danger)' : (player.health < 50 ? 'var(--color-secondary)' : 'var(--color-primary)');
        this.playerHungerElement.style.color = player.hunger > 70 ? 'var(--color-danger)' : (player.hunger > 40 ? 'var(--color-secondary)' : 'var(--color-text-light)');
        this.playerThirstElement.style.color = player.thirst > 70 ? 'var(--color-danger)' : (player.thirst > 40 ? 'var(--color-secondary)' : 'var(--color-text-light)');
        this.playerFatigueElement.style.color = player.fatigue > 70 ? 'var(--color-danger)' : (player.fatigue > 40 ? 'var(--color-secondary)' : 'var(--color-text-light)');
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

        this.communityMoraleElement.style.color = community.morale < 40 ? 'var(--color-danger)' : (community.morale < 70 ? 'var(--color-secondary)' : 'var(--color-text-light)');
        this.communitySecurityElement.style.color = community.security < 40 ? 'var(--color-danger)' : (community.security < 70 ? 'var(--color-secondary)' : 'var(--color-text-light)');
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
                        // Используем UIManager.addGameLog вместо window.addGameLog
                        this.addGameLog('Вы вернулись к исследованию.');
                        window.loadScene(window.gameState.currentSceneId, false); // false, чтобы не вызывать onEnter повторно
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

        if (detailedInventory.length === 0 && !player.equipment.weapon && !player.equipment.armor) {
            this.playerInventoryList.innerHTML = '<p>Ваш инвентарь и экипировка пусты.</p>';
            return;
        }

        // Отображение экипированного оружия
        if (player.equipment.weapon) {
            const weaponItem = GameItems[player.equipment.weapon];
            const equippedWeaponDiv = document.createElement('div');
            equippedWeaponDiv.classList.add('item-list-item', 'equipped-item');
            equippedWeaponDiv.innerHTML = `
                <span class="item-name">Экипировано: ${weaponItem.name}</span>
                <span class="item-description">${weaponItem.description} (Урон: ${weaponItem.damage}, Прочность: ${weaponItem.durability}%)</span>
            `;
            const unequipButton = document.createElement('button');
            unequipButton.textContent = 'Снять';
            unequipButton.classList.add('game-action-button');
            unequipButton.onclick = () => {
                player.unequipWeapon();
                // Используем UIManager.addGameLog вместо window.addGameLog
                this.addGameLog(`Вы сняли ${weaponItem.name}.`);
                this.updatePlayerInventory();
            };
            equippedWeaponDiv.appendChild(unequipButton);
            this.playerInventoryList.appendChild(equippedWeaponDiv);
        }

        // Отображение экипированной брони (если добавим)
        if (player.equipment.armor) {
            const armorItem = GameItems[player.equipment.armor];
            const equippedArmorDiv = document.createElement('div');
            equippedArmorDiv.classList.add('item-list-item', 'equipped-item');
            equippedArmorDiv.innerHTML = `
                <span class="item-name">Экипировано: ${armorItem.name}</span>
                <span class="item-description">${armorItem.description} (Защита: ${armorItem.defense}, Прочность: ${armorItem.durability}%)</span>
            `;
            const unequipButton = document.createElement('button');
            unequipButton.textContent = 'Снять';
            unequipButton.classList.add('game-action-button');
            unequipButton.onclick = () => {
                player.unequipArmor(); // Нужна будет функция unequipArmor в Player
                // Используем UIManager.addGameLog вместо window.addGameLog
                this.addGameLog(`Вы сняли ${armorItem.name}.`);
                this.updatePlayerInventory();
            };
            equippedArmorDiv.appendChild(unequipButton);
            this.playerInventoryList.appendChild(equippedArmorDiv);
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
                useButton.classList.add('game-action-button');
                useButton.onclick = () => {
                    if (player.useItem(item.id)) {
                        // Используем UIManager.addGameLog вместо window.addGameLog
                        this.addGameLog(`Вы использовали ${item.name}.`);
                    } else {
                        // Используем UIManager.addGameLog вместо window.addGameLog
                        this.addGameLog(`Не удалось использовать ${item.name}.`);
                    }
                };
                actionsDiv.appendChild(useButton);
            }

            if (item.type === 'weapon' && player.equipment.weapon !== item.id) {
                const equipButton = document.createElement('button');
                equipButton.textContent = 'Экипировать';
                equipButton.classList.add('game-action-button');
                equipButton.onclick = () => {
                    player.equipWeapon(item.id);
                    // Используем UIManager.addGameLog вместо window.addGameLog
                    this.addGameLog(`Вы экипировали ${item.name}.`);
                    this.updatePlayerInventory();
                };
                actionsDiv.appendChild(equipButton);
            }

            const transferToCommunityButton = document.createElement('button');
            transferToCommunityButton.textContent = 'На склад';
            transferToCommunityButton.classList.add('game-action-button');
            transferToCommunityButton.onclick = () => {
                if (InventoryManager.transferItem(item.id, 1, 'player', 'community')) {
                    // Используем UIManager.addGameLog вместо window.addGameLog
                    this.addGameLog(`Перемещено ${item.name} на склад.`);
                } else {
                    // Используем UIManager.addGameLog вместо window.addGameLog
                    this.addGameLog(`Не удалось переместить ${item.name} на склад.`);
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
            const resName = resEntry.name;
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
            transferToPlayerButton.classList.add('game-action-button');

            // Поиск соответствующего itemId из GameItems для передачи на склад
            const itemIdForTransfer = Object.keys(GameItems).find(key => {
                const item = GameItems[key];
                // Более универсальное сопоставление, если название ресурса склада соответствует части ID предмета
                // Например, 'materials_metal' сопоставляется с 'scraps_metal'
                if (resType.includes(item.type) && item.id.includes(resType.split('_')[1])) { // crude check
                    return true;
                }
                // Явные сопоставления для Consumables
                if (item.id === 'canned_food' && resType === 'food') return true;
                if (item.id === 'water_bottle' && resType === 'water') return true;
                if (item.id === 'medkit_basic' && resType === 'medical_supplies') return true;
                if (item.id === 'bandages' && resType === 'medical_supplies') return true;
                if (item.id === 'pistol_ammo' && resType === 'ammunition') return true;
                if (item.id === 'fuel_can' && resType === 'fuel') return true;
                return false;
            });


            if (itemIdForTransfer) {
                transferToPlayerButton.onclick = () => {
                    if (InventoryManager.transferItem(itemIdForTransfer, 1, 'community', 'player')) {
                        // Используем UIManager.addGameLog вместо window.addGameLog
                        this.addGameLog(`Перемещено ${GameItems[itemIdForTransfer].name} в инвентарь.`);
                    } else {
                        // Используем UIManager.addGameLog вместо window.addGameLog
                        this.addGameLog(`Не удалось переместить ${GameItems[itemIdForTransfer].name} в инвентарь.`);
                    }
                };
            } else {
                transferToPlayerButton.disabled = true;
                transferToPlayerButton.textContent = 'Нельзя взять';
            }
            actionsDiv.appendChild(transferToPlayerButton);

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
            const canCraftResult = window.craftingManager.canCraft(recipe.id);
            const recipeDiv = document.createElement('div');
            recipeDiv.classList.add('recipe-item');
            if (!canCraftResult.canCraft) {
                recipeDiv.classList.add('unavailable');
            }

            // Ингредиенты
            let ingredientsHtml = recipe.ingredients.map(ing => {
                const hasIngredient = player.hasItem(ing.itemId, ing.quantity);
                const ingredientName = GameItems[ing.itemId] ? GameItems[ing.itemId].name : ing.itemId;
                return `<span class="${hasIngredient ? 'has-ingredient' : 'missing-ingredient'}">${ingredientName} x${ing.quantity}</span>`;
            }).join(', ');

            // Требования (станции, навыки)
            let requirementsHtml = '';
            if (recipe.requiredStation && !community.facilities[`${recipe.requiredStation}_built`]) {
                requirementsHtml += `<span class="missing-requirement">Требуется: ${recipe.requiredStation_name || recipe.requiredStation}</span>`;
            }
            if (recipe.skillRequired) {
                for (const skill in recipe.skillRequired) {
                    if (player.skills[skill] < recipe.skillRequired[skill]) {
                        requirementsHtml += `<span class="missing-requirement">Требуется навык "${skill}": ${recipe.skillRequired[skill]} (Ваш: ${player.skills[skill]})</span>`;
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
            craftButton.classList.add('game-action-button');
            craftButton.disabled = !canCraftResult.canCraft;
            craftButton.onclick = () => {
                if (window.craftingManager.craftItem(recipe.id)) {
                    // Используем UIManager.addGameLog вместо window.addGameLog
                    this.addGameLog(`Вы успешно создали: ${recipe.output.quantity} x ${GameItems[recipe.output.itemId].name}`);
                    this.updateCraftingRecipes();
                    this.updatePlayerInventory();
                    this.updateCommunityStorage();
                } else {
                    // Используем UIManager.addGameLog вместо window.addGameLog
                    this.addGameLog(`Не удалось создать ${recipe.name}. ${canCraftResult.reason || ''}`);
                }
            };
            recipeDiv.appendChild(craftButton);

            this.craftingRecipesList.appendChild(recipeDiv);
        });
    },

    /**
     * Обновляет детали общины и возможности строительства.
     */
    updateCommunityDetails() {
        const community = window.gameState.community;
        this.communityDetails.innerHTML = `
            <h3>Состояние Убежища</h3>
            <p>Уровень убежища: ${community.facilities.shelter_level}</p>
            <p>Источник воды: Уровень ${community.facilities.water_source_level} (${community.facilities.water_source_level > 0 ? 'добывает воду' : 'нет'})</p>
            <p>Ферма: Уровень ${community.facilities.farm_level} (${community.facilities.farm_level > 0 ? 'производит еду' : 'нет'})</p>
            <p>Верстак: ${community.facilities.workbench_built ? 'Построен' : 'Нет'}</p>
            <p>Медпункт: ${community.facilities.medical_station_built ? 'Построен' : 'Нет'}</p>
            <p>День игры: ${window.gameState.gameDay}</p>
            <hr>
            <h3>Постройки и Улучшения</h3>
            <div class="item-list" id="community-build-options">
            </div>
            <hr>
            <button onclick="window.nextGameDay()" class="game-action-button primary-button">Завершить день (Перейти к следующему дню)</button>
        `;

        const buildOptionsContainer = document.getElementById('community-build-options');
        // Пример кнопки для строительства верстака
        if (!community.facilities.workbench_built) {
            const buildWorkbenchButton = document.createElement('button');
            buildWorkbenchButton.textContent = 'Построить Верстак (5 лома металла, 3 обломка дерева)';
            buildWorkbenchButton.classList.add('game-action-button');
            buildWorkbenchButton.onclick = () => {
                const cost = [{id: 'scraps_metal', qty: 5}, {id: 'scraps_wood', qty: 3}];
                if (InventoryManager.checkCommunityResources(cost)) {
                    InventoryManager.removeCommunityResources(cost);
                    community.buildFacility('workbench_built');
                    // Используем UIManager.addGameLog вместо window.addGameLog
                    this.addGameLog('Верстак успешно построен!');
                    this.updateCommunityDetails();
                } else {
                    // Используем UIManager.addGameLog вместо window.addGameLog
                    this.addGameLog('Недостаточно ресурсов для постройки верстака.');
                }
            };
            buildOptionsContainer.appendChild(buildWorkbenchButton);
        } else {
            // Если верстак построен, можно предложить его улучшение или другие постройки
        }
    },

    /**
     * Обновляет список фракций и отношение к ним.
     */
    updateFactionsList() {
        this.factionsList.innerHTML = '';
        const playerFactions = window.gameState.factions;

        for (const factionId in GameFactions) {
            const faction = GameFactions[factionId];
            const reputation = playerFactions[factionId];
            const status = window.factionManager.getReputationStatus(factionId, reputation);

            const factionDiv = document.createElement('div');
            factionDiv.classList.add('faction-item');
            factionDiv.innerHTML = `
                <span class="faction-name">${faction.name}</span>
                <span class="faction-description">${faction.description}</span>
                <p>Репутация: <span class="reputation-value reputation-${status.toLowerCase().replace(' ', '-')}">${reputation} (${status})</span></p>
            `;
            // Добавим кнопки для взаимодействия с фракциями в будущем
            // Например:
            // if (status === 'Friendly') {
            //     const tradeButton = document.createElement('button');
            //     tradeButton.textContent = 'Торговать';
            //     tradeButton.classList.add('game-action-button');
            //     tradeButton.onclick = () => this.addGameLog(`Начало торговли с ${faction.name}`); // Используем this.addGameLog
            //     factionDiv.appendChild(tradeButton);
            // }

            this.factionsList.appendChild(factionDiv);
        }
    },

    /**
     * Добавляет сообщение в игровой лог и обновляет его отображение.
     * Эту функцию нужно будет вызывать извне как `window.uiManager.addGameLog(message);`
     * @param {string} message - Сообщение для лога.
     */
    addGameLog(message) {
        if (!this.gameLogElement) {
            console.warn("gameLogElement не найден. Лог не будет обновлен.");
            return;
        }

        // Добавляем сообщение в массив игрового состояния, если он существует
        if (window.gameState && window.gameState.gameLog) {
            window.gameState.gameLog.unshift(message); // Добавляем в начало массива
            // Ограничиваем количество записей
            if (window.gameState.gameLog.length > 50) { // Например, не более 50 записей в памяти
                window.gameState.gameLog.pop(); // Удаляем старейшую запись
            }
        } else {
            // Если gameState.gameLog еще не инициализирован, просто добавляем в DOM напрямую
            console.warn("window.gameState.gameLog не инициализирован. Сообщения лога не будут сохранены.");
        }

        // Обновляем DOM
        this.gameLogElement.innerHTML = window.gameState.gameLog.map(msg => `<p>${msg}</p>`).join('');
        // Прокручиваем лог вниз, чтобы видеть новые сообщения
        this.gameLogElement.scrollTop = this.gameLogElement.scrollHeight;
    }
};

// Делаем UIManager глобально доступным
window.uiManager = UIManager;

// Дополнительный шаг: делаем функцию addGameLog глобальной функцией для удобства
// чтобы другие менеджеры могли вызывать её без явного обращения к UIManager.
// Однако, предпочтительнее везде использовать window.uiManager.addGameLog.
// Если ты хочешь сохранить вызовы window.addGameLog, то добавь эту строку:
// window.addGameLog = (message) => UIManager.addGameLog(message);
// Но я рекомендую изменить все вызовы на window.uiManager.addGameLog
