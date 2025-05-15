// Variables globales
let userLatitude;
let userLongitude;
let locationName = "Votre position";
let isLocating = false;
const STORAGE_KEY = "meteo-location"; // Clé pour le localStorage

// DOM Elements
const locationElement = document.getElementById("location");
const changeLocationBtn = document.getElementById("change-location-btn");
const refreshButton = document.getElementById("refresh-btn");
const currentWeatherContainer = document.getElementById("current-weather");
const hourlyForecastContainer = document.getElementById("hourly-forecast");
const dailyForecastContainer = document.getElementById("daily-forecast");
const loader = document.getElementById("loader");

// Événements
document.addEventListener("DOMContentLoaded", initApp);
refreshButton.addEventListener("click", refreshWeather);
changeLocationBtn.addEventListener("click", displayChangeLocationForm);

// Initialisation de l'application
function initApp() {
    // Vérifier s'il y a une ville sauvegardée
    const savedLocation = getSavedLocation();

    if (savedLocation) {
        // Vérifier que les données sauvegardées sont valides
        const { latitude, longitude, name } = savedLocation;

        if (name && latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
            userLatitude = latitude;
            userLongitude = longitude;
            locationName = name;

            locationElement.textContent = locationName;
            getWeatherData(userLatitude, userLongitude);
        } else {
            console.warn("Données de localisation sauvegardées invalides:", savedLocation);
            localStorage.removeItem(STORAGE_KEY);
            getUserLocation();
        }
    } else {
        getUserLocation();
    }
}

// Afficher le formulaire pour changer de ville
function displayChangeLocationForm() {
    // Sauvegarder l'état courant des conteneurs
    const currentHourlyForecast = hourlyForecastContainer.innerHTML;
    const currentDailyForecast = dailyForecastContainer.innerHTML;

    // Afficher le formulaire
    currentWeatherContainer.innerHTML = `
        <div class="location-fallback">
            <h3>Changer de ville</h3>
            <p>Entrez le nom de la ville pour laquelle vous souhaitez consulter la météo :</p>
            <div class="location-input-container">
                <input type="text" id="location-input" placeholder="Entrez une ville (ex: Paris)" class="location-input">
                <button id="location-submit" class="location-submit">Rechercher</button>
            </div>
            <button id="use-geolocation" class="use-geolocation-btn">Utiliser ma position actuelle</button>
            <button id="cancel-location-change" class="cancel-button">Annuler</button>
        </div>
    `;

    // Vider les prévisions
    hourlyForecastContainer.innerHTML = '';
    dailyForecastContainer.innerHTML = '';

    // Ajouter l'écouteur pour la recherche
    document.getElementById("location-submit").addEventListener("click", () => {
        searchAndSaveLocation();
    });

    // Ajouter l'écouteur pour la touche Entrée
    document.getElementById("location-input").addEventListener("keyup", event => {
        if (event.key === "Enter") {
            searchAndSaveLocation();
        }
    });

    // Ajouter l'écouteur pour utiliser la géolocation
    document.getElementById("use-geolocation").addEventListener("click", () => {
        // Supprimer les données sauvegardées
        localStorage.removeItem(STORAGE_KEY);
        // Relancer l'application avec la géolocation
        getUserLocation();
    });

    // Ajouter l'écouteur pour annuler
    document.getElementById("cancel-location-change").addEventListener("click", () => {
        // Restaurer l'affichage précédent
        getWeatherData(userLatitude, userLongitude);
    });
}

// Rechercher et sauvegarder la localisation
async function searchAndSaveLocation() {
    const locationInput = document.getElementById("location-input");
    const cityName = locationInput.value.trim();

    if (!cityName) return;

    loader.style.display = "flex";
    currentWeatherContainer.innerHTML = '';
    currentWeatherContainer.appendChild(loader);

    try {
        // Utiliser Nominatim pour obtenir les coordonnées à partir du nom de la ville
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);

        // Vérifier si la réponse est OK
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        // Vérifier le Content-Type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Réponse non-JSON: ${contentType}`);
        }

        // Analyser le JSON
        const text = await response.text();
        if (!text || text.trim() === '') {
            throw new Error("Réponse vide");
        }

        // Essayer de parser le JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Erreur lors du parsing JSON:", parseError, "Texte reçu:", text);
            throw new Error("Format de réponse invalide");
        }

        if (data && data.length > 0) {
            userLatitude = parseFloat(data[0].lat);
            userLongitude = parseFloat(data[0].lon);

            // S'assurer que les coordonnées sont valides
            if (isNaN(userLatitude) || isNaN(userLongitude)) {
                throw new Error("Coordonnées invalides");
            }

            // Extraire le nom de la ville
            locationName = data[0].display_name.split(',')[0];
            locationElement.textContent = locationName;

            // Sauvegarder la localisation
            saveLocation(locationName, userLatitude, userLongitude);

            // Obtenir les données météo
            getWeatherData(userLatitude, userLongitude);
        } else {
            throw new Error("Localisation non trouvée");
        }
    } catch (error) {
        console.error("Erreur lors de la recherche de localisation:", error);
        loader.style.display = "none";
        currentWeatherContainer.innerHTML = `
            <div class="error-message">
                <p>Impossible de trouver la localisation "${cityName}".</p>
                <p>Veuillez vérifier l'orthographe et réessayer.</p>
                <p class="error-details">${error.message}</p>
                <button id="retry-location" class="retry-button">Réessayer</button>
            </div>
        `;

        document.getElementById("retry-location").addEventListener("click", displayChangeLocationForm);
    }
}

// Sauvegarder la localisation dans le localStorage
function saveLocation(name, latitude, longitude) {
    const locationData = {
        name,
        latitude,
        longitude,
        timestamp: Date.now() // Pour savoir quand la donnée a été sauvegardée
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData));
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la localisation:", error);
    }
}

// Récupérer la localisation sauvegardée
function getSavedLocation() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return null;

        const data = JSON.parse(savedData);

        // Vérifier si les données ne sont pas trop anciennes (7 jours max)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
        const now = Date.now();

        if (data.timestamp && (now - data.timestamp > maxAge)) {
            console.log("Données de localisation expirées, suppression...");
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération de la localisation:", error);
        // En cas d'erreur, nettoyer le localStorage
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

// Obtenir la géolocalisation de l'utilisateur
function getUserLocation() {
    if (isLocating) return;

    isLocating = true;
    loader.style.display = "flex";

    if (navigator.geolocation) {
        try {
            const geoOptions = {
                enableHighAccuracy: true,
                timeout: 15000, // 15 secondes au lieu de 5
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                position => {
                    isLocating = false;
                    userLatitude = position.coords.latitude;
                    userLongitude = position.coords.longitude;
                    getLocationName(userLatitude, userLongitude);
                    getWeatherData(userLatitude, userLongitude);
                },
                error => {
                    isLocating = false;
                    console.error("Erreur de géolocalisation:", error);
                    handleLocationError(error);
                },
                geoOptions
            );

            // Ajouter un timeout de secours au cas où la géolocalisation ne répond pas
            setTimeout(() => {
                if (isLocating) {
                    isLocating = false;
                    displayLocationFallback();
                }
            }, 20000); // 20 secondes

        } catch (e) {
            isLocating = false;
            console.error("Exception lors de la géolocalisation:", e);
            displayLocationFallback();
        }
    } else {
        isLocating = false;
        locationElement.textContent = "La géolocalisation n'est pas prise en charge par votre navigateur";
        displayLocationFallback();
    }
}

// Afficher une interface de fallback pour saisir manuellement une localisation
function displayLocationFallback() {
    loader.style.display = "none";

    currentWeatherContainer.innerHTML = `
        <div class="location-fallback">
            <p>Impossible d'accéder à votre position. Veuillez saisir une ville :</p>
            <div class="location-input-container">
                <input type="text" id="location-input" placeholder="Entrez une ville (ex: Paris)" class="location-input">
                <button id="location-submit" class="location-submit">Rechercher</button>
            </div>
        </div>
    `;

    // Ajouter un écouteur d'événement pour le bouton de recherche
    document.getElementById("location-submit").addEventListener("click", searchAndSaveLocation);

    // Permettre de soumettre en appuyant sur Entrée
    document.getElementById("location-input").addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            searchAndSaveLocation();
        }
    });
}

// Obtenir le nom de l'emplacement à partir des coordonnées
async function getLocationName(lat, lon) {
    try {
        // Ajouter un paramètre format=json pour assurer une réponse JSON
        const response = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&format=json`);

        // Vérifier si la réponse est OK
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        // Vérifier le Content-Type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Réponse non-JSON: ${contentType}`);
        }

        // Analyser le JSON
        const text = await response.text(); // Récupérer d'abord le texte brut
        if (!text || text.trim() === '') {
            throw new Error("Réponse vide");
        }

        // Essayer de parser le JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Erreur lors du parsing JSON:", parseError, "Texte reçu:", text);
            throw new Error("Format de réponse invalide");
        }

        // Utiliser les données si valides
        if (data && data.address) {
            const address = data.address;
            locationName = address.city || address.town || address.village || address.municipality || "Localisation inconnue";
            locationElement.textContent = locationName;

            // Sauvegarder la localisation
            saveLocation(locationName, lat, lon);
        } else {
            // Si aucune adresse n'est trouvée, utiliser les coordonnées
            locationName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            locationElement.textContent = locationName;

            // Sauvegarder avec les coordonnées comme nom
            saveLocation(locationName, lat, lon);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du nom de l'emplacement:", error);

        // Utiliser un fallback avec les coordonnées
        locationName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        locationElement.textContent = locationName;

        // Sauvegarder quand même la position
        saveLocation(locationName, lat, lon);
    }
}

// Rafraîchir les données météo
function refreshWeather() {
    if (userLatitude && userLongitude) {
        loader.style.display = "flex";
        currentWeatherContainer.innerHTML = '';
        currentWeatherContainer.appendChild(loader);
        hourlyForecastContainer.innerHTML = '';
        dailyForecastContainer.innerHTML = '';
        getWeatherData(userLatitude, userLongitude);
    } else {
        getUserLocation();
    }
}

// Obtenir les données météo depuis l'API Open-Meteo
async function getWeatherData(latitude, longitude) {
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.error("Coordonnées invalides:", latitude, longitude);
        displayWeatherError("Coordonnées géographiques invalides. Veuillez réessayer ou saisir une ville manuellement.");
        return;
    }

    try {
        loader.style.display = "flex";

        const params = {
            latitude,
            longitude,
            current: ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "weather_code"].join(','),
            hourly: ["temperature_2m", "precipitation_probability", "precipitation", "weather_code", "cloud_cover"].join(','),
            daily: ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_sum", "precipitation_probability_max"].join(','),
            timezone: "auto",
            forecast_days: 5 // +1 pour le jour actuel et 4 jours à venir
        }

        let url = new URL('https://api.open-meteo.com/v1/forecast');
        for (const name of Object.keys(params)) {
            url.searchParams.append(name, params[name]);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const forecast = await response.json();

        // Vérifier si les données de forecast sont valides
        if (!forecast || !forecast.current || !forecast.hourly || !forecast.daily) {
            throw new Error("Format de données météo invalide ou incomplet");
        }

        displayCurrentWeather(forecast);
        displayHourlyForecast(forecast);
        displayDailyForecast(forecast);

        loader.style.display = "none";
    } catch (error) {
        console.error("Erreur lors de la récupération des données météo:", error);
        displayWeatherError(`Une erreur est survenue lors de la récupération des données météorologiques. ${error.message}`);
    }
}

// Afficher une erreur météo avec option de réessayer
function displayWeatherError(message) {
    loader.style.display = "none";
    currentWeatherContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button id="retry-weather" class="retry-button">Réessayer</button>
            <button id="change-location-error" class="cancel-button">Changer de ville</button>
        </div>
    `;

    // Vider les conteneurs de prévisions
    hourlyForecastContainer.innerHTML = '';
    dailyForecastContainer.innerHTML = '';

    // Ajouter les écouteurs d'événements
    document.getElementById("retry-weather").addEventListener("click", () => {
        refreshWeather();
    });

    document.getElementById("change-location-error").addEventListener("click", () => {
        displayChangeLocationForm();
    });
}

// Vérifier s'il pleut aujourd'hui
function isRainingToday(forecast) {
    // Vérifier le code météo actuel
    const currentWeatherCode = forecast.current.weather_code;

    // Les codes météo pour la pluie sont entre 51 et 99
    const isCurrentlyRaining = currentWeatherCode >= 51 && currentWeatherCode <= 99;

    // Vérifier aussi les prévisions pour aujourd'hui
    const todayPrecipSum = forecast.daily.precipitation_sum[0]; // Indice 0 pour aujourd'hui
    const todayPrecipProb = forecast.daily.precipitation_probability_max[0];

    // Considérer qu'il pleut si:
    // - Il pleut actuellement
    // - La somme des précipitations aujourd'hui est > 1mm
    // - La probabilité de précipitation est > 50%
    return isCurrentlyRaining || todayPrecipSum > 1 || todayPrecipProb > 50;
}

// Afficher la météo actuelle
function displayCurrentWeather(forecast) {
    const current = forecast.current;
    const hourly = forecast.hourly;
    const daily = forecast.daily;
    const weatherCode = current.weather_code;
    const temp = current.temperature_2m;
    const feelsLike = current.apparent_temperature;

    // Récupérer les températures min et max du jour actuel (index 0)
    const maxTemp = daily.temperature_2m_max[0];
    const minTemp = daily.temperature_2m_min[0];

    // Calcul du risque de pluie pour la matinée et l'après-midi du jour actuel
    const currentDate = new Date();
    const currentHour = currentDate.getHours();

    // Définition des plages horaires pour le matin (6h-12h) et l'après-midi (12h-18h)
    const morningStartHour = 6;
    const morningEndHour = 12;
    const afternoonStartHour = 12;
    const afternoonEndHour = 18;

    let morningRainProbabilities = [];
    let afternoonRainProbabilities = [];

    // Récupérer les probabilités de précipitation pour les heures correspondantes
    for (let i = 0; i < 24; i++) {
        const time = new Date(hourly.time[i]);
        const hour = time.getHours();
        const isSameDay = time.getDate() === currentDate.getDate();

        if (isSameDay) {
            if (hour >= morningStartHour && hour < morningEndHour) {
                morningRainProbabilities.push(hourly.precipitation_probability[i]);
            } else if (hour >= afternoonStartHour && hour < afternoonEndHour) {
                afternoonRainProbabilities.push(hourly.precipitation_probability[i]);
            }
        }
    }

    // Calculer les moyennes des probabilités de pluie
    const morningRainProbability = morningRainProbabilities.length > 0
        ? Math.round(morningRainProbabilities.reduce((a, b) => a + b, 0) / morningRainProbabilities.length)
        : "N/A";

    const afternoonRainProbability = afternoonRainProbabilities.length > 0
        ? Math.round(afternoonRainProbabilities.reduce((a, b) => a + b, 0) / afternoonRainProbabilities.length)
        : "N/A";

    const weatherInfo = getWeatherInfo(weatherCode);
    const weatherClass = getWeatherClass(weatherCode);

    // Vérifier s'il pleut aujourd'hui
    const raining = isRainingToday(forecast);

    // Contenu HTML de base
    let htmlContent = `
        <div class="current-weather ${weatherClass}">
            <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" class="weather-icon">
            <div class="temperature">
                <div class="temp-value">
                    <span class="temp-number">${Math.round(minTemp)}°</span>
                    <span class="temp-label">min</span>
                </div>
                <div class="temp-separator">/</div>
                <div class="temp-value">
                    <span class="temp-number">${Math.round(maxTemp)}°</span>
                    <span class="temp-label">max</span>
                </div>
            </div>`;

    // Ajouter l'alerte parapluie si nécessaire
    if (raining) {
        htmlContent += `
            <div class="umbrella-alert">
                <span class="umbrella-emoji">☂️</span>
                <span>Prends ton parapluie aujourd'hui !</span>
            </div>`;
    }

    // Continuer le contenu HTML avec les nouvelles informations de température
    htmlContent += `
            <div class="rain-probability">
                <div class="rain-probability-item">
                    <svg class="drop-icon" width="16" height="16" viewBox="0 0 24 24">
                        <defs>
                            <linearGradient id="dropFill1" x1="0%" y1="100%" x2="0%" y2="${100 - morningRainProbability}%">
                                <stop offset="0%" style="stop-color:var(--primary-color)" />
                                <stop offset="100%" style="stop-color:transparent" />
                            </linearGradient>
                        </defs>
                        <path class="drop-path" d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z" fill="url(#dropFill1)" />
                        <path class="drop-outline" d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z" fill="none" />
                    </svg>
                    <span>Matin: ${morningRainProbability}% de risque de pluie</span>
                </div>
                <div class="rain-probability-item">
                    <svg class="drop-icon" width="16" height="16" viewBox="0 0 24 24">
                        <defs>
                            <linearGradient id="dropFill2" x1="0%" y1="100%" x2="0%" y2="${100 - afternoonRainProbability}%">
                                <stop offset="0%" style="stop-color:var(--primary-color)" />
                                <stop offset="100%" style="stop-color:transparent" />
                            </linearGradient>
                        </defs>
                        <path class="drop-path" d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z" fill="url(#dropFill2)" />
                        <path class="drop-outline" d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z" fill="none" />
                    </svg>
                    <span>Après-midi: ${afternoonRainProbability}% de risque de pluie</span>
                </div>
            </div>
        </div>
    `;

    currentWeatherContainer.innerHTML = htmlContent;
}

// Afficher les prévisions horaires
function displayHourlyForecast(forecast) {
    const hourly = forecast.hourly;
    const hourlyTimes = hourly.time;
    const hourlyTemps = hourly.temperature_2m;
    const hourlyPrecipProb = hourly.precipitation_probability;
    const hourlyPrecip = hourly.precipitation;
    const hourlyWeatherCodes = hourly.weather_code;
    const hourlyCloudCover = hourly.cloud_cover;

    // Filtrer pour n'afficher que les heures restantes de la journée
    const currentHour = new Date().getHours();

    hourlyForecastContainer.innerHTML = '';

    for (let i = currentHour; i < 24; i++) {
        const time = new Date(hourlyTimes[i]);
        const hour = time.getHours();
        const formattedHour = hour < 10 ? `0${hour}:00` : `${hour}:00`;

        const temp = hourlyTemps[i];
        const precipProb = hourlyPrecipProb[i];
        const weatherCode = hourlyWeatherCodes[i];
        const weatherInfo = getWeatherInfo(weatherCode);
        const weatherClass = getWeatherClass(weatherCode);

        const forecastCard = document.createElement('div');
        forecastCard.className = `forecast-card ${weatherClass}`;
        // S'assurer que precipProb est un nombre et le limiter entre 0 et 100
        const rainHeight = Math.min(Math.max(precipProb || 0, 0), 100);
        forecastCard.style.setProperty('--rain-height', `${rainHeight}%`);
        console.log(`Heure: ${formattedHour}, Probabilité: ${precipProb}%, Hauteur: ${rainHeight}%`);

        forecastCard.innerHTML = `
            <div class="forecast-time">${formattedHour}</div>
            <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" class="forecast-icon">
            <div class="forecast-temp">${Math.round(temp)}°C</div>
            <div class="forecast-precip">
                <svg class="drop-icon" width="16" height="16" viewBox="0 0 24 24">
                    <defs>
                        <linearGradient id="dropFill_${hour}" x1="0%" y1="100%" x2="0%" y2="${100 - precipProb}%">
                            <stop offset="0%" style="stop-color:var(--primary-color)" />
                            <stop offset="100%" style="stop-color:transparent" />
                        </linearGradient>
                    </defs>
                    <path class="drop-path" d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z" fill="url(#dropFill_${hour})" />
                    <path class="drop-outline" d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z" fill="none" />
                </svg>
                ${precipProb}%
            </div>
        `;

        hourlyForecastContainer.appendChild(forecastCard);
    }
}

// Afficher les prévisions pour les 4 prochains jours
function displayDailyForecast(forecast) {
    const daily = forecast.daily;
    const dailyDates = daily.time;
    const dailyMaxTemps = daily.temperature_2m_max;
    const dailyMinTemps = daily.temperature_2m_min;
    const dailyPrecipSum = daily.precipitation_sum;
    const dailyPrecipProb = daily.precipitation_probability_max;
    const dailyWeatherCodes = daily.weather_code;

    dailyForecastContainer.innerHTML = '';

    // Commencer à partir de demain (index 1) pour les 4 prochains jours
    for (let i = 1; i < 5; i++) {
        const date = new Date(dailyDates[i]);
        const formattedDate = formatDate(date);
        const maxTemp = dailyMaxTemps[i];
        const minTemp = dailyMinTemps[i];
        const precipProb = dailyPrecipProb[i];
        const weatherCode = dailyWeatherCodes[i];

        const weatherInfo = getWeatherInfo(weatherCode);
        const weatherClass = getWeatherClass(weatherCode);

        // Calculer les températures du matin (25%) et de l'après-midi (75%)
        const morningTemp = minTemp + (maxTemp - minTemp) * 0.25;
        const afternoonTemp = minTemp + (maxTemp - minTemp) * 0.75;

        const dailyCard = document.createElement('div');
        dailyCard.className = `daily-card ${weatherClass}`;
        dailyCard.innerHTML = `
            <div class="daily-date">${formattedDate}</div>
            <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" class="daily-icon">
            
            <div class="daily-period">
                <span class="period-name">Matin</span>
                <div class="period-value">
                    <span class="period-temp">${Math.round(morningTemp)}°C</span>
                    <span class="period-precip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z"></path>
                        </svg>
                        ${precipProb}%
                    </span>
                </div>
            </div>
            
            <div class="daily-period">
                <span class="period-name">Après-midi</span>
                <div class="period-value">
                    <span class="period-temp">${Math.round(afternoonTemp)}°C</span>
                    <span class="period-precip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z"></path>
                        </svg>
                        ${precipProb}%
                    </span>
                </div>
            </div>
        `;

        dailyForecastContainer.appendChild(dailyCard);
    }
}

// Formater la date au format "Jour DD/MM"
function formatDate(date) {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;

    return `${day} ${dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth}/${month < 10 ? '0' + month : month}`;
}

// Obtenir les informations météo en fonction du code météo
function getWeatherInfo(code) {
    // Basé sur les codes météo WMO (Organisation météorologique mondiale)
    // https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM

    const weatherMap = {
        0: { description: "Ciel dégagé", icon: "images/sunny.svg" },
        1: { description: "Principalement dégagé", icon: "images/mostly-sunny.svg" },
        2: { description: "Partiellement nuageux", icon: "images/partly-cloudy.svg" },
        3: { description: "Nuageux", icon: "images/cloudy.svg" },
        45: { description: "Brouillard", icon: "images/fog.svg" },
        48: { description: "Brouillard givrant", icon: "images/fog.svg" },
        51: { description: "Bruine légère", icon: "images/drizzle.svg" },
        53: { description: "Bruine modérée", icon: "images/drizzle.svg" },
        55: { description: "Bruine dense", icon: "images/drizzle.svg" },
        56: { description: "Bruine verglaçante légère", icon: "images/sleet.svg" },
        57: { description: "Bruine verglaçante dense", icon: "images/sleet.svg" },
        61: { description: "Pluie légère", icon: "images/rain-light.svg" },
        63: { description: "Pluie modérée", icon: "images/rain.svg" },
        65: { description: "Pluie forte", icon: "images/rain-heavy.svg" },
        66: { description: "Pluie verglaçante légère", icon: "images/sleet.svg" },
        67: { description: "Pluie verglaçante forte", icon: "images/sleet.svg" },
        71: { description: "Neige légère", icon: "images/snow-light.svg" },
        73: { description: "Neige modérée", icon: "images/snow.svg" },
        75: { description: "Neige forte", icon: "images/snow-heavy.svg" },
        77: { description: "Grains de neige", icon: "images/snow.svg" },
        80: { description: "Averses de pluie légères", icon: "images/rain-light.svg" },
        81: { description: "Averses de pluie modérées", icon: "images/rain.svg" },
        82: { description: "Averses de pluie violentes", icon: "images/rain-heavy.svg" },
        85: { description: "Averses de neige légères", icon: "images/snow-light.svg" },
        86: { description: "Averses de neige fortes", icon: "images/snow-heavy.svg" },
        95: { description: "Orage", icon: "images/thunderstorm.svg" },
        96: { description: "Orage avec grêle légère", icon: "images/thunderstorm-hail.svg" },
        99: { description: "Orage avec grêle forte", icon: "images/thunderstorm-hail.svg" }
    };

    return weatherMap[code] || { description: "Inconnu", icon: "images/unknown.svg" };
}

// Obtenir la classe CSS en fonction du code météo
function getWeatherClass(code) {
    if (code <= 1) return "weather-sunny";
    if (code <= 3) return "weather-cloudy";
    if (code >= 51 && code <= 99) return "weather-rainy";
    return "";
}

// Gérer les erreurs de géolocalisation
function handleLocationError(error) {
    let errorMessage;

    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "L'accès à la géolocalisation a été refusé. Veuillez autoriser l'accès dans les paramètres de votre appareil ou utiliser la recherche par ville.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Les informations de localisation sont indisponibles. Vérifiez que les services de localisation sont activés.";
            break;
        case error.TIMEOUT:
            errorMessage = "La demande de localisation a expiré. Vérifiez votre connexion internet et réessayez.";
            break;
        default:
            errorMessage = "Une erreur inconnue s'est produite lors de la géolocalisation.";
            break;
    }

    locationElement.textContent = "Localisation non disponible";
    displayLocationFallback();

    // Ajouter un message d'information
    const fallbackElement = document.querySelector(".location-fallback");
    if (fallbackElement) {
        const errorInfoElement = document.createElement("p");
        errorInfoElement.className = "error-info";
        errorInfoElement.textContent = errorMessage;
        fallbackElement.insertBefore(errorInfoElement, fallbackElement.firstChild);
    }
} 