import { toast } from "sonner";

const API_URL = "http://localhost:8000";

export interface Location {
  id: string;
  name: string;
  coordinates: string;
  active: boolean;
}

export interface AnalysisResults {
  solar: SolarResult[];
  wind: WindResult[];
  combined: CombinedResult[];
}

export interface SolarResult {
  location: string;
  solar_score: number;
  avg_solar_irradiance: number;
  avg_temperature: number;
  avg_humidity: number;
  avg_uv_index: number;
  elevation_meters: number;
  estimated_daily_output_kwh: number;
  pvwatts_derate?: number;
}

export interface WindResult {
  location: string;
  wind_score: number;
  avg_wind_speed: number;
  max_wind_gust: number;
  wind_direction: number;
  pressure: number;
  wind_stability: number;
  elevation_meters: number;
  estimated_daily_output_kwh: number;
}

export interface CombinedResult {
  location: string;
  solar_score: number;
  wind_score: number;
  hybrid_score: number;
  solar_output: number;
  wind_output: number;
  elevation_meters: number;
}

export interface MonthlyData {
  [month: string]: number;
}

export interface NRELData {
  annual_ghi: number;
  annual_dni: number;
  monthly_ghi: MonthlyData;
  monthly_dni: MonthlyData;
  annual_lat_tilt: number;
}

export interface ElevationMap {
  imageUrl: string;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  minElevation: number;
  maxElevation: number;
}

// API Functions
export const fetchLocations = async (): Promise<Location[]> => {
  try {
    const response = await fetch(`${API_URL}/locations`);
    if (!response.ok) {
      throw new Error(`Error fetching locations: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    toast.error("Failed to fetch locations. Using sample data instead.");
    
    // Return some sample locations if the API fails
    return [
      { id: "1", name: "Kern County, CA", coordinates: "35.4937,-118.8591", active: true },
      { id: "2", name: "Phoenix, AZ", coordinates: "33.4484,-112.0740", active: true },
      { id: "3", name: "Amarillo, TX", coordinates: "35.2220,-101.8313", active: true },
      { id: "4", name: "Boulder, CO", coordinates: "40.0150,-105.2705", active: true },
      { id: "5", name: "San Diego, CA", coordinates: "32.7157,-117.1611", active: true },
      { id: "6", name: "Chicago, IL", coordinates: "41.8781,-87.6298", active: true },
    ];
  }
};

export const toggleLocationActive = async (id: string, active: boolean): Promise<Location> => {
  try {
    const response = await fetch(`${API_URL}/locations/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating location: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to update location:", error);
    toast.error("Failed to update location status");
    throw error;
  }
};

export const addLocation = async (name: string, coordinates: string): Promise<Location> => {
  try {
    const response = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, coordinates }),
    });
    
    if (!response.ok) {
      throw new Error(`Error adding location: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to add location:", error);
    toast.error("Failed to add new location");
    throw error;
  }
};

export const runAnalysis = async (startDate: string, endDate: string): Promise<AnalysisResults> => {
  try {
    toast.info("Analysis started. This may take a few minutes...");
    
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate }),
    });
    
    if (!response.ok) {
      throw new Error(`Error running analysis: ${response.statusText}`);
    }
    
    const rawResult = await response.json();
    console.log("Raw analysis results:", rawResult);
    
    // Map the response to the expected format
    const result: AnalysisResults = {
      solar: rawResult.solar_results || [],
      wind: rawResult.wind_results || [],
      combined: [] // You'll need to generate this or get it from the backend
    };
    
    // If there's no combined data, we can generate it if we have both solar and wind data
    if (result.solar.length && result.wind.length && !result.combined.length) {
      result.combined = result.solar.map(solarItem => {
        const matchingWind = result.wind.find(w => w.location === solarItem.location);
        if (matchingWind) {
          return {
            location: solarItem.location,
            solar_score: solarItem.solar_score,
            wind_score: matchingWind.wind_score,
            hybrid_score: (solarItem.solar_score + matchingWind.wind_score) / 2, // Simple average
            solar_output: solarItem.estimated_daily_output_kwh,
            wind_output: matchingWind.estimated_daily_output_kwh,
            elevation_meters: solarItem.elevation_meters || matchingWind.elevation_meters
          };
        }
        return null;
      }).filter(item => item !== null) as CombinedResult[];
    }
    
    toast.success("Analysis completed successfully!");
    console.log("Processed analysis results:", result);
    return result;
  } catch (error) {
    console.error("Analysis failed:", error);
    toast.error("Analysis failed. Using sample data instead.");
    
    // Return mock data if API fails
    return {
      solar: [
        { location: "Kern County, CA", solar_score: 92.5, avg_solar_irradiance: 780, avg_temperature: 28.3, avg_humidity: 32, avg_uv_index: 8.9, elevation_meters: 625, estimated_daily_output_kwh: 5840 },
        { location: "Phoenix, AZ", solar_score: 96.2, avg_solar_irradiance: 810, avg_temperature: 32.1, avg_humidity: 28, avg_uv_index: 9.6, elevation_meters: 340, estimated_daily_output_kwh: 6120 },
        { location: "Amarillo, TX", solar_score: 89.7, avg_solar_irradiance: 760, avg_temperature: 25.8, avg_humidity: 42, avg_uv_index: 8.5, elevation_meters: 1100, estimated_daily_output_kwh: 5620 },
        { location: "Boulder, CO", solar_score: 84.3, avg_solar_irradiance: 720, avg_temperature: 22.4, avg_humidity: 39, avg_uv_index: 8.3, elevation_meters: 1650, estimated_daily_output_kwh: 5380 },
        { location: "San Diego, CA", solar_score: 86.1, avg_solar_irradiance: 740, avg_temperature: 24.8, avg_humidity: 55, avg_uv_index: 8.4, elevation_meters: 20, estimated_daily_output_kwh: 5460 },
        { location: "Chicago, IL", solar_score: 71.5, avg_solar_irradiance: 630, avg_temperature: 18.9, avg_humidity: 64, avg_uv_index: 7.2, elevation_meters: 180, estimated_daily_output_kwh: 4640 },
      ],
      wind: [
        { location: "Kern County, CA", wind_score: 73.5, avg_wind_speed: 6.8, max_wind_gust: 18.4, wind_direction: 220, pressure: 1013, wind_stability: 1.4, elevation_meters: 625, estimated_daily_output_kwh: 3780 },
        { location: "Phoenix, AZ", wind_score: 58.2, avg_wind_speed: 5.2, max_wind_gust: 15.6, wind_direction: 240, pressure: 1010, wind_stability: 1.8, elevation_meters: 340, estimated_daily_output_kwh: 2950 },
        { location: "Amarillo, TX", wind_score: 89.3, avg_wind_speed: 9.1, max_wind_gust: 24.5, wind_direction: 265, pressure: 1004, wind_stability: 2.3, elevation_meters: 1100, estimated_daily_output_kwh: 5780 },
        { location: "Boulder, CO", wind_score: 86.7, avg_wind_speed: 8.6, max_wind_gust: 22.8, wind_direction: 290, pressure: 998, wind_stability: 2.5, elevation_meters: 1650, estimated_daily_output_kwh: 5480 },
        { location: "San Diego, CA", wind_score: 62.4, avg_wind_speed: 5.7, max_wind_gust: 14.8, wind_direction: 270, pressure: 1015, wind_stability: 1.2, elevation_meters: 20, estimated_daily_output_kwh: 3240 },
        { location: "Chicago, IL", wind_score: 79.8, avg_wind_speed: 7.8, max_wind_gust: 21.3, wind_direction: 250, pressure: 1008, wind_stability: 3.2, elevation_meters: 180, estimated_daily_output_kwh: 4860 },
      ],
      combined: [
        { location: "Kern County, CA", solar_score: 92.5, wind_score: 73.5, hybrid_score: 83.0, solar_output: 5840, wind_output: 3780, elevation_meters: 625 },
        { location: "Phoenix, AZ", solar_score: 96.2, wind_score: 58.2, hybrid_score: 77.2, solar_output: 6120, wind_output: 2950, elevation_meters: 340 },
        { location: "Amarillo, TX", solar_score: 89.7, wind_score: 89.3, hybrid_score: 89.5, solar_output: 5620, wind_output: 5780, elevation_meters: 1100 },
        { location: "Boulder, CO", solar_score: 84.3, wind_score: 86.7, hybrid_score: 85.5, solar_output: 5380, wind_output: 5480, elevation_meters: 1650 },
        { location: "San Diego, CA", solar_score: 86.1, wind_score: 62.4, hybrid_score: 74.3, solar_output: 5460, wind_output: 3240, elevation_meters: 20 },
        { location: "Chicago, IL", solar_score: 71.5, wind_score: 79.8, hybrid_score: 75.6, solar_output: 4640, wind_output: 4860, elevation_meters: 180 },
      ]
    };
  }
};

export const fetchElevationMap = async (locationName: string, coordinates: string): Promise<ElevationMap | null> => {
  try {
    const response = await fetch(`${API_URL}/elevation-map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: locationName, coordinates }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching elevation map: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch elevation map:", error);
    toast.error("Failed to fetch elevation map");
    return null;
  }
};

export const fetchMonthlyData = async (locationName: string, coordinates: string): Promise<MonthlyData | null> => {
  try {
    const response = await fetch(`${API_URL}/monthly-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: locationName, coordinates }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching monthly data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch monthly data:", error);
    toast.error("Failed to fetch monthly solar data");
    
    // Return mock monthly data
    return {
      "Jan": 4.2,
      "Feb": 5.1,
      "Mar": 6.3,
      "Apr": 7.6,
      "May": 8.5,
      "Jun": 9.1,
      "Jul": 9.0,
      "Aug": 8.3,
      "Sep": 7.5,
      "Oct": 6.2,
      "Nov": 4.8,
      "Dec": 3.9
    };
  }
};
