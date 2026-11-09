"""AI News Scraper Agent for "This Week in AI".

Fetches, filters, scores, and ranks top weekly AI stories from:
1. Google News AI RSS feed
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
    virality_cues: List[str] = Field(default_factory=list)


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
    "robot": 2.5,
    "loophole": 3.0,
    "autonomous": 2.0,
    "human": 1.5,
    "benchmark": 2.0,
    "superhuman": 3.0,
}


class AINewsScraper:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path("data")
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
        # Bonus for numbers and percentages in title
        if re.search(r"\$\d+|\d+%", title):
            score += 2.0
            matched_cues.append("concrete_metrics")
        return round(score, 2), matched_cues

    def fetch_google_news(self, query: str = "artificial intelligence", max_items: int = 15) -> List[AIStory]:
        stories = []
        url = f"https://news.google.com/rss/search?q={requests.utils.quote(query)}+when:7d&hl=en-US&gl=US&ceid=US:en"
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:max_items]:
                title = self.clean_text(entry.get("title", ""))
                summary = self.clean_text(entry.get("summary", ""))
                link = entry.get("link", "")
                published = entry.get("published", "")
                source = entry.get("source", {}).get("title", "Google News")

                score, cues = self.score_story(title, summary, base_score=2.0)
                stories.append(
                    AIStory(
                        title=title,
                        source=source,
                        url=link,
                        published=published,
                        summary=summary,
                        score=score,
                        virality_cues=cues,
                    )
                )
        except Exception as e:
            print(f"[Warning] Google News fetch failed: {e}", file=sys.stderr)
        return stories

    def fetch_hacker_news_ai(self, max_items: int = 15) -> List[AIStory]:
        stories = []
        seven_days_ago = int(time.time()) - (7 * 24 * 3600)
        url = (
            f"https://hn.algolia.com/api/v1/search?query=AI+OR+LLM+OR+model"
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
                            virality_cues=cues,
                        )
                    )
        except Exception as e:
            print(f"[Warning] Hacker News fetch failed: {e}", file=sys.stderr)
        return stories

    def fetch_huggingface_papers(self, max_items: int = 10) -> List[AIStory]:
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
                            virality_cues=cues,
                        )
                    )
        except Exception as e:
            print(f"[Warning] Hugging Face fetch failed: {e}", file=sys.stderr)
        return stories

    def get_top_stories(self, force_refresh: bool = False) -> List[AIStory]:
        if not force_refresh and self.cache_file.exists():
            try:
                cached = json.loads(self.cache_file.read_text(encoding="utf-8"))
                return [AIStory(**s) for s in cached]
            except Exception:
                pass

        all_stories: List[AIStory] = []
        all_stories.extend(self.fetch_google_news())
        all_stories.extend(self.fetch_hacker_news_ai())
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

        # Cache results
        self.cache_file.write_text(
            json.dumps([s.model_dump() for s in deduped], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        return deduped


def main():
    scraper = AINewsScraper()
    print("Fetching top AI news from this week...")
    stories = scraper.get_top_stories(force_refresh=True)
    print(f"\nSuccessfully gathered and ranked {len(stories)} AI stories:")
    for i, s in enumerate(stories[:5], 1):
        print(f"\n[{i}] (Score: {s.score}) {s.title}")
        print(f"    Source: {s.source} | Date: {s.published}")
        print(f"    Cues: {', '.join(s.virality_cues) if s.virality_cues else 'none'}")
        print(f"    Summary: {s.summary[:140]}...")


if __name__ == "__main__":
    main()
