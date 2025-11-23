# LLM Integration Schema

## Input Schema for `run_llm(changed_event)`

```json
{
  "changed_doc": "string",
  "summary": "string (one-line summary of what changed)",
  "old_snippets": ["string", "..."],
  "new_snippets": ["string", "..."],
  "impacted_docs": {
    "DocName1": ["snippet1", "snippet2"],
    "DocName2": ["snippetX"]
  }
}
