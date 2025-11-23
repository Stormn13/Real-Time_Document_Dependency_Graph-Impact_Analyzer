import os
import json
import re
from typing import Dict, Any, List

import google.generativeai as genai
from dotenv import load_dotenv

from .prompts import build_prompt


# Load Gemini API key
load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    raise RuntimeError("GOOGLE_API_KEY not found in .env")

genai.configure(api_key=api_key)

MODEL_NAME = "models/gemini-2.5-flash"


def extract_json(text: str) -> dict:
    """
    Extract JSON from Gemini output safely.
    Handles markdown, extra text, etc.
    """
    try:
        # Direct JSON? Try loading directly.
        return json.loads(text)
    except:
        pass

    # Look for first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass

    # If extraction fails, return fallback
    return {
        "summary": "JSON parse failed",
        "severity": "medium",
        "impacted_docs": []
    }


def run_llm(changed_event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs Gemini on changed_event and returns structured JSON safely.
    """

    changed_summary: str = changed_event.get("summary", "")
    old_snippets: List[str] = changed_event.get("old_snippets", [])
    new_snippets: List[str] = changed_event.get("new_snippets", [])
    impacted_docs: Dict[str, List[str]] = changed_event.get("impacted_docs", {})

    prompt = build_prompt(
        changed_summary=changed_summary,
        old_snippets=old_snippets,
        new_snippets=new_snippets,
        impacted_docs=impacted_docs,
    )

    model = genai.GenerativeModel(MODEL_NAME)

    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0,
                "max_output_tokens": 2048,
            },
        )

        raw_text = response.text.strip()

        return extract_json(raw_text)

    except Exception as e:
        return {
            "summary": f"Gemini call failed: {str(e)}",
            "severity": "medium",
            "impacted_docs": []
        }
