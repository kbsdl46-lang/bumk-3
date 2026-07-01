from fastapi import APIRouter

router = APIRouter(prefix="/excel", tags=["excel"])


@router.get("/status")
def excel_status() -> dict[str, str]:
    return {"status": "ready"}
