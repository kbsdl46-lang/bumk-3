from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import re
import time
from typing import Any
from urllib.parse import urljoin

from app.db.session import get_connection


BASE_URL = "https://www.korea.kr/news/policyNewsList.do"
SOURCE_NAME = "Korea Policy Briefing"
REQUEST_TIMEOUT_SECONDS = 10
REQUEST_SLEEP_SECONDS = 0.2
MAX_LIST_PAGES = 20
MAX_OLD_ARTICLES_BEFORE_STOP = 5


@dataclass(frozen=True)
class ArticleData:
    title: str
    subtitle: str
    publisher: str
    published_at: str
    url: str
    summary: str
    content: str


def list_articles(target_date: str | None = None) -> list[dict[str, Any]]:
    query = """
        SELECT
          id,
          title,
          subtitle,
          publisher,
          published_at,
          url,
          summary,
          content,
          keyword,
          source,
          collected_for_date,
          collected_at,
          created_at
        FROM news_articles
        WHERE 1 = 1
    """
    params: list[Any] = []

    if target_date:
        query += " AND collected_for_date = ?"
        params.append(target_date)

    query += " ORDER BY published_at DESC, id DESC"

    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()

    return [dict(row) for row in rows]


def list_runs(limit: int = 10) -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
              id,
              target_date,
              status,
              started_at,
              finished_at,
              inserted_count,
              skipped_count,
              error_message
            FROM news_collection_runs
            ORDER BY started_at DESC, id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [dict(row) for row in rows]


def collect_policy_news(target_date: date) -> dict[str, Any]:
    target_date_text = target_date.isoformat()
    run_id = _start_run(target_date_text)
    inserted_count = 0
    skipped_count = 0

    try:
        urls = _collect_detail_urls(target_date)
        for url in urls:
            article = _parse_detail_page(url)
            if article is None or article.published_at != target_date_text:
                skipped_count += 1
                continue

            if _save_article(article, target_date_text):
                inserted_count += 1
            else:
                skipped_count += 1

        _finish_run(run_id, "success", inserted_count, skipped_count)
        return {
            "run_id": run_id,
            "target_date": target_date_text,
            "status": "success",
            "inserted_count": inserted_count,
            "skipped_count": skipped_count,
        }
    except Exception as exc:
        _finish_run(run_id, "failed", inserted_count, skipped_count, str(exc))
        raise


def _collect_detail_urls(target_date: date) -> list[str]:
    session = _create_session()
    urls: list[str] = []
    seen: set[str] = set()
    old_article_count = 0

    for page_index in range(1, MAX_LIST_PAGES + 1):
        response = session.get(
            BASE_URL,
            params={"pageIndex": page_index},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        page_urls = _extract_detail_urls(_make_soup(response.text))

        if not page_urls:
            break

        for url in page_urls:
            if url in seen:
                continue
            seen.add(url)

            article_date = _peek_article_date(session, url)
            if article_date is None:
                urls.append(url)
            elif article_date == target_date:
                urls.append(url)
                old_article_count = 0
            elif article_date < target_date:
                old_article_count += 1
                if old_article_count >= MAX_OLD_ARTICLES_BEFORE_STOP:
                    return urls

            time.sleep(REQUEST_SLEEP_SECONDS)

        time.sleep(REQUEST_SLEEP_SECONDS)

    return urls


def _extract_detail_urls(soup: Any) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()

    for anchor in soup.select("a[href*='policyNewsView.do']"):
        href = anchor.get("href")
        if not href:
            continue
        url = urljoin(BASE_URL, href)
        if url not in seen:
            seen.add(url)
            urls.append(url)

    return urls


def _peek_article_date(session: Any, url: str) -> date | None:
    try:
        response = session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        return _extract_published_date(_make_soup(response.text))
    except Exception:
        return None


def _parse_detail_page(url: str) -> ArticleData | None:
    session = _create_session()
    response = session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    soup = _make_soup(response.text)

    published_date = _extract_published_date(soup)
    title = _extract_title(soup)
    if published_date is None or not title:
        return None

    content = _extract_content(soup)
    subtitle = _extract_subtitle(soup, title)
    return ArticleData(
        title=title,
        subtitle=subtitle,
        publisher=_extract_publisher(soup),
        published_at=published_date.isoformat(),
        url=url,
        summary=_build_summary(subtitle, content),
        content=content,
    )


def _save_article(article: ArticleData, target_date: str) -> bool:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO news_articles (
              title,
              subtitle,
              publisher,
              published_at,
              url,
              summary,
              content,
              keyword,
              source,
              collected_for_date,
              collected_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (
                article.title,
                article.subtitle,
                article.publisher,
                article.published_at,
                article.url,
                article.summary,
                article.content,
                "policy",
                SOURCE_NAME,
                target_date,
            ),
        )
        connection.commit()

    return cursor.rowcount > 0


def _start_run(target_date: str) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO news_collection_runs (target_date, status) VALUES (?, 'running')",
            (target_date,),
        )
        connection.commit()

    return int(cursor.lastrowid)


def _finish_run(
    run_id: int,
    status: str,
    inserted_count: int,
    skipped_count: int,
    error_message: str | None = None,
) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE news_collection_runs
            SET status = ?,
                finished_at = CURRENT_TIMESTAMP,
                inserted_count = ?,
                skipped_count = ?,
                error_message = ?
            WHERE id = ?
            """,
            (status, inserted_count, skipped_count, error_message, run_id),
        )
        connection.commit()


def _create_session() -> Any:
    import requests

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0 Safari/537.36"
            )
        }
    )
    return session


def _make_soup(html: str) -> Any:
    from bs4 import BeautifulSoup

    return BeautifulSoup(html, "html.parser")


def _extract_title(soup: Any) -> str:
    selectors = [
        "meta[property='og:title']",
        "h1",
        ".view_title",
        ".article-head h1",
        ".news_view h1",
    ]
    for selector in selectors:
        node = soup.select_one(selector)
        if node is None:
            continue
        value = node.get("content") if node.name == "meta" else node.get_text(" ", strip=True)
        if value:
            return _clean_text(value)
    return ""


def _extract_subtitle(soup: Any, title: str) -> str:
    selectors = [
        "meta[property='og:description']",
        ".sub_title",
        ".view_subtitle",
        ".article-head .desc",
    ]
    for selector in selectors:
        node = soup.select_one(selector)
        if node is None:
            continue
        value = node.get("content") if node.name == "meta" else node.get_text(" ", strip=True)
        value = _clean_text(value or "")
        if value and value != title:
            return value
    return ""


def _extract_publisher(soup: Any) -> str:
    text = soup.get_text("\n", strip=True)
    for pattern in (
        r"(?:담당부처|부처)\s*[:：]\s*([^\n]+)",
        r"(?:제공|출처)\s*[:：]\s*([^\n]+)",
    ):
        match = re.search(pattern, text)
        if match:
            return _clean_text(match.group(1))
    return "대한민국 정책브리핑"


def _extract_published_date(soup: Any) -> date | None:
    text = soup.get_text("\n", strip=True)
    for pattern in (
        r"(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})",
        r"(20\d{2})(\d{2})(\d{2})",
    ):
        match = re.search(pattern, text)
        if match is None:
            continue
        year, month, day = (int(part) for part in match.groups())
        try:
            return date(year, month, day)
        except ValueError:
            continue
    return None


def _extract_content(soup: Any) -> str:
    for selector in (".view_cont", ".view-content", ".article-body", ".news_view", "#container"):
        node = soup.select_one(selector)
        if node is None:
            continue
        text = _clean_text(node.get_text("\n", strip=True))
        if len(text) >= 80:
            return text

    paragraphs = [_clean_text(node.get_text(" ", strip=True)) for node in soup.select("p")]
    return "\n".join(paragraph for paragraph in paragraphs if paragraph)


def _build_summary(subtitle: str, content: str) -> str:
    return (subtitle or content)[:300]


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()
