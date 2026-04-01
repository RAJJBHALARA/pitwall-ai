import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

models = [
    "gemini-2.5-flash",
    "gemini-3.1-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-2.5-pro"
]

for m_name in models:
    try:
        print(f"Testing {m_name}...")
        m = genai.GenerativeModel(m_name)
        res = m.generate_content('say hello')
        print(f"SUCCESS: {m_name}: {res.text}")
        break  # exit loop if successful
    except Exception as e:
        print(f"FAILED {m_name}: {e}")
