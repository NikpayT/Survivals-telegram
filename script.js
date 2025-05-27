const game = {
    state: {
        day: 1,
        survivors: 1,
        maxSurvivors: 5,
        food: 20,
        water: 20,
        materials: 10,
        medicine: 5,
        baseLevel: 1,
        gameOver: false,
        currentEvent: null,
        structures: {
            shelter: { level: 1, name: "Убежище", cost: { materials: 20, food: 0 }, effect: { maxSurvivors: 2 } },
            waterCollector: { level: 0, name: "Сборщик воды", cost: { materials: 15 }, effect: { waterPerDay: 3 } },
            garden: { level: 0, name: "Маленький огород", cost: { materials: 25, water: 5 }, effect: { foodPerDay: 3 } },
            workshop: { level: 0, name: "Мастерская", cost: { materials: 30 }, effect: { materialBonus: 0.1 } }, // 10% бонус к сбору материалов
            radioTower: { level: 0, name: "Радиовышка", cost: { materials: 50 }, effect: { survivorChance: 0.1 } } // 10% шанс привлечь выжившего
        }
    },

    dom: {
        day: document.getElementById('day'),
        survivors: document.getElementById('survivors'),
        maxSurvivors: document.getElementById('max-survivors'),
        food: document.getElementById('food'),
        water: document.getElementById('water'),
        materials: document.getElementById('materials'),
        medicine: document.getElementById('medicine'),
        baseLevel: document.getElementById('base-level'),
        logMessages: document.getElementById('log-messages'),
        mainActions: document.getElementById('main-actions'),
        buildActions: document.getElementById('build-actions'),
        eventActions: document.getElementById('event-actions')
    },

    init: function() {
        this.loadGame();
        this.updateDisplay();
        this.updateBuildActions();
        this.log("Игра началась. Удачи, выживший!", "event-neutral");
    },

    updateDisplay: function() {
        this.dom.day.textContent = this.state.day;
        this.dom.survivors.textContent = this.state.survivors;
        this.dom.maxSurvivors.textContent = this.state.maxSurvivors;
        this.dom.food.textContent = this.state.food;
        this.dom.water.textContent = this.state.water;
        this.dom.materials.textContent = this.state.materials;
        this.dom.medicine.textContent = this.state.medicine;
        this.dom.baseLevel.textContent = this.state.baseLevel; // Обновим для общей логики, хотя сейчас не используется прямо
    },

    log: function(message, type = "event-neutral") {
        const p = document.createElement('p');
        p.textContent = `День ${this.state.day}: ${message}`;
        p.className = type;
        this.dom.logMessages.prepend(p); // Новые сообщения сверху
        if (this.dom.logMessages.children.length > 20) { // Ограничение на кол-во сообщений
            this.dom.logMessages.removeChild(this.dom.logMessages.lastChild);
        }
    },

    saveGame: function() {
        localStorage.setItem('zombieSurvivalGame', JSON.stringify(this.state));
        console.log("Игра сохранена.");
    },

    loadGame: function() {
        const savedGame = localStorage.getItem('zombieSurvivalGame');
        if (savedGame) {
            this.state = JSON.parse(savedGame);
            // Убедимся, что все структуры определены, если сохранение старое
            if (!this.state.structures) {
                this.state.structures = { // Копипаста из initialState, можно вынести
                    shelter: { level: 1, name: "Убежище", cost: { materials: 20, food: 0 }, effect: { maxSurvivors: 2 } },
                    waterCollector: { level: 0, name: "Сборщик воды", cost: { materials: 15 }, effect: { waterPerDay: 3 } },
                    garden: { level: 0, name: "Маленький огород", cost: { materials: 25, water: 5 }, effect: { foodPerDay: 3 } },
                    workshop: { level: 0, name: "Мастерская", cost: { materials: 30 }, effect: { materialBonus: 0.1 } },
                    radioTower: { level: 0, name: "Радиовышка", cost: { materials: 50 }, effect: { survivorChance: 0.1 } }
                };
            }
            console.log("Игра загружена.");
        } else {
            console.log("Сохраненная игра не найдена, начинаем новую.");
        }
    },

    nextDay: function() {
        if (this.state.gameOver) return;
        if (this.state.currentEvent) {
            this.log("Вы должны сначала отреагировать на текущее событие.", "event-negative");
            return;
        }

        this.state.day++;
        this.log(`Наступил новый день.`, "event-neutral");

        // Потребление ресурсов
        let foodConsumed = this.state.survivors;
        let waterConsumed = this.state.survivors;

        this.state.food -= foodConsumed;
        this.state.water -= waterConsumed;
        this.log(`Выжившие съели ${foodConsumed} ед. еды и выпили ${waterConsumed} ед. воды.`, "event-neutral");

        // Производство ресурсов
        if (this.state.structures.waterCollector.level > 0) {
            const waterProduced = this.state.structures.waterCollector.effect.waterPerDay * this.state.structures.waterCollector.level;
            this.state.water += waterProduced;
            this.log(`Сборщик воды принес ${waterProduced} ед. воды.`, "event-positive");
        }
        if (this.state.structures.garden.level > 0) {
            const foodProduced = this.state.structures.garden.effect.foodPerDay * this.state.structures.garden.level;
            this.state.food += foodProduced;
            this.log(`Огород принес ${foodProduced} ед. еды.`, "event-positive");
        }


        // Проверка на конец игры
        if (this.state.food < 0) {
            this.log("Еда закончилась! Выжившие начинают голодать.", "event-negative");
            this.state.food = 0;
            // Можно добавить механику смерти от голода
            if (Math.random() < 0.3 * this.state.survivors) { // 30% шанс потерять выжившего от голода
                this.state.survivors = Math.max(0, this.state.survivors -1);
                this.log("Один из выживших умер от голода!", "event-negative");
            }
        }
        if (this.state.water < 0) {
            this.log("Вода закончилась! Выжившие страдают от жажды.", "event-negative");
            this.state.water = 0;
             if (Math.random() < 0.4 * this.state.survivors) { // 40% шанс потерять выжившего от жажды
                this.state.survivors = Math.max(0, this.state.survivors -1);
                this.log("Один из выживших умер от жажды!", "event-negative");
            }
        }

        if (this.state.survivors <= 0) {
            this.gameOver("Все выжившие погибли. Игра окончена.");
            return;
        }
        
        // Случайные события
        this.triggerRandomEvent();
        
        // Шанс найти нового выжившего с радиовышкой
        if (this.state.structures.radioTower.level > 0) {
            if (Math.random() < this.state.structures.radioTower.effect.survivorChance * this.state.structures.radioTower.level) {
                if (this.state.survivors < this.state.maxSurvivors) {
                    this.state.survivors++;
                    this.log("Радиосигнал привлек нового выжившего! Он присоединяется к вам.", "event-positive");
                } else {
                    this.log("Радиосигнал привлек выжившего, но на базе нет места.", "event-neutral");
                }
            }
        }


        this.updateDisplay();
        this.updateBuildActions(); // Обновить доступность кнопок строительства
        this.saveGame();
    },

    scavenge: function() {
        if (this.state.gameOver || this.state.currentEvent) return;

        this.log("Вы отправляетесь на поиски припасов...", "event-neutral");
        let foundFood = 0;
        let foundWater = 0;
        let foundMaterials = 0;
        let foundMedicine = 0;
        let encounter = Math.random();

        if (encounter < 0.6) { // 60% шанс найти что-то полезное
            foundFood = Math.floor(Math.random() * 6) + 1; // 1-6
            foundWater = Math.floor(Math.random() * 6) + 1; // 1-6
            let materialBonus = this.state.structures.workshop.level > 0 ? 
                                this.state.structures.workshop.effect.materialBonus * this.state.structures.workshop.level : 0;
            foundMaterials = Math.floor((Math.random() * 8) + 2) * (1 + materialBonus) ; // 2-9 + бонус
            foundMaterials = Math.round(foundMaterials);


            this.state.food += foundFood;
            this.state.water += foundWater;
            this.state.materials += foundMaterials;

            let message = `Найдено: ${foundFood} еды, ${foundWater} воды, ${foundMaterials} материалов.`;

            if (Math.random() < 0.2) { // 20% шанс найти медикаменты
                foundMedicine = Math.floor(Math.random() * 3) + 1; // 1-3
                this.state.medicine += foundMedicine;
                message += ` И ${foundMedicine} медикаментов!`;
            }
            this.log(message, "event-positive");

        } else if (encounter < 0.85) { // 25% шанс наткнуться на зомби
            this.log("Вы наткнулись на группу зомби!", "event-negative");
            let lostResources = Math.random() < 0.5; // 50% шанс потерять ресурсы или получить урон
            if (lostResources) {
                let lostFood = Math.min(this.state.food, Math.floor(Math.random() * 5));
                let lostWater = Math.min(this.state.water, Math.floor(Math.random() * 5));
                this.state.food -= lostFood;
                this.state.water -= lostWater;
                this.log(`Отбиваясь, вы потеряли ${lostFood} еды и ${lostWater} воды.`, "event-negative");
            } else {
                if (this.state.medicine > 0 && Math.random() < 0.7) {
                    this.state.medicine--;
                    this.log("Вы получили ранение, но смогли обработать его медикаментами.", "event-neutral");
                } else {
                    this.log("Вы получили ранение, но смогли уйти. Состояние ухудшилось.", "event-negative");
                    // Можно добавить механику здоровья или болезней
                    if (Math.random() < 0.2 && this.state.survivors > 1) { // 20% шанс что один из выживших серьезно ранен/погиб
                         this.state.survivors--;
                         this.log("Один из поисковой группы не вернулся...", "event-negative");
                    }
                }
            }
        } else { // 15% шанс ничего не найти
            this.log("Поиски не увенчались успехом. Вы вернулись с пустыми руками.", "event-neutral");
        }
        this.nextDay(); // Поиск припасов занимает день
    },

    build: function(structureKey) {
        if (this.state.gameOver || this.state.currentEvent) return;

        const structure = this.state.structures[structureKey];
        if (!structure) {
            this.log("Такой постройки не существует.", "event-negative");
            return;
        }
        
        // Расчет стоимости для следующего уровня
        // Для простоты, стоимость удваивается с каждым уровнем (можно сделать сложнее)
        const currentLevel = structure.level;
        const costMultiplier = Math.pow(1.8, currentLevel); // Увеличиваем стоимость на 80% за уровень
        
        const actualCost = {};
        for (const resource in structure.cost) {
            actualCost[resource] = Math.ceil(structure.cost[resource] * costMultiplier);
        }


        // Проверка ресурсов
        let canAfford = true;
        for (const resource in actualCost) {
            if (this.state[resource] < actualCost[resource]) {
                canAfford = false;
                break;
            }
        }

        if (canAfford) {
            for (const resource in actualCost) {
                this.state[resource] -= actualCost[resource];
            }
            structure.level++;
            
            let effectMessage = "";
            if (structure.effect.maxSurvivors) {
                this.state.maxSurvivors += structure.effect.maxSurvivors;
                effectMessage += ` Макс. выживших +${structure.effect.maxSurvivors}.`;
            }
            if (structure.effect.waterPerDay) {
                effectMessage += ` Сбор воды +${structure.effect.waterPerDay}/день.`;
            }
            if (structure.effect.foodPerDay) {
                effectMessage += ` Производство еды +${structure.effect.foodPerDay}/день.`;
            }
            if (structure.effect.materialBonus) {
                effectMessage += ` Бонус к сбору материалов +${structure.effect.materialBonus*100}%.`;
            }
            if (structure.effect.survivorChance) {
                effectMessage += ` Шанс найти выжившего +${structure.effect.survivorChance*100}%.`;
            }


            this.log(`Построено/улучшено: ${structure.name} (Уровень ${structure.level}).${effectMessage}`, "event-positive");
            
            // Улучшение убежища также повышает общий уровень базы (просто для примера)
            if (structureKey === 'shelter') {
                this.state.baseLevel = structure.level;
            }

            this.updateDisplay();
            this.updateBuildActions();
            this.saveGame();
        } else {
            let missing = [];
            for (const resource in actualCost) {
                if (this.state[resource] < actualCost[resource]) {
                    missing.push(`${actualCost[resource] - this.state[resource]} ${this.getResourceName(resource)}`);
                }
            }
            this.log(`Недостаточно ресурсов для ${structure.name}. Нужно еще: ${missing.join(', ')}.`, "event-negative");
        }
    },
    
    getResourceName(key) {
        const names = {
            food: "еды",
            water: "воды",
            materials: "материалов",
            medicine: "медикаментов"
        };
        return names[key] || key;
    },

    updateBuildActions: function() {
        this.dom.buildActions.innerHTML = '<h3>Улучшения Базы:</h3>'; // Очищаем и добавляем заголовок
        for (const key in this.state.structures) {
            const structure = this.state.structures[key];
            const btn = document.createElement('button');
            
            const currentLevel = structure.level;
            const costMultiplier = Math.pow(1.8, currentLevel);
            const costs = [];
            for (const resource in structure.cost) {
                if (structure.cost[resource] > 0) { // Показываем только ненулевые стоимости
                    costs.push(`${Math.ceil(structure.cost[resource] * costMultiplier)} ${this.getResourceName(resource)}`);
                }
            }
            const costString = costs.length > 0 ? `(${costs.join(', ')})` : "";

            btn.textContent = `${structure.name} (Ур. ${structure.level}) ${costString}`;
            btn.onclick = () => this.build(key);

            // Проверка, может ли игрок позволить себе это (для визуального отключения)
            let canAfford = true;
             for (const resource in structure.cost) {
                if (this.state[resource] < Math.ceil(structure.cost[resource] * costMultiplier)) {
                    canAfford = false;
                    break;
                }
            }
            btn.disabled = !canAfford || this.state.currentEvent !== null;

            this.dom.buildActions.appendChild(btn);
        }
    },

    possibleEvents: [
        {
            id: "found_survivor",
            condition: () => game.state.survivors < game.state.maxSurvivors && Math.random() < 0.15, // 15% шанс
            text: "Вы слышите стук в ворота. Одинокий путник просит убежища.",
            choices: [
                { text: "Принять (+1 выживший)", action: () => {
                    if (game.state.survivors < game.state.maxSurvivors) {
                        game.state.survivors++;
                        game.log("Новый выживший присоединился к вам.", "event-positive");
                    } else {
                        game.log("На базе нет места для нового выжившего.", "event-neutral");
                    }
                }},
                { text: "Отказать (Ничего)", action: () => game.log("Вы отказали путнику. Он ушел в неизвестность.", "event-neutral") }
            ]
        },
        {
            id: "trader_visit",
            condition: () => Math.random() < 0.1, // 10% шанс
            text: "К базе подошел торговец. Он предлагает обменять 10 материалов на 5 медикаментов.",
            choices: [
                { text: "Согласиться (Материалы -10, Медикаменты +5)", action: () => {
                    if (game.state.materials >= 10) {
                        game.state.materials -= 10;
                        game.state.medicine += 5;
                        game.log("Сделка совершена.", "event-positive");
                    } else {
                        game.log("У вас недостаточно материалов для обмена.", "event-negative");
                    }
                }},
                { text: "Отказаться", action: () => game.log("Торговец пожал плечами и ушел.", "event-neutral") }
            ]
        },
        {
            id: "minor_horde",
            condition: () => Math.random() < 0.08, // 8% шанс
            text: "Небольшая группа зомби замечена у периметра!",
            choices: [
                { text: "Отбиться (-5 материалов на ремонт, шанс потерь)", action: () => {
                    game.state.materials = Math.max(0, game.state.materials - 5);
                    game.log("Вы потратили материалы на укрепление обороны.", "event-neutral");
                    if (Math.random() < 0.2) { // 20% шанс потерь
                        if (game.state.survivors > 1 && game.state.medicine > 0) {
                           game.state.medicine--;
                           game.log("Один из ваших получил ранение, пришлось потратить медикаменты.", "event-negative");
                        } else if (game.state.survivors > 1) {
                            game.state.survivors--;
                            game.log("Один из выживших погиб в стычке...", "event-negative");
                        } else {
                            game.log("Вы чудом отбились без серьезных потерь!", "event-positive");
                        }
                    } else {
                        game.log("Атака отбита успешно!", "event-positive");
                    }
                }},
                { text: "Спрятаться (шанс потерь еды/воды)", action: () => {
                     if (Math.random() < 0.4) { // 40% шанс, что зомби что-то стащат
                        let lostFood = Math.min(game.state.food, Math.floor(Math.random() * 10));
                        let lostWater = Math.min(game.state.water, Math.floor(Math.random() * 10));
                        game.state.food -= lostFood;
                        game.state.water -= lostWater;
                        game.log(`Зомби пробрались к складам! Потеряно: ${lostFood} еды, ${lostWater} воды.`, "event-negative");
                     } else {
                        game.log("Вы переждали атаку, зомби ушли.", "event-neutral");
                     }
                }}
            ]
        },
        {
            id: "good_weather",
            condition: () => Math.random() < 0.12, // 12% шанс
            text: "Сегодня отличная погода! Это подняло всем настроение.",
            choices: [
                { text: "Воспользоваться (+5 еды, +5 воды)", action: () => {
                    game.state.food += 5;
                    game.state.water += 5;
                    game.log("Благодаря хорошей погоде удалось собрать немного больше припасов.", "event-positive");
                }}
            ]
        },
        {
            id: "discovery_cache",
            condition: () => Math.random() < 0.05, // 5% шанс
            text: "Один из выживших случайно наткнулся на небольшой тайник неподалеку от базы!",
            choices: [
                { text: "Забрать (+10 материалов, +3 медикамента)", action: () => {
                    game.state.materials += 10;
                    game.state.medicine += 3;
                    game.log("Отличная находка!", "event-discovery");
                }}
            ]
        }
    ],

    triggerRandomEvent: function() {
        if (this.state.currentEvent) return; // Не запускать новое событие, если одно уже активно

        const availableEvents = this.possibleEvents.filter(event => event.condition());
        if (availableEvents.length > 0) {
            this.state.currentEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            this.log(`СОБЫТИЕ: ${this.state.currentEvent.text}`, "event-discovery");
            this.displayEventChoices();
        }
    },

    displayEventChoices: function() {
        this.dom.eventActions.innerHTML = ''; // Очистить предыдущие кнопки событий
        if (!this.state.currentEvent) return;

        this.state.currentEvent.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.onclick = () => {
                choice.action();
                this.state.currentEvent = null;
                this.dom.eventActions.innerHTML = ''; // Очистить кнопки после выбора
                this.dom.mainActions.style.display = 'block'; // Показать основные кнопки
                this.updateBuildActions(); // Обновить доступность кнопок строительства (разблокировать)
                this.updateDisplay();
                this.saveGame();
            };
            this.dom.eventActions.appendChild(btn);
        });
        this.dom.mainActions.style.display = 'none'; // Скрыть основные кнопки на время события
        this.updateBuildActions(); // Обновить доступность кнопок строительства (заблокировать)
    },

    gameOver: function(message) {
        this.log(message, "event-negative");
        this.state.gameOver = true;
        this.dom.mainActions.innerHTML = '<p>ИГРА ОКОНЧЕНА</p><button onclick="game.resetGame()">Начать заново</button>';
        this.dom.buildActions.innerHTML = '';
        this.dom.eventActions.innerHTML = '';
        localStorage.removeItem('zombieSurvivalGame'); // Очистить сохранение
    },

    resetGame: function() {
        // Сброс к начальному состоянию
        // Это значение должно быть таким же, как начальное определение game.state
        // Чтобы избежать дублирования, можно вынести initialState в отдельный объект
        const initialState = {
            day: 1,
            survivors: 1,
            maxSurvivors: 5,
            food: 20,
            water: 20,
            materials: 10,
            medicine: 5,
            baseLevel: 1,
            gameOver: false,
            currentEvent: null,
            structures: {
                shelter: { level: 1, name: "Убежище", cost: { materials: 20, food: 0 }, effect: { maxSurvivors: 2 } }, // shelter всегда level 1 в начале
                waterCollector: { level: 0, name: "Сборщик воды", cost: { materials: 15 }, effect: { waterPerDay: 3 } },
                garden: { level: 0, name: "Маленький огород", cost: { materials: 25, water: 5 }, effect: { foodPerDay: 3 } },
                workshop: { level: 0, name: "Мастерская", cost: { materials: 30 }, effect: { materialBonus: 0.1 } },
                radioTower: { level: 0, name: "Радиовышка", cost: { materials: 50 }, effect: { survivorChance: 0.1 } }
            }
        };
        this.state = JSON.parse(JSON.stringify(initialState)); // Глубокое копирование

        this.dom.mainActions.innerHTML = `
            <button onclick="game.scavenge()">Искать припасы</button>
            <button onclick="game.nextDay()">Следующий день</button>
        `;
        this.dom.logMessages.innerHTML = ''; // Очистить лог
        this.init(); // Переинициализация (загрузит пустое сохранение и обновит все)
    }
};

// Запуск игры при загрузке страницы
window.onload = () => {
    game.init();
};
