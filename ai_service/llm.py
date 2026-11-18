import os

import httpx

PROVIDER = os.environ.get("LLM_PROVIDER", "ollama")


def complete(system: str, prompt: str) -> str:
    if PROVIDER == "anthropic":
        r = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": os.environ["ANTHROPIC_API_KEY"],
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5"),
                "max_tokens": 400,
                "temperature": 0.2,
                "system": system,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=60,
        )
        r.raise_for_status()
        return "".join(b.get("text", "") for b in r.json()["content"] if b.get("type") == "text").strip()

    r = httpx.post(
        os.environ.get("OLLAMA_URL", "http://ollama:11434") + "/api/chat",
        json={
            "model": os.environ.get("OLLAMA_MODEL", "llama3.2:3b"),
            "stream": False,
            "options": {"temperature": 0.2, "num_predict": 300},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["message"]["content"].strip()
