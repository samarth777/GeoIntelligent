# energy_analyzer.py
import pandas as pd
import matplotlib.pyplot as plt
import configparser
import requests
import json
from datetime import datetime
import numpy as np
import ibmpairs.client as client
import ibmpairs.query as query
from PIL import Image
import matplotlib.colors as colors
from typing import Tuple, Dict, Any, Optional, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ElevationDataHandler:
    def __init__(self, pairs_client):
        self.client = pairs_client
        self.elevation_layer_id = "140"  # USGS basic land elevation data
        
    def get_point_elevation(self, coordinates: List[float]) -> Optional[float]:
        """Get elevation for specific points"""
        try:
            query_result = query.submit(
                {
                    "layers": [{"type": "raster", "id": self.elevation_layer_id}],
                    "spatial": {
                        "type": "point",
                        "coordinates": coordinates
                    },
                    "temporal": {
                        "intervals": [{"start": "2013-01-01T00:00:00Z", "end": "2013-01-01T00:00:00Z"}]
                    }
                }, client=self.client)
            
            point_df = query_result.point_data_as_dataframe()
            return point_df['value'].values[0] if not point_df.empty else None
        except Exception as e:
            logger.error(f"Error fetching elevation data: {str(e)}")
            return None
    
    def get_area_elevation_map(self, coordinates: str, location_name: str) -> Dict[str, Any]:
        """Get elevation map data for an area around the coordinates"""
        try:
            lat, lon = map(float, coordinates.split(','))
            area_size = 0.025  # Initial area size
            
            query_result = query.submit_check_status_and_download(
                {
                    "publish": True,
                    "name": f"Elevation map for {location_name}",
                    "spatial": {
                        "type": "square",
                        "coordinates": [lat - area_size, lon - area_size, 
                                       lat + area_size, lon + area_size]
                    },
                    "temporal": {
                        "intervals": [{"start": "2013-01-01T00:00:00Z", "end": "2013-01-01T00:00:00Z"}]
                    },
                    "layers": [{"type": "raster", "id": self.elevation_layer_id, "output": True}]
                }, client=self.client)
            
            # Process the downloaded TIFF file
            tiff_files = [f for f in query_result.list_files() if f.endswith('.tiff')]
            if tiff_files:
                with open(tiff_files[0]+'.json', 'r') as summary_file:
                    fileparms = json.load(summary_file)
                
                boundingBox = fileparms["boundingBox"]
                pixelStatistics = fileparms["rasterStatistics"]
                
                arrayNED = np.array(Image.open(tiff_files[0]))
                mask = (arrayNED == -9999)  # Mask no-data values
                masked_array = np.ma.masked_array(arrayNED, mask)
                
                return {
                    "location": location_name,
                    "coordinates": coordinates,
                    "elevation_data": masked_array.tolist(),
                    "bounding_box": boundingBox,
                    "statistics": pixelStatistics,
                    "min_elevation": pixelStatistics["pixelMin"],
                    "max_elevation": pixelStatistics["pixelMax"]
                }
            return None
        except Exception as e:
            logger.error(f"Error generating elevation map: {str(e)}")
            return None

class RenewableEnergySiteSelector:
    def __init__(self, api_key: str, org_id: str, tenant_id: str):
        self.api_key = api_key
        self.org_id = org_id
        self.tenant_id = tenant_id
        self.jwt_token = self._authenticate()
        self.query_headers = {
            "X-IBM-Client-Id": 'geospatial-' + self.tenant_id,
            "Authorization": f"Bearer {self.jwt_token}"
        }
        self.elevation_handler = ElevationDataHandler(client.get_client(
            api_key=api_key,
            tenant_id=tenant_id,
            org_id=org_id,
            legacy=False,
            version=3
        ))
        self.weather_cache = {}  # Cache for weather data
        self.NREL_API_KEY = "1bJSt3fovG4suM6XqYCUZXsOqC2ve2E6RstlQE4a"  # Default to demo key
    
    def _authenticate(self) -> str:
        """Authenticate and retrieve JWT token"""
        auth_request_headers = {
            "X-IBM-Client-Id": 'saascore-' + self.tenant_id,
            "X-API-Key": self.api_key
        }
        auth_url = f"https://api.ibm.com/saascore/run/authentication-retrieve/api-key?orgId={self.org_id}"
        response = requests.get(url=auth_url, headers=auth_request_headers, verify=True)
        
        if response.status_code == 200:
            return response.text
        else:
            logger.error("Authentication Failed. Please check your API credentials.")
            raise Exception("Authentication Failed")
    
    def fetch_weather_data(self, geocode: str, start_date: str, end_date: str, units: str = "e") -> Optional[pd.DataFrame]:
        """Fetch weather data for a specific location and time period"""
        cache_key = f"{geocode}_{start_date}_{end_date}"
        if cache_key in self.weather_cache:
            return self.weather_cache[cache_key]
            
        query_params = {
            "geocode": geocode,
            "startDateTime": start_date,
            "endDateTime": end_date,
            "format": "json",
            "units": units,
            "compact": "false"
        }
        
        all_data = []
        page_number = 1
        
        while True:
            data = self._fetch_page("https://api.ibm.com/geospatial/run/v3/wx/hod/r1/direct", 
                                   query_params, page_number)
            if data is not None and len(data) > 0:
                all_data.extend(data)
                page_number += 1
            else:
                break
        
        if all_data:
            df = pd.DataFrame(all_data)
            self.weather_cache[cache_key] = df
            return df
        return None
    
    def _fetch_page(self, endpoint: str, query_params: Dict[str, Any], page_number: int = None) -> Optional[List[Dict]]:
        """Fetch a single page of data from the API"""
        if page_number:
            query_params["pageNumber"] = str(page_number)
        
        request = requests.Request('GET', endpoint, params=query_params, headers=self.query_headers)
        session = requests.Session()
        response = session.send(request.prepare())
        
        if response.status_code == 204:
            return []
        if response.status_code != 200:
            logger.error(f"Error fetching data: {response.status_code} - {response.text}")
            return None
        
        if response.text:
            try:
                return response.json()
            except json.JSONDecodeError:
                logger.error("Error decoding JSON response")
                return None
        return []
    
    def analyze_locations(self, locations: List[Tuple[str, str]], start_date: str, end_date: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Analyze both solar and wind potential for multiple locations"""
        solar_results = []
        wind_results = []
        
        for location in locations:
            location_name, geocode = location
            weather_data = self.fetch_weather_data(geocode, start_date, end_date)
            if weather_data is None or len(weather_data) == 0:
                continue
            
            elevation = self.elevation_handler.get_point_elevation(
                [float(coord) for coord in geocode.split(',')])
            elevation_float = float(elevation) if elevation is not None else 0
            
            features = self._preprocess_features(weather_data)
            
            solar_data = self._calculate_solar_metrics(location_name, features, elevation_float, geocode)
            solar_results.append(solar_data)
            
            wind_data = self._calculate_wind_metrics(location_name, features, elevation_float)
            wind_results.append(wind_data)
        
        return (pd.DataFrame(solar_results) if solar_results else pd.DataFrame(), 
                pd.DataFrame(wind_results) if wind_results else pd.DataFrame())
    
    def _calculate_solar_metrics(self, location_name: str, features: Dict[str, Any], 
                               elevation: float, geocode: str) -> Dict[str, Any]:
        """Calculate solar metrics using enhanced PVWatts model"""
        nrel_data = self.fetch_nrel_solar_data(geocode) if geocode else None

        if not nrel_data:
            return {
                'location': location_name,
                'solar_score': 0,
                'avg_solar_irradiance': 0,
                'avg_temperature': 0,
                'avg_humidity': 0,
                'avg_uv_index': 0,
                'elevation_meters': elevation,
                'estimated_daily_output_kwh': 0
            }

        system_capacity = 1000  # kW
        base_derate_factor = 0.84
        temp_coeff = -0.0035
        ref_temp = 25  # Reference temperature (°C)

        daily_ghi = nrel_data['annual_ghi'] / 365
        daily_dni = nrel_data['annual_dni'] / 365

        lat = float(geocode.split(',')[0]) if geocode else 0
        dni_weight = min(0.55, 0.3 + abs(lat) / 180)
        ghi_weight = 1 - dni_weight

        effective_irradiance = daily_ghi * ghi_weight + daily_dni * dni_weight

        avg_temp = features.get('temperature', 25)
        avg_humidity = features.get('humidity', 50)

        if avg_temp <= ref_temp:
            temp_derate = 1 + abs(avg_temp - ref_temp) * 0.0005
        elif avg_temp <= 45:
            humidity_factor = min(1, avg_humidity / 60)
            temp_derate = 1 + (avg_temp - ref_temp) * temp_coeff * humidity_factor
        else:
            humidity_factor = min(1, avg_humidity / 50)
            temp_derate = 1 + (45 - ref_temp) * temp_coeff * humidity_factor + (avg_temp - 45) * temp_coeff * humidity_factor

        if avg_humidity < 40:
            humidity_derate = 1.02
        elif avg_humidity < 70:
            humidity_derate = 1 - (avg_humidity - 40) * 0.0004
        else:
            humidity_derate = 0.988 - (avg_humidity - 70) * 0.001

        elevation_benefit = (elevation / 1000) * 0.03
        elevation_derate = 1 + min(elevation_benefit, 0.06)

        if 0 <= abs(lat) <= 23.5:
            lat_factor = 1.05
        elif 23.5 < abs(lat) <= 35:
            lat_factor = 1.08
        elif 35 < abs(lat) <= 50:
            lat_factor = 1 - (abs(lat) - 35) * 0.006
        else:
            lat_factor = 0.91 - (abs(lat) - 50) * 0.012

        if 'annual_lat_tilt' in nrel_data:
            lat_tilt_daily = nrel_data['annual_lat_tilt'] / 365
            effective_irradiance = lat_tilt_daily * 0.8 + effective_irradiance * 0.2

        combined_derate = base_derate_factor * temp_derate * humidity_derate * elevation_derate * lat_factor
        daily_energy = system_capacity * effective_irradiance * combined_derate

        if 'monthly_ghi' in nrel_data:
            monthly_values = list(nrel_data['monthly_ghi'].values())
            seasonal_variation = np.std(monthly_values) / np.mean(monthly_values)
            expected_variation = min(0.4, abs(lat) / 140)

            if seasonal_variation > expected_variation:
                daily_energy *= (1 - (seasonal_variation - expected_variation) * 0.9)

        if 'cloud_cover' in features:
            cloud_cover = features['cloud_cover']
            if cloud_cover < 20:
                cloud_factor = 1 - (cloud_cover / 100) * 0.1
            elif cloud_cover < 50:
                cloud_factor = 0.98 - (cloud_cover - 20) / 100 * 0.4
            else:
                cloud_factor = 0.86 - (cloud_cover - 50) / 100 * 0.7
            daily_energy *= cloud_factor

        solar_score = (daily_energy / (system_capacity * 24 * 0.3)) * 100
        solar_score = min(100, max(0, solar_score))

        return {
            'location': location_name,
            'solar_score': solar_score*100,
            'avg_solar_irradiance': effective_irradiance * 1000,
            'avg_temperature': avg_temp,
            'avg_humidity': avg_humidity,
            'avg_uv_index': features.get('uv_index', 0),
            'elevation_meters': elevation,
            'estimated_daily_output_kwh': daily_energy,
            'pvwatts_derate': combined_derate
        }
    
    def _calculate_wind_metrics(self, location_name: str, features: Dict[str, Any], elevation: float) -> Dict[str, Any]:
        """Calculate wind metrics for a location"""
        avg_wind_speed = features.get('wind_speed', 0)
        max_wind_gust = features.get('wind_gust', 0)
        wind_stability = features.get('wind_stability', 0)
        
        elevation_factor = min(1.0 + (elevation / 1500), 1.4)
        wind_score = ((avg_wind_speed * 0.5) + (max_wind_gust * 0.3) + 
                     ((10 - wind_stability) * 0.2)) * elevation_factor
        
        air_density = 1.225  # kg/m^3
        rotor_diameter = 80  # m
        swept_area = 3.14159 * (rotor_diameter/2)**2
        power_coefficient = 0.35
        
        wind_output = 0.5 * air_density * swept_area * ((avg_wind_speed * elevation_factor)**3) * power_coefficient * 24 / 1000
        
        return {
            'location': location_name,
            'wind_score': wind_score,
            'avg_wind_speed': avg_wind_speed,
            'max_wind_gust': max_wind_gust,
            'wind_direction': features.get('wind_direction', 0),
            'pressure': features.get('pressure', 0),
            'wind_stability': wind_stability,
            'elevation_meters': elevation,
            'estimated_daily_output_kwh': wind_output
        }
    
    def _preprocess_features(self, weather_data: pd.DataFrame) -> Dict[str, Any]:
        """Extract and preprocess features from weather data"""
        features = {}
        
        # Solar-related features
        features['ghi'] = weather_data['globalHorizontalIrradiance'].mean() if 'globalHorizontalIrradiance' in weather_data else 0
        features['dni'] = weather_data['directNormalIrradiance'].mean() if 'directNormalIrradiance' in weather_data else 0
        features['dhi'] = weather_data['diffuseHorizontalIrradiance'].mean() if 'diffuseHorizontalIrradiance' in weather_data else 0
        features['temperature'] = weather_data['temperature'].mean() if 'temperature' in weather_data else 0
        features['humidity'] = weather_data['relativeHumidity'].mean() if 'relativeHumidity' in weather_data else 0
        features['uv_index'] = weather_data['uvIndex'].mean() if 'uvIndex' in weather_data else 0
        
        # Wind-related features
        features['wind_speed'] = weather_data['windSpeed'].mean() if 'windSpeed' in weather_data else 0
        features['wind_gust'] = weather_data['windGust'].max() if 'windGust' in weather_data else 0
        features['wind_direction'] = weather_data['windDirection'].mean() if 'windDirection' in weather_data else 0
        features['pressure'] = weather_data['pressureMeanSeaLevel'].mean() if 'pressureMeanSeaLevel' in weather_data else 0
        
        # Stability features
        features['temp_stability'] = weather_data['temperature'].std() if 'temperature' in weather_data else 0
        features['wind_stability'] = weather_data['windSpeed'].std() if 'windSpeed' in weather_data else 0
        
        return features

    def fetch_nrel_solar_data(self, geocode: str) -> Optional[Dict[str, Any]]:
        """Fetch solar resource data from NREL API"""
        lat, lon = geocode.split(',')
        url = f"https://developer.nrel.gov/api/solar/solar_resource/v1.json?api_key={self.NREL_API_KEY}&lat={lat}&lon={lon}"
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return {
                    'annual_ghi': data['outputs']['avg_ghi']['annual'],
                    'annual_dni': data['outputs']['avg_dni']['annual'],
                    'monthly_ghi': data['outputs']['avg_ghi']['monthly'],
                    'monthly_dni': data['outputs']['avg_dni']['monthly'],
                    'annual_lat_tilt': data['outputs']['avg_lat_tilt']['annual']
                }
            logger.warning(f"Failed to fetch NREL data for {lat},{lon}: {response.status_code}")
            return None
        except Exception as e:
            logger.warning(f"Error fetching NREL data: {str(e)}")
            return None

    def generate_elevation_map_data(self, location_name: str, coordinates: str) -> Dict[str, Any]:
        """Generate elevation map data for a location"""
        return self.elevation_handler.get_area_elevation_map(coordinates, location_name)

    def get_monthly_data(self, location_name: str, coordinates: str) -> Dict[str, Any]:
        """Get monthly solar data for a location"""
        nrel_data = self.fetch_nrel_solar_data(coordinates)
        if nrel_data and 'monthly_ghi' in nrel_data:
            return {
                'location': location_name,
                'coordinates': coordinates,
                'monthly_ghi': nrel_data['monthly_ghi'],
                'monthly_dni': nrel_data['monthly_dni']
            }
        return None