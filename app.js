// Variables globales
let userLatitude;
let userLongitude;
let locationName = "Votre position";

// DOM Elements
const locationElement = document.getElementById("location");
const refreshButton = document.getElementById("refresh-btn");
const currentWeatherContainer = document.getElementById("current-weather");
const hourlyForecastContainer = document.getElementById("hourly-forecast");
const dailyForecastContainer = document.getElementById("daily-forecast");
const loader = document.getElementById("loader");

// Événements
document.addEventListener("DOMContentLoaded", initApp);
refreshButton.addEventListener("click", refreshWeather);

// Initialisation de l'application
function initApp() {
    getUserLocation();
}

// Obtenir la géolocalisation de l'utilisateur
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLatitude = position.coords.latitude;
                userLongitude = position.coords.longitude;
                getLocationName(userLatitude, userLongitude);
                getWeatherData(userLatitude, userLongitude);
            },
            error => {
                handleLocationError(error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        locationElement.textContent = "La géolocalisation n'est pas prise en charge par votre navigateur";
        loader.style.display = "none";
    }
}

// Obtenir le nom de l'emplacement à partir des coordonnées
async function getLocationName(lat, lon) {
    try {
        const response = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (data && data.address) {
            const address = data.address;
            locationName = address.city || address.town || address.village || address.municipality || "Localisation inconnue";
            locationElement.textContent = locationName;
        } else {
            locationElement.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du nom de l'emplacement:", error);
        locationElement.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
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
    try {
        const openMeteo = new OpenMeteo();

        const forecast = await openMeteo.forecast({
            latitude,
            longitude,
            current: ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "weather_code"],
            hourly: ["temperature_2m", "precipitation_probability", "precipitation", "weather_code", "cloud_cover"],
            daily: ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_sum", "precipitation_probability_max"],
            timezone: "auto",
            forecast_days: 5 // +1 pour le jour actuel et 4 jours à venir
        });

        displayCurrentWeather(forecast);
        displayHourlyForecast(forecast);
        displayDailyForecast(forecast);

        loader.style.display = "none";
    } catch (error) {
        console.error("Erreur lors de la récupération des données météo:", error);
        loader.style.display = "none";
        currentWeatherContainer.innerHTML = `
            <div class="error-message">
                <p>Une erreur est survenue lors de la récupération des données météorologiques.</p>
                <p>Veuillez réessayer plus tard.</p>
            </div>
        `;
    }
}

// Afficher la météo actuelle
function displayCurrentWeather(forecast) {
    const current = forecast.current;
    const hourly = forecast.hourly;
    const weatherCode = current.weather_code;
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const feelsLike = current.apparent_temperature;
    const precipitation = current.precipitation;

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

    currentWeatherContainer.innerHTML = `
        <div class="current-weather ${weatherClass}">
            <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" class="weather-icon">
            <div class="temperature">${Math.round(temp)}°C</div>
            <div class="weather-description">${weatherInfo.description}</div>
            <div class="weather-details">
                <div class="weather-detail">
                    <span class="detail-value">${Math.round(feelsLike)}°C</span>
                    <span class="detail-label">Ressenti</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-value">${humidity}%</span>
                    <span class="detail-label">Humidité</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-value">${precipitation} mm</span>
                    <span class="detail-label">Précipitations</span>
                </div>
            </div>
            <div class="rain-probability">
                <div class="rain-probability-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z"></path>
                    </svg>
                    <span>Matin: ${morningRainProbability}% de risque de pluie</span>
                </div>
                <div class="rain-probability-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z"></path>
                    </svg>
                    <span>Après-midi: ${afternoonRainProbability}% de risque de pluie</span>
                </div>
            </div>
        </div>
    `;
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
        const precip = hourlyPrecip[i];
        const weatherCode = hourlyWeatherCodes[i];
        const cloudCover = hourlyCloudCover[i];

        const weatherInfo = getWeatherInfo(weatherCode);
        const weatherClass = getWeatherClass(weatherCode);

        const forecastCard = document.createElement('div');
        forecastCard.className = `forecast-card ${weatherClass}`;
        forecastCard.innerHTML = `
            <div class="forecast-time">${formattedHour}</div>
            <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" class="forecast-icon">
            <div class="forecast-temp">${Math.round(temp)}°C</div>
            <div class="forecast-precip">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22c-4.97 0-9-4.5-9-9 0-4 9-12 9-12s9 8 9 12c0 4.5-4.03 9-9 9z"></path>
                </svg>
                ${precipProb}% (${precip} mm)
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
        const precipSum = dailyPrecipSum[i];
        const precipProb = dailyPrecipProb[i];
        const weatherCode = dailyWeatherCodes[i];

        const weatherInfo = getWeatherInfo(weatherCode);
        const weatherClass = getWeatherClass(weatherCode);

        // Calculer les températures du matin (25%) et de l'après-midi (75%)
        const morningTemp = minTemp + (maxTemp - minTemp) * 0.25;
        const afternoonTemp = minTemp + (maxTemp - minTemp) * 0.75;

        // Calculer les précipitations du matin et de l'après-midi (simplement divisées par 2 pour cet exemple)
        const morningPrecip = precipSum / 2;
        const afternoonPrecip = precipSum / 2;

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
                        ${precipProb}% (${morningPrecip.toFixed(1)} mm)
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
                        ${precipProb}% (${afternoonPrecip.toFixed(1)} mm)
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
            errorMessage = "L'accès à la géolocalisation a été refusé. Veuillez autoriser l'accès pour obtenir des prévisions météo locales.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Les informations de localisation sont indisponibles.";
            break;
        case error.TIMEOUT:
            errorMessage = "La demande de localisation a expiré.";
            break;
        default:
            errorMessage = "Une erreur inconnue s'est produite lors de la géolocalisation.";
            break;
    }

    locationElement.textContent = "Localisation non disponible";
    currentWeatherContainer.innerHTML = `
        <div class="error-message">
            <p>${errorMessage}</p>
            <p>Veuillez réessayer plus tard ou autoriser l'accès à votre position.</p>
        </div>
    `;

    loader.style.display = "none";
} 