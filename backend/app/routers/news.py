from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.services import news_service

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/articles")
def list_articles(date: str | None = Query(default=None)) -> dict[str, list[dict[str, object]]]:
    return {"items": news_service.list_articles(date)}


class CollectNewsPayload(BaseModel):
    date: str


@router.post("/collect")
def collect_news(payload: CollectNewsPayload) -> dict[str, object]:
    try:
        target_date = date.fromisoformat(payload.date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date must use YYYY-MM-DD format.",
        ) from exc

    try:
        return news_service.collect_policy_news(target_date)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"News collection failed: {exc}",
        ) from exc


@router.get("/runs")
def list_collection_runs(
    limit: int = Query(default=10, ge=1, le=50),
) -> dict[str, list[dict[str, object]]]:
    return {"items": news_service.list_runs(limit)}
