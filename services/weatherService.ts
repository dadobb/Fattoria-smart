
import { WeatherData } from "../types";

const LAT = 45.4741;
const LON = 10.7950;

export async function fetchWeather(): Promise<WeatherData | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max&timezone=Europe%2FRome`
    );
    const data = await r.json();
    
    return {
      temp: Math.round(data.daily.temperature_2m_max[0]),
      humidity: data.daily.relative_humidity_2m_max[0],
      code: data.daily.weathercode[0],
      daily: data.daily.time.map((t: string, i: number) => ({
        time: t,
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        humidity: data.daily.relative_humidity_2m_max[i],
        code: data.daily.weathercode[i]
      }))
    };
  } catch (e) {
    console.error("Weather Fetch Error:", e);
    return null;
  }
}
