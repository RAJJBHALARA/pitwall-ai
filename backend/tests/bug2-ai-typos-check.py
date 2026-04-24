from pathlib import Path


source = Path(r"D:\f1 project\backend\ai_advisor.py").read_text(encoding="utf-8")

assert "temperature=0.1" in source, "Global Gemini temperature should be 0.1"
assert "top_p=0.8" in source, "Global Gemini top_p should be 0.8"
assert "top_k=20" in source, "Global Gemini top_k should be 20"
assert "max_output_tokens=250" in source, "Global Gemini max_output_tokens should be 250"
assert 'model_name="gemini-1.5-pro"' in source, "Gemini model should be gemini-1.5-pro"
assert '"temperature": 0.05' in source, "Rivalry analysis should use a stricter 0.05 temperature override"
assert "print(\"[Rivalry AI] Called with:\")" in source, "Rivalry analysis should log incoming stats"
assert "qualifying_wins" in source, "Rivalry analysis should support alternate qualifying keys"
assert "championship_points" in source, "Rivalry analysis should support alternate points keys"
assert "def is_clean_text" in source, "Shared clean-text validator should exist"

print("Bug 2 AI typo checks passed.")
