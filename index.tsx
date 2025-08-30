/**
 * @license
 * Copyright (c) 2024 Your Company or Name. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * =================================================================================
 * INTELLECTUAL PROPERTY NOTICE:
 *
 * In a real-world production environment, the code in this file would be
 * minified and obfuscated as part of a build process (e.g., using Vite or
 * Webpack). This process makes the code extremely difficult for others to read
 * and reverse-engineer, thus protecting your intellectual property.
 * =================================================================================
 *
 * =================================================================================
 * API KEY SECURITY:
 *
 * The API key is accessed via `process.env.API_KEY`. This is a secure practice.
 * The key is stored as an environment variable on the server where the code is
 * built and hosted. It is NEVER hardcoded here and is NOT exposed to the public.
 * =================================================================================
 */


// Fix: Replaced incorrect `FunctionDeclarationTool` with `Tool` and added `Type` for schema definitions.
import { GoogleGenAI, Tool, Type, GenerateContentResponse } from "@google/genai";

// Fix: To resolve "Cannot find namespace 'L'", declare the namespace for Leaflet types.
declare namespace L {
    type Map = any;
    type GeoJSON = any;
    type TileLayer = any;
    type FeatureGroup = any;
    type Marker = any;
    type Polyline = any;
    type LatLng = any;
    type LatLngBounds = any;
    // Fix: Add missing DivIcon type to Leaflet namespace declaration.
    type DivIcon = any;
}
declare var L: any;
// Web Speech API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// =================================================================================
// ARCHITECTURE REFACTOR: "Backend-Ready" API Simulation
// =================================================================================
const api = {
    // In a real backend, this would fetch your DoR GeoJSON shapefile.
    getRoads: async (): Promise<any> => {
        console.log("API: Fetching road data...");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return Promise.resolve({
            "type": "FeatureCollection", "features": [
                { "type": "Feature", "properties": { "name": "Araniko Highway", "status": "good" }, "geometry": { "type": "LineString", "coordinates": [[85.3, 27.7], [85.4, 27.75], [85.5, 27.7]] } },
                { "type": "Feature", "properties": { "name": "Prithvi Highway", "status": "fair" }, "geometry": { "type": "LineString", "coordinates": [[84.4, 27.7], [84.8, 27.65], [85.3, 27.7]] } },
                { "type": "Feature", "properties": { "name": "Local Road", "status": "poor" }, "geometry": { "type": "LineString", "coordinates": [[85.32, 27.68], [85.35, 27.69], [85.34, 27.66]] } },
                { "type": "Feature", "properties": { "name": "Ring Road", "status": "good" }, "geometry": { "type": "LineString", "coordinates": [[85.316, 27.691], [85.300, 27.680], [85.310, 27.670], [85.322, 27.693]] } }
            ]
        });
    },
    getPOIs: async (): Promise<any[]> => {
        console.log("API: Fetching POIs...");
        await new Promise(resolve => setTimeout(resolve, 300));
        return Promise.resolve([
            { id: 1, name: "Maitighar Mandala", lat: 27.693, lng: 85.322, type: 'poi', status_key: 'status_good_condition', category: 'landmark' },
            { id: 2, name: "Thapathali Bridge", lat: 27.691, lng: 85.316, type: 'bridge', status_key: 'status_maintenance', category: 'bridge' },
            { id: 5, name: "Patan Hospital", lat: 27.671, lng: 85.318, type: 'poi', status_key: 'status_open_247', category: 'hospital' },
            { id: 6, name: "Himalayan Java Coffee", lat: 27.695, lng: 85.320, type: 'poi', status_key: 'status_open', category: 'coffee' },
            { id: 7, name: "Civil Mall", lat: 27.699, lng: 85.314, type: 'poi', status_key: 'status_open', category: 'shopping' },
            { id: 8, name: "Bota Restaurant", lat: 27.701, lng: 85.315, type: 'poi', status_key: 'status_open', category: 'restaurant' },
            { id: 9, name: "Nabil Bank ATM", lat: 27.692, lng: 85.318, type: 'poi', status_key: 'status_open_247', category: 'atm' },
            { id: 10, name: "Sajha Petrol Pump", lat: 27.675, lng: 85.319, type: 'poi', status_key: 'status_open', category: 'fuel' },
            { id: 11, name: "Police Station, Jawalakhel", lat: 27.674, lng: 85.311, type: 'poi', status_key: 'status_open_247', category: 'police' }
        ]);
    },
    getIncidents: async (): Promise<any[]> => {
        console.log("API: Fetching Incidents...");
        await new Promise(resolve => setTimeout(resolve, 100));
        return Promise.resolve([
             { id: 3, name: "Traffic Jam at Baneshwor", lat: 27.693, lng: 85.341, type: 'incident', status_key: 'status_incident', category: 'traffic' },
             { id: 4, name: "Road construction", lat: 27.685, lng: 85.320, type: 'incident', status_key: 'status_incident', category: 'construction' }
        ]);
    }
};

// =================================================================================
// App State & Configuration
// =================================================================================
let map: L.Map;
let roadsLayer: L.GeoJSON;
let poisLayer: L.FeatureGroup;
let incidentsLayer: L.FeatureGroup;
let userMarker: L.Marker;
let routeLine: L.Polyline | null = null;
let routeStartMarker: L.Marker | null = null;
let routeEndMarker: L.Marker | null = null;
let currentLang = 'en';
let allPois: any[] = [];
let allIncidents: any[] = [];
let allRoadsData: any = null;
let isVoiceResponseEnabled = true; // State for AI voice response feature
let isAudioUnlocked = false; // Flag to check if user interaction has occurred
let activeChat: any = null; // To hold the AI chat session
let currentAppMode: 'driving' | 'riding' | 'exploring' | 'connect' = 'driving';
let currentAlertMessageKey: string | null = null;
let routePreferences = {
    preferHighways: false,
    avoidTolls: false,
    preferScenic: false
};
let recognition: any | null = null;
let isListening = false;
let baseLayers: { [key: string]: L.TileLayer } = {};
let currentBaseLayer: L.TileLayer | null = null;
let lastLightBaseLayer = 'streets'; // To remember the last used light theme map
let cameraStream: MediaStream | null = null;
let isFrontCamera = false; // For the new Live Cam feature


// =================================================================================
// Internationalization (i18n)
// =================================================================================
const englishTranslations = {
    app_subtitle: "Your Smart Road Companion",
    gps_searching: "GPS Status: Searching...",
    profile: "Profile",
    alert_ask_ai: "Ask AI",
    alert_dismiss: "Dismiss Alert",
    route_preferences: "Route Preferences",
    prefer_highways: "Prefer Highways",
    avoid_tolls: "Avoid Tolls",
    prefer_scenic_route: "Prefer Scenic Route",
    app_settings: "App Settings",
    language: "Language",
    dark_mode: "Dark Mode",
    toggle_dark_mode: "Toggle dark mode",
    ai_voice_response: "AI Voice Response",
    layers: "Data Layers",
    roads: "Roads",
    pois: "Points of Interest",
    incidents: "Incidents",
    center_location: "Center on my location",
    display_panel_title: "Nearby Information",
    no_items_found: "No items found.",
    route_finder: "Route Finder",
    from: "From",
    from_placeholder: "Start location",
    to: "To",
    to_placeholder: "Destination",
    find_route_btn: "Find Optimal Route",
    calculating_route: "Calculating...",
    share_route: "Share Route",
    clear_route_btn: "Clear Route",
    ai_chat_title: "AI Assistant",
    ai_chat_placeholder: "Type a message...",
    close_chat: "Close Chat",
    use_microphone: "Use microphone",
    stop_listening: "Stop listening",
    send_message: "Send Message",
    select_mode: "Select Mode",
    mode_driving: "Driving",
    mode_riding: "Riding",
    mode_exploring: "Exploring",
    mode_connect: "Connect",
    close: "Close",
    error_both_locations: "Please enter both a start and destination.",
    error_location_not_found: "Could not find one or both locations. Please use exact names from the list.",
    error_no_route: "The AI could not determine a route. Please try different locations or preferences.",
    error_no_geometry: "Could not find geometric data for the suggested route. Please check the data source.",
    error_generic_route: "An error occurred while finding the route. Please try again.",
    route_success_message: "Route from {fromName} to {toName} displayed.",
    route_start: "Start",
    route_destination: "Destination",
    status_good_condition: "Good condition",
    status_maintenance: "Under maintenance",
    status_open_247: "Open 24/7",
    status_open: "Open",
    status_incident: "Incident",
    fuel_low_alert: "Fuel level is critically low. I can search for nearby petrol stations.",
    pressure_low_alert: "Tire pressure is low. I can find the nearest repair shop for you.",
    planning_route: "Okay, planning a route from {start} to {end}.",
    ai_connection_error: "Sorry, I'm having trouble connecting right now.",
    map_style_streets: "Streets",
    map_style_satellite: "Satellite",
    map_style_terrain: "Terrain",
    map_style_dark: "Dark",
    lang_cat_international: "International",
    lang_cat_nepali: "Nepali",
};

const nepaliTranslations = {
    app_subtitle: "तपाईंको स्मार्ट रोड साथी",
    gps_searching: "GPS स्थिति: खोजी गर्दै...",
    profile: "प्रोफाइल",
    alert_ask_ai: "AI लाई सोध्नुहोस्",
    alert_dismiss: "खारेज गर्नुहोस्",
    route_preferences: "मार्ग प्राथमिकताहरू",
    prefer_highways: "राजमार्गहरू प्राथमिकता दिनुहोस्",
    avoid_tolls: "टोलहरू बेवास्ता गर्नुहोस्",
    prefer_scenic_route: "रमणीय मार्ग प्राथमिकता दिनुहोस्",
    app_settings: "एप सेटिङहरू",
    language: "भाषा",
    dark_mode: "डार्क मोड",
    toggle_dark_mode: "डार्क मोड टगल गर्नुहोस्",
    ai_voice_response: "एआई आवाज प्रतिक्रिया",
    layers: "डाटा तहहरू",
    roads: "सडकहरू",
    pois: "चासोका ठाउँहरू",
    incidents: "घटनाहरू",
    center_location: "मेरो स्थानमा केन्द्रित गर्नुहोस्",
    display_panel_title: "नजिकैको जानकारी",
    no_items_found: "कुनै वस्तु फेला परेन।",
    route_finder: "मार्ग खोजकर्ता",
    from: "बाट",
    from_placeholder: "सुरु स्थान",
    to: "सम्म",
    to_placeholder: "गन्तव्य",
    find_route_btn: "उत्तम मार्ग खोज्नुहोस्",
    calculating_route: "गणना गर्दै...",
    share_route: "मार्ग साझा गर्नुहोस्",
    clear_route_btn: "मार्ग हटाउनुहोस्",
    ai_chat_title: "एआई सहायक",
    ai_chat_placeholder: "सन्देश टाइप गर्नुहोस्...",
    close_chat: "च्याट बन्द गर्नुहोस्",
    use_microphone: "माइक्रोफोन प्रयोग गर्नुहोस्",
    stop_listening: "सुन्न बन्द गर्नुहोस्",
    send_message: "सन्देश पठाउनुहोस्",
    select_mode: "मोड चयन गर्नुहोस्",
    mode_driving: "ड्राइभिङ",
    mode_riding: "राइडिङ",
    mode_exploring: "अन्वेषण",
    mode_connect: "जडान",
    close: "बन्द गर्नुहोस्",
    error_both_locations: "कृपया सुरु र गन्तव्य दुवै स्थानहरू प्रविष्ट गर्नुहोस्।",
    error_location_not_found: "एक वा दुबै स्थानहरू फेला पार्न सकिएन। कृपया सूचीबाट सही नामहरू प्रयोग गर्नुहोस्।",
    error_no_route: "एआईले मार्ग निर्धारण गर्न सकेन। कृपया फरक स्थानहरू वा प्राथमिकताहरू प्रयास गर्नुहोस्।",
    error_no_geometry: "सुझाव गरिएको मार्गको लागि ज्यामितीय डाटा फेला पार्न सकिएन। कृपया डाटा स्रोत जाँच गर्नुहोस्।",
    error_generic_route: "मार्ग खोज्दा त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।",
    route_success_message: "{fromName} देखि {toName} सम्मको मार्ग देखाइयो।",
    route_start: "सुरु",
    route_destination: "गन्तव्य",
    status_good_condition: "राम्रो अवस्था",
    status_maintenance: "मर्मत अन्तर्गत",
    status_open_247: "२४/७ खुला",
    status_open: "खुला",
    status_incident: "घटना",
    fuel_low_alert: "इन्धनको स्तर एकदमै कम छ। म नजिकैको पेट्रोल स्टेशनहरू खोज्न सक्छु।",
    pressure_low_alert: "टायर प्रेसर कम छ। म तपाईंको लागि नजिकैको मर्मत पसल फेला पार्न सक्छु।",
    planning_route: "ठीक छ, {start} देखि {end} सम्मको मार्ग योजना गर्दै।",
    ai_connection_error: "माफ गर्नुहोस्, मलाई अहिले जडान गर्न समस्या भइरहेको छ।",
    map_style_streets: "सडकहरू",
    map_style_satellite: "स्याटेलाइट",
    map_style_terrain: "भू-भाग",
    map_style_dark: "डार्क",
    lang_cat_international: "अन्तर्राष्ट्रिय",
    lang_cat_nepali: "नेपाली",
};

const translations: { [key: string]: any } = {
    en: englishTranslations,
    np: nepaliTranslations,
    hi: englishTranslations, // Placeholder
    es: englishTranslations,
    fr: englishTranslations,
    de: englishTranslations,
    pt: englishTranslations,
    it: englishTranslations,
    nl: englishTranslations,
    ru: englishTranslations,
    ar: englishTranslations,
    zh: englishTranslations,
    ja: englishTranslations,
    ko: englishTranslations,
    id: englishTranslations,
    tr: englishTranslations,
    vi: englishTranslations,
    th: englishTranslations,
    mai: nepaliTranslations,
    bho: nepaliTranslations,
    thr: nepaliTranslations,
    taj: nepaliTranslations,
    new: nepaliTranslations,
    mag: nepaliTranslations,
    rai: nepaliTranslations,
    lif: nepaliTranslations,
    gvr: nepaliTranslations,
    xsr: nepaliTranslations
};

const synthesisLangCodeMap: { [key: string]: string } = {
    en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR',
    de: 'de-DE', pt: 'pt-BR', it: 'it-IT', nl: 'nl-NL', ru: 'ru-RU',
    ar: 'ar-SA', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', id: 'id-ID',
    tr: 'tr-TR', vi: 'vi-VN', th: 'th-TH', mai: 'hi-IN', bho: 'hi-IN',
    thr: 'ne-NP', taj: 'ne-NP', new: 'ne-NP', mag: 'ne-NP', rai: 'ne-NP',
    lif: 'ne-NP', gvr: 'ne-NP', xsr: 'ne-NP'
};

const recognitionLangCodeMap: { [key: string]: string } = {
    ...synthesisLangCodeMap
};


/**
 * Translates a key into the current language.
 * @param key The key to translate.
 * @param replacements An object of replacements for placeholders.
 * @returns The translated string.
 */
function translate(key: string, replacements: { [key: string]: string } = {}): string {
    let text = translations[currentLang]?.[key] || translations['en'][key] || key;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
}

/**
 * Updates all UI text based on the current language.
 */
function updateUIText() {
    console.log(`Updating UI text for language: ${currentLang}`);
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key')!;
        (element as HTMLElement).innerText = translate(key);
    });
    document.querySelectorAll('[data-lang-key-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-key-placeholder')!;
        (element as HTMLInputElement).placeholder = translate(key);
    });
    document.querySelectorAll('[data-lang-key-title]').forEach(element => {
        const key = element.getAttribute('data-lang-key-title')!;
        (element as HTMLElement).title = translate(key);
    });
    document.querySelectorAll('[data-lang-key-aria-label]').forEach(element => {
        const key = element.getAttribute('data-lang-key-aria-label')!;
        element.setAttribute('aria-label', translate(key));
    });

    // Special case for the active mode button label
    const appModeBtnLabel = document.querySelector('#app-mode-btn .label');
    if (appModeBtnLabel) {
        const modeKey = `mode_${currentAppMode}`;
        appModeBtnLabel.setAttribute('data-lang-key', modeKey);
        appModeBtnLabel.textContent = translate(modeKey);
    }
}

/**
 * Changes the application's language.
 * @param langCode The language code to switch to.
 */
function changeLanguage(langCode: string) {
    if (translations[langCode]) {
        currentLang = langCode;
        document.documentElement.lang = langCode;
        localStorage.setItem('preferredLang', langCode);
        console.log(`Language changed to ${langCode}`);

        // Update active class on language options
        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === langCode);
        });

        updateUIText();
        // Re-initialize the AI with the new language context
        initAI();
    }
}


// =================================================================================
// Map Initialization & Functions
// =================================================================================
function initMap() {
    map = L.map('map', {
        center: [27.7172, 85.3240], // Kathmandu
        zoom: 13,
        zoomControl: false // We are using custom controls
    });

    baseLayers = {
        'streets': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        'satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }),
        'terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        }),
        'dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        })
    };

    currentBaseLayer = baseLayers['streets'];
    currentBaseLayer.addTo(map);

    poisLayer = L.featureGroup().addTo(map);
    incidentsLayer = L.featureGroup().addTo(map);
    roadsLayer = L.geoJSON(undefined, {
        style: (feature) => {
            switch (feature?.properties.status) {
                case 'good': return { color: "#2ecc71", weight: 4, opacity: 0.8 };
                case 'fair': return { color: "#f1c40f", weight: 4, opacity: 0.8 };
                case 'poor': return { color: "#e74c3c", weight: 4, opacity: 0.8, dashArray: '5, 5' };
                default: return { color: "#3498db" };
            }
        },
        onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.name) {
                const popupContent = `
                    <div class="popup-title">${feature.properties.name}</div>
                    <div class="popup-details">Status: ${feature.properties.status}</div>
                `;
                layer.bindPopup(popupContent);
            }
        }
    }).addTo(map);

    updateUserLocation();
}

function updateUserLocation() {
    const gpsIndicator = document.getElementById('gps-status-indicator')!;
    gpsIndicator.classList.add('searching');

    navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        const latLng: L.LatLng = L.latLng(latitude, longitude);

        if (userMarker) {
            userMarker.setLatLng(latLng);
        } else {
            const userIcon = L.divIcon({
                html: `<span class="material-icons">navigation</span>`,
                className: 'user-marker-icon',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });
            userMarker = L.marker(latLng, { icon: userIcon }).addTo(map);
        }

        gpsIndicator.classList.remove('searching', 'lost');
        gpsIndicator.classList.add('connected');

        if (!map.getBounds().contains(latLng)) {
            map.panTo(latLng);
        }
    }, error => {
        console.error("Geolocation error:", error);
        gpsIndicator.classList.remove('searching', 'connected');
        gpsIndicator.classList.add('lost');
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}

// =================================================================================
// Data Fetching and Display
// =================================================================================

async function fetchAndDisplayData() {
    try {
        const [roads, pois, incidents] = await Promise.all([
            api.getRoads(),
            api.getPOIs(),
            api.getIncidents()
        ]);
        
        allRoadsData = roads;
        allPois = pois;
        allIncidents = incidents;

        roadsLayer.clearLayers().addData(roads);
        
        updateDisplayedItems(); // Initial display with all items

        // Populate route finder datalist
        const datalist = document.getElementById('locations-datalist') as HTMLDataListElement;
        datalist.innerHTML = ''; // Clear previous options
        const allLocations = [...allPois, ...allIncidents];
        const locationNames = new Set(allLocations.map(item => item.name));
        locationNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            datalist.appendChild(option);
        });

        setupDynamicFilters();

    } catch (error) {
        console.error("Failed to fetch map data:", error);
    }
}

function setupDynamicFilters() {
    const filtersContainer = document.getElementById('display-panel-filters')!;
    const allItems = [...allPois, ...allIncidents];
    const categories = new Set(allItems.map(item => item.category));

    let filterButtonsHTML = `<button class="filter-btn active" data-filter="all" title="All"><span class="material-icons">apps</span></button>`;

    const categoryIcons: { [key: string]: string } = {
        'landmark': 'account_balance', 'bridge': 'emergency', 'hospital': 'local_hospital',
        'coffee': 'local_cafe', 'shopping': 'shopping_cart', 'traffic': 'traffic',
        'construction': 'construction', 'restaurant': 'restaurant', 'atm': 'atm',
        'fuel': 'local_gas_station', 'police': 'local_police', 'poi': 'place', 'incident': 'warning'
    };

    categories.forEach(category => {
        const icon = categoryIcons[category] || 'place';
        const title = category.charAt(0).toUpperCase() + category.slice(1);
        filterButtonsHTML += `<button class="filter-btn" data-filter="${category}" title="${title}"><span class="material-icons">${icon}</span></button>`;
    });

    filtersContainer.innerHTML = filterButtonsHTML;

    filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filtersContainer.querySelector('.filter-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter')!;
            filterAndDisplayItems(filter);
        });
    });
}


function updateDisplayedItems() {
    poisLayer.clearLayers();
    incidentsLayer.clearLayers();

    const allItems = [...allPois, ...allIncidents];

    allItems.forEach(item => {
        const icon = createMapIcon(item.category);
        const marker = L.marker([item.lat, item.lng], { icon: icon });
        
        const popupContent = `
            <div class="popup-title">${item.name}</div>
            <div class="popup-details">${translate(item.status_key)}</div>
            <button class="popup-directions-btn" data-name="${item.name}">
                <span class="material-icons">directions</span>
                Get Directions
            </button>
        `;
        marker.bindPopup(popupContent);
        
        // Associate item ID with the marker's DOM element for highlighting
        marker.on('add', () => {
            marker.getElement().dataset.itemId = item.id;
        });

        if (item.type === 'poi' || item.type === 'bridge') {
            poisLayer.addLayer(marker);
        } else if (item.type === 'incident') {
            incidentsLayer.addLayer(marker);
        }
    });

    filterAndDisplayItems('all'); // Display all items initially
}

function filterAndDisplayItems(filter: string) {
    const listElement = document.getElementById('display-panel-list')!;
    listElement.innerHTML = '';

    const itemsToShow = (filter === 'all')
        ? [...allPois, ...allIncidents]
        : [...allPois, ...allIncidents].filter(item => item.category === filter);

    if (itemsToShow.length === 0) {
        listElement.innerHTML = `<p style="padding: 1rem; text-align: center;">${translate('no_items_found')}</p>`;
        return;
    }
    
    // Sort alphabetically by name
    itemsToShow.sort((a, b) => a.name.localeCompare(b.name));

    itemsToShow.forEach(item => {
        const card = document.createElement('div');
        card.className = 'info-card';
        card.dataset.itemId = String(item.id);
        card.innerHTML = `
            <h3>${item.name}</h3>
            <p>${translate(item.status_key)}</p>
        `;
        card.addEventListener('click', () => panToItem(item));
        
        // Add hover listeners for highlighting
        card.addEventListener('mouseenter', () => highlightMarker(item.id, true));
        card.addEventListener('mouseleave', () => highlightMarker(item.id, false));
        
        listElement.appendChild(card);
    });
}

function highlightMarker(itemId: number, shouldHighlight: boolean) {
    const markerElement = document.querySelector(`.leaflet-marker-icon[data-item-id="${itemId}"]`) as HTMLElement;
    if (markerElement) {
        markerElement.classList.toggle('map-marker-highlight', shouldHighlight);
    }
}


function panToItem(item: any) {
    map.flyTo([item.lat, item.lng], 16);
    // Find the corresponding marker and open its popup
    const targetLayer = (item.type === 'poi' || item.type === 'bridge') ? poisLayer : incidentsLayer;
    targetLayer.eachLayer((layer: any) => {
        if (layer.getLatLng().lat === item.lat && layer.getLatLng().lng === item.lng) {
            // A short delay ensures the flyTo animation is smooth before the popup opens
            setTimeout(() => {
                 layer.openPopup();
            }, 300);
        }
    });
}

function createMapIcon(category: string): L.DivIcon {
    const icons: { [key: string]: string } = {
        'landmark': 'account_balance', 'bridge': 'emergency', 'hospital': 'local_hospital',
        'coffee': 'local_cafe', 'shopping': 'shopping_cart', 'traffic': 'traffic',
        'construction': 'construction', 'restaurant': 'restaurant', 'atm': 'atm',
        'fuel': 'local_gas_station', 'police': 'local_police', 'default': 'place'
    };
    const colors: { [key: string]: string } = {
        'landmark': '#9b59b6', 'bridge': '#e74c3c', 'hospital': '#c0392b',
        'coffee': '#e67e22', 'shopping': '#3498db', 'traffic': '#f39c12',
        'construction': '#f1c40f', 'restaurant': '#16a085', 'atm': '#27ae60',
        'fuel': '#2c3e50', 'police': '#2980b9', 'default': '#7f8c8d'
    };
    const iconName = icons[category] || icons['default'];
    const iconColor = colors[category] || colors['default'];

    const html = `
        <div class="icon-background" style="background-color: ${iconColor};">
            <span class="material-icons">${iconName}</span>
        </div>
    `;

    return L.divIcon({
        html: html,
        className: 'custom-map-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38]
    });
}

// =================================================================================
// AI & Persona Functions
// =================================================================================
function loadPersona() {
    const avatarPreview = document.getElementById('persona-avatar-preview') as HTMLImageElement;
    const nameInput = document.getElementById('persona-name-input') as HTMLInputElement;
    const descInput = document.getElementById('persona-desc-input') as HTMLTextAreaElement;
    const chatAvatar = document.getElementById('chat-ai-avatar') as HTMLImageElement;
    const chatName = document.getElementById('chat-ai-name') as HTMLElement;

    const savedAvatar = localStorage.getItem('aiAvatar');
    const savedName = localStorage.getItem('aiName') || 'Sadak Sathi';
    const savedDesc = localStorage.getItem('aiPersonaDesc') || `You are a warm, knowledgeable, and slightly formal AI assistant, modeled after a caring French father in his 50s showing his family around a new country. Your name is Jean-Pierre. You are patient, protective, and find joy in explaining details. Your primary goal is to ensure the user's journey is safe, efficient, and interesting. Address the user with a respectful and friendly tone.`;

    if (savedAvatar) {
        avatarPreview.src = savedAvatar;
        chatAvatar.src = savedAvatar;
    }
    nameInput.value = savedName;
    descInput.value = savedDesc;
    chatName.textContent = savedName;

    // Set a default value if the description is empty on first load.
    if (!localStorage.getItem('aiPersonaDesc')) {
        localStorage.setItem('aiPersonaDesc', savedDesc);
    }
}

async function initAI() {
    const aiName = localStorage.getItem('aiName') || 'Sadak Sathi';
    const personaDesc = localStorage.getItem('aiPersonaDesc') || 'You are a helpful AI road co-pilot.';
    const systemInstruction = `${personaDesc}. Your name is ${aiName}. You are integrated into a map application called Sadak Sathi for driving in Nepal. Your current user interface language is ${currentLang}. All your text responses MUST be in this language. You have access to real-time data about roads, points of interest (POIs), and traffic incidents. You can also find routes for the user. Be helpful, concise, and proactive.`;

    const findRouteTool: Tool = {
        functionDeclarations: [
            {
                name: "findRoute",
                description: "Finds and displays the optimal route between two locations based on user preferences.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        start: { type: Type.STRING, description: "The starting location, e.g., 'Maitighar Mandala'" },
                        end: { type: Type.STRING, description: "The destination location, e.g., 'Civil Mall'" },
                    },
                    required: ["start", "end"]
                }
            }
        ]
    };

    try {
        activeChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
                tools: [findRouteTool]
            }
        });
        console.log("AI chat initialized with new persona and language:", currentLang);
    } catch (e) {
        console.error("Failed to initialize AI chat:", e);
        addMessageToChat(translate('ai_connection_error'), 'ai');
    }
}

async function handleAIChat(prompt: string, isFunctionResponse = false, functionResponseData: any = null) {
    if (!activeChat) {
        console.error("Chat not initialized.");
        addMessageToChat(translate('ai_connection_error'), 'ai');
        return;
    }

    const typingIndicator = document.querySelector('.typing-indicator') as HTMLElement;
    typingIndicator.classList.remove('hidden');

    try {
        const response: GenerateContentResponse = isFunctionResponse
            ? await activeChat.sendMessage({ functionResponse: functionResponseData })
            : await activeChat.sendMessage({ message: prompt });
            
        typingIndicator.classList.add('hidden');
        
        if (response?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
            const functionCall = response.candidates[0].content.parts[0].functionCall;
            const { name, args } = functionCall;

            if (name === 'findRoute') {
                const fromInput = document.getElementById('from-input') as HTMLInputElement;
                const toInput = document.getElementById('to-input') as HTMLInputElement;
                fromInput.value = args.start as string;
                toInput.value = args.end as string;

                addMessageToChat(translate('planning_route', { start: args.start as string, end: args.end as string }), 'ai');
                speak(translate('planning_route', { start: args.start as string, end: args.end as string }));
                
                (document.getElementById('ai-chat-modal') as HTMLElement).classList.add('hidden');
                (document.getElementById('route-finder-panel') as HTMLElement).classList.remove('hidden');

                const success = await handleFindRoute(true);
                
                const functionResponse = {
                    name: "findRoute",
                    response: {
                        name: "findRoute",
                        content: { result: success ? "Route found and displayed." : "Failed to find the route." },
                    },
                };
                await handleAIChat("", true, functionResponse as any);
            }
        } else {
            const text = response.text;
            addMessageToChat(text, 'ai');
            speak(text);
        }

    } catch (error) {
        console.error("AI chat error:", error);
        typingIndicator.classList.add('hidden');
        addMessageToChat(translate('ai_connection_error'), 'ai');
    }
}

function addMessageToChat(text: string, sender: 'user' | 'ai') {
    const chatMessages = document.querySelector('.chat-messages') as HTMLElement;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function speak(text: string) {
    if (!isVoiceResponseEnabled || !SpeechSynthesis || !isAudioUnlocked) return;
    SpeechSynthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = synthesisLangCodeMap[currentLang] || 'en-US';
    SpeechSynthesis.speak(utterance);
}


function handleVoiceCommand() {
    if (!SpeechRecognition) {
        alert("Speech Recognition is not supported in your browser.");
        return;
    }

    if (isListening) {
        recognition.stop();
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = recognitionLangCodeMap[currentLang] || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    const micButton = document.getElementById('voice-command-btn') as HTMLElement;
    const micIcon = micButton.querySelector('.material-icons') as HTMLElement;
    const originalAriaLabel = micButton.getAttribute('aria-label');

    recognition.onstart = () => {
        isListening = true;
        micButton.classList.add('listening');
        micIcon.textContent = 'mic_off';
        micButton.setAttribute('aria-label', translate('stop_listening'));
    };

    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('listening');
        micIcon.textContent = 'mic';
        micButton.setAttribute('aria-label', originalAriaLabel || translate('use_microphone'));
    };

    recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map(result => result.transcript)
            .join('');
        (document.getElementById('chat-input') as HTMLInputElement).value = transcript;
    };

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        isListening = false;
    };

    recognition.start();
}


// =================================================================================
// Route Finding
// =================================================================================
async function handleFindRoute(calledFromAI = false) {
    const fromInput = document.getElementById('from-input') as HTMLInputElement;
    const toInput = document.getElementById('to-input') as HTMLInputElement;
    const findRouteBtn = document.getElementById('find-route-btn') as HTMLButtonElement;
    const originalButtonText = findRouteBtn.textContent;
    findRouteBtn.textContent = translate('calculating_route');
    findRouteBtn.disabled = true;

    try {
        const fromName = fromInput.value.trim();
        const toName = toInput.value.trim();

        if (!fromName || !toName) {
            alert(translate('error_both_locations'));
            return false;
        }

        const fromPOI = findPOIByName(fromName);
        const toPOI = findPOIByName(toName);

        if (!fromPOI || !toPOI) {
            alert(translate('error_location_not_found'));
            return false;
        }

        const prefs = `Preferences: ${routePreferences.preferHighways ? "Prefer highways" : "No highway preference"}, ${routePreferences.avoidTolls ? "Avoid tolls" : "Tolls are acceptable"}, ${routePreferences.preferScenic ? "Prefer scenic routes" : "No scenic preference"}.`;
        const prompt = `Given the following GeoJSON road data, find the best route from "${fromName}" to "${toName}". All available roads are in the data. Consider the road status ('good', 'fair', 'poor'). ${prefs}. Your response MUST be a JSON object containing a single key "route" which is an array of road names in sequential order, like {"route": ["Road A", "Road B", "Local Road"]}. Do not include any other text or explanation. Road data: ${JSON.stringify(allRoadsData)}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        route: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const routeData = JSON.parse(response.text);
        const roadNames = routeData.route;

        if (!roadNames || roadNames.length === 0) {
            alert(translate('error_no_route'));
            return false;
        }

        const routeCoordinates: L.LatLng[] = [];
        roadNames.forEach((roadName: string) => {
            const roadFeature = allRoadsData.features.find((f: any) => f.properties.name === roadName);
            if (roadFeature) {
                roadFeature.geometry.coordinates.forEach((coord: number[]) => {
                    routeCoordinates.push(L.latLng(coord[1], coord[0]));
                });
            }
        });
        
        if (routeCoordinates.length === 0) {
             alert(translate('error_no_geometry'));
             return false;
        }

        clearRoute(); // Clear previous route
        routeLine = L.polyline(routeCoordinates, { color: '#e74c3c', weight: 5, opacity: 0.8, dashArray: '10, 5' }).addTo(map);

        const startIcon = L.divIcon({ html: `<span class="material-icons" style="color: #2ecc71; font-size: 36px;">place</span>`, className: 'route-marker-icon', iconAnchor: [18, 36] });
        const endIcon = L.divIcon({ html: `<span class="material-icons" style="color: #e74c3c; font-size: 36px;">flag</span>`, className: 'route-marker-icon', iconAnchor: [18, 36] });

        routeStartMarker = L.marker([fromPOI.lat, fromPOI.lng], { icon: startIcon }).addTo(map).bindPopup(`<b>${translate('route_start')}:</b> ${fromName}`);
        routeEndMarker = L.marker([toPOI.lat, toPOI.lng], { icon: endIcon }).addTo(map).bindPopup(`<b>${translate('route_destination')}:</b> ${toName}`);

        const bounds = L.latLngBounds([fromPOI, toPOI]);
        map.flyToBounds(bounds.pad(0.2));

        (document.getElementById('route-finder-panel') as HTMLElement).classList.add('hidden');
        
        showProactiveAlert(translate('route_success_message', { fromName, toName }));
        displayRouteDetails(roadNames, routeCoordinates);
        return true;

    } catch (error) {
        console.error("Error finding route:", error);
        alert(translate('error_generic_route'));
        return false;
    } finally {
        findRouteBtn.textContent = originalButtonText;
        findRouteBtn.disabled = false;
    }
}

function displayRouteDetails(roadNames: string[], coordinates: L.LatLng[]) {
    const panel = document.getElementById('route-details-panel')!;
    const distanceEl = document.getElementById('route-distance')!;
    const timeEl = document.getElementById('route-time')!;
    const directionsList = document.getElementById('route-directions-list')!;

    // Simulate distance and time
    const distance = (coordinates.length * 0.15).toFixed(1); // Rough simulation
    const time = Math.round(parseFloat(distance) * 2.5); // Rough simulation

    distanceEl.textContent = `${distance} km`;
    timeEl.textContent = `${time} min`;

    directionsList.innerHTML = roadNames.map(name => `<div class="direction-item">${name}</div>`).join('');

    panel.classList.remove('hidden');
}

function findPOIByName(name: string): any | null {
    const allItems = [...allPois, ...allIncidents];
    return allItems.find(item => item.name.toLowerCase() === name.toLowerCase()) || null;
}

function clearRoute() {
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    if (routeStartMarker) {
        map.removeLayer(routeStartMarker);
        routeStartMarker = null;
    }
    if (routeEndMarker) {
        map.removeLayer(routeEndMarker);
        routeEndMarker = null;
    }
    document.getElementById('route-details-panel')!.classList.add('hidden');
}

// =================================================================================
// Event Listeners
// =================================================================================
function setupEventListeners() {
    const themeToggle = document.getElementById('theme-toggle')!;
    const appContainer = document.getElementById('app-container')!;
    const settingsBtn = document.getElementById('settings-btn')!;
    const settingsPanel = document.getElementById('settings-panel')!;
    const centerBtn = document.getElementById('center-location-btn')!;
    const aiAssistantBtn = document.getElementById('ai-assistant-btn')!;
    const chatModal = document.getElementById('ai-chat-modal')!;
    const closeChatBtn = document.getElementById('close-chat-btn')!;
    const chatForm = document.getElementById('chat-form')!;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const routeFinderTrigger = document.getElementById('route-finder-trigger')!;
    const routeFinderPanel = document.getElementById('route-finder-panel')!;
    const routeFinderClose = document.getElementById('route-finder-close')!;
    const findRouteBtn = document.getElementById('find-route-btn')!;
    const clearRouteBtn = document.getElementById('clear-route-btn')!;
    const appModeBtn = document.getElementById('app-mode-btn')!;
    const appModeModal = document.getElementById('app-mode-modal')!;
    const displayPanelHeader = document.getElementById('display-panel-header')!;
    const displayPanel = document.getElementById('display-panel')!;

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const isDark = appContainer.dataset.theme === 'dark';
        appContainer.dataset.theme = isDark ? 'light' : 'dark';
        (themeToggle.querySelector('.material-icons') as HTMLElement).textContent = isDark ? 'light_mode' : 'dark_mode';
        localStorage.setItem('theme', appContainer.dataset.theme);
        
        if (appContainer.dataset.theme === 'dark') {
            if(currentBaseLayer !== baseLayers['dark']) {
                map.removeLayer(currentBaseLayer);
                currentBaseLayer = baseLayers['dark'];
                currentBaseLayer.addTo(map);
                document.querySelector('.style-option.active')?.classList.remove('active');
                document.querySelector('.style-option[data-style="dark"]')?.classList.add('active');
            }
        } else {
             if(currentBaseLayer === baseLayers['dark']) {
                map.removeLayer(currentBaseLayer);
                currentBaseLayer = baseLayers[lastLightBaseLayer];
                currentBaseLayer.addTo(map);
                 document.querySelector('.style-option.active')?.classList.remove('active');
                document.querySelector(`.style-option[data-style="${lastLightBaseLayer}"]`)?.classList.add('active');
             }
        }
    });

    // Settings Panel
    settingsBtn.addEventListener('click', () => settingsPanel.classList.toggle('open'));
    
    // Language Selector
    const langSelectorBtn = document.getElementById('language-selector-btn')!;
    const langPopup = document.getElementById('language-popup')!;
    langSelectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langPopup.classList.toggle('hidden');
    });
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang')!;
            changeLanguage(lang);
            langPopup.classList.add('hidden');
        });
    });

    // AI Chat
    aiAssistantBtn.addEventListener('click', () => chatModal.classList.remove('hidden'));
    closeChatBtn.addEventListener('click', () => chatModal.classList.add('hidden'));
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const prompt = chatInput.value.trim();
        if (prompt) {
            addMessageToChat(prompt, 'user');
            handleAIChat(prompt);
            chatInput.value = '';
        }
    });

    // Live Cam Feature
    const liveCamBtn = document.getElementById('live-cam-btn')!;
    liveCamBtn.addEventListener('click', () => {
        if (currentAppMode === 'driving') {
            alert('Live Cam is disabled in Driving mode for your safety.');
            return;
        }
        const camPanel = document.getElementById('live-cam-panel')!;
        const isOpening = camPanel.classList.contains('hidden');
        startLiveCam(isOpening);
    });

    document.getElementById('close-cam-btn')!.addEventListener('click', () => startLiveCam(false));
    document.getElementById('flip-cam-btn')!.addEventListener('click', () => {
        isFrontCamera = !isFrontCamera;
        startLiveCam(true);
    });
    
    // Make Live Cam panel draggable
    const liveCamPanel = document.getElementById('live-cam-panel')!;
    const liveCamHeader = document.getElementById('live-cam-header')!;
    let isDragging = false;
    let offsetX: number, offsetY: number;

    liveCamHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - liveCamPanel.offsetLeft;
        offsetY = e.clientY - liveCamPanel.offsetTop;
        liveCamPanel.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            liveCamPanel.style.left = `${e.clientX - offsetX}px`;
            liveCamPanel.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        liveCamPanel.style.cursor = 'default';
    });

    // Route Finder
    routeFinderTrigger.addEventListener('click', () => routeFinderPanel.classList.remove('hidden'));
    routeFinderClose.addEventListener('click', () => routeFinderPanel.classList.add('hidden'));
    findRouteBtn.addEventListener('click', () => handleFindRoute());
    clearRouteBtn.addEventListener('click', clearRoute);
    
    document.getElementById('swap-locations-btn')!.addEventListener('click', () => {
        const fromInput = document.getElementById('from-input') as HTMLInputElement;
        const toInput = document.getElementById('to-input') as HTMLInputElement;
        const temp = fromInput.value;
        fromInput.value = toInput.value;
        toInput.value = temp;
    });

    // Route Details Panel Close
    document.getElementById('route-details-close')!.addEventListener('click', clearRoute);

    // App Mode
    appModeBtn.addEventListener('click', () => appModeModal.classList.remove('hidden'));
    appModeModal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.modal-close-btn') || target.classList.contains('modal-overlay')) {
            appModeModal.classList.add('hidden');
        }
        const modeBtn = target.closest('.mode-select-btn');
        if (modeBtn) {
            currentAppMode = modeBtn.getAttribute('data-mode') as any;
            appContainer.dataset.mode = currentAppMode;
            appModeModal.classList.add('hidden');
            const modeKey = `mode_${currentAppMode}`;
            const modeText = translate(modeKey);
            (appModeBtn.querySelector('.label') as HTMLElement).textContent = modeText;
            (appModeBtn.querySelector('.label') as HTMLElement).setAttribute('data-lang-key', modeKey);
        }
    });

    // Display Panel Toggle
    displayPanelHeader.addEventListener('click', () => displayPanel.classList.toggle('collapsed'));

    // Route Preferences
    document.getElementById('pref-highways')!.addEventListener('change', e => routePreferences.preferHighways = (e.target as HTMLInputElement).checked);
    document.getElementById('pref-no-tolls')!.addEventListener('change', e => routePreferences.avoidTolls = (e.target as HTMLInputElement).checked);
    document.getElementById('pref-scenic')!.addEventListener('change', e => routePreferences.preferScenic = (e.target as HTMLInputElement).checked);
    
    // Proactive Alert Buttons
    document.getElementById('alert-ask-ai-btn')!.addEventListener('click', () => {
        const alertMessage = document.getElementById('alert-message')!.textContent;
        chatModal.classList.remove('hidden');
        chatInput.value = alertMessage || '';
        document.getElementById('proactive-alert')!.classList.add('hidden');
        handleAIChat(alertMessage || 'Tell me more about this alert.');
    });
    document.getElementById('alert-close-btn')!.addEventListener('click', () => {
        document.getElementById('proactive-alert')!.classList.add('hidden');
        currentAlertMessageKey = null;
    });

    // Voice Response Toggle
    document.getElementById('toggle-voice-response')!.addEventListener('change', e => {
        isVoiceResponseEnabled = (e.target as HTMLInputElement).checked;
        if (!isVoiceResponseEnabled) SpeechSynthesis.cancel();
    });
    
    // Unlock audio context on first user interaction
    document.body.addEventListener('click', () => {
        if (!isAudioUnlocked) {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            if(SpeechSynthesis.getVoices().length === 0) {
                 SpeechSynthesis.onvoiceschanged = () => {};
                 SpeechSynthesis.speak(new SpeechSynthesisUtterance(''));
            }
            isAudioUnlocked = true;
            console.log("Audio unlocked by user interaction.");
        }
    }, { once: true });
    
    // Voice Command Button
    document.getElementById('voice-command-btn')!.addEventListener('click', handleVoiceCommand);

    // NEW MAP CONTROLS
    const mapOptionsBtn = document.getElementById('map-options-btn')!;
    const mapOptionsPopup = document.getElementById('map-options-popup')!;

    document.getElementById('zoom-in-btn')!.addEventListener('click', () => map.zoomIn());
    document.getElementById('zoom-out-btn')!.addEventListener('click', () => map.zoomOut());

    centerBtn.addEventListener('click', () => {
        if (userMarker) {
            map.flyTo(userMarker.getLatLng(), 15);
        }
    });

    document.getElementById('toggle-roads')!.addEventListener('change', (e) => {
        map.hasLayer(roadsLayer) ? map.removeLayer(roadsLayer) : map.addLayer(roadsLayer);
    });
    document.getElementById('toggle-pois')!.addEventListener('change', (e) => {
        map.hasLayer(poisLayer) ? map.removeLayer(poisLayer) : map.addLayer(poisLayer);
    });
    document.getElementById('toggle-incidents')!.addEventListener('change', (e) => {
        map.hasLayer(incidentsLayer) ? map.removeLayer(incidentsLayer) : map.addLayer(incidentsLayer);
    });

    document.querySelectorAll('.style-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.getAttribute('data-style')!;
            if (baseLayers[style] && currentBaseLayer !== baseLayers[style]) {
                map.removeLayer(currentBaseLayer);
                currentBaseLayer = baseLayers[style];
                currentBaseLayer.addTo(map);
                document.querySelector('.style-option.active')?.classList.remove('active');
                btn.classList.add('active');
                if(style !== 'dark') lastLightBaseLayer = style;
            }
        });
    });

    // Global click listener to close popups
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!mapOptionsPopup.classList.contains('hidden') && !target.closest('#map-options-selector')) {
            mapOptionsPopup.classList.add('hidden');
        }
        if (settingsPanel.classList.contains('open') && !target.closest('#settings-panel') && !target.closest('#settings-btn')) {
            settingsPanel.classList.remove('open');
        }
        if (!langPopup.classList.contains('hidden') && !target.closest('#language-selector-container')) {
             langPopup.classList.add('hidden');
        }
        // Handle popup "Get Directions" button clicks
        if (target.classList.contains('popup-directions-btn')) {
            const destName = target.dataset.name;
            if (destName) {
                (document.getElementById('to-input') as HTMLInputElement).value = destName;
                (document.getElementById('from-input') as HTMLInputElement).value = "My Current Location"; // Placeholder
                routeFinderPanel.classList.remove('hidden');
                map.closePopup();
            }
        }
    });

    mapOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mapOptionsPopup.classList.toggle('hidden');
    });

    // Persona Settings Listeners
    const personaAvatarUpload = document.getElementById('persona-avatar-upload') as HTMLInputElement;
    const personaAvatarPreview = document.getElementById('persona-avatar-preview') as HTMLImageElement;
    const chatAvatar = document.getElementById('chat-ai-avatar') as HTMLImageElement;
    const personaNameInput = document.getElementById('persona-name-input') as HTMLInputElement;
    const personaDescInput = document.getElementById('persona-desc-input') as HTMLTextAreaElement;

    personaAvatarUpload.addEventListener('change', () => {
        const file = personaAvatarUpload.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                personaAvatarPreview.src = imageUrl;
                chatAvatar.src = imageUrl;
                localStorage.setItem('aiAvatar', imageUrl);
            };
            reader.readAsDataURL(file);
        }
    });

    personaNameInput.addEventListener('input', () => {
        const newName = personaNameInput.value;
        (document.getElementById('chat-ai-name') as HTMLElement).textContent = newName;
        localStorage.setItem('aiName', newName);
        initAI(); // Re-initialize AI with new name context
    });

    personaDescInput.addEventListener('input', () => {
        localStorage.setItem('aiPersonaDesc', personaDescInput.value);
        initAI(); // Re-initialize AI with new persona
    });
}


async function startLiveCam(enable: boolean) {
    const videoElement = document.getElementById('live-cam-video') as HTMLVideoElement;
    const placeholder = document.getElementById('live-cam-placeholder') as HTMLElement;
    const panel = document.getElementById('live-cam-panel') as HTMLElement;

    if (enable) {
        panel.classList.remove('hidden');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera API not available.');
            videoElement.classList.add('hidden');
            placeholder.classList.remove('hidden');
            return;
        }
        try {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: isFrontCamera ? 'user' : 'environment'
                }
            };
            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = cameraStream;
            videoElement.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } catch (err) {
            console.error("Error accessing camera:", err);
            videoElement.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    } else {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
            videoElement.srcObject = null;
        }
        panel.classList.add('hidden');
    }
}

function showProactiveAlert(messageKey: string) {
    const alertBanner = document.getElementById('proactive-alert')!;
    const messageElement = document.getElementById('alert-message')!;

    messageElement.setAttribute('data-lang-key', messageKey);
    messageElement.innerText = translate(messageKey);

    alertBanner.classList.remove('hidden');

    setTimeout(() => {
        if (!alertBanner.classList.contains('hidden')) {
            alertBanner.classList.add('hidden');
        }
    }, 10000);
}

// =================================================================================
// App Initialization
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const appContainer = document.getElementById('app-container')!;
    appContainer.dataset.theme = savedTheme;
    if (savedTheme === 'dark') {
        (document.querySelector('#theme-toggle .material-icons') as HTMLElement).textContent = 'dark_mode';
    }

    const savedLang = localStorage.getItem('preferredLang') || 'en';
    
    initMap();
    fetchAndDisplayData();
    loadPersona();
    setupEventListeners();
    changeLanguage(savedLang); // This also calls updateUIText and initAI
    
    setInterval(() => {
        if (Math.random() < 0.1) showProactiveAlert(translate('fuel_low_alert'));
    }, 30000);

    setInterval(() => {
        if (Math.random() < 0.05) showProactiveAlert(translate('pressure_low_alert'));
    }, 60000);
});