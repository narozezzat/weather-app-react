import React, { useCallback, useEffect, useState } from "react";
import "../styles/WeatherApp.css";
import { Spin, AutoComplete } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

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

// List of cities in Egypt
const citiesInEgypt = [
    "Cairo", "Alexandria", "Giza", "Sharm El-Sheikh", "Luxor",
    "Aswan", "Hurghada", "Port Said", "Suez", "Mansoura",
    "Tanta", "Zagazig", "Ismailia", "Damanhur", "Faiyum",
    "Minya", "Qena", "Beni Suef", "Kafr El Sheikh", "Sohag"
];

const WeatherApp: React.FC = () => {
    const [searchInput, setSearchInput] = useState<string>("");
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [forecastData, setForecastData] = useState<ForecastData[]>([]);
    const [notFound, setNotFound] = useState<boolean>(false);
    const [hasSearched, setHasSearched] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const apiKey = `3bee3a23d382eaeb96872ee2f48247d9`;
    const date = new Date();
    const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
    const dayNumber = date.toLocaleDateString(undefined, { day: 'numeric' });
    const monthName = date.toLocaleDateString(undefined, { month: 'short' });

    const formattedDate = `${dayName}, ${dayNumber} ${monthName}`;

    const getWeatherData = useCallback(async (location: string) => {
        setLoading(true);
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
                localStorage.setItem("lastSearch", location);

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
            setLoading(false);
            setHasSearched(true);
        }
    }, [apiKey]);

    const handleSearch = () => {
        if (searchInput.trim()) {
            getWeatherData(searchInput.trim());
            setSearchInput("");
        }
    };
    // Check for data in localStorage on initial load
    useEffect(() => {
        const savedWeatherData = localStorage.getItem("weatherData");
        const lastSearch = localStorage.getItem("lastSearch");
        if (lastSearch) {
            setSearchInput(lastSearch);
            getWeatherData(lastSearch);
        } else {
            setSearchInput("");
        }
        if (savedWeatherData) {
            setWeatherData(JSON.parse(savedWeatherData));
            setNotFound(false);
            setHasSearched(true);

            const savedWeather = JSON.parse(savedWeatherData);
            getWeatherData(savedWeather.name);
        }
    }, [getWeatherData]);

    const handleInputChange = (value: string) => {
        setSearchInput(value);

        if (value === "") {
            setNotFound(false);
            setHasSearched(false);
            setWeatherData(null);
            setForecastData([]);
        }
    };

    // Filter cities based on input
    const filteredCities = citiesInEgypt.filter(city =>
        city.toLowerCase().includes(searchInput.toLowerCase())
    );

    // Determine dropdown options
    const dropdownOptions = filteredCities.length > 0
        ? filteredCities.map(city => ({ value: city }))
        : [{ value: "No data available", disabled: true }]; // No data option

    return (
        <div className="container">
            <h1 className="headTitle">Weather App</h1>
            <div className="search">
                <AutoComplete
                    className="custom-autocomplete"
                    style={{ width: '100%' }}
                    dropdownStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.50)',
                        color: '#000'
                    }}
                    options={dropdownOptions}
                    value={searchInput}
                    onChange={handleInputChange}
                    onSelect={(value) => {
                        setSearchInput(value);
                        if (value !== "No data available") {
                            getWeatherData(value);
                        }
                    }}
                    placeholder="Search city..."
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <i className="fi fi-br-search"></i>
            </div>

            {/* Loading Spinner */}
            {loading && <Spin className="spinner" indicator={<LoadingOutlined spin />} size="large" />}

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