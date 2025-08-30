
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
                { "type": "Feature", "properties": { "name": "Congested Inner Road", "status": "good" }, "geometry": { "type": "LineString", "coordinates": [[85.322, 27.693], [85.324, 27.691], [85.318, 27.689], [85.316, 27.691]] } }
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
            { id: 6, name: "Himalayan Java Coffee", lat: 27.695, lng: 85.320, type: 'poi', status_key: 'status_open', category: 'coffee shop' },
            { id: 7, name: "Civil Mall", lat: 27.699, lng: 85.314, type: 'poi', status_key: 'status_open', category: 'shopping' }
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
let isSharingTrip = false;
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


// =================================================================================
// Internationalization (i18n)
// =================================================================================
const translations = {
    en: {
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
        layers: "Layers",
        roads: "Roads",
        pois: "Points of Interest",
        incidents: "Incidents",
        center_location: "Center on my location",
        display_panel_title: "Nearby Information",
        no_items_found: "No items found.",
        driver_status_title: "Driver Status",
        vehicle_health_title: "Vehicle Health",
        fuel_level: "Fuel Level",
        engine_temp: "Engine Temp",
        tire_pressure: "Tire Pressure",
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
        emergency_sos: "Emergency SOS",
        sos_message: "Sending your location to emergency contacts...",
        share_trip: "Share Trip",
        share_trip_desc: "Share a live link of your journey with friends and family.",
        start_sharing: "Start Sharing",
        sharing_active: "Live location sharing is active.",
        stop_sharing: "Stop Sharing",
        menu_settings: "Settings",
        menu_dashboard: "Dashboard",
        menu_sos: "SOS",
        menu_share_trip: "Share Trip",
        change_mode: "Change App Mode",
        open_route_finder: "Open Route Finder",
        open_dashboard: "Open Driver Dashboard",
        ai_assistant_btn: "AI Assistant",
        // Dynamic strings
        error_both_locations: "Please enter both a start and destination.",
        error_location_not_found: "Could not find one or both locations. Please use exact names from the list.",
        error_no_route: "The AI could not determine a route. Please try different locations or preferences.",
        error_no_geometry: "Could not find geometric data for the suggested route. Please check the data source.",
        error_generic_route: "An error occurred while finding the route. Please try again.",
        route_success_message: "Route from {fromName} to {toName} displayed.",
        route_start: "Start",
        route_destination: "Destination",
        // Status keys from API
        status_good_condition: "Good condition",
        status_maintenance: "Under maintenance",
        status_open_247: "Open 24/7",
        status_open: "Open",
        status_incident: "Incident",
        // Alert keys
        driver_tired_alert: "Driver appears tired. It might be a good time to take a short break.",
        driver_stressed_alert: "Driver appears stressed. Consider pulling over for a moment.",
        fuel_low_alert: "Fuel level is critically low. I can search for nearby petrol stations.",
        pressure_low_alert: "Tire pressure is low. I can find the nearest repair shop for you.",
        searching_for: "Searching for '{query}'...",
        planning_route: "Okay, planning a route from {start} to {end}.",
        done: "Done!",
        ai_connection_error: "Sorry, I'm having trouble connecting right now.",
        map_style_streets: "Streets",
        map_style_satellite: "Satellite",
        map_style_terrain: "Terrain",
        map_style_dark: "Dark",
    },
    np: {
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
        layers: "तहहरू",
        roads: "सडकहरू",
        pois: "चासोका ठाउँहरू",
        incidents: "घटनाहरू",
        center_location: "मेरो स्थानमा केन्द्रित गर्नुहोस्",
        display_panel_title: "नजिकैको जानकारी",
        no_items_found: "कुनै वस्तु फेला परेन।",
        driver_status_title: "चालक स्थिति",
        vehicle_health_title: "सवारी साधन स्वास्थ्य",
        fuel_level: "इन्धन स्तर",
        engine_temp: "इन्जिन तापमान",
        tire_pressure: "टायर प्रेसर",
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
        emergency_sos: "आपतकालीन SOS",
        sos_message: "आपतकालीन सम्पर्कहरूमा तपाईंको स्थान पठाउँदै...",
        share_trip: "यात्रा साझा गर्नुहोस्",
        share_trip_desc: "आफ्नो यात्राको प्रत्यक्ष लिङ्क साथीहरू र परिवारसँग साझा गर्नुहोस्।",
        start_sharing: "साझा गर्न सुरु गर्नुहोस्",
        sharing_active: "प्रत्यक्ष स्थान साझा सक्रिय छ।",
        stop_sharing: "साझा गर्न रोक्नुहोस्",
        menu_settings: "सेटिङहरू",
        menu_dashboard: "ड्यासबोर्ड",
        menu_sos: "SOS",
        menu_share_trip: "यात्रा साझा",
        change_mode: "एप मोड परिवर्तन गर्नुहोस्",
        open_route_finder: "मार्ग खोजकर्ता खोल्नुहोस्",
        open_dashboard: "चालक ड्यासबोर्ड खोल्नुहोस्",
        ai_assistant_btn: "एआई सहायक",
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
        driver_tired_alert: "चालक थकित देखिन्छ। छोटो विश्राम लिने यो राम्रो समय हुन सक्छ।",
        driver_stressed_alert: "चालक तनावमा देखिन्छ। एक क्षणको लागि गाडी रोक्ने विचार गर्नुहोस्।",
        fuel_low_alert: "इन्धनको स्तर एकदमै कम छ। म नजिकैको पेट्रोल स्टेशनहरू खोज्न सक्छु।",
        pressure_low_alert: "टायर प्रेसर कम छ। म तपाईंको लागि नजिकैको मर्मत पसल फेला पार्न सक्छु।",
        searching_for: "'{query}' को लागि खोजी गर्दै...",
        planning_route: "ठीक छ, {start} देखि {end} सम्मको मार्ग योजना गर्दै।",
        done: "भयो!",
        ai_connection_error: "माफ गर्नुहोस्, मलाई अहिले जडान गर्न समस्या भइरहेको छ।",
        map_style_streets: "सडकहरू",
        map_style_satellite: "स्याटेलाइट",
        map_style_terrain: "भू-भाग",
        map_style_dark: "डार्क",
    },
    hi: {
        app_subtitle: "आपका स्मार्ट सड़क साथी",
        gps_searching: "GPS स्थिति: खोज रहा है...",
        profile: "प्रोफ़ाइल",
        alert_ask_ai: "AI से पूछें",
        alert_dismiss: "खारिज करें",
        route_preferences: "मार्ग प्राथमिकताएँ",
        prefer_highways: "राजमार्गों को प्राथमिकता दें",
        avoid_tolls: "टोल से बचें",
        prefer_scenic_route: "सुंदर मार्ग को प्राथमिकता दें",
        app_settings: "ऐप सेटिंग्स",
        language: "भाषा",
        dark_mode: "डार्क मोड",
        toggle_dark_mode: "डार्क मोड टॉगल करें",
        ai_voice_response: "एआई वॉयस रिस्पांस",
        layers: "परतें",
        roads: "सड़कें",
        pois: "रुचि के बिंदु",
        incidents: "घटनाएँ",
        center_location: "मेरे स्थान पर केंद्रित करें",
        display_panel_title: "आस-पास की जानकारी",
        no_items_found: "कोई आइटम नहीं मिला।",
        driver_status_title: "ड्राइवर की स्थिति",
        vehicle_health_title: "वाहन का स्वास्थ्य",
        fuel_level: "ईंधन स्तर",
        engine_temp: "इंजन तापमान",
        tire_pressure: "टायर दबाव",
        route_finder: "मार्ग खोजक",
        from: "से",
        from_placeholder: "प्रारंभ स्थान",
        to: "तक",
        to_placeholder: "गंतव्य",
        find_route_btn: "इष्टतम मार्ग खोजें",
        calculating_route: "गणना हो रही है...",
        share_route: "मार्ग साझा करें",
        clear_route_btn: "मार्ग साफ़ करें",
        ai_chat_title: "एआई सहायक",
        ai_chat_placeholder: "एक संदेश टाइप करें...",
        close_chat: "चैट बंद करें",
        use_microphone: "माइक्रोफोन का प्रयोग करें",
        stop_listening: "सुनना बंद करें",
        send_message: "संदेश भेजें",
        select_mode: "मोड चुनें",
        mode_driving: "ड्राइविंग",
        mode_riding: "राइडिंग",
        mode_exploring: "अन्वेषण",
        mode_connect: "कनेक्ट",
        close: "बंद करें",
        emergency_sos: "आपातकालीन एसओएस",
        sos_message: "आपातकालीन संपर्कों को आपका स्थान भेजा जा रहा है...",
        share_trip: "यात्रा साझा करें",
        share_trip_desc: "अपनी यात्रा का एक लाइव लिंक दोस्तों और परिवार के साथ साझा करें।",
        start_sharing: "साझा करना शुरू करें",
        sharing_active: "लाइव स्थान साझाकरण सक्रिय है।",
        stop_sharing: "साझा करना बंद करें",
        menu_settings: "सेटिंग्स",
        menu_dashboard: "डैशबोर्ड",
        menu_sos: "एसओएस",
        menu_share_trip: "यात्रा साझा करें",
        change_mode: "ऐप मोड बदलें",
        open_route_finder: "मार्ग खोजक खोलें",
        open_dashboard: "ड्राइवर डैशबोर्ड खोलें",
        ai_assistant_btn: "एआई सहायक",
        error_both_locations: "कृपया प्रारंभ और गंतव्य दोनों स्थान दर्ज करें।",
        error_location_not_found: "एक या दोनों स्थान नहीं मिल सके। कृपया सूची से सटीक नामों का उपयोग करें।",
        error_no_route: "एआई मार्ग निर्धारित नहीं कर सका। कृपया विभिन्न स्थानों या प्राथमिकताओं का प्रयास करें।",
        error_no_geometry: "सुझाए गए मार्ग के लिए ज्यामितीय डेटा नहीं मिला। कृपया डेटा स्रोत की जांच करें।",
        error_generic_route: "मार्ग खोजते समय एक त्रुटि हुई। कृपया पुन: प्रयास करें।",
        route_success_message: "{fromName} से {toName} तक का मार्ग प्रदर्शित किया गया।",
        route_start: "प्रारंभ",
        route_destination: "गंतव्य",
        status_good_condition: "अच्छी स्थिति",
        status_maintenance: "रखरखाव के तहत",
        status_open_247: "24/7 खुला",
        status_open: "खुला",
        status_incident: "घटना",
        driver_tired_alert: "ड्राइवर थका हुआ लग रहा है। एक छोटा ब्रेक लेने का यह अच्छा समय हो सकता है।",
        driver_stressed_alert: "ड्राइवर तनाव में लग रहा है। एक पल के लिए रुकने पर विचार करें।",
        fuel_low_alert: "ईंधन का स्तर गंभीर रूप से कम है। मैं आस-पास के पेट्रोल स्टेशनों की खोज कर सकता हूँ।",
        pressure_low_alert: "टायर का दबाव कम है। मैं आपके लिए निकटतम मरम्मत की दुकान ढूंढ सकता हूँ।",
        searching_for: "'{query}' के लिए खोज रहा है...",
        planning_route: "ठीक है, {start} से {end} तक का मार्ग नियोजित कर रहा हूँ।",
        done: "हो गया!",
        ai_connection_error: "क्षमा करें, मुझे अभी कनेक्ट करने में समस्या हो रही है।",
        map_style_streets: "सड़कें",
        map_style_satellite: "सैटेलाइट",
        map_style_terrain: "इलाका",
        map_style_dark: "डार्क",
    },
};

const translate = (key: string, options: { [key: string]: string } = {}): string => {
    let translation = translations[currentLang]?.[key] || translations.en[key] || key;
    Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{${optionKey}}`, options[optionKey]);
    });
    return translation;
};

const translateUI = () => {
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (key) {
            element.textContent = translate(key);
        }
    });
    document.querySelectorAll('[data-lang-key-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-key-placeholder');
        if (key) {
            (element as HTMLInputElement).placeholder = translate(key);
        }
    });
    document.querySelectorAll('[data-lang-key-aria-label]').forEach(element => {
        const key = element.getAttribute('data-lang-key-aria-label');
        if (key) {
            element.setAttribute('aria-label', translate(key));
        }
    });
     document.querySelectorAll('[data-lang-key-title]').forEach(element => {
        const key = element.getAttribute('data-lang-key-title');
        if (key) {
            element.setAttribute('title', translate(key));
        }
    });
};

const updateLanguage = (lang: string) => {
    currentLang = lang;
    document.documentElement.lang = lang;
    (document.getElementById('language-select') as HTMLSelectElement).value = lang;
    localStorage.setItem('preferredLang', lang);
    translateUI();
    initAiChat(); // Re-initialize chat with new language context
    setupRecognition(); // Re-initialize speech recognition for the new language
};

// =================================================================================
// Audio & Speech
// =================================================================================

const unlockAudio = () => {
    if (!isAudioUnlocked) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        isAudioUnlocked = true;
        console.log("Audio context unlocked.");
    }
};

const speak = (text: string) => {
    if (!isVoiceResponseEnabled || !SpeechSynthesis) return;

    // A simple trick to cancel any ongoing speech before starting a new one.
    SpeechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language for the speech
    const langCodeMap = { 'en': 'en-US', 'np': 'ne-NP', 'hi': 'hi-IN' };
    utterance.lang = langCodeMap[currentLang] || 'en-US';

    // Optional: try to find a voice for the specific language
    const voices = SpeechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === utterance.lang);
    if (voice) {
        utterance.voice = voice;
    }
    
    SpeechSynthesis.speak(utterance);
};


const setupRecognition = () => {
    if (!SpeechRecognition) {
        console.warn("Speech Recognition not supported in this browser.");
        document.getElementById('voice-command-btn')?.classList.add('hidden');
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    const langCodeMap = { 'en': 'en-US', 'np': 'ne-NP', 'hi': 'hi-IN' };
    recognition.lang = langCodeMap[currentLang] || 'en-US';

    recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map(result => result.transcript)
            .join('');
        (document.getElementById('chat-input') as HTMLInputElement).value = transcript;
    };

    recognition.onend = () => {
        isListening = false;
        const btn = document.getElementById('voice-command-btn');
        const icon = btn?.querySelector('.material-icons');
        btn?.classList.remove('listening');
        if (icon) icon.textContent = 'mic';
        btn?.setAttribute('aria-label', translate('use_microphone'));
    };
    
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        isListening = false;
         const btn = document.getElementById('voice-command-btn');
        const icon = btn?.querySelector('.material-icons');
        btn?.classList.remove('listening');
        if (icon) icon.textContent = 'mic';
        btn?.setAttribute('aria-label', translate('use_microphone'));
    };
};

const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            isListening = true;
            const btn = document.getElementById('voice-command-btn');
            const icon = btn?.querySelector('.material-icons');
            btn?.classList.add('listening');
            if (icon) icon.textContent = 'stop';
             btn?.setAttribute('aria-label', translate('stop_listening'));
        } catch(e) {
            console.error("Could not start recognition:", e);
             isListening = false;
        }
    }
};

// =================================================================================
// Map Initialization & Layers
// =================================================================================

const initMap = () => {
    map = L.map('map', {
        zoomControl: false // We will add it manually to a different container
    }).setView([27.7, 85.3], 13);

    // Add zoom control to the bottom-right overlay container
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

     // Move center button into the same container as zoom for consistency
    const centerBtn = document.getElementById('center-location-btn');
    const zoomContainer = document.querySelector('.leaflet-control-zoom');
    if (centerBtn && zoomContainer?.parentNode) {
         zoomContainer.parentNode.insertBefore(centerBtn, zoomContainer.nextSibling);
    }
    

    // --- Base Layers ---
    baseLayers['streets'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    baseLayers['satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });
     baseLayers['terrain'] = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });
    baseLayers['dark'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });


    // Set initial layer
    currentBaseLayer = baseLayers['streets'];
    currentBaseLayer.addTo(map);
    updateActiveMapStyleButton('streets');


    // --- Data Layers ---
    roadsLayer = L.geoJSON(null, {
        style: (feature) => {
            switch (feature?.properties.status) {
                case 'good': return { color: '#2ecc71', weight: 4, opacity: 0.8 };
                case 'fair': return { color: '#f39c12', weight: 4, opacity: 0.8 };
                case 'poor': return { color: '#e74c3c', weight: 4, opacity: 0.8 };
                default: return { color: '#3498db', weight: 3 };
            }
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Status: ${feature.properties.status}`);
        }
    }).addTo(map);

    poisLayer = L.featureGroup().addTo(map);
    incidentsLayer = L.featureGroup().addTo(map);

    // --- User Marker ---
    const userIcon = L.divIcon({
        html: '<span class="material-icons" style="font-size: 36px; color: #3498db;">navigation</span>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });
    userMarker = L.marker([27.7, 85.32], { icon: userIcon }).addTo(map)
        .bindPopup("Your Location");
};

const switchBaseLayer = (style: string) => {
    if (baseLayers[style] && currentBaseLayer !== baseLayers[style]) {
        if (currentBaseLayer) {
            map.removeLayer(currentBaseLayer);
        }
        currentBaseLayer = baseLayers[style];
        currentBaseLayer.addTo(map);
        updateActiveMapStyleButton(style);
        
        // Remember the last "light" theme map used
        if (style !== 'dark') {
            lastLightBaseLayer = style;
        }
    }
};

const updateActiveMapStyleButton = (activeStyle: string) => {
    document.querySelectorAll('.style-option').forEach(btn => {
        if (btn.getAttribute('data-style') === activeStyle) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

// =================================================================================
// UI & State Management
// =================================================================================

const toggleTheme = () => {
    const container = document.getElementById('app-container');
    const currentTheme = container?.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    container?.setAttribute('data-theme', newTheme);
    localStorage.setItem('preferredTheme', newTheme);

    // Update theme toggle icon
    const icon = document.querySelector('#theme-toggle .material-icons');
    if (icon) {
        icon.textContent = newTheme === 'light' ? 'light_mode' : 'dark_mode';
    }

    // Automatically switch map style
    if (newTheme === 'dark') {
        switchBaseLayer('dark');
    } else {
        // Switch back to the last used light theme map
        switchBaseLayer(lastLightBaseLayer);
    }
};


const togglePanel = (panelId: string, forceState?: 'open' | 'close') => {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const isOpen = panel.classList.contains('open');

    if (forceState === 'open' && !isOpen) {
        panel.classList.add('open');
    } else if (forceState === 'close' && isOpen) {
        panel.classList.remove('open');
    } else if (!forceState) {
        panel.classList.toggle('open');
    }
};

const toggleModal = (modalId: string, show: boolean) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
};

const updateAppMode = (newMode: 'driving' | 'riding' | 'exploring' | 'connect') => {
    currentAppMode = newMode;
    const container = document.getElementById('app-container');
    const modeBtnLabel = document.querySelector('#app-mode-btn .label');
    const modeBtnIcon = document.querySelector('#app-mode-btn .material-icons');

    if (container) container.dataset.mode = newMode;
    if (modeBtnLabel) modeBtnLabel.textContent = translate(`mode_${newMode}`);
    
    if (modeBtnIcon) {
        const icons = {
            driving: 'directions_car',
            riding: 'two_wheeler',
            exploring: 'hiking',
            connect: 'people'
        };
        modeBtnIcon.textContent = icons[newMode];
    }
    
    // Hide/show mode-specific buttons
    document.querySelectorAll('#bottom-menu .menu-item').forEach(btn => btn.classList.add('hidden'));
    document.getElementById('settings-btn')?.classList.remove('hidden');
     document.getElementById('app-mode-btn')?.classList.remove('hidden');

    // Show buttons based on mode
    if (newMode === 'driving') {
        document.getElementById('dashboard-btn')?.classList.remove('hidden');
    } else if (newMode === 'riding' || newMode === 'exploring') {
        document.getElementById('sos-btn')?.classList.remove('hidden');
    } else if (newMode === 'connect') {
        document.getElementById('sos-btn')?.classList.remove('hidden');
        document.getElementById('share-trip-btn')?.classList.remove('hidden');
    }
    
    toggleModal('app-mode-modal', false);
};

const triggerAIAlert = (messageKey: string) => {
    currentAlertMessageKey = messageKey;
    const alertBanner = document.getElementById('proactive-alert');
    const alertMessage = document.getElementById('alert-message');
    if (alertBanner && alertMessage) {
        alertMessage.textContent = translate(messageKey);
        alertBanner.classList.remove('hidden');
    }
};

const clearRoute = () => {
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
    document.getElementById('share-route-btn')?.classList.add('hidden');
};

const updateRoutePreferences = () => {
    routePreferences.preferHighways = (document.getElementById('pref-highways') as HTMLInputElement).checked;
    routePreferences.avoidTolls = (document.getElementById('pref-no-tolls') as HTMLInputElement).checked;
    routePreferences.preferScenic = (document.getElementById('pref-scenic') as HTMLInputElement).checked;
};

// =================================================================================
// Data Fetching & Display
// =================================================================================

const createFilterButtons = (categories: string[]) => {
    const container = document.getElementById('display-panel-filters');
    if (!container) return;
    
    const iconMap: { [key: string]: string } = {
        'all': 'select_all',
        'landmark': 'account_balance',
        'bridge': 'water',
        'hospital': 'local_hospital',
        'coffee shop': 'local_cafe',
        'shopping': 'shopping_cart',
        'traffic': 'traffic',
        'construction': 'construction'
    };
    
    container.innerHTML = `<button class="filter-btn active" data-filter="all"><span class="material-icons">${iconMap['all']}</span></button>`;
    
    categories.forEach(category => {
        container.innerHTML += `<button class="filter-btn" data-filter="${category}"><span class="material-icons">${iconMap[category] || 'place'}</span></button>`;
    });

    // Add event listeners
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelector('.filter-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            const filter = (btn as HTMLElement).dataset.filter || 'all';
            updateDisplayedItems(filter);
        });
    });
};


const updateDisplayedItems = (filter = 'all') => {
    const list = document.getElementById('display-panel-list');
    if (!list) return;

    list.innerHTML = '';
    const combinedItems = [...allPois, ...allIncidents];

    const filteredItems = filter === 'all'
        ? combinedItems
        : combinedItems.filter(item => item.category === filter);

    if (filteredItems.length === 0) {
        list.innerHTML = `<p class="no-items">${translate('no_items_found')}</p>`;
        return;
    }

    filteredItems.forEach(item => {
        const statusText = translate(item.status_key);
        const card = `
            <div class="info-card" data-id="${item.id}" data-type="${item.type}" data-lat="${item.lat}" data-lng="${item.lng}">
                <h3>${item.name}</h3>
                <p>${item.category}</p>
                 <span class="card-status ${item.status_key.replace('status_', '')}">${statusText}</span>
            </div>
        `;
        list.innerHTML += card;
    });

    // Add event listeners to new cards
    list.querySelectorAll('.info-card').forEach(card => {
        card.addEventListener('click', () => {
            const lat = parseFloat((card as HTMLElement).dataset.lat!);
            const lng = parseFloat((card as HTMLElement).dataset.lng!);
            map.flyTo([lat, lng], 16);
        });
    });
};

const fetchAndDisplayData = async () => {
    try {
        const [roadsData, poisData, incidentsData] = await Promise.all([
            api.getRoads(),
            api.getPOIs(),
            api.getIncidents()
        ]);

        allRoadsData = roadsData;
        roadsLayer.clearLayers().addData(roadsData);

        allPois = poisData;
        allIncidents = incidentsData;
        
        const poiCategories = [...new Set(allPois.map(p => p.category))];
        const incidentCategories = [...new Set(allIncidents.map(i => i.category))];
        createFilterButtons([...new Set([...poiCategories, ...incidentCategories])]);
        
        updateDisplayedItems(); // Initial display

        poisLayer.clearLayers();
        allPois.forEach(poi => {
            L.marker([poi.lat, poi.lng])
              .bindPopup(`<strong>${poi.name}</strong><br>${translate(poi.status_key)}`)
              .addTo(poisLayer);
        });

        incidentsLayer.clearLayers();
        allIncidents.forEach(incident => {
            L.marker([incident.lat, incident.lng], {
                icon: L.divIcon({
                    html: '<span class="material-icons" style="font-size: 24px; color: #e74c3c;">warning</span>',
                    className: '',
                    iconSize: [24, 24],
                })
            }).bindPopup(`<strong>${incident.name}</strong>`).addTo(incidentsLayer);
        });

    } catch (error) {
        console.error("Error fetching map data:", error);
    }
};

// =================================================================================
// Route Finding
// =================================================================================

const findLocationByName = (name: string): { lat: number; lng: number } | null => {
    const lowerCaseName = name.trim().toLowerCase();
    const location = allPois.find(p => p.name.toLowerCase() === lowerCaseName);
    return location ? { lat: location.lat, lng: location.lng } : null;
};

const findOptimalRoute = async () => {
    const fromInput = document.getElementById('from-input') as HTMLInputElement;
    const toInput = document.getElementById('to-input') as HTMLInputElement;
    const fromName = fromInput.value;
    const toName = toInput.value;
    const findRouteBtn = document.getElementById('find-route-btn') as HTMLButtonElement;

    if (!fromName || !toName) {
        alert(translate('error_both_locations'));
        return;
    }

    const startLoc = findLocationByName(fromName);
    const endLoc = findLocationByName(toName);

    if (!startLoc || !endLoc) {
        alert(translate('error_location_not_found'));
        return;
    }

    clearRoute();
    
    findRouteBtn.disabled = true;
    findRouteBtn.textContent = translate('calculating_route');
    
    try {
        const prompt = `
            Find the optimal route from "${fromName}" to "${toName}".
            The start coordinate is approximately ${startLoc.lat}, ${startLoc.lng}.
            The end coordinate is approximately ${endLoc.lat}, ${endLoc.lng}.
            The user's preferences are: Prefer Highways: ${routePreferences.preferHighways}, Avoid Tolls: ${routePreferences.avoidTolls}, Prefer Scenic Route: ${routePreferences.preferScenic}.
            Here is the available road data in GeoJSON format: ${JSON.stringify(allRoadsData)}.
            Based on this data and the preferences, determine the best route and return the road names in the required JSON format.
        `;

        const result: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        route: {
                            type: Type.ARRAY,
                            description: "An array of road names, in order, that form the optimal route.",
                            items: {
                                type: Type.STRING,
                            }
                        }
                    },
                    required: ["route"]
                }
            }
        });

        const jsonResponse = JSON.parse(result.text);
        const roadNames = jsonResponse.route;
        
        if (!roadNames || roadNames.length === 0) {
            throw new Error(translate('error_no_route'));
        }
        
        let routeCoordinates: any[] = [];
        let pathFound = false;

        const roadFeatures = allRoadsData.features.filter((f: any) => roadNames.includes(f.properties.name));
        
        if (roadFeatures.length === 0) {
            throw new Error(translate('error_no_route'));
        }

        // For simplicity, we'll just stitch the road geometries together.
        // A real implementation would use a proper routing algorithm (like A*).
        roadFeatures.forEach((feature: any) => {
             if (feature.geometry && feature.geometry.coordinates) {
                routeCoordinates.push(...feature.geometry.coordinates.map((c: any) => [c[1], c[0]])); // Flip coords for Leaflet
                pathFound = true;
            }
        });

        if (!pathFound) {
             throw new Error(translate('error_no_geometry'));
        }
        
        routeLine = L.polyline(routeCoordinates, { color: '#3498db', weight: 6, opacity: 0.8, dashArray: '10, 10' }).addTo(map);

        // Add markers
        const startIcon = L.divIcon({ className: 'route-marker-icon', html: '<span class="material-icons" style="color: green; font-size: 36px;">place</span>' });
        const endIcon = L.divIcon({ className: 'route-marker-icon', html: '<span class="material-icons" style="color: red; font-size: 36px;">flag</span>' });

        routeStartMarker = L.marker([startLoc.lat, startLoc.lng], { icon: startIcon }).addTo(map)
            .bindPopup(`<strong>${translate('route_start')}:</strong> ${fromName}`);
        routeEndMarker = L.marker([endLoc.lat, endLoc.lng], { icon: endIcon }).addTo(map)
            .bindPopup(`<strong>${translate('route_destination')}:</strong> ${toName}`);
        
        // Zoom to fit route
        const bounds = L.latLngBounds([
            [startLoc.lat, startLoc.lng],
            [endLoc.lat, endLoc.lng]
        ]).pad(0.1); // Add some padding
        map.flyToBounds(bounds);

        toggleModal('route-finder-panel', false);
        speak(translate('route_success_message', { fromName, toName }));

    } catch (error) {
        console.error("Route finding error:", error);
        alert(translate('error_generic_route'));
    } finally {
        findRouteBtn.disabled = false;
        findRouteBtn.textContent = translate('find_route_btn');
    }
};

// =================================================================================
// AI Assistant & Chat
// =================================================================================

const findRouteTool: Tool = {
    functionDeclarations: [
        {
            name: "findRoute",
            description: "Finds and displays a route on the map between two specified locations.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    start: {
                        type: Type.STRING,
                        description: "The starting point of the route, e.g., 'Maitighar Mandala'",
                    },
                    end: {
                        type: Type.STRING,
                        description: "The destination of the route, e.g., 'Civil Mall'",
                    },
                },
                required: ["start", "end"],
            },
        },
    ],
};


const initAiChat = () => {
    // Stop any existing chat before starting a new one.
    activeChat = null;

    const systemInstruction = `
        You are "Sadak Sathi", a friendly and helpful AI driving assistant for Nepal.
        Your primary language for conversation is ${currentLang}.
        You can answer questions about the area, provide driving advice, and help with navigation.
        When asked to find a route, you MUST use the "findRoute" tool.
        Do not make up information about road conditions or traffic; refer to the user's map data.
        Keep your responses concise and clear.
    `;

    try {
        activeChat = ai.chats.create({
            model: "gemini-2.5-flash",
            // Fix: All config parameters must be inside a 'config' object.
            config: {
                systemInstruction: systemInstruction,
                tools: [findRouteTool],
            }
        });
        console.log("AI Chat initialized for language:", currentLang);
    } catch (error) {
        console.error("Error initializing AI Chat:", error);
        // Fallback or error handling
    }
};

const addMessageToChat = (text: string, sender: 'user' | 'ai') => {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
};

const handleChatSubmit = async (event?: Event) => {
    event?.preventDefault();
    if (!activeChat) {
        addMessageToChat(translate('ai_connection_error'), 'ai');
        return;
    }

    const input = document.getElementById('chat-input') as HTMLInputElement;
    const message = input.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    input.value = '';
    document.querySelector('.typing-indicator')?.classList.remove('hidden');

    try {
        const result: GenerateContentResponse = await activeChat.sendMessage({ message: message });
        document.querySelector('.typing-indicator')?.classList.add('hidden');

        // Check for function calls
        if (result.candidates && result.candidates[0].content.parts[0].functionCall) {
            const functionCall = result.candidates[0].content.parts[0].functionCall;
            if (functionCall.name === 'findRoute') {
                // Fix: Added type assertion to satisfy TypeScript.
                const args = functionCall.args as { start: string; end: string };
                const start = args.start;
                const end = args.end;

                addMessageToChat(translate('planning_route', { start, end }), 'ai');
                speak(translate('planning_route', { start, end }));
                
                // Populate and trigger the route finder
                (document.getElementById('from-input') as HTMLInputElement).value = start;
                (document.getElementById('to-input') as HTMLInputElement).value = end;
                await findOptimalRoute();
                
                toggleModal('ai-chat-modal', false);
                addMessageToChat(translate('done'), 'ai');
            }
        } else {
            const responseText = result.text;
            addMessageToChat(responseText, 'ai');
            speak(responseText);
        }

    } catch (error) {
        console.error("AI Chat Error:", error);
        document.querySelector('.typing-indicator')?.classList.add('hidden');
        addMessageToChat(translate('ai_connection_error'), 'ai');
    }
};

// =================================================================================
// Simulation Logic
// =================================================================================

const simulateDriverEmotion = () => {
    const emotions = [
        { state: 'calm', icon: 'sentiment_very_satisfied', text: 'Calm', className: 'calm', alert: null },
        { state: 'tired', icon: 'sentiment_dissatisfied', text: 'Tired', className: 'tired', alert: 'driver_tired_alert' },
        { state: 'stressed', icon: 'sentiment_very_dissatisfied', text: 'Stressed', className: 'stressed', alert: 'driver_stressed_alert' }
    ];
    const currentEmotion = emotions[Math.floor(Math.random() * emotions.length)];

    const iconEl = document.getElementById('driver-status-icon');
    const textEl = document.getElementById('driver-status-text');

    if (iconEl) iconEl.textContent = currentEmotion.icon;
    if (textEl) {
        textEl.textContent = currentEmotion.text;
        textEl.className = currentEmotion.className;
    }
    
    // if (currentEmotion.alert) {
    //    triggerAIAlert(currentEmotion.alert);
    // }
};

const simulateVehicleOBD = () => {
    // Fuel
    const fuel = Math.floor(Math.random() * 100);
    const fuelBar = document.getElementById('fuel-bar');
    const fuelValue = document.getElementById('fuel-value');
    if (fuelBar) {
        (fuelBar as HTMLElement).style.width = `${fuel}%`;
        fuelBar.className = 'progress-bar';
        if (fuel < 20) fuelBar.classList.add('bar-danger');
        else if (fuel < 50) fuelBar.classList.add('bar-warn');
        else fuelBar.classList.add('bar-good');
    }
    if (fuelValue) fuelValue.textContent = `${fuel}%`;
    
    // if (fuel < 15) {
    //    triggerAIAlert('fuel_low_alert');
    // }

    // Tire Pressure
    const pressure = 28 + Math.floor(Math.random() * 6); // 28-33
    const pressureBar = document.getElementById('pressure-bar');
    const pressureValue = document.getElementById('pressure-value');
     if (pressureBar) {
        const pressurePercent = ((pressure - 25) / 10) * 100; // Assuming normal range is 25-35
        (pressureBar as HTMLElement).style.width = `${pressurePercent}%`;
        pressureBar.className = 'progress-bar';
        if (pressure < 30) pressureBar.classList.add('bar-danger');
        else if (pressure < 32) pressureBar.classList.add('bar-warn');
        else pressureBar.classList.add('bar-good');
    }
    if(pressureValue) pressureValue.textContent = `${pressure} PSI`;

    // if (pressure < 30) {
    //    triggerAIAlert('pressure_low_alert');
    // }
};

const simulateGPS = () => {
    const lat = userMarker.getLatLng().lat + (Math.random() - 0.5) * 0.001;
    const lng = userMarker.getLatLng().lng + (Math.random() - 0.5) * 0.001;
    userMarker.setLatLng([lat, lng]);

    (document.getElementById('location-coords') as HTMLElement).textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const speedEl = document.querySelector('#speed-widget .value');
    if (speedEl) {
        const speed = 40 + Math.floor(Math.random() * 20);
        speedEl.textContent = speed.toString();
    }
};

// =================================================================================
// Event Listeners & App Initialization
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchAndDisplayData();
    initAiChat();
    setupRecognition();
    
    // Restore user preferences
    const savedLang = localStorage.getItem('preferredLang');
    if (savedLang) {
        updateLanguage(savedLang);
    } else {
        translateUI(); // Initial translation
    }
    
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme === 'dark') {
        toggleTheme();
    }

    // --- General UI ---
    document.getElementById('profile-btn')?.addEventListener('click', () => togglePanel('settings-panel'));
    document.getElementById('settings-btn')?.addEventListener('click', () => togglePanel('settings-panel'));
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('language-select')?.addEventListener('change', (e) => updateLanguage((e.target as HTMLSelectElement).value));
    
    // --- Map Controls ---
    document.getElementById('center-location-btn')?.addEventListener('click', () => map.flyTo(userMarker.getLatLng(), 15));
    document.getElementById('toggle-roads')?.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(roadsLayer); else map.removeLayer(roadsLayer);
    });
    document.getElementById('toggle-pois')?.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(poisLayer); else map.removeLayer(poisLayer);
    });
    document.getElementById('toggle-incidents')?.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(incidentsLayer); else map.removeLayer(incidentsLayer);
    });
    
    // Map Style Selector
    document.getElementById('map-style-btn')?.addEventListener('click', () => {
        document.getElementById('map-style-options')?.classList.toggle('hidden');
    });
    document.querySelectorAll('.style-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = (btn as HTMLElement).dataset.style;
            if (style) {
                switchBaseLayer(style);
                document.getElementById('map-style-options')?.classList.add('hidden');
            }
        });
    });

    // Grouped Data Layer Selector
    document.getElementById('data-layers-btn')?.addEventListener('click', () => {
        document.getElementById('data-layers-options')?.classList.toggle('hidden');
    });

    // --- Panels & Modals ---
    document.getElementById('display-panel-header')?.addEventListener('click', () => {
        document.getElementById('display-panel')?.classList.toggle('collapsed');
    });
    document.getElementById('dashboard-btn')?.addEventListener('click', () => togglePanel('driver-dashboard'));
    
    // Route Finder
    document.getElementById('route-finder-trigger')?.addEventListener('click', () => toggleModal('route-finder-panel', true));
    document.getElementById('route-finder-close')?.addEventListener('click', () => toggleModal('route-finder-panel', false));
    document.getElementById('find-route-btn')?.addEventListener('click', findOptimalRoute);
    document.getElementById('clear-route-btn')?.addEventListener('click', clearRoute);
    document.getElementById('pref-highways')?.addEventListener('change', updateRoutePreferences);
    document.getElementById('pref-no-tolls')?.addEventListener('change', updateRoutePreferences);
    document.getElementById('pref-scenic')?.addEventListener('change', updateRoutePreferences);

    // AI Chat
    document.getElementById('ai-assistant-btn')?.addEventListener('click', () => toggleModal('ai-chat-modal', true));
    document.getElementById('close-chat-btn')?.addEventListener('click', () => toggleModal('ai-chat-modal', false));
    document.getElementById('chat-form')?.addEventListener('submit', handleChatSubmit);
    document.getElementById('voice-command-btn')?.addEventListener('click', toggleListening);

    // App Mode
    document.getElementById('app-mode-btn')?.addEventListener('click', () => toggleModal('app-mode-modal', true));
    document.querySelectorAll('#app-mode-modal .modal-close-btn').forEach(btn => btn.addEventListener('click', () => toggleModal('app-mode-modal', false)));
    document.querySelectorAll('.mode-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = (btn as HTMLElement).dataset.mode as any;
            if (mode) updateAppMode(mode);
        });
    });

    // SOS & Sharing
    document.getElementById('sos-btn')?.addEventListener('click', () => toggleModal('sos-modal', true));
    document.querySelectorAll('#sos-modal .modal-close-btn').forEach(btn => btn.addEventListener('click', () => toggleModal('sos-modal', false)));
    document.getElementById('share-trip-btn')?.addEventListener('click', () => toggleModal('share-trip-modal', true));
    document.querySelectorAll('#share-trip-modal .modal-close-btn').forEach(btn => btn.addEventListener('click', () => toggleModal('share-trip-modal', false)));
    document.getElementById('start-sharing-btn')?.addEventListener('click', () => {
        isSharingTrip = !isSharingTrip;
        const btn = document.getElementById('start-sharing-btn');
        const shareTripIcon = document.getElementById('share-trip-btn');
        if (btn) {
             btn.innerHTML = isSharingTrip ? `<span class="material-icons">stop_circle</span> <span data-lang-key="stop_sharing">${translate('stop_sharing')}</span>` : `<span class="material-icons">wifi_tethering</span> <span data-lang-key="start_sharing">${translate('start_sharing')}</span>`;
        }
        if (shareTripIcon) {
            shareTripIcon.classList.toggle('active', isSharingTrip);
        }
        toggleModal('share-trip-modal', false);
    });

    // Proactive Alert
    document.getElementById('alert-close-btn')?.addEventListener('click', () => {
        document.getElementById('proactive-alert')?.classList.add('hidden');
    });
    document.getElementById('alert-ask-ai-btn')?.addEventListener('click', () => {
        document.getElementById('proactive-alert')?.classList.add('hidden');
        toggleModal('ai-chat-modal', true);
        // Pre-fill chat with context
        const chatInput = document.getElementById('chat-input') as HTMLInputElement;
        if (chatInput && currentAlertMessageKey) {
             chatInput.value = translate(currentAlertMessageKey);
             handleChatSubmit();
        }
    });

    // Unlock audio on first user interaction
    document.body.addEventListener('click', unlockAudio, { once: true });
    document.body.addEventListener('keydown', unlockAudio, { once: true });
    
    // Voice response toggle
    const voiceToggle = document.getElementById('toggle-voice-response') as HTMLInputElement;
    isVoiceResponseEnabled = voiceToggle.checked;
    voiceToggle.addEventListener('change', () => {
        isVoiceResponseEnabled = voiceToggle.checked;
        if (!isVoiceResponseEnabled) {
            SpeechSynthesis.cancel(); // Stop any ongoing speech
        }
    });
    
    // Start simulations
    setInterval(simulateDriverEmotion, 15000);
    setInterval(simulateVehicleOBD, 5000);
    setInterval(simulateGPS, 2000);
    
    // Initial state setup
    updateAppMode('driving');
    document.getElementById('display-panel')?.classList.add('collapsed');
});