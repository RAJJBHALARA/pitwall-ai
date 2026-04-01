import json
import traceback
from f1_data import (
    get_available_races,
    get_drivers,
    get_lap_times,
    get_tire_strategy,
    get_rivalry_stats,
    get_recent_form,
    get_lap_telemetry
)

def format_output(name, data):
    print(f"\n{'='*50}\n{name}\n{'='*50}")
    print(json.dumps(data, indent=2, default=str))

def main():
    print("Starting FastF1 Data Tests...")
    
    try:
        races = get_available_races(2024)
        format_output("AVAILABLE RACES (2024)", races)
        
        drivers = get_drivers(2024)
        format_output("DRIVERS (2024)", drivers[:5]) # Show top 5
        
        # We need a race that has happened. Monaco is index 7 in 2024.
        race = "Monaco"
        
        lap_times = get_lap_times(2024, race, "R")
        # Just show partial data to avoid massive console logs
        partial_lap_times = {
            "drivers": lap_times.get("drivers", [])[:2],
            "laps": {d: lap_times.get("laps", {}).get(d, [])[:3] for d in lap_times.get("drivers", [])[:2]}
        }
        format_output("LAP TIMES (Monaco 2024 - Top 2 drivers, 3 laps)", partial_lap_times)
        
        strategy = get_tire_strategy(2024, race)
        format_output("TIRE STRATEGY (Monaco 2024 - Top 2 drivers)", strategy[:2])
        
        rivalry = get_rivalry_stats(2024, "VER", "LEC")
        format_output("RIVALRY STATS (VER vs LEC 2024)", rivalry)
        
        form = get_recent_form("VER", n=3)
        format_output("RECENT FORM (VER - Last 3 races)", form)
        
        telemetry = get_lap_telemetry(2024, race, "VER", 44)
        format_output("LAP TELEMETRY (Monaco 2024, VER, Lap 44)", telemetry)
        
    except Exception as e:
        print(f"\nTEST SUITE FAILED CATASTROPHICALLY:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
