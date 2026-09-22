import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "weather-saved-locations-v1";

const weatherInfo = {
  0: ["Clear sky", "☀️"],
  1: ["Mostly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  61: ["Slight rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Slight snow", "🌨️"],
  73: ["Snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy showers", "🌧️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm", "⛈️"],
  99: ["Thunderstorm", "⛈️"]
};

function readLocations() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

async function findCity(name) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
  );
  if (!response.ok) throw new Error("Unable to search for that location.");

  const data = await response.json();
  if (!data.results?.length) throw new Error("Location not found. Try another city.");

  const city = data.results[0];
  return {
    id: `${city.id}-${city.latitude}-${city.longitude}`,
    name: city.name,
    country: city.country || "",
    admin1: city.admin1 || "",
    latitude: city.latitude,
    longitude: city.longitude
  };
}

async function getWeather(location) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    timezone: "auto"
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error("Unable to load weather data.");

  const data = await response.json();
  return data.current;
}

function App() {
  const [locations, setLocations] = useState(readLocations);
  const [selectedId, setSelectedId] = useState(() => readLocations()[0]?.id || null);
  const [weather, setWeather] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    }
  }, [locations]);

  useEffect(() => {
    locations.forEach(async (location) => {
      try {
        const current = await getWeather(location);
        setWeather((previous) => ({ ...previous, [location.id]: current }));
      } catch {
        setError("Some weather data could not be loaded.");
      }
    });
  }, [locations]);

  const selected = useMemo(
    () => locations.find((location) => location.id === selectedId) || locations[0],
    [locations, selectedId]
  );

  const selectedWeather = selected ? weather[selected.id] : null;
  const selectedInfo = selectedWeather ? (weatherInfo[selectedWeather.weather_code] || ["Unknown", "🌤️"]) : null;

  async function addLocation(event) {
    event.preventDefault();
    if (!query.trim()) return setError("Enter a city name first.");

    setLoading(true);
    setError("");

    try {
      const location = await findCity(query.trim());
      if (locations.some((item) => item.id === location.id)) {
        throw new Error("That location is already saved.");
      }

      setLocations((previous) => [...previous, location]);
      setSelectedId(location.id);
      setQuery("");
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }

  function removeLocation(id) {
    const remaining = locations.filter((location) => location.id !== id);
    setLocations(remaining);
    if (selectedId === id) setSelectedId(remaining[0]?.id || null);
  }

  return (
    <main className="app-shell">
      <section className="weather-app">
        <header className="hero">
          <div className="brand-mark" aria-hidden="true">☀</div>
          <div>
            <p className="eyebrow">YOUR DAILY FORECAST</p>
            <h1>Weather Forecast</h1>
            <p className="subtitle">Save and check weather for multiple locations.</p>
          </div>
        </header>

        <form className="search-form" onSubmit={addLocation}>
          <label className="sr-only" htmlFor="city-search">City or country</label>
          <div className="search-input-wrap">
            <span aria-hidden="true">⌕</span>
            <input
              id="city-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Add a city or country"
            />
          </div>
          <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add location →"}</button>
        </form>

        <p className="message" role="status" aria-live="polite">{error}</p>

        {selected && selectedWeather && (
          <section className="weather-card">
            <div className="location-row">
              <div>
                <p className="section-label">CURRENT WEATHER</p>
                <h2>{selected.name}, {selected.country}</h2>
                <p className="location-detail">{selected.admin1}</p>
              </div>
              <span className="weather-emoji" aria-hidden="true">{selectedInfo[1]}</span>
            </div>

            <div className="weather-main">
              <div>
                <p className="temperature">{Math.round(selectedWeather.temperature_2m)}°C</p>
                <p className="description">{selectedInfo[0]}</p>
              </div>
            </div>

            <div className="details">
              <div className="detail-box">
                <span>Feels like</span>
                <strong>{Math.round(selectedWeather.apparent_temperature)}°C</strong>
              </div>
              <div className="detail-box">
                <span>Humidity</span>
                <strong>{selectedWeather.relative_humidity_2m}%</strong>
              </div>
              <div className="detail-box">
                <span>Wind speed</span>
                <strong>{Math.round(selectedWeather.wind_speed_10m)} km/h</strong>
              </div>
            </div>
          </section>
        )}

        <div className="saved-heading">
          <p className="section-label">SAVED LOCATIONS</p>
          <span>{locations.length}</span>
        </div>

        <div className="location-list">
          {!locations.length && <p className="empty-state">Add a city to start saving locations.</p>}
          {locations.map((location) => {
            const current = weather[location.id];
            const info = current ? (weatherInfo[current.weather_code] || ["Unknown", "🌤️"]) : ["Loading...", "⏳"];

            return (
              <button
                className={`location-item ${selected?.id === location.id ? "active" : ""}`}
                key={location.id}
                onClick={() => setSelectedId(location.id)}
                type="button"
              >
                <span className="location-copy">
                  <strong>{location.name}</strong>
                  <small>{location.country} · {info[0]}</small>
                </span>
                <span className="location-value">{current ? `${Math.round(current.temperature_2m)}°C` : info[1]}</span>
                <span
                  className="remove"
                  role="button"
                  tabIndex="0"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeLocation(location.id);
                  }}
                  aria-label={`Remove ${location.name}`}
                >
                  ×
                </span>
              </button>
            );
          })}
        </div>

        <p className="footer-note">Powered by Open-Meteo · Locations are saved in your browser</p>
      </section>
    </main>
  );
}

export default App;
