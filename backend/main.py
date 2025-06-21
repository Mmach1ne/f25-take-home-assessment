from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uvicorn


#Could add a seperate if clause for historical data instead of current data. (requires paid api access)

app = FastAPI(title="Weather Data System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for weather data
weather_storage: Dict[str, Dict[str, Any]] = {}

class WeatherRequest(BaseModel):
    date: str
    location: str
    notes: Optional[str] = ""

class WeatherResponse(BaseModel):
    id: str

@app.post("/weather", response_model=WeatherResponse)
async def create_weather_request(request: WeatherRequest):

    weather_id = str(uuid.uuid4())
    W_API = "0bfd9b2ffc4866026f7381c4396ab17e"
    #Api Call 
    try:
        W_URL= "http://api.weatherstack.com/"
        parameters = {
            "access_key":W_API,
            "query" : request.location
        }

        response = request.get(W_URL, params = parameters, timeout=5)
        response.raise_for_status()

        weather_data = response.json()

        if "error" in weather_data:
            raise HTTPException(
                status_code=400,
                detail=f"Weather API Error:{weather_data["error"].get("info", "Unknown Weatherstack error")}"
            )
        
        data = {
            "id": weather_data,
            "date": request.data,
            "location": request.location,
            "notes": request.notes,
            "submitted_at": datetime.utc.now().isoformat(),
            "weather": {
                "location": weather_data.get("location",{}),
                "current": weather_data.get("current", {}),
            }
        }
        weather_storage[weather_id] = data

        return WeatherResponse(id=weather_id)

    except request.exception.RequestException as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch weather data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

    """
    You need to implement this endpoint to handle the following:
    1. Receive form data (date, location, notes)
    2. Calls WeatherStack API for the location
    3. Stores combined data with unique ID in memory
    4. Returns the ID to frontend
    """

@app.get("/weather/{weather_id}")
async def get_weather_data(weather_id: str):
    """
    Retrieve stored weather data by ID.
    This endpoint is already implemented for the assessment.
    """
    if weather_id not in weather_storage:
        raise HTTPException(status_code=404, detail="Weather data not found")
    
    return weather_storage[weather_id]


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)