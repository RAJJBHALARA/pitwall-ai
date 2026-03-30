import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

# We check it at startup in main.py, but for local tests it's useful to verify here
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

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
        response = model.generate_content(prompt)
        return parse_json_response(response.text)
    except Exception as e:
        print(f"[Gemini Fantasy Error] {e}")
        return parse_json_response("{}") # Will trigger the safe fallback structure

def explain_lap(telemetry: dict, driver: str, race: str, lap: int) -> str:
    prompt = f"""
    You are an F1 telemetry expert who explains 
    data in exciting, fan-friendly language.
    
    Driver: {driver}
    Race: {race}
    Lap: {lap}
    Telemetry data:
    {json.dumps(telemetry, indent=2)}
    
    Explain what happened in this lap.
    Focus on where time was gained or lost.
    Be specific about sector performance.
    Maximum 120 words.
    Be exciting and engaging for F1 fans.
    Respond as plain text only, no JSON, no markdown.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Lap Error] {e}")
        return "Lap analysis unavailable. The PitWall AI is currently analyzing data offline."

def get_rivalry_analysis(stats: dict, d1: str, d2: str) -> str:
    prompt = f"""
    You are a sharp F1 analyst known for bold opinions.
    
    Head-to-head stats between {d1} and {d2}:
    {json.dumps(stats, indent=2)}
    
    Write exactly 2 sentences of expert analysis.
    Mention specific numbers from the data.
    Be direct and opinionated — take a side.
    Respond as plain text only, no JSON, no markdown.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Rivalry Error] {e}")
        return "Analysis unavailable. Rivalry data processing encountered an interruption."
