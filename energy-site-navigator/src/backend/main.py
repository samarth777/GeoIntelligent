# main.py
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import json
import os
import logging
from datetime import datetime
from pydantic import BaseModel
from energy_analyzer import RenewableEnergySiteSelector
import configparser

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Read credentials from config
config = configparser.RawConfigParser()
config.read('secrets.ini')

try:
    EI_API_KEY = config.get('EI', 'api.api_key')
    EI_ORG_ID = config.get('EI', 'api.org_id')
    EI_TENANT_ID = config.get('EI', 'api.tenant_id')
except Exception as e:
    logger.error(f"Failed to read configuration: {str(e)}")
    raise RuntimeError("Failed to read configuration")

app = FastAPI(title="Renewable Energy Site Selection API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define models
class Location(BaseModel):
    id: str
    name: str
    coordinates: str
    active: bool

class LocationCreate(BaseModel):
    name: str
    coordinates: str

class LocationToggle(BaseModel):
    active: bool

class AnalysisRequest(BaseModel):
    startDate: str
    endDate: str

class ElevationMapRequest(BaseModel):
    location: str
    coordinates: str

# Store locations in memory (in a real app, use a database)
locations_data = [
    {"id": "1", "name": "Kern County, CA", "coordinates": "35.4937,-118.8591", "active": True},
    {"id": "2", "name": "Phoenix, AZ", "coordinates": "33.4484,-112.0740", "active": True},
    {"id": "3", "name": "Amarillo, TX", "coordinates": "35.2220,-101.8313", "active": True},
    {"id": "4", "name": "Boulder, CO", "coordinates": "40.0150,-105.2705", "active": True},
    {"id": "5", "name": "San Diego, CA", "coordinates": "32.7157,-117.1611", "active": True},
    {"id": "6", "name": "Chicago, IL", "coordinates": "41.8781,-87.6298", "active": True},
]

def get_energy_analyzer():
    try:
        return RenewableEnergySiteSelector(EI_API_KEY, EI_ORG_ID, EI_TENANT_ID)
    except Exception as e:
        logger.error(f"Failed to initialize energy analyzer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"API configuration error: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint to check if API is running"""
    return {"message": "Renewable Energy Site Selection API is running"}

@app.get("/locations", response_model=List[Location])
async def get_locations():
    """Get all locations"""
    logger.info(f"Retrieved {len(locations_data)} locations")
    return locations_data

@app.post("/locations", response_model=Location)
async def create_location(location: LocationCreate):
    """Add a new location"""
    new_id = str(max(int(loc["id"]) for loc in locations_data) + 1)
    new_location = {
        "id": new_id,
        "name": location.name,
        "coordinates": location.coordinates,
        "active": True
    }
    locations_data.append(new_location)
    logger.info(f"Created new location: {location.name}")
    return new_location

@app.patch("/locations/{location_id}/toggle", response_model=Location)
async def toggle_location(location_id: str, toggle: LocationToggle):
    """Toggle location active status"""
    for loc in locations_data:
        if loc["id"] == location_id:
            loc["active"] = toggle.active
            logger.info(f"Updated location {loc['name']} active status to: {toggle.active}")
            return loc
    logger.warning(f"Location ID {location_id} not found")
    raise HTTPException(status_code=404, detail="Location not found")

@app.post("/analyze")
async def analyze_locations(request: AnalysisRequest, 
                          energy_analyzer: RenewableEnergySiteSelector = Depends(get_energy_analyzer)):
    """Run analysis on active locations"""
    active_locations = [(loc["name"], loc["coordinates"]) for loc in locations_data if loc["active"]]
    
    if not active_locations:
        logger.warning("Analysis requested but no active locations")
        raise HTTPException(status_code=400, detail="No active locations to analyze")
    
    try:
        logger.info(f"Starting analysis for {len(active_locations)} locations from {request.startDate} to {request.endDate}")
        solar_results, wind_results = energy_analyzer.analyze_locations(
            active_locations,
            request.startDate,
            request.endDate
        )
        
        # Convert DataFrames to dictionaries for JSON serialization
        solar_data = solar_results.to_dict(orient='records') if not solar_results.empty else []
        wind_data = wind_results.to_dict(orient='records') if not wind_results.empty else []
        
        logger.info("Analysis completed successfully")
        return {
            "solar_results": solar_data,
            "wind_results": wind_data
        }
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/elevation-map")
async def get_elevation_map(request: ElevationMapRequest, 
                           energy_analyzer: RenewableEnergySiteSelector = Depends(get_energy_analyzer)):
    """Get elevation map for a location"""
    try:
        logger.info(f"Generating elevation map for {request.location}")
        elevation_map = energy_analyzer.generate_elevation_map_data(
            request.location,
            request.coordinates
        )
        if elevation_map:
            return elevation_map
        raise HTTPException(status_code=404, detail="Elevation data not available")
    except Exception as e:
        logger.error(f"Failed to generate elevation map: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate elevation map: {str(e)}")

@app.post("/monthly-data")
async def get_monthly_data(request: ElevationMapRequest, 
                          energy_analyzer: RenewableEnergySiteSelector = Depends(get_energy_analyzer)):
    """Get monthly solar data for a location"""
    try:
        logger.info(f"Getting monthly data for {request.location}")
        monthly_data = energy_analyzer.get_monthly_data(
            request.location,
            request.coordinates
        )
        if monthly_data:
            return monthly_data
        raise HTTPException(status_code=404, detail="Monthly data not available")
    except Exception as e:
        logger.error(f"Failed to get monthly data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get monthly data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Renewable Energy Site Selection API server")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)