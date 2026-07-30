import type { WeatherContext } from "./wardrobe-ai";

type Coordinates = {
  latitude: number;
  longitude: number;
  location: string;
};

type OpenMeteoGeocodingResponse = {
  results?: Array<{
    name?: string;
    admin1?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }>;
};

type OpenMeteoForecastResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

function numberOr(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function describeWeatherCode(code: number) {
  if (code === 0) return "晴朗";
  if (code === 1 || code === 2) return "晴间多云";
  if (code === 3) return "阴天";
  if (code === 45 || code === 48) return "有雾";
  if (code >= 51 && code <= 57) return "有毛毛雨";
  if (code >= 61 && code <= 67) return "有雨";
  if (code >= 71 && code <= 77) return "有雪";
  if (code >= 80 && code <= 82) return "有阵雨";
  if (code >= 85 && code <= 86) return "有阵雪";
  if (code >= 95) return "有雷雨";
  return "天气多变";
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }

  return (await response.json()) as T;
}

async function resolveCoordinates({
  city,
  latitude,
  longitude,
  signal,
}: {
  city: string;
  latitude: number | null;
  longitude: number | null;
  signal: AbortSignal;
}): Promise<Coordinates> {
  if (
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return {
      latitude,
      longitude,
      location: city.trim() || "当前位置",
    };
  }

  const normalizedCity = city.trim();
  if (!normalizedCity) {
    throw new Error("请输入城市或使用当前位置。");
  }

  const query = new URLSearchParams({
    name: normalizedCity,
    count: "1",
    language: "zh",
    format: "json",
  });
  const result = await fetchJson<OpenMeteoGeocodingResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?${query.toString()}`,
    signal,
  );
  const match = result.results?.[0];

  if (
    !match ||
    typeof match.latitude !== "number" ||
    typeof match.longitude !== "number"
  ) {
    throw new Error("没有找到这个城市，请检查名称后重试。");
  }

  return {
    latitude: match.latitude,
    longitude: match.longitude,
    location: [match.name, match.admin1, match.country]
      .filter(Boolean)
      .join(" · "),
  };
}

export async function getCurrentWeather({
  city,
  latitude,
  longitude,
  signal,
}: {
  city: string;
  latitude: number | null;
  longitude: number | null;
  signal: AbortSignal;
}): Promise<WeatherContext> {
  const coordinates = await resolveCoordinates({
    city,
    latitude,
    longitude,
    signal,
  });
  const query = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current:
      "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "1",
  });
  const forecast = await fetchJson<OpenMeteoForecastResponse>(
    `https://api.open-meteo.com/v1/forecast?${query.toString()}`,
    signal,
  );

  if (!forecast.current || !forecast.daily) {
    throw new Error("天气服务暂时没有返回完整数据。");
  }

  const weatherCode = numberOr(forecast.current.weather_code);

  return {
    location: coordinates.location,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    temperatureC: numberOr(forecast.current.temperature_2m),
    apparentTemperatureC: numberOr(
      forecast.current.apparent_temperature,
      numberOr(forecast.current.temperature_2m),
    ),
    condition: describeWeatherCode(weatherCode),
    weatherCode,
    precipitationMm: numberOr(forecast.current.precipitation),
    precipitationProbability: numberOr(
      forecast.daily.precipitation_probability_max?.[0],
    ),
    windSpeedKph: numberOr(forecast.current.wind_speed_10m),
    minTemperatureC: numberOr(forecast.daily.temperature_2m_min?.[0]),
    maxTemperatureC: numberOr(forecast.daily.temperature_2m_max?.[0]),
  };
}
