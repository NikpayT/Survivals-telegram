// /js/gameData/factions.js
// Определение фракций в игре и их изначальная репутация

const GameFactions = {
    'settlers': {
        id: 'settlers',
        name: 'Поселенцы Оазиса',
        description: 'Мирные выжившие, стремящиеся восстановить подобие порядка. Ценят сотрудничество и ресурсы.',
        initialReputation: 50, // Нейтральная репутация
        reputationThresholds: {
            hostile: 0,
            unfriendly: 20,
            neutral: 40,
            friendly: 60,
            allied: 80
        }
    },
    'raiders': {
        id: 'raiders',
        name: 'Банда "Стервятники"',
        description: 'Жестокие мародеры, живущие за счет набегов и грабежей. Опасны и непредсказуемы.',
        initialReputation: 10, // Низкая репутация, почти враждебные
        reputationThresholds: {
            hostile: 0,
            unfriendly: 20,
            neutral: 40,
            friendly: 60,
            allied: 80
        }
    },
    'cultists': {
        id: 'cultists',
        name: 'Дети Атома',
        description: 'Загадочный культ, поклоняющийся радиации и мутациям. Их мотивы неясны.',
        initialReputation: 30, // Скептическое отношение
        reputationThresholds: {
            hostile: 0,
            unfriendly: 20,
            neutral: 40,
            friendly: 60,
            allied: 80
        }
    }
    // Добавляйте новые фракции по мере расширения мира
};
