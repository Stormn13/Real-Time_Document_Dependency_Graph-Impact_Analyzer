import os
import json
from typing import List, Tuple, Dict

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
except Exception:
    SentenceTransformer = None
    np = None

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", ".cache")
EMB_FILE = os.path.join(CACHE_DIR, "embeddings.npz")
META_FILE = os.path.join(CACHE_DIR, "embeddings_meta.json")


class DocIndex:
    """Simple paragraph-level index using sentence-transformers.

    It stores normalized vectors and metadata and supports similarity search.
    This is a minimal local index intended for demos and small document sets.
    """

    def __init__(self, docs_dir: str, model_name: str = "all-MiniLM-L6-v2"):
        self.docs_dir = docs_dir
        self.model_name = model_name
        self.model = None
        self.vectors = None
        self.meta = []
        if SentenceTransformer is None:
            raise RuntimeError("sentence-transformers is not installed")
        self._ensure_cache_dir()
        self._load_or_build()

    def _ensure_cache_dir(self):
        os.makedirs(CACHE_DIR, exist_ok=True)

    def _load_or_build(self):
        # naive rebuild every time for correctness; caching can be added
        self.model = SentenceTransformer(self.model_name)
        paras = []
        meta = []
        for fn in sorted(os.listdir(self.docs_dir)):
            if not fn.endswith(".md"):
                continue
            path = os.path.join(self.docs_dir, fn)
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
            parts = [p.strip() for p in text.replace("\r\n", "\n").split("\n\n") if p.strip()]
            for p in parts:
                paras.append(p)
                meta.append({"doc": fn, "text": p})

        if paras:
            vecs = self.model.encode(paras, convert_to_numpy=True)
            # normalize
            norms = (vecs ** 2).sum(axis=1, keepdims=True) ** 0.5
            norms[norms == 0] = 1.0
            vecs = vecs / norms
            self.vectors = vecs
            self.meta = meta
        else:
            self.vectors = None
            self.meta = []

    def query(self, text: str, top_k: int = 5) -> List[Tuple[float, Dict]]:
        if self.vectors is None:
            return []
        q = self.model.encode([text], convert_to_numpy=True)
        q = q / ((q ** 2).sum() ** 0.5)
        sims = (self.vectors @ q[0]).tolist()
        # pair sims with meta
        pairs = list(enumerate(sims))
        pairs.sort(key=lambda x: -x[1])
        results = []
        for idx, score in pairs[:top_k]:
            results.append((float(score), self.meta[idx]))
        return results
