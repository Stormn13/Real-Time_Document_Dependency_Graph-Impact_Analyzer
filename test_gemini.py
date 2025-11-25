# test_gemini.py
import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
model = genai.GenerativeModel("models/gemini-2.5-flash")
resp = model.generate_content("Say hello in one sentence", generation_config={"temperature":0,"max_output_tokens":50})
print(resp.text)