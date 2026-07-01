from fastapi import APIRouter

from app.services.health_service import get_health

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, object]:
    return get_health()
