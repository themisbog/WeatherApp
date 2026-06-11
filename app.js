async function collectData(location) {
    try {
        const respose = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&key=${API_KEY}`)
        const locData = await respose.json();
        console.log(locData);
        return locData;
    } catch (error) {
        console.error("Error fetching weather:", error);
    }
}

function ProcessWeather(weatherData) {
    try {
        const processedData = {
            address: weatherData.resolvedAddress,
            temp: weatherData.currentConditions.temp,
            conditions: weatherData.currentConditions.conditions,
            icon: weatherData.currentConditions.icon,
            description: weatherData.description
        };
        return processedData;

    } catch (error) {
        console.error("Error fetching weather:", error);
    }
}

async function intiApp() {
    const allData = await collectData('Thessaloniki');
    const cleanData = ProcessWeather(allData);
    console.log(cleanData);
}
intiApp();

// Function to dynamically update the DOM with processed data
async function displayWeather(cleanData) {
    const card = document.getElementById('weather-card');
    const addressEl = document.getElementById('display-address');
    const tempEl = document.getElementById('display-temp');
    const conditionsEl = document.getElementById('display-conditions');
    const descriptionEl = document.getElementById('display-description');
    const iconEl = document.getElementById('display-icon');

    // 1. Unhide the card layout
    card.classList.remove('hidden');

    // 2. Inject text information
    addressEl.textContent = cleanData.address;
    tempEl.textContent = `${Math.round(cleanData.temp)}°`;
    conditionsEl.textContent = cleanData.conditions;
    descriptionEl.textContent = cleanData.description;

    // 3. Webpack Dynamic Import for Weather Icons
    try {
        // Webpack analyzes this template string and automatically bundles files matching the path
        const iconModule = await import(`./assets/icons/${cleanData.icon}.svg`);
        iconEl.src = iconModule.default;
    } catch (err) {
        console.warn(`Icon for "${cleanData.icon}" not found. Falling back to default.`);
        // Fallback icon path if the specific icon asset fails to load
        iconEl.src = './assets/icons/default.svg';
    }
}

const weatherForm = document.getElementById('weather-form');
const locationInput = document.getElementById('location-input');

async function handleFormSubmit(event) {
    event.preventDefault();
    const userLocation = locationInput.value.trim();

    if (!userLocation) return;

    try {
        const allData = await collectData(userLocation);
        const cleanData = ProcessWeather(allData); 

        updateWebpage(cleanData);
        locationInput.value = '';

    } catch (error) {
        console.error("Error updating layout:", error);
    }
}
weatherForm.addEventListener('submit', handleFormSubmit);

function updateWebpage(weatherObject) {

    const cityDisplay = document.getElementById('display-address');
    const tempDisplay = document.getElementById('display-temp');
    const conditionDisplay = document.getElementById('display-conditions');
    const descriptionDisplay = document.getElementById('display-description');
    const weatherCard = document.getElementById('weather-card');


    cityDisplay.textContent = weatherObject.address;
    tempDisplay.textContent = `${Math.round(weatherObject.temp)}°`;
    conditionDisplay.textContent = weatherObject.conditions;
    descriptionDisplay.textContent = weatherObject.description;


    weatherCard.classList.remove('hidden');
}

const autocompleteResults = document.getElementById('autocomplete-results');
let debounceTimer;

// Listen for users typing into the box
locationInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = locationInput.value.trim();

    if (query.length < 3) {
        autocompleteResults.innerHTML = '';
        autocompleteResults.classList.add('hidden');
        return;
    }
    debounceTimer = setTimeout(() => {
        fetchCitySuggestions(query);
    }, 300);
});

// Fetch locations matching the search text using OpenStreetMap
async function fetchCitySuggestions(searchQuery) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&addressdetails=1&limit=5`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'ClimaWeatherApp' } 
        });
        const data = await response.json();
        
        renderSuggestions(data);
    } catch (error) {
        console.error("Autocomplete fetch failed:", error);
    }
}

// Render the results matching options into a dropdown array list
function renderSuggestions(cities) {
    autocompleteResults.innerHTML = '';
    
    if (cities.length === 0) {
        autocompleteResults.classList.add('hidden');
        return;
    }

    cities.forEach(city => {
        const div = document.createElement('div');
        div.classList.add('suggestion-item');
        
        // Construct a clean display string (e.g., "Paris, France")
        const cityName = city.address.city || city.address.town || city.address.village || city.display_name.split(',')[0];
        const countryName = city.address.country;
        div.textContent = `${cityName}, ${countryName}`;

        // When a user clicks a city from the choices list, inject it and trigger search!
        div.addEventListener('click', () => {
            locationInput.value = div.textContent;
            autocompleteResults.innerHTML = '';
            autocompleteResults.classList.add('hidden');
            
            // Programmatically trigger your existing search flow
            document.getElementById('weather-form').requestSubmit();
        });

        autocompleteResults.appendChild(div);
    });

    autocompleteResults.classList.remove('hidden');
}

// Close the autocomplete dropdown if the user clicks anywhere else outside
document.addEventListener('click', (e) => {
    if (e.target !== locationInput && e.target !== autocompleteResults) {
        autocompleteResults.classList.add('hidden');
    }
});