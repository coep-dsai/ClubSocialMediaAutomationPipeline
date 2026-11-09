"""AI News Scraper Agent for "This Week in AI".

Fetches, filters, scores, and ranks top weekly AI stories from:
1. Google News AI RSS feed (supports dynamic keyword search, e.g. "NVIDIA", "DeepSeek", "OpenAI")
2. Hacker News Algolia API (top voted AI discussions)
3. Hugging Face Daily Papers (top research breakthroughs)
"""

import datetime
import html
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
import feedparser
import requests
from pydantic import BaseModel, Field


class AIStory(BaseModel):
    title: str
    source: str
    url: str
    published: str
    summary: str
    score: float = 0.0
    virality_score: float = 0.0
    virality_cues: List[str] = Field(default_factory=list)

    def __init__(self, **data):
        super().__init__(**data)
        if not self.virality_score and self.score:
            self.virality_score = self.score
        elif not self.score and self.virality_score:
            self.score = self.virality_score


VIRALITY_KEYWORDS = {
    "breakthrough": 3.0,
    "beats": 2.5,
    "accidentally": 3.0,
    "dollar": 2.0,
    "million": 2.0,
    "billion": 2.0,
    "percent": 1.5,
    "crazy": 2.5,
    "cheaper": 2.5,
    "faster": 2.0,
    "open source": 2.0,
    "weights": 1.5,
    "deepseek": 3.0,
    "openai": 2.5,
    "google": 2.0,
    "gemini": 2.5,
    "claude": 2.5,
    "anthropic": 2.5,
    "nvidia": 2.5,
    "blackwell": 3.0,
    "gpu": 2.0,
    "b200": 3.0,
    "h100": 2.0,
    "cuda": 2.0,
    "robot": 2.5,
    "loophole": 3.0,
    "autonomous": 2.0,
    "human": 1.5,
    "benchmark": 2.0,
    "superhuman": 3.0,
}


class AINewsScraper:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path("output")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.cache_file = self.data_dir / "latest_ai_news.json"

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        soup = BeautifulSoup(text, "html.parser")
        cleaned = soup.get_text(separator=" ")
        cleaned = html.unescape(cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def score_story(self, title: str, summary: str, base_score: float = 1.0) -> (float, List[str]):
        combined = f"{title.lower()} {summary.lower()}"
        matched_cues = []
        score = base_score
        for kw, weight in VIRALITY_KEYWORDS.items():
            if kw in combined:
                score += weight
                matched_cues.append(kw)
        # Bonus for numbers, percentages, and dollar amounts in title
        if re.search(r"\$\d+|\d+%", title):
            score += 2.0
            matched_cues.append("concrete_metrics")
        return round(score, 2), matched_cues

    def fetch_google_news(self, query: str = "artificial intelligence", max_items: int = 20) -> List[AIStory]:
        stories = []
        search_term = query.strip()
        if "ai" not in search_term.lower() and "intelligence" not in search_term.lower():
            search_term = f"{search_term} AI"
        q_encoded = requests.utils.quote(search_term)
        url = f"https://news.google.com/rss/search?q={q_encoded}+when:7d&hl=en-US&gl=US&ceid=US:en"

        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:max_items]:
                title = self.clean_text(entry.get("title", ""))
                summary = self.clean_text(entry.get("summary", ""))
                link = entry.get("link", "")
                published = entry.get("published", "")
                source = entry.get("source", {}).get("title", "Google News")

                score, cues = self.score_story(title, summary, base_score=2.5)
                stories.append(
                    AIStory(
                        title=title,
                        source=source,
                        url=link,
                        published=published,
                        summary=summary,
                        score=score,
                        virality_score=score,
                        virality_cues=cues,
                    )
                )
        except Exception as e:
            print(f"[Warning] Google News fetch failed: {e}", file=sys.stderr)
        return stories

    def fetch_hacker_news_ai(self, query: Optional[str] = None, max_items: int = 15) -> List[AIStory]:
        stories = []
        seven_days_ago = int(time.time()) - (7 * 24 * 3600)
        hn_query = query.strip() if query else "AI OR LLM OR model"
        q_encoded = requests.utils.quote(hn_query)
        url = (
            f"https://hn.algolia.com/api/v1/search?query={q_encoded}"
            f"&tags=story&numericFilters=created_at_i>{seven_days_ago}&hitsPerPage={max_items}"
        )
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                for hit in data.get("hits", []):
                    title = hit.get("title", "")
                    link = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
                    points = hit.get("points") or 0
                    comments = hit.get("num_comments") or 0
                    created_at = hit.get("created_at", "")

                    summary = f"HN discussion with {points} points and {comments} comments."
                    score, cues = self.score_story(title, summary, base_score=min(points / 50.0, 5.0))
                    stories.append(
                        AIStory(
                            title=title,
                            source="Hacker News",
                            url=link,
                            published=created_at,
                            summary=summary,
                            score=score,
                            virality_score=score,
                            virality_cues=cues,
                        )
                    )
        except Exception as e:
            print(f"[Warning] Hacker News fetch failed: {e}", file=sys.stderr)
        return stories

    def fetch_huggingface_papers(self, max_items: int = 12) -> List[AIStory]:
        stories = []
        url = "https://huggingface.co/api/daily_papers"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                items = res.json()
                for item in items[:max_items]:
                    paper = item.get("paper", {})
                    title = paper.get("title", "")
                    summary = self.clean_text(paper.get("summary", ""))[:250]
                    paper_id = paper.get("id", "")
                    link = f"https://huggingface.co/papers/{paper_id}" if paper_id else "https://huggingface.co/papers"
                    upvotes = paper.get("upvotes", 0)

                    score, cues = self.score_story(title, summary, base_score=min(upvotes / 10.0, 4.0))
                    stories.append(
                        AIStory(
                            title=title,
                            source="Hugging Face Daily Papers",
                            url=link,
                            published=datetime.date.today().isoformat(),
                            summary=summary,
                            score=score,
                            virality_score=score,
                            virality_cues=cues,
                        )
                    )
        except Exception as e:
            print(f"[Warning] Hugging Face fetch failed: {e}", file=sys.stderr)
        return stories

    def get_top_stories(self, query: Optional[str] = None, force_refresh: bool = False) -> List[AIStory]:
        if not force_refresh and not query and self.cache_file.exists():
            try:
                cached = json.loads(self.cache_file.read_text(encoding="utf-8"))
                return [AIStory(**s) for s in cached]
            except Exception:
                pass

        all_stories: List[AIStory] = []
        default_q = query.strip() if query else "artificial intelligence"
        all_stories.extend(self.fetch_google_news(query=default_q))
        all_stories.extend(self.fetch_hacker_news_ai(query=query))
        all_stories.extend(self.fetch_huggingface_papers())

        # Deduplicate by normalized title
        seen = set()
        deduped = []
        for s in all_stories:
            norm_title = re.sub(r"[^a-zA-Z0-9]", "", s.title.lower())[:40]
            if norm_title and norm_title not in seen:
                seen.add(norm_title)
                deduped.append(s)

        # Sort descending by virality score
        deduped.sort(key=lambda s: s.score, reverse=True)

        # Cache results if default run
        if not query:
            self.cache_file.write_text(
                json.dumps([s.model_dump() for s in deduped], indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
        return deduped

    def fetch_all_stories(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Convenience helper returning raw dictionaries for UI consumption."""
        stories = self.get_top_stories(query=query, force_refresh=True)
        return [s.model_dump() for s in stories]


# Compatibility aliases
NewsScraperAgent = AINewsScraper


def main():
    scraper = AINewsScraper()
    print("Testing scraper for NVIDIA stories...")
    stories = scraper.get_top_stories(query="NVIDIA", force_refresh=True)
    print(f"Gathered {len(stories)} stories:")
    for s in stories[:5]:
        print(f" - [{s.score}] {s.title} ({s.source})")


if __name__ == "__main__":
    main()
