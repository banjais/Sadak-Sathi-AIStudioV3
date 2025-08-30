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

    type FeatureGroup = any;
    type Marker = any;
    type Polyline = any;
    type LatLng = any;
    type LatLngBounds = any;
}
declare var L: any;
// Web Speech API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
            { id: 1, name: "Maitighar Mandala", lat: 27.693, lng: 85.322, type: 'poi', status: 'Good condition', category: 'landmark' },
            { id: 2, name: "Thapathali Bridge", lat: 27.691, lng: 85.316, type: 'bridge', status: 'Under maintenance', category: 'bridge' },
            { id: 5, name: "Patan Hospital", lat: 27.671, lng: 85.318, type: 'poi', status: 'Open 24/7', category: 'hospital' },
            { id: 6, name: "Himalayan Java Coffee", lat: 27.695, lng: 85.320, type: 'poi', status: 'Open', category: 'coffee shop' },
            { id: 7, name: "Civil Mall", lat: 27.699, lng: 85.314, type: 'poi', status: 'Open', category: 'shopping' }
        ]);
    },
    getIncidents: async (): Promise<any[]> => {
        console.log("API: Fetching Incidents...");
        await new Promise(resolve => setTimeout(resolve, 100));
        return Promise.resolve([
             { id: 3, name: "Traffic Jam at Baneshwor", lat: 27.693, lng: 85.341, type: 'incident', status: 'incident', category: 'traffic' },
             { id: 4, name: "Road construction", lat: 27.685, lng: 85.320, type: 'incident', status: 'incident', category: 'construction' }
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
let routePreferences = {
    preferHighways: false,
    avoidTolls: false,
    preferScenic: false
};
let recognition: any | null = null;
let isListening = false;

// =================================================================================
// Internationalization (i18n)
// =================================================================================
const translations = {
    en: {
        route_preferences: "Route Preferences", prefer_highways: "Prefer Highways", avoid_tolls: "Avoid Tolls",
        prefer_scenic_route: "Prefer Scenic Route", layers: "Layers", roads: "Roads", pois: "Points of Interest",
        incidents: "Incidents", display_panel_title: "Nearby Information", route_finder: "Route Finder",
        find_route_btn: "Find Optimal Route", clear_route_btn: "Clear Route", share_route: "Share Route",
        ai_chat_title: "AI Assistant", ai_chat_placeholder: "Type a message...", menu_settings: "Settings",
        menu_dashboard: "Dashboard", ai_voice_response: "AI Voice Response",
        select_mode: "Select Mode", mode_driving: "Driving", mode_riding: "Riding", mode_exploring: "Exploring",
        mode_connect: "Connect", emergency_sos: "Emergency SOS", sos_message: "Sending your location to emergency contacts...",
        share_trip: "Share Trip", share_trip_desc: "Share a live link of your journey with friends and family.",
        start_sharing: "Start Sharing", sharing_active: "Live location sharing is active.",
        stop_sharing: "Stop Sharing", menu_sos: "SOS", menu_share_trip: "Share Trip"
    },
    np: {
        route_preferences: "मार्ग प्राथमिकताहरू", prefer_highways: "राजमार्गहरू प्राथमिकता दिनुहोस्",
        avoid_tolls: "टोलहरू बेवास्ता गर्नुहोस्", prefer_scenic_route: "रमणीय मार्ग प्राथमिकता दिनुहोस्",
        layers: "तहहरू", roads: "सडकहरू", pois: "चासोका ठाउँहरू", incidents: "घटनाहरू",
        display_panel_title: "नजिकैको जानकारी", route_finder: "मार्ग खोजकर्ता", find_route_btn: "उत्तम मार्ग खोज्नुहोस्",
        clear_route_btn: "मार्ग हटाउनुहोस्", share_route: "मार्ग साझा गर्नुहोस्", ai_chat_title: "एआई सहायक",
        ai_chat_placeholder: "सन्देश टाइप गर्नुहोस्...", menu_settings: "सेटिङहरू", menu_dashboard: "ड्यासबोर्ड",
        ai_voice_response: "एआई आवाज प्रतिक्रिया", select_mode: "मोड चयन गर्नुहोस्", mode_driving: "ड्राइभिङ",
        mode_riding: "राइडिङ", mode_exploring: "अन्वेषण", mode_connect: "कनेक्ट", emergency_sos: "आपतकालीन एसओएस",
        sos_message: "तपाईंको स्थान आपतकालीन सम्पर्कहरूमा पठाइँदैछ...", share_trip: "यात्रा साझा गर्नुहोस्",
        share_trip_desc: "आफ्नो यात्राको प्रत्यक्ष लिङ्क साथीहरू र परिवारसँग साझा गर्नुहोस्।",
        start_sharing: "साझा गर्न सुरु गर्नुहोस्", sharing_active: "प्रत्यक्ष स्थान साझा सक्रिय छ।",
        stop_sharing: "साझा गर्न रोक्नुहोस्", menu_sos: "एसओएस", menu_share_trip: "यात्रा साझा"
    },
    // Add other languages similarly...
    hi: {
        route_preferences: "मार्ग प्राथमिकताएं", prefer_highways: "राजमार्गों को प्राथमिकता दें", avoid_tolls: "टोल से बचें",
        prefer_scenic_route: "दर्शनीय मार्ग को प्राथमिकता दें", layers: "परतें", roads: "सड़कें", pois: "रुचि के बिंदु",
        incidents: "घटनाएं", display_panel_title: "आस-पास की जानकारी", route_finder: "मार्ग खोजक", find_route_btn: "इष्टतम मार्ग खोजें",
        clear_route_btn: "मार्ग साफ़ करें", share_route: "मार्ग साझा करें", ai_chat_title: "एआई सहायक",
        ai_chat_placeholder: "एक संदेश टाइप करें...", menu_settings: "सेटिंग्स", menu_dashboard: "डैशबोर्ड",
        ai_voice_response: "एआई वॉयस रिस्पांस", select_mode: "मोड चुनें", mode_driving: "ड्राइविंग",
        mode_riding: "राइडिंग", mode_exploring: "अन्वेषण", mode_connect: "कनेक्ट", emergency_sos: "आपातकालीन एसओएस",
        sos_message: "आपका स्थान आपातकालीन संपर्कों को भेजा जा रहा है...", share_trip: "यात्रा साझा करें",
        share_trip_desc: "अपनी यात्रा का एक लाइव लिंक दोस्तों और परिवार के साथ साझा करें।",
        start_sharing: "साझा करना शुरू करें", sharing_active: "लाइव लोकेशन शेयरिंग सक्रिय है।",
        stop_sharing: "साझा करना बंद करें", menu_sos: "एसओएस", menu_share_trip: "यात्रा साझा करें"
    },
};

// =================================================================================
// Speech Synthesis (Text-to-Speech) - Self-Healing Queuing System
// =================================================================================
let availableVoices: SpeechSynthesisVoice[] = [];
let speechQueue: string[] = [];
let isSpeechEngineBusy = false;
let speechWatchdog: number | null = null; // Self-healing timer
let currentUtterance: SpeechSynthesisUtterance | null = null;

const voicesReadyPromise = new Promise<void>(resolve => {
    const checkVoices = () => {
        availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            console.log(`${availableVoices.length} speech synthesis voices loaded and ready.`);
            resolve();
            return true;
        }
        return false;
    };
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = checkVoices;
    }
    if (!checkVoices()) {
        setTimeout(() => {
            if(!checkVoices()) {
               console.warn("Speech synthesis voices did not load within the timeout. Speech may not work correctly.");
               resolve();
            }
        }, 1000);
    }
});

const cleanupAndProceed = () => {
    if (speechWatchdog) {
        clearTimeout(speechWatchdog);
        speechWatchdog = null;
    }

    if (currentUtterance) {
        currentUtterance.onend = null;
        currentUtterance.onerror = null;
        currentUtterance = null;
    }

    isSpeechEngineBusy = false;
    setTimeout(processSpeechQueue, 100); // Process next item
};


const processSpeechQueue = async () => {
    if (isSpeechEngineBusy || speechQueue.length === 0) {
        return;
    }

    // Safeguard: If the browser engine is stuck in a speaking state, wait.
    if (window.speechSynthesis.speaking) {
        setTimeout(processSpeechQueue, 250);
        return;
    }

    isSpeechEngineBusy = true;
    const text = speechQueue.shift();
    if (!text) {
        cleanupAndProceed();
        return;
    }

    try {
        await voicesReadyPromise;
        const utterance = new SpeechSynthesisUtterance(text);
        currentUtterance = utterance;

        const langMap: { [key: string]: string } = {
            en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR',
            de: 'de-DE', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
            new: 'ne-NP', // Fallback for Newari
            mai: 'hi-IN'  // Fallback for Maithili
        };
        const targetLang = langMap[currentLang] || 'en-US';

        // Re-fetch voices to be safe, as list can be populated asynchronously.
        availableVoices = window.speechSynthesis.getVoices();

        let voice = null;
        if (availableVoices.length > 0) {
            voice = availableVoices.find(v => v.lang === targetLang) ||
                    availableVoices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
        }

        // Assign the found voice, or if none is found for a non-English language,
        // log a warning and skip speaking to prevent errors.
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else if (!targetLang.startsWith('en')) {
            console.warn(`Speech synthesis voice for '${targetLang}' not found on this system. Skipping audio output for this message.`);
            cleanupAndProceed();
            return; // Exit without calling .speak()
        }

        utterance.rate = 1.0;
        utterance.pitch = 1;

        utterance.onend = () => cleanupAndProceed();
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            let detailedError = `SpeechSynthesisUtterance.onerror: ${event.error}`;
            if (event.error === 'not-allowed') {
                detailedError += ". This is a browser security feature. Audio playback requires a user gesture (like a click) to start. The voice feature will be disabled for this session to prevent repeated errors.";
                isVoiceResponseEnabled = false;
                const voiceToggle = document.getElementById('toggle-voice-response') as HTMLInputElement;
                if (voiceToggle) {
                    voiceToggle.checked = false;
                    localStorage.setItem('isVoiceResponseEnabled', 'false');
                }
            }

            console.error(
                detailedError,
                {
                    text: utterance.text.substring(0, 100) + '...',
                    langRequested: targetLang,
                    voiceFound: voice ? `${voice.name} (${voice.lang})` : 'none',
                }
            );
            window.speechSynthesis.cancel(); // Force reset on error
            cleanupAndProceed();
        };

        speechWatchdog = window.setTimeout(() => {
            console.warn("Speech synthesis watchdog triggered. Engine may have hung. Forcing reset.");
            window.speechSynthesis.cancel(); // Force reset
            cleanupAndProceed();
        }, 15000);

        window.speechSynthesis.resume(); // Harmless resume call to wake up engine
        window.speechSynthesis.speak(utterance);

    } catch (e) {
        console.error("Critical error in speech processing pipeline:", e);
        window.speechSynthesis.cancel();
        cleanupAndProceed();
    }
};

const splitTextIntoChunks = (text: string, chunkSize = 150): string[] => {
    if (text.length <= chunkSize) { return [text]; }
    const chunks: string[] = [];
    let remainingText = text;
    while (remainingText.length > 0) {
        if (remainingText.length <= chunkSize) { chunks.push(remainingText); break; }
        let splitPos = -1;
        const punctuation = ['.', '?', '!', ';'];
        for (const p of punctuation) {
            const pos = remainingText.lastIndexOf(p, chunkSize);
            if (pos > splitPos) { splitPos = pos; }
        }
        if (splitPos === -1) { splitPos = remainingText.lastIndexOf(' ', chunkSize); }
        if (splitPos === -1) { splitPos = chunkSize -1; }
        chunks.push(remainingText.substring(0, splitPos + 1));
        remainingText = remainingText.substring(splitPos + 1).trim();
    }
    return chunks;
};


const speakText = (text: string) => {
    if (!isAudioUnlocked || !isVoiceResponseEnabled || !('speechSynthesis' in window) || !text) return;
    const sanitizedText = text.replace(/[*_`]/g, '');
    const chunks = splitTextIntoChunks(sanitizedText);
    chunks.forEach(chunk => speechQueue.push(chunk));
    processSpeechQueue();
};


const cancelSpeech = () => {
    speechQueue.length = 0; // Clear pending items
    window.speechSynthesis.cancel(); // Force reset of current item
    cleanupAndProceed();
};

const t = (key: string): string => {
    return (translations as any)[currentLang]?.[key] || (translations as any)['en']?.[key] || key;
};

document.addEventListener('DOMContentLoaded', () => {
    /**
     * Finds and draws the optimal route on the map using the AI model.
     * This function is shared between the manual "Find Route" button and the AI chat command.
     * @param fromName The name of the starting point.
     * @param toName The name of the destination.
     * @returns A promise that resolves to an object indicating success and a message.
     */
    const calculateAndDrawRoute = async (fromName: string, toName: string): Promise<{ success: boolean; message: string }> => {
        const findRouteBtn = document.getElementById('find-route-btn') as HTMLButtonElement;
        const shareRouteBtn = document.getElementById('share-route-btn')!;
        const routeFinderPanel = document.getElementById('route-finder-panel')!;

        if (!fromName || !toName) {
            const message = "Please enter both a start and destination.";
            alert(message);
            return { success: false, message: message };
        }

        const fromPoi = allPois.find(p => p.name.toLowerCase() === fromName.toLowerCase());
        const toPoi = allPois.find(p => p.name.toLowerCase() === toName.toLowerCase());

        if (!fromPoi || !toPoi) {
            const message = "Could not find one or both locations. Please use exact names from the list.";
            alert(message);
            return { success: false, message: message };
        }

        findRouteBtn.textContent = "Calculating...";
        findRouteBtn.disabled = true;

        try {
            const prompt = `
                You are a route planning assistant for Kathmandu, Nepal. Your task is to select a sequence of named road segments to form the best route between two points, based on user preferences.

                Available Roads Data (as GeoJSON features):
                ${JSON.stringify(allRoadsData.features)}

                Start Point: "${fromName}" (approximately at [${fromPoi.lng}, ${fromPoi.lat}])
                End Point: "${toName}" (approximately at [${toPoi.lng}, ${toPoi.lat}])

                User Routing Preferences:
                - Prefer Highways: ${routePreferences.preferHighways}
                - Avoid Tolls: ${routePreferences.avoidTolls}
                - Prefer Scenic Route: ${routePreferences.preferScenic}

                Please determine the optimal route. Your response must be a JSON object with a single key "route", which is an array of the exact 'name' properties of the road features to use, in the correct sequential order.
                Example response: {"route": ["Prithvi Highway", "Local Road", "Araniko Highway"]}
            `;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    route: {
                        type: Type.ARRAY,
                        description: "An array of road names representing the route in sequential order.",
                        items: { type: Type.STRING, description: "The name of a road segment." }
                    }
                },
                required: ["route"]
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: responseSchema }
            });

            const result = JSON.parse(response.text);
            const roadNames: string[] = result.route;

            if (!roadNames || roadNames.length === 0) {
                const message = "The AI could not determine a route. Please try different locations or preferences.";
                alert(message);
                return { success: false, message: message };
            }

            const routeCoordinates: L.LatLng[] = [];
            roadNames.forEach(name => {
                const roadFeature = allRoadsData.features.find((f: any) => f.properties.name === name);
                if (roadFeature) {
                    const swappedCoords = roadFeature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as L.LatLng);
                    routeCoordinates.push(...swappedCoords);
                }
            });

            if (routeCoordinates.length === 0) {
                const message = "Could not find geometric data for the suggested route. Please check the data source.";
                alert(message);
                return { success: false, message: message };
            }

            if (routeLine) map.removeLayer(routeLine);
            if (routeStartMarker) map.removeLayer(routeStartMarker);
            if (routeEndMarker) map.removeLayer(routeEndMarker);

            routeLine = L.polyline(routeCoordinates, { color: '#3498db', weight: 8, opacity: 0.9, dashArray: '10, 5' }).addTo(map);

            const startIcon = L.divIcon({ html: `<span class="material-icons" style="font-size: 36px; color: ${getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim()};">location_on</span>`, className: 'route-marker-icon', iconSize: [36, 36], iconAnchor: [18, 36] });
            const endIcon = L.divIcon({ html: `<span class="material-icons" style="font-size: 36px; color: ${getComputedStyle(document.documentElement).getPropertyValue('--danger-color').trim()};">flag</span>`, className: 'route-marker-icon', iconSize: [36, 36], iconAnchor: [5, 36] });

            routeStartMarker = L.marker([fromPoi.lat, fromPoi.lng], { icon: startIcon }).addTo(map).bindPopup(`<b>Start:</b> ${fromPoi.name}`);
            routeEndMarker = L.marker([toPoi.lat, toPoi.lng], { icon: endIcon }).addTo(map).bindPopup(`<b>Destination:</b> ${toPoi.name}`);

            const bounds = L.latLngBounds(routeCoordinates);
            map.fitBounds(bounds.pad(0.2));

            shareRouteBtn.classList.remove('hidden');
            routeFinderPanel.classList.add('hidden');

            return { success: true, message: `Route from ${fromName} to ${toName} displayed.` };

        } catch (error) {
            console.error("Error finding AI route:", error);
            const message = "An error occurred while finding the route. Please try again.";
            alert(message);
            return { success: false, message: message };
        } finally {
            findRouteBtn.textContent = t('find_route_btn');
            findRouteBtn.disabled = false;
        }
    };

    const updateLanguage = (lang: string) => {
        currentLang = lang;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (key) el.textContent = t(key);
        });
        document.querySelectorAll<HTMLInputElement>('[data-lang-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-key-placeholder');
            if (key) el.placeholder = t(key);
        });
    };
    
    const init = () => {
        setupMap();
        loadData();
        setupEventListeners();
        setupAIChat();
        simulateGpsStatus();
        setupCockpitWidgets();
        simulateWeather();
        simulateUserLocation();
        simulateDriverEmotion();
        simulateVehicleOBD();

        const savedLang = localStorage.getItem('appLanguage') || 'en';
        (document.getElementById('language-select') as HTMLSelectElement).value = savedLang;
        updateLanguage(savedLang);

        const savedVoicePref = localStorage.getItem('isVoiceResponseEnabled');
        isVoiceResponseEnabled = savedVoicePref !== null ? savedVoicePref === 'true' : true;
        (document.getElementById('toggle-voice-response') as HTMLInputElement).checked = isVoiceResponseEnabled;

        const savedMode = localStorage.getItem('appMode') as typeof currentAppMode || 'driving';
        updateAppMode(savedMode);

        const savedPrefs = localStorage.getItem('routePreferences');
        if (savedPrefs) {
            routePreferences = JSON.parse(savedPrefs);
            (document.getElementById('pref-highways') as HTMLInputElement).checked = routePreferences.preferHighways;
            (document.getElementById('pref-no-tolls') as HTMLInputElement).checked = routePreferences.avoidTolls;
            (document.getElementById('pref-scenic') as HTMLInputElement).checked = routePreferences.preferScenic;
        }
    };

    const setupMap = () => {
        map = L.map('map', { zoomControl: false }).setView([27.7, 85.3], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        const zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map);
        document.getElementById('map-overlays-bottom-right')?.appendChild(zoomControl.getContainer());
        poisLayer = L.featureGroup().addTo(map);
        incidentsLayer = L.featureGroup().addTo(map);
    };

    const loadData = async () => {
        allRoadsData = await api.getRoads();
        roadsLayer = L.geoJSON(allRoadsData, { style: (f) => ({ color: f.properties.status === 'good' ? "#2ecc71" : f.properties.status === 'fair' ? "#f39c12" : "#e74c3c", weight: 5, dashArray: f.properties.status === 'poor' ? '5, 10' : undefined }) }).bindPopup(l => l.feature.properties.name).addTo(map);
        allPois = await api.getPOIs();
        allIncidents = await api.getIncidents();
        renderPois(allPois);
        renderIncidents(allIncidents);
        updateDisplayPanel([...allPois, ...allIncidents]);
        setupDisplayPanelFilters();
    };
    
    const renderPois = (pois: any[]) => { poisLayer.clearLayers(); pois.forEach(p => L.marker([p.lat, p.lng]).addTo(poisLayer).bindPopup(`<b>${p.name}</b><br>${p.status}`)); };
    const renderIncidents = (incidents: any[]) => { incidentsLayer.clearLayers(); incidents.forEach(i => L.marker([i.lat, i.lng]).addTo(incidentsLayer).bindPopup(`<b>${i.name}</b>`)); };

    const setupDisplayPanelFilters = () => {
        const filtersContainer = document.getElementById('display-panel-filters')!;
        filtersContainer.innerHTML = '';
        const allItems = [...allPois, ...allIncidents];
        const categories = ['All', ...Array.from(new Set(allItems.map(item => item.category)))];
        const categoryToIconMap: { [key: string]: string } = { 'All': 'apps', 'landmark': 'account_balance', 'bridge': 'commit', 'hospital': 'local_hospital', 'coffee shop': 'local_cafe', 'shopping': 'shopping_cart', 'traffic': 'traffic', 'construction': 'construction' };
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.innerHTML = `<span class="material-icons">${categoryToIconMap[category] || 'place'}</span>`;
            button.dataset.category = category;
            button.title = category.charAt(0).toUpperCase() + category.slice(1);
            if (category === 'All') button.classList.add('active');
            button.addEventListener('click', () => {
                filtersContainer.querySelector('.filter-btn.active')?.classList.remove('active');
                button.classList.add('active');
                updateDisplayPanel(category === 'All' ? allItems : allItems.filter(item => item.category === category));
            });
            filtersContainer.appendChild(button);
        });
    };

    const updateDisplayPanel = (items: any[]) => {
        const listEl = document.getElementById('display-panel-list')!;
        listEl.innerHTML = items.length === 0 ? '<p style="text-align: center; padding: 1rem;">No items found.</p>' : '';
        items.sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `<h3>${item.name}</h3><p>${item.category}</p><span class="card-status ${item.status.toLowerCase().replace(/\s/g, '-')}">${item.status}</span>`;
            card.onclick = () => map.flyTo([item.lat, item.lng], 16);
            listEl.appendChild(card);
        });
    };
    
    const addMessageToChat = (message: string, sender: 'user' | 'ai') => {
        const chatMessagesContainer = document.getElementById('chat-messages') as HTMLElement;
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender === 'ai' ? 'ai-message' : 'user-message');
        messageEl.innerHTML = `<p>${message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`;
        chatMessagesContainer.appendChild(messageEl);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        if (sender === 'ai' && !message.startsWith("Searching for")) {
            speakText(message);
        }
    };

    const setupAIChat = () => {
        const chatForm = document.getElementById('chat-form') as HTMLFormElement;
        const chatInput = document.getElementById('chat-input') as HTMLInputElement;
        const typingIndicator = document.getElementById('typing-indicator') as HTMLElement;
        const voiceCommandBtn = document.getElementById('voice-command-btn') as HTMLButtonElement;

        // --- Voice Command Implementation ---
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API not supported in this browser.");
            voiceCommandBtn.style.display = 'none';
        } else {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onstart = () => {
                isListening = true;
                voiceCommandBtn.classList.add('listening');
                voiceCommandBtn.setAttribute('aria-label', 'Stop listening');
            };

            recognition.onend = () => {
                isListening = false;
                voiceCommandBtn.classList.remove('listening');
                voiceCommandBtn.setAttribute('aria-label', 'Use microphone');
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                isListening = false;
                voiceCommandBtn.classList.remove('listening');
                voiceCommandBtn.setAttribute('aria-label', 'Use microphone');
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    chatInput.value = finalTranscript;
                }
            };
            
            voiceCommandBtn.addEventListener('click', () => {
                if (isListening) {
                    recognition.stop();
                } else {
                    const speechLangMap: { [key: string]: string } = { en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', new: 'ne-NP', mai: 'hi-IN' };
                    recognition.lang = speechLangMap[currentLang] || 'en-US';
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Could not start recognition service:", e);
                    }
                }
            });
        }
        // --- End of Voice Command Implementation ---


        const tools: Tool[] = [{
            functionDeclarations: [
                {
                    name: "googleSearch",
                    description: "Search for information about specific points of interest (POIs) and incidents in the local Kathmandu area.",
                    parameters: { type: Type.OBJECT, properties: { searchQuery: { type: Type.STRING, description: "The name of the place or incident to search for (e.g., 'Thapathali Bridge')." } }, required: ["searchQuery"] }
                },
                {
                    name: "findRoute",
                    description: "Finds and displays the optimal route between two specified locations on the map. Use this for requests like 'directions from A to B'.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            startLocation: { type: Type.STRING, description: "The starting point of the route (e.g., 'Maitighar Mandala')." },
                            endLocation: { type: Type.STRING, description: "The destination of the route (e.g., 'Civil Mall')." }
                        },
                        required: ["startLocation", "endLocation"]
                    }
                }
            ]
        }];

        const googleSearch = ({ searchQuery }: { searchQuery: string }) => {
            const results = [...allPois, ...allIncidents].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
            return { results: results.length > 0 ? results.map(r => ({ name: r.name, category: r.category, status: r.status })) : `No information found for "${searchQuery}".` };
        };

        const findRoute = ({ startLocation, endLocation }: { startLocation: string; endLocation: string; }) => {
            (document.getElementById('from-input') as HTMLInputElement).value = startLocation;
            (document.getElementById('to-input') as HTMLInputElement).value = endLocation;
            setTimeout(() => {
                calculateAndDrawRoute(startLocation, endLocation);
            }, 100);
            return { result: `Okay, planning the route from ${startLocation} to ${endLocation}.` };
        };

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userInput = chatInput.value.trim();
            if (!userInput) return;
            cancelSpeech();
            addMessageToChat(userInput, 'user');
            chatInput.value = '';
            typingIndicator.classList.remove('hidden');
            try {
                if (!activeChat) {
                     activeChat = ai.chats.create({ model: 'gemini-2.5-flash', config: { tools: tools, systemInstruction: `You are a helpful and proactive road assistant for Nepal called Sadak Sathi. The user is currently in '${currentAppMode}' mode. Tailor your responses accordingly. Use 'googleSearch' for specific location info and 'findRoute' to plan routes on the map. You will also receive automated system alerts about driver status and vehicle health; address these proactively.` } });
                }
                let response: GenerateContentResponse = await activeChat.sendMessage({ message: userInput });
                let functionCalled = false;
                while (true) {
                    const functionCall = response.candidates?.[0]?.content?.parts[0]?.functionCall;
                    if (!functionCall) break;
                    functionCalled = true;
                    let result;
                    if (functionCall.name === 'googleSearch') {
                        const args = functionCall.args as { searchQuery: string };
                        addMessageToChat(`Searching for '${args.searchQuery}'...`, 'ai');
                        result = googleSearch(args);
                    } else if (functionCall.name === 'findRoute') {
                        const args = functionCall.args as { startLocation: string; endLocation: string; };
                        addMessageToChat(`Okay, planning a route from ${args.startLocation} to ${args.endLocation}.`, 'ai');
                        result = findRoute(args);
                    } else {
                        break;
                    }

                    response = await activeChat.sendMessage({ contents: { parts: [{ functionResponse: { name: functionCall.name, response: result } }] } });
                }
                const responseText = response.text.trim();
                if (responseText) {
                    addMessageToChat(responseText, 'ai');
                } else if (functionCalled) {
                    addMessageToChat("Done!", 'ai');
                }
            } catch (error) {
                console.error("AI Chat Error:", error);
                addMessageToChat("Sorry, I'm having trouble connecting right now.", 'ai');
            } finally {
                typingIndicator.classList.add('hidden');
            }
        });
    };
    
    const triggerAIAlert = (message: string) => {
        (document.getElementById('ai-chat-modal') as HTMLElement).classList.remove('hidden');
        addMessageToChat(message, 'ai');
        if (activeChat) {
            (async () => {
                try {
                    const response = await activeChat.sendMessage({ message: `System Alert Triggered: ${message}. How should I respond to the user?` });
                    addMessageToChat(response.text, 'ai');
                } catch (error) { console.error("Error sending system alert to AI:", error); }
            })();
        }
    };

    const updateGpsStatus = (status: 'searching' | 'connected' | 'lost') => {
        const indicator = document.getElementById('gps-status-indicator');
        if (indicator) { indicator.className = status; indicator.title = `GPS Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`; }
    };

    const simulateGpsStatus = () => {
        const states: ('searching' | 'connected' | 'lost')[] = ['searching', 'connected', 'lost'];
        let i = 0;
        const cycle = () => {
            const status = states[i];
            updateGpsStatus(status);
            i = (i + 1) % states.length;
            setTimeout(cycle, status === 'connected' ? 10000 : 4000);
        };
        cycle();
    };

    const setupCockpitWidgets = () => {
        let speed = 0, heading = 0;
        const speedEl = document.querySelector('#speed-widget .value'), compassEl = document.querySelector('#compass-widget .compass-rose');
        if (!speedEl || !compassEl) return;
        const degToCard = (d: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'][Math.round(d / 45)];
        setInterval(() => {
            speed = Math.max(0, Math.min(85, speed + (Math.random() - 0.45) * 10));
            heading = (heading + (Math.random() - 0.5) * 20 + 360) % 360;
            speedEl.textContent = Math.round(speed).toString();
            compassEl.textContent = degToCard(heading);
        }, 2500);
    };

    const simulateWeather = () => {
        const iconEl = document.getElementById('weather-icon'), tempEl = document.getElementById('weather-temp');
        if (!iconEl || !tempEl) return;
        const states = [ { i: 'sunny', t: 28, c: 'sunny' }, { i: 'cloud', t: 24, c: 'cloudy' }, { i: 'thunderstorm', t: 21, c: 'stormy' }, { i: 'ac_unit', t: 18, c: 'cold' } ];
        let i = 0;
        const update = () => {
            const s = states[i];
            iconEl.textContent = s.i;
            tempEl.textContent = `${s.t}°C`;
            iconEl.className = 'material-icons ' + s.c;
            i = (i + 1) % states.length;
        };
        update();
        setInterval(update, 15000);
    };

    const simulateUserLocation = () => {
        const nameEl = document.getElementById('location-name'), coordsEl = document.getElementById('location-coords');
        if (!nameEl || !coordsEl) return;
        const locs = [ { n: "Thamel, Kathmandu", c: "27.71, 85.31" }, { n: "Patan Durbar Square", c: "27.67, 85.32" }, { n: "Boudhanath Stupa", c: "27.72, 85.36" } ];
        let i = 0;
        setInterval(() => {
            i = (i + 1) % locs.length;
            nameEl.textContent = locs[i].n;
            coordsEl.textContent = locs[i].c;
        }, 12000);
    };
    
    const simulateDriverEmotion = () => {
        const iconEl = document.getElementById('driver-status-icon'), textEl = document.getElementById('driver-status-text');
        if (!iconEl || !textEl) return;
        const states = [ { s: 'Calm', i: 'sentiment_very_satisfied', d: 20000, a: null }, { s: 'Tired', i: 'sentiment_dissatisfied', d: 10000, a: "System Alert: Driver appears tired. It might be a good time to take a short break." }, { s: 'Calm', i: 'sentiment_very_satisfied', d: 20000, a: null }, { s: 'Stressed', i: 'sentiment_very_dissatisfied', d: 10000, a: "System Alert: Driver appears stressed. Consider pulling over for a moment." } ];
        let i = 0, alertSent = false;
        const cycle = () => {
            const s = states[i];
            iconEl.textContent = s.i;
            textEl.textContent = s.s;
            textEl.className = `status-text ${s.s.toLowerCase()}`;
            // if(s.a && !alertSent) { triggerAIAlert(s.a); alertSent = true; }
            const prev = i;
            i = (i + 1) % states.length;
            if (prev !== i) alertSent = false;
            setTimeout(cycle, s.d);
        };
        cycle();
    };

    const simulateVehicleOBD = () => {
        let f = 85, t = 90, p = 32, fA = false, pA = false;
        const fV = document.getElementById('fuel-value'), fB = document.getElementById('fuel-bar'), tV = document.getElementById('temp-value'), tB = document.getElementById('temp-bar'), pV = document.getElementById('pressure-value'), pB = document.getElementById('pressure-bar');
        if(!fV || !fB || !tV || !tB || !pV || !pB) return;
        setInterval(() => {
            f = Math.max(0, f - Math.random()*0.5); t = Math.max(70, Math.min(120, t + (Math.random()-0.5)*2)); p = Math.max(20, p-Math.random()*0.1);
            fV.textContent = `${Math.round(f)}%`; fB.style.width = `${f}%`; tV.textContent = `${Math.round(t)}°C`; tB.style.width = `${((t - 70) / 50) * 100}%`; pV.textContent = `${Math.round(p)} PSI`; pB.style.width = `${((p-20)/15)*100}%`;
            fB.className = `progress-bar ${f > 20 ? 'bar-good' : f > 10 ? 'bar-warn' : 'bar-danger'}`; tB.className = `progress-bar ${t < 105 ? 'bar-good' : t < 115 ? 'bar-warn' : 'bar-danger'}`; pB.className = `progress-bar ${p > 28 ? 'bar-good' : p > 25 ? 'bar-warn' : 'bar-danger'}`;
            // if (f < 15 && !fA) { triggerAIAlert("System Alert: Fuel level is critically low. I can search for nearby petrol stations."); fA = true; } else if (f > 20) fA = false;
            // if (p < 26 && !pA) { triggerAIAlert("System Alert: Tire pressure is low. I can find the nearest repair shop for you."); pA = true; } else if (p > 28) pA = false;
        }, 3000);
    };

    const updateAppMode = (mode: typeof currentAppMode) => {
        currentAppMode = mode;
        const appContainer = document.getElementById('app-container')!;
        appContainer.dataset.mode = mode;
        localStorage.setItem('appMode', mode);

        const modeBtn = document.getElementById('app-mode-btn')!;
        const iconEl = modeBtn.querySelector('.material-icons')!;
        const labelEl = modeBtn.querySelector('.label')!;
        
        const modeConfig = {
            driving: { icon: 'directions_car', labelKey: 'mode_driving' },
            riding: { icon: 'person', labelKey: 'mode_riding' },
            exploring: { icon: 'explore', labelKey: 'mode_exploring' },
            connect: { icon: 'group', labelKey: 'mode_connect' }
        };

        iconEl.textContent = modeConfig[mode].icon;
        labelEl.setAttribute('data-lang-key', modeConfig[mode].labelKey);
        labelEl.textContent = t(modeConfig[mode].labelKey);
        
        // Toggle contextual buttons
        document.getElementById('dashboard-btn')!.classList.toggle('hidden', mode !== 'driving');
        const isSosVisible = mode === 'riding' || mode === 'exploring' || mode === 'connect';
        document.getElementById('sos-btn')!.classList.toggle('hidden', !isSosVisible);
        document.getElementById('share-trip-btn')!.classList.toggle('hidden', mode !== 'connect');
    };

    const handleShareTrip = async () => {
        const shareBtn = document.getElementById('share-trip-btn')!;
        const shareModal = document.getElementById('share-trip-modal')!;
        const startContent = document.getElementById('start-sharing-content')!;
        const stopContent = document.getElementById('stop-sharing-content')!;
        
        if (isSharingTrip) { // Stop sharing
            isSharingTrip = false;
            shareBtn.classList.remove('active');
            startContent.classList.remove('hidden');
            stopContent.classList.add('hidden');
            shareModal.classList.add('hidden');
        } else { // Start sharing
            const shareData = {
                title: 'Sadak Sathi Live Trip',
                text: "I'm sharing my live trip with you. Follow my journey!",
                url: `https://sadak-sathi.example.com/trip/${Date.now()}` // Dummy URL
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    isSharingTrip = true;
                    shareBtn.classList.add('active');
                    startContent.classList.add('hidden');
                    stopContent.classList.remove('hidden');
                } catch (err) { console.error("Could not share trip:", err); }
            } else { alert("Web Share API not supported on this browser."); }
        }
    };
    
    const setupEventListeners = () => {
        const unlockSpeechSynthesis = () => {
            if (window.speechSynthesis && !isAudioUnlocked) {
                const utterance = new SpeechSynthesisUtterance("");
                utterance.volume = 0;
                window.speechSynthesis.speak(utterance);
                isAudioUnlocked = true;
                console.log("Audio context for speech synthesis unlocked by user gesture.");
            }
        };
        document.addEventListener('click', unlockSpeechSynthesis, { once: true });
        document.addEventListener('touchend', unlockSpeechSynthesis, { once: true });

        const langSelect = document.getElementById('language-select') as HTMLSelectElement;
        langSelect.addEventListener('change', (e) => {
            const lang = (e.target as HTMLSelectElement).value;
            updateLanguage(lang);
            localStorage.setItem('appLanguage', lang);
        });

        const themeToggle = document.getElementById('theme-toggle')!;
        const appContainer = document.getElementById('app-container')!;
        const themeIcon = themeToggle.querySelector('.material-icons')!;

        const applyTheme = (theme: string) => {
            appContainer.dataset.theme = theme;
            themeIcon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
            localStorage.setItem('appTheme', theme);
        };

        const currentTheme = localStorage.getItem('appTheme') || 'light';
        applyTheme(currentTheme);

        themeToggle.addEventListener('click', () => {
            const newTheme = appContainer.dataset.theme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });

        const settingsPanel = document.getElementById('settings-panel')!;
        const hamburgerMenu = document.getElementById('hamburger-menu')!;
        hamburgerMenu.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
            hamburgerMenu.querySelector('.blinking-dot')?.classList.add('hide');
        });
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target as Node) && !hamburgerMenu.contains(e.target as Node)) {
                settingsPanel.classList.remove('open');
            }
        });

        (document.getElementById('ai-assistant') as HTMLButtonElement).addEventListener('click', () => {
            (document.getElementById('ai-chat-modal') as HTMLElement).classList.remove('hidden');
        });
        (document.getElementById('ai-chat-close') as HTMLButtonElement).addEventListener('click', () => {
             (document.getElementById('ai-chat-modal') as HTMLElement).classList.add('hidden');
             cancelSpeech();
             if (recognition && isListening) {
                recognition.stop();
             }
        });

        const routeFinderPanel = document.getElementById('route-finder-panel')!;
        document.getElementById('route-finder-trigger')?.addEventListener('click', () => routeFinderPanel.classList.remove('hidden'));
        document.getElementById('route-finder-close')?.addEventListener('click', () => routeFinderPanel.classList.add('hidden'));
        
        const voiceResponseToggle = document.getElementById('toggle-voice-response') as HTMLInputElement;
        voiceResponseToggle.addEventListener('change', () => {
            isVoiceResponseEnabled = voiceResponseToggle.checked;
            localStorage.setItem('isVoiceResponseEnabled', String(isVoiceResponseEnabled));
            if (!isVoiceResponseEnabled) cancelSpeech();
        });

        const displayPanel = document.getElementById('display-panel')!;
        displayPanel.querySelector('#display-panel-header')?.addEventListener('click', () => displayPanel.classList.toggle('collapsed'));
        displayPanel.classList.add('collapsed');

        document.getElementById('dashboard-btn')?.addEventListener('click', () => document.getElementById('driver-dashboard')?.classList.toggle('open'));

        (document.getElementById('toggle-roads') as HTMLInputElement).addEventListener('change', (e) => {
            if (roadsLayer) {
                map.hasLayer(roadsLayer) ? map.removeLayer(roadsLayer) : map.addLayer(roadsLayer);
            }
        });
        (document.getElementById('toggle-pois') as HTMLInputElement).addEventListener('change', (e) => {
            if (poisLayer) {
                map.hasLayer(poisLayer) ? map.removeLayer(poisLayer) : map.addLayer(poisLayer);
            }
        });
        (document.getElementById('toggle-incidents') as HTMLInputElement).addEventListener('change', (e) => {
            if (incidentsLayer) {
                map.hasLayer(incidentsLayer) ? map.removeLayer(incidentsLayer) : map.addLayer(incidentsLayer);
            }
        });

        // --- Route Preferences Implementation ---
        const prefHighways = document.getElementById('pref-highways') as HTMLInputElement;
        const prefNoTolls = document.getElementById('pref-no-tolls') as HTMLInputElement;
        const prefScenic = document.getElementById('pref-scenic') as HTMLInputElement;
        const updatePref = (key: keyof typeof routePreferences, value: boolean) => {
            routePreferences[key] = value;
            localStorage.setItem('routePreferences', JSON.stringify(routePreferences));
        };
        prefHighways.addEventListener('change', () => updatePref('preferHighways', prefHighways.checked));
        prefNoTolls.addEventListener('change', () => updatePref('avoidTolls', prefNoTolls.checked));
        prefScenic.addEventListener('change', () => updatePref('preferScenic', prefScenic.checked));


        // --- Route Finder Implementation (AI-Powered) ---
        const fromInput = document.getElementById('from-input') as HTMLInputElement;
        const toInput = document.getElementById('to-input') as HTMLInputElement;
        const findRouteBtn = document.getElementById('find-route-btn')! as HTMLButtonElement;
        const clearRouteBtn = document.getElementById('clear-route-btn')!;
        const shareRouteBtn = document.getElementById('share-route-btn')!;

        findRouteBtn.addEventListener('click', async () => {
            const fromName = fromInput.value.trim();
            const toName = toInput.value.trim();
            await calculateAndDrawRoute(fromName, toName);
        });

        clearRouteBtn.addEventListener('click', () => {
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
            shareRouteBtn.classList.add('hidden');
        });
        // --- END: Route Finder Implementation ---


        // New Mode Switching Event Listeners
        const appModeModal = document.getElementById('app-mode-modal')!;
        document.getElementById('app-mode-btn')?.addEventListener('click', () => appModeModal.classList.remove('hidden'));
        appModeModal.querySelectorAll('.mode-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode') as typeof currentAppMode;
                updateAppMode(mode);
                appModeModal.classList.add('hidden');
            });
        });
        document.getElementById('app-mode-modal-close')?.addEventListener('click', () => appModeModal.classList.add('hidden'));

        // New Feature Event Listeners
        const sosModal = document.getElementById('sos-modal')!;
        document.getElementById('sos-btn')?.addEventListener('click', () => sosModal.classList.remove('hidden'));
        document.getElementById('sos-modal-close')?.addEventListener('click', () => sosModal.classList.add('hidden'));

        const shareTripModal = document.getElementById('share-trip-modal')!;
        document.getElementById('share-trip-btn')?.addEventListener('click', () => shareTripModal.classList.remove('hidden'));
        document.getElementById('share-trip-modal-close')?.addEventListener('click', () => shareTripModal.classList.add('hidden'));
        document.getElementById('start-sharing-btn')?.addEventListener('click', handleShareTrip);
        document.getElementById('stop-sharing-btn')?.addEventListener('click', handleShareTrip);
    };

    init();
});