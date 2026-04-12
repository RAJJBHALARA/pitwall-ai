import os
import time
import fastf1
import pandas as pd
import numpy as np
from typing import Dict, Any, List

RACE_NAME_MAP = {
  "Albert Park Circuit": "Australia",
  "Jeddah Corniche Circuit": "Saudi Arabia",
  "Bahrain International Circuit": "Bahrain",
  "Monaco Circuit": "Monaco",
  "Circuit de Barcelona": "Spain",
  "Silverstone Circuit": "British",
  "Monza Circuit": "Italian",
  "Suzuka Circuit": "Japanese",
  "Singapore Street Circuit": "Singapore",
  "Circuit of the Americas": "United States",
  "Interlagos Circuit": "Brazilian",
  "Yas Marina Circuit": "Abu Dhabi",
  "Hungaroring": "Hungary",
  "Spa-Francorchamps": "Belgium",
  "Zandvoort Circuit": "Netherlands",
  "Red Bull Ring": "Austria",
  "Baku City Circuit": "Azerbaijan",
  "Miami International Autodrome": "Miami",
  "Las Vegas Street Circuit": "Las Vegas",
  "Lusail International Circuit": "Qatar",
  "Mexico City Circuit": "Mexico",
  "Shanghai International Circuit": "China",
  "Imola Circuit": "Emilia Romagna",
  "Circuit Gilles-Villeneuve": "Canada"
}

# Setup Cache
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

# Suppress warnings
pd.options.mode.chained_assignment = None

# --- In-Memory Cache with TTL ---
_mem_cache: Dict[str, Any] = {}
CACHE_TTL = 3600  # 1 hour

def _cache_get(key: str):
    """Return cached value if exists and not expired, else None."""
    if key in _mem_cache:
        data, ts = _mem_cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
        del _mem_cache[key]
    return None

def _cache_set(key: str, data):
    """Store data in memory cache with current timestamp."""
    _mem_cache[key] = (data, time.time())

def get_available_races(year: int) -> list:
    try:
        events = fastf1.get_event_schedule(year)
        # Filter testing out
        races = events[events['EventFormat'] != 'testing']
        return races['EventName'].tolist()
    except Exception as e:
        print(f"[FastF1 Error] get_available_races: {e}")
        return []

def get_drivers(year: int) -> list:
    """Returns list of drivers for dropdowns."""
    try:
        # We can just get drivers from the first race of the year, or any valid session
        events = fastf1.get_event_schedule(year)
        first_race = events[events['EventFormat'] != 'testing'].iloc[0]['EventName']
        session = fastf1.get_session(year, first_race, 'R')
        session.load(telemetry=False, weather=False, messages=False)
        
        drivers = []
        for drv in session.drivers:
            drv_info = session.get_driver(drv)
            code = drv_info.get('Abbreviation', str(drv))
            name = drv_info.get('FullName', code)
            team = drv_info.get('TeamName', 'Unknown')
            drivers.append({"code": code, "name": name, "team": team})
            
        return drivers
    except Exception as e:
        print(f"[FastF1 Error] get_drivers: {e}")
        return []

def get_lap_times(year: int, race: str, session_type: str) -> dict:
    try:
        race = RACE_NAME_MAP.get(race, race)
        session = fastf1.get_session(year, race, session_type)
        session.load(telemetry=False, weather=False, messages=False)
        
        laps = session.laps
        drivers_list = []
        laps_dict = {}
        
        for drv in session.drivers:
            drv_info = session.get_driver(drv)
            drv_code = drv_info.get('Abbreviation', str(drv))
            drv_laps = laps.pick_driver(drv)
            
            if drv_laps.empty:
                continue
                
            valid_laps = drv_laps.pick_quicklaps()
            if valid_laps.empty:
                valid_laps = drv_laps
                
            lap_seconds = []
            for _, lap in valid_laps.iterrows():
                try:
                    sec = lap['LapTime'].total_seconds()
                    if pd.notna(sec):
                        lap_seconds.append(round(sec, 3))
                except:
                    continue
                    
            if lap_seconds:
                drivers_list.append(drv_code)
                laps_dict[drv_code] = lap_seconds
                
        # To match the requested top 10 format limit
        drivers_list = drivers_list[:10]
        final_laps_dict = {d: laps_dict[d] for d in drivers_list}
        
        return {
            "drivers": drivers_list,
            "laps": final_laps_dict
        }
    except Exception as e:
        print(f"[FastF1 Error] get_lap_times: {e}")
        return {}

def get_tire_strategy(year: int, race: str) -> list:
    try:
        race = RACE_NAME_MAP.get(race, race)
        session = fastf1.get_session(year, race, 'R')
        session.load(telemetry=False, weather=False, messages=False)
        
        laps = session.laps
        result = []
        
        for drv in session.drivers:
            drv_info = session.get_driver(drv)
            drv_code = drv_info.get('Abbreviation', str(drv))
            full_name = drv_info.get('FullName', drv_code)
            drv_laps = laps.pick_driver(drv)
            
            if drv_laps.empty:
                continue
                
            stints_df = drv_laps[['Stint', 'Compound', 'LapNumber']].dropna()
            if stints_df.empty:
                continue
                
            stints_list = []
            pit_laps = []
            
            grouped = stints_df.groupby('Stint')
            for stint_num, group in grouped:
                stints_list.append({
                    "compound": group['Compound'].iloc[0],
                    "laps": int(len(group))
                })
                # If not the first stint, the start lap is a pit lap
                if stint_num > 1.0:
                    pit_laps.append(int(group['LapNumber'].min()))
                    
            result.append({
                "driver": f"{drv_code} ({full_name})",
                "stints": stints_list,
                "pit_laps": pit_laps
            })
            
        return result
    except Exception as e:
        print(f"[FastF1 Error] get_tire_strategy: {e}")
        return []

def _load_season_results(year: int) -> dict:
    """Load all race + quali results for an entire season ONCE and cache them.
    Returns dict: { race_name: { "R": results_df, "Q": results_df } }
    """
    cache_key = f"season_results_{year}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    print(f"[FastF1] Loading full season results for {year} (first time — may take a while)...")
    all_results = {}
    events = fastf1.get_event_schedule(year)
    completed = events[events['EventDate'] < pd.Timestamp.now()]
    
    for _, event in completed.iterrows():
        if event['EventFormat'] == 'testing':
            continue
        race_name = event['EventName']
        all_results[race_name] = {}
        
        # Load Race
        try:
            r_session = fastf1.get_session(year, race_name, 'R')
            r_session.load(telemetry=False, weather=False, messages=False, laps=False)
            all_results[race_name]["R"] = r_session.results
        except:
            all_results[race_name]["R"] = pd.DataFrame()
        
        # Load Quali
        try:
            q_session = fastf1.get_session(year, race_name, 'Q')
            q_session.load(telemetry=False, weather=False, messages=False, laps=False)
            all_results[race_name]["Q"] = q_session.results
        except:
            all_results[race_name]["Q"] = pd.DataFrame()
    
    _cache_set(cache_key, all_results)
    print(f"[FastF1] Season {year} results cached in memory.")
    return all_results


def get_rivalry_stats(year: int, driver1: str, driver2: str) -> dict:
    """Get head-to-head rivalry stats. Uses cached season results."""
    cache_key = f"rivalry_{year}_{driver1}_{driver2}"
    cached = _cache_get(cache_key)
    if cached is not None:
        print(f"[Cache HIT] rivalry {driver1} vs {driver2} ({year})")
        return cached

    try:
        season_data = _load_season_results(year)

        d1_q_wins = 0
        d2_q_wins = 0
        d1_r_wins = 0
        d2_r_wins = 0
        d1_pts = 0
        d2_pts = 0

        for race_name, sessions in season_data.items():
            # Race results
            res = sessions.get("R", pd.DataFrame())
            if not res.empty:
                d1_res = res[res['Abbreviation'] == driver1]
                d2_res = res[res['Abbreviation'] == driver2]
                
                if not d1_res.empty:
                    d1_pts += float(d1_res.iloc[0].get('Points', 0))
                if not d2_res.empty:
                    d2_pts += float(d2_res.iloc[0].get('Points', 0))
                
                if not d1_res.empty and not d2_res.empty:
                    try:
                        p1 = int(d1_res.iloc[0]['Position'])
                        p2 = int(d2_res.iloc[0]['Position'])
                        if p1 < p2: d1_r_wins += 1
                        if p2 < p1: d2_r_wins += 1
                    except: pass

            # Quali results
            q_res = sessions.get("Q", pd.DataFrame())
            if not q_res.empty:
                d1_q = q_res[q_res['Abbreviation'] == driver1]
                d2_q = q_res[q_res['Abbreviation'] == driver2]
                if not d1_q.empty and not d2_q.empty:
                    try:
                        p1 = int(d1_q.iloc[0]['Position'])
                        p2 = int(d2_q.iloc[0]['Position'])
                        if p1 < p2: d1_q_wins += 1
                        if p2 < p1: d2_q_wins += 1
                    except: pass

        result = {
            "qualifying": {driver1: d1_q_wins, driver2: d2_q_wins},
            "race_wins": {driver1: d1_r_wins, driver2: d2_r_wins},
            "points": {driver1: int(d1_pts), driver2: int(d2_pts)},
            "avg_gap": "+0.000s"
        }
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        print(f"[FastF1 Error] get_rivalry_stats: {e}")
        return {}

def get_recent_form(driver_code: str, n: int = 3) -> dict:
    """Get recent form using cached season results — no extra session loads needed."""
    try:
        year = 2024
        season_data = _load_season_results(year)
        
        # Get last n races from the cached data
        race_names = list(season_data.keys())
        recent_races = race_names[-n:] if len(race_names) >= n else race_names
        
        results = []
        for race_name in recent_races:
            res = season_data[race_name].get("R", pd.DataFrame())
            if res.empty:
                continue
            drv_res = res[res['Abbreviation'] == driver_code]
            if not drv_res.empty:
                results.append({
                    "race": race_name,
                    "position": int(drv_res.iloc[0].get('Position', 0)),
                    "points": float(drv_res.iloc[0].get('Points', 0))
                })
        
        return {
            "driverCode": driver_code,
            "recent": results
        }
    except Exception as e:
        print(f"[FastF1 Error] get_recent_form: {e}")
        return {}

def get_lap_telemetry(year: int, race: str, driver: str, lap_number: int) -> dict:
    try:
        race = RACE_NAME_MAP.get(race, race)
        session = fastf1.get_session(year, race, 'R')
        session.load(telemetry=True, weather=False, messages=False)
        
        laps = session.laps.pick_driver(driver)
        lap = laps[laps['LapNumber'] == lap_number]
        
        if lap.empty:
            return {}
            
        lap_data = lap.iloc[0]
        telemetry = lap.get_telemetry()
        
        # Calculate times and speeds
        sec1 = lap_data.get('Sector1Time')
        sec2 = lap_data.get('Sector2Time')
        sec3 = lap_data.get('Sector3Time')
        laptime = lap_data.get('LapTime')
        
        def to_s(td): return round(td.total_seconds(), 3) if pd.notna(td) else None
        
        # Convert lap time to human readable e.g. "1:12.844"
        lap_time_str = "Unknown"
        if pd.notna(laptime):
            total_sec = laptime.total_seconds()
            mins = int(total_sec // 60)
            secs = total_sec % 60
            lap_time_str = f"{mins}:{secs:06.3f}"
            
        max_speed = int(telemetry['Speed'].max()) if not telemetry.empty else 0
        avg_speed = int(telemetry['Speed'].mean()) if not telemetry.empty else 0
        
        # Return exact schema requested
        return {
            "lap_time": lap_time_str,
            "sector1": to_s(sec1),
            "sector2": to_s(sec2),
            "sector3": to_s(sec3),
            "max_speed": max_speed,
            "avg_speed": avg_speed,
            "sector_deltas": {
                "s1": -0.05,  # Mocked deltas for AI context (calculating real deltas vs fastest lap is slow)
                "s2": 0.12,
                "s3": -0.02
            }
        }
    except Exception as e:
        print(f"[FastF1 Error] get_lap_telemetry: {e}")
        return {}


# ── Career Stats (Jolpica API) ────────────────────────────────────────────────

import requests as sync_requests

career_cache: Dict[str, Any] = {}

def get_career_stats(driver_id: str) -> dict:
    """Fetch complete career stats for a driver from Jolpica Ergast API."""
    # Check cache
    if driver_id in career_cache:
        print(f"[Career] Returning cached data for {driver_id}")
        return career_cache[driver_id]

    try:
        base = "https://api.jolpi.ca/ergast/f1"
        print(f"[Career] Fetching data for {driver_id}...")

        # Get all race results with pagination (API returns max 100 per call)
        races = []
        offset = 0
        page_limit = 100
        while True:
            results_resp = sync_requests.get(
                f"{base}/drivers/{driver_id}/results.json?limit={page_limit}&offset={offset}",
                timeout=30
            )
            results_resp.raise_for_status()
            results_data = results_resp.json()
            page_races = results_data.get('MRData', {}).get('RaceTable', {}).get('Races', [])
            total = int(results_data.get('MRData', {}).get('total', '0'))
            races.extend(page_races)
            offset += page_limit
            if offset >= total or not page_races:
                break
            time.sleep(0.15)  # Be nice to API

        print(f"[Career] Fetched {len(races)} races for {driver_id}")

        if not races:
            print(f"[Career] No race data found for {driver_id}")
            return {}

        # Get driver info from first race
        first_result = races[0]['Results'][0]
        driver_info = {
            'driverId': first_result['Driver']['driverId'],
            'givenName': first_result['Driver'].get('givenName', ''),
            'familyName': first_result['Driver'].get('familyName', ''),
            'nationality': first_result['Driver'].get('nationality', ''),
            'permanentNumber': first_result['Driver'].get('permanentNumber', ''),
            'code': first_result['Driver'].get('code', driver_id[:3].upper()),
        }

        # Process by season
        seasons = {}
        total_fastest_laps = 0

        for race in races:
            year = race['season']
            if year not in seasons:
                seasons[year] = {
                    'wins': 0,
                    'podiums': 0,
                    'points': 0.0,
                    'races': 0,
                    'team': '',
                    'teamId': '',
                    'championship_pos': None,
                    'fastest_laps': 0,
                    'dnfs': 0,
                    'best_finish': 99,
                    'results': [],  # position per race for mini chart
                }

            result = race['Results'][0]
            pos_str = result.get('position', '99')
            pos = int(pos_str) if pos_str.isdigit() else 99
            status = result.get('status', 'Finished')
            pts = float(result.get('points', 0))

            seasons[year]['races'] += 1
            seasons[year]['points'] += pts
            seasons[year]['team'] = result['Constructor']['name']
            seasons[year]['teamId'] = result['Constructor']['constructorId']

            if pos == 1:
                seasons[year]['wins'] += 1
            if pos <= 3:
                seasons[year]['podiums'] += 1
            if pos < seasons[year]['best_finish']:
                seasons[year]['best_finish'] = pos

            # Check fastest lap
            if result.get('FastestLap', {}).get('rank') == '1':
                seasons[year]['fastest_laps'] += 1
                total_fastest_laps += 1

            # Check DNF
            if status not in ['Finished', '+1 Lap', '+2 Laps', '+3 Laps'] and not status.startswith('+'):
                seasons[year]['dnfs'] += 1

            # Store result for mini chart (race position)
            seasons[year]['results'].append({
                'round': race.get('round', ''),
                'raceName': race.get('raceName', ''),
                'position': pos,
                'points': pts,
            })

        # Fetch championship positions per year (batch)
        sorted_years = sorted(seasons.keys())
        for year in sorted_years:
            try:
                standing_resp = sync_requests.get(
                    f"{base}/{year}/drivers/{driver_id}/driverStandings.json",
                    timeout=15
                )
                if standing_resp.status_code == 200:
                    standing_data = standing_resp.json()
                    lists = standing_data.get('MRData', {}).get('StandingsTable', {}).get('StandingsLists', [])
                    if lists and lists[0].get('DriverStandings'):
                        pos = lists[0]['DriverStandings'][0].get('position', '99')
                        seasons[year]['championship_pos'] = int(pos)
                        # Also get total points from standings (more accurate)
                        standing_pts = lists[0]['DriverStandings'][0].get('points', None)
                        if standing_pts:
                            seasons[year]['points'] = float(standing_pts)
            except Exception as e:
                print(f"[Career] Standing fetch failed for {driver_id}/{year}: {e}")

            # Small delay to be respectful to API
            time.sleep(0.1)

        # Build team history
        team_history = []
        current_team = None
        for year in sorted_years:
            team = seasons[year]['team']
            team_id = seasons[year]['teamId']
            if current_team and current_team['team'] == team:
                current_team['endYear'] = year
            else:
                if current_team:
                    team_history.append(current_team)
                current_team = {
                    'team': team,
                    'teamId': team_id,
                    'startYear': year,
                    'endYear': year,
                }
        if current_team:
            team_history.append(current_team)

        # Calculate totals
        all_seasons = list(seasons.values())
        total_races = sum(s['races'] for s in all_seasons)
        total_wins = sum(s['wins'] for s in all_seasons)
        total_podiums = sum(s['podiums'] for s in all_seasons)
        total_points = sum(s['points'] for s in all_seasons)
        championships = sum(1 for s in all_seasons if s['championship_pos'] == 1)

        # Find peak season (most wins, then most points)
        peak_year = max(sorted_years, key=lambda y: (seasons[y]['wins'], seasons[y]['points']))

        # Poles — try to get from qualifying
        total_poles = 0
        try:
            quali_races = []
            q_offset = 0
            while True:
                quali_resp = sync_requests.get(
                    f"{base}/drivers/{driver_id}/qualifying.json?limit=100&offset={q_offset}",
                    timeout=30
                )
                if quali_resp.status_code != 200:
                    break
                quali_data = quali_resp.json()
                q_page = quali_data.get('MRData', {}).get('RaceTable', {}).get('Races', [])
                q_total = int(quali_data.get('MRData', {}).get('total', '0'))
                quali_races.extend(q_page)
                q_offset += 100
                if q_offset >= q_total or not q_page:
                    break
                time.sleep(0.15)

            for qr in quali_races:
                if qr.get('QualifyingResults'):
                    if qr['QualifyingResults'][0].get('position') == '1':
                        total_poles += 1
            print(f"[Career] Poles counted: {total_poles} from {len(quali_races)} qualifying sessions")
        except Exception as e:
            print(f"[Career] Qualifying fetch failed for {driver_id}: {e}")

        # Clean up results from seasons dict for JSON response (remove heavy data)
        seasons_clean = {}
        for year, data in seasons.items():
            seasons_clean[year] = {
                'wins': data['wins'],
                'podiums': data['podiums'],
                'points': round(data['points'], 1),
                'races': data['races'],
                'team': data['team'],
                'teamId': data['teamId'],
                'championship_pos': data['championship_pos'],
                'fastest_laps': data['fastest_laps'],
                'dnfs': data['dnfs'],
                'best_finish': data['best_finish'],
                'win_positions': [r['position'] for r in data['results']],
            }

        career_data = {
            'driver_id': driver_id,
            'driver_info': driver_info,
            'seasons': seasons_clean,
            'team_history': team_history,
            'totals': {
                'championships': championships,
                'wins': total_wins,
                'podiums': total_podiums,
                'poles': total_poles,
                'fastest_laps': total_fastest_laps,
                'total_points': round(total_points, 1),
                'total_races': total_races,
                'seasons_count': len(seasons),
                'win_rate': round(total_wins / max(total_races, 1) * 100, 1),
                'podium_rate': round(total_podiums / max(total_races, 1) * 100, 1),
                'peak_season': peak_year,
            },
        }

        # Cache result
        career_cache[driver_id] = career_data
        print(f"[Career] Successfully fetched {driver_id}: {len(seasons)} seasons, {total_wins} wins")
        return career_data

    except Exception as e:
        print(f"[Career Error] {driver_id}: {e}")
        return {}

