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
    # Format snippets and docs more safely
    old_text = "\n".join(f"- {s[:200]}" for s in old_snippets[:3]) if old_snippets else "(none)"
    new_text = "\n".join(f"- {s[:200]}" for s in new_snippets[:3]) if new_snippets else "(none)"
    docs_text = "\n".join(f"- {doc}: {len(snippets)} snippet(s)" for doc, snippets in impacted_docs.items()) if impacted_docs else "(none)"
    
    prompt = f"""You are a documentation analyst. A policy has changed.

Changed policy summary: {changed_summary}

Old text (preview):
{old_text}

New text (preview):
{new_text}

Documents that may be affected:
{docs_text}

Task: Return JSON with this schema (only JSON, no extra text):
{{
  "summary": "brief summary of the change impact",
  "severity": "low",
  "impacted_docs": ["list", "of", "doc", "names"]
}}
"""
    return prompt
