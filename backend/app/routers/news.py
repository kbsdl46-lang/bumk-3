from fastapi import APIRouter

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/articles")
def list_articles() -> dict[str, list[object]]:
    return {"items": []}
