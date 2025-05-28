// seasonal_event_new_year.js

const NewYearEvent = {
    id: "newYear2024", // Уникальный ID для этого события/года, чтобы можно было обновлять в будущем
    EVENT_DAYS: [100], // Дни, когда событие может запуститься (100, 100+365, 100+365*2, ...)
    REPEAT_INTERVAL_DAYS: 365, // Повторять каждые 365 дней

    // Этапы события
    // Каждый этап: id, text (может быть функцией, чтобы быть динамическим),
    // choices: [{ text, action (функция, которая вернет nextStageId или null для завершения), condition (опционально) }]
    stages: {
        start: {
            text: () => `Приближается ${gameState.day + (365 - ((gameState.day - NewYearEvent.EVENT_DAYS[0]) % NewYearEvent.REPEAT_INTERVAL_DAYS))} день - Новый Год! Старожилы говорят, это был большой праздник до Катастрофы. Может, стоит попробовать отыскать немного былой радости и подготовиться?`,
            choices: [
                {
                    text: "Да, это отличная идея! Начнем подготовку.",
                    action: function() {
                        game.log("Вы решили устроить новогодний праздник!", "event-discovery");
                        return "find_tree_start"; // Переход на следующий этап
                    }
                },
                {
                    text: "Нет, сейчас не до праздников. Слишком опасно.",
                    action: function() {
                        game.log("Вы решили, что безопасность важнее праздника в этом году.", "event-neutral");
                        NewYearEvent.endEvent(false); // Завершить событие без успеха
                        return null; 
                    }
                }
            ]
        },
        find_tree_start: {
            text: "Первым делом нужна елка! Говорят, на старой лесной дороге можно найти подходящее деревце. Путь неблизкий и может быть опасен. Также стоит поискать припасы для праздничного стола.",
            choices: [
                {
                    text: "Отправиться на поиски елки и припасов.",
                    action: function() {
                        game.log("Вы вышли на поиски новогодней елки и угощений.", "event-neutral");
                        return "road_to_forest_1";
                    }
                },
                {
                    text: "Передумать и остаться на базе.",
                    action: function() {
                        game.log("Вы решили, что это слишком рискованно, и остались на базе.", "event-neutral");
                        NewYearEvent.endEvent(false);
                        return null;
                    }
                }
            ]
        },
        road_to_forest_1: {
            text: "Дорога к лесу пустынна, лишь ветер гоняет сухие листья. Вдалеке вы замечаете заброшенный грузовик. Похоже, он перевозил какие-то товары.",
            choices: [
                {
                    text: "Осмотреть грузовик (риск!)",
                    action: function() {
                        if (Math.random() < 0.6) {
                            game.log("В грузовике вы нашли несколько коробок с консервами и старыми гирляндами! Отличная находка!", "event-positive");
                            InventoryManager.addItemToInventory(gameState.inventory, "food_canned", [2,4]);
                            InventoryManager.addItemToInventory(gameState.inventory, "christmas_garland", 1); // Новый предмет
                            gameState.seasonalEvents.newYear.flags.found_garland = true;
                            return "road_to_forest_2";
                        } else if (Math.random() < 0.3) {
                            game.log("Грузовик оказался пуст, только ржавчина и мусор.", "event-neutral");
                            return "road_to_forest_2";
                        } else {
                            game.log("Осторожно! В грузовике притаился мутировавший пес! Вы едва унесли ноги, получив укус.", "event-negative");
                            game.takeDamage(15, "мутировавший пес у грузовика");
                            return "road_to_forest_2";
                        }
                    }
                },
                {
                    text: "Пройти мимо, не рискуя.",
                    action: function() {
                        game.log("Вы решили не рисковать и обошли грузовик стороной.", "event-neutral");
                        return "road_to_forest_2";
                    }
                }
            ]
        },
        road_to_forest_2: {
            text: () => `Вы продолжаете путь. ${gameState.seasonalEvents.newYear.flags.found_garland ? "Найденные гирлянды приятно оттягивают рюкзак." : ""} Вскоре вы добираетесь до опушки леса, где когда-то росли ели.`,
            choices: [
                {
                    text: "Искать подходящую елку.",
                    action: function() {
                        if (Math.random() < 0.7) { // Шанс найти хорошую елку
                            game.log("После недолгих поисков вы нашли идеальную пушистую ель!", "event-positive");
                            InventoryManager.addItemToInventory(gameState.inventory, "christmas_tree_item", 1); // Новый предмет
                            gameState.seasonalEvents.newYear.flags.found_tree = true;
                            return "return_journey_start";
                        } else {
                            game.log("Все елки либо слишком большие, либо обглоданы мутантами. Придется обойтись без главной красавицы в этом году.", "event-neutral");
                            gameState.seasonalEvents.newYear.flags.found_tree = false;
                            return "return_journey_start";
                        }
                    }
                }
            ]
        },
        return_journey_start: {
            text: () => `С ${gameState.seasonalEvents.newYear.flags.found_tree ? "елкой на плече" : "пустыми руками (в плане елки)"} вы отправляетесь обратно на базу.`,
            choices: [
                {
                    text: "Продолжить путь.",
                    action: function() {
                        // Здесь может быть еще одно случайное событие на обратном пути
                        // или встреча с торговцем
                        if (Math.random() < 0.3) {
                            return "trader_encounter_return";
                        }
                        return "base_arrival";
                    }
                }
            ]
        },
        trader_encounter_return: {
            text: "На обратном пути вы встречаете бродячего торговца. Он выглядит дружелюбно и предлагает обменять что-то на 'Новогодние Хлопушки'.",
            choices: [
                {
                    text: "Посмотреть товары (требуется 5 металлолома для обмена)",
                    condition: () => InventoryManager.countItemInInventory(gameState.inventory, "scrap_metal") >= 5,
                    action: function() {
                        InventoryManager.removeItemFromInventory(gameState.inventory, "scrap_metal", 5);
                        InventoryManager.addItemToInventory(gameState.inventory, "christmas_crackers", 3); // Новый предмет
                        game.log("Вы обменяли металлолом на несколько хлопушек! Праздник будет веселее!", "event-positive");
                        gameState.seasonalEvents.newYear.flags.got_crackers = true;
                        return "base_arrival";
                    }
                },
                {
                    text: "Вежливо отказаться.",
                    action: function() {
                        game.log("Вы поблагодарили торговца, но решили сэкономить ресурсы.", "event-neutral");
                        return "base_arrival";
                    }
                }
            ]
        },
        base_arrival: {
            text: () => {
                let resultText = "Вы вернулись на базу. ";
                if (gameState.seasonalEvents.newYear.flags.found_tree) {
                    resultText += "Елка установлена и ждет украшений! ";
                } else {
                    resultText += "К сожалению, елку найти не удалось. ";
                }
                if (gameState.seasonalEvents.newYear.flags.found_garland) {
                    resultText += "Гирлянды готовы осветить праздник. ";
                }
                if (gameState.seasonalEvents.newYear.flags.got_crackers) {
                    resultText += "Хлопушки добавят веселья! ";
                }
                resultText += "Пора готовиться к встрече Нового Года!";
                return resultText;
            },
            choices: [
                {
                    text: "Завершить подготовку и встретить Новый Год!",
                    action: function() {
                        NewYearEvent.endEvent(true); // Успешное завершение
                        return null;
                    }
                }
            ]
        }
        // ... Другие этапы ...
    },

    // Проверяет, наступило ли время для события
    checkForTrigger: function() {
        if (gameState.gameOver) return false;

        const currentYearCycleDay = (gameState.day - this.EVENT_DAYS[0]) % this.REPEAT_INTERVAL_DAYS;
        const isEventDay = this.EVENT_DAYS.includes(gameState.day) || (gameState.day > this.EVENT_DAYS[0] && currentYearCycleDay === 0);
        
        // Проверяем, что событие еще не было активно в этом "году"
        // Нужен флаг, который сбрасывается каждый год или при старте события
        const eventYearId = `${this.id}_year${Math.floor((gameState.day - this.EVENT_DAYS[0]) / this.REPEAT_INTERVAL_DAYS)}`;

        if (isEventDay && !gameState.flags[eventYearId]) {
            // Показываем игроку уведомление/выбор начать событие
            // Это должно быть реализовано через UIManager или game.log с последующим вызовом
            // game.log("Приближается Новый Год! Хотите начать подготовку?", "event-discovery");
            // UIManager.showSeasonalEventTriggerModal(this.id); // Пример
            // Пока что просто выводим в лог и предлагаем через стандартный confirm
            if (confirm(`[Событие] Приближается Новый Год (День ${gameState.day})! Хотите начать подготовку?`)) {
                this.startEvent();
                gameState.flags[eventYearId] = true; // Отмечаем, что событие в этом году запущено
            } else {
                game.log("Вы решили пропустить празднование Нового Года в этот раз.", "event-neutral");
                gameState.flags[eventYearId] = true; // Отмечаем, чтобы не предлагать снова в этот же день
            }
            return true;
        }
        return false;
    },

    // Инициализация и запуск события
    startEvent: function() {
        if (!gameState.seasonalEvents) gameState.seasonalEvents = {};
        gameState.seasonalEvents.newYear = {
            isActive: true,
            currentStage: "start", // Начальный этап
            flags: {} // Флаги специфичные для этого прохождения события
        };
        // Основное время игры можно "заморозить" или сделать так, чтобы действия в событии его не тратили
        // Либо каждое действие в событии будет вызывать game._processEndOfDay или его аналог.
        // Пока что считаем, что основное время заморожено.
        if (typeof UIManager !== 'undefined') UIManager.showSeasonalEventModal();
        this.renderCurrentStage();
        game.log("Началась подготовка к Новому Году!", "event-positive");
    },

    // Получение данных текущего этапа
    getCurrentStageData: function() {
        if (gameState.seasonalEvents?.newYear?.isActive && gameState.seasonalEvents.newYear.currentStage) {
            return this.stages[gameState.seasonalEvents.newYear.currentStage];
        }
        return null;
    },

    // Обработка выбора игрока
    processChoice: function(choiceIndex) {
        const currentStageData = this.getCurrentStageData();
        if (!currentStageData || !currentStageData.choices[choiceIndex]) {
            console.error("NewYearEvent.processChoice: Invalid stage or choice index.");
            return;
        }

        const choice = currentStageData.choices[choiceIndex];
        
        // Проверка условия для выбора, если есть
        if (typeof choice.condition === 'function' && !choice.condition()) {
            game.log("Вы не можете выбрать этот вариант сейчас.", "event-warning");
            this.renderCurrentStage(); // Перерисовать, чтобы обновить доступность кнопок
            return;
        }

        if (typeof choice.action === 'function') {
            const nextStageId = choice.action();
            if (nextStageId && this.stages[nextStageId]) {
                gameState.seasonalEvents.newYear.currentStage = nextStageId;
                this.renderCurrentStage();
            } else if (nextStageId === null) {
                // Событие завершено через action (например, endEvent был вызван внутри action)
            } else if (nextStageId) {
                console.error(`NewYearEvent.processChoice: Unknown nextStageId "${nextStageId}" returned by action.`);
                this.endEvent(false); // Завершаем с ошибкой
            }
        }
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Обновить основной UI на случай изменений
    },

    // Рендеринг текущего этапа в модальном окне (вызывается UIManager)
    renderCurrentStage: function() {
        if (typeof UIManager !== 'undefined') {
            UIManager.renderSeasonalEventStage();
        }
    },

    // Завершение события
    endEvent: function(isSuccess) {
        if (gameState.seasonalEvents?.newYear) {
            gameState.seasonalEvents.newYear.isActive = false;
            // gameState.seasonalEvents.newYear.currentStage = null; // Можно оставить для истории
            
            if (isSuccess) {
                game.log("Новогодние приготовления завершены! Праздник удался!", "event-positive");
                // Здесь можно выдать финальные награды, если они не были выданы по ходу
                if (gameState.seasonalEvents.newYear.flags.found_tree && gameState.seasonalEvents.newYear.flags.found_garland) {
                    InventoryManager.addItemToInventory(gameState.inventory, "new_year_spirit_buff", 1); // Уникальный бафф/предмет
                    game.log("Благодаря вашим стараниям, дух Нового Года наполнил базу!", "event-discovery");
                } else if (gameState.seasonalEvents.newYear.flags.found_tree) {
                     game.log("Елка есть, уже неплохо!", "event-neutral");
                } else {
                     game.log("Хоть и без особых атрибутов, но выжившие рады возможности отдохнуть.", "event-neutral");
                }

            } else {
                game.log("Подготовка к Новому Году прервана.", "event-neutral");
            }
        }
        if (typeof UIManager !== 'undefined') UIManager.closeSeasonalEventModal();
        if (typeof UIManager !== 'undefined') UIManager.updateDisplay(); // Обновить основной UI
        if (typeof game !== 'undefined') game.saveGame();
    },

    // Функция, которую будет вызывать game._processEndOfDay или game.init
    updateEventStateOnDayChange: function() {
        if (gameState.seasonalEvents?.newYear?.isActive) {
            // Логика, если событие активно и должен пройти день ВНУТРИ события (пока не используется)
        } else {
            this.checkForTrigger();
        }
    }
};

// Для простоты доступа из game.js, можно добавить в глобальный объект, если он используется для менеджеров
// window.NewYearEvent = NewYearEvent;
