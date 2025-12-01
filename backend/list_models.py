import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    raise RuntimeError("GOOGLE_API_KEY not found in .env")

genai.configure(api_key=api_key)

print("\n=== AVAILABLE GEMINI MODELS ===")
models = genai.list_models()

for m in models:
    print(m.name)
    print("  supported methods:", getattr(m, "supported_generation_methods", []))
    print()
