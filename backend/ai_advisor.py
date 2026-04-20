import os
import json
import re
import functools
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except Exception as import_error:
    genai = None
    GENAI_AVAILABLE = False
    print(f"[WARNING] google-generativeai import failed: {import_error}. AI generation disabled; deterministic fallbacks will be used.")

load_dotenv()

# We check it at startup in main.py, but for local tests it's useful to verify here
api_key = os.getenv("GEMINI_API_KEY")
AI_ENABLED = bool(api_key and GENAI_AVAILABLE)
if api_key and GENAI_AVAILABLE:
    genai.configure(api_key=api_key)
elif api_key and not GENAI_AVAILABLE:
    print("[WARNING] GEMINI_API_KEY is set but google-generativeai is unavailable. Falling back to deterministic analysis.")
else:
    print("[WARNING] GEMINI_API_KEY not set in ai_advisor.py. AI generation disabled; deterministic fallbacks will be used.")

generation_config = {
    "temperature": 0.2,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 300
}
model = None
if AI_ENABLED:
    try:
        model = genai.GenerativeModel(
            "gemini-1.5-pro",
            generation_config=generation_config
        )
    except Exception as e:
        print(f"[Gemini Init Error] {e}")

_MODEL_CACHE = {}


def _get_model(model_name: str):
    if model_name in _MODEL_CACHE:
        return _MODEL_CACHE[model_name]
    _MODEL_CACHE[model_name] = genai.GenerativeModel(
        model_name,
        generation_config=generation_config
    )
    return _MODEL_CACHE[model_name]


def _generate_text(prompt: str) -> str:
    """Generate text with model fallbacks to avoid hard failures when one model is unavailable."""
    if not AI_ENABLED:
        return ""

    preferred = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
    candidate_models = []
    for name in [preferred, "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.5-flash"]:
        if name not in candidate_models:
            candidate_models.append(name)

    for name in candidate_models:
        try:
            active_model = model if name == "gemini-1.5-pro" and model else _get_model(name)
            response = active_model.generate_content(prompt)
            text = (getattr(response, "text", "") or "").strip()
            if text:
                return text
        except Exception as e:
            print(f"[Gemini Generate Error:{name}] {e}")
            continue

    return ""


def _looks_like_two_sentences(text: str) -> bool:
    sentence_count = len(re.findall(r'[.!?]+', text or ""))
    return sentence_count >= 2


def _to_int(value, default=0):
    try:
        if value is None:
            return default
        return int(value)
    except Exception:
        return default


def _to_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def _build_rivalry_fallback(stats: dict, d1: str, d2: str) -> str:
    qualifying = stats.get("qualifying", {}) if isinstance(stats, dict) else {}
    race_wins = stats.get("race_wins", {}) if isinstance(stats, dict) else {}
    points = stats.get("points", {}) if isinstance(stats, dict) else {}
    avg_gap = _to_float(stats.get("avg_gap", 0.0) if isinstance(stats, dict) else 0.0, 0.0)

    q1 = _to_int(qualifying.get(d1, 0), 0)
    q2 = _to_int(qualifying.get(d2, 0), 0)
    w1 = _to_int(race_wins.get(d1, 0), 0)
    w2 = _to_int(race_wins.get(d2, 0), 0)
    p1 = _to_int(points.get(d1, 0), 0)
    p2 = _to_int(points.get(d2, 0), 0)

    if p1 == p2:
        leader = d1 if (w1 > w2 or (w1 == w2 and q1 >= q2)) else d2
    else:
        leader = d1 if p1 > p2 else d2
    chaser = d2 if leader == d1 else d1

    lead_points = p1 if leader == d1 else p2
    chase_points = p2 if leader == d1 else p1
    lead_wins = w1 if leader == d1 else w2
    chase_wins = w2 if leader == d1 else w1
    lead_qualy = q1 if leader == d1 else q2
    chase_qualy = q2 if leader == d1 else q1

    sentence1 = (
        f"{leader} leads this rivalry with {lead_points} points to {chase_points}, "
        f"{lead_wins} race wins to {chase_wins}, and a {lead_qualy}-{chase_qualy} qualifying split."
    )

    if abs(avg_gap) > 0.0001:
        sentence2 = (
            f"The average pace gap is {avg_gap:+.3f}s, so {leader} currently has the stronger race trend "
            f"while {chaser} needs cleaner execution to swing momentum."
        )
    else:
        sentence2 = (
            f"With pace nearly level on average, strategy calls and consistency are likely to decide "
            f"the next chapter of this duel."
        )

    return f"{sentence1} {sentence2}"


def _build_lap_fallback(telemetry: dict, driver: str, race: str, lap: int) -> str:
    lap_time = telemetry.get("lap_time") or telemetry.get("lapTime") or telemetry.get("lapTimeStr") or "N/A"
    max_speed = telemetry.get("max_speed") or telemetry.get("maxSpeed")
    avg_speed = telemetry.get("avg_speed") or telemetry.get("avgSpeed")
    s1 = telemetry.get("sector1") or telemetry.get("sector_1") or telemetry.get("s1")
    s2 = telemetry.get("sector2") or telemetry.get("sector_2") or telemetry.get("s2")
    s3 = telemetry.get("sector3") or telemetry.get("sector_3") or telemetry.get("s3")

    max_speed_str = f"{_to_float(max_speed, 0.0):.1f} km/h" if max_speed is not None else "N/A"
    avg_speed_str = f"{_to_float(avg_speed, 0.0):.1f} km/h" if avg_speed is not None else "N/A"
    sector_str = f"S1 {s1}, S2 {s2}, S3 {s3}" if all(v is not None for v in [s1, s2, s3]) else "sector-level time split unavailable"

    return (
        f"{driver} completed lap {lap} at {race} in {lap_time} with a top speed of {max_speed_str} "
        f"and an average speed of {avg_speed_str}. The run shows {sector_str}, and the biggest gain is likely to come "
        f"from cleaner corner exits and improved traction consistency."
    )


DRIVER_META = {
    "VER": {"name": "Max Verstappen", "team": "Red Bull Racing", "price_range": "$29-31M"},
    "NOR": {"name": "Lando Norris", "team": "McLaren", "price_range": "$27-30M"},
    "LEC": {"name": "Charles Leclerc", "team": "Ferrari", "price_range": "$25-28M"},
    "PIA": {"name": "Oscar Piastri", "team": "McLaren", "price_range": "$23-26M"},
    "RUS": {"name": "George Russell", "team": "Mercedes", "price_range": "$21-24M"},
    "HAM": {"name": "Lewis Hamilton", "team": "Ferrari", "price_range": "$23-26M"},
    "SAI": {"name": "Carlos Sainz", "team": "Williams", "price_range": "$18-22M"},
    "ALO": {"name": "Fernando Alonso", "team": "Aston Martin", "price_range": "$17-21M"},
    "STR": {"name": "Lance Stroll", "team": "Aston Martin", "price_range": "$13-16M"},
    "GAS": {"name": "Pierre Gasly", "team": "Alpine", "price_range": "$12-15M"},
    "OCO": {"name": "Esteban Ocon", "team": "Haas", "price_range": "$12-15M"},
    "TSU": {"name": "Yuki Tsunoda", "team": "RB", "price_range": "$11-14M"},
    "ALB": {"name": "Alexander Albon", "team": "Williams", "price_range": "$11-14M"},
    "HUL": {"name": "Nico Hulkenberg", "team": "Kick Sauber", "price_range": "$10-13M"},
    "MAG": {"name": "Kevin Magnussen", "team": "Haas", "price_range": "$9-12M"},
    "LAW": {"name": "Liam Lawson", "team": "RB", "price_range": "$9-12M"},
    "ANT": {"name": "Andrea Kimi Antonelli", "team": "Mercedes", "price_range": "$12-16M"},
    "BEA": {"name": "Oliver Bearman", "team": "Haas", "price_range": "$8-11M"},
    "DOO": {"name": "Jack Doohan", "team": "Alpine", "price_range": "$8-11M"},
    "COL": {"name": "Franco Colapinto", "team": "Alpine", "price_range": "$8-11M"},
    "BOT": {"name": "Valtteri Bottas", "team": "Kick Sauber", "price_range": "$9-12M"},
    "ZHO": {"name": "Zhou Guanyu", "team": "Kick Sauber", "price_range": "$9-12M"},
}

DEFAULT_FANTASY_CODES = ["VER", "NOR", "LEC", "PIA", "RUS", "HAM", "SAI", "ALO"]


def _norm_code(value: str) -> str:
    return (value or "").strip().upper()


def _extract_recent_positions(form_data: dict) -> dict:
    scores = {}
    if not isinstance(form_data, dict):
        return scores

    for raw_code, entries in form_data.items():
        code = _norm_code(raw_code)
        if not code or not isinstance(entries, list):
            continue

        score = 0.0
        for idx, row in enumerate(entries[:3]):
            if not isinstance(row, dict):
                continue
            pos = _to_int(row.get("position"), 99)
            if pos <= 0:
                continue
            weight = 1.0 - (idx * 0.2)  # recent races are weighted higher
            base = max(0, 26 - pos)
            podium_bonus = 6 if pos == 1 else 4 if pos == 2 else 2 if pos == 3 else 0
            score += max(0.1, weight) * (base + podium_bonus)

        scores[code] = round(score, 3)

    return scores


def _build_fantasy_fallback(race: str, form_data: dict, reason: str = "") -> dict:
    scores = _extract_recent_positions(form_data)

    ranked = sorted(
        [c for c in scores.keys() if c in DRIVER_META],
        key=lambda c: scores.get(c, 0),
        reverse=True
    )

    picks = []
    for code in ranked:
        if code not in picks:
            picks.append(code)
        if len(picks) == 5:
            break

    for code in DEFAULT_FANTASY_CODES:
        if len(picks) == 5:
            break
        if code not in picks and code in DRIVER_META:
            picks.append(code)

    # Team score based on selected drivers' trend scores
    team_scores = {}
    for code in picks:
        team = DRIVER_META[code]["team"]
        team_scores[team] = team_scores.get(team, 0.0) + max(scores.get(code, 0.0), 5.0)

    constructor_name = max(team_scores, key=team_scores.get) if team_scores else "McLaren"

    def _driver_reason(code: str) -> str:
        trend = scores.get(code, 0.0)
        if trend >= 55:
            return "Recent results show strong podium-level form and reliable points potential."
        if trend >= 35:
            return "Consistent finishes make this driver a stable fantasy points pick."
        return "Solid value option with upside if race strategy and clean air align."

    drivers = [
        {
            "code": code,
            "name": DRIVER_META[code]["name"],
            "team": DRIVER_META[code]["team"],
            "reasoning": _driver_reason(code),
            "price_range": DRIVER_META[code]["price_range"],
        }
        for code in picks
    ]

    # Avoid list from lowest-scoring known drivers in current form data
    avoid_pool = sorted(
        [c for c in scores.keys() if c in DRIVER_META and c not in picks],
        key=lambda c: scores.get(c, 0)
    )
    drivers_to_avoid = avoid_pool[:2] if avoid_pool else ["MAG", "ZHO"]

    key_insight = (
        f"Fallback lineup for {race}: prioritize recent consistency and team momentum while balancing risk across top constructors."
    )
    if reason:
        key_insight += f" ({reason})"

    return {
        "drivers": drivers,
        "constructor": {
            "name": constructor_name,
            "reasoning": "Constructor selected from strongest aggregated driver form in recent races.",
        },
        "key_insight": key_insight,
        "drivers_to_avoid": drivers_to_avoid,
        "fallback": True,
    }

def parse_json_response(text: str) -> dict:
    try:
        clean = re.sub(r'```json|```', '', text).strip()
        parsed = json.loads(clean)
        # If parsing succeeded but the result is empty or lacks key fields, treat as failure
        if not parsed or (isinstance(parsed, dict) and not parsed.get("drivers")):
            return _safe_fallback(text)
        return parsed
    except Exception as e:
        print(f"[JSON Parse Error] {e}")
        return _safe_fallback(text)


def _safe_fallback(raw_text: str = "") -> dict:
    """Return a safe fallback structure when AI fails."""
    return {
        "error": True, 
        "message": "AI failed to generate a valid data structure.",
        "drivers": [],
        "constructor": {"name": "Unknown", "reasoning": ""},
        "key_insight": "Analysis temporarily unavailable due to formatting error.",
        "drivers_to_avoid": [],
        "raw": raw_text
    }

def _is_valid_text(text: str) -> bool:
    """Validate AI-generated text for typos and corruption."""
    text = (text or "").strip()

    if not text or len(text) < 30:
        return False

    if not text[0].isupper():
        return False

    bad_patterns = [
        r'\b\w*([a-z])\1{2,}\w*\b',
        r'\b\w+tt[a-z]+\b',
        r'\buuber',
        r'\bbeeng\b',
        r'\bqualiff',
        r"[a-z]'[a-z]{1,2}\s+lie\b",
        r'\b\w*([a-z])\1\w*([a-z])\2\w*\b',
        r'\b[a-z]*[bcdfghjklmnpqrstvwxyz]{6,}[a-z]*\b',
    ]
    for pattern in bad_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False

    return True

def get_fantasy_picks(race: str, form_data: dict) -> dict:
    prompt = f"""
    You are an expert F1 Fantasy analyst.
    Upcoming race: {race}
    Recent driver performance data (last 3 races):
    {json.dumps(form_data, indent=2)}
    
    Recommend the best 5 drivers and 1 constructor.
    Consider: recent form, circuit history, price value.
    
    Respond ONLY in valid JSON, no markdown, no extra text:
    {{
      "drivers": [
        {{
          "code": "VER",
          "name": "Max Verstappen",
          "team": "Red Bull Racing",
          "reasoning": "specific reason based on data",
          "price_range": "$28-30M"
        }}
      ],
      "constructor": {{
        "name": "McLaren",
        "reasoning": "specific reason"
      }},
      "key_insight": "one sentence summary",
      "drivers_to_avoid": ["code1", "code2"]
    }}
    """
    try:
        text = _generate_text(prompt)
        parsed = parse_json_response(text)
        if not parsed.get("error"):
            return parsed

        retry_prompt = prompt + "\nPREVIOUS ATTEMPT WAS INVALID. Return only valid JSON with clear English reasoning."
        text2 = _generate_text(retry_prompt)
        parsed2 = parse_json_response(text2)
        if not parsed2.get("error"):
            return parsed2

        return _build_fantasy_fallback(race, form_data, "AI JSON parse failed")
    except Exception as e:
        print(f"[Gemini Fantasy Error] {e}")
        return _build_fantasy_fallback(race, form_data, "AI generation exception")

def explain_lap(telemetry: dict, driver: str, race: str, lap: int) -> str:
    prompt = f"""You are an elite F1 telemetry expert delivering a professional lap breakdown.

Driver: {driver}
Race: {race}
Lap: {lap}
Telemetry data:
{json.dumps(telemetry, indent=2)}

STRICT RULES — follow every one:
- Write in perfect English only. Zero typos. Zero broken words.
- Start DIRECTLY with the driver's name. Example: "Max Verstappen delivered..."
- NEVER start with greetings, "Alright", "Hey", "Sure", "Great", or any pleasantry.
- Be specific about sector performance and where time was gained or lost.
- Maximum 120 words. Minimum 40 words.
- Be exciting and engaging for an F1 fan audience.
- Plain text only. No JSON, no markdown, no bullet points.
"""

    try:
        text = _generate_text(prompt)
        if _is_valid_text(text):
            return text
        # One retry with stronger instruction
        retry_prompt = prompt + "\n\nPREVIOUS ATTEMPT WAS INVALID. Start your response ONLY with the driver's name, e.g. 'Carlos Sainz...' or 'Lewis Hamilton...'"
        text2 = _generate_text(retry_prompt)
        if _is_valid_text(text2):
            return text2
        return _build_lap_fallback(telemetry, driver, race, lap)
    except Exception as e:
        print(f"[Gemini Lap Error] {e}")
        return _build_lap_fallback(telemetry, driver, race, lap)

def get_rivalry_analysis(stats: dict, d1: str, d2: str) -> str:
    prompt = f"""
    You are a sharp F1 analyst known for bold opinions.
    
    Head-to-head stats between {d1} and {d2}:
    {json.dumps(stats, indent=2)}
    
    Write exactly 2 sentences of expert analysis.
    Mention specific numbers from the data.
    Be direct and opinionated — take a side.
    Write in perfect English. Zero typos. Zero broken words.
    Respond as plain text only, no JSON, no markdown.
    """
    try:
        text = _generate_text(prompt)
        if _is_valid_text(text) and _looks_like_two_sentences(text):
            return text
        # Retry once
        retry_prompt = (
            prompt
            + "\nPREVIOUS ATTEMPT HAD TYPOS. Write exactly 2 clean sentences in plain English."
        )
        text2 = _generate_text(retry_prompt)
        if _is_valid_text(text2) and _looks_like_two_sentences(text2):
            return text2
        return _build_rivalry_fallback(stats, d1, d2)
    except Exception as e:
        print(f"[Gemini Rivalry Error] {e}")
        return _build_rivalry_fallback(stats, d1, d2)

@functools.lru_cache(maxsize=32)
def get_circuit_insight(circuit: str) -> str:
    prompt = f"""
    You are the head race engineer on the digital pit wall.
    Circuit: {circuit}
    
    Give exactly ONE sentence of tactical insight or strategy for this specific track.
    Sound sharp, professional, and focus on telemetry, tires, or DRS.
    Write in perfect English. Zero typos. Zero broken words.
    No hashtags, no pleasantries, just data-driven tactical advice.
    """
    try:
        text = _generate_text(prompt)
        if text and len(text) > 20 and text[0].isupper():
            return text
        text2 = _generate_text(prompt + "\nPREVIOUS ATTEMPT HAD TYPOS. Write one clean sentence in perfect English.")
        if text2 and len(text2) > 20 and text2[0].isupper():
            return text2
        return "Tactical data stream interrupted. Awaiting telemetry refresh."
    except Exception as e:
        print(f"[Gemini Circuit Insight Error] {e}")
        return "Tactical data stream interrupted. Awaiting telemetry refresh."


def get_career_comparison(driver1_name: str, driver2_name: str, stats1: dict, stats2: dict) -> str:
    """Generate an AI-powered career comparison verdict between two F1 drivers."""
    prompt = f"""Compare these two F1 drivers' careers:

{driver1_name}:
Championships: {stats1['totals']['championships']}
Wins: {stats1['totals']['wins']}
Podiums: {stats1['totals']['podiums']}
Poles: {stats1['totals'].get('poles', 0)}
Win Rate: {stats1['totals'].get('win_rate', 0)}%
Seasons: {stats1['totals']['seasons_count']}

{driver2_name}:
Championships: {stats2['totals']['championships']}
Wins: {stats2['totals']['wins']}
Podiums: {stats2['totals']['podiums']}
Poles: {stats2['totals'].get('poles', 0)}
Win Rate: {stats2['totals'].get('win_rate', 0)}%
Seasons: {stats2['totals']['seasons_count']}

Write exactly 2 sentences.
Sentence 1: Who leads statistically and by how much, citing specific numbers.
Sentence 2: Bold verdict on legacy.
Be direct and opinionated.
Perfect English only. No jargon. Zero typos. Zero broken words.
Start with a driver name, not 'The' or 'While'.
Plain text only. No markdown or formatting."""

    try:
        text = _generate_text(prompt)
        if _is_valid_text(text):
            return text

        text2 = _generate_text(prompt + "\nPREVIOUS ATTEMPT HAD TYPOS. Rewrite both sentences in perfect English.")
        if _is_valid_text(text2):
            return text2

        raise ValueError("Response too short or corrupted")
    except Exception as e:
        print(f"[Career Compare Error] {e}")
        # Return a real analytical fallback, not a generic error
        c1 = stats1['totals']['championships']
        c2 = stats2['totals']['championships']
        w1 = stats1['totals']['wins']
        w2 = stats2['totals']['wins']
        champ_winner = driver1_name if c1 > c2 else driver2_name
        win_winner = driver1_name if w1 > w2 else driver2_name
        return f"{champ_winner} leads on championships ({max(c1,c2)} vs {min(c1,c2)}) while {win_winner} has the edge in race wins ({max(w1,w2)} vs {min(w1,w2)}). Both represent generational talents whose legacies will be debated for decades."
