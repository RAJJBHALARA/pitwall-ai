from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import fastf1
from dotenv import load_dotenv

from f1_data import (
    get_available_races,
    get_drivers,
    get_lap_times,
    get_tire_strategy,
    get_rivalry_stats,
    get_recent_form,
    get_lap_telemetry
)
from ai_advisor import get_fantasy_picks, explain_lap, get_rivalry_analysis

load_dotenv()

# Setup Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="PitWall AI Backend", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allowed Origins
origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Verification Dependency
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "fallback_dev_key")
async def verify_api_key(request: Request):
    """Enforce X-API-Key header on every route strictly as requested."""
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=403, detail="API key is missing")
    if api_key != API_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# Event on startup
@app.on_event("startup")
async def startup_event():
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("[WARNING] GEMINI_API_KEY is not set. AI features will fail!")
    
    # Verify Cache structure exists
    cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
        print(f"[INFO] Created FastF1 cache directory at {cache_dir}")
    else:
        print(f"[INFO] FastF1 cache directory ready at {cache_dir}")

# Models
class FantasyPicksReq(BaseModel):
    race: str
    year: int

# --- API Endpoints ---

@app.get("/api/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    """Public health endpoint, no API key needed for basic check."""
    return {"status": "ok", "ai": "gemini-1.5-pro"}

@app.get("/api/races", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
async def fetch_races(request: Request, year: int = 2024):
    races = get_available_races(year)
    if not races:
        raise HTTPException(status_code=404, detail="No races found.")
    return {"races": races}

@app.get("/api/drivers", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
async def fetch_drivers(request: Request, year: int = 2024):
    drivers = get_drivers(year)
    if not drivers:
        raise HTTPException(status_code=404, detail="Drivers not found.")
    return {"drivers": drivers}

@app.get("/api/lap-times", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
async def fetch_lap_times_api(request: Request, year: int, race: str, session: str):
    data = get_lap_times(year, race, session)
    if not data or not data.get("drivers"):
        raise HTTPException(status_code=404, detail="No lap times data available.")
    return data

@app.get("/api/tire-strategy", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
async def fetch_tire_strategy_api(request: Request, year: int, race: str):
    data = get_tire_strategy(year, race)
    if not data:
        raise HTTPException(status_code=404, detail="No tire strategy available.")
    return {"data": data}

import asyncio

@app.get("/api/rivalry", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
async def fetch_rivalry_api(request: Request, year: int, driver1: str, driver2: str):
    try:
        stats = await asyncio.to_thread(get_rivalry_stats, year, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rivalry computation failed: {str(e)}")
    
    if not stats:
        raise HTTPException(status_code=404, detail="No rivalry data available.")
    
    try:
        ai_analysis = await asyncio.to_thread(get_rivalry_analysis, stats, driver1, driver2)
    except Exception:
        ai_analysis = ""
    
    return {
        "stats": stats,
        "aiAnalysis": ai_analysis
    }

@app.get("/api/telemetry", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
async def fetch_telemetry_api(request: Request, year: int, race: str, driver: str, lap: int):
    telemetry = get_lap_telemetry(year, race, driver, lap)
    if not telemetry:
        raise HTTPException(status_code=404, detail="No telemetry available for this lap.")
        
    ai_analysis = explain_lap(telemetry, driver, race, lap)
    telemetry["aiAnalysis"] = ai_analysis
    return telemetry

@app.post("/api/fantasy-picks", dependencies=[Depends(verify_api_key)])
@limiter.limit("5/minute")
async def fetch_fantasy_picks_api(request: Request, req: FantasyPicksReq):
    """Fetch AI-powered fantasy picks. Runs heavy computation in background thread."""
    try:
        # Run the heavy form data collection in a thread
        form_data = await asyncio.to_thread(_collect_form_data)
        # Run AI picks generation in a thread  
        picks = await asyncio.to_thread(get_fantasy_picks, req.race, form_data)
        return picks
    except Exception as e:
        print(f"[Fantasy Error] {e}")
        return {
            "error": True,
            "message": f"Fantasy picks generation failed: {str(e)}",
            "drivers": [],
            "constructor": {"name": "Unknown", "reasoning": ""},
            "key_insight": "Analysis temporarily unavailable.",
            "drivers_to_avoid": []
        }


def _collect_form_data() -> dict:
    """Collect recent form data for top drivers. Called in a thread."""
    top_drivers = ["VER", "LEC", "NOR", "SAI", "PIA", "HAM", "RUS", "ALO"]
    form_data = {}
    for drv in top_drivers:
        try:
            form = get_recent_form(drv, n=3)
            if form:
                form_data[drv] = form.get("recent", [])
        except:
            continue
    return form_data
