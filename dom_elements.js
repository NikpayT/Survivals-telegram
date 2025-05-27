// dom_elements.js

const domElements = {
    gameVersionDisplay: document.getElementById('game-version'),
    day: document.getElementById('day'),
    survivors: document.getElementById('survivors'),
    maxSurvivors: document.getElementById('max-survivors'),
    
    totalFoodValue: document.getElementById('total-food-value'), 
    totalWaterValue: document.getElementById('total-water-value'), 
    playerCondition: document.getElementById('player-condition'),

    healthBarInner: document.getElementById('health-bar-inner'),
    healthBarText: document.getElementById('health-bar-text'),
    hungerBarInner: document.getElementById('hunger-bar-inner'),
    hungerBarText: document.getElementById('hunger-bar-text'),
    thirstBarInner: document.getElementById('thirst-bar-inner'),
    thirstBarText: document.getElementById('thirst-bar-text'),

    logMessages: document.getElementById('log-messages'),
    buildActions: document.getElementById('build-actions'), 
    eventActionsContainer: document.getElementById('event-actions-container'), 
    eventTextDisplay: document.getElementById('event-text-display'),
    eventActions: document.getElementById('event-actions'), 
    
    inventoryButton: document.getElementById('inventory-button'), 
    inventoryModal: document.getElementById('inventory-modal'),
    inventoryItemsList: document.getElementById('inventory-items-list'),
    inventoryWeight: document.getElementById('inventory-weight'),
    inventoryMaxWeight: document.getElementById('inventory-max-weight'),
    inventoryFilters: document.querySelector('.player-inventory-filters'), // Уточнили селектор для личного инвентаря
    
    sidebar: document.getElementById('sidebar'),
    mainNav: document.getElementById('main-nav'),
    mainContent: document.getElementById('main-content'),
    mainHeader: document.getElementById('main-header'),
    tabContentArea: document.getElementById('tab-content-area'),
    
    logPanel: document.getElementById('log-panel'),
    toggleLogButton: document.getElementById('toggle-log'),

    currentLocationNameDisplay: document.getElementById('current-location-name'),
    currentLocationTimeDisplay: document.getElementById('current-location-time'),
    currentLocationDescriptionDisplay: document.getElementById('current-location-description'),
    scoutCurrentLocationButton: document.getElementById('scout-current-location-button'),
    discoverNewLocationButton: document.getElementById('discover-new-location-button'),
    discoveredLocationsList: document.getElementById('discovered-locations-list'),
    craftingRecipesContainer: document.getElementById('crafting-recipes'),
    
    // Элементы для вкладки "Склад"
    baseInventoryList: document.getElementById('base-inventory-list'), 
    baseInventoryFilters: document.querySelector('.base-storage-filters'), // Уточнили селектор для фильтров склада

    // Кнопка бургер-меню
    burgerMenuButton: document.getElementById('burger-menu-button')
};
