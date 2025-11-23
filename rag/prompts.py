from typing import List, Dict

def build_prompt(
    changed_summary: str,
    old_snippets: List[str],
    new_snippets: List[str],
    impacted_docs: Dict[str, List[str]],
) -> str:
    """
    Construct the final prompt given to the LLM.
    This prompt must force strict JSON output.
    """
    prompt = f"""
A policy document has been updated.

Summary of the change:
{changed_summary}

Old policy snippets:
{old_snippets}

New policy snippets:
{new_snippets}

Impacted documents and their excerpts:
{impacted_docs}

Your job:
1. Identify inconsistencies between the NEW policy text and each impacted document.
2. Suggest a corrected rewrite for each document.
3. Output ONLY strict JSON using this schema:

{{
  "summary": "one line summary",
  "severity": "low" | "medium" | "high",
  "impacted_docs": [
    {{
      "doc_id": "string",
      "inconsistent_snippets": ["..."],
      "suggested_rewrite": "..."
    }}
  ]
}}

Do NOT output anything except valid JSON.
"""
    return prompt
