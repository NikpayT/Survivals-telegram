const game = {
    state: {
        day: 1,
        survivors: 1,
        // maxSurvivors будет вычисляться на основе построек
        food: 20,
        water: 20,
        materials: 10,
        medicine: 5,
        gameOver: false,
        currentEvent: null,
        structures: {}, // Будет заполнено из BASE_STRUCTURE_DEFINITIONS
        fedToday: false,
        wateredToday: false,
    },

    // Вычисляемые свойства (getters)
    get maxSurvivors() {
        let max = 0;
        if (this.state.structures.shelter && this.state.structures.shelter.level > 0) {
            max += BASE_STRUCTURE_DEFINITIONS.shelter.effect(this.state.structures.shelter.level).maxSurvivors;
        }
        return max || 1; // Минимум 1, если убежища нет (хотя оно всегда есть)
    },

    get foodPerDayFromStructures() {
        let production = 0;
        if (this.state.structures.garden && this.state.structures.garden.level > 0) {
            production += BASE_STRUCTURE_DEFINITIONS.garden.effect(this.state.structures.garden.level).foodPerDay;
        }
        return production;
    },

    get waterPerDayFromStructures() {
        let production = 0;
        if (this.state.structures.waterCollector && this.state.structures.waterCollector.level > 0) {
            production += BASE_STRUCTURE_DEFINITIONS.waterCollector.effect(this.state.structures.waterCollector.level).waterPerDay;
        }
        return production;
    },


    dom: {
        day: document.getElementById('day'),
        survivors: document.getElementById('survivors'),
        maxSurvivors: document.getElementById('max-survivors'),
        food: document.getElementById('food'),
        water: document.getElementById('water'),
        materials: document.getElementById('materials'),
        medicine: document.getElementById('medicine'),
        logMessages: document.getElementById('log-messages'),
        mainActions: document.getElementById('main-actions'),
        buildActions: document.getElementById('build-actions'),
        eventActions: document.getElementById('event-actions'),
        eatButton: document.getElementById('eat-button'),
        drinkButton: document.getElementById('drink-button'),
        fedStatus: document.getElementById('fed-status'),
        wateredStatus: document.getElementById('watered-status'),
    },

    init: function() {
        this.initializeStructures(); // Инициализация структур из buildings.js
        this.loadGame(); // Попытка загрузить игру ПОСЛЕ инициализации структур по умолчанию
        this.updateDisplay();
        this.updateBuildActions();
        this.updateFeedDrinkStatus();
        this.dom.eatButton.onclick = () => this.consumeResource('food');
        this.dom.drinkButton.onclick = () => this.consumeResource('water');
        this.log("Игра началась. Пустошь ждет.", "event-neutral");
    },

    initializeStructures: function() {
        this.state.structures = {}; // Очищаем на случай resetGame
        for (const key in BASE_STRUCTURE_DEFINITIONS) {
            const def = BASE_STRUCTURE_DEFINITIONS[key];
            this.state.structures[key] = {
                level: def.initialLevel || 0,
                // Другие динамические свойства для здания можно добавить сюда, если нужно
            };
        }
    },

    updateDisplay: function() {
        this.dom.day.textContent = this.state.day;
        this.dom.survivors.textContent = this.state.survivors;
        this.dom.maxSurvivors.textContent = this.maxSurvivors; // Используем getter
        this.dom.food.textContent = this.state.food;
        this.dom.water.textContent = this.state.water;
        this.dom.materials.textContent = this.state.materials;
        this.dom.medicine.textContent = this.state.medicine;
        this.updateFeedDrinkStatus();
    },

    updateFeedDrinkStatus: function() {
        const foodNeeded = this.state.survivors;
        const waterNeeded = this.state.survivors;

        if (this.state.fedToday) {
            this.dom.fedStatus.textContent = "(накормлены)";
            this.dom.fedStatus.className = 'status-ok';
            this.dom.eatButton.disabled = true;
        } else {
            this.dom.fedStatus.textContent = `(нужно ${foodNeeded} ед.)`;
            this.dom.fedStatus.className = 'status-needed';
            this.dom.eatButton.disabled = this.state.food < foodNeeded || this.state.currentEvent !== null;
        }

        if (this.state.wateredToday) {
            this.dom.wateredStatus.textContent = "(напоены)";
            this.dom.wateredStatus.className = 'status-ok';
            this.dom.drinkButton.disabled = true;
        } else {
            this.dom.wateredStatus.textContent = `(нужно ${waterNeeded} ед.)`;
            this.dom.wateredStatus.className = 'status-needed';
            this.dom.drinkButton.disabled = this.state.water < waterNeeded || this.state.currentEvent !== null;
        }
        // Общая блокировка кнопок если игра окончена или идет событие
        if (this.state.gameOver || this.state.currentEvent) {
            this.dom.eatButton.disabled = true;
            this.dom.drinkButton.disabled = true;
        }
    },

    consumeResource: function(type) {
        if (this.state.gameOver || this.state.currentEvent) return;

        const needed = this.state.survivors;
        let resourceState, flagState, logMessage, notEnoughMessage;

        if (type === 'food') {
            resourceState = 'food';
            flagState = 'fedToday';
            logMessage = `Выжившие поели. Потрачено ${needed} ед. еды.`;
            notEnoughMessage = `Недостаточно еды, чтобы накормить всех. Нужно ${needed} ед.`;
        } else if (type === 'water') {
            resourceState = 'water';
            flagState = 'wateredToday';
            logMessage = `Выжившие попили. Потрачено ${needed} ед. воды.`;
            notEnoughMessage = `Недостаточно воды, чтобы напоить всех. Нужно ${needed} ед.`;
        } else {
            return;
        }

        if (this.state[flagState]) { // Уже сделали это сегодня
            this.log(`Выжившие уже ${type === 'food' ? 'ели' : 'пили'} сегодня.`, "event-neutral");
            return;
        }

        if (this.state[resourceState] >= needed) {
            this.state[resourceState] -= needed;
            this.state[flagState] = true;
            this.log(logMessage, "event-positive");
        } else {
            this.log(notEnoughMessage, "event-negative");
        }
        this.updateDisplay();
        this.saveGame();
    },

    log: function(message, type = "event-neutral") {
        const p = document.createElement('p');
        p.innerHTML = `[Д:${this.state.day}] ${message}`; // Используем innerHTML для возможности вставки тегов, если понадобится
        p.className = type;
        this.dom.logMessages.prepend(p);
        if (this.dom.logMessages.children.length > 30) {
            this.dom.logMessages.removeChild(this.dom.logMessages.lastChild);
        }
    },

    saveGame: function() {
        localStorage.setItem('zombieSurvivalGame_v2', JSON.stringify(this.state));
    },

    loadGame: function() {
        const savedGame = localStorage.getItem('zombieSurvivalGame_v2');
        if (savedGame) {
            const loadedState = JSON.parse(savedGame);
            
            // Важно: объединить загруженное состояние с текущими определениями структур,
            // чтобы новые здания из buildings.js появились, а уровни старых сохранились.
            const currentStructureKeys = Object.keys(this.state.structures);
            const loadedStructureKeys = loadedState.structures ? Object.keys(loadedState.structures) : [];

            for (const key of currentStructureKeys) {
                if (loadedState.structures && loadedState.structures[key] !== undefined) {
                    // Если в сохранении есть данные для этой структуры, берем их
                    this.state.structures[key] = loadedState.structures[key];
                }
                // Если нет, то остается значение по умолчанию из initializeStructures
            }
            // Переносим остальные части состояния
            // Проверяем каждое свойство перед присвоением, чтобы не сломать игру старым сохранением
            for (const key in this.state) {
                if (key !== 'structures' && loadedState.hasOwnProperty(key)) {
                     this.state[key] = loadedState[key];
                }
            }
            // Убедимся, что новые флаги есть, если сохранение старое
            if (this.state.fedToday === undefined) this.state.fedToday = false;
            if (this.state.wateredToday === undefined) this.state.wateredToday = false;


            this.log("Сохраненная игра загружена.", "event-discovery");
        } else {
             this.log("Сохраненная игра не найдена, начинаем новую.", "event-neutral");
        }
    },

    nextDay: function() {
        if (this.state.gameOver) return;
        if (this.state.currentEvent) {
            this.log("Вы должны сначала отреагировать на текущее событие.", "event-warning");
            return;
        }

        this.state.day++;
        this.log(`--- Наступил День ${this.state.day} ---`, "event-neutral");

        // Проверка накормленности и напоенности
        if (!this.state.fedToday) {
            this.log("Выжившие голодают! Потери неизбежны, если это продолжится.", "event-negative");
            // Пример штрафа: шанс потерять выжившего
            if (Math.random() < 0.15 * this.state.survivors) { // 15% шанс на каждого голодного
                if (this.state.survivors > 0) {
                    this.state.survivors--;
                    this.log("Один из выживших умер от голода!", "event-negative");
                    if (this.state.survivors <= 0) {
                        this.gameOver("Все выжившие погибли. Игра окончена.");
                        return;
                    }
                }
            }
        }
        if (!this.state.wateredToday) {
            this.log("Выжившие страдают от жажды! Это опасно.", "event-negative");
            if (Math.random() < 0.20 * this.state.survivors) { // 20% шанс на каждого страдающего от жажды
                 if (this.state.survivors > 0) {
                    this.state.survivors--;
                    this.log("Один из выживших умер от обезвоживания!", "event-negative");
                     if (this.state.survivors <= 0) {
                        this.gameOver("Все выжившие погибли. Игра окончена.");
                        return;
                    }
                }
            }
        }
        // Сброс флагов на следующий день
        this.state.fedToday = false;
        this.state.wateredToday = false;

        // Производство ресурсов от структур
        const foodProduced = this.foodPerDayFromStructures;
        if (foodProduced > 0) {
            this.state.food += foodProduced;
            this.log(`Постройки принесли ${foodProduced} ед. еды.`, "event-positive");
        }
        const waterProduced = this.waterPerDayFromStructures;
        if (waterProduced > 0) {
            this.state.water += waterProduced;
            this.log(`Постройки принесли ${waterProduced} ед. воды.`, "event-positive");
        }
        
        // Шанс найти нового выжившего с радиовышкой
        if (this.state.structures.radioTower && this.state.structures.radioTower.level > 0) {
            const radioDef = BASE_STRUCTURE_DEFINITIONS.radioTower;
            if (Math.random() < radioDef.effect(this.state.structures.radioTower.level).survivorChance) {
                if (this.state.survivors < this.maxSurvivors) {
                    this.state.survivors++;
                    this.log("Радиосигнал привлек нового выжившего! Он присоединяется к вам.", "event-positive");
                } else {
                    this.log("Радиосигнал привлек выжившего, но на базе нет места.", "event-neutral");
                }
            }
        }

        this.triggerRandomEvent(); // Случайные события происходят ПОСЛЕ основных проверок дня

        this.updateDisplay();
        this.updateBuildActions();
        this.saveGame();
    },

    scavenge: function() {
        if (this.state.gameOver || this.state.currentEvent) return;

        this.log("Вы отправляетесь на поиски припасов...", "event-neutral");
        // Поиск припасов теперь не приводит к автоматическому следующему дню,
        // а является действием в рамках текущего дня.
        // Но для баланса, давайте сделаем, что вылазка ТРАТИТ день (запускает nextDay в конце)
        
        let foundFood = 0;
        let foundWater = 0;
        let foundMaterials = 0;
        let foundMedicine = 0;
        let encounter = Math.random();

        const workshopLevel = this.state.structures.workshop ? this.state.structures.workshop.level : 0;
        const materialBonusFactor = workshopLevel > 0 ? BASE_STRUCTURE_DEFINITIONS.workshop.effect(workshopLevel).materialBonus : 0;

        if (encounter < 0.65) { // 65% шанс найти что-то полезное
            foundFood = Math.floor(Math.random() * 5) + 1 * this.state.survivors; // 1-5 на выжившего (но не более 15)
            foundFood = Math.min(foundFood, 15);
            foundWater = Math.floor(Math.random() * 5) + 1 * this.state.survivors; // 1-5 на выжившего (но не более 15)
            foundWater = Math.min(foundWater, 15);
            
            foundMaterials = Math.floor((Math.random() * 7) + 2); // 2-8
            foundMaterials = Math.round(foundMaterials * (1 + materialBonusFactor));


            this.state.food += foundFood;
            this.state.water += foundWater;
            this.state.materials += foundMaterials;

            let message = `Найдено: ${foundFood} еды, ${foundWater} воды, ${foundMaterials} материалов.`;

            if (Math.random() < 0.25) { // 25% шанс найти медикаменты
                foundMedicine = Math.floor(Math.random() * 2) + 1; // 1-2
                this.state.medicine += foundMedicine;
                message += ` И ${foundMedicine} медикаментов!`;
            }
            this.log(message, "event-positive");

        } else if (encounter < 0.90) { // 25% шанс наткнуться на зомби
            this.log("Вы наткнулись на группу зомби!", "event-negative");
            let lostResources = Math.random() < 0.4; 
            if (lostResources) {
                let lostFood = Math.min(this.state.food, Math.floor(Math.random() * 3 * this.state.survivors));
                let lostWater = Math.min(this.state.water, Math.floor(Math.random() * 3 * this.state.survivors));
                this.state.food -= lostFood;
                this.state.water -= lostWater;
                this.log(`Отбиваясь, вы потеряли ${lostFood} еды и ${lostWater} воды.`, "event-negative");
            } else {
                const medBayLevel = this.state.structures.medBay ? this.state.structures.medBay.level : 0;
                const medicineSaveChance = medBayLevel > 0 ? BASE_STRUCTURE_DEFINITIONS.medBay.effect(medBayLevel).medicineEfficiency : 0;

                if (this.state.medicine > 0 && (Math.random() < 0.6 || Math.random() < medicineSaveChance)) { // 60% шанс использовать + бонус от медпункта
                    if (Math.random() >= medicineSaveChance) { // Если не сработал сейв от медпункта
                        this.state.medicine--;
                         this.log("Вы получили ранение, пришлось потратить медикаменты.", "event-neutral");
                    } else {
                        this.log("Вы получили ранение, но благодаря медпункту медикаменты не понадобились!", "event-positive");
                    }
                } else if (this.state.medicine > 0) {
                     this.state.medicine--; // Все равно тратим, если не сработал сейв, но шанс был
                     this.log("Вы получили ранение, пришлось потратить медикаменты. Повезло, что они были.", "event-neutral");
                }
                else {
                    this.log("Вы получили ранение, но медикаментов нет!", "event-negative");
                    if (Math.random() < 0.25 && this.state.survivors > 0) { 
                         this.state.survivors--;
                         this.log("Один из поисковой группы не вернулся из-за тяжелого ранения...", "event-negative");
                         if (this.state.survivors <= 0) { this.gameOver("Все выжившие погибли."); return; }
                    }
                }
            }
        } else { // 10% шанс ничего не найти
            this.log("Поиски не увенчались успехом. Вы вернулись с пустыми руками.", "event-neutral");
        }
        this.nextDay(); // Вылазка занимает день
    },

    build: function(structureKey) {
        if (this.state.gameOver || this.state.currentEvent) return;

        const definition = BASE_STRUCTURE_DEFINITIONS[structureKey];
        const currentStructureState = this.state.structures[structureKey];

        if (!definition || !currentStructureState) {
            this.log("Ошибка: Неизвестная постройка.", "event-negative");
            return;
        }
        
        if (currentStructureState.level >= definition.maxLevel) {
            this.log(`${definition.name} уже максимального уровня (${definition.maxLevel}).`, "event-neutral");
            return;
        }

        const cost = getStructureUpgradeCost(structureKey, currentStructureState.level);

        let canAfford = true;
        let missingRes = [];
        for (const resource in cost) {
            if (this.state[resource] < cost[resource]) {
                canAfford = false;
                missingRes.push(`${cost[resource] - this.state[resource]} ${this.getResourceName(resource)}`);
            }
        }

        if (canAfford) {
            for (const resource in cost) {
                this.state[resource] -= cost[resource];
            }
            currentStructureState.level++;
            
            let effectMessage = `${definition.name} улучшен до уровня ${currentStructureState.level}. `;
            // Здесь можно добавить описание эффекта, если оно простое.
            // Более сложные эффекты уже обрабатываются геттерами или в nextDay.
            this.log(effectMessage, "event-positive");
            
            this.updateDisplay();
            this.updateBuildActions();
            this.saveGame();
        } else {
            this.log(`Недостаточно ресурсов для ${definition.name}. Нужно еще: ${missingRes.join(', ')}.`, "event-negative");
        }
    },
    
    getResourceName(key) { // Вспомогательная функция для имен ресурсов в сообщениях
        const names = { food: "еды", water: "воды", materials: "материалов", medicine: "медикаментов" };
        return names[key] || key;
    },

    updateBuildActions: function() {
        this.dom.buildActions.innerHTML = '<h3>Улучшения Базы:</h3>';
        for (const key in this.state.structures) {
            const definition = BASE_STRUCTURE_DEFINITIONS[key];
            const currentStructureState = this.state.structures[key];
            if (!definition) continue;

            const btn = document.createElement('button');
            let costString = "";
            let canAfford = true;
            let atMaxLevel = currentStructureState.level >= definition.maxLevel;

            if (!atMaxLevel) {
                const cost = getStructureUpgradeCost(key, currentStructureState.level);
                const costs = [];
                for (const resource in cost) {
                    costs.push(`${cost[resource]} ${this.getResourceName(resource).substring(0,3)}.`); // Сокращаем для компактности
                    if (this.state[resource] < cost[resource]) {
                        canAfford = false;
                    }
                }
                costString = costs.length > 0 ? `(${costs.join(', ')})` : "";
            } else {
                costString = "(МАКС)";
            }
            
            btn.innerHTML = `${definition.name} [${currentStructureState.level}] <small>${costString}</small>`;
            if (definition.description) {
                btn.title = definition.description; // Подсказка при наведении
            }
            btn.onclick = () => this.build(key);
            btn.disabled = !canAfford || atMaxLevel || this.state.currentEvent !== null || this.state.gameOver;

            this.dom.buildActions.appendChild(btn);
        }
    },

    possibleEvents: [ // Оставим те же, но можно адаптировать
        {
            id: "found_survivor",
            condition: () => game.state.survivors < game.maxSurvivors && Math.random() < 0.1, // Уменьшим шанс, т.к. есть радио
            text: "Вы слышите стук в ворота. Одинокий путник просит убежища.",
            choices: [
                { text: "Принять (+1 выживший)", action: () => {
                    if (game.state.survivors < game.maxSurvivors) {
                        game.state.survivors++;
                        game.log("Новый выживший присоединился к вам.", "event-positive");
                    } else {
                        game.log("На базе нет места для нового выжившего.", "event-neutral");
                    }
                }},
                { text: "Отказать", action: () => game.log("Вы отказали путнику. Он ушел в неизвестность.", "event-neutral") }
            ]
        },
        {
            id: "trader_visit",
            condition: () => Math.random() < 0.08,
            text: "К базе подошел торговец. Предлагает 5 медикаментов за 15 материалов.",
            choices: [
                { text: "Обменять (Мат.-15, Мед.+5)", action: () => {
                    if (game.state.materials >= 15) {
                        game.state.materials -= 15;
                        game.state.medicine += 5;
                        game.log("Сделка совершена.", "event-positive");
                    } else {
                        game.log("Недостаточно материалов.", "event-negative");
                    }
                }},
                { text: "Отказаться", action: () => game.log("Торговец ушел.", "event-neutral") }
            ]
        },
        {
            id: "minor_horde",
            condition: () => Math.random() < 0.1, // Чуть чаще, т.к. теперь выживание сложнее
            text: "Небольшая группа зомби замечена у периметра!",
            choices: [
                { text: "Отбиться (-3 мат., шанс потерь)", action: () => {
                    game.state.materials = Math.max(0, game.state.materials - 3);
                    game.log("Потрачены материалы на укрепление.", "event-neutral");
                    if (Math.random() < 0.15) {
                        if (game.state.survivors > 0 && game.state.medicine > 0) {
                           game.state.medicine--;
                           game.log("Один из ваших ранен, потрачены медикаменты.", "event-negative");
                        } else if (game.state.survivors > 0) {
                            game.state.survivors--;
                            game.log("Один из выживших погиб в стычке...", "event-negative");
                        }
                    } else { game.log("Атака отбита!", "event-positive"); }
                }},
                { text: "Спрятаться (шанс потерь еды/воды)", action: () => {
                     if (Math.random() < 0.3) {
                        let lostFood = Math.min(game.state.food, Math.floor(Math.random() * 8));
                        let lostWater = Math.min(game.state.water, Math.floor(Math.random() * 8));
                        game.state.food -= lostFood; game.state.water -= lostWater;
                        game.log(`Зомби стащили: ${lostFood} еды, ${lostWater} воды.`, "event-negative");
                     } else { game.log("Вы переждали, зомби ушли.", "event-neutral"); }
                }}
            ]
        }
        // Можно добавить больше событий
    ],

    triggerRandomEvent: function() {
        if (this.state.currentEvent || this.state.gameOver) return;

        const availableEvents = this.possibleEvents.filter(event => event.condition());
        if (availableEvents.length > 0) {
            this.state.currentEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            this.log(`СОБЫТИЕ: ${this.state.currentEvent.text}`, "event-discovery");
            this.displayEventChoices();
        }
    },

    displayEventChoices: function() {
        this.dom.eventActions.innerHTML = '';
        if (!this.state.currentEvent) return;

        this.state.currentEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.onclick = () => {
                choice.action();
                this.state.currentEvent = null;
                this.dom.eventActions.innerHTML = '';
                this.dom.mainActions.style.display = 'block';
                // Разблокируем кнопки еды/питья и строительства
                this.updateBuildActions(); 
                this.updateFeedDrinkStatus();
                this.updateDisplay();
                this.saveGame();
            };
            this.dom.eventActions.appendChild(btn);
        });
        this.dom.mainActions.style.display = 'none';
        // Блокируем кнопки еды/питья и строительства на время события
        this.updateBuildActions(); 
        this.updateFeedDrinkStatus();
    },

    gameOver: function(message) {
        this.log(message, "event-negative");
        this.state.gameOver = true;
        this.dom.mainActions.innerHTML = '<p style="color: #FF6666; font-weight: bold;">ИГРА ОКОНЧЕНА</p>';
        // Кнопка "Начать заново" теперь в футере
        this.dom.buildActions.innerHTML = '';
        this.dom.eventActions.innerHTML = '';
        this.updateFeedDrinkStatus(); // Заблокирует кнопки еды/питья
        localStorage.removeItem('zombieSurvivalGame_v2');
    },
    
    resetGameConfirmation: function() {
        if (confirm("Вы уверены, что хотите начать игру заново? Весь прогресс будет потерян.")) {
            this.resetGame();
        }
    },

    resetGame: function() {
        localStorage.removeItem('zombieSurvivalGame_v2'); // Очищаем сохранение
        // Сброс к начальному состоянию
        this.state.day = 1;
        this.state.survivors = 1;
        this.state.food = 20;
        this.state.water = 20;
        this.state.materials = 10;
        this.state.medicine = 5;
        this.state.gameOver = false;
        this.state.currentEvent = null;
        this.state.fedToday = false;
        this.state.wateredToday = false;
        
        this.initializeStructures(); // Это важно для сброса уровней зданий

        this.dom.mainActions.innerHTML = `
            <button onclick="game.scavenge()">Искать припасы</button>
            <button onclick="game.nextDay()">Следующий день</button>
        `;
        this.dom.logMessages.innerHTML = '';
        this.init(); // Переинициализация
        this.log("Новая игра начата.", "event-neutral");
    }
};

window.onload = () => {
    game.init();
};
