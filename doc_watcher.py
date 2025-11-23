"""Document watcher and impact resolver.

This module watches the `./docs/` directory for Markdown file changes,
computes paragraph-level MD5 hashes, detects semantic changes (old/new
snippets), builds a simple dependency graph (explicit filename refs
and keyword matches), and outputs JSON events that match `schema.md`.

Behavior:
- If `pathway` (pw) is installed, a placeholder Pathway pipeline is
  attempted (minimal). If Pathway is not available, a reliable
  fallback using `watchdog` is used.

The produced JSON has this exact shape required by `schema.md`:
{
  "changed_doc": "string",
  "summary": "string",
  "old_snippets": ["..."],
  "new_snippets": ["..."],
  "impacted_docs": { "DocA.md": ["snippet1", ...] }
}

This file is intentionally self-contained so your Linux teammate can
adapt it into a Pathway streaming job later.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import threading
import time
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Tuple

CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
PREV_STATE_FILE = os.path.join(CACHE_DIR, "prev_paragraphs.json")
DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")


def ensure_cache_dir() -> None:
    os.makedirs(CACHE_DIR, exist_ok=True)


def md5_text(s: str) -> str:
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def split_paragraphs(text: str) -> List[str]:
    # Normalize newlines and split on two-or-more newlines (semantic paragraphs)
    text = text.replace("\r\n", "\n").strip()
    parts = [p.strip() for p in re.split(r"\n\s*\n+", text) if p.strip()]
    return parts


def load_prev_state() -> Dict[str, List[Tuple[str, str]]]:
    """Return mapping doc -> list of (paragraph_text, md5) in previous snapshot."""
    ensure_cache_dir()
    if not os.path.exists(PREV_STATE_FILE):
        return {}
    try:
        with open(PREV_STATE_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        # raw: {doc: [[paragraph, hash], ...]}
        return {k: [(p, h) for p, h in v] for k, v in raw.items()}
    except Exception:
        return {}


def save_prev_state(state: Dict[str, List[Tuple[str, str]]]) -> None:
    ensure_cache_dir()
    serializable = {k: [[p, h] for p, h in v] for k, v in state.items()}
    with open(PREV_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(serializable, f, indent=2, ensure_ascii=False)


def read_doc(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def build_dependencies(docs_dir: str) -> List[Dict]:
    """Scan all docs and produce a simple dependency list.

    Returns list of dicts: {from_doc, to_doc, ref_type, confidence}
    """
    files = [f for f in os.listdir(docs_dir) if f.endswith(".md")]
    deps = []
    filename_set = set(files)

    # build a lightweight keyword index from filenames (without extension)
    name_keywords = {fn: set(re.findall(r"\w+", os.path.splitext(fn)[0].lower())) for fn in files}

    for fn in files:
        text = read_doc(os.path.join(docs_dir, fn))
        lowered = text.lower()
        # explicit references: any mention of another filename
        for candidate in files:
            if candidate == fn:
                continue
            if re.search(r"\b" + re.escape(candidate) + r"\b", text):
                deps.append({
                    "from_doc": fn,
                    "to_doc": candidate,
                    "ref_type": "explicit",
                    "confidence": 0.95,
                })
        # implicit keyword matches (cheap signal)
        for candidate, keys in name_keywords.items():
            if candidate == fn:
                continue
            # if many keywords from candidate appear in the document, count as implicit
            match_count = sum(1 for k in keys if k and k in lowered)
            if match_count >= max(1, len(keys) // 2):
                deps.append({
                    "from_doc": fn,
                    "to_doc": candidate,
                    "ref_type": "implicit",
                    "confidence": 0.6 + 0.05 * match_count,
                })

    # de-duplicate keeping highest confidence per pair
    best = {}
    for d in deps:
        key = (d["from_doc"], d["to_doc"])
        if key not in best or d["confidence"] > best[key]["confidence"]:
            best[key] = d

    return list(best.values())


def detect_changes(doc_path: str, prev_state: Dict[str, List[Tuple[str, str]]]) -> Dict:
    """Compute changes for a single doc and return changed_event (or None).

    changed_event matches schema.md exactly.
    """
    doc_name = os.path.basename(doc_path)
    text = read_doc(doc_path)
    paragraphs = split_paragraphs(text)
    new_pars = [(p, md5_text(p)) for p in paragraphs]

    old_pars = prev_state.get(doc_name, [])

    # Build dicts by hash for simple comparison (order-insensitive)
    old_hashes = {h: p for p, h in old_pars}
    new_hashes = {h: p for p, h in new_pars}

    removed = [old_hashes[h] for h in old_hashes.keys() - new_hashes.keys()]
    added = [new_hashes[h] for h in new_hashes.keys() - old_hashes.keys()]

    if not removed and not added:
        return None

    # Heuristic one-line summary: try to detect numeric changes (e.g., days) or short change
    summary = heuristic_summary(removed, added)

    changed_event = {
        "changed_doc": doc_name,
        "summary": summary,
        "old_snippets": removed,
        "new_snippets": added,
        "impacted_docs": {},  # filled by impact resolution
    }

    # update prev_state for this doc
    prev_state[doc_name] = new_pars

    return changed_event


def heuristic_summary(old_snips: List[str], new_snips: List[str]) -> str:
    # Simple heuristics to produce a one-line summary
    if old_snips and new_snips and len(old_snips) == 1 and len(new_snips) == 1:
        o = old_snips[0]
        n = new_snips[0]
        # detect simple numeric change like '14' -> '7'
        onums = re.findall(r"\d+", o)
        nnums = re.findall(r"\d+", n)
        if onums and nnums and onums != nnums:
            return f"Changed numeric value from {onums[0]} to {nnums[0]}"
        # fallback: short diff
        return f"Replaced text: '{truncate(o,60)}' -> '{truncate(n,60)}'"
    if new_snips and not old_snips:
        return f"Added {len(new_snips)} paragraph(s)"
    if old_snips and not new_snips:
        return f"Removed {len(old_snips)} paragraph(s)"
    return f"Updated document with {len(new_snips)} additions and {len(old_snips)} removals"


def truncate(s: str, n: int) -> str:
    return (s[: n - 3] + "...") if len(s) > n else s


def resolve_impacts(changed_event: Dict, dependencies: List[Dict], docs_dir: str) -> Dict:
    """Given a changed_event and dependencies, fill impacted_docs mapping.

    For each dependency where to_doc == changed_doc, collect relevant
    snippets from the dependent document (simple paragraph similarity).
    """
    changed = changed_event["changed_doc"]
    impacted = defaultdict(list)

    # index dependencies: from_doc -> list of deps referencing to_doc
    for dep in dependencies:
        if dep["to_doc"] == changed:
            from_doc = dep["from_doc"]
            # pick candidate snippets from from_doc that mention keywords from changed doc
            path = os.path.join(docs_dir, from_doc)
            if not os.path.exists(path):
                continue
            text = read_doc(path)
            pars = split_paragraphs(text)
            # score paragraphs by overlapping tokens with changed doc name and changed snippets
            scores = []
            key_terms = set(re.findall(r"\w+", os.path.splitext(changed)[0].lower()))
            for p in pars:
                tokens = set(re.findall(r"\w+", p.lower()))
                score = len(tokens & key_terms)
                scores.append((score, p))
            # pick top paragraphs with score>0, limited to 3
            for score, p in sorted(scores, key=lambda x: -x[0])[:3]:
                if score > 0:
                    impacted[from_doc].append(p)
            # fallback: if nothing scored, include first paragraph as possible impact
            if not impacted[from_doc] and pars:
                impacted[from_doc].append(truncate(pars[0], 500))

    changed_event["impacted_docs"] = dict(impacted)
    return changed_event


def emit_event(event: Dict) -> None:
    # Canonical JSON output on stdout (one per line). Downstream systems can read this stream.
    print(json.dumps(event, ensure_ascii=False))


def scan_all_docs_and_update(prev_state: Dict[str, List[Tuple[str, str]]]) -> None:
    # Ensure prev_state has entries for all docs (initial snapshot)
    files = [f for f in os.listdir(DOCS_DIR) if f.endswith(".md")]
    for fn in files:
        if fn in prev_state:
            continue
        path = os.path.join(DOCS_DIR, fn)
        pars = split_paragraphs(read_doc(path))
        prev_state[fn] = [(p, md5_text(p)) for p in pars]


def handle_change_event(path: str, prev_state: Dict[str, List[Tuple[str, str]]]) -> None:
    # Detect changes for the single file, assemble impacts, and emit JSON
    try:
        changed = detect_changes(path, prev_state)
        if not changed:
            return
        deps = build_dependencies(DOCS_DIR)
        changed = resolve_impacts(changed, deps, DOCS_DIR)
        emit_event(changed)
        save_prev_state(prev_state)
        # optional: call LLM runner if available and desired
        if os.environ.get("RUN_LLM", "false").lower() in ("1", "true", "yes"):
            try:
                from rag.llm_runner import run_llm

                _ = run_llm(changed)
            except Exception:
                pass
    except Exception:
        import traceback

        traceback.print_exc()


# --- Watcher fallback (watchdog) -------------------------------------------------
def start_watchdog(prev_state: Dict[str, List[Tuple[str, str]]]) -> None:
    try:
        from watchdog.events import FileSystemEventHandler
        # prefer native Observer but fall back to PollingObserver on mounts like /mnt/
        try:
            from watchdog.observers import Observer
            ObserverCandidate = Observer
        except Exception:
            # try polling observer
            try:
                from watchdog.observers.polling import PollingObserver

                ObserverCandidate = PollingObserver
            except Exception:
                print("watchdog observers not available. Install watchdog fully: pip install watchdog")
                sys.exit(1)
    except Exception:
        print("watchdog is required for fallback mode. Install with: pip install watchdog")
        sys.exit(1)

    class Handler(FileSystemEventHandler):
        def on_modified(self, event):
            if event.is_directory:
                return
            if event.src_path.endswith('.md'):
                # small delay to allow write completion
                time.sleep(0.1)
                print(f"Detected file system event: modified {event.src_path}")
                handle_change_event(event.src_path, prev_state)

        def on_created(self, event):
            if event.is_directory:
                return
            if event.src_path.endswith('.md'):
                time.sleep(0.1)
                print(f"Detected file system event: created {event.src_path}")
                handle_change_event(event.src_path, prev_state)

    # choose polling observer when on /mnt/ (WSL mounted drives) or when env forces polling
    use_polling = os.environ.get("USE_POLLING", "").lower() in ("1", "true", "yes") or DOCS_DIR.startswith("/mnt/")
    if use_polling:
        try:
            from watchdog.observers.polling import PollingObserver

            observer = PollingObserver()
            observer_type = "PollingObserver"
        except Exception:
            observer = ObserverCandidate()
            observer_type = ObserverCandidate.__name__
    else:
        observer = ObserverCandidate()
        observer_type = ObserverCandidate.__name__

    observer.schedule(Handler(), DOCS_DIR, recursive=False)
    observer.start()
    print(f"Watching {DOCS_DIR} for changes (fallback mode, observer={observer_type})")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    # Ensure docs dir exists
    if not os.path.isdir(DOCS_DIR):
        print(f"Create a `docs/` directory next to this file and add .md files. Expected at: {DOCS_DIR}")
        sys.exit(1)

    # Load previous snapshot (if any)
    prev = load_prev_state()
    # if no state, build initial snapshot
    if not prev:
        scan_all_docs_and_update(prev)
        save_prev_state(prev)

    # Try to use Pathway if available (best-effort placeholder pipeline)
    try:
        import pathway as pw

        # Minimal Pathway pipeline: watch directory and call the same detection
        # logic via udf. This is a lightweight integration so the core logic
        # remains in plain Python and can be reused inside a full pw pipeline
        # when your Linux teammate configures the environment.

        table = pw.io.fs.watch(DOCS_DIR, mode="streaming", with_snapshot=True, format="plaintext")

        @pw.udf
        def _on_change(path: str, data: str, mtime: float = None):
            # Pathway will pass the file path and contents; write to disk temp
            abs_path = os.path.join(DOCS_DIR, os.path.basename(path))
            try:
                with open(abs_path, "w", encoding="utf-8") as f:
                    f.write(data)
                # call the same handler
                threading.Thread(target=handle_change_event, args=(abs_path, prev)).start()
            except Exception:
                pass
            return 1

        # select triggers and discard output
        processed = table.select(trigger=_on_change(table.path, table.data, table.mtime))
        pw.run()

    except Exception:
        # Fallback to watchdog-based watcher which does the heavy lifting
        start_watchdog(prev)

