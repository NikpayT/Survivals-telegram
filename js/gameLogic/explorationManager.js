// js/gameLogic/explorationManager.js

class ExplorationManager {
    constructor() {
        if (window.uiManager) {
            window.uiManager.addGameLog('ExplorationManager инициализирован.');
        } else {
            console.warn('ExplorationManager: UIManager не доступен при инициализации.');
        }
    }

    /**
     * Выполняет действие исследования, запускает случайные события.
     * @param {string} currentLocationId - ID текущей сцены/локации, откуда идет исследование.
     */
    explore(currentLocationId) {
        const player = window.gameState.player;
        const community = window.gameState.community;

        if (!player || !community) {
            window.addGameLog('Ошибка: Игрок или община не инициализированы для исследования.');
            return;
        }

        // 1. Потребление ресурсов/выносливости
        const staminaCost = 20;
        const foodCost = 1;
        const waterCost = 1;

        if (!player.useStamina(staminaCost)) {
            window.addGameLog('Недостаточно выносливости для исследования!');
            return;
        }

        // Игрок тратит свою выносливость, а еда/вода могут быть взяты из общины
        let foodConsumed = false;
        if (community.hasResource('food', foodCost)) {
            community.removeResourceOrItem('food', foodCost);
            window.addGameLog(`Община потратила ${foodCost} ед. еды на исследование.`);
            foodConsumed = true;
        } else {
            // Если еды нет, игрок может почувствовать голод быстрее
            player.gainHunger(5); 
            window.addGameLog('Общине не хватает еды для похода!');
        }

        let waterConsumed = false;
        if (community.hasResource('water', waterCost)) {
            community.removeResourceOrItem('water', waterCost);
            window.addGameLog(`Община потратила ${waterCost} ед. воды на исследование.`);
            waterConsumed = true;
        } else {
            player.gainThirst(5);
            window.addGameLog('Общине не хватает воды для похода!');
        }

        window.addGameLog('Вы отправляетесь на исследование окрестностей...');

        // 2. Случайное событие
        const events = [
            'find_resources',
            'encounter_hostile',
            'find_safe_place',
            'nothing_found',
            'find_new_location' // Это будет реже
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];

        switch (randomEvent) {
            case 'find_resources':
                this.handleFindResources(player, community);
                break;
            case 'encounter_hostile':
                this.handleEncounterHostile(player, community);
                break;
            case 'find_safe_place':
                this.handleFindSafePlace(player, community);
                break;
            case 'nothing_found':
                this.handleNothingFound();
                break;
            case 'find_new_location':
                this.handleFindNewLocation(player, community);
                break;
            default:
                this.handleNothingFound();
                break;
        }
        
        // В конце исследования, всегда возвращаемся на текущую сцену (или на базу)
        // Чтобы избежать бесконечного вызова loadScene, используем currentSceneId
        // или загружаем сцену базы/убежища. Для простоты пока вернемся на текущую.
        window.loadScene(currentLocationId, false); // false, чтобы не вызывать onEnter снова
    }

    handleFindResources(player, community) {
        const scavengingSkill = player.skills.scavenging;
        const baseQuantity = 5;
        const bonusQuantity = Math.floor(baseQuantity * (scavengingSkill * 0.1)); // Бонус от навыка
        const foundQuantity = baseQuantity + bonusQuantity;

        const resourceTypes = ['food', 'water', 'materials', 'medicine'];
        const randomResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

        community.addResourceOrItem(randomResource, foundQuantity);
        window.addGameLog(`Вы успешно исследовали местность и нашли ${foundQuantity} ед. ${GameItems[randomResource].name} для общины!`);
        community.changeMorale(2); // Небольшое повышение морали
    }

    handleEncounterHostile(player, community) {
        window.addGameLog('Вы столкнулись с враждебными выжившими или мутантами!');
        // Здесь можно инициировать боевую сцену
        // Для простоты пока просто урон и падение морали
        const combatSkill = player.skills.combat;
        const damageTaken = Math.max(10, 20 - combatSkill * 2); // Меньше урона с высоким навыком
        player.takeDamage(damageTaken);
        community.changeMorale(-10); // Падение морали
        community.changeSafety(-5); // Падение безопасности
        window.addGameLog('Вам пришлось отступить, понеся потери.');
    }

    handleFindSafePlace(player, community) {
        window.addGameLog('Вы обнаружили безопасное место, где можно немного отдохнуть.');
        player.heal(10);
        player.reduceFatigue(15);
        community.changeMorale(5); // Повышение морали
        community.changeSafety(5); // Повышение безопасности
    }

    handleNothingFound() {
        window.addGameLog('Вы ничего интересного не нашли в этот раз. День прошел впустую.');
        // Могут быть небольшие штрафы за потраченное время
        // player.gainFatigue(5); // Усталость все равно накапливается
    }

    handleFindNewLocation(player, community) {
        // Здесь можно будет разблокировать новые сцены/локации
        // Пока что, для примера, просто найдем много ресурсов
        window.addGameLog('Вы обнаружили старую, заброшенную кладовую! Там много полезных вещей.');
        community.addResourceOrItem('food', 20);
        community.addResourceOrItem('water', 15);
        community.addResourceOrItem('materials', 10);
        community.changeMorale(10);
        community.changeSafety(10);
        // В будущем можно добавить логику разблокировки сцен
    }
}
