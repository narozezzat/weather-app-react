import React, { useCallback, useEffect, useState } from "react";
import "../styles/WeatherApp.css";
import { Spin } from "antd"; // Import Spin for loading spinner

interface WeatherData {
    name: string;
    weather: { main: string }[];
    main: { temp: number; humidity: number };
    wind: { speed: number };
}

interface ForecastData {
    dt_txt: string;
    main: { temp: number };
    weather: { main: string }[];
}

const WeatherApp: React.FC = () => {
    const [searchInput, setSearchInput] = useState<string>("");
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [forecastData, setForecastData] = useState<ForecastData[]>([]);
    const [notFound, setNotFound] = useState<boolean>(false);
    const [hasSearched, setHasSearched] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false); // Loading state

    const apiKey = process.env.REACT_APP_API_KEY || "";
    const date = new Date();
    const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
    const dayNumber = date.toLocaleDateString(undefined, { day: 'numeric' });
    const monthName = date.toLocaleDateString(undefined, { month: 'short' });

    const formattedDate = `${dayName}, ${dayNumber} ${monthName}`;

    const getWeatherData = useCallback(async (location: string) => { // Wrapped in useCallback
        setLoading(true); // Start loading
        try {
            const weatherRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
            );
            const weatherJson = await weatherRes.json();
            if (weatherJson.cod === 200) {
                setWeatherData(weatherJson);
                setNotFound(false);

                // Save data to localStorage
                localStorage.setItem("weatherData", JSON.stringify(weatherJson));
                localStorage.setItem("lastSearch", location); // Save last searched city

                const forecastRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`
                );
                const forecastJson = await forecastRes.json();
                const filteredForecasts = forecastJson.list.filter((item: ForecastData) =>
                    item.dt_txt.includes("12:00:00")
                );
                setForecastData(filteredForecasts);
            } else {
                setNotFound(true);
                setWeatherData(null);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setNotFound(true);
        } finally {
            setLoading(false); // End loading
            setHasSearched(true);
        }
    }, [apiKey]); // Added apiKey as a dependency

    const handleSearch = () => {
        if (searchInput.trim()) {
            getWeatherData(searchInput.trim());
            setSearchInput("");
        }
    };

    // Check for data in localStorage on initial load
    useEffect(() => {
        const savedWeatherData = localStorage.getItem("weatherData");
        const lastSearch = localStorage.getItem("lastSearch"); // Get last searched city
        if (lastSearch) {
            setSearchInput(lastSearch); // Set last search in input
            getWeatherData(lastSearch); // Fetch weather data for the last searched city
        } else {
            setSearchInput(""); // Clear input if no last search found
        }

        if (savedWeatherData) {
            setWeatherData(JSON.parse(savedWeatherData));
            setNotFound(false);
            setHasSearched(true);

            const savedWeather = JSON.parse(savedWeatherData);
            getWeatherData(savedWeather.name); // Re-fetch forecast data for the saved location
        }
    }, [getWeatherData]); // Now it's safe to include getWeatherData here

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);

        if (value === "") {
            setNotFound(false); // Reset notFound state
            setHasSearched(false); // Reset hasSearched state
            setWeatherData(null); // Clear weather data
            setForecastData([]); // Clear forecast data
        }
    };

    return (
        <div className="container">
            <div className="search">
                <input
                    type="text"
                    value={searchInput}
                    onChange={handleInputChange} // Use custom input change handler
                    placeholder="Search city..."
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <i className="fi fi-br-search"></i>
            </div>

            {/* Loading Spinner */}
            {loading && <Spin size="large" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }} />}

            {/* Before Search */}
            {!hasSearched && !loading && (
                <div className="search_message message">
                    <img src="images/search-city.png" alt="search" />
                    <p>Search City</p>
                    <span>Find out the weather conditions of the city</span>
                </div>
            )}

            {/* Not Found Message */}
            {notFound && hasSearched && !loading && (
                <div className="not-found-message message">
                    <img src="images/not-found.png" alt="Not Found" />
                    <p>Not Found</p>
                    <span>Find out the weather conditions of the city</span>
                </div>
            )}

            {/* Weather Data */}
            {weatherData && !notFound && !loading && (
                <div className="weather">
                    <div className="condition">
                        <div className="location_date">
                            <div className="location">
                                <i className="fi fi-rs-marker"></i>
                                <span className="city">{weatherData.name}</span>
                            </div>
                            <p>{formattedDate}</p>
                        </div>
                        <div className="statue">
                            <img src="images/Clear.png" alt="clear" />

                            <div className="temperature">
                                <h1>{Math.round(weatherData.main.temp)}°C</h1>
                                <p>{weatherData.weather[0].main}</p>
                            </div>
                        </div>
                        <div className="more_info">
                            <div className="humidity">
                                <i className="uil uil-tear"></i>
                                <div className="humidity">
                                    <i className="fi fi-rs-raindrops"></i>
                                    <div>
                                        <p className="title">Humidity</p>
                                        <p className="value">{weatherData.main.humidity}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="wind_speed">
                                <i className="fi fi-rs-wind"></i>
                                <div>
                                    <p className="title">Wind Speed</p>
                                    <p className="value">{weatherData.wind.speed} m/s</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="forecast">
                        {forecastData.map((forecast, index) => (
                            <div key={index} className="forecast-item">
                                <p>
                                    {new Date(forecast.dt_txt).toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </p>
                                <img src={`images/Clear.png`} alt="forecast icon" />
                                <p className="temperature">{Math.round(forecast.main.temp)}°C</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherApp;