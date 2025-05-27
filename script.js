
// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const actionButtons = document.querySelectorAll('.action-button');
    const gameMessages = document.getElementById('game-messages');
    const foodAmount = document.getElementById('food-amount');
    const waterAmount = document.getElementById('water-amount');
    const materialsAmount = document.getElementById('materials-amount');
    const populationAmount = document.getElementById('population-amount');
    const moraleAmount = document.getElementById('morale-amount');
    const securityAmount = document.getElementById('security-amount');
    const energyAmount = document.getElementById('energy-amount');
    const currentDay = document.getElementById('current-day');

    // Это временные переменные для демонстрации, потом они будут приходить с бэкенда
    let gameState = {
        day: 1,
        food: 100,
        water: 50,
        materials: 200,
        population: 10,
        morale: 80,
        security: 50,
        energy: 10
    };

    // Функция для обновления интерфейса на основе gameState
    function updateUI() {
        foodAmount.textContent = gameState.food;
        waterAmount.textContent = gameState.water;
        materialsAmount.textContent = gameState.materials;
        populationAmount.textContent = gameState.population;
        moraleAmount.textContent = `${gameState.morale}%`;
        securityAmount.textContent = `${gameState.security}%`;
        energyAmount.textContent = gameState.energy;
        currentDay.textContent = `День: ${gameState.day}`;
        // Здесь можно было бы очищать и добавлять новые сообщения, но пока просто добавляем
        // gameMessages.innerHTML = `<p>${gameState.message || 'Ожидание действий...'}</p>`;
    }

    // Обработчик для всех кнопок действий
    actionButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const action = event.target.dataset.action; // Получаем значение data-action
            let message = '';

            // В реальной игре здесь будет отправка запроса на бэкенд
            // fetch('/api/do_action', { method: 'POST', body: JSON.stringify({ action: action }) })
            // .then(response => response.json())
            // .then(data => {
            //     gameState = data.new_state; // Обновляем состояние из ответа бэкенда
            //     updateUI(); // Обновляем интерфейс
            //     gameMessages.innerHTML = `<p>${data.message}</p>`; // Показываем сообщение
            // });

            // Демонстрация изменения состояния и сообщений (пока без бэкенда)
            switch(action) {
                case 'explore':
                    message = "Ваши выжившие отправились на разведку... День прошел.";
                    gameState.food -= 5;
                    gameState.water -= 2;
                    gameState.day++;
                    break;
                case 'build':
                    message = "Вы решили сосредоточиться на строительстве. Это займет время.";
                    gameState.materials -= 10;
                    gameState.population -= 1; // Уменьшим население на строительстве
                    gameState.day++;
                    break;
                case 'manage':
                    message = "Вы перераспределяете задачи и повышаете мораль.";
                    gameState.morale += 5;
                    gameState.day++;
                    break;
                case 'trade':
                    message = "Вы отправляете посланника на переговоры с другой фракцией.";
                    gameState.day++;
                    break;
                default:
                    message = `Неизвестное действие: ${action}`;
            }

            // Добавляем новое сообщение в конец
            gameMessages.innerHTML += `<p><b>> ${message}</b></p>`;
            gameMessages.scrollTop = gameMessages.scrollHeight; // Прокручиваем вниз
            
            updateUI(); // Обновляем UI после действия
        });
    });

    // Инициализация UI при загрузке
    updateUI();
});
