const API_KEY = "acb1d12d52b1fb0efde3a54011f50adf";
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

const weatherForm = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const message = document.getElementById("message");
const weatherCard = document.getElementById("weatherCard");

const locationElement = document.getElementById("location");
const weatherIcon = document.getElementById("weatherIcon");
const description = document.getElementById("description");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");

weatherForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  showLoading();

  try {
    const url =
      `${API_URL}?q=${encodeURIComponent(city)}` +
      `&appid=${API_KEY}` +
      `&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("API key is invalid or not active yet.");
      }

      if (response.status === 404) {
        throw new Error("Location not found. Please check the city name.");
      }

      throw new Error(data.message || "Unable to retrieve weather data.");
    }

    displayWeather(data);
  } catch (error) {
    showError(error.message);
    console.error(error);
  }
});

function displayWeather(data) {
  message.textContent = "";
  weatherCard.classList.remove("hidden");

  locationElement.textContent = `${data.name}, ${data.sys.country}`;
  description.textContent = data.weather[0].description;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${data.wind.speed} m/s`;

  weatherIcon.src =
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  weatherIcon.alt = data.weather[0].description;
}

function showLoading() {
  message.textContent = "Loading weather data...";
  message.style.color = "#9fd4ff";
  weatherCard.classList.add("hidden");
}

function showError(errorMessage) {
  message.textContent = errorMessage;
  message.style.color = "#ff6b6b";
  weatherCard.classList.add("hidden");
}
