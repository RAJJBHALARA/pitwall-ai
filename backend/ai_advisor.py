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

    def is_valid(text: str) -> bool:
        if not text or len(text.split()) < 30:
            return False
        # Check for repeated words (3+ times in a row)
        words = text.split()
        for i in range(len(words) - 2):
            if words[i].lower() == words[i+1].lower() == words[i+2].lower():
                return False
        # Starts with a letter (not a symbol/number)
        if not text[0].isalpha():
            return False
        return True

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if is_valid(text):
            return text
        # One retry with stronger instruction
        retry_prompt = prompt + "\n\nPREVIOUS ATTEMPT WAS INVALID. Start your response ONLY with the driver's name, e.g. 'Carlos Sainz...' or 'Lewis Hamilton...'"
        response2 = model.generate_content(retry_prompt)
        text2 = response2.text.strip()
        if is_valid(text2):
            return text2
        return "Telemetry analysis unavailable for this lap."
    except Exception as e:
        print(f"[Gemini Lap Error] {e}")
        return "Telemetry analysis unavailable for this lap."

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

import functools

@functools.lru_cache(maxsize=32)
def get_circuit_insight(circuit: str) -> str:
    prompt = f"""
    You are the head race engineer on the digital pit wall.
    Circuit: {circuit}
    
    Give exactly ONE sentence of tactical insight or strategy for this specific track.
    Sound sharp, professional, and focus on telemetry, tires, or DRS.
    No hashtags, no pleasantries, just data-driven tactical advice.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
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
Perfect English only. No jargon.
Start with a driver name, not 'The' or 'While'.
Plain text only. No markdown or formatting."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if len(text) < 20:
            raise ValueError("Response too short")
        return text
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
