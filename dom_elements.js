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
    baseStructuresOverviewList: document.getElementById('base-structures-overview-list'),

    // Вкладка "База" (Base Tab)
    buildActions: document.getElementById('build-actions'),
    passDayAtBaseButton: document.getElementById('pass-day-at-base-button'), // НОВАЯ КНОПКА
    passDayProgressBarContainer: document.getElementById('pass-day-progress-bar-container'), // НОВЫЙ ЭЛЕМЕНТ
    passDayProgressBarInner: document.getElementById('pass-day-progress-bar-inner'),     // НОВЫЙ ЭЛЕМЕНТ
    passDayProgressBarText: document.getElementById('pass-day-progress-bar-text'),       // НОВЫЙ ЭЛЕМЕНТ


    // Вкладка "Склад Базы" (Storage Tab)
    baseInventoryFilters: document.querySelector('#storage-tab .inventory-filters'),
    baseInventoryList: document.getElementById('base-inventory-list'),

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

    // Модальное окно информации о локации
    locationInfoModal: document.getElementById('location-info-modal'),
    locationInfoName: document.getElementById('location-info-name'),
    locationInfoDescription: document.getElementById('location-info-description'),
    locationInfoPreviewLoot: document.getElementById('location-info-preview-loot'),
    locationInfoDanger: document.getElementById('location-info-danger'),
    locationInfoTravelButton: document.getElementById('location-info-travel-button'),
    locationInfoCloseButton: document.getElementById('location-info-close-button'),

    // Футер
    gameVersionDisplay: document.getElementById('game-version')
};

// Проверка на null для всех элементов
for (const key in domElements) {
    if (domElements[key] === null) { 
        // Исключаем инпуты читов и новые элементы прогресс-бара, т.к. вкладка/элемент может быть не активен при старте
        if (key !== 'cheatSetDayInput' && key !== 'cheatTriggerEventIdInput' && 
            key !== 'passDayProgressBarContainer' && key !== 'passDayProgressBarInner' && key !== 'passDayProgressBarText') {
             console.warn(`DOM Element not found for key: ${key}. Check ID in index.html.`);
        }
    }
}
// Для инпутов читов и новых элементов прогресс-бара отдельная проверка
if (!domElements.cheatSetDayInput) console.warn("DOM Element #cheat-set-day-input not found (Cheats Tab).");
if (!domElements.cheatTriggerEventIdInput) console.warn("DOM Element #cheat-trigger-event-id-input not found (Cheats Tab).");
if (!domElements.passDayAtBaseButton) console.warn("DOM Element #pass-day-at-base-button not found (Base Tab).");
if (!domElements.passDayProgressBarContainer) console.warn("DOM Element #pass-day-progress-bar-container not found (Base Tab).");
if (!domElements.passDayProgressBarInner) console.warn("DOM Element #pass-day-progress-bar-inner not found (Base Tab).");
if (!domElements.passDayProgressBarText) console.warn("DOM Element #pass-day-progress-bar-text not found (Base Tab).");
