import os
import re
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

MODEL_NAME = "BAAI/bge-small-en-v1.5"
KB_DIR = Path(__file__).parent / "kb"
CACHE = os.environ.get("FASTEMBED_CACHE_PATH", "/app/.fastembed")

_model = TextEmbedding(MODEL_NAME, cache_dir=CACHE)
_chunks = []
_vecs = np.zeros((0, 384), dtype=np.float32)


def _norm(a):
    return a / np.clip(np.linalg.norm(a, axis=-1, keepdims=True), 1e-9, None)


def load_kb(max_words=120):
    global _chunks, _vecs
    chunks = []
    for f in sorted(KB_DIR.glob("*.md")):
        lines = f.read_text(encoding="utf-8").strip().splitlines()
        title = lines[0].lstrip("# ").strip()
        paras = [p.strip() for p in re.split(r"\n\s*\n", "\n".join(lines[1:])) if p.strip()]
        buf, words = [], 0
        for p in paras:
            n = len(p.split())
            if buf and words + n > max_words:
                chunks.append({"title": title, "text": f"{title}. " + " ".join(buf)})
                buf, words = [], 0
            buf.append(p.replace("\n", " "))
            words += n
        if buf:
            chunks.append({"title": title, "text": f"{title}. " + " ".join(buf)})
    if chunks:
        vecs = np.array(list(_model.embed([c["text"] for c in chunks])), dtype=np.float32)
        _vecs = _norm(vecs)
    _chunks = chunks
    return len(chunks)


def retrieve(query, k=4, min_score=0.40):
    if not _chunks:
        return []
    q = _norm(np.array(list(_model.query_embed([query]))[0], dtype=np.float32))
    scores = _vecs @ q
    order = np.argsort(-scores)[:k]
    return [{**_chunks[i], "score": float(scores[i])} for i in order if scores[i] >= min_score]


def by_title(title):
    return [c for c in _chunks if c["title"] == title][:1]
