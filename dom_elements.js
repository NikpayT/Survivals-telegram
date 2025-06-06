// dom_elements.js

// Ссылки на часто используемые DOM-элементы
const domElements = {
    // Сайдбар и статус игрока
    sidebar: document.getElementById('sidebar'),
    burgerMenuButton: document.getElementById('burger-menu-button'),
    inventoryButton: document.getElementById('inventory-button'),
    mainNav: document.getElementById('main-nav'),
    day: document.getElementById('day'),
    healthBarOuter: document.getElementById('health-bar-outer'),
    healthBarInner: document.getElementById('health-bar-inner'),
    healthBarText: document.getElementById('health-bar-text'),
    hungerBarOuter: document.getElementById('hunger-bar-outer'),
    hungerBarInner: document.getElementById('hunger-bar-inner'),
    hungerBarText: document.getElementById('hunger-bar-text'),
    thirstBarOuter: document.getElementById('thirst-bar-outer'),
    thirstBarInner: document.getElementById('thirst-bar-inner'),
    thirstBarText: document.getElementById('thirst-bar-text'),
    survivors: document.getElementById('survivors'),
    maxSurvivors: document.getElementById('max-survivors'),
    totalFoodValue: document.getElementById('total-food-value'),
    totalWaterValue: document.getElementById('total-water-value'),
    sidebarBaseCapacityUsage: document.getElementById('sidebar-base-capacity-usage'),

    // Основной контент и вкладки
    mainContent: document.getElementById('main-content'),
    mainHeader: document.getElementById('main-header'),
    playerConditionDisplay: document.getElementById('player-condition-display'),
    playerCondition: document.getElementById('player-condition'),
    tabContentArea: document.getElementById('tab-content-area'),

    // Вкладка "Обзор и События" (Main Tab)
    overviewHealth: document.getElementById('overview-health'),
    overviewHunger: document.getElementById('overview-hunger'),
    overviewThirst: document.getElementById('overview-thirst'),
    overviewCondition: document.getElementById('overview-condition'),
    overviewDay: document.getElementById('overview-day'),
    overviewSurvivors: document.getElementById('overview-survivors'),
    overviewBaseFood: document.getElementById('overview-base-food'),
    overviewBaseWater: document.getElementById('overview-base-water'),
    overviewBaseCapacityUsage: document.getElementById('overview-base-capacity-usage'), 
    baseStructuresOverviewList: document.getElementById('base-structures-overview-list'),

    // Вкладка "База" (Base Tab)
    buildActions: document.getElementById('build-actions'),
    passDayAtBaseButton: document.getElementById('pass-day-at-base-button'), 
    passDayProgressBarContainer: document.getElementById('pass-day-progress-bar-container'), 
    passDayProgressBarInner: document.getElementById('pass-day-progress-bar-inner'),     
    passDayProgressBarText: document.getElementById('pass-day-progress-bar-text'),       

    // Вкладка "Склад Базы" (Storage Tab)
    baseInventoryFilters: document.querySelector('#storage-tab .inventory-filters'),
    baseInventoryList: document.getElementById('base-inventory-list'),
    storageTabBaseCapacityUsage: document.getElementById('storage-tab-base-capacity-usage'),
    sortBaseNameButton: document.getElementById('sort-base-name'),
    sortBaseTypeButton: document.getElementById('sort-base-type'),
    sortBaseQuantityButton: document.getElementById('sort-base-quantity'),

    // Вкладка "Разведка" (Explore Tab)
    currentLocationNameDisplay: document.getElementById('current-location-name'),
    currentLocationTimeDisplay: document.getElementById('current-location-time'), 
    currentLocationDescriptionDisplay: document.getElementById('current-location-description'),
    scoutCurrentLocationButton: document.getElementById('scout-current-location-button'),
    discoveredLocationsList: document.getElementById('discovered-locations-list'),
    discoverNewLocationButton: document.getElementById('discover-new-location-button'),
    eventActionsContainer: document.getElementById('event-actions-container'),
    eventTextDisplay: document.getElementById('event-text-display'),
    eventActions: document.getElementById('event-actions'),

    // Вкладка "Крафт" (Craft Tab)
    workshopLevelDisplay: document.getElementById('workshop-level-display'),
    craftingRecipesList: document.getElementById('crafting-recipes-list'),

    // Вкладка "Читы" (Cheats Tab)
    cheatSetDayInput: document.getElementById('cheat-set-day-input'),
    cheatTriggerEventIdInput: document.getElementById('cheat-trigger-event-id-input'),

    // Панель лога
    logPanelContainer: document.getElementById('log-panel-container'),
    logPanel: document.getElementById('log-panel'),
    toggleLogButton: document.getElementById('toggle-log'),
    logMessages: document.getElementById('log-messages'),

    // Модальное окно инвентаря игрока
    inventoryModal: document.getElementById('inventory-modal'),
    inventoryWeight: document.getElementById('inventory-weight'),
    inventoryMaxWeight: document.getElementById('inventory-max-weight'),
    inventoryFilters: document.querySelector('#inventory-modal .inventory-filters'),
    inventoryItemsList: document.getElementById('inventory-items-list'),
    sortPlayerNameButton: document.getElementById('sort-player-name'),
    sortPlayerTypeButton: document.getElementById('sort-player-type'),
    sortPlayerWeightButton: document.getElementById('sort-player-weight'),

    // Модальное окно информации о локации
    locationInfoModal: document.getElementById('location-info-modal'),
    locationInfoName: document.getElementById('location-info-name'),
    locationInfoDescription: document.getElementById('location-info-description'),
    locationInfoPreviewLoot: document.getElementById('location-info-preview-loot'),
    locationInfoDanger: document.getElementById('location-info-danger'),
    locationInfoTravelButton: document.getElementById('location-info-travel-button'),
    locationInfoCloseButton: document.getElementById('location-info-close-button'),

    // НОВЫЕ ЭЛЕМЕНТЫ для модального окна сезонного события
    seasonalEventModal: document.getElementById('seasonal-event-modal'),
    seasonalEventTitle: document.getElementById('seasonal-event-title'),
    seasonalEventImageContainer: document.getElementById('seasonal-event-image-container'),
    seasonalEventText: document.getElementById('seasonal-event-text'),
    seasonalEventChoices: document.getElementById('seasonal-event-choices'),
    seasonalEventReturnBaseButton: document.getElementById('seasonal-event-return-base-button'),

    // Футер
    gameVersionDisplay: document.getElementById('game-version')
};

// Проверка на null для всех элементов
for (const key in domElements) {
    if (domElements[key] === null) { 
        const optionalKeys = [
            'cheatSetDayInput', 'cheatTriggerEventIdInput', 
            'passDayProgressBarContainer', 'passDayProgressBarInner', 'passDayProgressBarText',
            'sortBaseNameButton', 'sortBaseTypeButton', 'sortBaseQuantityButton', 
            'sortPlayerNameButton', 'sortPlayerTypeButton', 'sortPlayerWeightButton',
            // Добавляем новые элементы сезонного события в опциональные, т.к. они могут быть не всегда нужны при первой загрузке
            'seasonalEventModal', 'seasonalEventTitle', 'seasonalEventImageContainer', 
            'seasonalEventText', 'seasonalEventChoices', 'seasonalEventReturnBaseButton'
        ];
        if (!optionalKeys.includes(key)) {
             console.warn(`DOM Element not found for key: ${key}. Check ID in index.html.`);
        }
    }
}
